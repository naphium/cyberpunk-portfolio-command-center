import { useEffect, useRef } from "react";

const KATAKANA = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";

export function MatrixRain({ glyphs, onClose, background = false }: { glyphs: "katakana" | "binary" | "mixed"; onClose: () => void; background?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const chars =
      glyphs === "binary" ? "01" : glyphs === "mixed" ? KATAKANA + "0123456789ABCDEF" : KATAKANA;
    const size = 16;
    let cols = 0;
    let drops: number[] = [];
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cols = Math.ceil(canvas.width / size);
      drops = Array.from({ length: cols }, () => Math.random() * -50);
    };
    resize();
    const tokens = getComputedStyle(document.documentElement);
    const primary = tokens.getPropertyValue("--matrix-code").trim();
    let raf = 0;
    let last = 0;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - last < 40) return;
      last = now;
      ctx.fillStyle = tokens.getPropertyValue("--matrix-trail").trim();
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = primary;
      ctx.font = `${size}px monospace`;
      for (let i = 0; i < cols; i++) {
        const ch = chars.charAt(Math.floor(Math.random() * chars.length));
        const d = drops[i] ?? 0;
        ctx.fillText(ch, i * size, d * size);
        drops[i] = d * size > canvas.height && Math.random() > 0.975 ? 0 : d + 1;
      }
    };
    raf = requestAnimationFrame(draw);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", resize);
    const timer = background ? undefined : setTimeout(onClose, 15000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", resize);
    };
  }, [glyphs, onClose, background]);

  return (
    <div className={background ? "pointer-events-none fixed inset-0 z-[1] matrix-backdrop" : "fixed inset-0 z-[90] bg-background"} onClick={background ? undefined : onClose} role="presentation">
      <canvas ref={ref} className="h-full w-full" />
      {!background && <div className="hud-badge hud-badge-primary absolute bottom-4 left-1/2 -translate-x-1/2">
        wake up, neo · click or esc to exit
      </div>}
    </div>
  );
}
