/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { uid, TAB_LABELS, type SiteData, type ThemeColors } from "@/lib/content";
import { FONT_OPTIONS } from "@/lib/fonts";
import { PRESETS } from "@/components/hud/ThemeStyle";
import { deleteGuestbookEntry } from "@/lib/content.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { GuestbookSection } from "@/components/portfolio/sections-interactive";
import { AllFieldsEditor, RawJsonEditor } from "./AllFields";
import { AdminCtx, EditorCard, FieldLabel, ListEditor, ObjectFields, type FieldDef } from "./fields";

type Set = (fn: (d: SiteData) => SiteData) => void;
interface EP {
  draft: SiteData;
  set: Set;
}

const kvFields: FieldDef[] = [
  { key: "label", label: "Label", type: "text" },
  { key: "value", label: "Value", type: "text" },
];

function ProfileEditor({ draft, set }: EP) {
  return (
    <EditorCard title="Profile & hero" desc="Name, avatar, banner, presence and contact.">
      <ObjectFields
        value={draft.profile}
        onChange={(v) => set((d) => ({ ...d, profile: v }))}
        fields={[
          { key: "name", label: "Full name", type: "text" },
          { key: "handle", label: "Handle / nickname", type: "text" },
          { key: "tagline", label: "Tagline", type: "text", full: true },
          { key: "location", label: "Location", type: "text" },
          { key: "timezone", label: "Timezone (IANA)", type: "text", placeholder: "Asia/Dhaka" },
          { key: "lat", label: "Latitude", type: "number" },
          { key: "lng", label: "Longitude", type: "number" },
          { key: "email", label: "Email", type: "text" },
          { key: "siteUrl", label: "Site link (for copy)", type: "url" },
          { key: "avatarUrl", label: "Avatar", type: "image" },
          { key: "bannerUrl", label: "Banner", type: "image" },
          { key: "presenceMode", label: "Presence source", type: "select", options: ["custom", "discord"] },
          { key: "discordId", label: "Discord user ID (Lanyard)", type: "text" },
          { key: "presenceStates", label: "Custom presence states (cycle)", type: "strings" },
          { key: "sourceUrl", label: "Source code URL", type: "url" },
          { key: "sshKey", label: "SSH public key", type: "text" },
          { key: "pgpKey", label: "PGP public key", type: "code" },
        ]}
      />
    </EditorCard>
  );
}

function TabManager({ draft, set }: EP) {
  const tabs = draft.tabs;
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= tabs.length) return;
    const next = [...tabs];
    [next[i], next[j]] = [next[j]!, next[i]!];
    set((x) => ({ ...x, tabs: next }));
  };
  return (
    <EditorCard title="Tab manager" desc="Reorder, rename and hide sections. The first 9 visible tabs get number-key shortcuts.">
      <div className="space-y-1.5">
        {tabs.map((t, i) => (
          <div key={t.id} className={`flex items-center gap-2 rounded-md border bg-surface/60 px-2 py-1.5 ${t.visible ? "" : "opacity-50"}`}>
            <span className="w-6 font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
            <span className="hud-badge w-24 justify-center">{t.id}</span>
            <Input
              value={t.label}
              onChange={(e) => set((x) => ({ ...x, tabs: x.tabs.map((y) => (y.id === t.id ? { ...y, label: e.target.value } : y)) }))}
              className="h-8"
              placeholder={TAB_LABELS[t.id]}
            />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(i, -1)} aria-label="Move up">
              <ArrowUp />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(i, 1)} aria-label="Move down">
              <ArrowDown />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={t.visible ? "Hide tab" : "Show tab"}
              onClick={() => set((x) => ({ ...x, tabs: x.tabs.map((y) => (y.id === t.id ? { ...y, visible: !y.visible } : y)) }))}
            >
              {t.visible ? <Eye /> : <EyeOff />}
            </Button>
          </div>
        ))}
      </div>
    </EditorCard>
  );
}

const COLOR_KEYS: (keyof ThemeColors)[] = ["background", "surface", "card", "primary", "accent", "text", "muted", "border"];

const COLOR_HINTS: Record<keyof ThemeColors, string> = {
  background: "Page background",
  surface: "Tabs & inputs",
  card: "Cards",
  primary: "Buttons & active tab",
  accent: "Status dot & highlights",
  text: "Main text",
  muted: "Secondary text",
  border: "Lines & borders",
};

