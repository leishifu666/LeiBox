"use client";

import { useLanguage } from "@/components/common/language-provider";

import { type ReactNode } from "react";

import { radio, scrub } from "@/components/demos/control-schema";
import {
  DemoControls,
  useDemoScrollbarGutter,
} from "@/components/demos/demo-controls";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { Ripple } from "@/components/docs/live/Ripple";

const CONTROLS = {
  trigger: radio("Trigger", "click", [
    { value: "click", label: "Click" },
    { value: "hover", label: "Hover" },
    { value: "none", label: "None" },
  ]),
  amplitude: scrub("Amplitude", 0.5, { min: 0, max: 3, step: 0.05 }),
  speed: scrub("Speed", 0.65, { min: 0.2, max: 3, step: 0.05 }),
  wavelength: scrub("Wavelength", 80, {
    min: 8,
    max: 80,
    step: 1,
    decimals: 0,
  }),
  rings: scrub("Rings", 2, { min: 1, max: 8, step: 1, decimals: 0 }),
  decay: scrub("Decay", 1, { min: 0.2, max: 3, step: 0.05 }),
  refraction: scrub("Refraction", 100, {
    min: 0,
    max: 160,
    step: 2,
    decimals: 0,
  }),
  dispersion: scrub("Dispersion", 0.5, { min: 0, max: 1, step: 0.02 }),
  shine: scrub("Shine", 0.5, { min: 0, max: 2, step: 0.05 }),
  interval: scrub("Interval", 0, { min: 0, max: 5, step: 0.25 }),
};

export function RippleDemo({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const controls = useDemoControls(CONTROLS);
  const setContentEl = useDemoScrollbarGutter();

  const { trigger, ...values } = controls.values;

  return (
    <>
      <Ripple
        {...values}
        trigger={trigger}
        className="page-enter inset-0 z-30"
        style={{ position: "fixed" }}
      >
        <div
          ref={setContentEl}
          className="min-h-full bg-background px-5 pt-24 pb-10 sm:px-8 lg:pt-16 lg:pr-8 lg:pl-72"
        >
          {children}
        </div>
      </Ripple>

      <DemoControls
        title={t("Ripple controls")}
        snippet={{
          component: "Ripple",
          props: { ...values, trigger },
        }}
        controls={controls}
      />
    </>
  );
}
