import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "thai"],
  variable: "--font-sarabun",
});

export const metadata: Metadata = {
  title: "Speech Dog — อ่านเอกสารออกเสียง",
  description: "อัปโหลดเอกสาร PDF, Word หรือข้อความ แล้วให้ AI อ่านออกเสียง รองรับภาษาไทย",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${sarabun.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
