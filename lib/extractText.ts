"use client";

export type SupportedType = "pdf" | "docx" | "doc" | "txt";

const PDF_TYPE = "application/pdf";
const DOCX_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const DOC_TYPE = "application/msword";
const TEXT_TYPE = "text/plain";

export function getFileType(file: File): SupportedType | null {
  const name = file.name.toLowerCase();
  if (file.type === PDF_TYPE || name.endsWith(".pdf")) return "pdf";
  if (file.type === DOCX_TYPE || name.endsWith(".docx")) return "docx";
  if (file.type === DOC_TYPE || name.endsWith(".doc")) return "doc";
  if (file.type === TEXT_TYPE || name.endsWith(".txt")) return "txt";
  return null;
}

export async function extractFromText(file: File): Promise<string> {
  return file.text();
}

export async function extractFromDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

export async function extractFromPdf(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  const version = (pdfjsLib as { version?: string }).version ?? "4.7.76";
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = doc.numPages;
  const parts: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: unknown) => (item && typeof item === "object" && "str" in item ? (item as { str: string }).str : ""))
      .join(" ");
    parts.push(text);
  }

  return parts.join("\n\n");
}

export async function extractText(file: File): Promise<string> {
  const type = getFileType(file);
  if (!type) throw new Error("ประเภทไฟล์ไม่รองรับ ใช้ได้เฉพาะ PDF, DOC, DOCX หรือ TXT");

  switch (type) {
    case "txt":
      return extractFromText(file);
    case "doc":
    case "docx":
      return extractFromDocx(file);
    case "pdf":
      return extractFromPdf(file);
    default:
      throw new Error("ประเภทไฟล์ไม่รองรับ");
  }
}
