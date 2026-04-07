import { PDFParse } from "pdf-parse";

export async function extractTextFromPdfUrl(pdfUrl: string): Promise<string> {
  const response = await fetch(pdfUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/pdf,*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  return extractTextFromBytes(uint8);
}

export async function extractTextFromBuffer(buffer: Buffer): Promise<string> {
  const uint8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  return extractTextFromBytes(uint8);
}

async function extractTextFromBytes(data: Uint8Array): Promise<string> {
  const parser = new PDFParse(data);
  const result = await parser.getText();
  return result.text;
}
