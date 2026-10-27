"use client";

import { Fragment, memo, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Check, ChevronRight, Copy, LayoutGrid, Search, Sparkles, X } from "lucide-react";
import { gsap } from "gsap";
import { T, useLanguage } from "@/components/common/language-provider";
import { cn } from "@/lib/utils";
import { DocsNavList } from "@/components/docs/docs-sidebar";
import { InteractionPreview } from "@/components/common/interaction-preview";
import { COMPONENT_CATALOG } from "@/data/component-catalog";
import { INTERACTION_COMPONENTS, type MotionEntry } from "@/data/interaction-components";
import { optimizedImage } from "@/lib/optimized-image";

type Agent = "claude" | "codex";
type TaskState = "wait" | "run" | "done";
interface Cursor { kind: "pointer" | "text"; x: number; y: number; ms: number; down: boolean; show: boolean }
interface App { agent: Agent; picked: boolean; on: boolean; typed: number; pasted: boolean; lines: number }
interface Scene { cursor: Cursor; card: number; modal: boolean; copied: boolean; scroll: number; app: App }
type Piece = MotionEntry;
interface DemoCode {
  component: string;
  bundle: string;
  entry: string;
  lineCount: number;
  files: { name: string; lines: number }[];
}

// Geometry, state thresholds and timings follow the supplied 21st Hero source.
const SPEED = 1.35;
const TYPED = "pls add this component ";
const PICKS = ["top-1", "fresh-1"] as const;
const APP0: App = { agent: "codex", picked: false, on: false, typed: 0, pasted: false, lines: 0 };
const CURSOR0: Cursor = { kind: "pointer", x: 0, y: 0, ms: 0, down: false, show: false };
const INITIAL: Scene = { cursor: CURSOR0, card: 0, modal: false, copied: false, scroll: 0, app: APP0 };
const CLAWD = ["..XXXXXXX..", ".XXXXXXXXX.", "XX.XXXXX.XX", "XXXXXXXXXXX", ".XXXXXXXXX.", ".X.X...X.X."];
const THINKING = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧"];
const GLASS_FOLDER = INTERACTION_COMPONENTS.find(entry => entry.slug === "glass-folder")!;
// Keep the rehearsed cards stable while new catalog entries and their assets are prepared.
const COLLECTION = [
  "brand-poster-cards", "dot-matrix-trio", "selection-flower", "inline-text-morph",
  "galaxy-effort-slider", "notes-text-color", "bounding-box-resize", "soft-action-wheel",
  "staggered-radial-menu", "elastic-panel-resize", "blue-fluted-glass", "reasoning-effort-slider",
  "deep-agent-composer", "hammerhead-chart", "glass-tab-menu", "crumpled-paper",
  "sailing-toc", "thinking-particles", "cosmic-panels", "gradient-cover-wall",
  "otp-verification", "brand-line-cards", "share-invite", "bouncy-access", "velocity-drag", "ai-generating",
].map(slug => INTERACTION_COMPONENTS.find(entry => entry.slug === slug)!);
const TOP: Piece[] = [COLLECTION[0], GLASS_FOLDER, ...COLLECTION.slice(1, 7)];
const FRESH: Piece[] = [
  "spider-music-player", "glass-folder", "thinking-particles", "elastic-panel-resize",
  "blue-fluted-glass", "reasoning-effort-slider", "deep-agent-composer", "hammerhead-chart",
].map(slug => INTERACTION_COMPONENTS.find(entry => entry.slug === slug)!);
const HEROES = COLLECTION.filter(entry => /Canvas|Dot|Scroll/.test(entry.category)).slice(0, 8);
const UI = COLLECTION.filter(entry => /Panel|Text|Drag|Menu/.test(entry.category)).slice(0, 8);
const PIECES = [GLASS_FOLDER, GLASS_FOLDER];
const DOCK = [
  { key: "finder", name: "Finder", src: "/landing/agent-demo/finder.webp" },
  { key: "leibox", name: "LeiBox", src: "/leibox-mark.svg" },
  { key: "codex", name: "Codex", src: "/landing/agent-demo/codex.webp" },
  { key: "claude", name: "Claude", src: "/landing/agent-demo/claude.webp" },
] as const;

