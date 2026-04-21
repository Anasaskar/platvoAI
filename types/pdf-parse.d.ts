declare module "pdf-parse" {
  export type PDFParseResult = {
    text: string;
    numpages?: number;
    numrender?: number;
    info?: unknown;
    metadata?: unknown;
    version?: string;
  };

  const pdfParse: (
    dataBuffer: Buffer,
    options?: Record<string, unknown>
  ) => Promise<PDFParseResult>;

  export default pdfParse;
}
