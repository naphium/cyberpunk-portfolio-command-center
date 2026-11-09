// Single source of truth for every piece of portfolio content, setting and theme.
// The whole document is stored as one JSON row; mergeData() upgrades older or
// partial documents so new fields always have a value.

export const TAB_IDS = [
  "about",
  "links",
  "social",
  "projects",
  "gaming",
  "now",
  "resources",
  "achievements",
  "skills",
  "timeline",
  "goals",
  "setup",
  "album",
  "audio",
  "guestbook",
  "faq",
] as const;
export type TabId = (typeof TAB_IDS)[number];

export interface TabConfig {
  id: TabId;
  label: string;
  visible: boolean;
}

export interface Profile {
  name: string;
  handle: string;
  nickname: string;
  tagline: string;
  bio: string;
  tzLabel: string;
  location: string;
  lat: number;
  lng: number;
  timezone: string;
  avatarUrl: string;
  bannerUrl: string;
  email: string;
  siteUrl: string;
  sourceUrl: string;
  pgpKey: string;
  sshKey: string;
  discordId: string;
  presenceMode: "discord" | "custom";
  presenceStates: string[];
}

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  primary: string;
  accent: string;
  text: string;
  muted: string;
  border: string;
}

export interface Theme {
  preset: string;
  defaultMode: "dark" | "light";
  dark: ThemeColors;
  light: ThemeColors;
  fontSans: string;
  fontMono: string;
  radius: number;
  cardBorders: boolean;
}

export interface Settings {
  maintenance: { enabled: boolean; message: string };
  announcement: { enabled: boolean; text: string; link: string };
  customCss: string;
  awayTitle: { enabled: boolean; text: string };
  readingProgress: boolean;
  disableRightClick: boolean;
  disableSelection: boolean;
  effects: {
    reducedMotion: boolean;
    easterEggs: boolean;
    background: boolean;
    scanlines: boolean;
    blinkCursor: boolean;
    glitch: boolean;
    customCursor: boolean;
    fpsCounter: boolean;
    consoleBanner: boolean;
    konami: boolean;
    matrixGlyphs: "katakana" | "binary" | "mixed";
  };
  terminal: {
    enabled: boolean;
    hotkey: string;
    prompt: string;
    motd: string;
    customCommands: { id: string; name: string; output: string }[];
  };
}

export interface KV {
  label: string;
  value: string;
}
export interface TextBlock {
  id: string;
  title: string;
  body: string;
  fullWidth: boolean;
}
export interface Grid {
  id: string;
  title: string;
  items: KV[];
}
export interface ListBlock {
  id: string;
  title: string;
  items: string[];
}

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  category: "dev" | "social" | "gaming" | "other";
  handle: string;
  favicon: string;
}
export interface SocialEmbed {
  id: string;
  platform: "instagram" | "facebook" | "x" | "youtube" | "other";
  url: string;
  caption: string;
}
export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  status: "Live" | "Beta" | "Active" | "Deployed" | "Archived";
  url: string;
  repo: string;
  image: string;
}
export interface Game {
  id: string;
  title: string;
  platform: "PC" | "Console" | "Mobile";
  status: "Playing" | "Completed" | "Dropped" | "Backlog";
  hours: number;
  rating: number;
  review: string;
  favorite: boolean;
  image: string;
}
export interface NowInfo {
  availability: "open" | "busy" | "away";
  availabilityText: string;
  focus: string;
  building: string;
  learning: string;
  reading: string;
  watching: string;
  updated: string;
}
export interface Resource {
  id: string;
  title: string;
  url: string;
  category: string;
  description: string;
}
export interface Achievement {
  id: string;
  title: string;
  issuer: string;
  date: string;
  kind: "Certificate" | "Award" | "Competition";
  description: string;
  url: string;
}
export interface SkillItem {
  name: string;
  level: number;
}
export interface SkillGroup {
  id: string;
  name: string;
  items: SkillItem[];
}
export interface TimelineItem {
  id: string;
  date: string;
  title: string;
  kind: "career" | "hobby" | "education";
  description: string;
}
export interface Goal {
  id: string;
  title: string;
  category: "personal" | "professional";
  description: string;
  progress: number;
}
export interface AlbumItem {
  id: string;
  title: string;
  image: string;
  kind: "photo" | "sketch" | "vector";
  hue: number;
  caption: string;
}
export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  notes: number[];
  bpm: number;
  wave: "square" | "sawtooth" | "triangle" | "sine";
}
export interface FaqItem {
  id: string;
  q: string;
  a: string;
}

