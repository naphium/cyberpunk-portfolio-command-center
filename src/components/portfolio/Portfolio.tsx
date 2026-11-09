import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Megaphone, WifiOff } from "lucide-react";
import { toast } from "sonner";
import type { SiteData, TabId } from "@/lib/content";
import { ThemeStyle, useThemeMode } from "@/components/hud/ThemeStyle";
import { AudioBar } from "./AudioBar";
import { TopoCanvas } from "@/components/hud/TopoCanvas";
import { MatrixRain } from "@/components/hud/MatrixRain";
import { Terminal } from "@/components/hud/Terminal";
import { CommandPalette } from "@/components/hud/CommandPalette";
import { AudioProvider, useAudio } from "@/components/hud/AudioProvider";
import { ReadingProgress, useGlobalBehaviors } from "@/components/hud/Effects";
import { Header } from "./Header";
import {
  AboutSection,
  GamingSection,
  LinksSection,
  NowSection,
  ProjectsSection,
  SocialSection,
} from "./sections-primary";
import {
  AchievementsSection,
  AlbumSection,
  FaqSection,
  GoalsSection,
  ResourcesSection,
  SetupSection,
  SkillsSection,
  TimelineSection,
} from "./sections-secondary";
import { AudioSection, GuestbookSection } from "./sections-interactive";

const TAB_KEY = "hud-tab";
const EasterEggs = lazy(() => import("@/components/hud/EasterEggs").then((module) => ({ default: module.EasterEggs })));

function renderSection(id: TabId, data: SiteData): ReactNode {
  switch (id) {
    case "about":
      return <AboutSection data={data} />;
    case "links":
      return <LinksSection data={data} />;
    case "social":
      return <SocialSection data={data} />;
    case "projects":
      return <ProjectsSection data={data} />;
    case "gaming":
      return <GamingSection data={data} />;
    case "now":
      return <NowSection data={data} />;
    case "resources":
      return <ResourcesSection data={data} />;
    case "achievements":
      return <AchievementsSection data={data} />;
    case "skills":
      return <SkillsSection data={data} />;
    case "timeline":
      return <TimelineSection data={data} />;
    case "goals":
      return <GoalsSection data={data} />;
    case "setup":
      return <SetupSection data={data} />;
    case "album":
      return <AlbumSection data={data} />;
    case "audio":
      return <AudioSection />;
    case "guestbook":
      return <GuestbookSection />;
    case "faq":
      return <FaqSection data={data} />;
  }
}

export function Portfolio({ data, preview = false }: { data: SiteData; preview?: boolean }) {
  return (
    <AudioProvider
      tracks={data.audio.tracks}
      defaults={{ volume: data.audio.volume, shuffle: data.audio.shuffle, autoplay: data.audio.autoplay }}
    >
      <PortfolioInner data={data} preview={preview} />
    </AudioProvider>
  );
}

