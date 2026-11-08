import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pause, Play, Repeat, Shuffle, SkipBack, SkipForward, Volume2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { SiteData } from "@/lib/content";
import { useAudio } from "@/components/hud/AudioProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Empty, Panel, SectionTitle } from "./common";

function Scope() {
  const audio = useAudio();
  const ref = useRef<HTMLCanvasElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let raf = 0;
    let last = 0;
    const buf = new Uint8Array(256);
    const color = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#8dff5a";
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - last < 33 || document.hidden) return;
      last = now;
      const w = (c.width = c.clientWidth);
      const h = (c.height = c.clientHeight);
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const an = audio.getAnalyser();
      if (an && audio.playing) an.getByteTimeDomainData(buf);
      else buf.fill(128);
      for (let i = 0; i < buf.length; i++) {
        const x = (i / (buf.length - 1)) * w;
        const y = ((buf[i] ?? 128) / 255) * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      if (bar.current) bar.current.style.width = `${audio.getProgress() * 100}%`;
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [audio]);
  return (
    <div className="space-y-2">
      <canvas ref={ref} className="hud-gridbg h-28 w-full rounded-md border bg-surface" />
      <div className="progress-track">
        <div ref={bar} className="progress-fill" style={{ width: 0 }} />
      </div>
    </div>
  );
}

export function AudioSection() {
  const a = useAudio();
  const cur = a.tracks[a.index];
  return (
    <section className="space-y-4">
      <SectionTitle code="14 // TRACKS" title="Chip synth deck" />
      <Panel className="hud-corners space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="hud-label">now loaded</div>
            <div className="truncate font-mono text-lg text-primary">{cur?.title ?? "—"}</div>
            <div className="text-xs text-muted-foreground">
              {cur?.artist} · {cur?.url ? "stream" : `${cur?.wave} · ${a.bpmOverride ?? cur?.bpm} bpm`}
            </div>
          </div>
          <span className={`hud-badge ${a.playing ? "hud-badge-primary" : ""}`}>
            <span className="status-dot" /> {a.playing ? "playing" : "standby"}
          </span>
        </div>
        <Scope />
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="hudGhost" size="icon" onClick={a.prev} aria-label="Previous">
            <SkipBack />
          </Button>
          <Button variant="hud" onClick={a.toggle} aria-label={a.playing ? "Pause" : "Play"}>
            {a.playing ? <Pause /> : <Play />} {a.playing ? "Pause" : "Play"}
          </Button>
          <Button variant="hudGhost" size="icon" onClick={a.next} aria-label="Next">
            <SkipForward />
          </Button>
          <Button
            variant={a.shuffle ? "hud" : "hudGhost"}
            size="icon"
            onClick={() => a.setShuffle(!a.shuffle)}
            aria-label="Shuffle"
            aria-pressed={a.shuffle}
          >
            <Shuffle />
          </Button>
          <Button
            variant={a.autoplay ? "hud" : "hudGhost"}
            size="icon"
            onClick={() => a.setAutoplay(!a.autoplay)}
            aria-label="Autoplay"
            aria-pressed={a.autoplay}
          >
            <Repeat />
          </Button>
          <div className="ml-auto flex min-w-[160px] items-center gap-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Slider value={[a.volume * 100]} max={100} step={1} onValueChange={([v = 0]) => a.setVolume(v / 100)} aria-label="Volume" />
          </div>
        </div>
        {!cur?.url && (
          <div className="flex items-center gap-3">
            <span className="hud-label w-16">BPM</span>
            <Slider
              value={[a.bpmOverride ?? cur?.bpm ?? 120]}
              min={60}
              max={240}
              step={1}
              onValueChange={([v = 120]) => a.setBpmOverride(v)}
              onValueCommit={() => a.playing && a.play()}
              aria-label="BPM"
            />
            <button className="hud-label hover:text-primary" onClick={() => a.setBpmOverride(null)}>
              reset
            </button>
          </div>
        )}
      </Panel>
      {!a.tracks.length && <Empty label="No tracks loaded." />}
      <div className="hud-card divide-y divide-border">
        {a.tracks.map((t, i) => (
          <button
            key={t.id}
            onClick={() => a.play(i)}
            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left font-mono text-sm hover:bg-accent ${i === a.index ? "text-primary" : ""}`}
          >
            <span className="w-6 text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
            <span className="flex-1 truncate">{t.title}</span>
            <span className="text-xs text-muted-foreground">{t.url ? "mp3" : t.wave}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

interface Entry {
  id: string;
  name: string;
  message: string;
  created_at: string;
}

export function GuestbookSection({ adminToken, onDelete }: { adminToken?: string; onDelete?: (id: string) => Promise<void> }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const q = useQuery({
    queryKey: ["guestbook"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guestbook_entries")
        .select("id, name, message, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Entry[];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel(`guestbook-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "guestbook_entries" }, () => {
        void qc.invalidateQueries({ queryKey: ["guestbook"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [qc]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    const m = msg.trim();
    if (!n || !m) {
      toast.error("Name and note are required");
      return;
    }
    if (n.length > 40 || m.length > 500) {
      toast.error("Too long");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("guestbook_entries").insert({ name: n, message: m });
    setBusy(false);
    if (error) {
      toast.error("Could not sign the guestbook");
      return;
    }
    setMsg("");
    toast.success("Transmission received");
    void qc.invalidateQueries({ queryKey: ["guestbook"] });
  };

  return (
    <section className="space-y-4">
      <SectionTitle code="15 // GUESTBOOK" title="Leave a transmission" />
      <form onSubmit={submit} className="hud-card hud-corners space-y-3 p-4">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="callsign / name" maxLength={40} className="font-mono" />
        <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="your note…" maxLength={500} rows={3} />
        <div className="flex items-center justify-between">
          <span className="hud-label">{msg.length}/500</span>
          <Button variant="hud" size="sm" disabled={busy} type="submit">
            {busy ? "sending…" : "transmit"}
          </Button>
        </div>
      </form>
      {q.isLoading && <div className="font-mono text-sm text-muted-foreground">loading messages…</div>}
      {q.data && !q.data.length && <Empty label="No transmissions yet. Be the first." />}
      <div className="space-y-2">
        {q.data?.map((e) => (
          <Panel key={e.id} className="animate-fade-up">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm text-primary">{e.name}</span>
              <span className="flex items-center gap-2">
                <span className="hud-label">{formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}</span>
                {adminToken && onDelete && (
                  <button aria-label="Delete entry" className="text-muted-foreground hover:text-destructive" onClick={() => onDelete(e.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </span>
            </div>
            <p className="mt-1 whitespace-pre-line text-sm">{e.message}</p>
          </Panel>
        ))}
      </div>
    </section>
  );
}

export type { SiteData };
