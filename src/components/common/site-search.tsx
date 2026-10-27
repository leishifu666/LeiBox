"use client";

import { T, useLanguage } from "@/components/common/language-provider";
import { translateText } from "@/lib/i18n/translate";
import { GrowingPanel } from "@/components/common/growing-panel";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";

import { cn } from "@/lib/utils";
import { COMPONENT_CATALOG } from "@/data/component-catalog";
let searchOpen = false;
let searchTrigger: HTMLElement | null = null;
const listeners = new Set<() => void>();

function setSearchOpen(next: boolean, trigger?: HTMLElement) {
  if (next) {
    searchTrigger = trigger ?? [...document.querySelectorAll<HTMLElement>("[data-search-trigger]")]
      .find((button) => button.getBoundingClientRect().width > 0) ?? null;
  }
  searchOpen = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
interface SearchEntry {
  href: string;
  label: string;
  section: string;
  hint?: string;
  /** Shown as a quick link before the user types anything. */
  suggested?: boolean;
}

const ENTRIES: SearchEntry[] = [
  ...COMPONENT_CATALOG.map((component) => ({
    href: component.href,
    label: component.name,
    section: "Components",
    hint: component.kind === "interaction" ? component.keywords : component.description,
    suggested: true,
  })),
  {
    href: "/docs",
    label: "Introduction",
    section: "Getting Started",
    suggested: true,
  },
  {
    href: "/docs/installation",
    label: "Installation",
    section: "Getting Started",
    suggested: true,
  },
  {
    href: "/docs/rendering",
    label: "Rendering",
    section: "Getting Started",
    hint: "webgl webgpu vgpu wgsl renderer",
  },
  { href: "/docs/mcp", label: "AI integration", section: "Getting Started", hint: "mcp cli skill ai 接入 技能 命令行" },
  {
    href: "/components",
    label: "Browse All",
    section: "Components",
    suggested: true,
  },
  {
    href: "/docs/components/ascii-object",
    label: "ASCII Object",
    section: "Components",
    hint: "ascii 3d model glb gltf svg image studio three.js characters glyph shape terminal",
  },
  {
    href: "/docs/components/asciify",
    label: "Asciify",
    section: "Components",
    hint: "ascii text characters filter cursor lens terminal glyph matrix",
  },
  {
    href: "/docs/components/frost",
    label: "Frost",
    section: "Components",
    hint: "ice frozen frost melt refraction winter freeze snow blur glass pane",
  },
  {
    href: "/docs/components/glass",
    label: "Glass",
    section: "Components",
    hint: "lens refraction magnify zoom",
  },
  {
    href: "/docs/components/glass-object",
    label: "Glass Object",
    section: "Components",
    hint: "liquid glass 3d model svg png refraction dispersion transmission three.js",
  },
  {
    href: "/docs/components/glyph-rain",
    label: "Glyph Rain",
    section: "Components",
    hint: "matrix rain code falling glyphs katakana light glow digital",
  },
  {
    href: "/docs/components/particle-object",
    label: "Particle Object",
    section: "Components",
    hint: "particles 3d model svg png image push physics point cloud three.js",
  },
  {
    href: "/docs/components/particle-scroll",
    label: "Particle Scroll",
    section: "Components",
    hint: "sand dissolve scroll",
  },
  {
    href: "/docs/components/liquid-object",
    label: "Liquid Object",
    section: "Components",
    hint: "liquid fluid water ripple warp distort chromatic aberration rainbow fringe swirl eddy melt 3d model glb svg png image logo cursor three.js",
  },
];

function matches(entry: SearchEntry, query: string) {
  const haystack =
    `${entry.label} ${translateText(entry.label, "zh")} ${entry.section} ${translateText(entry.section, "zh")} ${entry.hint ?? ""}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

export function SearchButton() {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      aria-label={t("Search")}
      aria-haspopup="dialog"
      data-search-trigger
      onClick={(event) => setSearchOpen(true, event.currentTarget)}
      className="grid size-8 place-items-center rounded-full border border-border/70 text-muted-foreground transition-[color,transform] duration-150 ease-out hover:text-foreground active:scale-95 motion-reduce:transition-none sm:border-transparent"
    >
      <Search aria-hidden className="size-[16px]" />
    </button>
  );
}

export function SearchDialog() {
  const { t } = useLanguage();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef(() => setSearchOpen(false));
  const open = useSyncExternalStore(subscribe, () => searchOpen, () => false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (searchOpen) closeRef.current();
        else if (!document.querySelector("dialog[open]")) setSearchOpen(true);
      } else if (event.key === "/" && !searchOpen) {
        const target = event.target as HTMLElement | null;
        if (document.querySelector("dialog[open]") || target?.matches("input, textarea, select") || target?.isContentEditable) return;
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (href: string) => {
    setSearchOpen(false);
    router.push(href);
  };

  return (
    <GrowingPanel
      open={open}
      onOpenChange={setSearchOpen}
      trigger={searchTrigger}
      triggerSelector="[data-search-trigger]"
      closeRef={closeRef}
      focusRef={inputRef}
      kind="search"
      label={t("Search")}
    >
      {open ? <SearchPanel go={go} inputRef={inputRef} /> : null}
    </GrowingPanel>
  );
}

function SearchPanel({ go, inputRef }: { go: (href: string) => void; inputRef: RefObject<HTMLInputElement | null> }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  const searching = query.trim().length > 0;
  const results = useMemo(
    () =>
      searching
        ? ENTRIES.filter((entry) => matches(entry, query))
        : ENTRIES.filter((entry) => entry.suggested),
    [query, searching],
  );

  const moveActive = (next: number) => {
    setActiveIndex(next);
    requestAnimationFrame(() => {
      listRef.current
        ?.querySelector('[data-active="true"]')
        ?.scrollIntoView({ block: "nearest" });
    });
  };

  const onInputKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActive(Math.min(activeIndex + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(Math.max(activeIndex - 1, 0));
    } else if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      go(results[activeIndex].href);
    }
  };

  let lastSection = "";

  return (
    <>
      <div className="flex shrink-0 items-center gap-2.5 border-b border-border/60 px-4">
        <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={onInputKeyDown}
          placeholder={t("Search components and docs")}
          aria-label={t("Search components and docs")}
          className="h-12 w-full bg-transparent text-[14px] outline-none placeholder:text-muted-foreground/70"
        />
        <kbd className="shrink-0 rounded-md border border-border/60 px-1.5 py-0.5 text-[11px] text-muted-foreground/70"><T>
          esc
        </T></kbd>
      </div>

      <div ref={listRef} className="scrollbar-none max-h-[46svh] min-h-0 overflow-y-auto overscroll-contain p-2">
        {results.length === 0 ? (
          <p className="px-2.5 py-6 text-center text-[13px] text-muted-foreground"><T>
            No results for &ldquo;</T>{query}<T>&rdquo;
          </T></p>
        ) : (
          results.map((entry, index) => {
            const section = searching ? entry.section : "Quick links";
            const heading = section !== lastSection ? section : null;
            lastSection = section;
            const active = index === activeIndex;
            return (
              <div key={entry.href}>
                {heading ? (
                  <p className="px-2.5 pt-3 pb-1.5 text-[12px] font-medium text-muted-foreground/70 first:pt-1">
                    <T>{heading}</T>
                  </p>
                ) : null}
                <button
                  type="button"
                  data-active={active}
                  onClick={() => go(entry.href)}
                  onPointerMove={() => setActiveIndex(index)}
                  className={cn(
                    "flex w-full cursor-pointer items-center rounded-lg px-2.5 py-2 text-left text-[13.5px] transition-colors duration-100",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <T>{entry.label}</T>
                </button>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
