"use client";

import { useLayoutEffect, useRef } from "react";

type Props = {
  segments: string[];
  currentIndex: number;
  playState: "idle" | "playing" | "paused";
  onSegmentClick: (index: number) => void;
};

export function TextSegments({
  segments,
  currentIndex,
  playState,
  onSegmentClick,
}: Props) {
  const activeRef = useRef<HTMLParagraphElement>(null);

  // เลื่อนให้ช่วงที่กำลังอ่านอยู่โผล่ใน view ทันที (รวมตอนคลิก seek)
  useLayoutEffect(() => {
    if (playState !== "playing" && playState !== "paused") return;
    requestAnimationFrame(() => {
      activeRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    });
  }, [currentIndex, playState]);

  if (!segments.length) return null;

  return (
    <div className="max-h-72 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
      {segments.map((chunk, i) => {
        const isPlayingOrPaused = playState === "playing" || playState === "paused";
        const isActive = isPlayingOrPaused && i === currentIndex;
        const isPast = isPlayingOrPaused && i < currentIndex;
        return (
          <div key={i} className="flex gap-2 items-start">
            {/* แถบเหลืองเฉพาะช่วงที่กำลังอ่านอยู่ ช่วงอื่นเป็นสีเทา */}
            <span
              onClick={() => onSegmentClick(i)}
              className={`
                shrink-0 w-7 h-7 rounded flex items-center justify-center text-xs font-semibold
                cursor-pointer transition-colors select-none
                ${isActive ? "bg-amber-400 text-amber-950 ring-2 ring-cyan-400 ring-offset-2 ring-offset-[var(--surface)]" : "bg-[var(--border)] text-[var(--muted)]"}
                hover:opacity-90
                ${isPast ? "opacity-70" : ""}
              `}
              title={`ช่วงที่ ${i + 1} - คลิกเพื่อเริ่มอ่านจากตรงนี้`}
            >
              {i + 1}
            </span>
            <p
              ref={isActive ? activeRef : undefined}
              onClick={() => onSegmentClick(i)}
              className={`
                flex-1 min-w-0 text-left whitespace-pre-wrap leading-relaxed cursor-pointer rounded-lg px-2 py-1 -mx-2 transition-colors
                ${isActive ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/40" : ""}
                ${isPast ? "text-[var(--muted)]" : "text-[var(--text)]"}
                ${!isActive ? "hover:bg-[var(--border)]/50" : ""}
              `}
            >
              {chunk}
            </p>
          </div>
        );
      })}
    </div>
  );
}
