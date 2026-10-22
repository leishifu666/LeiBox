"use client";

import { useLanguage } from "@/components/common/language-provider";

import { type ReactNode } from "react";
import { useTheme } from "next-themes";

import { color, scrub } from "@/components/demos/control-schema";
import {
  ColorRow,
  DemoControls,
  useDemoScrollbarGutter,
} from "@/components/demos/demo-controls";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { Shatter } from "@/components/docs/live/Shatter";

const LIGHT_GAP = "#ffffff";
const DARK_GAP = "#0a0a0a";

const CONTROLS = {
  radius: scrub("Radius", 0.4, { min: 0.1, max: 0.8, step: 0.01 }),
  softness: scrub("Softness", 0.6, { min: 0, max: 1, step: 0.05 }),
  tileSize: scrub("Tile size", 125, {
    min: 40,
    max: 220,
    step: 5,
    decimals: 0,
  }),
  shards: scrub("Shards", 1, { min: 0, max: 1, step: 0.05 }),
  corner: scrub("Corner", 0, { min: 0, max: 30, step: 1, decimals: 0 }),
  lift: scrub("Lift", 30, { min: 0, max: 120, step: 2, decimals: 0 }),
  tilt: scrub("Tilt", 2, { min: 0, max: 3, step: 0.05 }),
  scatter: scrub("Scatter", 5, { min: 0, max: 30, step: 1, decimals: 0 }),
  perspective: scrub("Perspective", 1500, {
    min: 300,
    max: 2000,
    step: 50,
    decimals: 0,
  }),
  shadow: scrub("Shadow", 0.5, { min: 0, max: 2, step: 0.05 }),
  shading: scrub("Shading", 0.5, { min: 0, max: 2, step: 0.05 }),
  refraction: scrub("Refraction", 1.5, { min: 0, max: 2, step: 0.05 }),
  dispersion: scrub("Dispersion", 0.3, { min: 0, max: 1, step: 0.05 }),
  floatSpeed: scrub("Float speed", 2, {
    min: 0,
    max: 4,
    step: 0.1,
    decimals: 1,
  }),
  strength: scrub("Strength", 1, { min: 0, max: 1, step: 0.05 }),
  baseStrength: scrub("Base strength", 0, { min: 0, max: 1, step: 0.05 }),
  followSpeed: scrub("Follow speed", 3, {
    min: 1,
    max: 20,
    step: 0.5,
    decimals: 1,
  }),
  gap: color("Gap color", "", { auto: { label: "Auto" } }),
};

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16) / 255,
    parseInt(value.slice(2, 4), 16) / 255,
    parseInt(value.slice(4, 6), 16) / 255,
  ];
}

export function ShatterDemo({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const controls = useDemoControls(CONTROLS);
  const { setValue } = controls;
  const { resolvedTheme } = useTheme();
  const setContentEl = useDemoScrollbarGutter();

  const { gap: gapValue, ...values } = controls.values;
  const gap = gapValue === "" ? null : gapValue;
  const themeGap = resolvedTheme === "dark" ? DARK_GAP : LIGHT_GAP;
  const effectiveGap = gap ?? themeGap;

  return (
    <>
      <Shatter
        {...values}
        gapColor={hexToRgb(effectiveGap)}
        className="page-enter inset-0 z-30"
        style={{ position: "fixed" }}
      >
        <div
          ref={setContentEl}
          className="min-h-full bg-background px-5 pt-24 pb-10 sm:px-8 lg:pt-16 lg:pr-8 lg:pl-72"
        >
          {children}
        </div>
      </Shatter>

      <DemoControls
        title={t("Shatter controls")}
        snippet={{
          component: "Shatter",
          props: { ...values, gapColor: hexToRgb(effectiveGap) },
        }}
        controls={controls}
        rows={{
          gap: (
            <ColorRow
              label="Gap color"
              value={effectiveGap}
              onValueChange={(next) => setValue("gap", next)}
              onReset={gap !== null ? () => setValue("gap", "") : undefined}
            />
          ),
        }}
      />
    </>
  );
}
