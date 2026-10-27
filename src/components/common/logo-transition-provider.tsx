"use client";

import { gsap } from "gsap";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";

import styles from "./logo-transition-provider.module.css";

type LogoRect = { left: number; top: number; width: number; height: number };
type Snapshot = { rect: LogoRect; pathname: string; filter: string };
type LogoTransitionContextValue = { register: (image: HTMLImageElement, pathname: string) => () => void };

export const LogoTransitionContext = createContext<LogoTransitionContextValue | null>(null);

function visibleRect(image: HTMLImageElement): LogoRect | null {
  const rect = image.getBoundingClientRect();
  if (!rect.width || !rect.height || rect.bottom <= 0 || rect.top >= window.innerHeight ||
      rect.right <= 0 || rect.left >= window.innerWidth || image.parentElement?.closest('[inert], [aria-hidden="true"]')) return null;
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
}

function placeOverlay(image: HTMLImageElement, snapshot: Snapshot) {
  image.style.filter = snapshot.filter;
  gsap.set(image, {
    x: snapshot.rect.left, y: snapshot.rect.top,
    width: snapshot.rect.width, height: snapshot.rect.height,
    scaleX: 1, scaleY: 1, autoRound: false, display: "block", visibility: "visible",
  });
}

/** One persistent carrier for navigation Logos, outside moving page/header parents. */
export function LogoTransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const overlay = useRef<HTMLImageElement>(null);
  const pending = useRef<Snapshot | null>(null);
  const target = useRef<HTMLImageElement | null>(null);
  const destinationPath = useRef<string | null>(null);
  const tween = useRef<gsap.core.Tween | null>(null);
  const alive = useRef(true);

  const finish = useCallback(() => {
    tween.current?.kill();
    tween.current = null;
    target.current?.removeAttribute("data-logo-transition-hidden");
    target.current?.classList.remove(styles.hiddenTarget);
    target.current = null;
    destinationPath.current = null;
    if (overlay.current) {
      overlay.current.style.display = "none";
      overlay.current.dataset.logoMotion = "idle";
    }
  }, []);

  const register = useCallback((image: HTMLImageElement, path: string) => {
    const to = visibleRect(image);
    const carrier = overlay.current;
    // Hidden desktop/mobile alternatives must not consume the previous position.
    if (target.current === image && tween.current && destinationPath.current === path) {
      // React can replay a newly mounted layout's effects without removing its DOM.
      pending.current = null;
    } else if (alive.current && to && carrier) {
      const from = pending.current;
      pending.current = null;
      finish();
      const changed = from && [
        to.left - from.rect.left, to.top - from.rect.top,
        to.width - from.rect.width, to.height - from.rect.height,
      ].some((difference) => Math.abs(difference) > .5);
      if (from && from.pathname !== path && changed && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        placeOverlay(carrier, from);
        image.setAttribute("data-logo-transition-hidden", "true");
        image.classList.add(styles.hiddenTarget);
        target.current = image;
        destinationPath.current = path;
        carrier.dataset.logoMotion = "moving";
        tween.current = gsap.to(carrier, {
          x: to.left, y: to.top,
          scaleX: to.width / from.rect.width, scaleY: to.height / from.rect.height,
          duration: .5, ease: "power3.out", onComplete: finish,
        });
      }
    }

    return () => {
      if (!alive.current || !overlay.current) return;
      // Mid-flight navigation continues from the painted carrier, not the hidden target.
      const source = target.current === image ? overlay.current : image;
      const rect = visibleRect(source);
      if (!rect) return;
      const snapshot = { rect, pathname: path, filter: getComputedStyle(source).filter };
      pending.current = snapshot;
      // Keep a running carrier alive until the next registration distinguishes a
      // real route change from Strict Mode replay of this same target.
      if (target.current === image && tween.current) return;
      tween.current?.kill();
      tween.current = null;
      target.current?.removeAttribute("data-logo-transition-hidden");
      target.current?.classList.remove(styles.hiddenTarget);
      target.current = null;
      placeOverlay(overlay.current, snapshot);
      overlay.current.dataset.logoMotion = "waiting";
    };
  }, [finish]);

  useLayoutEffect(() => {
    // Routes without a navigation Logo should not retain the outgoing carrier.
    const frame = requestAnimationFrame(() => {
      if (pending.current && pending.current.pathname !== pathname) {
        pending.current = null;
        finish();
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, finish]);

  useLayoutEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      pending.current = null;
      finish();
    };
  }, [finish]);

  useEffect(() => {
    const stop = () => { pending.current = null; finish(); };
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => { if (media.matches) stop(); };
    const onVisibilityChange = () => { if (document.hidden) stop(); };
    // Finish before the existing theme transition takes its document snapshots.
    const themeObserver = new MutationObserver(() => {
      if (document.documentElement.dataset.themeTransition) stop();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme-transition"] });
    media.addEventListener("change", onMotionChange);
    window.addEventListener("resize", stop);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      themeObserver.disconnect();
      media.removeEventListener("change", onMotionChange);
      window.removeEventListener("resize", stop);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [finish]);

  const context = useMemo(() => ({ register }), [register]);
  return <LogoTransitionContext.Provider value={context}>
    {children}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img ref={overlay} src="/leibox-logo.svg?v=ei-20261023" alt="" aria-hidden="true" width={604} height={208} className={styles.overlay} data-logo-motion="idle" />
  </LogoTransitionContext.Provider>;
}