function PalettePreview({ c, radius }: { c: ThemeColors; radius: number }) {
  return (
    <div className="space-y-2 p-3" style={{ background: c.background, color: c.text, borderRadius: radius, border: `1px solid ${c.border}` }}>
      <div className="p-3" style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: radius }}>
        <div className="flex items-center gap-2 text-sm font-bold">
          Md. Nafim Muttaki <span className="h-2 w-2 rounded-full" style={{ background: c.accent }} />
        </div>
        <div className="text-xs" style={{ color: c.muted }}>Secondary text · @handle</div>
        <div className="mt-2 flex gap-2">
          <span className="px-3 py-1 text-xs font-semibold" style={{ background: c.primary, color: c.background, borderRadius: 999 }}>Contact</span>
          <span className="px-3 py-1 text-xs" style={{ background: c.surface, borderRadius: radius }}>Tab</span>
        </div>
      </div>
    </div>
  );
}

function ThemeEditor({ draft, set }: EP) {
  const th = draft.theme;
  const upd = (patch: Partial<SiteData["theme"]>) => set((d) => ({ ...d, theme: { ...d.theme, ...patch } }));
  const groups = ["Sans", "Display", "Bangla", "Mono"] as const;
  const FontSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm">
      {groups.map((g) => (
        <optgroup key={g} label={g} className="bg-card">
          {FONT_OPTIONS.filter((f) => f.group === g).map((f) => (
            <option key={f.name} value={f.name} className="bg-card">
              {f.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
  return (
    <>
      <EditorCard title="Mode" desc="Visitors switch between your dark and light look with the sun/moon button. The live preview shows the default mode.">
        <div className="flex flex-wrap gap-2">
          {(["dark", "light"] as const).map((m) => (
            <Button key={m} type="button" variant={th.defaultMode === m ? "default" : "outline"} onClick={() => upd({ defaultMode: m })}>
              {m === "dark" ? "Dark" : "Light"} by default
            </Button>
          ))}
        </div>
      </EditorCard>
      {(["dark", "light"] as const).map((m) => (
        <EditorCard key={m} title={`${m === "dark" ? "Dark" : "Light"} mode colors`} desc="Start from a template, then fine-tune any color.">
          <div className="flex flex-wrap gap-2">
            {PRESETS.filter((p) => p.mode === m).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => upd({ [m]: { ...p.colors }, defaultMode: m } as any)}
                className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors hover:bg-accent"
              >
                <span className="flex overflow-hidden rounded-sm border">
                  {[p.colors.background, p.colors.card, p.colors.primary, p.colors.accent].map((c, i) => (
                    <span key={i} className="h-4 w-3" style={{ background: c }} />
                  ))}
                </span>
                {p.label}
              </button>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {COLOR_KEYS.map((k) => (
                <label key={k} className="flex items-center gap-2 rounded-md border p-2">
                  <input
                    type="color"
                    value={/^#[0-9a-f]{6}$/i.test(th[m][k]) ? th[m][k] : "#000000"}
                    onChange={(e) => upd({ [m]: { ...th[m], [k]: e.target.value }, defaultMode: m } as any)}
                    className="h-9 w-10 shrink-0 cursor-pointer rounded border bg-transparent"
                    aria-label={`${m} ${k}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium capitalize">{k}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{COLOR_HINTS[k]}</span>
                  </span>
                  <Input
                    value={th[m][k]}
                    onChange={(e) => upd({ [m]: { ...th[m], [k]: e.target.value } } as any)}
                    className="h-8 w-24 font-mono text-xs"
                    aria-label={`${m} ${k} hex`}
                  />
                </label>
              ))}
            </div>
            <PalettePreview c={th[m]} radius={th.radius} />
          </div>
        </EditorCard>
      ))}
      <EditorCard title="Typography & shape">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Body font ({FONT_OPTIONS.length} available)</FieldLabel>
            <FontSelect value={th.fontSans} onChange={(v) => upd({ fontSans: v })} />
          </div>
          <div>
            <FieldLabel>Monospace font</FieldLabel>
            <FontSelect value={th.fontMono} onChange={(v) => upd({ fontMono: v })} />
          </div>
          <div>
            <FieldLabel>Corner roundness · {th.radius}px</FieldLabel>
            <Slider value={[th.radius]} min={0} max={24} step={1} onValueChange={([v]) => upd({ radius: v ?? 0 })} />
          </div>
          <div>
            <FieldLabel>Card borders</FieldLabel>
            <Switch checked={th.cardBorders} onCheckedChange={(v) => upd({ cardBorders: v })} />
          </div>
        </div>
      </EditorCard>
    </>
  );
}

function SettingsEditor({ draft, set }: EP) {
  const s = draft.settings;
  const upd = (patch: Partial<SiteData["settings"]>) => set((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  return (
    <>
      <EditorCard title="Site status">
        <ObjectFields
          value={s.maintenance}
          onChange={(v) => upd({ maintenance: v })}
          fields={[
            { key: "enabled", label: "Maintenance mode", type: "switch" },
            { key: "message", label: "Offline message", type: "textarea" },
          ]}
        />
        <ObjectFields
          value={s.announcement}
          onChange={(v) => upd({ announcement: v })}
          fields={[
            { key: "enabled", label: "Announcement banner", type: "switch" },
            { key: "link", label: "Banner link", type: "url" },
            { key: "text", label: "Banner text", type: "text", full: true },
          ]}
        />
        <ObjectFields
          value={s.awayTitle}
          onChange={(v) => upd({ awayTitle: v })}
          fields={[
            { key: "enabled", label: "Away tab title", type: "switch" },
            { key: "text", label: "Title when tab is hidden", type: "text" },
          ]}
        />
        <ObjectFields
          value={s}
          onChange={(v) => upd({ readingProgress: v.readingProgress, disableRightClick: v.disableRightClick, disableSelection: v.disableSelection })}
          fields={[
            { key: "readingProgress", label: "Reading progress bar", type: "switch" },
            { key: "disableRightClick", label: "Disable right-click", type: "switch" },
            { key: "disableSelection", label: "Disable text selection", type: "switch" },
          ]}
        />
      </EditorCard>
      <EditorCard title="Hacker effects">
        <ObjectFields
          value={s.effects}
          onChange={(v) => upd({ effects: v })}
          fields={[
            { key: "background", label: "Topographic canvas", type: "switch" },
            { key: "scanlines", label: "CRT scanlines", type: "switch" },
            { key: "blinkCursor", label: "Blinking name cursor", type: "switch" },
            { key: "glitch", label: "RGB glitch on hover", type: "switch" },
            { key: "customCursor", label: "Green block cursor", type: "switch" },
            { key: "fpsCounter", label: "FPS / hardware HUD", type: "switch" },
            { key: "consoleBanner", label: "DevTools console banner", type: "switch" },
            { key: "konami", label: "Konami code matrix", type: "switch" },
            { key: "matrixGlyphs", label: "Matrix glyphs", type: "select", options: ["katakana", "binary", "mixed"] },
          ]}
        />
      </EditorCard>
      <EditorCard title="Terminal">
        <ObjectFields
          value={s.terminal}
          onChange={(v) => upd({ terminal: v })}
          fields={[
            { key: "enabled", label: "Enabled", type: "switch" },
            { key: "hotkey", label: "Hotkey", type: "text" },
            { key: "prompt", label: "Prompt label", type: "text", full: true },
            { key: "motd", label: "Welcome banner (MOTD)", type: "code" },
            {
              key: "customCommands",
              label: "Custom commands",
              type: "list",
              newItem: () => ({ id: uid("cmd"), name: "hello", output: "world" }),
              fields: [
                { key: "name", label: "Command", type: "text" },
                { key: "output", label: "Output", type: "code" },
              ],
            },
          ]}
        />
      </EditorCard>
      <EditorCard title="Custom CSS" desc="Injected on the public site after the theme.">
        <ObjectFields value={s} onChange={(v) => upd({ customCss: v.customCss })} fields={[{ key: "customCss", label: "CSS", type: "code", placeholder: ".hud-card { … }" }]} />
      </EditorCard>
    </>
  );
}

// Component types are cached per key so re-renders never remount (and never steal input focus).
const editorCache = new Map<string, (p: EP) => ReactNode>();

function listEditor<K extends keyof SiteData>(key: K, title: string, fields: FieldDef[], newItem: () => any, desc?: string) {
  const cacheKey = `list:${String(key)}`;
  const hit = editorCache.get(cacheKey);
  if (hit) return hit;
  const Editor = ({ draft, set }: EP) => (
    <EditorCard title={title} desc={desc}>
      <ListEditor items={draft[key] as any[]} onChange={(v) => set((d) => ({ ...d, [key]: v }))} fields={fields} newItem={newItem} />
    </EditorCard>
  );
  editorCache.set(cacheKey, Editor);
  return Editor;
}

function objectEditor<K extends keyof SiteData>(key: K, title: string, fields: FieldDef[]) {
  const cacheKey = `obj:${String(key)}`;
  const hit = editorCache.get(cacheKey);
  if (hit) return hit;
  const Editor = ({ draft, set }: EP) => (
    <EditorCard title={title}>
      <ObjectFields value={draft[key]} onChange={(v) => set((d) => ({ ...d, [key]: v }))} fields={fields} />
    </EditorCard>
  );
  editorCache.set(cacheKey, Editor);
  return Editor;
}

function GuestbookModeration() {
  const { token } = useContext(AdminCtx);
  const del = useServerFn(deleteGuestbookEntry);
  const qc = useQueryClient();
  return (
    <EditorCard title="Guestbook moderation" desc="Entries are live. Delete spam with the trash icon.">
      <GuestbookSection
        adminToken={token}
        onDelete={async (id) => {
          try {
            await del({ data: { token, id } });
            toast.success("Entry deleted");
            void qc.invalidateQueries({ queryKey: ["guestbook"] });
          } catch {
            toast.error("Delete failed");
          }
        }}
      />
    </EditorCard>
  );
}

export interface EditorDef {
  id: string;
  label: string;
  group: "Site" | "Sections" | "Advanced";
  render: (p: EP) => ReactNode;
}

const AboutEditor = objectEditor("about", "About", [
  { key: "overview", label: "Overview", type: "textarea" },
  { key: "philosophy", label: "Philosophy statement", type: "textarea" },
  {
    key: "blocks",
    label: "Text blocks",
    type: "list",
    newItem: () => ({ id: uid("blk"), title: "New block", body: "", fullWidth: false }),
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "fullWidth", label: "Full width", type: "switch" },
      { key: "body", label: "Body", type: "textarea" },
    ],
  },
  {
    key: "grids",
    label: "Metric grids",
    type: "list",
    newItem: () => ({ id: uid("grd"), title: "New grid", items: [] }),
    fields: [
      { key: "title", label: "Title", type: "text", full: true },
      { key: "items", label: "Items", type: "list", newItem: () => ({ label: "Label", value: "Value" }), fields: kvFields },
    ],
  },
  {
    key: "lists",
    label: "Lists",
    type: "list",
    newItem: () => ({ id: uid("lst"), title: "New list", items: [] }),
    fields: [
      { key: "title", label: "Title", type: "text", full: true },
      { key: "items", label: "Items (one per line)", type: "strings" },
    ],
  },
]);

export const EDITORS: EditorDef[] = [
  { id: "profile", label: "Profile", group: "Site", render: (p) => <ProfileEditor {...p} /> },
  { id: "tabs", label: "Tabs", group: "Site", render: (p) => <TabManager {...p} /> },
  { id: "theme", label: "Theme", group: "Site", render: (p) => <ThemeEditor {...p} /> },
  { id: "settings", label: "Settings & FX", group: "Site", render: (p) => <SettingsEditor {...p} /> },
  { id: "about", label: "About", group: "Sections", render: (p) => <AboutEditor {...p} /> },
  {
    id: "links",
    label: "Links",
    group: "Sections",
    render: (p) => {
      const E = listEditor("links", "Links", [
        { key: "title", label: "Title", type: "text" },
        { key: "category", label: "Category", type: "select", options: ["dev", "social", "gaming", "other"] },
        { key: "url", label: "URL (platform icon auto-detected)", type: "url" },
        { key: "favicon", label: "Website favicon", type: "favicon", full: true },
        { key: "handle", label: "Handle", type: "text" },
      ], () => ({ id: uid("lnk"), title: "New link", url: "https://", category: "dev", handle: "", favicon: "" }));
      return <E {...p} />;
    },
  },
  {
    id: "social",
    label: "Social",
    group: "Sections",
    render: (p) => {
      const E = objectEditor("social", "Social", [
        { key: "githubUser", label: "GitHub username (live stats)", type: "text" },
        {
          key: "embeds",
          label: "Post embeds",
          type: "list",
          titleKey: "url",
          newItem: () => ({ id: uid("emb"), platform: "instagram", url: "", caption: "" }),
          fields: [
            { key: "platform", label: "Platform", type: "select", options: ["instagram", "facebook", "youtube", "x", "other"] },
            { key: "url", label: "Post URL", type: "url" },
            { key: "caption", label: "Caption", type: "text", full: true },
          ],
        },
      ]);
      return <E {...p} />;
    },
  },
  {
    id: "projects",
    label: "Projects",
    group: "Sections",
    render: (p) => {
      const E = listEditor("projects", "Projects", [
        { key: "title", label: "Title", type: "text" },
        { key: "status", label: "Status", type: "select", options: ["Live", "Beta", "Active", "Deployed", "Archived"] },
        { key: "category", label: "Category", type: "text" },
        { key: "tags", label: "Tags", type: "tags" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "url", label: "Live URL", type: "url" },
        { key: "repo", label: "Repo URL", type: "url" },
        { key: "image", label: "Thumbnail", type: "image", full: true },
      ], () => ({ id: uid("prj"), title: "New project", description: "", category: "Web", tags: [], status: "Active", url: "", repo: "", image: "" }));
      return <E {...p} />;
    },
  },
  {
    id: "games",
    label: "Gaming",
    group: "Sections",
    render: (p) => {
      const E = listEditor("games", "Game collection", [
        { key: "title", label: "Title", type: "text" },
        { key: "platform", label: "Platform", type: "select", options: ["PC", "Console", "Mobile"] },
        { key: "status", label: "Status", type: "select", options: ["Playing", "Completed", "Dropped", "Backlog"] },
        { key: "hours", label: "Hours", type: "number" },
        { key: "rating", label: "Rating /10", type: "slider", min: 0, max: 10 },
        { key: "favorite", label: "Favorite", type: "switch" },
        { key: "review", label: "Review", type: "textarea" },
        { key: "image", label: "Cover", type: "image", full: true },
      ], () => ({ id: uid("gm"), title: "New game", platform: "PC", status: "Playing", hours: 0, rating: 7, review: "", favorite: false, image: "" }));
      return <E {...p} />;
    },
  },
  {
    id: "now",
    label: "Now",
    group: "Sections",
    render: (p) => {
      const E = objectEditor("now", "Now", [
        { key: "availability", label: "Availability", type: "select", options: ["open", "busy", "away"] },
        { key: "updated", label: "Last updated", type: "text", placeholder: "2026-11-08" },
        { key: "availabilityText", label: "Availability text", type: "text", full: true },
        { key: "focus", label: "Active focus", type: "text" },
        { key: "building", label: "Building", type: "text" },
        { key: "learning", label: "Learning", type: "text" },
        { key: "reading", label: "Reading", type: "text" },
        { key: "watching", label: "Watching", type: "text" },
      ]);
      return <E {...p} />;
    },
  },
  {
    id: "resources",
    label: "Resources",
    group: "Sections",
    render: (p) => {
      const E = listEditor("resources", "Resources", [
        { key: "title", label: "Title", type: "text" },
        { key: "category", label: "Category", type: "text" },
        { key: "url", label: "URL", type: "url", full: true },
        { key: "description", label: "Description", type: "text", full: true },
      ], () => ({ id: uid("res"), title: "New resource", url: "https://", category: "Tools", description: "" }));
      return <E {...p} />;
    },
  },
  {
    id: "achievements",
    label: "Achievements",
    group: "Sections",
    render: (p) => {
      const E = listEditor("achievements", "Achievements", [
        { key: "title", label: "Title", type: "text" },
        { key: "kind", label: "Type", type: "select", options: ["Certificate", "Award", "Competition"] },
        { key: "issuer", label: "Issuing organization", type: "text" },
        { key: "date", label: "Date", type: "text", placeholder: "2026-05" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "url", label: "Verification URL", type: "url", full: true },
      ], () => ({ id: uid("ach"), title: "New achievement", issuer: "", date: "", kind: "Certificate", description: "", url: "" }));
      return <E {...p} />;
    },
  },
  {
    id: "skills",
    label: "Skills",
    group: "Sections",
    render: (p) => {
      const E = objectEditor("skills", "Skills", [
        {
          key: "groups",
          label: "Skill groups",
          type: "list",
          titleKey: "name",
          newItem: () => ({ id: uid("sk"), name: "New group", items: [] }),
          fields: [
            { key: "name", label: "Group name", type: "text", full: true },
            {
              key: "items",
              label: "Skills",
              type: "list",
              newItem: () => ({ name: "Skill", level: 50 }),
              fields: [
                { key: "name", label: "Name", type: "text" },
                { key: "level", label: "Level %", type: "slider", min: 0, max: 100 },
              ],
            },
          ],
        },
        { key: "badges", label: "Badge cloud", type: "tags", full: true },
      ]);
      return <E {...p} />;
    },
  },
  {
    id: "timeline",
    label: "Timeline",
    group: "Sections",
    render: (p) => {
      const E = listEditor("timeline", "Timeline", [
        { key: "title", label: "Title", type: "text" },
        { key: "date", label: "Date", type: "text" },
        { key: "kind", label: "Kind", type: "select", options: ["career", "hobby", "education"] },
        { key: "description", label: "Description", type: "textarea" },
      ], () => ({ id: uid("tl"), date: "2026", title: "Milestone", kind: "career", description: "" }));
      return <E {...p} />;
    },
  },
  {
    id: "goals",
    label: "Goals",
    group: "Sections",
    render: (p) => {
      const E = listEditor("goals", "Goals", [
        { key: "title", label: "Title", type: "text" },
        { key: "category", label: "Category", type: "select", options: ["personal", "professional"] },
        { key: "progress", label: "Progress %", type: "slider", min: 0, max: 100, full: true },
        { key: "description", label: "Description", type: "textarea" },
      ], () => ({ id: uid("gl"), title: "New goal", category: "personal", description: "", progress: 0 }));
      return <E {...p} />;
    },
  },
  {
    id: "setup",
    label: "Setup",
    group: "Sections",
    render: (p) => {
      const E = objectEditor("setup", "Setup", [
        {
          key: "groups",
          label: "Spec groups",
          type: "list",
          newItem: () => ({ id: uid("su"), title: "New group", items: [] }),
          fields: [
            { key: "title", label: "Title", type: "text", full: true },
            { key: "items", label: "Specs", type: "list", newItem: () => ({ label: "Part", value: "Model" }), fields: kvFields },
          ],
        },
      ]);
      return <E {...p} />;
    },
  },
  {
    id: "album",
    label: "Album",
    group: "Sections",
    render: (p) => {
      const E = listEditor("album", "Album", [
        { key: "title", label: "Title", type: "text" },
        { key: "kind", label: "Kind", type: "select", options: ["photo", "sketch", "vector"] },
        { key: "hue", label: "Accent hue", type: "slider", min: 0, max: 360, full: true },
        { key: "image", label: "Image", type: "image", full: true },
        { key: "caption", label: "Caption", type: "text", full: true },
      ], () => ({ id: uid("alb"), title: "New piece", image: "", kind: "photo", hue: 120, caption: "" }));
      return <E {...p} />;
    },
  },
  {
    id: "audio",
    label: "Tracks",
    group: "Sections",
    render: (p) => {
      const E = objectEditor("audio", "Audio player", [
        { key: "autoplay", label: "Autoplay next", type: "switch" },
        { key: "shuffle", label: "Shuffle", type: "switch" },
        { key: "volume", label: "Default volume", type: "slider", min: 0, max: 1, step: 0.05, full: true },
        {
          key: "tracks",
          label: "Tracks",
          type: "list",
          newItem: () => ({ id: uid("trk"), title: "New track", artist: "", url: "", notes: [261.63, 329.63, 392], bpm: 120, wave: "square" }),
          fields: [
            { key: "title", label: "Title", type: "text" },
            { key: "artist", label: "Artist", type: "text" },
            { key: "url", label: "Music file — upload or paste a link (leave empty to use synth)", type: "audio", full: true },
            { key: "notes", label: "Synth frequencies (Hz)", type: "numbers", full: true },
            { key: "bpm", label: "BPM", type: "slider", min: 60, max: 240 },
            { key: "wave", label: "Waveform", type: "select", options: ["square", "sawtooth", "triangle", "sine"] },
          ],
        },
      ]);
      return <E {...p} />;
    },
  },
  { id: "guestbook", label: "Guestbook", group: "Sections", render: () => <GuestbookModeration /> },
  {
    id: "faq",
    label: "FAQ",
    group: "Sections",
    render: (p) => {
      const E = listEditor("faq", "FAQ", [
        { key: "q", label: "Question", type: "text", full: true },
        { key: "a", label: "Answer", type: "textarea" },
      ], () => ({ id: uid("faq"), q: "New question?", a: "" }));
      return <E {...p} />;
    },
  },
  { id: "all", label: "Every field", group: "Advanced", render: (p) => <AllFieldsEditor {...p} /> },
  { id: "json", label: "Raw JSON", group: "Advanced", render: (p) => <RawJsonEditor {...p} /> },
];
