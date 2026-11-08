/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Copy, Globe, ImageDown, Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { createUpload } from "@/lib/content.functions";
import { faviconForUrl } from "@/lib/favicon";
import { supabase } from "@/integrations/supabase/client";

export const AdminCtx = createContext<{ token: string }>({ token: "" });

export type FieldDef =
  | { key: string; label: string; type: "text" | "url" | "textarea" | "number" | "image" | "audio" | "switch" | "tags" | "numbers" | "strings" | "color" | "code" | "favicon"; full?: boolean; placeholder?: string }
  | { key: string; label: string; type: "select"; options: string[]; full?: boolean }
  | { key: string; label: string; type: "slider"; min: number; max: number; step?: number; full?: boolean }
  | { key: string; label: string; type: "list"; fields: FieldDef[]; newItem: () => any; titleKey?: string; full?: true };

export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="hud-label mb-1 block">{children}</span>;
}

const MAX_MB = 25;

export function ImageField({ value, onChange, accept = "image/*" }: { value: string; onChange: (v: string) => void; accept?: string }) {
  const { token } = useContext(AdminCtx);
  const ticket = useServerFn(createUpload);
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const isAudio = accept.startsWith("audio");
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error(`Max ${MAX_MB}MB`);
      return;
    }
    setBusy(true);
    try {
      const type = f.type || (isAudio ? "audio/mpeg" : "image/png");
      const { path } = await ticket({ data: { token, name: f.name, type } });
      const bucket = supabase.storage.from("media");
      const up = await bucket.upload(path, f, { contentType: type, upsert: false });
      if (up.error) throw new Error(up.error.message || "Upload failed");
      const signed = await bucket.createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signed.error || !signed.data) throw new Error("Could not create file link");
      onChange(signed.data.signedUrl);
      toast.success("Uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {value && !isAudio && <img src={value} alt="" className="h-9 w-9 shrink-0 rounded border object-cover" />}
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={isAudio ? "https://….mp3 or upload" : "https://… or upload"} className="font-mono text-xs" />
        <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        <Button type="button" variant="hudGhost" size={isAudio ? "default" : "icon"} onClick={() => ref.current?.click()} disabled={busy} aria-label="Upload file">
          {busy ? <Loader2 className="animate-spin" /> : <Upload />}
          {isAudio && (busy ? "Uploading…" : "Upload music")}
        </Button>
      </div>
      {isAudio && value && <audio src={value} controls preload="none" className="h-9 w-full" />}
    </div>
  );
}

