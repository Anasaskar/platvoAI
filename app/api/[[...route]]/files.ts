import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/hono/hono-middlware";
import { uploadFile } from "@/lib/storage/imagekit";
import {
  extractTextFromFileBuffer,
  isTextExtractionSupported,
} from "@/lib/files/extract-text";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const MIME_TYPES_BY_EXTENSION: Record<string, string> = {
  ".csv": "text/csv",
  ".json": "application/json",
  ".md": "text/markdown",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
};

function getLowercaseExtension(filename: string) {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : "";
}

function getMimeType(file: File) {
  return (
    file.type ||
    MIME_TYPES_BY_EXTENSION[getLowercaseExtension(file.name)] ||
    "application/octet-stream"
  );
}

export const filesRoute = new Hono().post(
  "/upload",
  getAuthUser,
  async (c) => {
    const user = c.get("user");
    const body = await c.req.parseBody();
    const file = body.file;

    if (!(file instanceof File)) {
      throw new HTTPException(400, {
        message: "No file was uploaded.",
      });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      throw new HTTPException(413, {
        message: "Files must be 10 MB or smaller.",
      });
    }

    const mimeType = getMimeType(file);
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadedFile = await uploadFile(buffer, file.name, mimeType);

    const supportsTextExtraction = isTextExtractionSupported(
      mimeType,
      file.name
    );
    let extractedText: string | null = null;
    let status: "processed" | "failed" = "processed";

    if (supportsTextExtraction) {
      try {
        extractedText = await extractTextFromFileBuffer(
          buffer,
          file.name,
          mimeType
        );
      } catch (error) {
        console.error("File text extraction failed:", error);
        status = "failed";
      }
    }

    const savedFile = await prisma.file.create({
      data: {
        userId: user.id,
        filename: file.name,
        mimeType,
        size: file.size,
        imagekitFileId: uploadedFile.fileId,
        imagekitUrl: uploadedFile.url,
        extractedText,
        status,
        processedAt: new Date(),
      },
    });

    return c.json({
      success: true,
      data: {
        id: savedFile.id,
        filename: savedFile.filename,
        mimeType: savedFile.mimeType,
        size: savedFile.size,
        url: savedFile.imagekitUrl,
        status: savedFile.status,
        hasExtractedText: Boolean(savedFile.extractedText),
      },
    });
  }
);
