import { useEffect, useRef, useState } from "react";
import { Coffee, Coins, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import type { SiteData } from "@/lib/content";
import { advanceSequence, avatarCombo } from "@/lib/easter-eggs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { MatrixRain } from "./MatrixRain";
import { useAudio } from "./AudioProvider";
import { useKonami } from "./Effects";
import { useCallback } from "react";

export function EasterEggs({ data, active }: { data: SiteData; active: string }) {
  const fx = data.settings.effects;
  const [matrix, setMatrix] = useState(false);
  const [arcade, setArcade] = useState(false);
  const [score, setScore] = useState(0);
  const [notes, setNotes] = useState(false);
  const [coffee, setCoffee] = useState(false);
  const coffeeRef = useRef(false);
  coffeeRef.current = coffee;
  const [gravity, setGravity] = useState(false);
  const stopGravity = useRef<(() => void) | null>(null);
  const audio = useAudio();
  const stopMatrix = useCallback(() => setMatrix(false), []);
  const startArcade = useCallback(() => {
    setArcade((value) => !value);
    if (audio.volume <= 0 || fx.reducedMotion) return;
    try {
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(440, context.currentTime);
      oscillator.frequency.setValueAtTime(880, context.currentTime + 0.1);
      gain.gain.setValueAtTime(audio.volume * 0.08, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.25);
      oscillator.connect(gain).connect(context.destination);
      oscillator.onended = () => { void context.close(); };
      oscillator.start(); oscillator.stop(context.currentTime + 0.3);
    } catch { /* Audio may be unavailable; the game remains playable. */ }
  }, [audio.volume, fx.reducedMotion]);
  useKonami(fx.konami, startArcade);

  useEffect(() => {
    document.documentElement.toggleAttribute("data-matrix", matrix);
    return () => document.documentElement.removeAttribute("data-matrix");
  }, [matrix]);

  useEffect(() => {
    let buffer = "";
    let clicks: number[] = [];
    let hold: ReturnType<typeof setTimeout> | undefined;
    let party: ReturnType<typeof setTimeout> | undefined;
    const avatar = document.getElementById("avatar");
    const title = document.getElementById("profile-title");
    const key = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.ctrlKey || event.metaKey || event.altKey || target.closest("input, textarea, [contenteditable=true]")) return;
      if (event.key === "Escape") { setMatrix(false); setArcade(false); }
      if (event.key.length === 1 && !event.repeat) {
        const result = advanceSequence(buffer, event.key); buffer = result.buffer;
        if (result.triggered) setMatrix((value) => !value);
      }
    };
    const boost = () => {
      setCoffee(false);
      avatar?.classList.add("avatar-coffee");
      toast.success("Coffee added: Energy boosted +100%");
    };
    const click = () => {
      if (coffeeRef.current) { boost(); return; }
      const result = avatarCombo(clicks, performance.now()); clicks = result.times;
      if (!result.triggered || !avatar) return;
      avatar.classList.remove("avatar-party");
      void avatar.offsetWidth;
      avatar.classList.add("avatar-party");
      clearTimeout(party);
      party = setTimeout(() => avatar.classList.remove("avatar-party"), 2500);
    };
    const cancel = () => { clearTimeout(hold); title?.classList.remove("egg-charging"); };
    const start = () => { cancel(); title?.classList.add("egg-charging"); hold = setTimeout(() => { cancel(); setNotes(true); }, 3000); };
    const titleKey = (event: KeyboardEvent) => { if ((event.key === " " || event.key === "Enter") && !event.repeat) { event.preventDefault(); start(); } };
    const avatarKey = (event: KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); click(); } };
    const dragover = (event: DragEvent) => { if (event.dataTransfer?.types.includes("application/x-coffee")) event.preventDefault(); };
    const drop = (event: DragEvent) => { if (event.dataTransfer?.getData("application/x-coffee") === "coffee") { event.preventDefault(); boost(); } };
    window.addEventListener("keydown", key);
    avatar?.addEventListener("click", click); avatar?.addEventListener("keydown", avatarKey);
    avatar?.addEventListener("dragover", dragover); avatar?.addEventListener("drop", drop);
    title?.addEventListener("pointerdown", start); title?.addEventListener("keydown", titleKey);
    title?.addEventListener("pointerleave", cancel); title?.addEventListener("blur", cancel);
    window.addEventListener("pointerup", cancel); window.addEventListener("pointercancel", cancel); window.addEventListener("keyup", cancel);
    return () => {
      cancel(); clearTimeout(party); avatar?.classList.remove("avatar-party", "avatar-coffee");
      window.removeEventListener("keydown", key);
      avatar?.removeEventListener("click", click); avatar?.removeEventListener("keydown", avatarKey);
      avatar?.removeEventListener("dragover", dragover); avatar?.removeEventListener("drop", drop);
      title?.removeEventListener("pointerdown", start); title?.removeEventListener("keydown", titleKey);
      title?.removeEventListener("pointerleave", cancel); title?.removeEventListener("blur", cancel);
      window.removeEventListener("pointerup", cancel); window.removeEventListener("pointercancel", cancel); window.removeEventListener("keyup", cancel);
    };
  }, []);

  useEffect(() => {
    if (!fx.consoleBanner) return;
    const w = window as Window & { hireMe?: () => void };
    const previous = w.hireMe;
    w.hireMe = () => console.table({ Name: data.profile.name, Email: data.profile.email, Skills: data.skills.groups.flatMap((group) => group.items).sort((a, b) => b.level - a.level).slice(0, 5).map((skill) => skill.name).join(", "), Resume: data.links.find((link) => /resume|résumé|cv/i.test(link.title))?.url || "Not supplied" });
    console.info("Curious developer? Run window.hireMe() for a contact card.");
    return () => { if (previous) w.hireMe = previous; else delete w.hireMe; };
  }, [data.profile, data.skills, data.links, fx.consoleBanner]);

  useEffect(() => {
    let disposed = false;
    if (gravity && !fx.reducedMotion) void import("@/lib/gravity").then((module) => module.collapseElements()).then((cleanup) => { if (disposed) cleanup(); else stopGravity.current = cleanup; }).catch(() => { setGravity(false); toast.error("Gravity could not start"); });
    return () => { disposed = true; stopGravity.current?.(); stopGravity.current = null; };
  }, [gravity, active, fx.reducedMotion]);

  return <>
    {matrix && (fx.reducedMotion ? <div className="matrix-backdrop pointer-events-none fixed inset-0 z-[1]" /> : <MatrixRain glyphs={fx.matrixGlyphs} onClose={stopMatrix} background />)}
    {arcade && <><div className="scanlines" aria-hidden /><aside aria-label="Retro arcade" className="fixed bottom-24 right-3 z-[80] w-48 rounded-md border border-primary bg-card p-3 font-mono">
      <div className="flex items-center justify-between text-xs text-primary">COIN QUEST<Button size="icon" variant="ghost" aria-label="Close arcade" onClick={() => setArcade(false)}><X /></Button></div>
      <p className="py-3 text-center text-xl tabular-nums">{String(score).padStart(4, "0")}</p>
      <Button className="w-full" aria-label="Collect coin" onClick={() => setScore((value) => value + 100)}><Coins /> +100</Button>
    </aside></>}
    <div className="mx-auto flex justify-center gap-3 py-3 font-mono text-xs text-muted-foreground">
      <Button variant="ghost" size="sm" draggable aria-pressed={coffee} onClick={() => setCoffee((value) => !value)} onDragStart={(event) => event.dataTransfer.setData("application/x-coffee", "coffee")}><Coffee /> Coffee</Button>
      <Button variant="ghost" size="sm" onDoubleClick={() => { if (fx.reducedMotion) toast.success("Gravity paused by the owner’s motion setting"); else setGravity(true); }}>[x] gravity</Button>
    </div>
    {gravity && <Button className="fixed bottom-24 left-1/2 z-[85] -translate-x-1/2" onClick={() => setGravity(false)}><RotateCcw /> Reset Site</Button>}
    <Sheet open={notes} onOpenChange={setNotes}><SheetContent className="overflow-y-auto"><SheetTitle>Behind the scenes</SheetTitle><SheetDescription>Live portfolio composition</SheetDescription><pre className="mt-6 whitespace-pre-wrap break-words rounded-md border bg-surface p-4 font-mono text-xs">{JSON.stringify({ framework: "TanStack Start", language: "TypeScript", styling: "Tailwind CSS", projects: data.projects.length, skills: data.skills.groups.flatMap((group) => group.items).length, visibleSections: data.tabs.filter((tab) => tab.visible).length, motion: fx.reducedMotion ? "reduced" : "full", source: data.profile.sourceUrl || null }, null, 2)}</pre></SheetContent></Sheet>
  </>;
}