const PATHS = {
  plus: "M12 5v14M5 12h14",
  folder: "M3.5 6.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z",
  panel: "M4 5h16v14H4zM9 5v14", right: "m9 6 6 6-6 6", left: "M15 6l-6 6 6 6",
  mic: "M12 4a2.5 2.5 0 0 1 2.5 2.5v5a2.5 2.5 0 0 1-5 0v-5A2.5 2.5 0 0 1 12 4zM6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v3",
  search: "M11 5a6 6 0 1 1 0 12 6 6 0 0 1 0-12zM20 20l-4.5-4.5",
  computer: "M5 6h14v10H5zM3 19h18", bolt: "M13 3 5 13h6l-1 8 8-10h-6z", terminal: "m5 8 4 4-4 4M11 16h8",
  chat: "M5 6h14v9H9l-4 3z", code: "m9 8-4 4 4 4M15 8l4 4-4 4",
  plugins: "M12 4a8 8 0 1 0 5 14M15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0zm0 0v1.5a2 2 0 0 0 4 0V12",
  clock: "M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM12 8v4l3 2", more: "M6 12h.01M12 12h.01M18 12h.01",
  enter: "M19 6v6H7m0 0 3-3m-3 3 3 3", arrow: "M12 18V6m0 0-5 5m5-5 5 5", waveform: "M6 10v4M9 7v10M12 9v6M15 6v12M18 10v4",
  bell: "M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20h4", pencil: "M5 19h4L19 9l-4-4L5 15zM13 7l4 4",
  settings: "M12 9.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4",
  shield: "M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6zM12 9v4M12 16h.01", file: "M7 4h7l4 4v12H7zM14 4v4h4",
  bookmark: "M6 4h12v16l-6-4-6 4z", home: "M3.4 10.6 12 3.4l8.6 7.2v8.9c0 .7-.5 1.1-1.1 1.1h-4.3v-5.5H8.8v5.5H4.5c-.6 0-1.1-.4-1.1-1.1z",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  palette: "M12 3a9 9 0 1 0 0 18c2 0 3-1.5 2-3s0-3 2-3h2a4 4 0 0 0 4-4c0-4.5-4.5-8-10-8zM7 9h.01M11 6h.01M16 7h.01",
  layers: "m4 8 8-5 8 5-8 5zM4 12l8 5 8-5M4 16l8 5 8-5", shapes: "m8 10 4-7 4 7zM3 14h7v7H3zM18 14a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z",
  video: "M3 7h18v14H3zM3 3l18 4M7 3l3 4M14 4l3 3", help: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01",
  close: "M6 6l12 12M6 18 18 6", check: "m5 12 4 4L19 6",
  copy: "M8.5 8.5h11v11h-11zM15.5 8.5V6.6A2.1 2.1 0 0 0 13.4 4.5H6.6A2.1 2.1 0 0 0 4.5 6.6v6.8a2.1 2.1 0 0 0 2.1 2.1h1.9",
} as const;
type IconName = keyof typeof PATHS;
function Icon({ name, className, sw = 1.6 }: { name: IconName; className?: string; sw?: number }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={cn("size-3", className)} aria-hidden><path d={PATHS[name]} /></svg>;
}
// Original macOS SVGs, retained byte-for-byte. Source and upstream terms: cursors/SOURCE.md.
const MAC_CURSORS = {
  pointer: { src: "/landing/agent-demo/cursors/default.svg", hotspot: [10, 7] },
  text: { src: "/landing/agent-demo/cursors/textcursor.svg", hotspot: [16, 16] },
} as const;
function MacCursor({ kind }: { kind: Cursor["kind"] }) {
  const cursor = MAC_CURSORS[kind];
  const size = 56;
  // Keep the approved display size and align the original 32px asset hotspot.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={cursor.src} alt="" draggable={false} width={size} height={size} className="agent-demo-mac-cursor" style={{ left: -cursor.hotspot[0] * size / 32, top: -cursor.hotspot[1] * size / 32 }} />;
}

