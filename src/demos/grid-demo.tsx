"use client";

import { useLanguage } from "@/components/common/language-provider";

import { type ReactNode } from "react";

import { color, scrub } from "@/components/demos/control-schema";
import {
  DemoControls,
  useDemoScrollbarGutter,
} from "@/components/demos/demo-controls";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { Grid } from "@/components/docs/live/Grid";

const CONTROLS = {
  tileSize: scrub("Tile size", 150, {
    min: 16,
    max: 160,
    step: 2,
    decimals: 0,
  }),
  gap: scrub("Gap", 0, { min: 0, max: 12, step: 0.5, decimals: 1 }),
  cornerRadius: scrub("Corner radius", 0, {
    min: 0,
    max: 24,
    step: 1,
    decimals: 0,
  }),
  amplitude: scrub("Amplitude", 2.5, { min: 0, max: 3, step: 0.05 }),
  waveSpeed: scrub("Wave speed", 0.5, { min: 0.1, max: 3, step: 0.05 }),
  frequency: scrub("Frequency", 12, {
    min: 1,
    max: 40,
    step: 0.5,
    decimals: 1,
  }),
  waveWidth: scrub("Wave width", 0.05, { min: 0.02, max: 0.5, step: 0.01 }),
  fadeTime: scrub("Fade time", 0.2, {
    min: 0.2,
    max: 6,
    step: 0.1,
    decimals: 1,
  }),
  maxLift: scrub("Max lift", 1, { min: 0.1, max: 1, step: 0.05 }),
  jitter: scrub("Jitter", 0, { min: 0, max: 1, step: 0.05 }),
  liftHeight: scrub("Lift height", 60, {
    min: 0,
    max: 160,
    step: 2,
    decimals: 0,
  }),
  perspective: scrub("Perspective", 1200, {
    min: 300,
    max: 4000,
    step: 50,
    decimals: 0,
  }),
  tilt: scrub("Tilt", 1, { min: 0, max: 1, step: 0.05 }),
  shading: scrub("Shading", 0.05, { min: 0, max: 2, step: 0.05 }),
  tintStrength: scrub("Tint strength", 0.1, { min: 0, max: 1, step: 0.05 }),
  idleRipples: scrub("Idle ripples", 0, {
    min: 0,
    max: 6,
    step: 0.5,
    decimals: 1,
  }),
  tint: color("Tint", "#0055ff"),
};

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

export function GridDemo({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const controls = useDemoControls(CONTROLS);
  const setContentEl = useDemoScrollbarGutter();

  const { tint, ...values } = controls.values;

  return (
    <>
      <Grid
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
      </Grid>

      <DemoControls
        title={t("Grid controls")}
        snippet={{
          component: "Grid",
          props: { ...values, tint: hexToRgb(tint) },
        }}
        controls={controls}
      />
    </>
  );
}
