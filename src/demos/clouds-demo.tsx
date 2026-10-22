"use client";

import { useLanguage } from "@/components/common/language-provider";

import { type ReactNode } from "react";

import { color, scrub } from "@/components/demos/control-schema";
import {
  DemoControls,
  useDemoScrollbarGutter,
} from "@/components/demos/demo-controls";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { Clouds } from "@/components/docs/live/Clouds";

const AUTO_COLOR = "auto";

const CONTROLS = {
  color: color("Color", AUTO_COLOR, { auto: { label: "Auto" } }),
  scale: scrub("Scale", 1, { min: 0.3, max: 3, step: 0.05 }),
  speed: scrub("Speed", 0.6, { min: 0, max: 5, step: 0.1, decimals: 1 }),
  cover: scrub("Cover", 0.1, { min: 0, max: 1, step: 0.02 }),
  density: scrub("Density", 2.5, { min: 0, max: 16, step: 0.5, decimals: 1 }),
  shading: scrub("Shading", 0.1, { min: 0, max: 1, step: 0.02 }),
  opacity: scrub("Opacity", 0.64, { min: 0, max: 1, step: 0.02 }),
  shadow: scrub("Shadow", 0.06, { min: 0, max: 1, step: 0.02 }),
  shadowOffsetX: scrub("Shadow X", 200, {
    min: -300,
    max: 300,
    step: 10,
    decimals: 0,
  }),
  shadowOffsetY: scrub("Shadow Y", -10, {
    min: -300,
    max: 300,
    step: 10,
    decimals: 0,
  }),
  shadowSoftness: scrub("Softness", 1, { min: 0, max: 1, step: 0.02 }),
  wind: scrub("Wind", 0.6, { min: 0, max: 1, step: 0.02 }),
  windRadius: scrub("Wind radius", 350, {
    min: 40,
    max: 400,
    step: 10,
    decimals: 0,
  }),
  refraction: scrub("Refraction", 0, { min: 0, max: 80, step: 1, decimals: 0 }),
  fogBlur: scrub("Fog blur", 0, { min: 0, max: 1, step: 0.02 }),
  quality: scrub("Quality", 1, { min: 0.2, max: 1, step: 0.05 }),
};

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

export function CloudsDemo({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const controls = useDemoControls(CONTROLS);
  const setContentEl = useDemoScrollbarGutter();

  const { color, ...values } = controls.values;

  return (
    <>
      <Clouds
        {...values}
        color={color === AUTO_COLOR ? "auto" : hexToRgb(color)}
        className="page-enter inset-0 z-30"
        style={{ position: "fixed" }}
      >
        <div
          ref={setContentEl}
          className="min-h-full bg-background px-5 pt-24 pb-10 sm:px-8 lg:pt-16 lg:pr-8 lg:pl-72"
        >
          {children}
        </div>
      </Clouds>

      <DemoControls
        title={t("Clouds controls")}
        snippet={{
          component: "Clouds",
          props: {
            ...values,
            color: color === AUTO_COLOR ? "auto" : hexToRgb(color),
          },
        }}
        controls={controls}
      />
    </>
  );
}
