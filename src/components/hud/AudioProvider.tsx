import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Track } from "@/lib/content";
import { ChipSynth } from "@/lib/synth";

interface AudioState {
  tracks: Track[];
  index: number;
  playing: boolean;
  volume: number;
  shuffle: boolean;
  autoplay: boolean;
  bpmOverride: number | null;
  play: (i?: number) => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  setVolume: (v: number) => void;
  setShuffle: (v: boolean) => void;
  setAutoplay: (v: boolean) => void;
  setBpmOverride: (v: number | null) => void;
  getProgress: () => number;
  getDuration: () => number;
  getAnalyser: () => AnalyserNode | null;
}

const Ctx = createContext<AudioState | null>(null);

export function useAudio() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAudio outside AudioProvider");
  return c;
}

export function AudioProvider({
  tracks,
  defaults,
  children,
}: {
  tracks: Track[];
  defaults: { volume: number; shuffle: boolean; autoplay: boolean };
  children: ReactNode;
}) {
  const synth = useRef<ChipSynth | null>(null);
  const audioEl = useRef<HTMLAudioElement | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVol] = useState(defaults.volume);
  const [shuffle, setShuffle] = useState(defaults.shuffle);
  const [autoplay, setAutoplay] = useState(defaults.autoplay);
  const [bpmOverride, setBpmOverride] = useState<number | null>(null);
  const stateRef = useRef({ index, shuffle, autoplay, tracks, bpmOverride });
  stateRef.current = { index, shuffle, autoplay, tracks, bpmOverride };

  const stopAll = useCallback(() => {
    synth.current?.stop();
    if (audioEl.current) {
      audioEl.current.pause();
    }
  }, []);

  const pickNext = useCallback((dir: 1 | -1) => {
    const { index: i, shuffle: sh, tracks: ts } = stateRef.current;
    if (!ts.length) return 0;
    if (sh && ts.length > 1) {
      let n = i;
      while (n === i) n = Math.floor(Math.random() * ts.length);
      return n;
    }
    return (i + dir + ts.length) % ts.length;
  }, []);

  const playIndex = useCallback(
    (i: number) => {
      const { tracks: ts, bpmOverride: bpm } = stateRef.current;
      const t = ts[i];
      if (!t) return;
      stopAll();
      setIndex(i);
      setPlaying(true);
      const onEnd = () => {
        if (stateRef.current.autoplay) {
          playIndexRef.current(pickNext(1));
        } else setPlaying(false);
      };
      if (t.url) {
        if (!audioEl.current) audioEl.current = new Audio();
        const a = audioEl.current;
        a.src = t.url;
        a.volume = volume;
        a.onended = onEnd;
        a.play().catch(() => setPlaying(false));
      } else {
        if (!synth.current) synth.current = new ChipSynth();
        synth.current.setVolume(volume);
        synth.current.play(bpm ? { ...t, bpm } : t, onEnd);
      }
    },
    [stopAll, pickNext, volume],
  );
  const playIndexRef = useRef(playIndex);
  playIndexRef.current = playIndex;

  useEffect(() => () => stopAll(), [stopAll]);

  const value = useMemo<AudioState>(
    () => ({
      tracks,
      index,
      playing,
      volume,
      shuffle,
      autoplay,
      bpmOverride,
      play: (i) => playIndex(i ?? index),
      pause: () => {
        stopAll();
        setPlaying(false);
      },
      toggle: () => {
        if (playing) {
          stopAll();
          setPlaying(false);
        } else playIndex(index);
      },
      next: () => playIndex(pickNext(1)),
      prev: () => playIndex(pickNext(-1)),
      setVolume: (v) => {
        setVol(v);
        synth.current?.setVolume(v);
        if (audioEl.current) audioEl.current.volume = v;
      },
      setShuffle,
      setAutoplay,
      setBpmOverride,
      getProgress: () => {
        const t = tracks[index];
        if (t?.url && audioEl.current?.duration) return audioEl.current.currentTime / audioEl.current.duration;
        return synth.current?.progress() ?? 0;
      },
      getDuration: () => {
        const t = tracks[index];
        if (t?.url) return audioEl.current?.duration || 0;
        return synth.current?.duration ?? 0;
      },
      getAnalyser: () => synth.current?.analyser ?? null,
    }),
    [tracks, index, playing, volume, shuffle, autoplay, bpmOverride, playIndex, stopAll, pickNext],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
