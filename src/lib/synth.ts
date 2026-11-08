// Tiny 8-bit chip synth on the Web Audio API with a look-ahead scheduler.
import type { Track } from "@/lib/content";

export const LOOPS_PER_TRACK = 8;

export class ChipSynth {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  analyser: AnalyserNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextTime = 0;
  private step = 0;
  private track: Track | null = null;
  private onEnd: (() => void) | null = null;
  private volume = 0.5;
  startedAt = 0;
  duration = 0;

  ensure() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume * 0.35;
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.master.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(v * 0.35, this.ctx.currentTime, 0.02);
  }

  private stepDur() {
    return 60 / Math.max(40, Math.min(300, this.track?.bpm ?? 120)) / 2;
  }

  private note(freq: number, time: number, dur: number, wave: OscillatorType, gain: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, time);
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(gain, time + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0008, time + dur * 0.95);
    osc.connect(g).connect(this.master!);
    osc.start(time);
    osc.stop(time + dur);
  }

  play(track: Track, onEnd: () => void) {
    this.stop();
    const ctx = this.ensure();
    this.track = track;
    this.onEnd = onEnd;
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.05;
    const notes = track.notes.length ? track.notes : [440];
    const total = notes.length * LOOPS_PER_TRACK;
    this.startedAt = ctx.currentTime;
    this.duration = total * this.stepDur();
    this.timer = setInterval(() => {
      if (!this.ctx || !this.track) return;
      while (this.nextTime < this.ctx.currentTime + 0.12) {
        if (this.step >= total) {
          const cb = this.onEnd;
          this.stop();
          cb?.();
          return;
        }
        const d = this.stepDur();
        const f = notes[this.step % notes.length] ?? 440;
        this.note(f, this.nextTime, d * 0.9, this.track.wave, 0.5);
        if (this.step % 4 === 0) this.note((notes[0] ?? 440) / 2, this.nextTime, d * 3, "triangle", 0.35);
        if (this.step % 2 === 1) this.note(f * 2, this.nextTime, d * 0.25, "square", 0.08);
        this.nextTime += d;
        this.step++;
      }
    }, 25);
  }

  progress() {
    if (!this.ctx || !this.timer || !this.duration) return 0;
    return Math.min(1, (this.ctx.currentTime - this.startedAt) / this.duration);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.track = null;
    this.onEnd = null;
  }
}
