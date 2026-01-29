"use client";

import { useCallback, useState } from "react";
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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl space-y-8">
        <header className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text)]">
            Speech Dog
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            อัปโหลดเอกสาร แล้วให้ AI อ่านออกเสียง รองรับภาษาไทย
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
              currentIndex={utteranceIndex}
              playState={playState}
              onSegmentClick={playFromIndex}
            />
            <SeekBar
              totalSegments={utteranceChunks.length}
              currentIndex={utteranceIndex}
              playState={playState}
              onSeek={playFromIndex}
              disabled={!content.trim()}
            />
            <PlayerControls
              playState={playState}
              utteranceIndex={utteranceIndex}
              totalUtterances={totalUtterances}
              onPlay={play}
              onPause={pause}
              onResume={resume}
              onStop={stop}
              onRestart={restart}
              disabled={!content.trim()}
            />
          </section>
        )}
      </div>
    </main>
  );
}
