import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, BookOpen, Code2, Eye, GraduationCap, Hammer, Heart, Star, Target, Users, type LucideIcon } from "lucide-react";
import type { SiteData } from "@/lib/content";
import { Empty, ExtLink, Panel, SectionTitle, detectPlatform, handleFromUrl } from "./common";

export function AboutSection({ data }: { data: SiteData }) {
  const a = data.about;
  return (
    <section className="space-y-4">
      <Panel className="hud-corners">
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Overview</h2>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{a.overview}</p>
        {a.philosophy && (
          <blockquote className="mt-4 border-l-2 border-primary pl-4 font-mono text-sm text-primary">“{a.philosophy}”</blockquote>
        )}
      </Panel>
      <div className="grid gap-4 md:grid-cols-2">
        {a.blocks.map((b) => (
          <Panel key={b.id} className={b.fullWidth ? "md:col-span-2" : ""}>
            <div className="hud-label mb-1">{b.title}</div>
            <p className="whitespace-pre-line text-sm leading-relaxed">{b.body}</p>
          </Panel>
        ))}
        {a.grids.map((g) => (
          <Panel key={g.id}>
            <div className="hud-label mb-3">{g.title}</div>
            <div className="grid grid-cols-2 gap-2">
              {g.items.map((it, i) => (
                <div key={i} className="rounded-md border bg-surface px-3 py-2">
                  <div className="hud-label">{it.label}</div>
                  <div className="font-mono text-lg text-primary">{it.value}</div>
                </div>
              ))}
            </div>
          </Panel>
        ))}
        {a.lists.map((l) => (
          <Panel key={l.id}>
            <div className="hud-label mb-2">{l.title}</div>
            <ul className="space-y-1 text-sm">
              {l.items.map((it, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-mono text-primary">›</span> {it}
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </section>
  );
}

function LinkIcon({ favicon, Icon }: { favicon: string; Icon: LucideIcon }) {
  const [failed, setFailed] = useState(false);
  if (favicon && !failed) {
    return <img src={favicon} alt="" loading="lazy" className="h-5 w-5 object-contain" onError={() => setFailed(true)} />;
  }
  return <Icon className="h-4 w-4" />;
}

export function LinksSection({ data }: { data: SiteData }) {
  const groups = ["dev", "social", "gaming", "other"] as const;
  return (
    <section>
      <SectionTitle code="02 // LINKS" title="Uplinks" />
      {!data.links.length && <Empty />}
      <div className="space-y-5">
        {groups.map((g) => {
          const items = data.links.filter((l) => l.category === g);
          if (!items.length) return null;
          return (
            <div key={g}>
              <div className="hud-label mb-2">[{g}]</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {items.map((l) => {
                  const { Icon, name } = detectPlatform(l.url);
                  return (
                    <ExtLink
                      key={l.id}
                      href={l.url}
                      className="hud-card group flex items-center gap-3 p-3 transition-colors hover:border-primary/60"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-surface text-primary">
                        <LinkIcon key={l.favicon} favicon={l.favicon} Icon={Icon} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{l.title}</span>
                        <span className="block truncate font-mono text-xs text-muted-foreground">
                          {l.handle || handleFromUrl(l.url)} · {name}
                        </span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                    </ExtLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

interface GhUser {
  login: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  avatar_url: string;
  html_url: string;
}
interface GhRepo {
  id: number;
  name: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  html_url: string;
}

function embedSrc(platform: string, url: string) {
  if (platform === "instagram") {
    const m = url.match(/instagram\.com\/(p|reel)\/([^/?#]+)/);
    return m ? `https://www.instagram.com/${m[1]}/${m[2]}/embed` : null;
  }
  if (platform === "facebook") return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&show_text=true&width=500`;
  if (platform === "youtube") {
    const m = url.match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{6,})/);
    return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
  }
  return null;
}

export function SocialSection({ data }: { data: SiteData }) {
  const user = data.social.githubUser;
  const gh = useQuery({
    queryKey: ["github", user],
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const [u, r] = await Promise.all([
        fetch(`https://api.github.com/users/${user}`).then((x) => (x.ok ? (x.json() as Promise<GhUser>) : Promise.reject(new Error("gh")))),
        fetch(`https://api.github.com/users/${user}/repos?sort=updated&per_page=6`).then((x) => (x.ok ? (x.json() as Promise<GhRepo[]>) : [])),
      ]);
      return { u, r };
    },
  });
  return (
    <section className="space-y-4">
      <SectionTitle code="03 // SOCIAL" title="Signal feed" />
      {user && (
        <Panel className="hud-corners">
          {gh.isLoading && <div className="font-mono text-sm text-muted-foreground">fetching github telemetry…</div>}
          {gh.isError && <div className="font-mono text-sm text-signal">github api rate-limited or user not found.</div>}
          {gh.data && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img src={gh.data.u.avatar_url} alt="" className="h-14 w-14 rounded-md border" loading="lazy" />
                <div className="min-w-0 flex-1">
                  <ExtLink href={gh.data.u.html_url} className="font-semibold hover:text-primary">
                    {gh.data.u.name ?? gh.data.u.login}
                  </ExtLink>
                  <p className="text-sm text-muted-foreground">{gh.data.u.bio}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["Repos", gh.data.u.public_repos, Code2],
                  ["Followers", gh.data.u.followers, Users],
                  ["Following", gh.data.u.following, Eye],
                ].map(([l, v, I]) => {
                  const Icon = I as typeof Code2;
                  return (
                    <div key={l as string} className="rounded-md border bg-surface p-3">
                      <div className="hud-label flex items-center gap-1">
                        <Icon className="h-3 w-3" /> {l as string}
                      </div>
                      <div className="font-mono text-xl text-primary">{v as number}</div>
                    </div>
                  );
                })}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {gh.data.r.map((r) => (
                  <ExtLink key={r.id} href={r.html_url} className="rounded-md border bg-surface p-3 hover:border-primary/60">
                    <div className="flex items-center justify-between font-mono text-sm">
                      <span className="truncate">{r.name}</span>
                      <span className="flex items-center gap-1 text-xs text-signal">
                        <Star className="h-3 w-3" /> {r.stargazers_count}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.description ?? "—"}</p>
                    {r.language && <span className="hud-badge mt-2">{r.language}</span>}
                  </ExtLink>
                ))}
              </div>
            </div>
          )}
        </Panel>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {data.social.embeds.map((e) => {
          const src = embedSrc(e.platform, e.url);
          return (
            <Panel key={e.id}>
              <div className="hud-label mb-2">{e.platform}</div>
              {src ? (
                <iframe
                  src={src}
                  title={e.caption || e.platform}
                  loading="lazy"
                  className="h-[420px] w-full rounded-md border bg-surface"
                  allow="encrypted-media; picture-in-picture"
                />
              ) : (
                <ExtLink href={e.url} className="block truncate font-mono text-sm text-primary hover:underline">
                  {e.url}
                </ExtLink>
              )}
              {e.caption && <p className="mt-2 text-sm text-muted-foreground">{e.caption}</p>}
            </Panel>
          );
        })}
      </div>
    </section>
  );
}

const STATUS_CLASS: Record<string, string> = {
  Live: "hud-badge-primary",
  Deployed: "hud-badge-primary",
  Active: "hud-badge-primary",
  Beta: "hud-badge-signal",
  Archived: "",
};

export function ProjectsSection({ data }: { data: SiteData }) {
  return (
    <section>
      <SectionTitle code="04 // PROJECTS" title="Deployments" />
      {!data.projects.length && <Empty />}
      <div className="grid gap-4 md:grid-cols-2">
        {data.projects.map((p) => (
          <article key={p.id} className="hud-card group overflow-hidden transition-colors hover:border-primary/60">
            {p.image ? (
              <img src={p.image} alt={p.title} loading="lazy" className="aspect-video w-full border-b object-cover" />
            ) : (
              <div className="hud-gridbg flex aspect-video items-center justify-center border-b bg-surface font-mono text-xs text-muted-foreground">
                [{p.category.toUpperCase()}]
              </div>
            )}
            <div className="space-y-2 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">{p.title}</h3>
                <span className={`hud-badge ${STATUS_CLASS[p.status] ?? ""}`}>
                  <span className="status-dot" /> {p.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{p.description}</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="hud-badge hud-badge-signal">{p.category}</span>
                {p.tags.map((t) => (
                  <span key={t} className="hud-badge">
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex gap-3 pt-1 font-mono text-xs">
                {p.url && (
                  <ExtLink href={p.url} className="text-primary hover:underline">
                    visit ↗
                  </ExtLink>
                )}
                {p.repo && (
                  <ExtLink href={p.repo} className="text-muted-foreground hover:text-primary">
                    source ↗
                  </ExtLink>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function GamingSection({ data }: { data: SiteData }) {
  const total = data.games.reduce((s, g) => s + (g.hours || 0), 0);
  return (
    <section>
      <SectionTitle code="05 // GAMING" title="Game log">
        <span className="hud-badge">{total.toLocaleString()} hrs logged</span>
      </SectionTitle>
      {!data.games.length && <Empty />}
      <div className="grid gap-3 sm:grid-cols-2">
        {data.games.map((g) => (
          <div key={g.id} className="hud-card flex gap-3 p-3">
            {g.image ? (
              <img src={g.image} alt="" loading="lazy" className="h-20 w-16 shrink-0 rounded-md border object-cover" />
            ) : (
              <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-md border bg-surface font-mono text-xs text-muted-foreground">
                {g.platform}
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-semibold">{g.title}</h3>
                {g.favorite && <Heart className="h-3.5 w-3.5 shrink-0 fill-signal text-signal" aria-label="Favorite" />}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="hud-badge">{g.platform}</span>
                <span className={`hud-badge ${g.status === "Playing" ? "hud-badge-primary" : g.status === "Completed" ? "hud-badge-signal" : ""}`}>
                  {g.status}
                </span>
                <span className="hud-badge">{g.hours}h</span>
                <span className="hud-badge hud-badge-primary">{g.rating}/10</span>
              </div>
              {g.review && <p className="line-clamp-2 text-xs text-muted-foreground">{g.review}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function NowSection({ data }: { data: SiteData }) {
  const n = data.now;
  const tone = n.availability === "open" ? "hud-badge-primary" : n.availability === "busy" ? "hud-badge-signal" : "";
  const rows = [
    ["Focus", n.focus, Target],
    ["Building", n.building, Hammer],
    ["Learning", n.learning, GraduationCap],
    ["Reading", n.reading, BookOpen],
    ["Watching", n.watching, Eye],
  ] as const;
  return (
    <section>
      <SectionTitle code="06 // NOW" title="What I'm doing now">
        <span className="hud-label">updated {n.updated}</span>
      </SectionTitle>
      <Panel className="hud-corners mb-4 flex items-center gap-3">
        <span className={`hud-badge ${tone}`}>
          <span className="status-dot" /> {n.availability}
        </span>
        <span>{n.availabilityText}</span>
      </Panel>
      <div className="grid gap-3 sm:grid-cols-2">
        {rows
          .filter(([, v]) => v)
          .map(([l, v, Icon]) => (
            <Panel key={l} className="flex items-start gap-3">
              <Icon className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <div className="hud-label">{l}</div>
                <div className="text-sm">{v}</div>
              </div>
            </Panel>
          ))}
      </div>
    </section>
  );
}
