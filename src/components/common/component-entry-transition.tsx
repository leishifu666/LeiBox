"use client";

import { gsap } from "gsap";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { captureTitleLayout, mountTitleLayout, tweenTitleLayout, type TitleLayout } from "@/lib/component-title-motion";

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
};
type Visit = { href: string; scrollY: number; origin: string; template: HTMLElement; titleTemplate: HTMLElement; panel?: Box; detailTitle?: TitleState };

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
  const copy = source.cloneNode(true) as HTMLElement;
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
    if (!target || !image.currentSrc) return;
    target.removeAttribute("srcset");
    target.removeAttribute("sizes");
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
  const [returnVisit, setReturnVisit] = useState(0);
  const context = useRef<gsap.Context | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = useCallback((focus = false) => {
    const completed = pending.current;
    if (completed?.direction === "enter" && previous.current) {
      const article = main.current?.querySelector<HTMLElement>("[data-component-document]");
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
        const title = main.current.querySelector("h1");
        if (title) {
          title.tabIndex = -1;
          title.setAttribute("data-component-entry-focus", "");
          title.focus({ preventScroll: true });
        }
      }
    }
  }, []);

  const beginReturn = useCallback(() => {
    const visit = previous.current, slot = main.current;
    if (!visit || !slot || !backdrop.current || !floating.current || pending.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    // The router may retain the outgoing page in a hidden activity tree.
    const article = [...slot.querySelectorAll<HTMLElement>("[data-component-document]")].find(node => node.getBoundingClientRect().width > 0);
    const panel = article ? demoPanel(article) ?? article : null;
    const from = panel ? box(panel) : visit.panel;
    const detailHeading = article?.querySelector<HTMLElement>("h1");
    const fromTitle = detailHeading ? titleState(detailHeading) : visit.detailTitle;
    if (!from || !fromTitle || from.y + from.height <= 0 || from.y >= window.innerHeight) return false;
    if (article) {
      freezeArticle(article, backdrop.current);
      const frozenTitle = backdrop.current.querySelector<HTMLElement>("h1");
      if (frozenTitle) frozenTitle.style.visibility = "hidden";
    }
    backdrop.current.style.display = "block";
    const proxy = visit.template.cloneNode(true) as HTMLElement;
    const media = proxy.firstElementChild as HTMLElement;
    const caption = proxy.querySelector<HTMLElement>("[data-component-caption], a")!;
    const title = visit.titleTemplate.cloneNode(true) as HTMLElement;
    floating.current.append(proxy);
    floating.current.append(title);
    applyTitle(title, fromTitle);
    floating.current.style.display = "block";
    gsap.set(proxy, { x: from.x, y: from.y, width: from.width, height: from.height, borderRadius: 12, autoAlpha: 1 });
    gsap.set(media, { x: 0, y: 0, width: from.width, height: from.height, borderRadius: 12 });
    gsap.set(caption, { autoAlpha: 0 });
    gsap.set(title, { autoAlpha: 1 });
    pending.current = { direction: "return", href: "/components", componentHref: visit.href, scrollY: visit.scrollY, from, card: proxy, media, caption, title, fromTitle };
    sourceMain.current = slot;
    slot.classList.add(styles.main);
    slot.inert = true;
    slot.setAttribute("aria-busy", "true");
    slot.dataset.componentEntryState = "waiting";
    timeout.current = setTimeout(() => finish(), 10000);
    return true;
  }, [finish]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target : null;
      const navigation = target?.closest<HTMLAnchorElement>("a[href]");
      if (pathname === previous.current?.href && navigation && new URL(navigation.href).pathname === "/components") {
        restore.current = previous.current;
        if (beginReturn()) { event.preventDefault(); router.push("/components"); }
        return;
      }
      if ((pathname !== "/components" && pathname !== "/") || reduced.matches || document.documentElement.dataset.themeTransition) return;
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
      if (pending.current || !backdrop.current || !floating.current) return;

      main.current = slot;
      const from = box(card), mediaBox = box(media), captionBox = box(sourceCaption);
      freezeArticle(article, backdrop.current, href);
      backdrop.current.style.display = "block";

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
      const entry: Entry = { direction: "enter", href, componentHref: href, scrollY: window.scrollY, from, card: proxy, media: proxyMedia, caption, title, fromTitle };
      pending.current = entry;
      previous.current = { href, scrollY: entry.scrollY, origin: pathname, template: proxy.cloneNode(true) as HTMLElement, titleTemplate: title.cloneNode(true) as HTMLElement };
      sourceMain.current = slot;
      slot.classList.add(styles.main);
      slot.inert = true;
      slot.setAttribute("aria-busy", "true");
      slot.dataset.componentEntryState = "waiting";
      // A failed/interrupted navigation must never leave the collection hidden.
      timeout.current = setTimeout(() => finish(), 10000);
      router.push(href);
    };
    const blockScroll = (event: Event) => { if (pending.current) event.preventDefault(); };
    const key = (event: KeyboardEvent) => {
      if (!pending.current) return;
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
      const interrupted = Boolean(pending.current);
      finish();
      if (window.location.pathname === "/components" && previous.current) {
        restore.current = previous.current;
        if (!interrupted) beginReturn();
        setReturnVisit(visit => visit + 1);
      }
    };
    // Next can commit its popstate update before later listeners are called.
    // Keep this subscription alive across pathname changes and request a fresh
    // restoration pass even when the collection has already committed.
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, [finish, beginReturn]);

  useLayoutEffect(() => {
    const entry = pending.current;
    let frame = 0;
    let observer: MutationObserver | null = null;

    const play = (slot: HTMLElement, article: HTMLElement) => {
      if (pending.current !== entry) return;
      if (!entry) return;
      const returning = entry.direction === "return";
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
        if (panel) gsap.set(panel, { autoAlpha: 0 });
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
        const timeline = gsap.timeline({ onComplete: () => finish(true) })
          .fromTo(slot, { autoAlpha: 0 }, { autoAlpha: 1, duration: .24, ease: "power2.out" }, .06)
          .to(backdrop.current, { autoAlpha: 0, duration: .24, ease: "power2.out" }, .06)
          .to(entry.card, { x: to.x, y: to.y, width: to.width, height: to.height, borderRadius: returning ? 16 : 12, duration: .72, ease: "power3.inOut" }, 0)
          .to(entry.media, { x: toMedia.x - to.x, y: toMedia.y - to.y, width: toMedia.width, height: toMedia.height, borderRadius: returning ? 8 : 12, duration: .72, ease: "power3.inOut" }, 0)
          .to(entry.caption, { y: 0, autoAlpha: returning ? 1 : 0, duration: .14, ease: "power2.out" }, returning ? .58 : 0)
          .to(entry.title, { autoAlpha: 1, duration: .1 }, 0)
          .to(entry.title, { autoAlpha: 0, duration: .1 }, .62)
          .to(entry.card, { autoAlpha: 0, duration: .08 }, .64);
        tweenTitleLayout(timeline, entry.title, entry.fromTitle, titleTarget);
        if (!returning) {
          timeline.to(heading, { autoAlpha: 1, duration: .1 }, .62)
            .to(delayedText, { autoAlpha: 1, duration: .18, ease: "sine.out" }, .72);
          if (demoDescription) timeline.to(demoDescription, { autoAlpha: 1, duration: .18, ease: "sine.out" }, .72);
        }
        if (panel) timeline.to(panel, { autoAlpha: 1, duration: .08 }, .64);
      }, slot);
    };

    const prepare = () => {
      if (entry && pathname !== entry.href) {
        // popstate can request the reverse before Next commits the collection.
        if (entry.direction === "return" && pathname === entry.componentHref) return true;
        finish(); return true;
      }
      const selector = pathname === "/components" ? "#components-title" : pathname.startsWith("/docs/") ? "[data-component-document]" : pathname === "/" ? "#gallery-heading" : "main";
      const marker = [...document.querySelectorAll<HTMLElement>(selector)].find(node => {
        const candidate = node.closest<HTMLElement>("main");
        return candidate && candidate.getBoundingClientRect().width > 0 && (getComputedStyle(candidate).visibility !== "hidden" || (candidate === sourceMain.current && entry?.href === pathname));
      });
      const slot = marker?.closest<HTMLElement>("main");
      if (!slot) return false;
      main.current = slot;
      slot.classList.add(styles.main);
      slot.querySelectorAll("[data-component-entry-page]").forEach(node => node.removeAttribute("data-component-entry-page"));
      if (pathname === "/components" && restore.current && entry?.direction !== "return") {
        const saved = restore.current;
        const link = [...slot.querySelectorAll<HTMLElement>("[data-component-card]")].find(node => node.dataset.componentCard === saved.href)?.querySelector("a");
        if (!link) return false;
        frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => {
          if (window.location.pathname !== "/components") return;
          restore.current = null;
          if (saved.origin === "/") link.scrollIntoView({ block: "center", behavior: "instant" });
          else window.scrollTo(0, saved.scrollY);
          link.focus({ preventScroll: true });
        }); });
        return true;
      }
      if (!entry) return true;
      const returning = entry.direction === "return";
      const article = returning ? slot.querySelector("[data-component-card]")?.closest<HTMLElement>("article") : slot.querySelector<HTMLElement>("[data-component-document]");
      if (!article) return false;
      slot.inert = true;
      slot.setAttribute("aria-busy", "true");
      slot.dataset.componentEntryState = "waiting";
      if (returning && previous.current?.origin === "/") {
        const target = [...article.querySelectorAll<HTMLElement>("[data-component-card]")].find(node => node.dataset.componentCard === entry.componentHref);
        target?.scrollIntoView({ block: "center", behavior: "instant" });
      } else window.scrollTo(0, returning ? entry.scrollY : 0);
      slot.querySelectorAll<HTMLElement>(".page-enter").forEach(node => node.setAttribute("data-component-entry-page", ""));
      // Let the existing responsive demo's ResizeObserver settle before measuring.
      frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => play(slot, article)); });
      return true;
    };
    observer = new MutationObserver(() => { if (prepare()) observer?.disconnect(); });
    if (!prepare()) observer.observe(document.body, { childList: true, subtree: true });
    return () => { observer?.disconnect(); cancelAnimationFrame(frame); };
  }, [pathname, returnVisit, finish]);

  useLayoutEffect(() => () => finish(), [finish]);

  return <>
    {children}
    <div ref={backdrop} className={styles.backdrop} aria-hidden="true" inert data-component-entry-backdrop />
    <div ref={floating} className={styles.floating} aria-hidden="true" inert data-component-entry-floating />
  </>;
}
