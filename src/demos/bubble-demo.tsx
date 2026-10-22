"use client";

import { useLanguage } from "@/components/common/language-provider";

import { type ReactNode } from "react";

import { color, scrub } from "@/components/demos/control-schema";
import {
  DemoControls,
  useDemoScrollbarGutter,
} from "@/components/demos/demo-controls";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { Bubble } from "@/components/docs/live/Bubble";

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

const CONTROLS = {
  tint: color("Tint", "#ffffff"),
  colorA: color("Sheen A", "#4a74b8"),
  colorB: color("Sheen B", "#69696a"),
  size: scrub("Size", 30, { min: 12, max: 140, step: 2, decimals: 0 }),
  trail: scrub("Trail", 24, { min: 1, max: 24, step: 1, decimals: 0 }),
  follow: scrub("Follow", 0.5, { min: 0.02, max: 1, step: 0.02 }),
  blend: scrub("Blend", 14, { min: 1, max: 24, step: 0.5, decimals: 1 }),
  speed: scrub("Speed", 2, { min: 0, max: 6, step: 0.1, decimals: 1 }),
  refraction: scrub("Refraction", 80, {
    min: -120,
    max: 120,
    step: 2,
    decimals: 0,
  }),
  dispersion: scrub("Dispersion", 1, { min: 0, max: 3, step: 0.05 }),
  frost: scrub("Frost", 0, { min: 0, max: 1, step: 0.02 }),
  shine: scrub("Shine", 0.25, { min: 0, max: 2, step: 0.05 }),
  rim: scrub("Rim", 0.5, { min: 0, max: 2, step: 0.05 }),
  iridescence: scrub("Iridescence", 1, { min: 0, max: 2, step: 0.05 }),
  intensity: scrub("Intensity", 0.9, {
    min: 0,
    max: 5,
    step: 0.1,
    decimals: 1,
  }),
  tintStrength: scrub("Tint strength", 0, { min: 0, max: 1, step: 0.02 }),
};

export function BubbleDemo({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const controls = useDemoControls(CONTROLS);
  const setContentEl = useDemoScrollbarGutter();

  const { tint, colorA, colorB, ...values } = controls.values;

  return (
    <>
      <Bubble
        {...values}
        tint={hexToRgb(tint)}
        colorA={hexToRgb(colorA)}
        colorB={hexToRgb(colorB)}
        className="page-enter inset-0 z-30"
        style={{ position: "fixed" }}
      >
        <div
          ref={setContentEl}
          className="min-h-full bg-background px-5 pt-24 pb-10 sm:px-8 lg:pt-16 lg:pr-8 lg:pl-72"
        >
          {children}
        </div>
      </Bubble>

      <DemoControls
        title={t("Bubble controls")}
        snippet={{
          component: "Bubble",
          props: {
            ...values,
            tint: hexToRgb(tint),
            colorA: hexToRgb(colorA),
            colorB: hexToRgb(colorB),
          },
        }}
        controls={controls}
      />
    </>
  );
}
