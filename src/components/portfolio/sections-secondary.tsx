import { useMemo, useState, type CSSProperties } from "react";
import { Award, BadgeCheck, Trophy } from "lucide-react";
import type { SiteData } from "@/lib/content";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Empty, ExtLink, Panel, Progress, SectionTitle, detectPlatform } from "./common";

export function ResourcesSection({ data }: { data: SiteData }) {
  const cats = useMemo(() => Array.from(new Set(data.resources.map((r) => r.category || "Misc"))), [data.resources]);
  const [cat, setCat] = useState<string>("all");
  const list = data.resources.filter((r) => cat === "all" || (r.category || "Misc") === cat);
  return (
    <section>
      <SectionTitle code="07 // RESOURCES" title="Arsenal" />
      <div className="mb-3 flex flex-wrap gap-1.5">
        {["all", ...cats].map((c) => (
          <button key={c} className="tab-pill" data-active={cat === c} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>
      {!list.length && <Empty />}
      <div className="grid gap-2 sm:grid-cols-2">
        {list.map((r) => {
          const { Icon } = detectPlatform(r.url);
          return (
            <ExtLink key={r.id} href={r.url} className="hud-card flex gap-3 p-3 hover:border-primary/60">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.title}</span>
                  <span className="hud-badge">{r.category}</span>
                </div>
                <p className="text-xs text-muted-foreground">{r.description}</p>
              </div>
            </ExtLink>
          );
        })}
      </div>
    </section>
  );
}

export function AchievementsSection({ data }: { data: SiteData }) {
  const icons = { Certificate: BadgeCheck, Award: Award, Competition: Trophy };
  return (
    <section>
      <SectionTitle code="08 // ACHIEVEMENTS" title="Commendations" />
      {!data.achievements.length && <Empty />}
      <div className="grid gap-3 md:grid-cols-2">
        {data.achievements.map((a) => {
          const Icon = icons[a.kind] ?? Award;
          return (
            <Panel key={a.id} className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-signal/50 bg-signal/10 text-signal">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 space-y-1">
                <h3 className="font-semibold leading-tight">{a.title}</h3>
                <div className="flex flex-wrap gap-1.5">
                  <span className="hud-badge">{a.issuer}</span>
                  <span className="hud-badge">{a.date}</span>
                  <span className="hud-badge hud-badge-signal">{a.kind}</span>
                </div>
                <p className="text-sm text-muted-foreground">{a.description}</p>
                {a.url && (
                  <ExtLink href={a.url} className="font-mono text-xs text-primary hover:underline">
                    verify credential ↗
                  </ExtLink>
                )}
              </div>
            </Panel>
          );
        })}
      </div>
    </section>
  );
}

export function SkillsSection({ data }: { data: SiteData }) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <section className="space-y-4">
      <SectionTitle code="09 // SKILLS" title="Capability matrix" />
      <div className="grid gap-4 md:grid-cols-2">
        {data.skills.groups.map((g) => {
          const avg = g.items.length ? Math.round(g.items.reduce((s, i) => s + i.level, 0) / g.items.length) : 0;
          return (
            <Panel key={g.id}>
              <div className="mb-3 flex items-center justify-between">
                <span className="hud-label">{g.name}</span>
                <span className="font-mono text-sm text-primary">{avg}%</span>
              </div>
              <div className="space-y-3">
                {g.items.map((s) => (
                  <div key={s.name}>
                    <div className="mb-1 flex justify-between font-mono text-xs">
                      <span>{s.name}</span>
                      <span className="text-muted-foreground">{s.level}%</span>
                    </div>
                    <Progress value={s.level} />
                  </div>
                ))}
              </div>
            </Panel>
          );
        })}
      </div>
      <Panel>
        <div className="hud-label mb-3">Tag cloud</div>
        <div className="flex flex-wrap gap-2">
          {data.skills.badges.map((b) => (
            <button
              key={b}
              onClick={() => setActive(active === b ? null : b)}
              className={`hud-badge transition-colors hover:border-primary/60 hover:text-primary ${active === b ? "hud-badge-primary" : ""}`}
            >
              {b}
            </button>
          ))}
        </div>
      </Panel>
    </section>
  );
}

