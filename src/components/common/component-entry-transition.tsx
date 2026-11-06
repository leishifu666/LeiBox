"use client";

import { gsap } from "gsap";
import { ChevronDown, LoaderCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { T } from "@/components/common/language-provider";
import { syncScrollHeaderEvent } from "@/components/common/scroll-hide-header";
import { ComponentDocHeader, MotionDemoFrame, MotionDemoSection } from "@/components/docs/component-doc-chrome";
import { captureTitleLayout, mountTitleLayout, tweenTitleLayout, type TitleLayout } from "@/lib/component-title-motion";
import type { MotionDocLayout } from "@/lib/motion-doc-layout";

import styles from "./component-entry-transition.module.css";

type Box = { x: number; y: number; width: number; height: number };
type TitleState = TitleLayout;
type Entry = {
  direction: "enter" | "return";
  href: string;
  componentHref: string;
  scrollY: number;
  from: Box;
  card: HTMLElement;
  media: HTMLElement;
  caption: HTMLElement;
  title: HTMLElement;
  fromTitle: TitleState;
  quick?: boolean;
};
type Visit = { href: string; scrollY: number; origin: string; template: HTMLElement; titleTemplate: HTMLElement; panel?: Box; detailTitle?: TitleState };
type Opening = {
  href: string;
  title: string;
  description: string;
  poster?: string;
  layout?: MotionDocLayout;
  slot: HTMLElement;
  link: HTMLAnchorElement;
  scrollY: number;
};
type ReturnPose = {
  card: Box;
  media: Box;
  title: TitleState;
  cardRadius: string;
  mediaRadius: string;
};

const collectionHref = "/components";
const previewHistoryKey = "leiboxComponentPreview";
const collectionHistoryKey = "leiboxCollectionVisit";

function restoreCollectionScroll(top: number) {
  window.scrollTo({ top, behavior: "instant" });
  // Route scroll jumps should not run the header's regular hide animation.
  window.dispatchEvent(new Event(syncScrollHeaderEvent));
}

function activeDetail(slot: HTMLElement, href: string) {
  const slug = href.split("/").pop();
  return [...slot.querySelectorAll<HTMLElement>("[data-component-document]")].find(article => {
    if (article.dataset.componentDocument !== slug) return false;
    for (let parent: HTMLElement | null = article; parent && parent !== slot; parent = parent.parentElement) {
      if (parent.hidden || parent.style.display === "none") return false;
    }
    return true;
  });
}

function ComponentEntryPreview({ opening, retry }: { opening: Opening; retry: () => void }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (slow) return;
    const timer = window.setTimeout(() => setSlow(true), 8000);
    return () => window.clearTimeout(timer);
  }, [slow]);

  const { layout, poster } = opening;
  // The selected card has already resolved this responsive poster.
  // eslint-disable-next-line @next/next/no-img-element
  const cover = poster ? <img src={poster} alt="" className="absolute inset-0 size-full object-cover" /> : null;
  const loading = (
    <span role="status" className="inline-flex items-center gap-1.5">
      <LoaderCircle aria-hidden className="size-3.5 motion-safe:animate-spin" />
      <span className={layout ? "sr-only" : undefined}><T>Loading component…</T></span>
    </span>
  );
  const retryButton = slow ? (
    <button type="button" onClick={() => { setSlow(false); retry(); }} className="rounded px-1 font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2">
      <T>Retry</T>
    </button>
  ) : null;

  return (
    <article data-component-entry-preview className="mx-auto w-full max-w-3xl">
      <ComponentDocHeader title={opening.title} description={opening.description} tags={layout?.tags} actions={layout && (
        <div className="relative shrink-0">
          <span aria-hidden className="invisible inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px]">
            <T>Copy for AI</T><ChevronDown className="size-3.5" />
          </span>
          <div className="absolute inset-0 flex items-center justify-end gap-2 text-[13px] text-muted-foreground">{loading}{retryButton}</div>
        </div>
      )} />
      {layout ? (
        <MotionDemoSection instructions={layout.instructions}>
          <MotionDemoFrame width={layout.width} height={layout.height} responsive={layout.responsive}>{cover}</MotionDemoFrame>
        </MotionDemoSection>
      ) : (
        <div data-component-demo-panel className="relative mt-8 aspect-4/3 w-full max-h-105 overflow-hidden rounded-xl border border-border/60 bg-muted">{cover}</div>
      )}
      {!layout && <div className="mt-3 flex min-h-8 items-center gap-3 text-[13px] text-muted-foreground">{loading}{retryButton}</div>}
    </article>
  );
}

