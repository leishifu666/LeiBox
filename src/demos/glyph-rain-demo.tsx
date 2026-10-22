"use client";

import { useLanguage } from "@/components/common/language-provider";

import { type ReactNode } from "react";

import { color, scrub } from "@/components/demos/control-schema";
import {
  DemoControls,
  useDemoScrollbarGutter,
} from "@/components/demos/demo-controls";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { GlyphRain } from "@/components/docs/live/GlyphRain";

const CONTROLS = {
  cell: scrub("Glyph size", 15, { min: 8, max: 48, step: 1, decimals: 0 }),
  speed: scrub("Speed", 0.2, { min: 0.05, max: 3, step: 0.05 }),
  speedVariance: scrub("Speed variance", 0.5, { min: 0, max: 1, step: 0.05 }),
  density: scrub("Density", 0.15, { min: 0, max: 1, step: 0.05 }),
  trail: scrub("Trail", 0.65, { min: 0.2, max: 3, step: 0.05 }),
  glow: scrub("Glow", 1.75, { min: 0, max: 3, step: 0.05 }),
  mutate: scrub("Mutation", 0, { min: 0, max: 4, step: 0.1 }),
  flicker: scrub("Flicker", 0, { min: 0, max: 1, step: 0.05 }),
  layers: scrub("Layers", 2, { min: 1, max: 3, step: 1, decimals: 0 }),
  dim: scrub("Page dim", 0.5, { min: 0, max: 1, step: 0.05 }),
  light: scrub("Light", 2.8, { min: 0, max: 3, step: 0.05 }),
  lightRadius: scrub("Light radius", 240, {
    min: 20,
    max: 600,
    step: 10,
    decimals: 0,
  }),
  lightHeight: scrub("Light height", 172, {
    min: 4,
    max: 300,
    step: 2,
    decimals: 0,
  }),
  relief: scrub("Relief", 0.05, { min: 0, max: 2, step: 0.05 }),
  stir: scrub("Stir", 0.7, { min: 0, max: 1, step: 0.05 }),
  stirRadius: scrub("Stir radius", 260, {
    min: 40,
    max: 900,
    step: 10,
    decimals: 0,
  }),
  settle: scrub("Settle", 0.9, { min: 0.1, max: 4, step: 0.05 }),
  color: color("Rain color", "#4474ff"),
  headColor: color("Head color", "#2b6aff"),
};

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

export function GlyphRainDemo({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const controls = useDemoControls(CONTROLS);
  const setContentEl = useDemoScrollbarGutter();

  const { color: rainColor, headColor, ...values } = controls.values;

  return (
    <>
      <GlyphRain
        {...values}
        color={hexToRgb(rainColor)}
        headColor={hexToRgb(headColor)}
        className="page-enter inset-0 z-30"
        style={{ position: "fixed" }}
      >
        <div
          ref={setContentEl}
          className="min-h-full bg-background px-5 pt-24 pb-10 sm:px-8 lg:pt-16 lg:pr-8 lg:pl-72"
        >
          {children}
        </div>
      </GlyphRain>

      <DemoControls
        title={t("Glyph Rain controls")}
        snippet={{
          component: "GlyphRain",
          props: {
            ...values,
            color: hexToRgb(rainColor),
            headColor: hexToRgb(headColor),
          },
        }}
        controls={controls}
      />
    </>
  );
}
