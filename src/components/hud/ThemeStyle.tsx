import { useEffect, useState, useCallback } from "react";
import type { Theme, ThemeColors } from "@/lib/content";
import { googleFontsHref } from "@/lib/fonts";

export interface Preset {
  id: string;
  label: string;
  mode: "dark" | "light";
  colors: ThemeColors;
}

// Palette templates the admin can apply to the dark or light slot.
export const PRESETS: Preset[] = [
  { id: "midnight", label: "Midnight Mono", mode: "dark", colors: { background: "#0a0a0a", surface: "#171717", card: "#111111", primary: "#f5f5f5", accent: "#f5a524", text: "#fafafa", muted: "#a1a1a1", border: "#262626" } },
  { id: "obsidian", label: "Dark Obsidian", mode: "dark", colors: { background: "#0b0f17", surface: "#151c2b", card: "#121826", primary: "#38bdf8", accent: "#a78bfa", text: "#f8fafc", muted: "#94a3b8", border: "#243045" } },
  { id: "terminal", label: "Terminal Green", mode: "dark", colors: { background: "#070a07", surface: "#0e160e", card: "#0c140c", primary: "#22c55e", accent: "#f59e0b", text: "#dcfce7", muted: "#6b8f72", border: "#1a2e1c" } },
  { id: "paper", label: "Paper White", mode: "light", colors: { background: "#f7f7f7", surface: "#ededed", card: "#ffffff", primary: "#111111", accent: "#d97706", text: "#171717", muted: "#666666", border: "#e0e0e0" } },
  { id: "glass", label: "Clean Slate", mode: "light", colors: { background: "#f2f5f8", surface: "#e7ecf2", card: "#ffffff", primary: "#0f172a", accent: "#0ea5e9", text: "#1e293b", muted: "#64748b", border: "#d5dde7" } },
  { id: "kraft", label: "Monochrome Kraft", mode: "light", colors: { background: "#fbf9f5", surface: "#f2eee6", card: "#f5f2eb", primary: "#1a1a1a", accent: "#8b6f47", text: "#1a1a1a", muted: "#6e6558", border: "#ddd3c2" } },
];

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.padEnd(6, "0");
  const n = parseInt(full.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function readableOn(hex: string, dark: string, light: string) {
  const [r = 0, g = 0, b = 0] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.4 ? dark : light;
}

function vars(c: ThemeColors, mode: "dark" | "light") {
  const shadow = mode === "dark" ? "0 8px 30px -12px rgba(0,0,0,.6)" : "0 8px 30px -14px rgba(15,23,42,.14)";
  return `--background:${c.background};--foreground:${c.text};--surface:${c.surface};--card:${c.card};--card-foreground:${c.text};--popover:${c.card};--popover-foreground:${c.text};--primary:${c.primary};--primary-foreground:${readableOn(c.primary, "#0b0b0b", "#ffffff")};--secondary:${c.surface};--secondary-foreground:${c.text};--muted:${c.surface};--muted-foreground:${c.muted};--accent:color-mix(in oklab, ${c.surface} 80%, ${c.text} 6%);--accent-foreground:${c.text};--signal:${c.accent};--signal-foreground:${readableOn(c.accent, "#140d02", "#ffffff")};--border:${c.border};--input:${c.border};--ring:${c.primary};--card-alpha:${mode === "dark" ? 88 : 90}%;--shadow:${shadow};color-scheme:${mode};`;
}

export function buildThemeCss(theme: Theme) {
  const common = `--app-font-sans:"${theme.fontSans}";--app-font-mono:"${theme.fontMono}";--radius:${theme.radius}px;--card-bw:${theme.cardBorders ? "1px" : "0px"};`;
  const d = theme.defaultMode;
  return `:root{${common}${vars(theme[d], d)}}html[data-mode="dark"]{${vars(theme.dark, "dark")}}html[data-mode="light"]{${vars(theme.light, "light")}}`;
}

const MODE_KEY = "hud-mode";

export function ThemeStyle({ theme, customCss }: { theme: Theme; customCss?: string }) {
  const href = googleFontsHref([theme.fontSans, theme.fontMono]);
  // Runs before hydration so a stored mode never flashes.
  const boot = `try{var m=localStorage.getItem("${MODE_KEY}");if(m==="dark"||m==="light")document.documentElement.setAttribute("data-mode",m)}catch(e){}`;
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={href} precedence="default" />
      <style dangerouslySetInnerHTML={{ __html: buildThemeCss(theme) }} />
      {customCss ? <style dangerouslySetInnerHTML={{ __html: customCss }} /> : null}
      <script dangerouslySetInnerHTML={{ __html: boot }} />
    </>
  );
}

/** Visitor dark/light choice. With persist=false (admin preview) it follows the theme's default mode. */
export function useThemeMode(theme: Theme, persist = true) {
  const [mode, setModeState] = useState<"dark" | "light">(theme.defaultMode);
  useEffect(() => {
    const stored = persist ? localStorage.getItem(MODE_KEY) : null;
    setModeState(stored === "dark" || stored === "light" ? stored : theme.defaultMode);
  }, [theme.defaultMode, persist]);
  useEffect(() => {
    document.documentElement.setAttribute("data-mode", mode);
  }, [mode]);
  const setMode = useCallback(
    (m: string) => {
      if (m !== "dark" && m !== "light") return;
      if (persist) localStorage.setItem(MODE_KEY, m);
      setModeState(m);
    },
    [persist],
  );
  const toggleMode = useCallback(() => setMode(mode === "dark" ? "light" : "dark"), [mode, setMode]);
  return { mode, setMode, toggleMode };
}
