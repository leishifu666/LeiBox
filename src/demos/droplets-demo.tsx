"use client";

import { useLanguage } from "@/components/common/language-provider";

import { type ReactNode } from "react";

import { color, scrub } from "@/components/demos/control-schema";
import {
  DemoControls,
  useDemoScrollbarGutter,
} from "@/components/demos/demo-controls";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { Droplets } from "@/components/docs/live/Droplets";

const CONTROLS = {
  intensity: scrub("Intensity", 0.5, { min: 0, max: 1.25, step: 0.05 }),
  speed: scrub("Speed", 1, { min: 0, max: 3, step: 0.1, decimals: 1 }),
  scale: scrub("Scale", 0.4, { min: 0.4, max: 2.5, step: 0.05 }),
  dropWidth: scrub("Drop width", 1, { min: 0.4, max: 1.5, step: 0.05 }),
  dropLength: scrub("Drop length", 1, { min: 0.4, max: 2.5, step: 0.05 }),
  refraction: scrub("Refraction", 0.2, {
    min: 0,
    max: 3,
    step: 0.1,
    decimals: 1,
  }),
  blur: scrub("Blur", 0, { min: 0, max: 4, step: 0.1, decimals: 1 }),
  vignette: scrub("Vignette", 0, { min: 0, max: 1, step: 0.05 }),
  fallSpeed: scrub("Fall speed", 1, { min: 0, max: 3, step: 0.1, decimals: 1 }),
  wiggle: scrub("Wiggle", 1, { min: 0, max: 2, step: 0.1, decimals: 1 }),
  staticDrops: scrub("Static drops", 0.2, {
    min: 0,
    max: 3,
    step: 0.1,
    decimals: 1,
  }),
  interactionRadius: scrub("Wipe radius", 0.3, {
    min: 0.02,
    max: 0.4,
    step: 0.01,
  }),
  interactionStrength: scrub("Wipe strength", 0.6, {
    min: 0,
    max: 1,
    step: 0.05,
  }),
  interactionDistortion: scrub("Wipe distort", 3, {
    min: 0,
    max: 3,
    step: 0.1,
    decimals: 1,
  }),
  tintStrength: scrub("Tint strength", 0, { min: 0, max: 1, step: 0.05 }),
  tint: color("Tint", "#8fb4ff"),
};

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

export function DropletsDemo({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const controls = useDemoControls(CONTROLS);
  const setContentEl = useDemoScrollbarGutter();

  const { tint, ...values } = controls.values;

  return (
    <>
      <Droplets
        {...values}
        tint={hexToRgb(tint)}
        className="page-enter inset-0 z-30"
        style={{ position: "fixed" }}
      >
        <div
          ref={setContentEl}
          className="min-h-full bg-background px-5 pt-24 pb-10 sm:px-8 lg:pt-16 lg:pr-8 lg:pl-72"
        >
          {children}
        </div>
      </Droplets>

      <DemoControls
        title={t("Droplets controls")}
        snippet={{
          component: "Droplets",
          props: { ...values, tint: hexToRgb(tint) },
        }}
        controls={controls}
      />
    </>
  );
}
