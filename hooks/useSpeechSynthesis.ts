"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";

const THAI_LANG = "th-TH";

export type PlayState = "idle" | "playing" | "paused";

export interface VoiceOption {
  id: string;
  name: string;
  lang: string;
  isDefault: boolean;
}

function splitIntoUtterances(t: string): string[] {
  const trimmed = t.trim();
  if (!trimmed) return [];
  const maxLen = 200;
  const sentences = trimmed.split(/(?<=[.!?\n。．])|\n+/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  for (const s of sentences) {
    if (current.length + s.length > maxLen && current) {
      chunks.push(current.trim());
      current = s;
    } else {
      current += (current ? " " : "") + s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length ? chunks : [trimmed];
}

export function useSpeechSynthesis(text: string) {
  const [playState, setPlayState] = useState<PlayState>("idle");
  const [utteranceIndex, setUtteranceIndex] = useState(0);
  const [totalUtterances, setTotalUtterances] = useState(0);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [rate, setRate] = useState(0.95);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]);
  const currentUtteranceRef = useRef<number>(0);

  const utteranceChunks = useMemo(() => splitIntoUtterances(text), [text]);

  const getChunks = useCallback(() => {
    const t = text.trim();
    return t ? utteranceChunks : [];
  }, [text, utteranceChunks]);

  // โหลดรายการเสียงที่ available
  const loadVoices = useCallback(() => {
    if (typeof window === "undefined") return;
    const rawVoices = window.speechSynthesis.getVoices();
    const voiceOptions: VoiceOption[] = rawVoices.map((v, i) => ({
      id: `${v.name}-${v.lang}-${i}`,
      name: v.name,
      lang: v.lang,
      isDefault: v.default,
    }));
    setVoices(voiceOptions);
    
    // เลือก Thai voice เป็น default ถ้ามี
    if (!selectedVoiceId && voiceOptions.length > 0) {
      const thaiVoice = voiceOptions.find(
        (v) => v.lang === THAI_LANG || v.lang.startsWith("th")
      );
      setSelectedVoiceId(thaiVoice?.id ?? voiceOptions[0]?.id ?? null);
    }
  }, [selectedVoiceId]);

  // หา SpeechSynthesisVoice จาก selectedVoiceId
  const getSelectedVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (typeof window === "undefined" || !selectedVoiceId) return null;
    const rawVoices = window.speechSynthesis.getVoices();
    const selected = voices.find((v) => v.id === selectedVoiceId);
    if (!selected) return rawVoices[0] ?? null;
    return rawVoices.find((v) => v.name === selected.name && v.lang === selected.lang) ?? rawVoices[0] ?? null;
  }, [selectedVoiceId, voices]);

  const speakNext = useCallback(() => {
    const synth = window.speechSynthesis;
    const list = utterancesRef.current;
    const idx = currentUtteranceRef.current;

    if (idx >= list.length) {
      setPlayState("idle");
      setUtteranceIndex(0);
      setTotalUtterances(0);
      currentUtteranceRef.current = 0;
      return;
    }

    const utterance = list[idx];
    const voice = getSelectedVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = THAI_LANG;
    }
    utterance.rate = rate;
    utterance.pitch = 1;

    utterance.onend = () => {
      currentUtteranceRef.current = idx + 1;
      setUtteranceIndex(idx + 1);
      speakNext();
    };

    utterance.onerror = () => {
      setPlayState("idle");
      setUtteranceIndex(0);
      currentUtteranceRef.current = 0;
    };

    synth.speak(utterance);
  }, [getSelectedVoice, rate]);

  const play = useCallback(() => {
    if (typeof window === "undefined") return;
    const chunks = getChunks();
    if (!chunks.length) return;

    window.speechSynthesis.cancel();
    utterancesRef.current = chunks.map(
      (c) => new SpeechSynthesisUtterance(c)
    );
    currentUtteranceRef.current = 0;
    setUtteranceIndex(0);
    setTotalUtterances(chunks.length);
    setPlayState("playing");
    synthRef.current = window.speechSynthesis;
    speakNext();
  }, [getChunks, speakNext]);

  const playFromIndex = useCallback(
    (index: number) => {
      if (typeof window === "undefined") return;
      const chunks = getChunks();
      if (!chunks.length || index < 0 || index >= chunks.length) return;

      window.speechSynthesis.cancel();
      utterancesRef.current = chunks.map(
        (c) => new SpeechSynthesisUtterance(c)
      );
      currentUtteranceRef.current = index;
      // บังคับอัปเดต UI ทันที เพื่อให้ tab / progress แสดงช่วงที่เลือกก่อนเริ่มเล่น
      flushSync(() => {
        setUtteranceIndex(index);
        setTotalUtterances(chunks.length);
        setPlayState("playing");
      });
      synthRef.current = window.speechSynthesis;
      speakNext();
    },
    [getChunks, speakNext]
  );

  const pause = useCallback(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.pause();
    setPlayState("paused");
  }, []);

  const resume = useCallback(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.resume();
    setPlayState("playing");
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    setPlayState("idle");
    setUtteranceIndex(0);
    currentUtteranceRef.current = 0;
  }, []);

  const restart = useCallback(() => {
    stop();
    setTimeout(play, 100);
  }, [stop, play]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [loadVoices]);

  return {
    playState,
    utteranceIndex,
    totalUtterances,
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
  };
}
