"use client";

import { useLanguage } from "@/components/common/language-provider";

import { type ReactNode } from "react";

import { scrub } from "@/components/demos/control-schema";
import {
  DemoControls,
  useDemoScrollbarGutter,
} from "@/components/demos/demo-controls";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { Displacement } from "@/components/docs/live/Displacement";

const CONTROLS = {
  grid: scrub("Grid cells", 50, { min: 4, max: 60, step: 1, decimals: 0 }),
  cellAspect: scrub("Cell aspect", 1, { min: 0.25, max: 4, step: 0.05 }),
  radius: scrub("Radius", 0.1, { min: 0.02, max: 0.6, step: 0.01 }),
  strength: scrub("Strength", 0.1, { min: 0, max: 1, step: 0.01 }),
  threshold: scrub("Speed threshold", 1000, {
    min: 0,
    max: 3000,
    step: 50,
    decimals: 0,
  }),
  relaxation: scrub("Relaxation", 0.9, { min: 0.5, max: 0.99, step: 0.005 }),
  shift: scrub("Shift", 1, { min: 0, max: 4, step: 0.05 }),
  aberration: scrub("Color fringe", 1.5, { min: 0, max: 3, step: 0.05 }),
  grain: scrub("Grain", 0.1, { min: 0, max: 1, step: 0.05 }),
  grainSize: scrub("Grain size", 1, { min: 0.5, max: 4, step: 0.1 }),
  grainSpeed: scrub("Grain speed", 1, { min: 0, max: 4, step: 0.1 }),
  scramble: scrub("Scramble", 1, { min: 0, max: 3, step: 0.1 }),
};

export function DisplacementDemo({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const controls = useDemoControls(CONTROLS);
  const setContentEl = useDemoScrollbarGutter();

  return (
    <>
      <Displacement
        {...controls.values}
        className="page-enter inset-0 z-30"
        style={{ position: "fixed" }}
      >
        <div
          ref={setContentEl}
          className="min-h-full bg-background px-5 pt-24 pb-10 sm:px-8 lg:pt-16 lg:pr-8 lg:pl-72"
        >
          {children}
        </div>
      </Displacement>

      <DemoControls
        title={t("Displacement controls")}
        snippet={{
          component: "Displacement",
          props: { ...controls.values },
        }}
        controls={controls}
      />
    </>
  );
}