export function FaviconField({ value, pageUrl, onChange }: { value: string; pageUrl: string; onChange: (value: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const fetchFavicon = () => {
    const favicon = faviconForUrl(pageUrl);
    if (!favicon) {
      toast.error("Enter a valid website URL first");
      return;
    }
    setFailed(false);
    setBusy(true);
    setAttempt((n) => n + 1);
    onChange(favicon);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-surface text-muted-foreground">
          {value && !failed ? (
            <img
              key={`${value}:${attempt}`}
              src={value}
              alt="Favicon preview"
              className="h-5 w-5 object-contain"
              onLoad={() => {
                if (busy) toast.success("Favicon fetched");
                setBusy(false);
              }}
              onError={() => {
                if (busy) toast.error("Could not load this favicon");
                setBusy(false);
                setFailed(true);
              }}
            />
          ) : (
            <Globe className="h-4 w-4" />
          )}
        </span>
        <Input
          value={value}
          onChange={(e) => {
            setBusy(false);
            setFailed(false);
            onChange(e.target.value);
          }}
          placeholder="Favicon URL, or fetch from the link"
          className="font-mono text-xs"
          aria-label="Favicon URL"
        />
        <Button type="button" variant="hudGhost" onClick={fetchFavicon} disabled={busy} className="shrink-0">
          {busy ? <Loader2 className="animate-spin" /> : <ImageDown />}
          {busy ? "Fetching…" : "Fetch favicon"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Uses the link’s domain. If it cannot load, the platform icon is shown instead.</p>
    </div>
  );
}

function FieldInput({ def, value, onChange }: { def: FieldDef; value: any; onChange: (v: any) => void }) {
  switch (def.type) {
    case "text":
    case "url":
      return <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={def.placeholder} className={def.type === "url" ? "font-mono text-xs" : ""} />;
    case "textarea":
      return <Textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={def.placeholder} />;
    case "code":
      return <Textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={6} className="font-mono text-xs" spellCheck={false} placeholder={def.placeholder} />;
    case "number":
      return <Input type="number" value={Number.isFinite(value) ? value : 0} onChange={(e) => onChange(Number(e.target.value))} step="any" />;
    case "image":
      return <ImageField value={value ?? ""} onChange={onChange} />;
    case "audio":
      return <ImageField value={value ?? ""} onChange={onChange} accept="audio/*" />;
    case "switch":
      return (
        <div className="flex h-9 items-center">
          <Switch checked={!!value} onCheckedChange={onChange} />
        </div>
      );
    case "color":
      return (
        <div className="flex gap-2">
          <input type="color" value={value ?? "#000000"} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded border bg-transparent" aria-label={def.label} />
          <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="font-mono text-xs" />
        </div>
      );
    case "tags":
    case "strings":
      return (
        <TagsInput value={Array.isArray(value) ? value : []} onChange={onChange} multiline={def.type === "strings"} />
      );
    case "numbers":
      return <NumbersInput value={Array.isArray(value) ? value : []} onChange={onChange} />;
    case "select":
      return (
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
        >
          {def.options.map((o) => (
            <option key={o} value={o} className="bg-card">
              {o}
            </option>
          ))}
        </select>
      );
    case "slider":
      return (
        <div className="flex h-9 items-center gap-3">
          <Slider value={[Number(value) || 0]} min={def.min} max={def.max} step={def.step ?? 1} onValueChange={([v = 0]) => onChange(v)} />
          <span className="w-10 text-right font-mono text-xs text-primary">{value}</span>
        </div>
      );
    case "list":
      return <ListEditor items={Array.isArray(value) ? value : []} onChange={onChange} fields={def.fields} newItem={def.newItem} titleKey={def.titleKey} />;
    default:
      return null;
  }
}

// Keeps free-typed text locally, but resyncs when the value changes from outside (undo/import).
function useSyncedText<T>(value: T, toText: (v: T) => string) {
  const lastEmit = useRef(value);
  const [text, setText] = useState(() => toText(value));
  useEffect(() => {
    if (value !== lastEmit.current) {
      lastEmit.current = value;
      setText(toText(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return { text, setText, lastEmit };
}

function TagsInput({ value, onChange, multiline }: { value: string[]; onChange: (v: string[]) => void; multiline?: boolean }) {
  const sep = multiline ? "\n" : ",";
  const { text, setText, lastEmit } = useSyncedText(value, (v) => v.join(multiline ? "\n" : ", "));
  const commit = (t: string) => {
    setText(t);
    const next = t.split(sep).map((s) => s.trim()).filter(Boolean);
    lastEmit.current = next;
    onChange(next);
  };
  return multiline ? (
    <Textarea value={text} onChange={(e) => commit(e.target.value)} rows={3} placeholder="one per line" />
  ) : (
    <Input value={text} onChange={(e) => commit(e.target.value)} placeholder="comma, separated" />
  );
}

function NumbersInput({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  const { text, setText, lastEmit } = useSyncedText(value, (v) => v.join(", "));
  return (
    <Input
      value={text}
      className="font-mono text-xs"
      placeholder="261.63, 329.63, 392"
      onChange={(e) => {
        setText(e.target.value);
        const next = e.target.value
          .split(/[,\s]+/)
          .map(Number)
          .filter((n) => Number.isFinite(n) && n > 0);
        lastEmit.current = next;
        onChange(next);
      }}
    />
  );
}

export function ObjectFields({ value, onChange, fields }: { value: any; onChange: (v: any) => void; fields: FieldDef[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((f) => (
        <div key={f.key} className={f.full || ["textarea", "code", "list", "strings"].includes(f.type) ? "sm:col-span-2" : ""}>
          <FieldLabel>{f.label}</FieldLabel>
          {f.type === "favicon" ? (
            <FaviconField value={value?.favicon ?? ""} pageUrl={value?.url ?? ""} onChange={(v) => onChange({ ...value, favicon: v })} />
          ) : (
            <FieldInput def={f} value={value?.[f.key]} onChange={(v) => onChange({ ...value, [f.key]: v })} />
          )}
        </div>
      ))}
    </div>
  );
}

export function ListEditor({
  items,
  onChange,
  fields,
  newItem,
  titleKey,
}: {
  items: any[];
  onChange: (v: any[]) => void;
  fields: FieldDef[];
  newItem: () => any;
  titleKey?: string | undefined;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
    if (open === i) setOpen(j);
  };
  const tk = titleKey ?? fields[0]?.key ?? "title";
  return (
    <div className="space-y-2">
      {items.map((it, i) => {
        const isOpen = open === i;
        const title = typeof it === "object" ? String(it?.[tk] ?? "") : String(it);
        return (
          <div key={it?.id ?? i} className="rounded-md border bg-surface/60">
            <div className="flex items-center gap-1 px-2 py-1.5">
              <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm" onClick={() => setOpen(isOpen ? null : i)}>
                {isOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-primary" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <span className="truncate">{title || <em className="text-muted-foreground">untitled</em>}</span>
              </button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(i, -1)} aria-label="Move up">
                <ArrowUp />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(i, 1)} aria-label="Move down">
                <ArrowDown />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Duplicate"
                onClick={() => {
                  const copy = { ...structuredClone(it), ...(it?.id ? { id: `${it.id}_c${Date.now().toString(36)}` } : {}) };
                  const next = [...items];
                  next.splice(i + 1, 0, copy);
                  onChange(next);
                }}
              >
                <Copy />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:text-destructive"
                aria-label="Delete"
                onClick={() => {
                  onChange(items.filter((_, j) => j !== i));
                  setOpen(null);
                }}
              >
                <Trash2 />
              </Button>
            </div>
            {isOpen && (
              <div className="border-t p-3">
                <ObjectFields value={it} onChange={(v) => onChange(items.map((x, j) => (j === i ? v : x)))} fields={fields} />
              </div>
            )}
          </div>
        );
      })}
      <Button
        type="button"
        variant="hudGhost"
        size="sm"
        onClick={() => {
          onChange([...items, newItem()]);
          setOpen(items.length);
        }}
      >
        <Plus /> Add
      </Button>
    </div>
  );
}

export function EditorCard({ title, desc, children }: { title: string; desc?: string | undefined; children: ReactNode }) {
  return (
    <div className="hud-card space-y-4 p-4">
      <div>
        <h3 className="font-semibold">{title}</h3>
        {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
      </div>
      {children}
    </div>
  );
}
