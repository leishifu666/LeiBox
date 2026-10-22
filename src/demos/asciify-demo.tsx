"use client";

import { useLanguage } from "@/components/common/language-provider";

import { type ReactNode } from "react";

import { color, radio, scrub } from "@/components/demos/control-schema";
import {
  DemoControls,
  useDemoScrollbarGutter,
} from "@/components/demos/demo-controls";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { Asciify } from "@/components/docs/live/Asciify";

const CONTROLS = {
  charset: radio("Charset", "ascii", [
    { value: "ascii", label: "Ascii" },
    { value: "blocks", label: "Blocks" },
    { value: "binary", label: "Binary" },
  ]),
  radius: scrub("Radius", 0.4, { min: 0.1, max: 0.8, step: 0.01 }),
  softness: scrub("Softness", 1, { min: 0, max: 1, step: 0.05 }),
  scale: scrub("Scale", 2, { min: 1, max: 6, step: 0.5, decimals: 1 }),
  spacing: scrub("Spacing", 1, { min: 0, max: 3, step: 1, decimals: 0 }),
  backgroundOpacity: scrub("Bg opacity", 0, { min: 0, max: 1, step: 0.05 }),
  contrast: scrub("Contrast", 1, { min: 0.5, max: 2, step: 0.05 }),
  brightness: scrub("Brightness", 0, { min: -0.5, max: 0.5, step: 0.05 }),
  invert: scrub("Invert", 0, { min: 0, max: 1, step: 0.05 }),
  glow: scrub("Text glow", 0.75, { min: 0, max: 1, step: 0.05 }),
  aberration: scrub("Color fringe", 0.75, { min: 0, max: 1, step: 0.05 }),
  strength: scrub("Strength", 1, { min: 0, max: 1, step: 0.05 }),
  baseStrength: scrub("Base strength", 0, { min: 0, max: 1, step: 0.05 }),
  followSpeed: scrub("Follow speed", 3, {
    min: 1,
    max: 20,
    step: 0.5,
    decimals: 1,
  }),
  background: color("Background", "#000000"),
};

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

export function AsciifyDemo({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const controls = useDemoControls(CONTROLS);
  const setContentEl = useDemoScrollbarGutter();

  const { charset, background, ...values } = controls.values;

  return (
    <>
      <Asciify
        {...values}
        charset={charset}
        background={hexToRgb(background)}
        className="page-enter inset-0 z-30"
        style={{ position: "fixed" }}
      >
        <div
          ref={setContentEl}
          className="min-h-full bg-background px-5 pt-24 pb-10 sm:px-8 lg:pt-16 lg:pr-8 lg:pl-72"
        >
          {children}
        </div>
      </Asciify>

      <DemoControls
        title={t("Asciify controls")}
        controls={controls}
        snippet={{
          component: "Asciify",
          props: { ...values, charset, background: hexToRgb(background) },
        }}
      />
    </>
  );
}
