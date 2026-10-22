"use client";

import { useLanguage } from "@/components/common/language-provider";

import { type ReactNode } from "react";

import { scrub } from "@/components/demos/control-schema";
import {
  DemoControls,
  useDemoScrollbarGutter,
} from "@/components/demos/demo-controls";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { ParticleScroll } from "@/components/docs/live/ParticleScroll";

const CONTROLS = {
  point: scrub("Point", 0.68, { min: 0.2, max: 1, step: 0.01 }),
  band: scrub("Band", 420, { min: 60, max: 800, step: 20, decimals: 0 }),
  density: scrub("Density", 2, { min: 1.5, max: 8, step: 0.25 }),
  size: scrub("Size", 1.25, { min: 0.5, max: 4, step: 0.25 }),
  spread: scrub("Spread", 220, { min: 0, max: 800, step: 20, decimals: 0 }),
  gravity: scrub("Gravity", 0.35, { min: -1, max: 1, step: 0.05 }),
  drift: scrub("Drift", 0.7, { min: 0, max: 1, step: 0.05 }),
  swirl: scrub("Swirl", 60, { min: 0, max: 300, step: 10, decimals: 0 }),
  stagger: scrub("Stagger", 0.7, { min: 0, max: 1, step: 0.05 }),
  fade: scrub("Fade", 0.85, { min: 0, max: 1, step: 0.05 }),
  settle: scrub("Settle", 1.2, { min: 0.2, max: 3, step: 0.05 }),
  smoothing: scrub("Smoothing", 0.6, { min: 0, max: 1.5, step: 0.05 }),
};

export function ParticleScrollDemo({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const controls = useDemoControls(CONTROLS);
  const values = controls.values;
  const setContentEl = useDemoScrollbarGutter();

  return (
    <>
      <ParticleScroll
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
      </ParticleScroll>

      <DemoControls
        title={t("Particle Scroll controls")}
        snippet={{ component: "ParticleScroll", props: { ...values } }}
        controls={controls}
      />
    </>
  );
}
