# Speech Dog

เว็บแอปสำหรับอัปโหลดเอกสาร (PDF, DOC, DOCX, TXT) แล้วให้ระบบอ่านออกเสียง รองรับภาษาไทย

## คุณสมบัติ

- อัปโหลดไฟล์ **PDF**, **DOC**, **DOCX** หรือ **TXT**
- ดึงข้อความจากไฟล์แล้วอ่านออกเสียงด้วย Web Speech API (รองรับภาษาไทย)
- ปุ่มควบคุม: **เล่น** / **หยุดชั่วคราว** / **หยุด** / **เริ่มใหม่**

## Deploy บน Vercel

1. Push โปรเจกต์ไปที่ GitHub
2. ไปที่ [vercel.com](https://vercel.com) → New Project → Import จาก repo
3. Framework Preset เลือก **Next.js** แล้ว Deploy

หรือใช้ Vercel CLI:

```bash
npm i -g vercel
vercel
```

## รัน locally

```bash
npm install
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

## หมายเหตุ

- เสียงอ่านออกเสียงขึ้นกับระบบปฏิบัติการและเบราว์เซอร์ (ภาษาไทยต้องมี Thai voice ที่เครื่อง)
- ขนาดไฟล์แนะนำไม่เกิน 15 MB
