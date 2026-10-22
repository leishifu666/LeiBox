"use client";

import { useLanguage } from "@/components/common/language-provider";

import { type ReactNode } from "react";

import { color, scrub } from "@/components/demos/control-schema";
import {
  DemoControls,
  useDemoScrollbarGutter,
} from "@/components/demos/demo-controls";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { Blaze } from "@/components/docs/live/Blaze";

const CONTROLS = {
  height: scrub("Height", 0.97, { min: 0.1, max: 1, step: 0.01 }),
  distortion: scrub("Distortion", 0.6, {
    min: 0,
    max: 3,
    step: 0.1,
    decimals: 1,
  }),
  distortionScale: scrub("Heat scale", 0.5, { min: 0.3, max: 3, step: 0.05 }),
  speed: scrub("Speed", 1, { min: 0, max: 3, step: 0.1, decimals: 1 }),
  sparks: scrub("Sparks", 0.5, { min: 0, max: 2, step: 0.05 }),
  sparkDensity: scrub("Spark density", 1.5, { min: 0.3, max: 3, step: 0.05 }),
  sparkSize: scrub("Spark size", 1, { min: 0.5, max: 3, step: 0.05 }),
  layers: scrub("Layers", 4, { min: 1, max: 10, step: 1, decimals: 0 }),
  smoke: scrub("Smoke", 0.5, { min: 0, max: 2, step: 0.05 }),
  glow: scrub("Glow", 1.5, { min: 0, max: 3, step: 0.1, decimals: 1 }),
  spark: color("Spark", "#ff660d"),
  smokeColor: color("Smoke", "#ff6e1a"),
};

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

export function BlazeDemo({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const controls = useDemoControls(CONTROLS);
  const setContentEl = useDemoScrollbarGutter();

  const { spark, smokeColor, ...values } = controls.values;

  return (
    <>
      <Blaze
        {...values}
        sparkColor={hexToRgb(spark)}
        smokeColor={hexToRgb(smokeColor)}
        className="page-enter inset-0 z-30"
        style={{ position: "fixed" }}
      >
        <div
          ref={setContentEl}
          className="min-h-full bg-background px-5 pt-24 pb-10 sm:px-8 lg:pt-16 lg:pr-8 lg:pl-72"
        >
          {children}
        </div>
      </Blaze>

      <DemoControls
        title={t("Blaze controls")}
        snippet={{
          component: "Blaze",
          props: {
            ...values,
            sparkColor: hexToRgb(spark),
            smokeColor: hexToRgb(smokeColor),
          },
        }}
        controls={controls}
      />
    </>
  );
}
