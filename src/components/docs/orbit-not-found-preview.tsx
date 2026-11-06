"use client";

import { useEffect, useRef, useState } from "react";

import { useLanguage } from "@/components/common/language-provider";
import { MotionDemoFrame } from "@/components/docs/component-doc-chrome";

const width = 1440;
const height = 900;

export function OrbitNotFoundPreview() {
  const { t } = useLanguage();
  const viewport = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(Math.min(1, entry.contentRect.width / width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <MotionDemoFrame width={width} height={height} responsive={false} viewportRef={viewport}>
      <iframe
        src="/demos/orbit-not-found"
        title={t("Orbit 404 Page")}
        loading="lazy"
        width={width}
        height={height}
        className="absolute top-0 left-0 block origin-top-left max-w-none border-0"
        style={{ transform: `scale(${scale})` }}
      />
    </MotionDemoFrame>
  );
}
