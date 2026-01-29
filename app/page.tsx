"use client";

import { useCallback, useEffect, useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { PlayerControls } from "@/components/PlayerControls";
import { SeekBar } from "@/components/SeekBar";
import { TextSegments } from "@/components/TextSegments";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { extractText } from "@/lib/extractText";

export default function Home() {
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  /** ใช้เป็น "selected" ช่วงที่จะแสดง (รวมตอนคลิกและตอนเล่น) */
  const [selectedIndex, setSelectedIndex] = useState(0);
  /** แสดงว่ามีการคลิกเลือกช่วงแล้ว (รวมกดเล่น) */
  const [hasSelected, setHasSelected] = useState(false);

  const {
    playState,
    utteranceIndex,
    totalUtterances,
    utteranceChunks,
    play,
    pause,
    resume,
    stop,
    restart,
    playFromIndex,
  } = useSpeechSynthesis(content);

  // sync selectedIndex กับ utteranceIndex เมื่อ speech เล่นไป
  useEffect(() => {
    if (playState === "playing" || playState === "paused") {
      setSelectedIndex(utteranceIndex);
      setHasSelected(true);
    }
  }, [utteranceIndex, playState]);

  // เคลียร์เมื่อเปลี่ยนไฟล์
  useEffect(() => {
    setSelectedIndex(0);
    setHasSelected(false);
  }, [content]);

  const onFileSelect = useCallback(async (file: File) => {
    setError("");
    setLoading(true);
    try {
      const text = await extractText(file);
      setContent(text);
      setFileName(file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาดในการอ่านไฟล์");
      setContent("");
      setFileName("");
    } finally {
      setLoading(false);
    }
  }, []);

  const onUploadError = useCallback((message: string) => {
    setError(message);
  }, []);

  const handleSeek = useCallback(
    (index: number) => {
      setSelectedIndex(index);
      setHasSelected(true);
      playFromIndex(index);
    },
    [playFromIndex]
  );

  const handlePlay = useCallback(() => {
    setHasSelected(true);
    play();
  }, [play]);

  const handleStop = useCallback(() => {
    setHasSelected(false);
    setSelectedIndex(0);
    stop();
  }, [stop]);

  const handleRestart = useCallback(() => {
    setSelectedIndex(0);
    setHasSelected(true);
    restart();
  }, [restart]);

  // แสดงสีเหลืองเมื่อมีการเลือก (คลิกหรือกดเล่น)
  const showHighlight = hasSelected;

  // สำหรับ PlayerControls: ถ้า hasSelected แต่ playState ยังเป็น idle ให้ถือว่า "playing"
  // เพื่อให้ปุ่มแสดงเป็น "หยุดชั่วคราว" ทันทีเมื่อคลิก seek
  const effectivePlayState =
    hasSelected && playState === "idle" ? "playing" : playState;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl space-y-8">
        <header className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text)]">
            Speech Dog
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            อัปโหลดเอกสาร แล้วให้ AI อ่านออกเสียง รองรับภาษาไทย by Konghdld
          </p>
        </header>

        <FileUpload
          onFileSelect={onFileSelect}
          onError={onUploadError}
          disabled={loading}
        />

        {loading && (
          <div className="text-center text-[var(--muted)]">
            กำลังอ่านเอกสาร…
          </div>
        )}

        {error && (
          <div
            className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        {content && !loading && (
          <section className="space-y-4">
            {fileName && (
              <p className="text-sm text-[var(--muted)]">
                ไฟล์: <span className="text-[var(--text)]">{fileName}</span>
              </p>
            )}
            <TextSegments
              segments={utteranceChunks}
              currentIndex={selectedIndex}
              showHighlight={showHighlight}
              onSegmentClick={handleSeek}
            />
            <SeekBar
              totalSegments={utteranceChunks.length}
              currentIndex={selectedIndex}
              showHighlight={showHighlight}
              onSeek={handleSeek}
              disabled={!content.trim()}
            />
            <PlayerControls
              playState={effectivePlayState}
              utteranceIndex={selectedIndex}
              totalUtterances={utteranceChunks.length}
              onPlay={handlePlay}
              onPause={pause}
              onResume={resume}
              onStop={handleStop}
              onRestart={handleRestart}
              disabled={!content.trim()}
            />
          </section>
        )}
      </div>
    </main>
  );
}
