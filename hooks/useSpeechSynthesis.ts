"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const THAI_LANG = "th-TH";

export type PlayState = "idle" | "playing" | "paused";

export function useSpeechSynthesis(text: string) {
  const [playState, setPlayState] = useState<PlayState>("idle");
  const [utteranceIndex, setUtteranceIndex] = useState(0);
  const [totalUtterances, setTotalUtterances] = useState(0);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]);
  const currentUtteranceRef = useRef<number>(0);

  const splitIntoUtterances = useCallback((t: string): string[] => {
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
  }, []);

  const getThaiVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (typeof window === "undefined") return null;
    const voices = window.speechSynthesis.getVoices();
    const thai = voices.find((v) => v.lang === THAI_LANG || v.lang.startsWith("th"));
    return thai ?? voices[0] ?? null;
  }, []);

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
    const voice = getThaiVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = THAI_LANG;
    utterance.rate = 0.95;
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
  }, [getThaiVoice]);

  const play = useCallback(() => {
    if (typeof window === "undefined") return;
    const t = text.trim();
    if (!t) return;

    window.speechSynthesis.cancel();
    const chunks = splitIntoUtterances(t);
    utterancesRef.current = chunks.map(
      (c) => new SpeechSynthesisUtterance(c)
    );
    currentUtteranceRef.current = 0;
    setUtteranceIndex(0);
    setTotalUtterances(chunks.length);
    setPlayState("playing");
    synthRef.current = window.speechSynthesis;
    speakNext();
  }, [text, splitIntoUtterances, speakNext]);

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
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return {
    playState,
    utteranceIndex,
    totalUtterances,
    play,
    pause,
    resume,
    stop,
    restart,
  };
}
