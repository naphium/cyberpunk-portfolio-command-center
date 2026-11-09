import { useEffect, useState } from "react";
import { Mail, Moon, Sun } from "lucide-react";
import type { SiteData } from "@/lib/content";

function initials(name: string) {
  return name
    .replace(/^(md\.?|mr\.?|dr\.?)\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function fmt(d: Date | null, tz: string) {
  if (!d) return "--:--:--";
  try {
    return d.toLocaleTimeString("en-GB", { timeZone: tz, hour12: false });
  } catch {
    return d.toLocaleTimeString("en-GB", { hour12: false });
  }
}

// Isolated so only the clock re-renders every second.
function Clock({ tz }: { tz: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{fmt(now, tz)}</span>;
}

function dms(v: number, pos: string, neg: string) {
  const a = Math.abs(v);
  const d = Math.floor(a);
  const m = Math.floor((a - d) * 60);
  const s = Math.round(((a - d) * 60 - m) * 60);
  return `${d}°${String(m).padStart(2, "0")}'${String(s).padStart(2, "0")}"${v >= 0 ? pos : neg}`;
}

interface DiscordInfo {
  status: string;
  name?: string | undefined;
  avatar?: string | undefined;
  activity?: string | undefined;
}

function Presence({ data }: { data: SiteData }) {
  const p = data.profile;
  const [i, setI] = useState(0);
  const [discord, setDiscord] = useState<DiscordInfo | null>(null);

  useEffect(() => {
    if (p.presenceMode !== "custom" || p.presenceStates.length < 2) return;
    const id = setInterval(() => setI((x) => (x + 1) % p.presenceStates.length), 4000);
    return () => clearInterval(id);
  }, [p.presenceMode, p.presenceStates.length]);

  useEffect(() => {
    if (p.presenceMode !== "discord" || !p.discordId) return;
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch(`https://api.lanyard.rest/v1/users/${encodeURIComponent(p.discordId)}`);
        const j = (await r.json()) as {
          success: boolean;
          data?: {
            discord_status: string;
            listening_to_spotify?: boolean;
            discord_user?: { id: string; avatar?: string; global_name?: string; username?: string };
            activities?: { name: string; type: number; details?: string }[];
          };
        };
        if (!alive || !j.success || !j.data) return;
        const u = j.data.discord_user;
        const act = j.data.listening_to_spotify ? "Listening to Spotify" : j.data.activities?.find((a) => a.type !== 4)?.name;
        setDiscord({
          status: j.data.discord_status,
          activity: act,
          name: u?.global_name || u?.username,
          avatar: u?.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=128` : undefined,
        });
      } catch {
        /* ignore */
      }
    };
    void load();
    const id = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [p.presenceMode, p.discordId]);

  const isDiscord = p.presenceMode === "discord";
  const status = isDiscord
    ? (discord?.status ?? "offline")
    : (p.presenceStates[i % Math.max(1, p.presenceStates.length)] ?? "Online");
  const activity = isDiscord ? discord?.activity || "Not doing anything right now" : `Currently ${status.toLowerCase()}`;
  const name = (isDiscord && discord?.name) || p.nickname || p.handle;
  const pic = (isDiscord && discord?.avatar) || p.avatarUrl;

  const Avatar = ({ cls }: { cls: string }) =>
    pic ? (
      <img src={pic} alt="" className={`${cls} object-cover`} loading="lazy" />
    ) : (
      <span className={`${cls} flex items-center justify-center bg-primary text-xs font-bold text-primary-foreground`}>
        {initials(p.name)}
      </span>
    );

  return (
    <div className="mx-auto w-full max-w-sm space-y-2 text-left">
      <div className="flex min-w-0 items-center gap-2 font-mono text-xs">
        <Avatar cls="h-6 w-6 shrink-0 rounded-full" />
        <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground" />
        <span className="truncate">
          {name} · {status.toLowerCase()}
        </span>
      </div>
      <div className="flex min-w-0 items-center gap-3">
        <Avatar cls="h-11 w-11 shrink-0 rounded-md" />
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{isDiscord ? "Discord" : "Status"}</div>
          <div className="truncate text-sm font-medium">{activity}</div>
          <div className="text-xs text-muted-foreground">{status.toLowerCase()}</div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  data: SiteData;
  mode: "dark" | "light";
  onToggleTheme: () => void;
  onContacts: () => void;
}

export function Header({ data, mode, onToggleTheme, onContacts }: Props) {
  const p = data.profile;
  const nick = (p.nickname || "").split("").join(" ");

  return (
    <header className="hud-card overflow-hidden">
      {/* Banner: image if set, otherwise a fading blueprint grid */}
      <div className="relative h-32 sm:h-40">
        {p.bannerUrl ? (
          <img src={p.bannerUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="banner-grid h-full w-full" aria-hidden />
        )}
        <span className="absolute left-3 top-3 font-mono sm:bottom-2 sm:top-auto text-[10px] text-muted-foreground sm:text-[11px]">
          {dms(p.lat, "N", "S")} {dms(p.lng, "E", "W")}
        </span>
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border bg-card/80 text-foreground transition-colors hover:bg-accent"
        >
          {mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex flex-col items-center gap-3 px-4 pb-7 text-center sm:px-8">
        <div id="avatar" role="button" tabIndex={0} aria-label="Profile avatar" className="relative -mt-16 shrink-0 cursor-pointer sm:-mt-20">
          {p.avatarUrl ? (
            <img
              src={p.avatarUrl}
              alt={p.name}
              className="h-24 w-24 rounded-full border-4 border-card object-cover shadow-lg sm:h-28 sm:w-28"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-card bg-primary text-3xl font-bold text-primary-foreground shadow-lg sm:h-28 sm:w-28">
              {initials(p.name)}
            </div>
          )}
          <span className="absolute bottom-2 right-2 h-3.5 w-3.5 rounded-full border-2 border-card bg-signal" aria-hidden />
        </div>

        <div className="w-full min-w-0 space-y-1">
          <h1 id="profile-title" tabIndex={0} className="text-3xl font-bold tracking-tight sm:text-5xl">{p.name}</h1>
          <p className="font-mono text-[11px] text-muted-foreground sm:text-xs">
            {nick && `(${nick}) · `}@{p.handle}
          </p>
          <p className="font-mono text-[11px] text-muted-foreground sm:text-xs">
            {p.location} · <Clock tz={p.timezone} /> {p.tzLabel}
          </p>
        </div>

        {p.tagline && <p className="pt-1 text-base font-medium sm:text-lg">{p.tagline}</p>}
        {p.bio && <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{p.bio}</p>}

        <button
          type="button"
          onClick={onContacts}
          className="mt-1 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-opacity hover:opacity-90"
        >
          <Mail className="h-4 w-4" /> Contact
        </button>

        <div className="mt-4 w-full">
          <Presence data={data} />
        </div>
      </div>
    </header>
  );
}
