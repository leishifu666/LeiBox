"use client";

import { useLanguage } from "@/components/common/language-provider";

import { type ReactNode } from "react";

import { color, radio, scrub, toggle } from "@/components/demos/control-schema";
import {
  DemoControls,
  useDemoScrollbarGutter,
} from "@/components/demos/demo-controls";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { Magnify } from "@/components/docs/live/Magnify";

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

const CONTROLS = {
  color: color("Accent", "#cccccc"),
  ring: toggle("Ring", true),
  crosshair: toggle("Crosshair", true),
  ticks: toggle("Ticks", true),
  brackets: toggle("Brackets", true),
  dot: toggle("Center dot", true),
  grid: toggle("Grid", false),
  readout: toggle("Readout", true),
  ripples: toggle("Click ripples", true),
  scrollZoom: toggle("Scroll zoom", false),
  zoomModifier: radio(
    "Hold",
    "shift",
    [
      { value: "shift", label: "Shift" },
      { value: "alt", label: "Alt" },
      { value: "ctrl", label: "Ctrl" },
      { value: "none", label: "None" },
    ],
    { when: (values) => values.scrollZoom === true },
  ),
  size: scrub("Size", 140, { min: 60, max: 260, step: 4, decimals: 0 }),
  zoom: scrub("Zoom", 1.5, { min: 1, max: 4, step: 0.05 }),
  follow: scrub("Follow", 0.25, { min: 0.02, max: 1, step: 0.02 }),
  hud: scrub("HUD", 0.8, { min: 0, max: 1, step: 0.02 }),
  aberration: scrub("Aberration", 0.8, { min: 0, max: 3, step: 0.05 }),
  haze: scrub("Haze", 0.2, { min: 0, max: 1, step: 0.02 }),
  rippleSpeed: scrub("Ripple speed", 900, {
    min: 200,
    max: 2400,
    step: 50,
    decimals: 0,
  }),
  rippleWidth: scrub("Ripple width", 2, {
    min: 0.5,
    max: 24,
    step: 0.5,
    decimals: 1,
  }),
  rippleBendWidth: scrub("Bend width", 100, {
    min: 10,
    max: 240,
    step: 5,
    decimals: 0,
  }),
  rippleBend: scrub("Ripple bend", 20, {
    min: 0,
    max: 120,
    step: 2,
    decimals: 0,
  }),
  rippleGlow: scrub("Ripple glow", 1, { min: 0, max: 2, step: 0.05 }),
};

export function MagnifyDemo({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const controls = useDemoControls(CONTROLS);
  const setContentEl = useDemoScrollbarGutter();

  const {
    color,
    ring,
    crosshair,
    ticks,
    brackets,
    dot,
    grid,
    readout,
    ripples,
    scrollZoom,
    ...values
  } = controls.values;
  const toggles = {
    ring,
    crosshair,
    ticks,
    brackets,
    dot,
    grid,
    readout,
    ripples,
    scrollZoom,
  };

  return (
    <>
      <Magnify
        {...values}
        {...toggles}
        color={hexToRgb(color)}
        className="page-enter inset-0 z-30"
        style={{ position: "fixed" }}
      >
        <div
          ref={setContentEl}
          className="min-h-full bg-background px-5 pt-24 pb-10 sm:px-8 lg:pt-16 lg:pr-8 lg:pl-72"
        >
          {children}
        </div>
      </Magnify>

      <DemoControls
        title={t("Magnify controls")}
        snippet={{
          component: "Magnify",
          props: { ...values, ...toggles, color: hexToRgb(color) },
        }}
        controls={controls}
      />
    </>
  );
}
