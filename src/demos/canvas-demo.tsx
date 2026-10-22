"use client";

import { useLanguage } from "@/components/common/language-provider";

import { type ReactNode } from "react";

import { color, scrub } from "@/components/demos/control-schema";
import {
  DemoControls,
  useDemoScrollbarGutter,
} from "@/components/demos/demo-controls";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { Canvas } from "@/components/docs/live/Canvas";

const CONTROLS = {
  threadSize: scrub("Thread size", 2, {
    min: 2,
    max: 12,
    step: 1,
    decimals: 0,
  }),
  threadWidth: scrub("Thread width", 0.2, { min: 0, max: 0.4, step: 0.01 }),
  texture: scrub("Texture", 1, { min: 0, max: 1, step: 0.05 }),
  tintStrength: scrub("Tint strength", 0, { min: 0, max: 1, step: 0.05 }),
  grain: scrub("Grain", 0.5, { min: 0, max: 1, step: 0.05 }),
  halftone: scrub("Halftone", 0.1, { min: 0, max: 1, step: 0.05 }),
  dotSize: scrub("Dot size", 6, { min: 2, max: 10, step: 0.5, decimals: 1 }),
  strength: scrub("Strength", 1, { min: 0, max: 1, step: 0.05 }),
  relief: scrub("Relief", 0.45, { min: 0, max: 1, step: 0.05 }),
  gloss: scrub("Gloss", 0.35, { min: 0, max: 1, step: 0.05 }),
  bristle: scrub("Bristle", 0.4, { min: 0, max: 1, step: 0.05 }),
  dry: scrub("Dry", 2.5, { min: 0.3, max: 8, step: 0.1, decimals: 1 }),
  radius: scrub("Brush radius", 0.08, { min: 0.02, max: 0.25, step: 0.01 }),
  followSpeed: scrub("Follow speed", 3, {
    min: 1,
    max: 20,
    step: 0.5,
    decimals: 1,
  }),
  tint: color("Tint", "#d6cec0"),
};

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

export function CanvasDemo({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const controls = useDemoControls(CONTROLS);
  const setContentEl = useDemoScrollbarGutter();

  const { tint, ...values } = controls.values;

  return (
    <>
      <Canvas
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
      </Canvas>

      <DemoControls
        title={t("Canvas controls")}
        snippet={{
          component: "Canvas",
          props: {
            ...values,
            tint: hexToRgb(tint),
          },
        }}
        controls={controls}
      />
    </>
  );
}
