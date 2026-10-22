"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";

import { cn } from "@/lib/utils";

let lastRect: { left: number; top: number; at: number } | null = null;

const MORPH_WINDOW_MS = 400;

export function SiteLogo({ className }: { className?: string }) {
  const ref = useRef<HTMLImageElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prev = lastRect;
    lastRect = null;

    let animation: Animation | null = null;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prev && performance.now() - prev.at < MORPH_WINDOW_MS && !reduced) {
      const to = el.getBoundingClientRect();
      const dx = prev.left - to.left;
      const dy = prev.top - to.top;
      if ((dx !== 0 || dy !== 0) && el.animate) {
        animation = el.animate(
          [
            { transform: `translate(${dx}px, ${dy}px)` },
            { transform: "translate(0, 0)" },
          ],
          { duration: 250, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
        );
      }
    }

    return () => {
      const rect = el.getBoundingClientRect();
      animation?.cancel();
      if (rect.width > 0) {
        lastRect = { left: rect.left, top: rect.top, at: performance.now() };
      }
    };
  }, []);

  return (
    <Image
      ref={ref}
      src="/logo.svg"
      alt="Canvas UI"
      width={112}
      height={23}
      priority
      className={cn("invert dark:invert-0", className)}
    />
  );
}
