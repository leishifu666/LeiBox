"use client";

import { T } from "@/components/common/language-provider";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { InteractionPreview } from "@/components/common/interaction-preview";
import { PreviewVideo } from "@/components/common/preview-video";
import { COMPONENT_CATALOG, type CatalogEntry } from "@/data/component-catalog";

const MID = Math.ceil(COMPONENT_CATALOG.length / 2);
const FIRST_ROW = COMPONENT_CATALOG.slice(0, MID);
const SECOND_ROW = COMPONENT_CATALOG.slice(MID);
// Duration scales with the item count so the scroll speed stays constant as the collection grows.
const ROWS: {
  items: CatalogEntry[];
  direction?: "reverse";
  duration: string;
}[] = [
  { items: FIRST_ROW, duration: `${FIRST_ROW.length * 16}s` },
  { items: SECOND_ROW, direction: "reverse", duration: `${SECOND_ROW.length * 24}s` },
];

function GalleryCard({
  component,
  focusable = true,
  mediaActive,
}: {
  component: CatalogEntry;
  focusable?: boolean;
  mediaActive: boolean;
}) {
  return (
    <Link prefetch={false}
      href={component.href}
      tabIndex={focusable ? undefined : -1}
      data-preview-card
      data-component-card={component.href}
      data-component-home-card
      className="group block w-64 shrink-0 rounded-2xl border border-border/60 bg-muted/30 p-2 transition-colors duration-150 hover:bg-muted/50 sm:w-72"
    >
      <div className="relative flex aspect-4/3 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border/70 bg-background/60">
        {mediaActive && (component.kind === "interaction" ? (
          <InteractionPreview
            slug={component.slug}
            poster={component.preview}
            source={component.sourceFile ? `/motion/${component.slug}.html` : undefined}
            width={component.canvasWidth}
            height={component.canvasHeight}
          />
        ) : (
          <PreviewVideo
            src={component.video}
            className="absolute inset-0 size-full object-cover"
          />
        ))}
        <div data-component-caption className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/75 via-black/35 to-transparent p-4 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">
          <h3 className="text-[15px] font-medium tracking-tight text-white">
            <T>{component.name}</T>
          </h3>
          <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-pretty text-white/70">
            <T>{component.description}</T>
          </p>
        </div>
      </div>
    </Link>
  );
}

function MarqueeRow({ row, near }: { row: typeof ROWS[number]; near: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState<Set<number>>(new Set());
  const [focused, setFocused] = useState<number>();

  useEffect(() => {
    const element = root.current;
    if (!element || !near) return;
    // One observer per track also sees cards moving under its overflow clip.
    const observer = new IntersectionObserver(entries => {
      setVisible(previous => {
        const next = new Set(previous);
        for (const entry of entries) {
          const index = Number((entry.target as HTMLElement).dataset.marqueeSlot);
          if (entry.isIntersecting) next.add(index);
          else next.delete(index);
        }
        return next;
      });
    }, { root: element, rootMargin: "0px 320px" });
    element.querySelectorAll("[data-marquee-slot]").forEach(slot => observer.observe(slot));
    return () => observer.disconnect();
  }, [near]);

  return <div ref={root} className="marquee" onFocusCapture={event => {
    const slot = (event.target as Element).closest<HTMLElement>("[data-marquee-slot]");
    if (slot) setFocused(Number(slot.dataset.marqueeSlot));
  }} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(undefined); }}>
    <div className="marquee-track" data-direction={row.direction} data-ready="" data-in-view={near ? "" : undefined} style={{ "--marquee-duration": row.duration } as React.CSSProperties}>
      {[0, 1].map(copy => <ul key={copy} aria-hidden={copy === 1 || undefined} className="flex gap-4 pr-4">
        {row.items.map((component, index) => {
          const slot = copy * row.items.length + index;
          return <li key={component.href} data-marquee-slot={slot}>
            <GalleryCard component={component} focusable={copy === 0} mediaActive={near && (visible.has(slot) || focused === slot)} />
          </li>;
        })}
      </ul>)}
    </div>
  </div>;
}

export function GalleryMarquee() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        if (entry.isIntersecting) setReady(true);
        setInView(entry.isIntersecting);
      },
      { rootMargin: "600px" },
    );
    io.observe(host);
    const sync = () => setPageVisible(!document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", sync); };
  }, []);

  return (
    <div ref={hostRef} className="flex flex-col gap-4">
      {ROWS.map((row, rowIndex) => (
        ready ? <MarqueeRow key={rowIndex} row={row} near={inView && pageVisible} /> : (
            <div
              key={rowIndex}
              aria-hidden
              className="w-64 rounded-2xl border border-transparent p-2 sm:w-72"
            >
              <div className="aspect-4/3 rounded-lg border border-transparent" />
            </div>
          )
      ))}
    </div>
  );
}