function PortfolioInner({ data, preview }: { data: SiteData; preview: boolean }) {
  const s = data.settings;
  const fx = s.effects;
  const { mode, setMode, toggleMode: toggle } = useThemeMode(data.theme, !preview);
  const backdrop = mode === "dark" && fx.background && !fx.reducedMotion ? <TopoCanvas /> : <div className="glass-backdrop" aria-hidden />;
  const tabs = useMemo(() => data.tabs.filter((t) => t.visible), [data.tabs]);
  const [active, setActive] = useState<TabId>(tabs[0]?.id ?? "about");
  const [termOpen, setTermOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [matrix, setMatrix] = useState(false);
  const [contactArrival, setContactArrival] = useState(false);
  const [dir, setDir] = useState<"next" | "prev">("next");
  const activeRef = useRef<string>(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  const navRef = useRef<HTMLDivElement>(null);
  const audio = useAudio();

  useGlobalBehaviors(data, !preview);
  useEffect(() => {
    document.documentElement.toggleAttribute("data-owner-reduced-motion", fx.reducedMotion);
    return () => document.documentElement.removeAttribute("data-owner-reduced-motion");
  }, [fx.reducedMotion]);

  // restore tab from hash or memory
  useEffect(() => {
    const fromHash = window.location.hash.replace("#", "") as TabId;
    const stored = localStorage.getItem(TAB_KEY) as TabId | null;
    const pick = [fromHash, stored].find((x) => x && tabs.some((t) => t.id === x));
    if (pick) setActive(pick);
    const onHash = () => {
      const h = window.location.hash.replace("#", "") as TabId;
      if (tabs.some((t) => t.id === h)) setActive(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [tabs]);

  // if the active tab becomes hidden, fall back
  useEffect(() => {
    if (!tabs.some((t) => t.id === active) && tabs[0]) setActive(tabs[0].id);
  }, [tabs, active]);

  const goTab = useCallback(
    (id: string, scrollToNav = true) => {
      if (!tabs.some((t) => t.id === id)) return;
      const from = tabs.findIndex((t) => t.id === activeRef.current);
      const to = tabs.findIndex((t) => t.id === id);
      setDir(to >= from ? "next" : "prev");
      activeRef.current = id;
      setActive(id as TabId);
      localStorage.setItem(TAB_KEY, id);
      history.replaceState(null, "", `#${id}`);
      const top = navRef.current?.getBoundingClientRect().top ?? 0;
      if (scrollToNav && (top < 0 || top > window.innerHeight * 0.6)) {
        navRef.current?.scrollIntoView({ behavior: fx.reducedMotion ? "instant" : "smooth", block: "start" });
      }
      if (scrollToNav) {
        document.getElementById(`tab-${id}`)?.scrollIntoView({ behavior: fx.reducedMotion ? "instant" : "smooth", block: "nearest", inline: "center" });
      }
    },
    [tabs, fx.reducedMotion],
  );

  useEffect(() => {
    if (!contactArrival || active !== "links") return;
    let raf = 0;
    const frame = requestAnimationFrame(() => {
      const el = document.getElementById("links-content");
      if (!el) return;
      const target = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 80);
      if (fx.reducedMotion) { window.scrollTo({ top: target, behavior: "instant" }); return; }
      const start = window.scrollY;
      const dist = target - start;
      const dur = Math.min(1100, 500 + Math.abs(dist) * 0.4);
      const t0 = performance.now();
      const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        window.scrollTo(0, start + dist * ease(p));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    });
    const timeout = window.setTimeout(() => setContactArrival(false), 1600);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
    };
  }, [active, contactArrival, fx.reducedMotion]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(data.profile.siteUrl || window.location.origin);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy");
    }
  }, [data.profile.siteUrl]);

  // global hotkeys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
      if (s.terminal.enabled && e.key === (s.terminal.hotkey || "`")) {
        e.preventDefault();
        setTermOpen((o) => !o);
        return;
      }
      if (/^[1-9]$/.test(e.key)) {
        const t = tabs[Number(e.key) - 1];
        if (t) goTab(t.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tabs, goTab, s.terminal.enabled, s.terminal.hotkey]);

  const startMatrix = useCallback(() => setMatrix(true), []);
  const stopMatrix = useCallback(() => setMatrix(false), []);

  if (s.maintenance.enabled && !preview) {
    return (
      <>
        <ThemeStyle theme={data.theme} customCss={s.customCss} />
        {backdrop}
        <main className="relative z-10 flex min-h-screen items-center justify-center p-6">
          <div className="hud-card hud-corners max-w-md p-8 text-center">
            <WifiOff className="mx-auto mb-4 h-8 w-8 text-signal" />
            <div className="hud-label mb-2">status: offline</div>
            <p className="whitespace-pre-line">{s.maintenance.message}</p>
          </div>
        </main>
      </>
    );
  }

  const rootCls = [
    "portfolio-shell relative z-10 min-h-screen",
    fx.customCursor ? "block-cursor" : "",
    s.disableSelection ? "no-select" : "",
  ].join(" ");

  return (
    <>
      <ThemeStyle theme={data.theme} customCss={s.customCss} />
      {backdrop}
      {fx.scanlines && <div className="scanlines" aria-hidden />}
      {s.readingProgress && <ReadingProgress />}
      {matrix && <MatrixRain glyphs={fx.matrixGlyphs} onClose={stopMatrix} />}
      <Terminal
        open={termOpen}
        onClose={() => setTermOpen(false)}
        data={data}
        tabs={tabs}
        onTab={goTab}
        onTheme={setMode}
        onMatrix={startMatrix}
      />
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        tabs={tabs}
        data={data}
        mode={mode}
        onTab={goTab}
        onToggleTheme={toggle}
        onTerminal={() => setTermOpen(true)}
        onMatrix={startMatrix}
        onCopyLink={copyLink}
        onAudio={audio.toggle}
      />

      <div className={rootCls}>
        {s.announcement.enabled && s.announcement.text && (
          <div className="border-b border-signal/40 bg-signal/10 px-4 py-2 text-center font-mono text-xs text-signal">
            <Megaphone className="mr-2 inline h-3.5 w-3.5" />
            {s.announcement.link ? (
              <a href={s.announcement.link} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
                {s.announcement.text}
              </a>
            ) : (
              s.announcement.text
            )}
          </div>
        )}
        <main className="mx-auto max-w-5xl space-y-5 px-3 pb-28 pt-4 sm:px-4 sm:pt-8">
          <Header
            data={data}
            mode={mode}
            onToggleTheme={toggle}
            onContacts={() => {
              goTab("links", false);
              setContactArrival(true);
            }}
          />

          <div ref={navRef} className="z-40 md:sticky md:top-2">
            <nav
              role="tablist"
              aria-label="Sections"
              className="hud-card grid grid-cols-3 gap-1.5 p-1.5 sm:grid-cols-4 lg:grid-cols-8"
            >
              {tabs.map((t) => (
                <button
                  key={t.id}
                  id={`tab-${t.id}`}
                  role="tab"
                  aria-selected={active === t.id}
                  data-active={active === t.id}
                  className="tab-pill"
                  onClick={() => goTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          <div
            key={active}
            id={`${active}-content`}
            role="tabpanel"
            data-dir={dir}
            className={`animate-tab-panel min-h-[50vh] scroll-mt-20 ${active === "links" && contactArrival ? "contact-arrival" : ""}`}
          >
            {renderSection(active, data)}
          </div>

          <footer className="border-t pt-4 text-center font-mono text-xs text-muted-foreground">
            © {data.profile.name} · {data.profile.location}
            {fx.easterEggs && <Suspense fallback={null}><EasterEggs data={data} active={active} /></Suspense>}
          </footer>
        </main>
      </div>
      <AudioBar />
    </>
  );
}
