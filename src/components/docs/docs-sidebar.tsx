"use client";

import { T as TranslatedText, useLanguage } from "@/components/common/language-provider";


import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { SiteLogo } from "@/components/common/site-logo";
import {
  COMPONENTS,
  isLightVideo,
  type ComponentEntry,
} from "@/data/components";
import { cn } from "@/lib/utils";
import { INTERACTION_COMPONENTS, type MotionEntry } from "@/data/interaction-components";
import { InteractionPreview } from "@/components/common/interaction-preview";
import { COMPONENT_CATALOG } from "@/data/component-catalog";

type NavPreview = { kind: "canvas"; entry: ComponentEntry } | { kind: "interaction"; entry: MotionEntry };
const PREVIEWS = new Map<string, NavPreview>([
  ...COMPONENTS.map((entry): [string, NavPreview] => [entry.href, { kind: "canvas", entry }]),
  ...INTERACTION_COMPONENTS.map((entry): [string, NavPreview] => [entry.href, { kind: "interaction", entry }]),
]);
const PREVIEW_W = 224;
const PREVIEW_H = 168;
const EASE = [0.23, 1, 0.32, 1] as const;

const HOVER_QUERY = "(hover: hover) and (pointer: fine)";

const NEW_HREFS = new Set<string>();

