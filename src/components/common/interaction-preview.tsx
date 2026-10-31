"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { interactionPreviewDocument } from "./interaction-preview-player";
import { optimizedImage } from "@/lib/optimized-image";
import { sendMotionRenderSize } from "@/lib/motion-render-size";
import { SiteNativePreview, hasSiteNativePreview, type SitePreviewSlug } from "./site-native-preview";

const ShareInvite = dynamic(() => import("@/lib/ShareInvite/ShareInvite").then(module => module.ShareInvite), { ssr: false });
const OtpVerification = dynamic(() => import("@/lib/OtpVerification/OtpVerification").then(module => module.OtpVerification), { ssr: false });
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeMotion(callback: () => void) {
  const query = window.matchMedia(MOTION_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const readMotion = () => window.matchMedia(MOTION_QUERY).matches;
const serverMotion = () => true;

// Share one request per preview file. A card that loses hover before the file
// arrives simply ignores the result instead of aborting, so the next hover (or
// another card with the same source) reuses it without a second download.
const previewSources = new Map<string, Promise<string>>();
const MAX_PREVIEW_SOURCES = 4;
function loadPreviewSource(source: string) {
  let request = previewSources.get(source);
  if (!request) {
    request = fetch(source).then(response => {
      if (!response.ok) throw new Error("Preview unavailable");
      return response.text();
    });
    request.catch(() => { if (previewSources.get(source) === request) previewSources.delete(source); });
  }
  previewSources.delete(source);
  previewSources.set(source, request);
  while (previewSources.size > MAX_PREVIEW_SOURCES) previewSources.delete(previewSources.keys().next().value!);
  return request;
}

function NativePreview({ slug, onReady }: { slug: string; onReady: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const check = () => {
      if (!element.querySelector(".leibox-otp, .leibox-share")) return;
      observer.disconnect(); onReady();
    };
    const observer = new MutationObserver(check);
    observer.observe(element, { childList: true, subtree: true });
    check();
    return () => observer.disconnect();
  }, [onReady]);
  useEffect(() => {
    if (slug !== "share-invite") return;
    const toggle = () => root.current?.querySelector<HTMLButtonElement>(".share-morph")?.click();
    const first = window.setTimeout(toggle, 1000);
    const loop = window.setInterval(toggle, 2400);
    return () => { window.clearTimeout(first); window.clearInterval(loop); };
  }, [slug]);
  return (
    <div ref={root} inert className="grid size-full place-items-center [&_.leibox-otp]:w-full [&_.leibox-otp]:bg-transparent! [&_.leibox-share]:w-full [&_.leibox-share]:bg-transparent!">
      {slug === "otp-verification"
        ? <OtpVerification key={version} autoPlay onReplayComplete={() => setVersion(current => current + 1)} />
        : <ShareInvite />}
    </div>
  );
}

function PreviewScene({ slug, native, siteSlug, html, width, height, scale }: {
  slug: string; native: boolean; siteSlug?: SitePreviewSlug; html: string; width: number; height: number; scale: number;
}) {
  const [painted, setPainted] = useState(false);
  const iframe = useRef<HTMLIFrameElement>(null);
  const waitsForDraw = slug === "gradient-ring-cards" || slug === "folded-emoji-scroll" || slug === "collection-layout-morph" || slug === "brand-poster-cards" || slug === "dot-matrix-trio" || slug === "inline-text-morph" || slug === "selection-flower" || slug === "notes-text-color" || slug === "galaxy-effort-slider" || slug === "glass-folder" || slug === "cosmic-panels" || slug === "sailing-toc" || slug === "crumpled-paper" || slug === "glass-tab-menu" || slug === "hammerhead-chart" || slug === "blue-fluted-glass" || slug === "staggered-radial-menu" || slug === "soft-action-wheel" || slug === "bounding-box-resize";
  const frames = useRef<number[]>([]);
  const reveal = useCallback(() => {
    frames.current.forEach(cancelAnimationFrame);
    // Loading the document or mounting the component happens before its pixels
    // reach the screen. Keep the poster underneath until two paint frames pass.
    frames.current = [requestAnimationFrame(() => {
      frames.current.push(requestAnimationFrame(() => setPainted(true)));
    })];
  }, []);
  useEffect(() => () => frames.current.forEach(cancelAnimationFrame), []);
  useEffect(() => sendMotionRenderSize(iframe.current, slug), [scale, width, height, slug]);
  useEffect(() => {
    if (!waitsForDraw) return;
    const receive = (event: MessageEvent) => {
      if (event.source === iframe.current?.contentWindow && event.data?.type === "leibox-preview-ready" && event.data?.slug === slug) reveal();
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [waitsForDraw, slug, reveal]);
  return (
    <div data-scene-ready={painted} className="absolute top-1/2 left-1/2 bg-[#f4f4f4] transition-opacity duration-150" style={{ width, height, opacity: painted ? 1 : 0, transform: `translate(-50%, -50%) scale(${scale})`, transformOrigin: "center" }}>
      {siteSlug ? <SiteNativePreview slug={siteSlug} height={height} onReady={reveal} /> : native ? <NativePreview slug={slug} onReady={reveal} /> : (
        <iframe ref={iframe} srcDoc={html} title={`${slug} animated preview`} sandbox="allow-scripts" tabIndex={-1} width={width} height={height} onLoad={() => { sendMotionRenderSize(iframe.current, slug); if (!waitsForDraw) reveal(); }} className="block border-0" />
      )}
    </div>
  );
}

/** Only the hovered/focused card mounts a live scene; idle cards cost one image. */
export function InteractionPreview({ slug, poster, source, width, height, active: controlledActive, preferNative = false }: {
  slug: string; poster: string; source?: string; width?: number; height?: number; active?: boolean; preferNative?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const reduceMotion = useSyncExternalStore(subscribeMotion, readMotion, serverMotion);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [engaged, setEngaged] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [html, setHtml] = useState("");
  const native = slug === "share-invite" || slug === "otp-verification";
  const siteSlug = preferNative && hasSiteNativePreview(slug) ? slug : undefined;
  const active = (controlledActive ?? engaged) && visible && pageVisible && !reduceMotion;
  const ready = active && (native || siteSlug !== undefined || Boolean(html));
  const contentWidth = width ?? (slug === "share-invite" ? 380 : 500);
  const contentHeight = height ?? (slug === "share-invite" ? 500 : 510);
  const scale = Math.min(size.width / contentWidth, size.height / contentHeight);
  // Extend the scene itself to the card edges instead of letterboxing a fixed viewport.
  const sceneWidth = scale > 0 ? size.width / scale : contentWidth;
  const sceneHeight = scale > 0 ? size.height / scale : contentHeight;
  const document = useMemo(() => active && html ? interactionPreviewDocument(html, slug) : "", [active, html, slug]);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const card = element.closest<HTMLElement>("[data-preview-card]") ?? element;
    let hovered = false, focused = false;
    let hoverTimer: number | undefined;
    const update = () => setEngaged(hovered || focused);
    const enter = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      window.clearTimeout(hoverTimer);
      hoverTimer = window.setTimeout(() => { hovered = true; update(); }, 120);
    };
    const leave = () => { window.clearTimeout(hoverTimer); hovered = false; update(); };
    const focus = () => { focused = true; update(); };
    const blur = (event: FocusEvent) => {
      if (!card.contains(event.relatedTarget as Node | null)) { focused = false; update(); }
    };
    const intersection = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .05 });
    const resize = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    const visibility = () => setPageVisible(!window.document.hidden);
    intersection.observe(element); resize.observe(element); visibility();
    window.document.addEventListener("visibilitychange", visibility);
    card.addEventListener("pointerenter", enter);
    card.addEventListener("pointerleave", leave);
    card.addEventListener("focusin", focus);
    card.addEventListener("focusout", blur);
    return () => {
      window.clearTimeout(hoverTimer);
      intersection.disconnect(); resize.disconnect();
      window.document.removeEventListener("visibilitychange", visibility);
      card.removeEventListener("pointerenter", enter);
      card.removeEventListener("pointerleave", leave);
      card.removeEventListener("focusin", focus);
      card.removeEventListener("focusout", blur);
    };
  }, []);

  useEffect(() => {
    if (!active || !native) return;
    if (slug === "otp-verification") void import("@/lib/OtpVerification/OtpVerification");
    else void import("@/lib/ShareInvite/ShareInvite");
  }, [active, native, slug]);

  useEffect(() => {
    if (!active || !source || siteSlug) return;
    let current = true;
    loadPreviewSource(source).then(
      text => { if (current) setHtml(text); },
      () => { /* Retain the poster if the source cannot be loaded. */ },
    );
    return () => { current = false; setHtml(""); };
  }, [active, source, siteSlug]);

  return (
    <div ref={root} aria-hidden="true" data-motion-preview={slug} data-preview-state={ready ? "playing" : "poster"} className="pointer-events-none relative size-full overflow-hidden bg-[#f4f4f4]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img {...optimizedImage(poster)} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
      {ready && size.width > 0 && (
        <PreviewScene slug={slug} native={native} siteSlug={siteSlug} html={document} width={sceneWidth} height={sceneHeight} scale={scale} />
      )}
    </div>
  );
}
