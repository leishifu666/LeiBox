"use client";

import { useLanguage } from "@/components/common/language-provider";

import { type ReactNode } from "react";

import { color, scrub } from "@/components/demos/control-schema";
import {
  DemoControls,
  useDemoScrollbarGutter,
} from "@/components/demos/demo-controls";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { Laser } from "@/components/docs/live/Laser";

const CONTROLS = {
  speed: scrub("Speed", 0.3, { min: 0, max: 4, step: 0.1, decimals: 1 }),
  offset: scrub("Offset", 140, { min: 0, max: 400, step: 4, decimals: 0 }),
  thickness: scrub("Thickness", 6, {
    min: 0.5,
    max: 12,
    step: 0.5,
    decimals: 1,
  }),
  core: scrub("Core", 1, { min: 0, max: 2, step: 0.05 }),
  radius: scrub("Radius", 20, { min: 1, max: 60, step: 1, decimals: 0 }),
  glow: scrub("Glow", 2, { min: 0, max: 3, step: 0.05 }),
  wave: scrub("Wave", 10, { min: 0, max: 24, step: 0.5, decimals: 1 }),
  width: scrub("Width", 0.55, { min: 0.1, max: 1, step: 0.05 }),
  flicker: scrub("Flicker", 0.2, { min: 0, max: 1, step: 0.05 }),
  reveal: scrub("Reveal", 400, { min: 0, max: 480, step: 8, decimals: 0 }),
  heat: scrub("Heat", 1.5, { min: 0, max: 1.5, step: 0.05 }),
  shimmer: scrub("Shimmer", 12, { min: 0, max: 12, step: 0.5, decimals: 1 }),
  sparkle: scrub("Sparkle", 0.25, { min: 0, max: 2, step: 0.05 }),
  reactivity: scrub("Reactivity", 1, {
    min: 0,
    max: 3,
    step: 0.1,
    decimals: 1,
  }),
  color: color("Color", "#0d59ff"),
};

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

export function LaserDemo({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const controls = useDemoControls(CONTROLS);
  const setContentEl = useDemoScrollbarGutter();

  const { color, ...values } = controls.values;

  return (
    <>
      <Laser
        {...values}
        color={hexToRgb(color)}
        className="page-enter inset-0 z-30"
        style={{ position: "fixed" }}
      >
        <div
          ref={setContentEl}
          className="min-h-full bg-background px-5 pt-24 pb-10 sm:px-8 lg:pt-16 lg:pr-8 lg:pl-72"
        >
          {children}
        </div>
      </Laser>

      <DemoControls
        title={t("Laser controls")}
        snippet={{
          component: "Laser",
          props: { ...values, color: hexToRgb(color) },
        }}
        controls={controls}
      />
    </>
  );
}
