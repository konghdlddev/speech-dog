"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface GeminiVoice {
  id: string;
  name: string;
  description: string;
}

type Props = {
  segments: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onPlayStateChange: (playing: boolean) => void;
  onHighlightChange: (highlight: boolean) => void;
};

const GEMINI_VOICES: GeminiVoice[] = [
  { id: "Kore", name: "Kore", description: "Firm (หนักแน่น)" },
  { id: "Puck", name: "Puck", description: "Upbeat (สดใส)" },
  { id: "Zephyr", name: "Zephyr", description: "Bright (สว่าง)" },
  { id: "Charon", name: "Charon", description: "Informative (ให้ข้อมูล)" },
  { id: "Fenrir", name: "Fenrir", description: "Excitable (ตื่นเต้น)" },
  { id: "Leda", name: "Leda", description: "Youthful (เยาว์วัย)" },
  { id: "Aoede", name: "Aoede", description: "Breezy (โปร่งเบา)" },
  { id: "Enceladus", name: "Enceladus", description: "Breathy (เบาๆ)" },
  { id: "Achernar", name: "Achernar", description: "Soft (นุ่มนวล)" },
  { id: "Gacrux", name: "Gacrux", description: "Mature (ผู้ใหญ่)" },
  { id: "Achird", name: "Achird", description: "Friendly (เป็นมิตร)" },
  { id: "Vindemiatrix", name: "Vindemiatrix", description: "Gentle (อ่อนโยน)" },
  { id: "Sulafat", name: "Sulafat", description: "Warm (อบอุ่น)" },
];

// Cache สำหรับเก็บ audio ที่โหลดไว้แล้ว
interface AudioCache {
  [key: string]: string; // key = `${index}-${voiceId}`, value = blob URL
}

