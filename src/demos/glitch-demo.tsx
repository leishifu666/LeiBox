"use client";

import { useLanguage } from "@/components/common/language-provider";

import { type ReactNode } from "react";

import { scrub } from "@/components/demos/control-schema";
import {
  DemoControls,
  useDemoScrollbarGutter,
} from "@/components/demos/demo-controls";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { Glitch } from "@/components/docs/live/Glitch";

const CONTROLS = {
  intensity: scrub("Intensity", 1, { min: 0, max: 2, step: 0.05 }),
  interval: scrub("Interval", 3, { min: 0, max: 8, step: 0.25 }),
  duration: scrub("Duration", 0.4, { min: 0.1, max: 2, step: 0.05 }),
  slices: scrub("Slices", 24, { min: 4, max: 80, step: 1, decimals: 0 }),
  shift: scrub("Shift", 30, { min: 0, max: 120, step: 2, decimals: 0 }),
  rgbShift: scrub("RGB Shift", 4, { min: 0, max: 20, step: 0.5, decimals: 1 }),
  blocks: scrub("Blocks", 0.5, { min: 0, max: 1, step: 0.02 }),
  noise: scrub("Noise", 0.35, { min: 0, max: 1, step: 0.02 }),
};

export function GlitchDemo({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const controls = useDemoControls(CONTROLS);
  const values = controls.values;
  const setContentEl = useDemoScrollbarGutter();

  return (
    <>
      <Glitch
        {...values}
        className="page-enter inset-0 z-30"
        style={{ position: "fixed" }}
      >
        <div
          ref={setContentEl}
          className="min-h-full bg-background px-5 pt-24 pb-10 sm:px-8 lg:pt-16 lg:pr-8 lg:pl-72"
        >
          {children}
        </div>
      </Glitch>

      <DemoControls
        title={t("Glitch controls")}
        snippet={{
          component: "Glitch",
          props: values,
        }}
        controls={controls}
      />
    </>
  );
}
