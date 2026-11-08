export const SOCIAL_PLATFORMS = ["instagram", "facebook", "youtube", "x", "tiktok", "bluesky", "reddit", "pinterest", "linkedin", "threads", "tumblr", "vimeo", "twitch", "soundcloud", "spotify", "github", "gitlab", "devto", "medium", "telegram", "discord", "other"] as const;
export type SocialPlatform = typeof SOCIAL_PLATFORMS[number];

const HOSTS: Record<string, string[]> = {
  instagram: ["instagram.com"], facebook: ["facebook.com"], youtube: ["youtube.com", "youtu.be"], x: ["x.com", "twitter.com"],
  tiktok: ["tiktok.com"], bluesky: ["bsky.app"], reddit: ["reddit.com"], pinterest: ["pinterest.com", "pin.it"],
  linkedin: ["linkedin.com"], threads: ["threads.net", "threads.com"], tumblr: ["tumblr.com"], vimeo: ["vimeo.com"],
  twitch: ["twitch.tv"], soundcloud: ["soundcloud.com"], spotify: ["open.spotify.com"], github: ["github.com"],
  gitlab: ["gitlab.com"], devto: ["dev.to"], medium: ["medium.com"], telegram: ["t.me"], discord: ["discord.com", "discord.gg"],
};

export function socialUrl(platform: string, raw: string): URL {
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.username || url.password || url.port) throw new Error("Use a public HTTPS URL.");
  const hosts = HOSTS[platform];
  if (!hosts || !hosts.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`))) throw new Error("URL does not match the selected platform.");
  return url;
}

export function spotifyEntity(raw: string, kind: "user" | "playlist" = "playlist") {
  const value = raw.trim();
  const id = value.startsWith("https://") ? socialUrl("spotify", value).pathname.match(new RegExp(`^/(?:intl-[a-z]+/)?${kind}/([^/]+)`))?.[1] : value.replace(`spotify:${kind}:`, "");
  if (!id || !/^[a-zA-Z0-9._-]{1,100}$/.test(id)) throw new Error(`Enter a Spotify ${kind} ID or link.`);
  return `https://open.spotify.com/${kind}/${id}`;
}

export function socialEmbedSrc(platform: string, raw: string): string | null {
  let url: URL;
  try { url = socialUrl(platform, raw); } catch { return null; }
  const path = url.pathname;
  switch (platform) {
    case "instagram": { const m = path.match(/^\/(p|reel)\/([\w-]+)/); return m ? `https://www.instagram.com/${m[1]}/${m[2]}/embed` : null; }
    case "facebook": return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url.href)}&show_text=true&width=500`;
    case "youtube": { const id = url.searchParams.get("v") || path.match(/\/(?:shorts\/|embed\/)?([\w-]{6,})/)?.[1]; return id ? `https://www.youtube-nocookie.com/embed/${id}` : null; }
    case "tiktok": { const id = path.match(/\/video\/(\d+)/)?.[1]; return id ? `https://www.tiktok.com/player/v1/${id}` : null; }
    case "vimeo": { const id = path.match(/\/(\d+)/)?.[1]; return id ? `https://player.vimeo.com/video/${id}` : null; }
    case "reddit": return path.includes("/comments/") ? `https://www.redditmedia.com${path}?ref_source=embed&ref=share&embed=true` : null;
    case "soundcloud": return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url.href)}&auto_play=false`;
    case "spotify": { const m = path.match(/\/(track|album|playlist|episode|show)\/([\w]+)/); return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}` : null; }
    case "telegram": return /^\/[\w]+\/\d+/.test(path) ? `https://t.me${path}?embed=1` : null;
    default: return null;
  }
}