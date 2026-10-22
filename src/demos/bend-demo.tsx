"use client";

import { useLanguage } from "@/components/common/language-provider";

import { type ReactNode } from "react";

import { radio, scrub, toggle } from "@/components/demos/control-schema";
import {
  DemoControls,
  useDemoScrollbarGutter,
} from "@/components/demos/demo-controls";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { Bend } from "@/components/docs/live/Bend";

type BendDirection = "out" | "in";

const DIRECTIONS: { value: BendDirection; label: string }[] = [
  { value: "out", label: "Outward" },
  { value: "in", label: "Inward" },
];

const CONTROLS = {
  direction: radio("Bend direction", "in", DIRECTIONS),
  top: toggle("Top", true),
  bottom: toggle("Bottom", true),
  zone: scrub("Zone", 240, { min: 60, max: 480, step: 10, decimals: 0 }),
  angle: scrub("Angle", 80, { min: 10, max: 160, step: 5, decimals: 0 }),
  rounding: scrub("Rounding", 150, { min: 0, max: 480, step: 10, decimals: 0 }),
  perspective: scrub("Perspective", 700, {
    min: 200,
    max: 2400,
    step: 50,
    decimals: 0,
  }),
  ease: scrub("Ease", 240, { min: 40, max: 800, step: 20, decimals: 0 }),
  smoothing: scrub("Smoothing", 0.1, { min: 0, max: 0.5, step: 0.01 }),
  tumble: scrub("Tumble", 0.5, { min: 0, max: 1, step: 0.05 }),
  tilt: scrub("Tilt", 0.5, { min: 0, max: 1, step: 0.05 }),
};

export function BendDemo({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const controls = useDemoControls(CONTROLS);
  const setContentEl = useDemoScrollbarGutter();

  const { direction, top, bottom, ...values } = controls.values;

  return (
    <>
      <Bend
        {...values}
        direction={direction}
        top={top}
        bottom={bottom}
        className="page-enter inset-0 z-30"
        style={{ position: "fixed" }}
      >
        <div
          ref={setContentEl}
          className="min-h-full bg-background px-5 pt-24 pb-10 sm:px-8 lg:pt-16 lg:pr-8 lg:pl-72"
        >
          {children}
        </div>
      </Bend>

      <DemoControls
        title={t("Bend controls")}
        snippet={{
          component: "Bend",
          props: { ...values, direction, top, bottom },
        }}
        controls={controls}
      />
    </>
  );
}
