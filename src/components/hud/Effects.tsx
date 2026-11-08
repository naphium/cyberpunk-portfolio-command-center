import { useEffect, useRef, useState } from "react";
import type { SiteData } from "@/lib/content";

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

export function useKonami(enabled: boolean, onTrigger: () => void) {
  useEffect(() => {
    if (!enabled) return;
    let pos = 0;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      pos = k === KONAMI[pos] ? pos + 1 : k === KONAMI[0] ? 1 : 0;
      if (pos === KONAMI.length) {
        pos = 0;
        onTrigger();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, onTrigger]);
}

export function ReadingProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        const p = h > 0 ? window.scrollY / h : 0;
        if (ref.current) ref.current.style.transform = `scaleX(${p})`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <div ref={ref} className="fixed left-0 top-0 z-[70] h-0.5 w-full origin-left bg-primary" style={{ transform: "scaleX(0)" }} />;
}

export function FpsHud() {
  const [fps, setFps] = useState(0);
  const [info, setInfo] = useState({ cores: 0, mem: "?", net: "?" });
  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { effectiveType?: string } };
    setInfo({
      cores: nav.hardwareConcurrency ?? 0,
      mem: nav.deviceMemory ? `${nav.deviceMemory}GB` : "?",
      net: nav.connection?.effectiveType ?? "?",
    });
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      frames++;
      if (now - last >= 1000) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="pointer-events-none fixed bottom-20 left-3 z-[65] hidden flex-col gap-0.5 rounded-md border bg-card/90 px-2.5 py-1.5 font-mono text-[10px] leading-tight text-muted-foreground sm:flex">
      <span>
        FPS <span className={fps >= 50 ? "text-primary" : "text-signal"}>{fps}</span>
      </span>
      <span>CPU {info.cores}T · MEM {info.mem}</span>
      <span>NET {info.net}</span>
    </div>
  );
}

export function useGlobalBehaviors(data: SiteData, enabled: boolean) {
  const s = data.settings;
  // away title
  useEffect(() => {
    if (!enabled || !s.awayTitle.enabled) return;
    let original = document.title;
    const onVis = () => {
      if (document.hidden) {
        original = document.title;
        document.title = s.awayTitle.text;
      } else document.title = original;
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [enabled, s.awayTitle.enabled, s.awayTitle.text]);

  // right click
  useEffect(() => {
    if (!enabled || !s.disableRightClick) return;
    const fn = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", fn);
    return () => document.removeEventListener("contextmenu", fn);
  }, [enabled, s.disableRightClick]);

  // console banner
  useEffect(() => {
    if (!enabled || !s.effects.consoleBanner) return;
    const w = window as Window & { __hudBanner?: boolean };
    if (w.__hudBanner) return;
    w.__hudBanner = true;
    console.log(
      `%c ${data.profile.handle.toUpperCase()} // HUD ONLINE `,
      "background:#8dff5a;color:#070a09;font:700 14px monospace;padding:6px 10px;border-radius:3px",
    );
    console.log(
      "%cCurious? Press ` for the terminal, or try the Konami code. 👾",
      "color:#ffb020;font:12px monospace",
    );
  }, [enabled, s.effects.consoleBanner, data.profile.handle]);
}
