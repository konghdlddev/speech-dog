"use client";

import { useCallback, useEffect, useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { GeminiTTS } from "@/components/GeminiTTS";
import { PlayerControls } from "@/components/PlayerControls";
import { SeekBar } from "@/components/SeekBar";
import { TextSegments } from "@/components/TextSegments";
import { TTSModeTabs, type TTSMode } from "@/components/TTSModeTabs";
import { VoiceSelector } from "@/components/VoiceSelector";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { extractText } from "@/lib/extractText";

export default function Home() {
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // TTS mode
  const [ttsMode, setTtsMode] = useState<TTSMode>("browser");

  // Browser TTS state
  const [browserSelectedIndex, setBrowserSelectedIndex] = useState(0);
  const [browserHasSelected, setBrowserHasSelected] = useState(false);

  // Gemini TTS state
  const [geminiSelectedIndex, setGeminiSelectedIndex] = useState(0);
  const [geminiHasSelected, setGeminiHasSelected] = useState(false);
  const [geminiPlaying, setGeminiPlaying] = useState(false);

  const {
    playState,
    utteranceIndex,
    utteranceChunks,
    voices,
    selectedVoiceId,
    setSelectedVoiceId,
    rate,
    setRate,
    play,
    pause,
    resume,
    stop,
    restart,
    playFromIndex,
  } = useSpeechSynthesis(content);

  // sync browserSelectedIndex กับ utteranceIndex เมื่อ speech เล่นไป
  useEffect(() => {
    if (playState === "playing" || playState === "paused") {
      setBrowserSelectedIndex(utteranceIndex);
      setBrowserHasSelected(true);
    }
  }, [utteranceIndex, playState]);

  // เคลียร์เมื่อเปลี่ยนไฟล์
  useEffect(() => {
    setBrowserSelectedIndex(0);
    setBrowserHasSelected(false);
    setGeminiSelectedIndex(0);
    setGeminiHasSelected(false);
  }, [content]);

  // หยุด TTS อีกโหมดเมื่อสลับ mode
  const handleModeChange = useCallback(
    (mode: TTSMode) => {
      if (mode !== ttsMode) {
        // หยุดโหมดปัจจุบัน
        if (ttsMode === "browser") {
          stop();
          setBrowserHasSelected(false);
        }
        setTtsMode(mode);
      }
    },
    [ttsMode, stop],
  );

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

  // Browser TTS handlers
  const handleBrowserSeek = useCallback(
    (index: number) => {
      setBrowserSelectedIndex(index);
      setBrowserHasSelected(true);
      playFromIndex(index);
    },
    [playFromIndex],
  );

  const handleBrowserPlay = useCallback(() => {
    setBrowserHasSelected(true);
    play();
  }, [play]);

  const handleBrowserStop = useCallback(() => {
    setBrowserHasSelected(false);
    setBrowserSelectedIndex(0);
    stop();
  }, [stop]);

  const handleBrowserRestart = useCallback(() => {
    setBrowserSelectedIndex(0);
    setBrowserHasSelected(true);
    restart();
  }, [restart]);

  // Gemini TTS handlers
  const handleGeminiSeek = useCallback((index: number) => {
    setGeminiSelectedIndex(index);
    setGeminiHasSelected(true);
  }, []);

  // Current mode values
  const selectedIndex =
    ttsMode === "browser" ? browserSelectedIndex : geminiSelectedIndex;
  const showHighlight =
    ttsMode === "browser" ? browserHasSelected : geminiHasSelected;

  const effectivePlayState =
    browserHasSelected && playState === "idle" ? "playing" : playState;

  const isPlaying =
    ttsMode === "browser" ? playState === "playing" : geminiPlaying;

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

            {/* Seek Bar */}
            <SeekBar
              totalSegments={utteranceChunks.length}
              currentIndex={selectedIndex}
              showHighlight={showHighlight}
              onSeek={
                ttsMode === "browser" ? handleBrowserSeek : handleGeminiSeek
              }
              disabled={!content.trim()}
            />

            {/* TTS Mode Tabs */}
            <TTSModeTabs
              activeMode={ttsMode}
              onModeChange={handleModeChange}
              disabled={isPlaying}
            />

            {/* Browser TTS Controls */}
            {ttsMode === "browser" && (
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-cyan-400 font-medium text-sm">
                    🔊 Browser TTS
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    (ใช้เสียงจาก Browser/OS)
                  </span>
                </div>
                <VoiceSelector
                  voices={voices}
                  selectedVoiceId={selectedVoiceId}
                  onVoiceChange={setSelectedVoiceId}
                  rate={rate}
                  onRateChange={setRate}
                  disabled={playState === "playing"}
                />
                <PlayerControls
                  playState={effectivePlayState}
                  utteranceIndex={browserSelectedIndex}
                  totalUtterances={utteranceChunks.length}
                  onPlay={handleBrowserPlay}
                  onPause={pause}
                  onResume={resume}
                  onStop={handleBrowserStop}
                  onRestart={handleBrowserRestart}
                  disabled={!content.trim()}
                />
              </div>
            )}

            {/* Gemini TTS Controls */}
            {ttsMode === "gemini" && (
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-purple-400 font-medium text-sm">
                    ✨ Gemini AI TTS
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    (เสียง AI คุณภาพสูง)
                  </span>
                </div>
                <GeminiTTS
                  segments={utteranceChunks}
                  currentIndex={geminiSelectedIndex}
                  onIndexChange={setGeminiSelectedIndex}
                  onPlayStateChange={(playing) => {
                    setGeminiPlaying(playing);
                    if (playing) {
                      setGeminiHasSelected(true);
                    }
                  }}
                  onHighlightChange={setGeminiHasSelected}
                />
              </div>
            )}

            {/* Text Segments */}
            <TextSegments
              segments={utteranceChunks}
              currentIndex={selectedIndex}
              showHighlight={showHighlight}
              onSegmentClick={
                ttsMode === "browser" ? handleBrowserSeek : handleGeminiSeek
              }
            />
          </section>
        )}
      </div>
    </main>
  );
}
