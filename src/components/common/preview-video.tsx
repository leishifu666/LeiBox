"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import { isLightVideo } from "@/data/components";

export function PreviewVideo({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = true;

    let hovered = false;
    let primed = false;
    let cancelled = false;

    const prime = () => {
      if (primed) return;
      primed = true;
      video.preload = "metadata";
      void video
        .play()
        .then(() => {
          if (cancelled || hovered) return;
          video.pause();
          video.currentTime = 0;
        })
        .catch(() => {});
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          prime();
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(video);

    const card =
      video.closest("a, [data-preview-card]") ?? video.parentElement ?? video;
    const play = () => {
      hovered = true;
      primed = true;
      void video.play().catch(() => {});
    };
    const pause = () => {
      hovered = false;
      video.pause();
    };

    card.addEventListener("pointerenter", play);
    card.addEventListener("pointerleave", pause);
    card.addEventListener("focusin", play);
    card.addEventListener("focusout", pause);
    return () => {
      cancelled = true;
      io.disconnect();
      video.pause();
      card.removeEventListener("pointerenter", play);
      card.removeEventListener("pointerleave", pause);
      card.removeEventListener("focusin", play);
      card.removeEventListener("focusout", pause);
    };
  }, [src]);

  return (
    <video
      ref={ref}
      src={src}
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
