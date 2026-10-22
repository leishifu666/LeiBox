"use client";

import { useLanguage } from "@/components/common/language-provider";

import { type ReactNode } from "react";

import {
  color,
  radio,
  scrub,
} from "@/components/demos/control-schema";
import {
  DemoControls,
  useDemoScrollbarGutter,
} from "@/components/demos/demo-controls";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { HexFloat } from "@/components/docs/live/HexFloat";

const CONTROLS = {
  size: scrub("Size", 160, { min: 24, max: 160, step: 2, decimals: 0 }),
  gap: scrub("Gap", 0, { min: 0, max: 12, step: 0.5, decimals: 1 }),
  bevel: scrub("Bevel", 1.5, { min: 0, max: 20, step: 0.5, decimals: 1 }),
  tilt: scrub("Tilt", 24, { min: -30, max: 30, step: 1, decimals: 0 }),
  perspective: scrub("Perspective", 0.5, { min: 0, max: 1, step: 0.02 }),
  float: scrub("Float", 0, { min: 0, max: 1, step: 0.02 }),
  speed: scrub("Speed", 1, { min: 0.1, max: 3, step: 0.05 }),
  shine: scrub("Shine", 0.5, { min: 0, max: 2, step: 0.05 }),
  lift: scrub("Lift", 0.1, { min: 0, max: 1, step: 0.02 }),
  radius: scrub("Radius", 1200, { min: 60, max: 1400, step: 20, decimals: 0 }),
  flow: scrub("Flow", 0, { min: 0, max: 3, step: 0.05 }),
  swirl: scrub("Swirl", 0, { min: 0, max: 15, step: 0.5, decimals: 1 }),
  trail: scrub("Trail", 0, { min: 0, max: 1, step: 0.02 }),
  iridescence: scrub("Iridescence", 1, { min: 0, max: 2, step: 0.05 }),
  bloom: scrub("Bloom", 0, { min: 0, max: 1, step: 0.02 }),
  grain: scrub("Grain", 0.8, { min: 0, max: 1, step: 0.02 }),
  gapMode: radio("Seam", "auto", [
    { value: "auto", label: "Auto" },
    { value: "custom", label: "Custom" },
  ]),
  gapHex: color("Seam color", "#101014", {
    when: (values) => values.gapMode === "custom",
  }),
};

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

export function HexFloatDemo({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const controls = useDemoControls(CONTROLS);
  const setContentEl = useDemoScrollbarGutter();

  const { gapMode, gapHex, ...values } = controls.values;
  const gapColor: [number, number, number] | "auto" =
    gapMode === "auto" ? "auto" : hexToRgb(gapHex);

  return (
    <>
      <HexFloat
        {...values}
        gapColor={gapColor}
        className="page-enter inset-0 z-30"
        style={{ position: "fixed" }}
      >
        <div
          ref={setContentEl}
          className="min-h-full bg-background px-5 pt-24 pb-10 sm:px-8 lg:pt-16 lg:pr-8 lg:pl-72"
        >
          {children}
        </div>
      </HexFloat>

      <DemoControls
        title={t("Hex Float controls")}
        controls={controls}
        snippet={{
          component: "HexFloat",
          props: { ...values, gapColor },
        }}
      />
    </>
  );
}
