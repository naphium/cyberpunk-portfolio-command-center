import { useEffect, useRef } from "react";

const KATAKANA = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";

export function MatrixRain({ glyphs, onClose }: { glyphs: "katakana" | "binary" | "mixed"; onClose: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
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
    const primary = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#8dff5a";
    let raf = 0;
    let last = 0;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - last < 40) return;
      last = now;
      ctx.fillStyle = "rgba(0,0,0,0.08)";
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
    const timer = setTimeout(onClose, 15000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", resize);
    };
  }, [glyphs, onClose]);

  return (
    <div className="fixed inset-0 z-[90] bg-background" onClick={onClose} role="presentation">
      <canvas ref={ref} className="h-full w-full" />
      <div className="hud-badge hud-badge-primary absolute bottom-4 left-1/2 -translate-x-1/2">
        wake up, neo · click or esc to exit
      </div>
    </div>
  );
}
