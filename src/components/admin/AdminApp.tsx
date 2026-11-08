import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import {
  Columns2,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  LogOut,
  PanelTop,
  Redo2,
  RotateCcw,
  Save,
  Undo2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { adminLogin, getPublicContent, saveContent, verifyAdmin } from "@/lib/content.functions";
import { mergeData, type SiteData } from "@/lib/content";
import { contentQuery } from "@/lib/use-site-content";
import { useHistoryState } from "@/hooks/use-history-state";
import { ThemeStyle, useThemeMode } from "@/components/hud/ThemeStyle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminCtx } from "./fields";
import { EDITORS } from "./editors";

const TOKEN_KEY = "hud-admin-token";

export function AdminApp() {
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const verify = useServerFn(verifyAdmin);

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) return setChecking(false);
    verify({ data: { token: t } })
      .then((r) => {
        if (r.ok) setToken(t);
        else localStorage.removeItem(TOKEN_KEY);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [verify]);

  if (checking)
    return (
      <div className="flex min-h-screen items-center justify-center font-mono text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> verifying clearance…
      </div>
    );
  if (!token)
    return (
      <Login
        onToken={(t) => {
          localStorage.setItem(TOKEN_KEY, t);
          setToken(t);
        }}
      />
    );
  return (
    <AdminCtx.Provider value={{ token }}>
      <Cms
        token={token}
        onLogout={() => {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        }}
      />
    </AdminCtx.Provider>
  );
}

function Login({ onToken }: { onToken: (t: string) => void }) {
  const login = useServerFn(adminLogin);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="hud-gridbg flex min-h-screen items-center justify-center p-4">
      <form
        className="hud-card hud-corners w-full max-w-sm space-y-4 p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr("");
          try {
            const r = await login({ data: { password: pw } });
            if (r.ok) onToken(r.token);
            else setErr(r.error);
          } catch {
            setErr("Login failed. Try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="flex items-center gap-2">
          <LockKeyhole className="h-5 w-5 text-primary" />
          <div>
            <div className="hud-label">restricted area</div>
            <h1 className="font-semibold">Admin control panel</h1>
          </div>
        </div>
        <Input
          type="password"
          autoComplete="current-password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="access code"
          className="font-mono"
          autoFocus
        />
        {err && <p className="font-mono text-sm text-destructive">{err}</p>}
        <Button variant="hud" className="w-full" disabled={busy || !pw}>
          {busy ? <Loader2 className="animate-spin" /> : null} authenticate
        </Button>
        <Link to="/" className="hud-label block text-center hover:text-primary">
          ← back to site
        </Link>
      </form>
    </main>
  );
}

type PreviewMode = "split" | "tab" | "off";

function Cms({ token, onLogout }: { token: string; onLogout: () => void }) {
  const qc = useQueryClient();
  const save = useServerFn(saveContent);
  const fetchContent = useServerFn(getPublicContent);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState<SiteData | null>(null);
  const h = useHistoryState<SiteData>(mergeData({}));
  const [section, setSection] = useState("profile");
  const [preview, setPreview] = useState<PreviewMode>("split");
  const [showPreviewTab, setShowPreviewTab] = useState(false);
  const [saving, setSaving] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const draft = h.present;
  useThemeMode(draft.theme, false);

  useEffect(() => {
    fetchContent()
      .then((r) => {
        setSaved(r.data);
        h.reset(r.data);
        setLoaded(true);
      })
      .catch(() => toast.error("Could not load content"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirty = useMemo(() => !!saved && JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);

  // push draft to preview iframe
  const postDraft = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: "hud-preview", data: draft }, window.location.origin);
  }, [draft]);
  useEffect(() => {
    const t = setTimeout(postDraft, 200);
    return () => clearTimeout(t);
  }, [postDraft]);
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin === window.location.origin && (e.data as { type?: string })?.type === "hud-preview-ready") postDraft();
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [postDraft]);

  const publish = useCallback(async () => {
    setSaving(true);
    try {
      await save({ data: { token, content: draft } });
      setSaved(draft);
      void qc.invalidateQueries({ queryKey: contentQuery.queryKey });
      toast.success("Published — live for all visitors");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed";
      if (msg.includes("Unauthorized")) {
        toast.error("Session expired. Please log in again.");
        onLogout();
      } else toast.error(msg);
    } finally {
      setSaving(false);
    }
  }, [save, token, draft, qc, onLogout]);

  // hotkeys: undo/redo/save
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        h.undo();
      } else if (k === "y" || (k === "z" && e.shiftKey)) {
        e.preventDefault();
        h.redo();
      } else if (k === "s") {
        e.preventDefault();
        void publish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [h, publish]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importJson = async (f: File | undefined) => {
    if (!f) return;
    try {
      const parsed = JSON.parse(await f.text()) as unknown;
      h.replace(mergeData(parsed));
      toast.success("Backup imported — review and publish");
    } catch {
      toast.error("Invalid JSON file");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const editor = EDITORS.find((e) => e.id === section) ?? EDITORS[0]!;
  const showSplit = preview === "split";
  const showEditor = preview !== "tab" || !showPreviewTab;
  const showFrame = showSplit || (preview === "tab" && showPreviewTab);

  return (
    <div className="hud-gridbg flex min-h-screen flex-col">
      <ThemeStyle theme={draft.theme} />
      <header className="sticky top-0 z-50 flex flex-wrap items-center gap-2 border-b bg-card/95 px-3 py-2">
        <div className="mr-2 flex items-center gap-2">
          <span className="status-dot" />
          <span className="font-mono text-sm font-semibold">HUD // CMS</span>
        </div>
        <span className={`hud-badge ${dirty ? "hud-badge-signal" : "hud-badge-primary"}`}>{dirty ? "unsaved changes" : "in sync"}</span>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <Button variant="hudGhost" size="icon" onClick={h.undo} disabled={!h.canUndo} aria-label="Undo (Ctrl+Z)" title="Undo (Ctrl+Z)">
            <Undo2 />
          </Button>
          <Button variant="hudGhost" size="icon" onClick={h.redo} disabled={!h.canRedo} aria-label="Redo (Ctrl+Y)" title="Redo (Ctrl+Y)">
            <Redo2 />
          </Button>
          <Button
            variant="hudGhost"
            size="sm"
            disabled={!dirty}
            onClick={() => {
              if (saved && confirm("Discard all unsaved changes?")) {
                h.replace(saved);
                toast("Changes discarded");
              }
            }}
          >
            <RotateCcw /> Discard
          </Button>
          <Button variant="hudGhost" size="icon" onClick={exportJson} aria-label="Export JSON" title="Export JSON backup">
            <Download />
          </Button>
          <Button variant="hudGhost" size="icon" onClick={() => fileRef.current?.click()} aria-label="Import JSON" title="Import JSON backup">
            <Upload />
          </Button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => importJson(e.target.files?.[0])} />
          <div className="mx-1 flex rounded-md border p-0.5">
            {(
              [
                ["split", Columns2, "Split preview"],
                ["tab", PanelTop, "Tabbed preview"],
                ["off", EyeOff, "No preview"],
              ] as const
            ).map(([m, Icon, label]) => (
              <button
                key={m}
                className="tab-pill px-2 py-1"
                data-active={preview === m}
                onClick={() => setPreview(m)}
                aria-label={label}
                title={label}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
          {preview === "tab" && (
            <Button variant="hudGhost" size="sm" onClick={() => setShowPreviewTab((v) => !v)}>
              <Eye /> {showPreviewTab ? "Editor" : "Preview"}
            </Button>
          )}
          <Button variant="hud" size="sm" onClick={publish} disabled={saving || !dirty || !loaded}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />} Publish
          </Button>
          <Button variant="hudGhost" size="icon" asChild aria-label="View site">
            <a href="/" target="_blank" rel="noopener noreferrer">
              <ExternalLink />
            </a>
          </Button>
          <Button variant="hudGhost" size="icon" onClick={onLogout} aria-label="Log out">
            <LogOut />
          </Button>
        </div>
      </header>

      {!loaded ? (
        <div className="flex flex-1 items-center justify-center font-mono text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> loading content…
        </div>
      ) : (
        <div className="flex flex-1">
          {showEditor && (
            <>
              <nav className="sticky top-[49px] hidden h-[calc(100vh-49px)] w-44 shrink-0 overflow-y-auto border-r p-2 md:block">
                {(["Site", "Sections", "Advanced"] as const).map((g) => (
                  <div key={g} className="mb-3">
                    <div className="hud-label px-2 py-1">{g}</div>
                    {EDITORS.filter((e) => e.group === g).map((e) => (
                      <button
                        key={e.id}
                        onClick={() => setSection(e.id)}
                        data-active={section === e.id}
                        className="tab-pill block w-full text-left"
                      >
                        {e.label}
                      </button>
                    ))}
                  </div>
                ))}
              </nav>
              <div className={`min-w-0 flex-1 ${showSplit ? "lg:max-w-[50%]" : ""}`}>
                <div className="border-b p-2 md:hidden">
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                    aria-label="Section"
                  >
                    {EDITORS.map((e) => (
                      <option key={e.id} value={e.id} className="bg-card">
                        {e.group} · {e.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-4 p-4">
                  <div className="flex items-end justify-between gap-2 border-b pb-3">
                    <div>
                      <div className="hud-label">{editor.group} // editing</div>
                      <h2 className="text-xl font-bold tracking-tight">{editor.label}</h2>
                    </div>
                    <span className="hud-label">ctrl+s publish · ctrl+z undo</span>
                  </div>
                  {editor.render({ draft, set: h.set })}
                </div>
              </div>
            </>
          )}
          {showFrame && (
            <div className={`${showSplit ? "hidden lg:block" : ""} sticky top-[49px] h-[calc(100vh-49px)] flex-1 border-l`}>
              <div className="flex items-center justify-between border-b bg-card px-3 py-1">
                <span className="hud-label">live preview · unsaved draft</span>
                <span className="hud-label">{h.undoCount}/50 history</span>
              </div>
              <iframe ref={iframeRef} src="/?preview=1" title="Live preview" className="h-[calc(100%-28px)] w-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
