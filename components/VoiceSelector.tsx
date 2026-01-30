"use client";

import type { VoiceOption } from "@/hooks/useSpeechSynthesis";

type Props = {
  voices: VoiceOption[];
  selectedVoiceId: string | null;
  onVoiceChange: (voiceId: string) => void;
  rate: number;
  onRateChange: (rate: number) => void;
  disabled?: boolean;
};

export function VoiceSelector({
  voices,
  selectedVoiceId,
  onVoiceChange,
  rate,
  onRateChange,
  disabled,
}: Props) {
  // จัดกลุ่มเสียงตามภาษา
  const thaiVoices = voices.filter(
    (v) => v.lang === "th-TH" || v.lang.startsWith("th")
  );
  const englishVoices = voices.filter(
    (v) => v.lang.startsWith("en")
  );
  const otherVoices = voices.filter(
    (v) =>
      !v.lang.startsWith("th") &&
      !v.lang.startsWith("en")
  );

  const formatVoiceName = (voice: VoiceOption) => {
    const shortLang = voice.lang.split("-")[0].toUpperCase();
    // ตัดชื่อที่ยาวเกินไป
    const name = voice.name.length > 30 ? voice.name.slice(0, 27) + "..." : voice.name;
    return `${name} (${shortLang})`;
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* เลือกเสียง */}
      <div className="flex-1">
        <label
          htmlFor="voice-select"
          className="block text-xs text-[var(--muted)] mb-1"
        >
          เสียง
        </label>
        <select
          id="voice-select"
          value={selectedVoiceId ?? ""}
          onChange={(e) => onVoiceChange(e.target.value)}
          disabled={disabled || voices.length === 0}
          className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50"
        >
          {voices.length === 0 && (
            <option value="">กำลังโหลดเสียง...</option>
          )}
          {thaiVoices.length > 0 && (
            <optgroup label="🇹🇭 ภาษาไทย">
              {thaiVoices.map((v) => (
                <option key={v.id} value={v.id}>
                  {formatVoiceName(v)}
                </option>
              ))}
            </optgroup>
          )}
          {englishVoices.length > 0 && (
            <optgroup label="🇬🇧 English">
              {englishVoices.map((v) => (
                <option key={v.id} value={v.id}>
                  {formatVoiceName(v)}
                </option>
              ))}
            </optgroup>
          )}
          {otherVoices.length > 0 && (
            <optgroup label="🌐 อื่นๆ">
              {otherVoices.map((v) => (
                <option key={v.id} value={v.id}>
                  {formatVoiceName(v)}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* ความเร็ว */}
      <div className="w-full sm:w-32">
        <label
          htmlFor="rate-slider"
          className="block text-xs text-[var(--muted)] mb-1"
        >
          ความเร็ว: {rate.toFixed(2)}x
        </label>
        <input
          id="rate-slider"
          type="range"
          min="0.5"
          max="2"
          step="0.05"
          value={rate}
          onChange={(e) => onRateChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-[var(--border)] rounded-full appearance-none cursor-pointer accent-cyan-500 disabled:opacity-50"
        />
      </div>
    </div>
  );
}
