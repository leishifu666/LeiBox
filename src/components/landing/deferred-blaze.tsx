"use client";

import { lazy, Suspense, useEffect, useRef, useState, type ComponentProps } from "react";

const Blaze = lazy(() => import("@/lib/Blaze/Blaze").then(module => ({ default: module.Blaze })));
type Props = ComponentProps<typeof import("@/lib/Blaze/Blaze").Blaze>;

export function DeferredBlaze(props: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let near = false;
    let releaseTimer: number | undefined;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      window.clearTimeout(releaseTimer);
      if (near && !document.hidden && !motion.matches) { setActive(true); return; }
      // Preserve keyboard focus while a user is interacting with footer links.
      if (!document.hidden && element.contains(document.activeElement)) return;
      releaseTimer = window.setTimeout(() => setActive(false), 700);
    };
    const observer = new IntersectionObserver(([entry]) => { near = entry.isIntersecting; sync(); }, { rootMargin: "300px" });
    observer.observe(element);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    element.addEventListener("focusout", sync);
    return () => {
      window.clearTimeout(releaseTimer);
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
      element.removeEventListener("focusout", sync);
    };
  }, []);
  const content = <div style={{ position: "absolute", inset: 0 }}>{props.children}</div>;
  return <div ref={ref} data-deferred-effect={active ? "active" : "idle"} style={{ position: "relative", ...props.style }}>
    {active ? <Suspense fallback={content}><Blaze {...props} maxPixelRatio={1.25} releaseOnUnmount /></Suspense> : content}
  </div>;
}
