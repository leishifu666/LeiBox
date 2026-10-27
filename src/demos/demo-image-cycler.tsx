"use client";

import { T, useLanguage } from "@/components/common/language-provider";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";


export const DEMO_IMAGES = ["/landing/agent-demo/alpine-lake.png"];

export function DemoImageSection({
  hint,
  alt,
  images = DEMO_IMAGES,
}: {
  /** One-line instruction shown under the heading. */
  hint: string;
  /** Alt text for the active photo. */
  alt: string;
  images?: string[];
}) {
  const { t } = useLanguage();
  return (
    <section className="mt-8" aria-label={t("Demo image")}>
      <h2 className="text-lg font-semibold tracking-[-0.01em]"><T>Demo image</T></h2>
      <p className="mt-2 text-[13px] text-muted-foreground"><T>{hint}</T></p>
      <div className="mt-3 overflow-hidden rounded-xl border border-border/60">
        <DemoImageCycler images={images} alt={alt} />
      </div>
    </section>
  );
}

export function DemoImageCycler({
  images,
  alt,
  interval = 10000,
}: {
  images: string[];
  alt: string;
  interval?: number;
}) {
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();
  const imageCount = images.length;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion || imageCount < 2 || interval <= 0) return;

    let timer: ReturnType<typeof setInterval> | null = null;
    const stop = () => {
      if (timer === null) return;
      clearInterval(timer);
      timer = null;
    };
    const start = () => {
      if (timer !== null || document.hidden) return;
      timer = setInterval(
        () => setActiveIndex((prev) => (prev + 1) % imageCount),
        interval,
      );
    };
    const onVisibilityChange = () => {
      if (document.hidden) stop();
      else start();
    };

    start();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [imageCount, interval, shouldReduceMotion]);

  const active = imageCount === 0 ? 0 : activeIndex % imageCount;

  return (
    <div className="relative aspect-video w-full overflow-hidden">
      {images.map((src, index) => {
        const isActive = index === active;
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            crossOrigin="anonymous"
            alt={isActive ? t(alt) : ""}
            aria-hidden={!isActive}
            loading={index === 0 ? "eager" : "lazy"}
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              opacity: isActive ? 1 : 0,
              transform:
                shouldReduceMotion || isActive ? "scale(1)" : "scale(1.06)",
              filter:
                shouldReduceMotion || isActive ? "blur(0px)" : "blur(14px)",
              transition: shouldReduceMotion
                ? `opacity 0.4s ${EASE}`
                : `opacity 1.6s ${EASE}, transform 1.6s ${EASE}, filter 1.6s ${EASE}`,
            }}
          />
        );
      })}
    </div>
  );
}