export function TimelineSection({ data }: { data: SiteData }) {
  const items = [...data.timeline].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <section>
      <SectionTitle code="10 // TIMELINE" title="Flight log" />
      {!items.length && <Empty />}
      <ol className="relative ml-2 space-y-4 border-l border-border pl-6">
        {items.map((t) => (
          <li key={t.id} className="relative">
            <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-primary">{t.date}</span>
              <span className={`hud-badge ${t.kind === "career" ? "hud-badge-primary" : t.kind === "education" ? "hud-badge-signal" : ""}`}>
                {t.kind}
              </span>
            </div>
            <h3 className="mt-1 font-semibold">{t.title}</h3>
            <p className="text-sm text-muted-foreground">{t.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function GoalsSection({ data }: { data: SiteData }) {
  return (
    <section>
      <SectionTitle code="11 // GOALS" title="Objectives" />
      {!data.goals.length && <Empty />}
      <div className="grid gap-3 md:grid-cols-2">
        {data.goals.map((g) => (
          <Panel key={g.id}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="font-medium">{g.title}</h3>
              <span className={`hud-badge ${g.progress >= 100 ? "hud-badge-primary" : ""}`}>{g.category}</span>
            </div>
            {g.description && <p className="mb-2 text-sm text-muted-foreground">{g.description}</p>}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Progress value={g.progress} />
              </div>
              <span className="font-mono text-xs text-primary">{g.progress >= 100 ? "DONE" : `${g.progress}%`}</span>
            </div>
          </Panel>
        ))}
      </div>
    </section>
  );
}

export function SetupSection({ data }: { data: SiteData }) {
  return (
    <section>
      <SectionTitle code="12 // SETUP" title="Workstation" />
      <div className="grid gap-4 md:grid-cols-2">
        {data.setup.groups.map((g) => (
          <Panel key={g.id}>
            <div className="hud-label mb-2">{g.title}</div>
            <dl className="divide-y divide-border">
              {g.items.map((it, i) => (
                <div key={i} className="flex justify-between gap-4 py-2 text-sm">
                  <dt className="font-mono text-muted-foreground">{it.label}</dt>
                  <dd className="text-right">{it.value}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        ))}
      </div>
    </section>
  );
}

export function AlbumSection({ data }: { data: SiteData }) {
  const [open, setOpen] = useState<string | null>(null);
  const item = data.album.find((a) => a.id === open);
  return (
    <section>
      <SectionTitle code="13 // ALBUM" title="Gallery" />
      {!data.album.length && <Empty />}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {data.album.map((a) => {
          const hue = { "--hue": a.hue } as CSSProperties;
          return (
            <button key={a.id} onClick={() => setOpen(a.id)} className="hud-card group overflow-hidden text-left" style={hue}>
              {a.image ? (
                <img src={a.image} alt={a.title} loading="lazy" className="aspect-square w-full object-cover transition-transform group-hover:scale-[1.03]" />
              ) : (
                <div
                  className="hud-gridbg flex aspect-square items-center justify-center font-mono text-xs"
                  style={{ background: `linear-gradient(135deg, hsl(var(--hue) 60% 50% / 0.25), transparent)`, color: `hsl(var(--hue) 80% 60%)` }}
                >
                  [{a.kind}]
                </div>
              )}
              <div className="flex items-center justify-between gap-2 p-2">
                <span className="truncate text-sm">{a.title}</span>
                <span
                  className="hud-badge"
                  style={{ color: `hsl(var(--hue) 80% 60%)`, borderColor: `hsl(var(--hue) 70% 50% / 0.5)` }}
                >
                  {a.kind}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      {item && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-background/90 p-4" onClick={() => setOpen(null)}>
          <div className="hud-card hud-corners max-w-3xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {item.image && <img src={item.image} alt={item.title} className="max-h-[70vh] w-full object-contain" />}
            <div className="p-4">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.caption}</p>
              <button className="hud-label mt-3 hover:text-primary" onClick={() => setOpen(null)}>
                [close]
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function FaqSection({ data }: { data: SiteData }) {
  return (
    <section>
      <SectionTitle code="16 // FAQ" title="Frequently asked" />
      {!data.faq.length && <Empty />}
      <Accordion type="single" collapsible className="hud-card px-4">
        {data.faq.map((f) => (
          <AccordionItem key={f.id} value={f.id}>
            <AccordionTrigger className="text-left font-medium">{f.q}</AccordionTrigger>
            <AccordionContent className="whitespace-pre-line text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
