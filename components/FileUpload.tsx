"use client";

import { useCallback, useState } from "react";
import { getFileType } from "@/lib/extractText";

type Props = {
  onFileSelect: (file: File) => void;
  onError: (message: string) => void;
  disabled?: boolean;
};

const ACCEPT = ".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

export function FileUpload({ onFileSelect, onError, disabled }: Props) {
  const [drag, setDrag] = useState(false);

  const validate = useCallback((file: File): boolean => {
    const type = getFileType(file);
    if (!type) {
      onError("รองรับเฉพาะไฟล์ PDF, DOC, DOCX และ TXT");
      return false;
    }
    const maxMb = 15;
    if (file.size > maxMb * 1024 * 1024) {
      onError(`ขนาดไฟล์ไม่เกิน ${maxMb} MB`);
      return false;
    }
    return true;
  }, [onError]);

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file) return;
      if (validate(file)) onFileSelect(file);
    },
    [onFileSelect, validate]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      const file = e.dataTransfer.files[0];
      handleFile(file ?? null);
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
  }, []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      handleFile(file ?? null);
      e.target.value = "";
    },
    [handleFile]
  );

  return (
    <label
      className={`
        block rounded-2xl border-2 border-dashed transition-all cursor-pointer
        ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}
        ${drag ? "border-cyan-400 bg-cyan-400/10" : "border-[var(--border)] hover:border-cyan-500/50 hover:bg-[var(--surface)]"}
      `}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <input
        type="file"
        accept={ACCEPT}
        onChange={onInputChange}
        className="sr-only"
        disabled={disabled}
      />
      <div className="p-10 text-center">
        <span className="text-5xl" aria-hidden>📄</span>
        <p className="mt-3 text-[var(--text)] font-medium">
          ลากไฟล์มาวาง หรือคลิกเพื่อเลือกไฟล์
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          PDF, DOC, DOCX หรือ TXT (ไม่เกิน 15 MB)
        </p>
      </div>
    </label>
  );
}
