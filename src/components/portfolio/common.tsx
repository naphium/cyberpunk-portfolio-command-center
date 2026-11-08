import type { ReactNode } from "react";
import {
  Codepen,
  Dribbble,
  Facebook,
  Figma,
  Gamepad2,
  Github,
  Gitlab,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MessageCircle,
  Music2,
  Send,
  Slack,
  Twitch,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";

export function SectionTitle({ code, title, children }: { code: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col items-center gap-2 text-center">
      <div>
        <div className="hud-label">{code}</div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`hud-card p-4 ${className}`}>{children}</div>;
}

export function Empty({ label = "No entries yet." }: { label?: string }) {
  return <div className="hud-card p-8 text-center font-mono text-sm text-muted-foreground">// {label}</div>;
}

export function Progress({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="progress-track" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-fill" style={{ width: `${v}%` }} />
    </div>
  );
}

const PLATFORMS: [RegExp, LucideIcon, string][] = [
  [/github\.com/i, Github, "GitHub"],
  [/gitlab\.com/i, Gitlab, "GitLab"],
  [/linkedin\.com/i, Linkedin, "LinkedIn"],
  [/instagram\.com/i, Instagram, "Instagram"],
  [/facebook\.com|fb\.com/i, Facebook, "Facebook"],
  [/twitter\.com|x\.com/i, Twitter, "X"],
  [/youtube\.com|youtu\.be/i, Youtube, "YouTube"],
  [/twitch\.tv/i, Twitch, "Twitch"],
  [/discord\.(com|gg)/i, MessageCircle, "Discord"],
  [/steam(community|powered)\.com|epicgames|xbox|playstation|riotgames/i, Gamepad2, "Gaming"],
  [/dribbble\.com/i, Dribbble, "Dribbble"],
  [/figma\.com/i, Figma, "Figma"],
  [/codepen\.io/i, Codepen, "CodePen"],
  [/slack\.com/i, Slack, "Slack"],
  [/t\.me|telegram/i, Send, "Telegram"],
  [/spotify\.com|soundcloud/i, Music2, "Music"],
  [/^mailto:/i, Mail, "Email"],
];

export function detectPlatform(url: string): { Icon: LucideIcon; name: string } {
  for (const [re, Icon, name] of PLATFORMS) if (re.test(url)) return { Icon, name };
  return { Icon: Globe, name: "Web" };
}

export function handleFromUrl(url: string) {
  try {
    const u = new URL(url);
    const seg = u.pathname.split("/").filter(Boolean)[0];
    return seg ? `@${seg}` : u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function ExtLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  if (!href) return <span className={className}>{children}</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}