function box(node: Element): Box {
  const r = node.getBoundingClientRect();
  return { x: r.left, y: r.top, width: r.width, height: r.height };
}

const colorCache = new Map<string, string>();
function tweenColor(value: string) {
  const cached = colorCache.get(value);
  if (cached) return cached;
  // Computed theme colors can be lab()/oklch(); GSAP 3.12 interpolates RGB.
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return value;
  context.fillStyle = value;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
  const color = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
  colorCache.set(value, color);
  return color;
}

function titleState(node: HTMLElement): TitleState {
  const state = captureTitleLayout(node);
  return { ...state, color: tweenColor(state.color) };
}

function applyTitle(node: HTMLElement, state: TitleState) {
  mountTitleLayout(node, state, gsap);
}

/** Freeze existing posters/video frames; never mount a second interactive demo. */
function snapshot(source: HTMLElement): HTMLElement {
  // Template contents stay inert while media attributes are sanitized. A live
  // document clone can start image requests before we remove their sources.
  const template = document.createElement("template");
  template.innerHTML = source.outerHTML;
  const copy = template.content.firstElementChild as HTMLElement;
  copy.removeAttribute("id");
  copy.querySelectorAll("[id]").forEach(node => node.removeAttribute("id"));
  const tracks = copy.querySelectorAll<HTMLElement>(".marquee-track");
  source.querySelectorAll<HTMLElement>(".marquee-track").forEach((track, index) => {
    if (!tracks[index]) return;
    tracks[index].style.animation = "none";
    tracks[index].style.transform = getComputedStyle(track).transform;
  });
  const images = copy.querySelectorAll("img");
  source.querySelectorAll("img").forEach((image, index) => {
    const target = images[index];
    if (!target) return;
    const bounds = image.getBoundingClientRect();
    const visible = bounds.width > 0 && bounds.height > 0 && bounds.bottom > 0 && bounds.top < window.innerHeight && bounds.right > 0 && bounds.left < window.innerWidth;
    target.removeAttribute("srcset");
    target.removeAttribute("sizes");
    // A transition freezes the painted viewport. Loading off-screen images in
    // its clone competes with the destination route for the same connection.
    if (!visible || !image.complete || !image.naturalWidth || !image.currentSrc) {
      target.removeAttribute("src");
      target.style.visibility = "hidden";
      return;
    }
    target.src = image.currentSrc;
    target.loading = "eager";
  });
  const videos = copy.querySelectorAll("video");
  source.querySelectorAll("video").forEach((video, index) => {
    const target = videos[index];
    if (!target) return;
    const image = document.createElement("img");
    image.className = target.className;
    image.alt = "";
    image.style.filter = getComputedStyle(video).filter;
    if (video.readyState >= 2 && video.videoWidth) {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        canvas.getContext("2d")?.drawImage(video, 0, 0);
        image.src = canvas.toDataURL("image/webp");
      } catch { if (video.poster) image.src = video.poster; }
    } else if (video.poster) image.src = video.poster;
    if (!image.getAttribute("src")) image.style.visibility = "hidden";
    target.replaceWith(image);
  });
  copy.querySelectorAll("[data-scene-ready], iframe, canvas").forEach(node => node.remove());
  copy.inert = true;
  copy.setAttribute("aria-hidden", "true");
  copy.style.animation = "none";
  return copy;
}

function freezeArticle(article: HTMLElement, layer: HTMLElement, excludedHref?: string) {
  const frozen = snapshot(article), origin = box(article);
  if (excludedHref) frozen.querySelectorAll<HTMLElement>("[data-component-card]").forEach(node => {
    if (node.dataset.componentCard === excludedHref) node.style.visibility = "hidden";
  });
  Object.assign(frozen.style, { position: "absolute", left: origin.x + "px", top: origin.y + "px", width: origin.width + "px", margin: "0" });
  layer.replaceChildren(frozen);
}

function demoPanel(article: HTMLElement) {
  return article.querySelector<HTMLElement>("[data-component-demo-panel]") ?? article.querySelector<HTMLElement>('section[aria-label="Demo"] > div');
}

