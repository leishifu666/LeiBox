"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import { isLightVideo } from "@/data/components";
import { optimizedImage, previewPoster } from "@/lib/optimized-image";

export function PreviewVideo({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const isImage = /\.(?:png|webp|jpe?g)(?:\?|$)/i.test(src);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = true;

    let hovered = false;
    let focused = false;
    let inView = false;
    let releaseTimer: number | undefined;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const release = () => {
      window.clearTimeout(releaseTimer);
      video.pause();
      if (!video.hasAttribute("src")) return;
      video.removeAttribute("src");
      video.load();
    };
    const sync = () => {
      window.clearTimeout(releaseTimer);
      if (inView && !document.hidden && !motion.matches && (hovered || focused)) {
        if (!video.hasAttribute("src")) video.src = src;
        void video.play().catch(() => {});
        return;
      }
      video.pause();
      // Keep a brief pointer crossing from reopening the same decoder.
      if (!inView || document.hidden || motion.matches) release();
      else releaseTimer = window.setTimeout(release, 350);
    };

    const io = new IntersectionObserver(
      (entries) => {
        inView = entries.some((entry) => entry.isIntersecting);
        sync();
      },
      { rootMargin: "200px" },
    );
    io.observe(video);

    const card =
      video.closest<HTMLElement>("a, [data-preview-card]") ?? video.parentElement ?? video;
    const play = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      hovered = true;
      sync();
    };
    const pause = () => {
      hovered = false;
      sync();
    };
    const focus = () => { focused = true; sync(); };
    const blur = (event: FocusEvent) => {
      if (card.contains(event.relatedTarget as Node | null)) return;
      focused = false;
      sync();
    };

    card.addEventListener("pointerenter", play);
    card.addEventListener("pointerleave", pause);
    card.addEventListener("focusin", focus);
    card.addEventListener("focusout", blur);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    return () => {
      io.disconnect();
      release();
      card.removeEventListener("pointerenter", play);
      card.removeEventListener("pointerleave", pause);
      card.removeEventListener("focusin", focus);
      card.removeEventListener("focusout", blur);
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
    };
  }, [src]);

  if (isImage) return (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...optimizedImage(src)} alt="" loading="lazy" decoding="async" className={className} />
  );
  return (
    <video
      ref={ref}
      poster={previewPoster(src)}
      loop
      muted
      playsInline
      preload="none"
      disablePictureInPicture
      aria-hidden="true"
      tabIndex={-1}
      className={cn(
        "grayscale transition-[filter] duration-300 ease-out group-hover:grayscale-0 group-focus-visible:grayscale-0 motion-reduce:transition-none",
        isLightVideo(src)
          ? "dark:invert dark:hue-rotate-180"
          : "invert hue-rotate-180 dark:invert-0 dark:hue-rotate-0",
        className,
      )}
    />
  );
}