export function AgentDemo({ code }: { code: DemoCode }) {
  const { t, locale } = useLanguage();
  const rootRef = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<Scene>(INITIAL);
  const [activity, setActivity] = useState({ playing: false, reduced: false });
  const typed = t(TYPED);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let inView = false;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setActivity({ playing: inView && !document.hidden && !media.matches, reduced: media.matches });
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting && entry.intersectionRatio >= 0.2;
      sync();
    }, { threshold: [0, 0.2] });
    observer.observe(root);
    document.addEventListener("visibilitychange", sync);
    media.addEventListener("change", sync);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", sync); media.removeEventListener("change", sync); };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!activity.playing || !root) return;
    const pointer = root.querySelector<HTMLDivElement>(".g5-ap-cursor");
    if (!pointer) return;
    let alive = true;
    let cursorMotion: gsap.Context | undefined;
    const setX = gsap.quickSetter(pointer, "x", "px");
    const setY = gsap.quickSetter(pointer, "y", "px");
    let cancelWait: (() => void) | undefined;
    const timers = new Set<number>();
    const wait = (ms: number) => new Promise<void>((resolve, reject) => {
      const id = window.setTimeout(() => { timers.delete(id); cancelWait = undefined; if (alive) resolve(); }, ms * SPEED);
      timers.add(id);
      cancelWait = () => reject(new Error("Playback stopped"));
    });
    const patch = (next: Partial<Scene>) => setScene(s => ({ ...s, ...next }));
    const appPatch = (next: Partial<App>) => setScene(s => ({ ...s, app: { ...s.app, ...next } }));
    const at = (selector: string | null, fx = 0.5, fy = 0.5) => {
      const box = root.getBoundingClientRect();
      const element = selector ? root.querySelector<HTMLElement>(selector) : null;
      const target = element?.getBoundingClientRect() ?? box;
      return { x: target.left - box.left + target.width * fx, y: target.top - box.top + target.height * fy };
    };
    const move = async (position: { x: number; y: number }, ms: number, kind: Cursor["kind"] = "pointer") => {
      cursorMotion?.revert({ suppressEvents: true });
      const from = { x: Number(gsap.getProperty(pointer, "x")), y: Number(gsap.getProperty(pointer, "y")) };
      const dx = position.x - from.x;
      const dy = position.y - from.y;
      const distance = Math.hypot(dx, dy) || 1;
      const bend = Math.min(40, distance * 0.14) * (dx >= 0 ? -1 : 1);
      const control = { x: (from.x + position.x) / 2 - dy / distance * bend, y: (from.y + position.y) / 2 + dx / distance * bend };
      const progress = { t: 0 };
      setScene(s => ({ ...s, cursor: { ...s.cursor, ...position, kind: "pointer", ms: ms * SPEED, show: true } }));
      cursorMotion = gsap.context(() => {
        gsap.to(progress, {
          t: 1, duration: ms * SPEED / 1000, ease: "power2.inOut",
          onUpdate: () => {
            const t = progress.t, u = 1 - t;
            setX(u * u * from.x + 2 * u * t * control.x + t * t * position.x);
            setY(u * u * from.y + 2 * u * t * control.y + t * t * position.y);
          },
        });
      }, root);
      await wait(ms + 60);
      // Suppress the proxy's rewind callback so cleanup keeps the hotspot at its destination.
      setX(position.x); setY(position.y);
      cursorMotion.revert({ suppressEvents: true }); cursorMotion = undefined;
      if (kind === "text") setScene(s => ({ ...s, cursor: { ...s.cursor, kind } }));
    };
    const click = async () => {
      setScene(s => ({ ...s, cursor: { ...s.cursor, down: true, ms: 0 } })); await wait(170);
      setScene(s => ({ ...s, cursor: { ...s.cursor, down: false } })); await wait(120);
    };
    const copy = async (card: number) => {
      patch({ card, copied: false });
      await move(at(`[data-ap="${PICKS[card]}"]`, 0.55, 0.5), 520); await click();
      patch({ modal: true }); await wait(900);
      await move(at("[data-ap-copy]", 0.5, 0.55), 420); await click();
      patch({ copied: true }); await wait(450); patch({ modal: false }); await wait(200);
    };
    const build = async (agent: Agent) => {
      patch({ app: { ...APP0, agent } });
      await move(at(`[data-ap-dock="${agent}"]`, 0.5, 0.45), 460); await click();
      appPatch({ picked: true }); await wait(260); appPatch({ on: true }); await wait(400);
      await move(at(`[data-ad-app="${agent}"] [data-ap-paste]`, 0.35, 0.5), 380, "text"); await click();
      for (let count = 1; count <= typed.length; count++) { appPatch({ typed: count }); await wait(22); }
      await wait(160); appPatch({ pasted: true }); await wait(150);
      await move(at(`[data-ad-app="${agent}"] [data-ap-send]`, 0.5, 0.5), 180); await click();
      for (let lines = 1; lines <= 6; lines++) { appPatch({ lines }); await wait(lines === 1 ? 520 : 560); }
      await wait(700); appPatch({ on: false, picked: false }); await wait(300);
    };
    void (async () => {
      try {
        // First yield keeps the effect free of synchronous React state updates.
        await wait(0);
        let first = true;
        while (alive) {
          setScene(s => ({ ...INITIAL, cursor: { ...s.cursor, down: false, ms: 0 } }));
          await wait(first ? 150 : 400);
          if (first) {
            const origin = at(null, 0.78, 0.7);
            setX(origin.x); setY(origin.y);
            patch({ cursor: { ...origin, ms: 0, down: false, show: true, kind: "pointer" } });
          }
          first = false; await wait(100); await copy(0); await build("claude");
          await move(at(null, 0.6, 0.62), 420);
          const box = root.getBoundingClientRect();
          const target = root.querySelector(`[data-ap="${PICKS[1]}"]`)?.getBoundingClientRect();
          if (target) patch({ scroll: Math.max(0, target.top - box.top - 0.32 * box.height) });
          await wait(900); await copy(1); await build("codex"); patch({ scroll: 0 }); await wait(700);
        }
      } catch (error) { if (alive) console.error("Agent demo playback failed", error); }
    })();
    return () => { alive = false; cursorMotion?.revert({ suppressEvents: true }); timers.forEach(id => window.clearTimeout(id)); timers.clear(); cancelWait?.(); };
  }, [activity.playing, typed, locale]);

  const current = activity.reduced ? INITIAL : scene;
  const piece = PIECES[current.card];
  const { cursor, app } = current;
  return <figure className="agent-demo" data-playing={activity.playing} data-reduced-motion={activity.reduced} aria-label={t("The GlassFolder React code copied into Claude Code and Codex, then added step by step.")}>
    <figcaption className="sr-only"><T>The GlassFolder React code copied into Claude Code and Codex, then added step by step.</T></figcaption>
    <div className="g4-plate"><div ref={rootRef} data-ap-root data-agent={app.agent} data-lines={app.lines} data-source-component={piece.slug} data-code-lines={code.lineCount} inert aria-hidden className="g4-desk pointer-events-none select-none">
      <div className="g4-app relative flex overflow-hidden"><LibrarySidebar /><div className="relative flex min-w-0 flex-1 flex-col overflow-hidden"><div className="relative z-10 bg-background"><LibraryBar /></div><div className="g5-ap-scroll space-y-9 px-4 pt-6 pb-10 md:px-7 md:pt-7" style={{ transform: `translateY(${-current.scroll}px)` }}>
        <ComponentRail rail="top" title="Components" subtitle="Creative components you can drop into any project." pieces={TOP} />
        <ComponentRail rail="fresh" title="Live demos" subtitle="Inspect before you use" pieces={FRESH} />
        <Categories />
        <ComponentRail rail="heroes" title="Motion & interaction" subtitle="Reusable interactions from the LeiBox collection." pieces={HEROES} />
        <ComponentRail rail="ui" title="Text & controls" subtitle="Details for your next interface." pieces={UI} />
      </div></div><PromptModal piece={piece} open={current.modal} copied={current.copied} playing={activity.playing} code={code} /></div>
      <div className="g5p-layer">{app.agent === "claude" ? <ClaudeWindow s={app} piece={piece} typed={typed} playing={activity.playing} code={code} /> : <CodexWindow s={app} piece={piece} typed={typed} playing={activity.playing} code={code} />}<Dock pointer={cursor} playing={activity.playing} /></div>
      <div data-cursor={cursor.kind} data-cursor-x={cursor.x} data-cursor-y={cursor.y} data-down={cursor.down || undefined} className="g5-ap-cursor" style={{ opacity: activity.playing && cursor.show ? 1 : 0 }}><span className="agent-demo-cursor-press" style={{ transform: `scale(${cursor.down && cursor.kind === "pointer" ? 0.88 : 1})` }}><MacCursor kind={cursor.kind} /></span></div>
    </div></div>
  </figure>;
}

