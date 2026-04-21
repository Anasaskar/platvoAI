import type { UIMessage } from "ai";
import prisma from "@/lib/prisma";

const MAX_FILE_CONTEXT_CHARS_PER_REQUEST = 60_000;

type FileMessagePart = {
  type: "file";
  fileId?: string;
  filename?: string;
  mediaType?: string;
  url?: string;
};

function isFilePart(part: unknown): part is FileMessagePart {
  return (
    typeof part === "object" &&
    part !== null &&
    "type" in part &&
    (part as { type?: unknown }).type === "file"
  );
}

function createFileContextText({
  filename,
  mimeType,
  text,
}: {
  filename: string;
  mimeType: string;
  text: string;
}) {
  return `Attached file: ${filename}\nMIME type: ${mimeType}\n\n${text}`;
}

export async function addFileContextToMessages(
  messages: UIMessage[],
  userId: string
): Promise<UIMessage[]> {
  const fileIds = Array.from(
    new Set(
      messages.flatMap((message) =>
        (message.parts ?? [])
          .map((part) => (isFilePart(part) ? part.fileId : undefined))
          .filter((fileId): fileId is string => Boolean(fileId))
      )
    )
  );

  if (fileIds.length === 0) {
    return stripInlineFileData(messages);
  }

  const files = await prisma.file.findMany({
    where: {
      id: { in: fileIds },
      userId,
    },
    select: {
      id: true,
      filename: true,
      mimeType: true,
      extractedText: true,
    },
  });

  const fileMap = new Map(files.map((file) => [file.id, file]));
  let remainingContextChars = MAX_FILE_CONTEXT_CHARS_PER_REQUEST;

  return messages.map((message) => {
    const parts = (message.parts ?? []).flatMap((part) => {
      if (!isFilePart(part)) {
        return [part];
      }

      const isInlineDataUrl = part.url?.startsWith("data:");
      const isImage = part.mediaType?.startsWith("image/");

      if (isImage && part.url && !isInlineDataUrl) {
        return [part];
      }

      const file = part.fileId ? fileMap.get(part.fileId) : null;
      const filename = file?.filename ?? part.filename ?? "attachment";
      const mimeType = file?.mimeType ?? part.mediaType ?? "unknown";

      if (!file?.extractedText || remainingContextChars <= 0) {
        return [
          {
            type: "text" as const,
            text: `Attached file: ${filename}\nMIME type: ${mimeType}\n\nNo extractable text is available for this file.`,
          },
        ];
      }

      const text = file.extractedText.slice(0, remainingContextChars);
      remainingContextChars -= text.length;

      return [
        {
          type: "text" as const,
          text: createFileContextText({
            filename,
            mimeType,
            text:
              text.length < file.extractedText.length
                ? `${text}\n\n[Additional attached file text omitted]`
                : text,
          }),
        },
      ];
    }) as UIMessage["parts"];

    return {
      ...message,
      parts,
    };
  });
}

function stripInlineFileData(messages: UIMessage[]) {
  return messages.map((message) => {
    const parts = (message.parts ?? []).map((part) => {
      if (!isFilePart(part) || !part.url?.startsWith("data:")) {
        return part;
      }

      return {
        type: "text" as const,
        text: `Attached file: ${part.filename ?? "attachment"}\nMIME type: ${
          part.mediaType ?? "unknown"
        }\n\nThis older attachment was stored inline and cannot be sent to the model.`,
      };
    }) as UIMessage["parts"];

    return {
      ...message,
      parts,
    };
  });
}
