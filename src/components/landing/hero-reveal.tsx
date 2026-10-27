"use client";

import { lazy, Suspense, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { optimizedImage, heroVideo } from "@/lib/optimized-image";

const Native = lazy(() => import("./hero-reveal-native").then(module => ({ default: module.HeroRevealNative })));
const emptySubscribe = () => () => {};
let nativeSupport: boolean | undefined;
function supportsNative() {
  if (nativeSupport !== undefined) return nativeSupport;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  nativeSupport = Boolean(context && typeof (context as CanvasRenderingContext2D & { drawElementImage?: unknown }).drawElementImage === "function" && typeof (canvas as HTMLCanvasElement & { requestPaint?: unknown }).requestPaint === "function");
  return nativeSupport;
}
type Connection = EventTarget & { saveData?: boolean; effectiveType?: string };
function connection() { return (navigator as Navigator & { connection?: Connection }).connection; }
function limited() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches || Boolean(connection()?.saveData) || /(^|-)2g$/.test(connection()?.effectiveType ?? "");
}
function subscribe(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  const net = connection();
  query.addEventListener("change", callback); net?.addEventListener("change", callback);
  return () => { query.removeEventListener("change", callback); net?.removeEventListener("change", callback); };
}

export function HeroReveal({ backgroundUrl, children }: { backgroundUrl: string; children: ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const native = useSyncExternalStore(emptySubscribe, supportsNative, () => false);
  const constrained = useSyncExternalStore(subscribe, limited, () => true);
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    const observer = new IntersectionObserver(entries => setNear(entries.some(entry => entry.isIntersecting)));
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const update = () => {
      if (!near || native || constrained || document.hidden) { element.pause(); return; }
      if (!element.getAttribute("src")) element.src = window.matchMedia("(max-width: 640px)").matches ? heroVideo.mobile : heroVideo.desktop;
      void element.play().catch(() => {});
    };
    const timer = window.setTimeout(update, 500);
    document.addEventListener("visibilitychange", update);
    return () => { window.clearTimeout(timer); document.removeEventListener("visibilitychange", update); element.pause(); };
  }, [near, native, constrained]);
  const fallback = <>
    <video ref={video} poster={optimizedImage(backgroundUrl).src} muted loop playsInline preload="none" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
    {children}
  </>;
  return <div ref={host} className="absolute inset-0">
    {native && !constrained && near ? <Suspense fallback={fallback}>
      <Native background={
        // eslint-disable-next-line @next/next/no-img-element
        <img {...optimizedImage(backgroundUrl, "(min-width: 1152px) 1088px, 100vw")} alt="" crossOrigin="anonymous" className="absolute inset-0 h-full w-full object-cover" />
      }>{children}</Native>
    </Suspense> : fallback}
  </div>;
}