function subscribeHover(callback: () => void) {
  const mql = window.matchMedia(HOVER_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

const sections = [
  {
    title: "Getting Started",
    items: [
      { href: "/docs", label: "Introduction" },
      { href: "/docs/installation", label: "Installation" },
      { href: "/docs/rendering", label: "Rendering" },
      { href: "/docs/mcp", label: "AI integration" },
    ],
  },
  {
    title: "Components",
    items: [
      { href: "/components", label: "Browse All" },
      ...COMPONENT_CATALOG.map(entry => ({ href: entry.href, label: entry.name })),
    ],
  },
] as const;

export function DocsNavList({
  onNavigate,
  showPreviews = false,
}: {
  onNavigate?: () => void;
  showPreviews?: boolean;
}) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const [preview, setPreview] = useState<NavPreview | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const activeRef = useRef(false);
  const canHover = useSyncExternalStore(
    subscribeHover,
    () => window.matchMedia(HOVER_QUERY).matches,
    () => false,
  );

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 350, damping: 38 });
  const sy = useSpring(my, { stiffness: 350, damping: 38 });
  const x = shouldReduceMotion ? mx : sx;
  const y = shouldReduceMotion ? my : sy;

  const enabled = showPreviews && canHover;

  const place = (event: React.PointerEvent, jump: boolean) => {
    const pad = 12;
    const px = Math.min(
      event.clientX + 20,
      window.innerWidth - PREVIEW_W - pad,
    );
    const py = Math.min(
      Math.max(event.clientY - PREVIEW_H / 2, pad),
      window.innerHeight - PREVIEW_H - pad,
    );
    if (jump) {
      mx.jump(px);
      my.jump(py);
      sx.jump(px);
      sy.jump(py);
    } else {
      mx.set(px);
      my.set(py);
    }
  };

  const clearPreview = () => {
    clearTimeout(hoverTimer.current);
    activeRef.current = false;
    setPreview(null);
  };

  useEffect(() => {
    const hide = () => { clearTimeout(hoverTimer.current); activeRef.current = false; setPreview(null); };
    const onVisibility = () => { if (document.hidden) hide(); };
    window.addEventListener("blur", hide);
    window.addEventListener("scroll", hide, true);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(hoverTimer.current);
      window.removeEventListener("blur", hide);
      window.removeEventListener("scroll", hide, true);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [pathname]);

  return (
    <div onPointerLeave={enabled ? clearPreview : undefined}>
      {sections.map((section) => (
        <div key={section.title} className="mt-4 first:mt-0">
          <p className="px-2 pb-1.5 text-[12px] font-medium text-muted-foreground/70">
            <TranslatedText>{section.title}</TranslatedText>
          </p>
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = pathname === item.href;
              const entry = enabled ? PREVIEWS.get(item.href) : undefined;
              return (
                <li key={item.href}>
                  <Link prefetch={false}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => { clearPreview(); onNavigate?.(); }}
                    onPointerEnter={
                      enabled
                        ? (event) => {
                            if (!entry) {
                              clearPreview();
                              return;
                            }
                            clearTimeout(hoverTimer.current);
                            place(event, !activeRef.current);
                            const switching = activeRef.current;
                            activeRef.current = true;
                            if (switching) setPreview(entry);
                            else hoverTimer.current = setTimeout(() => setPreview(entry), 120);
                          }
                        : undefined
                    }
                    onPointerMove={
                      entry ? (event) => place(event, false) : undefined
                    }
                    onPointerLeave={enabled ? clearPreview : undefined}
                    onFocus={entry ? (event) => {
                      clearTimeout(hoverTimer.current);
                      const rect = event.currentTarget.getBoundingClientRect();
                      const px = Math.min(rect.right + 12, window.innerWidth - PREVIEW_W - 12);
                      const py = Math.max(12, Math.min(rect.top, window.innerHeight - PREVIEW_H - 12));
                      mx.jump(px); my.jump(py); sx.jump(px); sy.jump(py);
                      activeRef.current = true; setPreview(entry);
                    } : undefined}
                    onBlur={entry ? clearPreview : undefined}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-colors duration-150",
                      active
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    <TranslatedText>{item.label}</TranslatedText>
                    {NEW_HREFS.has(item.href) && (
                      <>
                        <span
                          aria-hidden
                          className="size-1.5 shrink-0 rounded-full bg-blue-500"
                        />
                        <span className="sr-only"><TranslatedText>New</TranslatedText></span>
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {enabled &&
        createPortal(
          <AnimatePresence>
            {preview && (
              <motion.div
                key="docs-nav-preview"
                initial={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.96 }
                }
                animate={{ opacity: 1, scale: 1 }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.97 }
                }
                transition={{ duration: 0.18, ease: EASE }}
                style={{ x, y, width: PREVIEW_W }}
                data-sidebar-preview={preview.entry.href}
                aria-hidden="true"
                className="pointer-events-none fixed top-0 left-0 z-50"
              >
                <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-2xl shadow-black/20">
                  {preview.kind === "interaction" ? <div className="aspect-4/3 w-full">
                    <InteractionPreview key={preview.entry.slug} slug={preview.entry.slug} poster={preview.entry.preview}
                      source={preview.entry.sourceFile ? `/motion/${preview.entry.slug}.html` : undefined}
                      width={preview.entry.canvasWidth} height={preview.entry.canvasHeight} active />
                  </div> : <video
                    key={preview.entry.video}
                    src={preview.entry.video}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className={cn(
                      "aspect-4/3 w-full object-cover",
                      isLightVideo(preview.entry.video)
                        ? "dark:invert dark:hue-rotate-180"
                        : "invert hue-rotate-180 dark:invert-0 dark:hue-rotate-0",
                    )}
                  />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}

export function DocsSidebar() {
  const { t } = useLanguage();
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const el = scrollEl;
    if (!el) return;
    const update = () => {
      const top = el.scrollTop > 4;
      const bottom = el.scrollHeight - el.clientHeight - el.scrollTop > 4;
      el.style.setProperty("--fade-top", top ? "1" : "0");
      el.style.setProperty("--fade-bottom", bottom ? "1" : "0");
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [scrollEl]);

  return (
    <aside className="fixed top-4 bottom-4 left-4 z-40 hidden w-60 flex-col rounded-2xl border border-border/60 bg-background/70 backdrop-blur-xl backdrop-saturate-150 [view-transition-name:docs-sidebar] lg:flex">
      <div className="px-5 pt-5 pb-4">
        <Link prefetch={false}
          href="/"
          aria-label={t("LeiBox home")}
          className="inline-block transition-opacity duration-150 hover:opacity-70"
        >
          <SiteLogo navigation />
        </Link>
      </div>

      <nav
        ref={setScrollEl}
        aria-label={t("Docs")}
        className="demo-controls-scroll docs-sidebar-scroll flex-1 overflow-y-auto pr-4 pb-5 pl-3"
      >
        <DocsNavList showPreviews />
      </nav>

    </aside>
  );
}
