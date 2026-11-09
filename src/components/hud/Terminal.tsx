import { useEffect, useRef, useState, type ReactNode } from "react";
import type { SiteData, TabConfig } from "@/lib/content";
import { eggOutput } from "@/lib/easter-eggs";

interface Line {
  kind: "in" | "out" | "err" | "ok";
  text: ReactNode;
}

interface Props {
  open: boolean;
  onClose: () => void;
  data: SiteData;
  tabs: TabConfig[];
  onTab: (id: string) => void;
  onTheme: (m: string) => void;
  onMatrix: () => void;
}

const NEOFETCH_ART = String.raw`   _  __
  / |/ /__ ____  / /  (_)_ ____ _
 /    / _ '/ _ \/ _ \/ / // /  ' \
/_/|_/\_,_/ .__/_//_/_/\_,_/_/_/_/
         /_/`;

export function Terminal({ open, onClose, data, tabs, onTab, onTheme, onMatrix }: Props) {
  const t = data.settings.terminal;
  const [lines, setLines] = useState<Line[]>(() => t.motd.split("\n").map((m) => ({ kind: "ok" as const, text: m })));
  const [input, setInput] = useState("");
  const [hist, setHist] = useState<string[]>([]);
  const [hi, setHi] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [lines]);

  const print = (...ls: Line[]) => setLines((p) => [...p, ...ls].slice(-400));
  const out = (text: ReactNode) => ({ kind: "out" as const, text });

  const run = async (raw: string) => {
    const cmd = raw.trim();
    print({ kind: "in", text: `${t.prompt} ${cmd}` });
    if (!cmd) return;
    setHist((h) => [cmd, ...h].slice(0, 50));
    const [name = "", ...args] = cmd.split(/\s+/);
    const arg = args.join(" ");
    const p = data.profile;
    const custom = t.customCommands.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (custom) return print(...custom.output.split("\n").map(out));

    switch (name.toLowerCase()) {
      case "help":
        return print(
          out("available commands:"),
          ...[
            ["help", "show this list"],
            ["whoami", "who runs this node"],
            ["neofetch", "system summary"],
            ["ls", "list sections"],
            ["cd <tab>", "jump to a section"],
            ["open <link>", "open a link by name"],
            ["socials", "list links"],
            ["theme <light|dark>", "switch theme"],
            ["ip", "your public ip"],
            ["ua", "your user agent"],
            ["pgp", "public pgp key"],
            ["ssh", "ssh public key"],
            ["source", "view source"],
            ["matrix", "follow the white rabbit"],
            ["clear", "clear screen"],
            ...t.customCommands.map((c) => [c.name, "custom"]),
          ].map(([a = "", b = ""]) => out(`  ${a.padEnd(20)} ${b}`)),
        );
      case "whoami":
        return print(out(`${p.name} (@${p.handle}) — ${p.tagline}`));
      case "neofetch":
        return print(
          out(<pre className="text-primary">{NEOFETCH_ART}</pre>),
          out(`user     ${p.handle}@hud`),
          out(`name     ${p.name}`),
          out(`loc      ${p.location} [${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}]`),
          out(`shell    hud-sh 2.6`),
          out(`cpu      ${navigator.hardwareConcurrency ?? "?"} threads`),
          out(`screen   ${window.screen.width}x${window.screen.height}`),
          out(`skills   ${data.skills.badges.slice(0, 6).join(", ")}`),
        );
      case "ls":
        return print(out(tabs.map((x) => x.id).join("  ")));
      case "cd": {
        const target = tabs.find((x) => x.id === arg.toLowerCase() || x.label.toLowerCase() === arg.toLowerCase());
        if (!target) return print({ kind: "err", text: `cd: no such section: ${arg}` });
        onTab(target.id);
        return print({ kind: "ok", text: `→ /${target.id}` });
      }
      case "open": {
        const l = data.links.find((x) => x.title.toLowerCase().includes(arg.toLowerCase()));
        if (!arg || !l) return print({ kind: "err", text: `open: link not found: ${arg}` });
        window.open(l.url, "_blank", "noopener");
        return print({ kind: "ok", text: `opening ${l.url}` });
      }
      case "socials":
        return print(...data.links.map((l) => out(`  ${l.title.padEnd(14)} ${l.url}`)));
      case "theme":
        if (!["light", "dark", "glass", "obsidian", "terminal", "nordic", "sunset", "kraft", "custom"].includes(arg))
          return print({ kind: "err", text: "usage: theme <light|dark|glass|obsidian|terminal|nordic|sunset|kraft>" });
        onTheme(arg);
        return print({ kind: "ok", text: `theme → ${arg}` });
      case "ip":
        try {
          const r = await fetch("https://api.ipify.org?format=json");
          const j = (await r.json()) as { ip: string };
          return print(out(j.ip));
        } catch {
          return print({ kind: "err", text: "ip: lookup failed" });
        }
      case "ua":
        return print(out(navigator.userAgent));
      case "pgp":
        return print(...p.pgpKey.split("\n").map(out));
      case "ssh":
        return print(out(p.sshKey));
      case "source":
        if (p.sourceUrl) window.open(p.sourceUrl, "_blank", "noopener");
        return print(out(p.sourceUrl || "source not published"));
      case "matrix":
        onMatrix();
        onClose();
        return;
      case "sudo":
        return print({ kind: "err", text: `${p.handle} is not in the sudoers file. This incident will be reported. 🚨` });
      case "rm":
        return print({ kind: "err", text: "nice try." });
      case "clear":
        return setLines([]);
      case "exit":
        return onClose();
      default:
        { const egg = eggOutput(name.toLowerCase(), p.handle); if (egg !== null) return print(...egg.split("\n").map(out)); }
        return print({ kind: "err", text: `command not found: ${name}. try 'help'` });
    }
  };

  if (!open) return null;
  return (
    <div className="animate-drop fixed inset-x-0 top-0 z-[80] h-[55vh] border-b border-primary/40 bg-background/95 font-mono text-sm shadow-2xl">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="hud-label">tty0 — hud shell</span>
        <button className="hud-label hover:text-primary" onClick={onClose}>
          [esc] close
        </button>
      </div>
      <div ref={bodyRef} className="h-[calc(55vh-88px)] overflow-y-auto px-4 py-3" onClick={() => inputRef.current?.focus()}>
        {lines.map((l, i) => (
          <div
            key={i}
            className={
              l.kind === "err"
                ? "whitespace-pre-wrap text-destructive"
                : l.kind === "in"
                  ? "whitespace-pre-wrap text-foreground"
                  : l.kind === "ok"
                    ? "whitespace-pre-wrap text-primary"
                    : "whitespace-pre-wrap text-muted-foreground"
            }
          >
            {l.text}
          </div>
        ))}
      </div>
      <form
        className="flex items-center gap-2 border-t px-4 py-2"
        onSubmit={(e) => {
          e.preventDefault();
          void run(input);
          setInput("");
          setHi(-1);
        }}
      >
        <span className="shrink-0 text-primary">{t.prompt}</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowUp") {
              e.preventDefault();
              const n = Math.min(hi + 1, hist.length - 1);
              setHi(n);
              setInput(hist[n] ?? "");
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              const n = Math.max(hi - 1, -1);
              setHi(n);
              setInput(n === -1 ? "" : (hist[n] ?? ""));
            }
            if (e.key === "Tab") {
              e.preventDefault();
              const [c, a = ""] = input.split(" ");
              if (c === "cd") {
                const m = tabs.find((x) => x.id.startsWith(a));
                if (m) setInput(`cd ${m.id}`);
              }
            }
          }}
          className="w-full bg-transparent text-foreground outline-none"
          autoComplete="off"
          spellCheck={false}
          aria-label="Terminal input"
        />
      </form>
    </div>
  );
}
