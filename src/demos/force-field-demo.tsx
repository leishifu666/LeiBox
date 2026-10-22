"use client";

import { useLanguage } from "@/components/common/language-provider";

import { type ReactNode } from "react";

import { color, radio, scrub, toggle } from "@/components/demos/control-schema";
import {
  DemoControls,
  useDemoScrollbarGutter,
} from "@/components/demos/demo-controls";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { ForceField } from "@/components/docs/live/ForceField";

const CONTROLS = {
  shape: radio("Shape", "hexagon", [
    { value: "hexagon", label: "Hexagon" },
    { value: "triangle", label: "Triangle" },
    { value: "square", label: "Square" },
  ]),
  cellScale: scrub("Cell scale", 16, { min: 6, max: 60, step: 1, decimals: 0 }),
  lineWidth: scrub("Line width", 0.03, { min: 0.01, max: 0.2, step: 0.005 }),
  gridOpacity: scrub("Grid opacity", 0.15, { min: 0, max: 1, step: 0.05 }),
  gridReveal: radio("Grid reveal", "click", [
    { value: "always", label: "Always" },
    { value: "hover", label: "Hover" },
    { value: "click", label: "Click" },
    { value: "both", label: "Both" },
  ]),
  gridRevealStrength: scrub("Reveal strength", 1.5, {
    min: 0,
    max: 3,
    step: 0.05,
  }),
  gridRevealRadius: scrub("Reveal radius", 250, {
    min: 60,
    max: 800,
    step: 10,
    decimals: 0,
  }),
  gridFade: scrub("Reveal fade", 0.35, { min: 0.02, max: 1, step: 0.01 }),
  flowIntensity: scrub("Energy flow", 0, { min: 0, max: 4, step: 0.05 }),
  flowSpeed: scrub("Flow speed", 0.5, { min: 0, max: 4, step: 0.05 }),
  flashIntensity: scrub("Cell flash", 0.1, { min: 0, max: 1, step: 0.02 }),
  edgeGlow: scrub("Edge glow", 0.2, { min: 0, max: 4, step: 0.05 }),
  hoverGlow: scrub("Hover glow", 0.25, { min: 0, max: 3, step: 0.05 }),
  hoverRadius: scrub("Hover radius", 350, {
    min: 40,
    max: 600,
    step: 10,
    decimals: 0,
  }),
  hoverCharge: scrub("Hover charge", 1.6, { min: 0, max: 2, step: 0.05 }),
  hideOnHover: toggle("Hide on hover", false),
  rippleIntensity: scrub("Ripple power", 0.1, { min: 0, max: 8, step: 0.1 }),
  rippleSpeed: scrub("Ripple speed", 0.5, { min: 0.1, max: 4, step: 0.05 }),
  rippleBlend: scrub("Ripple blend", 1, { min: 0, max: 1, step: 0.02 }),
  refraction: scrub("Refraction", 30, {
    min: 0,
    max: 60,
    step: 1,
    decimals: 0,
  }),
  aberration: scrub("Color fringe", 2.5, { min: 0, max: 8, step: 0.1 }),
  haze: scrub("Heat haze", 0.5, { min: 0, max: 2, step: 0.05 }),
  pageReact: scrub("Page react", 0, { min: 0, max: 1, step: 0.02 }),
  tint: scrub("Page tint", 0.1, { min: 0, max: 1, step: 0.02 }),
  reveal: scrub("Reveal", 1, { min: 0, max: 1, step: 0.01 }),
  dim: scrub("Page dim", 0, { min: 0, max: 1, step: 0.02 }),
  bloom: scrub("Bloom", 1, { min: 0, max: 3, step: 0.05 }),
  grain: scrub("Grain", 0.2, { min: 0, max: 1, step: 0.02 }),
  color: color("Field color", "#26aeff"),
  edgeColor: color("Edge color", "#80ccff"),
};

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

export function ForceFieldDemo({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const controls = useDemoControls(CONTROLS);
  const setContentEl = useDemoScrollbarGutter();

  const { color: fieldColor, edgeColor, ...values } = controls.values;

  return (
    <>
      <ForceField
        {...values}
        color={hexToRgb(fieldColor)}
        edgeColor={hexToRgb(edgeColor)}
        className="page-enter inset-0 z-30"
        style={{ position: "fixed" }}
      >
        <div
          ref={setContentEl}
          className="min-h-full bg-background px-5 pt-24 pb-10 sm:px-8 lg:pt-16 lg:pr-8 lg:pl-72"
        >
          {children}
        </div>
      </ForceField>

      <DemoControls
        title={t("Force Field controls")}
        snippet={{
          component: "ForceField",
          props: {
            ...values,
            color: hexToRgb(fieldColor),
            edgeColor: hexToRgb(edgeColor),
          },
        }}
        controls={controls}
      />
    </>
  );
}
