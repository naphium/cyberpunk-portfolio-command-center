/* Generic editor: exposes every single value in the site document, recursively. */
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronRight, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { mergeData, uid, type SiteData } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type Json = unknown;
type Set = (fn: (d: SiteData) => SiteData) => void;

const human = (k: string) =>
  /^\d+$/.test(k) ? `#${Number(k) + 1}` : k.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ").replace(/^./, (c) => c.toUpperCase());

function matches(v: Json, path: string, q: string): boolean {
  if (!q) return true;
  if (path.toLowerCase().includes(q)) return true;
  if (v && typeof v === "object") return Object.entries(v).some(([k, c]) => matches(c, `${path}.${k}`, q));
  return String(v).toLowerCase().includes(q);
}

function blank(sample: Json): Json {
  if (Array.isArray(sample)) return [];
  if (sample && typeof sample === "object") {
    const o: Record<string, Json> = {};
    for (const [k, v] of Object.entries(sample)) o[k] = k === "id" ? uid("x") : blank(v);
    return o;
  }
  if (typeof sample === "number") return 0;
  if (typeof sample === "boolean") return false;
  return "";
}

function Node({ k, v, path, q, onChange, depth }: { k: string; v: Json; path: string; q: string; onChange: (n: Json) => void; depth: number }) {
  const [open, setOpen] = useState(depth < 1);
  if (!matches(v, path, q)) return null;
  const label = <span className="text-xs font-medium text-muted-foreground">{human(k)}</span>;

  if (typeof v === "boolean")
    return (
      <label className="flex items-center justify-between gap-3 rounded-md border bg-background/40 px-3 py-2">
        {label}
        <Switch checked={v} onCheckedChange={onChange} />
      </label>
    );
  if (typeof v === "number")
    return (
      <label className="grid gap-1">
        {label}
        <Input type="number" value={v} step="any" onChange={(e) => onChange(e.target.valueAsNumber || 0)} />
      </label>
    );
  if (typeof v === "string" || v == null) {
    const s = String(v ?? "");
    const long = s.length > 70 || s.includes("\n");
    return (
      <label className="grid gap-1">
        {label}
        {long ? (
          <Textarea value={s} rows={Math.min(10, s.split("\n").length + 1)} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <Input value={s} onChange={(e) => onChange(e.target.value)} />
        )}
      </label>
    );
  }

  const isArr = Array.isArray(v);
  const entries = isArr ? (v as Json[]).map((c, i) => [String(i), c] as const) : Object.entries(v as Record<string, Json>);
  const expanded = open || !!q;
  const title =
    isArr ? `${human(k)} · ${entries.length}` : `${human(k)}${(v as { title?: string; name?: string; label?: string }).title ? ` — ${(v as { title: string }).title}` : (v as { name?: string }).name ? ` — ${(v as { name: string }).name}` : (v as { label?: string }).label ? ` — ${(v as { label: string }).label}` : ""}`;

  const setChild = (ck: string, n: Json) => {
    if (isArr) {
      const a = [...(v as Json[])];
      a[Number(ck)] = n;
      onChange(a);
    } else onChange({ ...(v as object), [ck]: n });
  };
  const arr = v as Json[];
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= arr.length) return;
    const a = [...arr];
    [a[i], a[j]] = [a[j], a[i]];
    onChange(a);
  };

  return (
    <div className={`rounded-lg border ${depth === 0 ? "hud-card" : "bg-background/30"}`}>
      <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left" onClick={() => setOpen((o) => !o)}>
        <ChevronRight className={`h-4 w-4 shrink-0 text-primary transition-transform ${expanded ? "rotate-90" : ""}`} />
        <span className={`truncate ${depth === 0 ? "font-mono text-sm font-semibold" : "text-sm font-medium"}`}>{title}</span>
      </button>
      {expanded && (
        <div className="grid gap-3 border-t p-3">
          {entries.map(([ck, cv], i) => (
            <div key={ck} className={isArr ? "flex items-start gap-1.5" : ""}>
              <div className="min-w-0 flex-1">
                <Node k={ck} v={cv} path={`${path}.${ck}`} q={q} onChange={(n) => setChild(ck, n)} depth={depth + 1} />
              </div>
              {isArr && (
                <div className="flex shrink-0 flex-col gap-0.5 pt-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(i, -1)} aria-label="Move up">
                    <ArrowUp />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(i, 1)} aria-label="Move down">
                    <ArrowDown />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => onChange(arr.filter((_, x) => x !== i))}
                    aria-label="Remove"
                  >
                    <Trash2 />
                  </Button>
                </div>
              )}
            </div>
          ))}
          {isArr && (
            <Button variant="hudGhost" size="sm" className="justify-self-start" onClick={() => onChange([...arr, arr.length ? blank(arr[arr.length - 1]) : ""])}>
              <Plus /> Add item
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function AllFieldsEditor({ draft, set }: { draft: SiteData; set: Set }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  return (
    <div className="space-y-3">
      <div className="hud-card sticky top-0 z-10 flex items-center gap-2 p-2">
        <Search className="ml-1 h-4 w-4 text-primary" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search any field or text… (e.g. email, coffee, bpm)" className="border-0 bg-transparent" />
      </div>
      <p className="hud-label px-1">Every value on the site · changes show in the preview instantly</p>
      {Object.entries(draft).map(([k, v]) => (
        <Node key={k} k={k} v={v} path={k} q={query} depth={0} onChange={(n) => set((d) => ({ ...d, [k]: n }) as SiteData)} />
      ))}
    </div>
  );
}

export function RawJsonEditor({ draft, set }: { draft: SiteData; set: Set }) {
  const initial = useMemo(() => JSON.stringify(draft, null, 2), [draft]);
  const [text, setText] = useState(initial);
  return (
    <div className="hud-card space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="hud-label">raw document</span>
        <div className="flex gap-1.5">
          <Button variant="hudGhost" size="sm" onClick={() => setText(initial)}>
            Reload
          </Button>
          <Button
            variant="hud"
            size="sm"
            onClick={() => {
              try {
                const next = mergeData(JSON.parse(text));
                set(() => next);
                toast.success("Applied to draft");
              } catch {
                toast.error("Invalid JSON");
              }
            }}
          >
            Apply
          </Button>
        </div>
      </div>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} className="min-h-[70vh] font-mono text-xs" />
    </div>
  );
}