export interface SiteData {
  version: number;
  profile: Profile;
  tabs: TabConfig[];
  theme: Theme;
  settings: Settings;
  about: {
    overview: string;
    philosophy: string;
    blocks: TextBlock[];
    grids: Grid[];
    lists: ListBlock[];
  };
  links: LinkItem[];
  social: { githubUser: string; embeds: SocialEmbed[] };
  projects: Project[];
  games: Game[];
  now: NowInfo;
  resources: Resource[];
  achievements: Achievement[];
  skills: { groups: SkillGroup[]; badges: string[] };
  timeline: TimelineItem[];
  goals: Goal[];
  setup: { groups: Grid[] };
  album: AlbumItem[];
  audio: { autoplay: boolean; shuffle: boolean; volume: number; tracks: Track[] };
  faq: FaqItem[];
}

export const TAB_LABELS: Record<TabId, string> = {
  about: "About",
  links: "Links",
  social: "Social",
  projects: "Projects",
  gaming: "Gaming",
  now: "Now",
  resources: "Resources",
  achievements: "Achievements",
  skills: "Skills",
  timeline: "Timeline",
  goals: "Goals",
  setup: "Setup",
  album: "Album",
  audio: "Tracks",
  guestbook: "Guestbook",
  faq: "FAQ",
};

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createDefaultData(): SiteData {
  // Deterministic ids for defaults so server and client renders agree.
  let seq = 0;
  const uid = (p: string) => `${p}_d${++seq}`;
  return {
    version: 1,
    profile: {
      name: "Md. Nafim Muttaki",
      handle: "naphium",
      nickname: "nafim",
      tagline: "Student · Web engineer · Firmware tinkerer",
      bio: "Building fast web tools, tiny firmware and clean visual identities. I like software that loads instantly and gets out of the way.",
      tzLabel: "BST",
      location: "Dhaka, Bangladesh",
      lat: 23.8103,
      lng: 90.4125,
      timezone: "Asia/Dhaka",
      avatarUrl: "",
      bannerUrl: "",
      email: "hello@example.com",
      siteUrl: "",
      sourceUrl: "https://github.com/",
      pgpKey: "-----BEGIN PGP PUBLIC KEY BLOCK-----\n(add your public key in the admin panel)\n-----END PGP PUBLIC KEY BLOCK-----",
      sshKey: "ssh-ed25519 AAAA... naphium@hud",
      discordId: "",
      presenceMode: "custom",
      presenceStates: ["Coding", "Listening", "Idle"],
    },
    tabs: TAB_IDS.map((id) => ({ id, label: TAB_LABELS[id], visible: true })),
    theme: {
      preset: "glass",
      defaultMode: "dark",
      dark: { background: "#0a0a0a", surface: "#171717", card: "#111111", primary: "#f5f5f5", accent: "#f5a524", text: "#fafafa", muted: "#a1a1a1", border: "#262626" },
      light: { background: "#f7f7f7", surface: "#ededed", card: "#ffffff", primary: "#111111", accent: "#d97706", text: "#171717", muted: "#666666", border: "#e0e0e0" },
      fontSans: "Geist",
      fontMono: "JetBrains Mono",
      radius: 6,
      cardBorders: true,
    },
    settings: {
      maintenance: { enabled: false, message: "System offline for maintenance. Back shortly." },
      announcement: { enabled: false, text: "", link: "" },
      customCss: "",
      awayTitle: { enabled: true, text: "// signal lost — come back" },
      readingProgress: true,
      disableRightClick: false,
      disableSelection: false,
      effects: {
        reducedMotion: false,
        easterEggs: true,
        background: true,
        scanlines: false,
        blinkCursor: true,
        glitch: true,
        customCursor: false,
        fpsCounter: true,
        consoleBanner: true,
        konami: true,
        matrixGlyphs: "katakana",
      },
      terminal: {
        enabled: true,
        hotkey: "`",
        prompt: "guest@naphium:~$",
        motd: "NAPHIUM-OS v2.6 — tactical shell\nType 'help' to list commands.",
        customCommands: [{ id: uid("cmd"), name: "coffee", output: "☕ brewing... caffeine levels nominal." }],
      },
    },
    about: {
      overview:
        "I build fast, resilient software — from web dashboards to tiny firmware running on microcontrollers. I like interfaces that feel like instruments: dense, precise, and responsive.",
      philosophy: "Ship small. Measure everything. Make it fast on the cheapest phone first.",
      blocks: [
        {
          id: uid("blk"),
          title: "Currently",
          body: "Studying, building side projects, and learning embedded systems on weekends.",
          fullWidth: false,
        },
        {
          id: uid("blk"),
          title: "Approach",
          body: "Performance budgets, accessible defaults, and boring reliable infrastructure.",
          fullWidth: false,
        },
      ],
      grids: [
        {
          id: uid("grd"),
          title: "Metrics",
          items: [
            { label: "Projects", value: "24+" },
            { label: "Commits / yr", value: "1.2k" },
            { label: "Coffee / day", value: "3" },
            { label: "Uptime", value: "99.9%" },
          ],
        },
        {
          id: uid("grd"),
          title: "Academics",
          items: [
            { label: "Field", value: "Computer Science" },
            { label: "Focus", value: "Systems & Web" },
          ],
        },
      ],
      lists: [{ id: uid("lst"), title: "Interests", items: ["Embedded systems", "Chiptune", "Typography", "Open source"] }],
    },
    links: [
      { id: uid("lnk"), title: "GitHub", url: "https://github.com/", category: "dev", handle: "@naphium", favicon: "" },
      { id: uid("lnk"), title: "LinkedIn", url: "https://linkedin.com/", category: "social", handle: "nafim-muttaki", favicon: "" },
      { id: uid("lnk"), title: "Instagram", url: "https://instagram.com/", category: "social", handle: "@naphium", favicon: "" },
      { id: uid("lnk"), title: "Discord", url: "https://discord.com/", category: "social", handle: "naphium", favicon: "" },
      { id: uid("lnk"), title: "Steam", url: "https://steamcommunity.com/", category: "gaming", handle: "naphium", favicon: "" },
    ],
    social: { githubUser: "torvalds", embeds: [] },
    projects: [
      {
        id: uid("prj"),
        title: "HUD Portfolio",
        description: "This site: a tactical dashboard with a built-in synth, terminal and live CMS.",
        category: "Web",
        tags: ["React", "TanStack", "Canvas"],
        status: "Live",
        url: "",
        repo: "",
        image: "",
      },
      {
        id: uid("prj"),
        title: "ESP32 Weather Node",
        description: "Low-power sensor node streaming telemetry over MQTT with deep-sleep scheduling.",
        category: "Firmware",
        tags: ["C++", "ESP32", "MQTT"],
        status: "Active",
        url: "",
        repo: "",
        image: "",
      },
    ],
    games: [
      {
        id: uid("gm"),
        title: "Hollow Knight",
        platform: "PC",
        status: "Completed",
        hours: 64,
        rating: 10,
        review: "Tight controls, gorgeous world.",
        favorite: true,
        image: "",
      },
      {
        id: uid("gm"),
        title: "Valorant",
        platform: "PC",
        status: "Playing",
        hours: 310,
        rating: 8,
        review: "Ranked grind continues.",
        favorite: false,
        image: "",
      },
    ],
    now: {
      availability: "open",
      availabilityText: "Open to freelance & collabs",
      focus: "Shipping this portfolio v2",
      building: "A Web Audio chip synth",
      learning: "Rust for embedded",
      reading: "Designing Data-Intensive Applications",
      watching: "Arcane",
      updated: new Date(0).toISOString().slice(0, 10),
    },
    resources: [
      { id: uid("res"), title: "MDN Web Docs", url: "https://developer.mozilla.org", category: "Docs", description: "The web platform reference." },
      { id: uid("res"), title: "Lucide", url: "https://lucide.dev", category: "Design", description: "Clean open-source icons." },
    ],
    achievements: [
      {
        id: uid("ach"),
        title: "Regional Programming Contest — Finalist",
        issuer: "ICPC",
        date: "2025-11",
        kind: "Competition",
        description: "Placed among top teams in the regional round.",
        url: "",
      },
    ],
    skills: {
      groups: [
        { id: uid("sk"), name: "Frontend", items: [{ name: "React", level: 90 }, { name: "TypeScript", level: 85 }, { name: "CSS", level: 88 }] },
        { id: uid("sk"), name: "Firmware", items: [{ name: "C/C++", level: 75 }, { name: "ESP-IDF", level: 65 }] },
        { id: uid("sk"), name: "Cloud", items: [{ name: "Postgres", level: 72 }, { name: "Edge runtimes", level: 70 }] },
        { id: uid("sk"), name: "Design", items: [{ name: "Figma", level: 70 }, { name: "Typography", level: 68 }] },
      ],
      badges: ["React", "TypeScript", "Node", "Tailwind", "Rust", "C++", "Linux", "Git", "Figma", "Postgres"],
    },
    timeline: [
      { id: uid("tl"), date: "2019", title: "First line of code", kind: "hobby", description: "Started with Python scripts and never stopped." },
      { id: uid("tl"), date: "2022", title: "University", kind: "education", description: "Began Computer Science studies." },
      { id: uid("tl"), date: "2024", title: "First freelance client", kind: "career", description: "Built and shipped a production dashboard." },
    ],
    goals: [
      { id: uid("gl"), title: "Contribute to 5 OSS projects", category: "professional", description: "", progress: 40 },
      { id: uid("gl"), title: "Run a 10K", category: "personal", description: "", progress: 65 },
    ],
    setup: {
      groups: [
        { id: uid("su"), title: "Rig", items: [{ label: "CPU", value: "Ryzen 5 5600X" }, { label: "GPU", value: "RTX 3060" }, { label: "RAM", value: "32GB DDR4" }] },
        { id: uid("su"), title: "Peripherals", items: [{ label: "Keyboard", value: "75% hot-swap, linear" }, { label: "Mouse", value: "Wireless, 60g" }] },
        { id: uid("su"), title: "Network", items: [{ label: "Router", value: "OpenWrt" }, { label: "DNS", value: "Self-hosted resolver" }] },
        { id: uid("su"), title: "Software", items: [{ label: "Editor", value: "VS Code + Vim keys" }, { label: "Shell", value: "zsh" }, { label: "OS", value: "Arch / Windows dual-boot" }] },
      ],
    },
    album: [
      { id: uid("alb"), title: "Contour study", image: "", kind: "vector", hue: 110, caption: "Elevation lines, Sylhet hills." },
      { id: uid("alb"), title: "Night market", image: "", kind: "photo", hue: 35, caption: "Old Dhaka after dark." },
      { id: uid("alb"), title: "Ink sketch", image: "", kind: "sketch", hue: 200, caption: "Morning commute." },
    ],
    audio: {
      autoplay: false,
      shuffle: false,
      volume: 0.5,
      tracks: [
        { id: uid("trk"), title: "Boot Sequence", artist: "naphium", url: "", notes: [261.63, 329.63, 392, 523.25, 392, 329.63], bpm: 140, wave: "square" },
        { id: uid("trk"), title: "Night Grid", artist: "naphium", url: "", notes: [220, 261.63, 329.63, 440, 392, 329.63, 293.66, 261.63], bpm: 120, wave: "triangle" },
        { id: uid("trk"), title: "Overclock", artist: "naphium", url: "", notes: [196, 246.94, 293.66, 392, 369.99, 293.66], bpm: 168, wave: "sawtooth" },
      ],
    },
    faq: [
      { id: uid("faq"), q: "Are you available for work?", a: "Yes — check the Now tab for current availability." },
      { id: uid("faq"), q: "What's the secret?", a: "Try the Konami code. Or type 'sudo' in the terminal." },
    ],
  };
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// Deep-merge saved data over defaults: objects merge key-by-key, arrays and
// primitives from the saved document win when their type matches the default.
function deepMerge<T>(base: T, incoming: unknown): T {
  if (incoming === undefined || incoming === null) return base;
  if (Array.isArray(base)) return (Array.isArray(incoming) ? incoming : base) as T;
  if (isObj(base)) {
    if (!isObj(incoming)) return base;
    const out: Record<string, unknown> = { ...base };
    for (const key of Object.keys(incoming)) {
      out[key] = key in base ? deepMerge((base as Record<string, unknown>)[key], incoming[key]) : incoming[key];
    }
    return out as T;
  }
  if (typeof base === typeof incoming) return incoming as T;
  return base;
}

export function mergeData(raw: unknown): SiteData {
  const defaults = createDefaultData();
  const merged = deepMerge(defaults, raw);
  // Tabs: keep saved order/labels, drop unknown ids, append any new tabs.
  const saved = Array.isArray(merged.tabs) ? merged.tabs : [];
  const seen = new Set<TabId>();
  const tabs: TabConfig[] = [];
  for (const t of saved) {
    if (t && (TAB_IDS as readonly string[]).includes(t.id) && !seen.has(t.id)) {
      seen.add(t.id);
      tabs.push({ id: t.id, label: typeof t.label === "string" && t.label ? t.label : TAB_LABELS[t.id], visible: t.visible !== false });
    }
  }
  for (const id of TAB_IDS) if (!seen.has(id)) tabs.push({ id, label: TAB_LABELS[id], visible: true });
  merged.tabs = tabs;
  merged.links = merged.links.map((link) => ({ ...link, favicon: typeof link.favicon === "string" ? link.favicon : "" }));
  return merged;
}