function LibraryLogo() {
  // The existing SVG includes both the symbol and the custom wordmark.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/leibox-logo.svg?v=ei-20261023" alt="LeiBox" className="agent-demo-library-logo h-[25px] w-auto invert dark:invert-0" />;
}
const LibrarySidebar = memo(function LibrarySidebar() {
  return <aside className="g4-side hidden w-[228px] shrink-0 flex-col leading-6 lg:flex">
    <div className="px-5 pt-5 pb-4"><span className="inline-block"><LibraryLogo /></span></div>
    <nav className="agent-demo-library-nav demo-controls-scroll docs-sidebar-scroll min-h-0 flex-1 overflow-hidden pr-4 pb-5 pl-3"><DocsNavList /></nav>
  </aside>;
});
const LibraryBar = memo(function LibraryBar() {
  const { t } = useLanguage();
  return <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 px-4 md:px-5">
    <span className="lg:hidden"><LibraryLogo /></span><span className="hidden text-[13px] font-medium lg:inline"><T>Components</T></span>
    <span className="ml-auto rounded-full border border-border/70 bg-muted/30 px-2.5 py-1 text-[11px] text-muted-foreground">{t("{count} components").replace("{count}", String(COMPONENT_CATALOG.length))}</span><Search className="size-4 text-muted-foreground lg:hidden" />
  </div>;
});
const ComponentRail = memo(function ComponentRail({ rail, title, subtitle, pieces }: { rail: string; title: string; subtitle: string; pieces: Piece[] }) {
  // Only the selected modal component runs live; background cards are posters.
  return <section data-ap-rail={rail}>
    <div className="flex items-end justify-between gap-3 px-1"><div className="min-w-0"><h3 className="text-[17px] font-semibold tracking-[-0.01em]"><T>{title}</T></h3><p className="mt-0.5 truncate text-[12px] text-muted-foreground"><T>{subtitle}</T></p></div><span className="inline-flex shrink-0 items-center gap-0.5 text-[12px] text-muted-foreground"><T>Browse all</T><ChevronRight className="size-3.5" /></span></div>
    <ul className="g-noscroll mt-3 flex gap-3 overflow-x-auto px-1 pb-1 sm:gap-4">{pieces.map((piece, index) => <li key={piece.slug} className="agent-demo-card group shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted/30 p-1.5">
      <span data-ap={rail + "-" + index} data-demo-component={piece.slug} className="relative block w-[124px] sm:w-[200px] xl:w-[220px]">
        <span className="g4-pic relative block aspect-[4/3] w-full overflow-hidden rounded-lg border border-border/40"><PiecePreview piece={piece} active={false} /></span>
        <span className="block px-1.5 pt-2.5 pb-1.5"><span className="block truncate text-[12px] font-medium tracking-tight sm:text-[13px]"><T>{piece.name}</T></span><span className="mt-1 block truncate text-[10px] text-muted-foreground sm:text-[11px]"><T>{piece.category}</T></span></span>
      </span>
    </li>)}</ul>
  </section>;
});
function PiecePreview({ piece, active }: { piece: Piece; active: boolean }) {
  return active ? <InteractionPreview slug={piece.slug} poster={piece.preview} source={piece.sourceFile ? "/motion/" + piece.slug + ".html" : undefined} width={piece.canvasWidth} height={piece.canvasHeight} active preferNative /> : (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...optimizedImage(piece.preview)} alt="" loading="lazy" className="absolute inset-0 h-full w-full bg-[#f4f4f4] object-cover" />
  );
}
const Categories = memo(function Categories() {
  const counts = new Map<string, number>();
  INTERACTION_COMPONENTS.forEach(entry => counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1));
  const categories = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 6);
  return <section><h3 className="px-1 text-[17px] font-semibold tracking-[-0.01em]"><T>Browse by category</T></h3><ul className="mt-3 grid grid-cols-2 gap-2">{categories.map(([category, count]) => <li key={category} className="flex min-w-0 items-center gap-2 rounded-lg border border-border/60 px-3 py-2.5 text-[12px]"><LayoutGrid className="size-3.5 shrink-0 text-muted-foreground" /><span className="truncate"><T>{category}</T></span><span className="ml-auto text-[11px] text-muted-foreground">{count}</span></li>)}</ul></section>;
});
function PromptModal({ piece, open, copied, playing, code }: { piece: Piece; open: boolean; copied: boolean; playing: boolean; code: DemoCode }) {
  const { t } = useLanguage();
  return <div className={cn("g5-ap-dim", open && "g5-ap-on")}><div className="g5-ap-modal">
    <div className="flex items-center gap-3 px-4 py-3"><span className="g5-ap-av"><Sparkles className="size-3.5" /></span><div className="min-w-0 flex-1"><p className="truncate text-[14px] font-semibold"><T>{piece.name}</T></p><p className="truncate text-[12px] text-muted-foreground">LeiBox · React</p></div><span data-ap-copy className="g5-ap-copy">{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}<T>{copied ? "Copied" : "Copy for AI"}</T></span><span className="inline-flex size-7 shrink-0 items-center justify-center"><X className="size-4 text-muted-foreground" /></span></div>
    <div className="agent-demo-modal-tabs flex items-center gap-4 border-y border-border/60 px-4 py-2 text-[11px]"><span className="font-medium"><T>Demo</T></span><span className="text-muted-foreground"><T>Code</T></span><span className="ml-auto text-muted-foreground">{t("React · {count} files").replace("{count}", String(code.files.length))}</span></div>
    <div className="g5-ap-stage"><PiecePreview piece={piece} active={open && playing} /></div>
    <div className="agent-demo-source-preview border-t border-border/60"><div className="border-b border-border/60 bg-muted/40 px-4 py-2 font-mono text-[10px]">{code.files[0].name}</div><pre className="max-h-24 overflow-hidden px-4 py-3 font-mono text-[10px] leading-relaxed"><code>{code.entry}</code></pre></div>
  </div></div>;
}

function useThreadScroll(lines: number, playing: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const element = ref.current; if (!element || !playing) return; const scroll = () => element.scrollTo({ top: element.scrollHeight, behavior: "smooth" }); scroll(); const timers = [window.setTimeout(scroll, 180), window.setTimeout(scroll, 380)]; return () => timers.forEach(id => window.clearTimeout(id)); }, [lines, playing]);
  return ref;
}
function useThinking(active: boolean) {
  const [index, setIndex] = useState(0);
  useEffect(() => { if (!active) return; const timer = window.setInterval(() => setIndex(i => (i + 1) % THINKING.length), 90); return () => window.clearInterval(timer); }, [active]);
  return THINKING[index];
}
function Lights({ claude = false }: { claude?: boolean }) {
  return <span className={claude ? "g5cc-lights" : "contents"}>{["#ff5f57", "#febc2e", "#28c840"].map(color => <span key={color} className={claude ? undefined : "g5x-light"} style={{ background: color }} />)}</span>;
}
function Clawd() {
  return <svg viewBox="0 0 11 6" className="g5cc-clawd" shapeRendering="crispEdges" aria-hidden>{CLAWD.flatMap((row, y) => [...row].map((cell, x) => cell === "X" ? <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill="#d97757" /> : null))}</svg>;
}
function Task({ state, children }: { state: TaskState; children: ReactNode }) {
  return <li className="g5cc-task" data-task-state={state}><svg viewBox="0 0 16 16" className={cn("size-[13px] shrink-0", state === "run" && "g5cc-turn")} aria-hidden>{state === "done" ? <><circle cx="8" cy="8" r="7" fill="#c9c9c4" /><path d="m5 8.2 2 2 4-4.2" fill="none" stroke="#161616" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></> : <circle cx="8" cy="8" r="6.3" fill="none" stroke="#8f8f8a" strokeWidth="1.4" strokeDasharray={state === "run" ? "26 14" : "2.2 2.6"} />}</svg><span className={state === "done" ? "text-white/85" : "text-white/80"}>{children}</span></li>;
}

