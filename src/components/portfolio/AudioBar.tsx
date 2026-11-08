import { useEffect, useRef } from "react";
import { Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useAudio } from "@/components/hud/AudioProvider";
import { Slider } from "@/components/ui/slider";

const t = (s: number) => {
  const v = Math.max(0, Math.floor(s || 0));
  return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`;
};

const round =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-card text-foreground transition-colors hover:bg-accent";

// Full-width player docked to the bottom of the screen.
export function AudioBar() {
  const a = useAudio();
  const cur = a.tracks[a.index];
  const fill = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const elapsed = useRef<HTMLSpanElement>(null);
  const total = useRef<HTMLSpanElement>(null);

  // Update DOM directly a few times a second instead of re-rendering React.
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < 250) return;
      last = now;
      const p = a.playing ? a.getProgress() : 0;
      const d = a.getDuration();
      if (fill.current) fill.current.style.transform = `scaleX(${p})`;
      if (knob.current) knob.current.style.left = `${p * 100}%`;
      if (elapsed.current) elapsed.current.textContent = t(p * d);
      if (total.current) total.current.textContent = t(d);
      if (!a.playing) cancelAnimationFrame(raf);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [a.playing, a]);

  if (!cur) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/95 md:bg-card/85 md:backdrop-blur-md">
      <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 sm:px-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-4 shrink-0 items-end gap-[2px]" aria-hidden>
            {[10, 14, 7, 4, 4].map((h, i) => (
              <span key={i} className="w-[3px] rounded-sm bg-foreground" style={{ height: h }} />
            ))}
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{cur.title}</div>
            <div className="truncate font-mono text-[11px] text-muted-foreground">
              {cur.artist || "naphium"} synth{!cur.url && ` · ${a.bpmOverride ?? cur.bpm} BPM`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button className={round} onClick={a.prev} aria-label="Previous track">
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
            onClick={a.toggle}
            aria-label={a.playing ? "Pause" : "Play"}
          >
            {a.playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button className={round} onClick={a.next} aria-label="Next track">
            <SkipForward className="h-4 w-4" />
          </button>
          <span ref={elapsed} className="hidden w-9 font-mono text-xs tabular-nums sm:inline">
            0:00
          </span>
          <div className="relative hidden h-1 min-w-0 flex-1 rounded-full bg-border sm:block">
            <div ref={fill} className="h-full origin-left rounded-full bg-primary" style={{ transform: "scaleX(0)" }} />
            <div
              ref={knob}
              className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
              style={{ left: "0%" }}
            />
          </div>
          <span ref={total} className="hidden w-9 font-mono text-xs tabular-nums sm:inline">
            0:00
          </span>
        </div>

        <div className="hidden w-24 shrink-0 items-center gap-2 md:flex">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <Slider value={[a.volume * 100]} max={100} step={1} onValueChange={([v = 0]) => a.setVolume(v / 100)} aria-label="Volume" />
        </div>
      </div>
    </div>
  );
}
