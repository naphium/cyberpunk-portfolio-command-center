import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import type { SiteData, TabConfig } from "@/lib/content";
import { Copy, ExternalLink, Hash, Moon, Music, Sun, Terminal as TermIcon, Zap } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  tabs: TabConfig[];
  data: SiteData;
  mode: "dark" | "light";
  onTab: (id: string) => void;
  onToggleTheme: () => void;
  onTerminal: () => void;
  onMatrix: () => void;
  onCopyLink: () => void;
  onAudio: () => void;
}

export function CommandPalette(p: Props) {
  const run = (fn: () => void) => () => {
    p.onOpenChange(false);
    setTimeout(fn, 50);
  };
  return (
    <CommandDialog open={p.open} onOpenChange={p.onOpenChange}>
      <CommandInput placeholder="Search sections, actions, links…" className="font-mono" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Sections">
          {p.tabs.map((t, i) => (
            <CommandItem key={t.id} onSelect={run(() => p.onTab(t.id))}>
              <Hash /> {t.label}
              {i < 9 && <span className="ml-auto font-mono text-xs text-muted-foreground">{i + 1}</span>}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={run(p.onTerminal)}>
            <TermIcon /> Open terminal
          </CommandItem>
          <CommandItem onSelect={run(p.onToggleTheme)}>
            {p.mode === "dark" ? <Sun /> : <Moon />} Toggle theme
          </CommandItem>
          <CommandItem onSelect={run(p.onCopyLink)}>
            <Copy /> Copy site link
          </CommandItem>
          <CommandItem onSelect={run(p.onAudio)}>
            <Music /> Play / pause music
          </CommandItem>
          <CommandItem onSelect={run(p.onMatrix)}>
            <Zap /> Enter the Matrix
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Links">
          {p.data.links.map((l) => (
            <CommandItem key={l.id} onSelect={run(() => window.open(l.url, "_blank", "noopener"))}>
              <ExternalLink /> {l.title}
              <span className="ml-auto font-mono text-xs text-muted-foreground">{l.handle}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
