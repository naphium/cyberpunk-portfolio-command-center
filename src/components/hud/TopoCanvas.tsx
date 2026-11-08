import { useEffect, useRef } from "react";

// Animated topographic background tuned for low-end devices:
// - static grid + coordinate labels are drawn once to an offscreen cache
// - dynamic contour dots render at ~20fps, pause when the tab is hidden
// - no CSS filters, fixed-position canvas so scrolling never repaints it
export function TopoCanvas({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowSpec = (navigator.hardwareConcurrency ?? 4) <= 4;
    const dpr = Math.min(window.devicePixelRatio || 1, lowSpec ? 1 : 1.5);
    const cache = document.createElement("canvas");
    const cctx = cache.getContext("2d")!;
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = 0;
    let t = Math.random() * 100;
    let colors = { grid: "", line: "", dot: "", label: "" };
    let visible = true;

    const readColors = () => {
      const s = getComputedStyle(document.documentElement);
      const fg = s.getPropertyValue("--foreground").trim() || "#ddd";
      const pr = s.getPropertyValue("--primary").trim() || "#8dff5a";
      colors = {
        grid: `color-mix(in oklab, ${fg} 6%, transparent)`,
        line: `color-mix(in oklab, ${fg} 12%, transparent)`,
        dot: `color-mix(in oklab, ${pr} 55%, transparent)`,
        label: `color-mix(in oklab, ${fg} 22%, transparent)`,
      };
    };

    const drawStatic = () => {
      cache.width = canvas.width;
      cache.height = canvas.height;
      cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cctx.clearRect(0, 0, w, h);
      const step = 80;
      cctx.strokeStyle = colors.grid;
      cctx.lineWidth = 1;
      cctx.beginPath();
      for (let x = 0; x <= w; x += step) {
        cctx.moveTo(x + 0.5, 0);
        cctx.lineTo(x + 0.5, h);
      }
      for (let y = 0; y <= h; y += step) {
        cctx.moveTo(0, y + 0.5);
        cctx.lineTo(w, y + 0.5);
      }
      cctx.stroke();
      cctx.fillStyle = colors.label;
      cctx.font = "9px ui-monospace, monospace";
      for (let x = 0; x <= w; x += step * 2) {
        for (let y = step; y <= h; y += step * 2) {
          cctx.fillText(`${(x / step).toString(16).toUpperCase()}${Math.round(y / step)}`, x + 4, y - 4);
        }
      }
      // radar crosshairs
      cctx.strokeStyle = colors.line;
      const cx = w * 0.78;
      const cy = h * 0.22;
      for (const r of [40, 90, 150]) {
        cctx.beginPath();
        cctx.arc(cx, cy, r, 0, Math.PI * 2);
        cctx.stroke();
      }
      cctx.beginPath();
      cctx.moveTo(cx - 170, cy);
      cctx.lineTo(cx + 170, cy);
      cctx.moveTo(cx, cy - 170);
      cctx.lineTo(cx, cy + 170);
      cctx.stroke();
    };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      readColors();
      drawStatic();
      render();
    };

    // cheap pseudo-noise height field
    const field = (x: number, y: number, tt: number) =>
      Math.sin(x * 0.006 + tt * 0.25) * Math.cos(y * 0.007 - tt * 0.18) + Math.sin((x + y) * 0.004 + tt * 0.12) * 0.6;

    const render = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(cache, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = colors.dot;
      const gap = lowSpec ? 22 : 16;
      for (let y = 0; y < h; y += gap) {
        for (let x = 0; x < w; x += gap) {
          const v = field(x, y, t);
          // draw dots only near contour levels → topographic lines
          const band = Math.abs(((v * 4) % 1) + (v < 0 ? 1 : 0) - 0.5);
          if (band < 0.12) {
            const s = band < 0.05 ? 1.6 : 1;
            ctx.fillRect(x, y, s, s);
          }
        }
      }
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      if (now - last < 50) return; // ~20fps
      last = now;
      t += 0.05;
      render();
    };

    const onVis = () => {
      if (!document.hidden) last = 0;
    };
    const io = new IntersectionObserver(([e]) => (visible = e?.isIntersecting ?? true));
    io.observe(canvas);
    const mo = new MutationObserver(() => {
      readColors();
      drawStatic();
      render();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-mode"] });

    resize();
    let rt: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(rt);
      rt = setTimeout(resize, 150);
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);
    if (!reduced) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={`pointer-events-none fixed inset-0 z-0 ${className}`} />;
}
