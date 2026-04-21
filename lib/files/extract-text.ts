const PDF_MIME_TYPES = new Set(["application/pdf"]);

const TEXT_MIME_TYPES = new Set([
  "application/json",
  "application/xml",
  "text/csv",
  "text/markdown",
  "text/plain",
  "text/xml",
]);

const TEXT_EXTENSIONS = new Set([
  ".csv",
  ".json",
  ".md",
  ".markdown",
  ".txt",
  ".xml",
]);

export const MAX_EXTRACTED_TEXT_CHARS = 40_000;

function getLowercaseExtension(filename: string) {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : "";
}

function normalizeExtractedText(text: string) {
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (normalized.length <= MAX_EXTRACTED_TEXT_CHARS) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_EXTRACTED_TEXT_CHARS).trim()}\n\n[File text truncated]`;
}

export function isTextExtractionSupported(mimeType: string, filename: string) {
  const normalizedMimeType = mimeType.toLowerCase();
  const extension = getLowercaseExtension(filename);

  return (
    PDF_MIME_TYPES.has(normalizedMimeType) ||
    normalizedMimeType.startsWith("text/") ||
    TEXT_MIME_TYPES.has(normalizedMimeType) ||
    TEXT_EXTENSIONS.has(extension)
  );
}

export async function extractTextFromFileBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string
) {
  const normalizedMimeType = mimeType.toLowerCase();
  const extension = getLowercaseExtension(filename);

  if (PDF_MIME_TYPES.has(normalizedMimeType) || extension === ".pdf") {
    const pdfParseModule = await import("pdf-parse");
    const pdfParse = pdfParseModule.default;
    const result = await pdfParse(buffer);
    return normalizeExtractedText(result.text);
  }

  if (
    normalizedMimeType.startsWith("text/") ||
    TEXT_MIME_TYPES.has(normalizedMimeType) ||
    TEXT_EXTENSIONS.has(extension)
  ) {
    return normalizeExtractedText(buffer.toString("utf8"));
  }

  return null;
}