function AgentWindow({ agent, open, children }: { agent: Agent; open: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / 640));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  // One logical desktop canvas preserves the complete UI on narrow screens.
  return <div ref={ref} data-ad-app={agent} data-window-scale={scale} className={cn("agent-demo-window", open && "g5p-on")}>
    <div className={cn("agent-demo-surface", agent === "claude" ? "g5cc-app" : "g5x-app")} style={{ transform: `scale(${scale})`, "--agent-window-scale": scale } as CSSProperties}>{children}</div>
  </div>;
}

function ClaudeWindow({ s, piece, typed, playing, code }: { s: App; piece: Piece; typed: string; playing: boolean; code: DemoCode }) {
  const { t } = useLanguage();
  const sent = s.lines >= 1;
  const done = s.lines >= 6;
  const thinking = useThinking(playing && sent && !done);
  const thread = useThreadScroll(s.lines, playing);
  const title = `${piece.name} component`;
  const component = code.component;
  return <AgentWindow agent="claude" open={s.on}>
    <div className="g5cc-bar"><Lights claude /><Icon name="panel" className="size-[13px]" /><Icon name="left" className="size-[13px]" /><Icon name="right" className="size-[13px] opacity-40" /><span className="g5cc-seg"><span><Icon name="chat" /></span><span className="g5cc-seg-on"><Icon name="code" /></span></span><span className={cn("g5cc-title", sent && "text-white")}>{sent ? title : t("New session")}{sent && <Icon name="right" className="rotate-90 text-white/60" />}</span><span className="ml-auto flex items-center gap-3 text-white/55">{!sent && <span className="text-[11.5px] text-[#6ea0ff]"><T>What&apos;s new</T></span>}<Icon name="terminal" className="size-[13px]" /><Icon name="plugins" className="size-[13px]" /><Icon name="folder" className="size-[13px]" /></span></div>
    <div className="flex min-h-0 flex-1">
      <aside className="g5cc-side"><div className="g5cc-search"><Icon name="search" className="size-[11px]" /><T>Search</T></div><ul className="g5cc-nav"><li className={cn(!sent && "g5cc-on")}><Icon name="plus" />New</li><li><Icon name="folder" />Projects <span className="g5cc-beta">Beta</span></li><li><Icon name="clock" />Scheduled</li><li><Icon name="more" sw={2.6} />More</li></ul><p className="g5cc-head">Pinned <Icon name="right" className="size-2.5" /></p>{sent && <><p className="g5cc-head g5p-in">Working</p><ul className="g5cc-nav g5p-in"><li className="g5cc-on"><span className="truncate">{title}</span>{!done && <span className="ml-auto size-1.5 shrink-0 rounded-full bg-white/40" />}</li></ul></>}<p className="g5cc-head">Idle</p><ul className="g5cc-nav">{["Footer animation experiments", "Layout width adjustment", "Restore background controls", "Payout investigation", "Show more"].map(text => <li key={text} className={text === "Show more" ? "text-white/45" : undefined}><span className="truncate"><T>{text}</T></span></li>)}</ul></aside>
      <div className="g5cc-main"><div className="g5cc-col">
        {sent ? <div ref={thread} className="g5cc-thread">
          <div className="g5p-grow"><div className="g5cc-user"><p>{typed.trim()}</p><p className="mt-2.5"><T>Integrate GlassFolder from LeiBox into this project.</T></p><p className="mt-2 text-white/55">/docs/animations/glass-folder · React</p><pre data-demo-source className="agent-demo-pasted-code mt-2.5">{code.bundle}</pre><p className="mt-1 text-[11px] text-white/70">{t("{count} source files").replace("{count}", String(code.files.length))} · <T>Show more</T></p></div></div>
          {s.lines >= 3 && <div className="g5p-grow"><div className="grid gap-[9px]"><p className="g5cc-grey"><T>Read supplied source</T> <span className="text-white/75">GlassFolder.tsx…</span> <Icon name="right" className="inline size-2.5" /></p><p className="g5cc-say"><T>The React bundle includes its interaction core and styles. No registry package is needed.</T></p></div></div>}
          {done && <div className="g5p-grow"><div className="grid gap-2"><p className="g5cc-say"><T>I&apos;m done 🤙 added</T> <code className="g5cc-code">{code.files[0].name}</code> <T>and its demo, wired to your theme tokens.</T></p><p className="g5cc-say">TLDR: <code className="g5cc-code">{`<${component} />`}</code> <T>is in</T> <code className="g5cc-code">components/ui</code><T>, typecheck passes.</T></p></div></div>}
        </div> : <div className="flex flex-1 flex-col items-center justify-center"><div className="g5cc-pick">{["acme-website", "growth", "personal"].map((name, index) => <p key={name} className={cn("g5cc-pick-row", index === 0 && "text-white")}><Icon name="computer" />{name}{index === 0 && <Icon name="check" className="ml-auto" />}</p>)}<p className="g5cc-pick-row border-t border-white/[0.07] pt-2 text-white/60"><T>Choose environment</T><Icon name="right" className="size-2.5 rotate-90" /></p></div><div className="g5cc-pick mt-2"><p className="g5cc-pick-row"><Icon name="terminal" /><T>Import 11 Claude Code CLI sessions</T></p><p className="g5cc-pick-row"><Icon name="bolt" /><T>Turn on auto mode</T></p></div></div>}
        {sent && <div className="g5cc-pin"><ul className={cn("g5cc-tasks transition-opacity duration-300", s.lines >= 2 ? "opacity-100" : "opacity-0")}><Task state={s.lines >= 3 ? "done" : "run"}><T>Inspect the React project</T></Task><Task state={s.lines >= 5 ? "done" : s.lines >= 3 ? "run" : "wait"}>{t("Add {slug} component + demo").replace("{slug}", code.component)}</Task><Task state={done ? "done" : s.lines >= 5 ? "run" : "wait"}><T>Typecheck the new files</T></Task></ul><p className="g5cc-status"><span className="text-[#d97757]">{done ? "✻" : thinking}</span>{done ? <span>14s · 1.2k tokens</span> : <span><T>{s.lines >= 4 ? "Creating" : s.lines >= 2 ? "Running a command" : "Thinking"}</T> <span className="text-white/35">{62 + 41 * s.lines} tokens</span></span>}</p></div>}
        <div className="g5cc-composer">{!sent && s.typed > 0 && <Clawd />}<div data-ap-paste className="g5cc-input"><Icon name="plus" className="size-[13px] shrink-0 text-white/60" /><span className="min-w-0 flex-1 truncate">{!sent && s.typed > 0 ? <span className="text-white">{typed.slice(0, s.typed)}{s.pasted && <span className="text-white/55">{t("[Pasted text #1 +{lines} lines]").replace("{lines}", String(code.lineCount))}</span>}<span className="g5d-caret" data-typing={s.typed < typed.length || undefined} /></span> : <span className="text-white/38"><T>{sent ? done ? "Type / for commands" : "↩ to send, ⌘↩ to queue for later" : "Describe a task"}</T></span>}</span><span data-ap-send className={cn("g5cc-send", s.pasted && !sent && "g5cc-send-on")}>{sent && !done ? <span className="block size-[9px] rounded-full border-[1.5px] border-white/70" /> : <Icon name="enter" sw={1.8} />}</span><Icon name="mic" className="size-[13px] shrink-0 text-white/60" /></div><div className="g5cc-under"><span className="flex items-center gap-3">{!sent && <span className="flex items-center gap-1"><Icon name="computer" className="size-[11px]" />acme-website</span>}<T>Bypass permissions</T></span><span className="flex items-center gap-2"><span className="text-white/85">Opus 5.5</span><span className="g5-hi">High</span><span className="g5cc-ring" /></span></div></div>
      </div></div>
    </div>
  </AgentWindow>;
}

