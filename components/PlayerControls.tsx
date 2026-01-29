"use client";

import type { PlayState } from "@/hooks/useSpeechSynthesis";

type Props = {
  playState: PlayState;
  utteranceIndex: number;
  totalUtterances: number;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRestart: () => void;
  disabled?: boolean;
};

export function PlayerControls({
  playState,
  utteranceIndex,
  totalUtterances,
  onPlay,
  onPause,
  onResume,
  onStop,
  onRestart,
  disabled,
}: Props) {
  const isPlaying = playState === "playing";
  const isPaused = playState === "paused";
  const hasStarted = isPlaying || isPaused;

  return (
    <div className="flex flex-col gap-4">
      {totalUtterances > 0 && (
        <p className="text-sm text-[var(--muted)] text-center">
          ประโยคที่ {utteranceIndex + 1} จาก {totalUtterances}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {!hasStarted ? (
          <button
            type="button"
            onClick={onPlay}
            disabled={disabled}
            className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--bg)] font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ▶ เล่น
          </button>
        ) : (
          <>
            {isPlaying ? (
              <button
                type="button"
                onClick={onPause}
                className="px-5 py-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 font-medium hover:bg-amber-500/30 transition-colors"
              >
                ⏸ หยุดชั่วคราว
              </button>
            ) : (
              <button
                type="button"
                onClick={onResume}
                className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--bg)] font-medium hover:bg-[var(--accent-hover)] transition-colors"
              >
                ▶ เล่นต่อ
              </button>
            )}
            <button
              type="button"
              onClick={onStop}
              className="px-5 py-2.5 rounded-xl bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] font-medium hover:bg-[var(--border)] hover:text-[var(--text)] transition-colors"
            >
              ⏹ หยุด
            </button>
            <button
              type="button"
              onClick={onRestart}
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