/** One shared card carrier opens into the demo and returns to its gallery slot. */
export function ComponentEntryTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const main = useRef<HTMLElement>(null);
  const sourceMain = useRef<HTMLElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const floating = useRef<HTMLDivElement>(null);
  const pending = useRef<Entry | null>(null);
  const previous = useRef<Visit | null>(null);
  const restore = useRef<Visit | null>(null);
  const openingRef = useRef<Opening | null>(null);
  const [opening, setOpening] = useState<Opening | null>(null);
  const [returnVisit, setReturnVisit] = useState(0);
  const context = useRef<gsap.Context | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = useCallback((focus = false) => {
    const completed = pending.current;
    if (completed?.direction === "enter" && previous.current) {
      const article = main.current?.querySelector<HTMLElement>("[data-component-entry-preview]")
        ?? main.current?.querySelector<HTMLElement>("[data-component-document]");
      const title = article?.querySelector<HTMLElement>("h1");
      if (article) previous.current.panel = box(demoPanel(article) ?? article);
      if (title) previous.current.detailTitle = titleState(title);
    }
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = null;
    context.current?.revert(); context.current = null;
    pending.current = null;
    for (const layer of [backdrop.current, floating.current]) {
      if (layer) { layer.replaceChildren(); layer.style.display = "none"; }
    }
    for (const slot of new Set([sourceMain.current, main.current])) {
      if (!slot) continue;
      slot.inert = false;
      slot.removeAttribute("aria-busy");
      slot.dataset.componentEntryState = "idle";
    }
    sourceMain.current = null;
    if (main.current) {
      if (focus) {
        if (completed?.direction === "return") {
          restore.current = null;
          [...main.current.querySelectorAll<HTMLElement>("[data-component-card]")].find(node => node.dataset.componentCard === completed.componentHref)?.querySelector("a")?.focus({ preventScroll: true });
          return;
        }
        if (completed?.quick) return;
        const title = main.current.querySelector("h1");
        if (title) {
          title.tabIndex = -1;
          title.setAttribute("data-component-entry-focus", "");
          title.focus({ preventScroll: true });
        }
      }
    }
  }, []);

  const closeOpening = useCallback((restoreList: boolean) => {
    const active = openingRef.current;
    if (!active) return;
    openingRef.current = null;
    delete active.slot.dataset.componentEntryPreviewActive;
    setOpening(null);
    if (restoreList) {
      restoreCollectionScroll(active.scrollY);
      active.link.focus({ preventScroll: true });
    }
  }, []);

  const beginReturn = useCallback((pose?: ReturnPose) => {
    const visit = previous.current, slot = main.current;
    if (!visit || !slot || !backdrop.current || !floating.current || pending.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    const quick = visit.origin === collectionHref;
    // The router may retain the outgoing page in a hidden activity tree.
    const article = [...slot.querySelectorAll<HTMLElement>("[data-component-entry-preview], [data-component-document]")].find(node => node.getBoundingClientRect().width > 0);
    const panel = article ? demoPanel(article) ?? article : null;
    const from = pose?.card ?? (panel ? box(panel) : visit.panel);
    const detailHeading = article?.querySelector<HTMLElement>("h1");
    const fromTitle = pose?.title ?? (detailHeading ? titleState(detailHeading) : visit.detailTitle);
    if (!from || !fromTitle || from.y + from.height <= 0 || from.y >= window.innerHeight) return false;
    if (article && !pose) {
      freezeArticle(article, backdrop.current);
      const frozenTitle = backdrop.current.querySelector<HTMLElement>("h1");
      if (frozenTitle) frozenTitle.style.visibility = "hidden";
      backdrop.current.style.display = "block";
    }
    const proxy = visit.template.cloneNode(true) as HTMLElement;
    const media = proxy.firstElementChild as HTMLElement;
    const caption = proxy.querySelector<HTMLElement>("[data-component-caption], a")!;
    const title = visit.titleTemplate.cloneNode(true) as HTMLElement;
    floating.current.append(proxy);
    floating.current.append(title);
    applyTitle(title, fromTitle);
    floating.current.style.display = "block";
    gsap.set(proxy, { x: from.x, y: from.y, width: from.width, height: from.height, borderRadius: pose?.cardRadius ?? 12, autoAlpha: 1 });
    const fromMedia = pose?.media ?? from;
    gsap.set(media, { x: fromMedia.x - from.x, y: fromMedia.y - from.y, width: fromMedia.width, height: fromMedia.height, borderRadius: pose?.mediaRadius ?? 12 });
    gsap.set(caption, { autoAlpha: 0 });
    gsap.set(title, { autoAlpha: 1 });
    pending.current = { direction: "return", href: collectionHref, componentHref: visit.href, scrollY: visit.scrollY, from, card: proxy, media, caption, title, fromTitle, quick };
    sourceMain.current = slot;
    slot.classList.add(styles.main);
    if (quick) {
      slot.dataset.componentEntryState = "returning";
    } else {
      slot.inert = true;
      slot.setAttribute("aria-busy", "true");
      slot.dataset.componentEntryState = "waiting";
    }
    timeout.current = setTimeout(() => finish(), 10000);
    return true;
  }, [finish]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target : null;
      const navigation = target?.closest<HTMLAnchorElement>("a[href]");
      const destination = navigation ? new URL(navigation.href) : null;
      const returningToCollection = destination?.origin === location.origin && destination.pathname === collectionHref;
      if (navigation?.target === "_blank" || navigation?.hasAttribute("download")) return;
      if (openingRef.current) {
        if (returningToCollection) {
          event.preventDefault();
          router.back();
        } else if (destination?.origin === location.origin && destination.pathname === openingRef.current.href) {
          event.preventDefault();
        }
        return;
      }
      if (returningToCollection && window.history.state?.[collectionHistoryKey] === pathname) {
        event.preventDefault();
        router.back();
        return;
      }
      if (pathname === previous.current?.href && returningToCollection) {
        restore.current = previous.current;
        if (beginReturn()) { event.preventDefault(); router.push(collectionHref); }
        return;
      }
      const quick = pathname === collectionHref;
      if ((!quick && (pathname !== "/" || reduced.matches)) || document.documentElement.dataset.themeTransition) return;
      const card = target?.closest<HTMLElement>("[data-component-card]");
      const link = card instanceof HTMLAnchorElement ? card : card?.querySelector<HTMLAnchorElement>("a[href]");
      const article = card?.closest<HTMLElement>("article, section");
      const media = card?.firstElementChild as HTMLElement | null;
      const heading = card?.querySelector<HTMLElement>("h2, h3");
      const sourceCaption = card?.hasAttribute("data-component-home-card") ? card.querySelector<HTMLElement>("[data-component-caption]") : link;
      const href = card?.dataset.componentCard;
      const slot = card?.closest<HTMLElement>("main");
      if (!card || !link || !article || !media || !heading || !sourceCaption || !slot || !href?.startsWith("/docs/")) return;
      if (link.target === "_blank" || link.hasAttribute("download")) return;
      event.preventDefault();
      if (quick && pending.current?.direction === "return") finish();
      if (pending.current || !backdrop.current || !floating.current) return;

      main.current = slot;
      const from = box(card), mediaBox = box(media), captionBox = box(sourceCaption);
      if (!quick || !reduced.matches) {
        freezeArticle(article, backdrop.current, href);
        backdrop.current.style.display = "block";
      }

      const proxy = snapshot(card);
      const proxyMedia = proxy.firstElementChild as HTMLElement;
      const caption = card.hasAttribute("data-component-home-card") ? proxy.querySelector<HTMLElement>("[data-component-caption]")! : proxy.querySelector<HTMLAnchorElement>("a")!;
      const proxyHeading = caption.querySelector<HTMLElement>("h2, h3")!;
      // A cloned carousel card is no longer hovered; preserve the actual overlay
      // until the shared transition begins instead of abruptly dropping it.
      if (card.hasAttribute("data-component-home-card")) {
        caption.style.opacity = getComputedStyle(sourceCaption).opacity;
        caption.style.transition = "none";
      }
      const title = document.createElement("span");
      title.className = styles.title;
      title.setAttribute("data-component-entry-title", "");
      gsap.set(proxyHeading, { autoAlpha: 0 });
      const css = getComputedStyle(card);
      Object.assign(proxy.style, { position: "absolute", left: "0", top: "0", margin: "0", padding: "0", display: "block", overflow: "hidden", backgroundColor: css.backgroundColor, borderColor: css.borderColor });
      Object.assign(proxyMedia.style, { position: "absolute", left: "0", top: "0", margin: "0" });
      if (!card.hasAttribute("data-component-home-card")) Object.assign(caption.style, { position: "absolute", left: (captionBox.x - from.x) + "px", top: (captionBox.y - from.y) + "px", width: captionBox.width + "px", margin: "0" });
      floating.current.append(proxy);
      floating.current.append(title);
      const fromTitle = titleState(heading);
      applyTitle(title, fromTitle);
      gsap.set(title, { autoAlpha: Number(getComputedStyle(sourceCaption).opacity) });
      floating.current.style.display = "block";
      gsap.set(proxy, { x: from.x, y: from.y, width: from.width, height: from.height });
      gsap.set(proxyMedia, { x: mediaBox.x - from.x, y: mediaBox.y - from.y, width: mediaBox.width, height: mediaBox.height });
      const entry: Entry = { direction: "enter", href, componentHref: href, scrollY: window.scrollY, from, card: proxy, media: proxyMedia, caption, title, fromTitle, quick };
      pending.current = entry;
      previous.current = { href, scrollY: entry.scrollY, origin: pathname, template: proxy.cloneNode(true) as HTMLElement, titleTemplate: title.cloneNode(true) as HTMLElement };
      sourceMain.current = slot;
      slot.classList.add(styles.main);
      if (quick) {
        const image = media.querySelector("img");
        const video = media.querySelector("video");
        const layout = card.dataset.componentDocLayout;
        const preview: Opening = {
          href, slot, link, scrollY: entry.scrollY,
          title: heading.textContent ?? "",
          description: sourceCaption.querySelector("p")?.textContent ?? "",
          poster: image?.currentSrc || image?.src || video?.poster || undefined,
          layout: layout ? JSON.parse(layout) as MotionDocLayout : undefined,
        };
        if (reduced.matches) finish();
        openingRef.current = preview;
        setOpening(preview);
        // Reserve a history entry before the request starts. Back can restore
        // the live collection even while Next is still fetching this route.
        window.history.pushState({ [previewHistoryKey]: href }, "");
        router.replace(href, { scroll: false });
        return;
      }
      slot.inert = true;
      slot.setAttribute("aria-busy", "true");
      slot.dataset.componentEntryState = "waiting";
      // A failed/interrupted navigation must never leave the collection hidden.
      timeout.current = setTimeout(() => finish(), 10000);
      router.push(href);
    };
    const blockScroll = (event: Event) => { if (pending.current && !pending.current.quick) event.preventDefault(); };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape" && openingRef.current) {
        event.preventDefault();
        router.back();
        return;
      }
      if (!pending.current || pending.current.quick) return;
      if (event.key === "Escape") finish();
      else if ((event.target === document.body || event.target === document.documentElement) && [" ", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(event.key)) event.preventDefault();
    };
    const stop = () => finish();
    const rememberPanel = () => {
      if (pathname !== previous.current?.href || pending.current) return;
      const article = main.current?.querySelector<HTMLElement>("[data-component-document]");
      if (article && previous.current) {
        previous.current.panel = box(demoPanel(article) ?? article);
        const heading = article.querySelector<HTMLElement>("h1");
        if (heading) previous.current.detailTitle = titleState(heading);
      }
    };
    const motionChange = () => { if (reduced.matches) finish(); };
    const theme = new MutationObserver(() => { if (document.documentElement.dataset.themeTransition) finish(); });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme-transition"] });
    document.addEventListener("click", click, true);
    document.addEventListener("keydown", key);
    window.addEventListener("wheel", blockScroll, { passive: false });
    window.addEventListener("touchmove", blockScroll, { passive: false });
    window.addEventListener("resize", stop);
    window.addEventListener("scroll", rememberPanel, { passive: true });
    reduced.addEventListener("change", motionChange);
    return () => {
      document.removeEventListener("click", click, true);
      document.removeEventListener("keydown", key);
      window.removeEventListener("wheel", blockScroll);
      window.removeEventListener("touchmove", blockScroll);
      window.removeEventListener("resize", stop);
      window.removeEventListener("scroll", rememberPanel);
      reduced.removeEventListener("change", motionChange);
      theme.disconnect();
    };
  }, [pathname, router, finish, beginReturn]);

  useEffect(() => {
    const pop = () => {
      const entry = pending.current;
      const backToCollection = window.location.pathname === collectionHref;
      const pose = backToCollection && entry?.quick && entry.direction === "enter" ? {
        card: box(entry.card),
        media: box(entry.media),
        title: titleState(entry.title),
        cardRadius: getComputedStyle(entry.card).borderRadius,
        mediaRadius: getComputedStyle(entry.media).borderRadius,
      } : undefined;
      const interrupted = Boolean(entry && !entry.quick);
      finish();
      const queued = window.history.state?.[previewHistoryKey];
      if (typeof queued === "string" && queued.startsWith("/docs/")) {
        closeOpening(false);
        router.replace(queued, { scroll: false });
        return;
      }
      if (backToCollection && previous.current) {
        restore.current = previous.current;
        if (!interrupted) beginReturn(pose);
        setReturnVisit(visit => visit + 1);
      }
      closeOpening(backToCollection);
    };
    // Next can commit its popstate update before later listeners are called.
    // Keep this subscription alive across pathname changes and request a fresh
    // restoration pass even when the collection has already committed.
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, [finish, beginReturn, closeOpening, router]);

  useEffect(() => {
    if (pathname !== collectionHref) return;
    const warmed = new Set<string>();
    let intentTimer: number | undefined;
    let mobileTimer: number | undefined;
    const warm = (card: Element | null) => {
      const href = card?.getAttribute("data-component-card");
      if (openingRef.current || warmed.size >= 2 || !href?.startsWith("/docs/") || warmed.has(href)) return;
      warmed.add(href);
      router.prefetch(href);
    };
    const intent = (event: PointerEvent | FocusEvent) => {
      const card = event.target instanceof Element ? event.target.closest("[data-component-card]") : null;
      if (!card || (event.relatedTarget instanceof Node && card.contains(event.relatedTarget))) return;
      window.clearTimeout(intentTimer);
      intentTimer = window.setTimeout(() => warm(card), 80);
    };
    const leave = (event: PointerEvent) => {
      const card = event.target instanceof Element ? event.target.closest("[data-component-card]") : null;
      if (card && !(event.relatedTarget instanceof Node && card.contains(event.relatedTarget))) window.clearTimeout(intentTimer);
    };
    if (window.matchMedia("(hover: hover)").matches) {
      document.addEventListener("pointerover", intent);
      document.addEventListener("pointerout", leave);
    } else {
      mobileTimer = window.setTimeout(() => {
        for (const card of document.querySelectorAll("[data-component-card]")) {
          const rect = card.getBoundingClientRect();
          if (rect.bottom > 0 && rect.top < window.innerHeight && card.querySelector("img")?.complete) warm(card);
        }
      }, 1200);
    }
    document.addEventListener("focusin", intent);
    return () => {
      document.removeEventListener("pointerover", intent);
      document.removeEventListener("pointerout", leave);
      document.removeEventListener("focusin", intent);
      window.clearTimeout(intentTimer);
      window.clearTimeout(mobileTimer);
    };
  }, [pathname, router]);

  useLayoutEffect(() => {
    const entry = pending.current;
    let frame = 0;
    let observer: MutationObserver | null = null;

    const play = (slot: HTMLElement, article: HTMLElement) => {
      if (!entry || pending.current !== entry || context.current) return;
      const returning = entry.direction === "return";
      const fastEnter = entry.quick && !returning;
      const duration = fastEnter ? .42 : .72;
      const titleArrival = duration - .1;
      slot.dataset.componentEntryState = returning ? "returning" : "entering";
      const targetCard = returning ? [...article.querySelectorAll<HTMLElement>("[data-component-card]")].find(node => node.dataset.componentCard === entry.componentHref) : null;
      if (returning && !targetCard) { finish(); return; }
      const panel = returning ? targetCard! : demoPanel(article);
      const to = box(panel ?? article);
      const toMedia = returning ? box(targetCard!.firstElementChild!) : to;
      const heading = returning ? targetCard!.querySelector<HTMLElement>("h2, h3") : article.querySelector<HTMLElement>("h1");
      if (!heading) { finish(); return; }
      const titleTarget = titleState(heading);
      if (returning) {
        const caption = targetCard!.querySelector("a")!;
        const position = box(caption);
        if (previous.current?.origin === "/") {
          entry.caption.remove();
          entry.caption = snapshot(caption);
          entry.card.append(entry.caption);
          const proxyHeading = entry.caption.querySelector<HTMLElement>("h2, h3");
          if (proxyHeading) gsap.set(proxyHeading, { autoAlpha: 0 });
          gsap.set(entry.caption, { autoAlpha: 0 });
        }
        Object.assign(entry.caption.style, { left: position.x - to.x + "px", top: position.y - to.y + "px", width: position.width + "px" });
        entry.caption.style.position = "absolute";
      }
      // Some canvas components use the document itself as their demo.
      if (!panel) to.height = Math.min(to.height, Math.max(1, window.innerHeight - to.y - 24));
      context.current = gsap.context(() => {
        const panelFade = returning && entry.quick ? "opacity" : "autoAlpha";
        if (panel) gsap.set(panel, { [panelFade]: 0 });
        const children = [...article.children];
        const description = returning ? null : children.find(node => node.tagName === "P");
        const tags = description?.nextElementSibling?.tagName === "DIV" ? description.nextElementSibling : null;
        const demo = returning ? null : panel?.closest("section");
        const demoTitle = demo?.querySelector("h2");
        const demoDescription = demo?.querySelector("p");
        const delayedText = [description, tags, demoTitle].filter((node): node is Element => Boolean(node));
        if (!returning) gsap.set([heading, ...delayedText, ...(demoDescription ? [demoDescription] : [])], { autoAlpha: 0 });
        // The title travels separately from the card so it can reach the actual
        // document heading without scaling or clipping the surrounding page.
        const timeline = gsap.timeline({ onComplete: () => finish(true) });
        if (returning) {
          if (backdrop.current?.firstElementChild) timeline.to(backdrop.current, { autoAlpha: 0, duration: .2, ease: "power2.out" }, 0);
        } else if (!entry.quick) {
          timeline.fromTo(slot, { autoAlpha: 0 }, { autoAlpha: 1, duration: .24, ease: "power2.out" }, .06)
            .to(backdrop.current, { autoAlpha: 0, duration: .24, ease: "power2.out" }, .06);
        } else if (backdrop.current?.firstElementChild) {
          timeline.fromTo(slot, { opacity: 0 }, { opacity: 1, duration: .2, ease: "power2.out" }, .04)
            .to(backdrop.current, { autoAlpha: 0, duration: .2, ease: "power2.out" }, .04);
        }
        timeline.to(entry.card, { x: to.x, y: to.y, width: to.width, height: to.height, borderRadius: returning ? 16 : 12, duration, ease: "power3.inOut" }, 0)
          .to(entry.media, { x: toMedia.x - to.x, y: toMedia.y - to.y, width: toMedia.width, height: toMedia.height, borderRadius: returning ? 8 : 12, duration, ease: "power3.inOut" }, 0)
          .to(entry.caption, { y: 0, autoAlpha: returning ? 1 : 0, duration: .14, ease: "power2.out" }, returning ? .58 : 0)
          .to(entry.title, { autoAlpha: 1, duration: .1 }, 0)
          .to(entry.title, { autoAlpha: 0, duration: .1 }, titleArrival)
          .to(entry.card, { autoAlpha: 0, duration: .08 }, duration - .08);
        tweenTitleLayout(timeline, entry.title, entry.fromTitle, titleTarget, titleArrival);
        if (!returning) {
          timeline.to(heading, { autoAlpha: 1, duration: .1 }, titleArrival)
            .to(delayedText, { autoAlpha: 1, duration: .18, ease: "sine.out" }, duration);
          if (demoDescription) timeline.to(demoDescription, { autoAlpha: 1, duration: .18, ease: "sine.out" }, duration);
        }
        if (panel) {
          // Once the two cards overlap, reveal the destination beneath the proxy.
          if (returning) timeline.set(panel, { [panelFade]: 1 }, duration - .08);
          else timeline.to(panel, { [panelFade]: 1, duration: .08 }, duration - .08);
        }
      }, slot);
    };

    const prepare = () => {
      const currentOpening = openingRef.current;
      if (opening && currentOpening === opening) {
        const { slot } = currentOpening;
        const article = slot.querySelector<HTMLElement>("[data-component-entry-preview]");
        if (!article) return false;
        if (!slot.dataset.componentEntryPreviewActive) {
          slot.dataset.componentEntryPreviewActive = "true";
          restoreCollectionScroll(0);
          article.querySelector("a")?.focus({ preventScroll: true });
        }
        if (entry?.direction === "enter" && !context.current) {
          frame = requestAnimationFrame(() => play(slot, article));
        }
        return true;
      }
      if (entry && pathname !== entry.href) {
        // popstate can request the reverse before Next commits the collection.
        if (entry.direction === "return" && pathname === entry.componentHref) return true;
        finish(); return true;
      }
      const selector = pathname === "/components" ? "#components-title" : pathname.startsWith("/docs/") ? "[data-component-document]" : pathname === "/" ? "#gallery-heading" : "main";
      const marker = [...document.querySelectorAll<HTMLElement>(selector)].find(node => {
        const candidate = node.closest<HTMLElement>("main");
        return candidate && node.getBoundingClientRect().width > 0 && (getComputedStyle(candidate).visibility !== "hidden" || (candidate === sourceMain.current && entry?.href === pathname));
      });
      const slot = marker?.closest<HTMLElement>("main");
      if (!slot) return false;
      main.current = slot;
      slot.classList.add(styles.main);
      slot.querySelectorAll("[data-component-entry-page]").forEach(node => {
        if (node.getAttribute("data-component-entry-page") !== pathname) node.removeAttribute("data-component-entry-page");
      });
      if (pathname === "/components" && restore.current && entry?.direction !== "return") {
        const saved = restore.current;
        const link = [...slot.querySelectorAll<HTMLElement>("[data-component-card]")].find(node => node.dataset.componentCard === saved.href)?.querySelector("a");
        if (!link) return false;
        if (window.location.pathname === collectionHref) {
          restore.current = null;
          marker?.closest(".page-enter")?.setAttribute("data-component-entry-page", collectionHref);
          if (saved.origin === "/") link.scrollIntoView({ block: "center", behavior: "instant" });
          else restoreCollectionScroll(saved.scrollY);
          link.focus({ preventScroll: true });
        }
        return true;
      }
      if (!entry) return true;
      const returning = entry.direction === "return";
      const article = returning ? slot.querySelector("[data-component-card]")?.closest<HTMLElement>("article") : slot.querySelector<HTMLElement>("[data-component-document]");
      if (!article) return false;
      if (!entry.quick) {
        slot.inert = true;
        slot.setAttribute("aria-busy", "true");
        slot.dataset.componentEntryState = "waiting";
      }
      if (returning && previous.current?.origin === "/") {
        const target = [...article.querySelectorAll<HTMLElement>("[data-component-card]")].find(node => node.dataset.componentCard === entry.componentHref);
        target?.scrollIntoView({ block: "center", behavior: "instant" });
      } else if (entry.quick) restoreCollectionScroll(returning ? entry.scrollY : 0);
      else window.scrollTo(0, returning ? entry.scrollY : 0);
      if (returning && entry.quick) {
        const card = [...article.querySelectorAll<HTMLElement>("[data-component-card]")].find(node => node.dataset.componentCard === entry.componentHref);
        card?.querySelector("a")?.focus({ preventScroll: true });
      }
      slot.querySelectorAll<HTMLElement>(".page-enter").forEach(node => node.setAttribute("data-component-entry-page", ""));
      if (returning) {
        // The collection layout is ready now. Hide the landing card before
        // its first paint while the floating copy is still above it.
        play(slot, article);
        return true;
      }
      // Let the existing responsive demo's ResizeObserver settle before measuring.
      frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => play(slot, article)); });
      return true;
    };
    observer = new MutationObserver(() => { if (prepare()) observer?.disconnect(); });
    if (!prepare()) observer.observe(document.body, { childList: true, subtree: true });
    return () => { observer?.disconnect(); cancelAnimationFrame(frame); };
  }, [pathname, opening, returnVisit, finish]);

  useLayoutEffect(() => {
    if (!opening) return;
    const { slot, href } = opening;
    const handoff = () => {
      if (openingRef.current !== opening) return;
      if (location.pathname !== collectionHref && location.pathname !== href) {
        finish();
        closeOpening(false);
        return;
      }
      if (location.pathname !== href || pending.current?.direction === "enter") return;
      const detail = activeDetail(slot, href);
      if (!detail) return;
      const preview = slot.querySelector<HTMLElement>("[data-component-entry-preview]");
      const moveFocus = preview?.contains(document.activeElement);
      const previewPanel = preview && demoPanel(preview);
      const panel = demoPanel(detail);
      const before = previewPanel && box(previewPanel);
      detail.closest(".page-enter")?.setAttribute("data-component-entry-page", href);
      window.history.replaceState({
        ...window.history.state,
        [previewHistoryKey]: null,
        [collectionHistoryKey]: href,
      }, "");
      closeOpening(false);
      // Native demos have their own layout. Carry any remaining difference
      // from the visible poster into the real panel without a cut.
      if (!opening.layout && before?.width && before.height && panel && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const after = box(panel);
        if (after.width && after.height) {
          gsap.fromTo(panel, {
            x: before.x - after.x, y: before.y - after.y,
            scaleX: before.width / after.width, scaleY: before.height / after.height,
            transformOrigin: "top left",
          }, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: .22, ease: "power2.out", clearProps: "transform,transformOrigin" });
        }
      }
      const heading = detail.querySelector("h1");
      if (previous.current?.href === href) {
        previous.current.panel = box(demoPanel(detail) ?? detail);
        if (heading) previous.current.detailTitle = titleState(heading);
      }
      if (heading && moveFocus) {
        heading.tabIndex = -1;
        heading.setAttribute("data-component-entry-focus", "");
        heading.focus({ preventScroll: true });
      }
    };
    const observer = new MutationObserver(handoff);
    observer.observe(slot, {
      childList: true, subtree: true, attributes: true,
      attributeFilter: ["style", "hidden", "data-component-entry-state"],
    });
    const frame = requestAnimationFrame(handoff);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [opening, pathname, finish, closeOpening]);

  useLayoutEffect(() => () => finish(), [finish]);

  return <>
    {children}
    {opening && createPortal(<ComponentEntryPreview opening={opening} retry={() => router.replace(opening.href, { scroll: false })} />, opening.slot)}
    <div ref={backdrop} className={styles.backdrop} aria-hidden="true" inert data-component-entry-backdrop />
    <div ref={floating} className={styles.floating} aria-hidden="true" inert data-component-entry-floating />
  </>;
}
