"use client";

import { useLanguage } from "@/components/common/language-provider";

import { type ReactNode } from "react";

import { color, radio, scrub } from "@/components/demos/control-schema";
import {
  DemoControls,
  useDemoScrollbarGutter,
} from "@/components/demos/demo-controls";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { RetroDither } from "@/components/docs/live/RetroDither";

const CONTROLS = {
  radius: scrub("Radius", 0.5, { min: 0.1, max: 0.8, step: 0.01 }),
  softness: scrub("Softness", 1, { min: 0, max: 1, step: 0.05 }),
  pixelSize: scrub("Pixel size", 2, { min: 1, max: 12, step: 1, decimals: 0 }),
  levels: scrub("Levels", 4, { min: 1, max: 8, step: 1, decimals: 0 }),
  colorize: scrub("Colorize", 0.1, { min: 0, max: 1, step: 0.05 }),
  contrast: scrub("Contrast", 0.6, { min: 0.5, max: 2, step: 0.05 }),
  brightness: scrub("Brightness", 0, { min: -0.5, max: 0.5, step: 0.05 }),
  strength: scrub("Strength", 0.75, { min: 0, max: 1, step: 0.05 }),
  baseStrength: scrub("Base strength", 0, { min: 0, max: 1, step: 0.05 }),
  invert: scrub("Invert", 0, { min: 0, max: 1, step: 0.05 }),
  scanlines: scrub("Scanlines", 0, { min: 0, max: 1, step: 0.05 }),
  pattern: radio("Pattern", "bayer", [
    { value: "bayer", label: "Bayer" },
    { value: "halftone", label: "Halftone" },
    { value: "hatch", label: "Hatch" },
    { value: "dash", label: "Dash" },
  ]),
  trail: scrub("Trail", 0.4, { min: 0, max: 1, step: 0.05 }),
  degauss: scrub("Degauss", 0.8, { min: 0, max: 1, step: 0.05 }),
  followSpeed: scrub("Follow speed", 3, {
    min: 1,
    max: 20,
    step: 0.5,
    decimals: 1,
  }),
  dark: color("Dark", "#000000"),
  light: color("Light", "#ffffff"),
};

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

export function RetroDitherDemo({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const controls = useDemoControls(CONTROLS);
  const setContentEl = useDemoScrollbarGutter();

  const { dark, light, ...values } = controls.values;

  return (
    <>
      <RetroDither
        {...values}
        darkColor={hexToRgb(dark)}
        lightColor={hexToRgb(light)}
        className="page-enter inset-0 z-30"
        style={{ position: "fixed" }}
      >
        <div
          ref={setContentEl}
          className="min-h-full bg-background px-5 pt-24 pb-10 sm:px-8 lg:pt-16 lg:pr-8 lg:pl-72"
        >
          {children}
        </div>
      </RetroDither>

      <DemoControls
        title={t("Retro Dither controls")}
        snippet={{
          component: "RetroDither",
          props: {
            ...values,
            darkColor: hexToRgb(dark),
            lightColor: hexToRgb(light),
          },
        }}
        controls={controls}
      />
    </>
  );
}
