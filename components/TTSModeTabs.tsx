"use client";

type TTSMode = "browser" | "gemini";

type Props = {
  activeMode: TTSMode;
  onModeChange: (mode: TTSMode) => void;
  disabled?: boolean;
};

export function TTSModeTabs({ activeMode, onModeChange, disabled }: Props) {
  return (
    <div className="flex rounded-xl bg-[var(--surface)] border border-[var(--border)] p-1">
      <button
        type="button"
        onClick={() => onModeChange("browser")}
        disabled={disabled}
        className={`
          flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all
          ${
            activeMode === "browser"
              ? "bg-cyan-500 text-[var(--bg)]"
              : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--border)]/50"
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        🔊 Browser TTS
      </button>
      <button
        type="button"
        onClick={() => onModeChange("gemini")}
        disabled={disabled}
        className={`
          flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all
          ${
            activeMode === "gemini"
              ? "bg-purple-500 text-white"
              : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--border)]/50"
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        ✨ Gemini AI
      </button>
    </div>
  );
}

export type { TTSMode };