const CODEX_RAIL: { name: string; children: ReactNode; dot?: boolean }[] = [
  { name: "home", dot: true, children: <path d={PATHS.home} fill="currentColor" stroke="none" /> },
  { name: "space", children: <><rect x="9.6" y="3.6" width="9.2" height="11.6" rx="2" transform="rotate(13 14.2 9.4)" /><g transform="rotate(-11 9.6 14.3)"><path d="M6.4 8.2h5.1l3 3v7.4a1.8 1.8 0 0 1-1.8 1.8H6.4a1.8 1.8 0 0 1-1.8-1.8V10a1.8 1.8 0 0 1 1.8-1.8z" fill="#1e1e1e" /><path d="M11.5 8.2v2.2a.8.8 0 0 0 .8.8h2.2" /></g></> },
  { name: "clock", dot: true, children: <><circle cx="12" cy="12" r="8.3" /><path d="M12 7.2V12l-2.5 2.5" /></> },
  { name: "plugins", children: <path d="M20.2 12a8.2 8.2 0 1 0-3.4 6.7M20.2 12v1.4a2.5 2.5 0 0 1-5 0V12M15.2 12a3.2 3.2 0 1 1-1.1-2.4m-.9-1.4 1.4-1.4M15.1 10.1l1.4-1.4" /> },
  { name: "more", children: <g fill="currentColor" stroke="none">{[6, 12, 18].map(cx => <circle key={cx} cx={cx} cy="12" r="1.25" />)}</g> },
  { name: "review", children: <><circle cx="7" cy="5.6" r="2" /><circle cx="7" cy="18.4" r="2" /><circle cx="17" cy="18.4" r="2" /><path d="M7 7.6v8.8M17 16.4V9.8a2.8 2.8 0 0 0-2.8-2.8h-1.9M14.4 4.9l-2.1 2.1 2.1 2.1" /></> },
  { name: "sites", children: <><path d="M5.6 3.6h4.6a2 2 0 0 1 2 2v6.2h6.2a2 2 0 0 1 2 2v4.6a2 2 0 0 1-2 2h-4.6a2 2 0 0 1-2-2v-6.2H5.6a2 2 0 0 1-2-2V5.6a2 2 0 0 1 2-2z" /><rect x="14.8" y="3.6" width="5.6" height="5.6" rx="1.6" /><rect x="3.6" y="14.8" width="5.6" height="5.6" rx="1.6" /></> },
  { name: "images", children: <><rect x="7" y="3" width="14" height="15" rx="2" /><rect x="3" y="7" width="14" height="14" rx="2" /><circle cx="7.5" cy="11.5" r="1" /><path d="m4 19 4-4 3 3 3-4 3 4" /></> },
  { name: "files", children: <path d={PATHS.folder} /> },
];
function CodexMark() {
  // Cloud outline from the pinned Lobe Icons asset; its MIT notice is in vendor/agent-icons.
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="g5x-mark" aria-hidden><path d="M9.064 3.344a4.578 4.578 0 012.285-.312c1 .115 1.891.54 2.673 1.275.01.01.024.017.037.021a.09.09 0 00.043 0 4.55 4.55 0 013.046.275l.047.022.116.057a4.581 4.581 0 012.188 2.399c.209.51.313 1.041.315 1.595a4.24 4.24 0 01-.134 1.223.123.123 0 00.03.115c.594.607.988 1.33 1.183 2.17.289 1.425-.007 2.71-.887 3.854l-.136.166a4.548 4.548 0 01-2.201 1.388.123.123 0 00-.081.076c-.191.551-.383 1.023-.74 1.494-.9 1.187-2.222 1.846-3.711 1.838-1.187-.006-2.239-.44-3.157-1.302a.107.107 0 00-.105-.024c-.388.125-.78.143-1.204.138a4.441 4.441 0 01-1.945-.466 4.544 4.544 0 01-1.61-1.335c-.152-.202-.303-.392-.414-.617a5.81 5.81 0 01-.37-.961 4.582 4.582 0 01-.014-2.298.124.124 0 00.006-.056.085.085 0 00-.027-.048 4.467 4.467 0 01-1.034-1.651 3.896 3.896 0 01-.251-1.192 5.189 5.189 0 01.141-1.6c.337-1.112.982-1.985 1.933-2.618.212-.141.413-.251.601-.33.215-.089.43-.164.646-.227a.098.098 0 00.065-.066 4.51 4.51 0 01.829-1.615 4.535 4.535 0 011.837-1.388z" /><path d="m8.4 9.8 1.4 2.3-1.4 2.3M12.5 14.5h3.6" /></svg>;
}
function CodexActions() {
  const actions = [PATHS.copy,
    "M4.5 9.6v4.8c0 .5.4.9.9.9h2.4l3.9 3.3c.6.5 1.5.1 1.5-.7V6.1c0-.8-.9-1.2-1.5-.7L7.8 8.7H5.4c-.5 0-.9.4-.9.9ZM16.2 9.4a4 4 0 0 1 0 5.2M18.9 7a7.6 7.6 0 0 1 0 10",
    "M7.5 10.5v8.5M7.5 10.5 11 4.8a1.8 1.8 0 0 1 3.3 1.4l-.8 3.3h4.4a2 2 0 0 1 2 2.4l-1.2 5.6a2 2 0 0 1-2 1.5H7.5m0-8.5H5.2c-.6 0-1 .4-1 1v6.5c0 .6.4 1 1 1h2.3",
    "M16.5 13.5V5M16.5 13.5 13 19.2a1.8 1.8 0 0 1-3.3-1.4l.8-3.3H6.1a2 2 0 0 1-2-2.4l1.2-5.6a2 2 0 0 1 2-1.5h9.2m0 8.5h2.3c.6 0 1-.4 1-1V6c0-.6-.4-1-1-1h-2.3", PATHS.more];
  return <span className="g5p-in flex items-center gap-3.5 pl-0.5 text-white/45">{actions.map((path, index) => <svg key={index} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-[15px]" aria-hidden>{index === 0 ? <><rect x="8.5" y="8.5" width="11" height="11" rx="2.6" /><path d="M15.5 8.5V6.6A2.1 2.1 0 0 0 13.4 4.5H6.6A2.1 2.1 0 0 0 4.5 6.6v6.8a2.1 2.1 0 0 0 2.1 2.1h1.9" /></> : index === 4 ? [5.5, 12, 18.5].map(cx => <circle key={cx} cx={cx} cy="12" r="1.1" fill="currentColor" />) : <path d={path} />}</svg>)}</span>;
}
function CodexRow({ label, icon = "chat", emoji, nested = false, active = false, busy = false, muted = false }: { label: string; icon?: IconName | "canvas"; emoji?: string; nested?: boolean; active?: boolean; busy?: boolean; muted?: boolean }) {
  return <p className={cn("g5x-row", nested && "g5x-nest", active && "g5x-row-on", muted && "g5x-row-muted")}>
    {!nested && (icon === "canvas" ? <svg viewBox="0 0 24 24" className="g5x-row-icon g5x-canvas-icon" fill="none" stroke="currentColor" strokeWidth="1.5">{CODEX_RAIL[1].children}</svg> : <Icon name={icon} className="g5x-row-icon" />)}{emoji && <span className="g5x-emoji">{emoji}</span>}<span className="g5x-row-label"><T>{label}</T></span>{busy && <span className="g5x-busy-ring" />}
  </p>;
}

function CodexWindow({ s, piece, typed, playing, code }: { s: App; piece: Piece; typed: string; playing: boolean; code: DemoCode }) {
  const { t } = useLanguage();
  const sent = s.lines >= 1;
  const busy = sent && s.lines < 6;
  const thread = useThreadScroll(s.lines, playing);
  const emptyPrompt = t("What would you like us to build in {project}?").split("{project}");
  return <AgentWindow agent="codex" open={s.on}>
    <div className="g5x-top"><Icon name="left" /><Icon name="right" className="opacity-40" /><Icon name="panel" /><span className="g5x-menus">{["File", "Edit", "View", "Help"].map(label => <span key={label}><T>{label}</T></span>)}</span><span className="g5x-window-controls"><span>−</span><span><Copy className="size-2.5" /></span><span><X className="size-3.5" /></span></span></div>
    <div className="g5x-layout">
      <div className="g5x-rail">{CODEX_RAIL.map((entry, index) => <Fragment key={entry.name}>{entry.name === "review" && <span className="g5x-rail-div" />}<span className={cn("g5x-rail-ico", index === 0 && "g5x-rail-on")}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" className="size-[15px]">{entry.children}</svg></span></Fragment>)}<span className="g5x-avatar">D</span></div>
      <div className="g5x-workspace">
        <aside className="g5x-side">
          <div className="g5x-sidebar-title"><span>Codex</span><Icon name="right" className="rotate-90" /><Icon name="bell" className="ml-auto" /><Icon name="search" /></div>
          <div className="g5x-side-scroll">
            <CodexRow label="New chat" icon="pencil" /><CodexRow label="Canvas" icon="canvas" />
            <p className="g5x-head"><T>Pinned</T></p>
            <CodexRow emoji="🎨" label="Review landing layout" /><CodexRow emoji="🧩" label="Add navigation" /><CodexRow emoji="⚙️" label="Check mobile spacing" />
            <CodexRow icon="folder" label="sample-project" /><CodexRow nested muted label="No chats yet" />
            <CodexRow icon="folder" label="demo-project" active /><CodexRow nested emoji="🎨" label={sent ? t("Add {name}").replace("{name}", piece.name) : "Add a component"} busy={busy} />
            <CodexRow nested emoji="🧩" label="Button hover states" /><CodexRow nested emoji="🧩" label="Card entrance animation" busy /><CodexRow nested emoji="🎬" label="Panel transitions" busy /><CodexRow nested emoji="🧩" label="Typography cleanup" />
            <CodexRow nested muted label="Show more chats" /><CodexRow icon="folder" label="ui-playground" /><CodexRow icon="folder" label="component-lab" /><CodexRow nested emoji="🧩" label="Form validation" /><CodexRow nested emoji="⚙️" label="Theme settings" />
            <p className="g5x-head g5x-head-link"><T>Projects</T><Icon name="right" /></p><p className="g5x-head"><T>Recents</T></p>
          </div>
        </aside>
        <div className="g5x-main">
          <div className="g5x-main-toolbar">{sent && <span className="g5x-conversation-title"><T>{piece.name}</T></span>}<span className="g5x-new-tab"><Icon name="plus" /></span></div>
          {sent ? <div ref={thread} className="g5x-thread">
            <div className="g5p-grow"><div className="g5x-user">{typed.trim()} <span className="g5x-chip">{t("Pasted text · {lines} lines").replace("{lines}", String(code.lineCount))}</span></div></div>
            {s.lines >= 2 && <div className="g5p-grow"><p className="g5x-worked"><span><T>{busy ? "Working" : "Worked for 18s"}</T></span><Icon name="right" /></p></div>}
            {s.lines >= 3 && <div className="g5p-grow"><p className="g5x-say">{t("Added {name} from LeiBox, ").replace("{name}", piece.name)}<span className="text-[#7aa7ff]"><T>using the supplied React source</T></span><T>. The component and demo are ready.</T></p></div>}
            {code.files.slice(0, 2).map((file, index) => s.lines >= index + 4 && <div key={file.name} className="g5p-grow"><div className="g5x-card"><span className="g5x-card-ico"><Icon name="file" className="size-[15px] text-[#7fb4ff]" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white">{file.name}</span><span className="block truncate text-[11.5px] text-white/45">components/ui · +{file.lines} −0</span></span><span className="g5x-open"><T>Open in</T><Icon name="right" className="size-2.5 rotate-90" /></span></div></div>)}
            <div className="g5x-slot">{busy ? <span className="g5x-think g5p-in"><T>Thinking</T></span> : <CodexActions />}</div>
          </div> : <div className="g5x-empty"><CodexMark /><p>{emptyPrompt[0]}<span>demo-project</span>{emptyPrompt[1]}</p></div>}
          <div className="g5x-composer">
            {!sent && <div className="g5x-strip"><span><Icon name="folder" />demo-project</span><span><Icon name="computer" /><T>This computer</T></span><Icon name="settings" className="ml-auto" /></div>}
            <div className={cn("g5x-box", sent && "g5x-box-sent")}>
              <div data-ap-paste className="g5x-input">{!sent && s.typed > 0 ? <span>{typed.slice(0, s.typed)}{s.pasted && <span className="g5x-chip">{t("Pasted text · {lines} lines").replace("{lines}", String(code.lineCount))}</span>}<span className="g5d-caret" data-typing={s.typed < typed.length || undefined} /></span> : <span className="g5x-placeholder"><T>{sent ? "Work with Codex" : "Enter anything"}</T></span>}</div>
              <div className="g5x-input-actions"><Icon name="plus" className="g5x-add" /><span className="g5x-access"><Icon name="shield" /><T>Full access</T></span><span className="g5x-model">GPT-6 Astra <span>Ultra</span><Icon name="right" className="rotate-90" /></span><Icon name="mic" /><span data-ap-send className="g5x-send"><Icon name={s.pasted && !sent ? "arrow" : "waveform"} sw={1.8} /></span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AgentWindow>;
}

function Dock({ pointer, playing }: { pointer: Cursor; playing: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [geometry, setGeometry] = useState<{ xs: number[]; y: number } | null>(null);
  const [label, setLabel] = useState("");
  useEffect(() => {
    const dock = ref.current;
    const root = dock?.closest("[data-ap-root]");
    if (!dock || !root) return;
    const observer = new ResizeObserver(() => {
      const bounds = root.getBoundingClientRect();
      const tiles = Array.from(dock.querySelectorAll("[data-ap-dock]"));
      const box = dock.getBoundingClientRect();
      setGeometry({ xs: tiles.map(tile => tile.getBoundingClientRect().left - bounds.left + 29), y: box.top - bounds.top + box.height / 2 });
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);
  const near = playing && !!geometry && pointer.show && Math.abs(pointer.y - geometry.y) < 35 && pointer.x > geometry.xs[0] - 35 && pointer.x < geometry.xs[geometry.xs.length - 1] + 35;
  const showLabel = near && !pointer.down && pointer.ms > 0;
  const key = `${pointer.x},${pointer.y},${pointer.ms}`;
  useEffect(() => { if (!showLabel) return; const timer = window.setTimeout(() => setLabel(key), Math.max(0, pointer.ms - 60)); return () => window.clearTimeout(timer); }, [showLabel, key, pointer.ms]);
  const sizes = DOCK.map((_, index) => { if (!near || !geometry) return 58; const distance = Math.abs(pointer.x - geometry.xs[index]); return distance >= 150 ? 58 : 58 + 30 * Math.cos(distance / 150 * Math.PI / 2) ** 2; });
  const largest = sizes.indexOf(Math.max(...sizes));
  const duration = `${Math.max(140, pointer.ms)}ms`;
  return <div ref={ref} className="g5k-dock">{DOCK.map((entry, index) => <span key={entry.key} className="g5k-slot" style={{ width: sizes[index], transitionDuration: duration }}>{showLabel && label === key && index === largest && sizes[index] > 80 && <span className="g5k-label">{entry.name}</span>}<span data-ap-dock={entry.key} className={cn("g5k-tile", entry.key === "leibox" && "agent-demo-leibox-tile")} style={{ width: sizes[index], height: sizes[index], transitionDuration: duration }}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={entry.src} alt="" draggable={false} className="h-full w-full" />
  </span><span className={cn("g5k-run", entry.key !== "finder" && "g5k-run-on")} /></span>)}</div>;
}
