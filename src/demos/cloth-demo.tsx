"use client";

import { useLanguage } from "@/components/common/language-provider";

import { useEffect, useState, type ReactNode } from "react";

import { color, radio, scrub } from "@/components/demos/control-schema";
import { DemoControls } from "@/components/demos/demo-controls";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { Cloth } from "@/components/docs/live/Cloth";
import type { ClothPin } from "@/lib/Cloth/ClothVanilla";

const DEFAULT_PIN: ClothPin = "top";
const AUTO_COLOR = "auto";

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

const CONTROLS = {
  pin: radio("Pinned edge", DEFAULT_PIN, [
    { value: "top", label: "Top" },
    { value: "bottom", label: "Bottom" },
    { value: "left", label: "Left" },
    { value: "right", label: "Right" },
  ]),
  backing: color("Backing", AUTO_COLOR, { auto: { label: "Auto" } }),
  wind: scrub("Wind", 3, { min: 0, max: 5, step: 0.05 }),
  speed: scrub("Speed", 0.5, { min: 0, max: 3, step: 0.05 }),
  amplitude: scrub("Fold height", 30, {
    min: 0,
    max: 60,
    step: 1,
    decimals: 0,
  }),
  drape: scrub("Billow", 40, { min: 0, max: 50, step: 1, decimals: 0 }),
  brush: scrub("Brush", 2.05, { min: 0, max: 3, step: 0.05 }),
  brushSize: scrub("Brush size", 150, {
    min: 30,
    max: 260,
    step: 5,
    decimals: 0,
  }),
  damping: scrub("Settle", 1, { min: 0.2, max: 4, step: 0.05 }),
  light: scrub("Lighting", 0.5, { min: 0, max: 1, step: 0.05 }),
  sheen: scrub("Sheen", 0.1, { min: 0, max: 1, step: 0.05 }),
  shadow: scrub("Shadow", 0.25, { min: 0, max: 1, step: 0.05 }),
  cornerRadius: scrub("Corners", 20, {
    min: 0,
    max: 160,
    step: 2,
    decimals: 0,
  }),
  perspective: scrub("Perspective", 1200, {
    min: 400,
    max: 4000,
    step: 50,
    decimals: 0,
  }),
};

function usePageScrollSync(inner: HTMLElement | null) {
  const [overflowPx, setOverflowPx] = useState(0);

  useEffect(() => {
    if (!inner) return;
    const scroller = inner.parentElement;
    if (!scroller) return;
    const sync = () => {
      scroller.scrollTop = window.scrollY;
    };
    const measure = () => {
      setOverflowPx(Math.max(0, scroller.scrollHeight - scroller.clientHeight));
      sync();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(inner);
    observer.observe(scroller);
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", measure);
    };
  }, [inner]);

  return overflowPx;
}

export function ClothDemo({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const controls = useDemoControls(CONTROLS);
  const [inner, setInner] = useState<HTMLDivElement | null>(null);
  const overflowPx = usePageScrollSync(inner);

  const { pin, backing, ...values } = controls.values;

  return (
    <>
      <div
        aria-hidden
        style={{ height: `calc(100vh - 5rem + ${overflowPx}px)` }}
      />
      <div className="page-enter pointer-events-none fixed inset-0 z-30 px-5 pt-24 pb-10 sm:px-8 lg:pt-16 lg:pr-8 lg:pl-72">
        <Cloth
          {...values}
          pin={pin}
          backing={backing === AUTO_COLOR ? "auto" : hexToRgb(backing)}
          className="pointer-events-auto mx-auto h-full w-full max-w-[52rem]"
        >
          <div
            ref={setInner}
            className="min-h-full bg-background px-8 pt-10 pb-12"
          >
            {children}
          </div>
        </Cloth>
      </div>

      <DemoControls
        title={t("Cloth controls")}
        snippet={{
          component: "Cloth",
          props: {
            ...values,
            pin,
            backing: backing === AUTO_COLOR ? "auto" : hexToRgb(backing),
          },
        }}
        controls={controls}
      />
    </>
  );
}