export function GeminiTTS({
  segments,
  currentIndex,
  onIndexChange,
  onPlayStateChange,
  onHighlightChange,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("Kore");
  const [preloadStatus, setPreloadStatus] = useState<string>("");
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<AudioCache>({});
  const shouldContinueRef = useRef(false);
  const currentPlayingIndexRef = useRef(currentIndex);
  const preloadingRef = useRef<Set<number>>(new Set());

  // Cleanup audio URL
  const cleanupAudioUrl = useCallback((url: string) => {
    URL.revokeObjectURL(url);
  }, []);

  // Cleanup current playing audio
  const cleanupCurrentAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
  }, []);

  // Cleanup all cache
  const cleanupAllCache = useCallback(() => {
    Object.values(audioCacheRef.current).forEach(cleanupAudioUrl);
    audioCacheRef.current = {};
    preloadingRef.current.clear();
  }, [cleanupAudioUrl]);

  useEffect(() => {
    return () => {
      cleanupCurrentAudio();
      cleanupAllCache();
    };
  }, [cleanupCurrentAudio, cleanupAllCache]);

  // Clear cache when voice changes
  useEffect(() => {
    cleanupAllCache();
  }, [selectedVoice, cleanupAllCache]);

  // Generate cache key
  const getCacheKey = useCallback(
    (index: number) => `${index}-${selectedVoice}`,
    [selectedVoice]
  );

  // Fetch audio for a segment and return blob URL
  const fetchAudio = useCallback(
    async (index: number): Promise<string | null> => {
      if (index < 0 || index >= segments.length) return null;

      const cacheKey = getCacheKey(index);

      // ถ้ามีใน cache แล้ว return เลย
      if (audioCacheRef.current[cacheKey]) {
        return audioCacheRef.current[cacheKey];
      }

      // ถ้ากำลัง preload อยู่ รอให้เสร็จ
      if (preloadingRef.current.has(index)) {
        // รอจนกว่าจะมีใน cache (polling)
        for (let i = 0; i < 100; i++) {
          await new Promise((r) => setTimeout(r, 100));
          if (audioCacheRef.current[cacheKey]) {
            return audioCacheRef.current[cacheKey];
          }
        }
        return null;
      }

      const text = segments[index];
      if (!text?.trim()) return null;

      preloadingRef.current.add(index);

      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: text.trim(),
            voiceId: selectedVoice,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "TTS request failed");
        }

        const data = await response.json();

        // Convert base64 to blob
        const binaryString = atob(data.audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Create WAV blob
        const wavHeader = createWavHeader(bytes.length, 24000, 1, 16);
        const wavBlob = new Blob([wavHeader, bytes], { type: "audio/wav" });
        const url = URL.createObjectURL(wavBlob);

        // เก็บใน cache
        audioCacheRef.current[cacheKey] = url;
        preloadingRef.current.delete(index);

        return url;
      } catch (err) {
        preloadingRef.current.delete(index);
        throw err;
      }
    },
    [segments, selectedVoice, getCacheKey]
  );

  // Preload next segments
  const preloadNext = useCallback(
    async (fromIndex: number, count: number = 2) => {
      const toPreload: number[] = [];
      for (let i = 1; i <= count; i++) {
        const nextIndex = fromIndex + i;
        if (nextIndex < segments.length) {
          const cacheKey = getCacheKey(nextIndex);
          if (
            !audioCacheRef.current[cacheKey] &&
            !preloadingRef.current.has(nextIndex)
          ) {
            toPreload.push(nextIndex);
          }
        }
      }

      if (toPreload.length > 0) {
        setPreloadStatus(`กำลังโหลดล่วงหน้า ${toPreload.length} ช่วง...`);
        
        // Preload ทั้งหมดพร้อมกัน (parallel)
        await Promise.all(
          toPreload.map((idx) =>
            fetchAudio(idx).catch((err) => {
              console.warn(`Preload failed for segment ${idx}:`, err);
              return null;
            })
          )
        );
        
        setPreloadStatus("");
      }
    },
    [segments.length, getCacheKey, fetchAudio]
  );

  // Play a segment by index
  const playSegment = useCallback(
    async (index: number) => {
      if (index < 0 || index >= segments.length) {
        setPlaying(false);
        setPaused(false);
        onPlayStateChange(false);
        shouldContinueRef.current = false;
        return;
      }

      currentPlayingIndexRef.current = index;
      onIndexChange(index);
      onHighlightChange(true);

      // เริ่ม preload ช่วงถัดไปทันที (ไม่ต้องรอ)
      preloadNext(index, 2);

      try {
        setLoading(true);
        setError("");
        cleanupCurrentAudio();

        const audioUrl = await fetchAudio(index);
        if (!audioUrl) {
          throw new Error("ไม่สามารถโหลดเสียงได้");
        }

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onplay = () => {
          setPlaying(true);
          setPaused(false);
          setLoading(false);
          onPlayStateChange(true);
        };

        audio.onpause = () => {
          if (!audio.ended) {
            setPaused(true);
          }
        };

        audio.onended = () => {
          // เล่นช่วงถัดไปถ้ายังมี
          if (shouldContinueRef.current && index < segments.length - 1) {
            playSegment(index + 1);
          } else {
            setPlaying(false);
            setPaused(false);
            onPlayStateChange(false);
            shouldContinueRef.current = false;
          }
        };

        audio.onerror = () => {
          setError("เล่นเสียงไม่สำเร็จ");
          setPlaying(false);
          setPaused(false);
          setLoading(false);
          onPlayStateChange(false);
          shouldContinueRef.current = false;
        };

        await audio.play();
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
        setPlaying(false);
        setLoading(false);
        onPlayStateChange(false);
        shouldContinueRef.current = false;
      }
    },
    [
      segments.length,
      fetchAudio,
      preloadNext,
      cleanupCurrentAudio,
      onIndexChange,
      onPlayStateChange,
      onHighlightChange,
    ]
  );

  const handlePlay = useCallback(() => {
    shouldContinueRef.current = true;
    onHighlightChange(true);
    playSegment(currentIndex);
  }, [currentIndex, playSegment, onHighlightChange]);

  const handlePause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPaused(true);
    }
  }, []);

  const handleResume = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setPaused(false);
    }
  }, []);

  const handleStop = useCallback(() => {
    shouldContinueRef.current = false;
    cleanupCurrentAudio();
    setPlaying(false);
    setPaused(false);
    setLoading(false);
    onPlayStateChange(false);
    onHighlightChange(false);
    onIndexChange(0);
  }, [cleanupCurrentAudio, onPlayStateChange, onHighlightChange, onIndexChange]);

  const handleRestart = useCallback(() => {
    handleStop();
    setTimeout(() => {
      shouldContinueRef.current = true;
      onHighlightChange(true);
      playSegment(0);
    }, 100);
  }, [handleStop, playSegment, onHighlightChange]);

  const hasStarted = playing || paused || loading;

  return (
    <div className="space-y-4">
      {/* Voice selector */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label
            htmlFor="gemini-voice"
            className="block text-xs text-[var(--muted)] mb-1"
          >
            เสียง Gemini AI
          </label>
          <select
            id="gemini-voice"
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            disabled={loading || playing}
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
          >
            {GEMINI_VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} - {v.description}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Progress info */}
      {segments.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-[var(--muted)]">
            ประโยคที่ {currentIndex + 1} จาก {segments.length}
          </p>
          {preloadStatus && (
            <p className="text-xs text-purple-400 mt-1">{preloadStatus}</p>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {!hasStarted ? (
          <button
            type="button"
            onClick={handlePlay}
            disabled={segments.length === 0}
            className="px-5 py-2.5 rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ▶ เล่น
          </button>
        ) : loading ? (
          <button
            type="button"
            disabled
            className="px-5 py-2.5 rounded-xl bg-purple-500/50 text-white font-medium cursor-not-allowed"
          >
            กำลังโหลด...
          </button>
        ) : (
          <>
            {playing && !paused ? (
              <button
                type="button"
                onClick={handlePause}
                className="px-5 py-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 font-medium hover:bg-amber-500/30 transition-colors"
              >
                ⏸ หยุดชั่วคราว
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResume}
                className="px-5 py-2.5 rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors"
              >
                ▶ เล่นต่อ
              </button>
            )}
            <button
              type="button"
              onClick={handleStop}
              className="px-5 py-2.5 rounded-xl bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] font-medium hover:bg-[var(--border)] hover:text-[var(--text)] transition-colors"
            >
              ⏹ หยุด
            </button>
            <button
              type="button"
              onClick={handleRestart}
              className="px-5 py-2.5 rounded-xl bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] font-medium hover:bg-[var(--border)] hover:text-[var(--text)] transition-colors"
            >
              🔄 เริ่มใหม่
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Helper function to create WAV header
function createWavHeader(
  dataLength: number,
  sampleRate: number,
  channels: number,
  bitsPerSample: number
): ArrayBuffer {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  return header;
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
