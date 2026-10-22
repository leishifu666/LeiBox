"use client";

import { useLanguage } from "@/components/common/language-provider";

import { type ReactNode } from "react";

import { scrub } from "@/components/demos/control-schema";
import {
  DemoControls,
  useDemoScrollbarGutter,
} from "@/components/demos/demo-controls";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { VHS } from "@/components/docs/live/VHS";

const CONTROLS = {
  speed: scrub("Speed", 0.5, { min: 0, max: 4, step: 0.1, decimals: 1 }),
  wave: scrub("Wave", 1, { min: 0, max: 3, step: 0.05 }),
  jitter: scrub("Jitter", 0.25, { min: 0, max: 3, step: 0.05 }),
  crease: scrub("Crease", 0.1, { min: 0, max: 3, step: 0.05 }),
  switching: scrub("Switching", 0.05, { min: 0, max: 3, step: 0.05 }),
  switchingHeight: scrub("Switch height", 0.02, {
    min: 0,
    max: 0.2,
    step: 0.005,
    decimals: 3,
  }),
  bloom: scrub("Bloom", 0.4, { min: 0, max: 1, step: 0.05 }),
  aberration: scrub("Aberration", 2, {
    min: 0,
    max: 12,
    step: 0.5,
    decimals: 1,
  }),
  acBeat: scrub("AC beat", 1, { min: 0, max: 3, step: 0.05 }),
  grain: scrub("Grain", 0.1, { min: 0, max: 0.5, step: 0.01 }),
  scanlines: scrub("Scanlines", 0.1, { min: 0, max: 1, step: 0.05 }),
  vignette: scrub("Vignette", 0, { min: 0, max: 1, step: 0.05 }),
  barrel: scrub("Barrel", 0, { min: 0, max: 1, step: 0.05 }),
  saturation: scrub("Saturation", 1, { min: 0, max: 2, step: 0.05 }),
  exposure: scrub("Exposure", 1, { min: 0.5, max: 2, step: 0.05 }),
};

export function VHSDemo({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const controls = useDemoControls(CONTROLS);
  const values = controls.values;
  const setContentEl = useDemoScrollbarGutter();

  return (
    <>
      <VHS
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
      </VHS>

      <DemoControls
        title={t("VHS controls")}
        snippet={{ component: "VHS", props: { ...values } }}
        controls={controls}
      />
    </>
  );
}
