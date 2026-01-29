"use client";

import { useCallback, useRef } from "react";

type PlayState = "idle" | "playing" | "paused";

type Props = {
  totalSegments: number;
  currentIndex: number;
  playState: PlayState;
  onSeek: (index: number) => void;
  disabled?: boolean;
};

export function SeekBar({
  totalSegments,
  currentIndex,
  playState,
  onSeek,
  disabled,
}: Props) {
  const barRef = useRef<HTMLDivElement>(null);

  const isActive = playState === "playing" || playState === "paused";
  const playedPercent =
    totalSegments > 0 ? (currentIndex / totalSegments) * 100 : 0;
  const segmentWidthPercent = totalSegments > 0 ? 100 / totalSegments : 0;
  const currentSegmentLeftPercent = totalSegments > 0
    ? (currentIndex / totalSegments) * 100
    : 0;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || totalSegments === 0) return;
      const el = barRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      const index = Math.floor(pct * totalSegments);
      const clamped = Math.min(index, totalSegments - 1);
      onSeek(Math.max(0, clamped));
    },
    [disabled, totalSegments, onSeek]
  );

  if (totalSegments === 0) return null;

  return (
    <div className="w-full">
      <div className="relative">
        <div
          ref={barRef}
          role="slider"
          aria-label="เลือกช่วงที่จะเริ่มอ่าน"
          aria-valuemin={0}
          aria-valuemax={totalSegments - 1}
          aria-valuenow={currentIndex}
          tabIndex={disabled ? undefined : 0}
          onClick={handleClick}
          className={`
            relative h-3 rounded-full bg-[var(--border)] cursor-pointer overflow-hidden
            transition-colors
            ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[var(--surface)]"}
          `}
        >
          {/* ส่วนที่อ่านไปแล้ว (สีฟ้า) */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[var(--accent)] transition-all duration-150 z-[1]"
            style={{ width: `${playedPercent}%` }}
          />
          {/* สีเหลืองเฉพาะช่วงที่กำลังอ่านอยู่ */}
          {isActive && (
            <div
              className="absolute top-0 bottom-0 rounded-full bg-amber-400 transition-all duration-150 z-[2]"
              style={{
                left: `${currentSegmentLeftPercent}%`,
                width: `${segmentWidthPercent}%`,
              }}
              aria-hidden
            />
          )}
        </div>
      </div>
      <div className="flex justify-between mt-1 text-xs text-[var(--muted)]">
        <span>ช่วงที่ {currentIndex + 1}</span>
        <span>จาก {totalSegments} ช่วง</span>
      </div>
    </div>
  );
}
