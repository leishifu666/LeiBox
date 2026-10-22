"use client";

import { useLayoutEffect, useState } from "react";

import { scrub } from "@/components/demos/control-schema";
import {
  DemoControls,
  useDemoScrollbarGutter,
} from "@/components/demos/demo-controls";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { MockSite } from "@/components/playground/mock-site";
import { ParticleReveal } from "@/components/docs/live/ParticleReveal";

const CONTROLS = {
  radius: scrub("Radius", 500, { min: 60, max: 900, step: 10, decimals: 0 }),
  softness: scrub("Softness", 0.75, { min: 0.05, max: 1, step: 0.05 }),
  size: scrub("Size", 1, { min: 0.5, max: 3, step: 0.25 }),
  scatter: scrub("Scatter", 25, { min: 0, max: 200, step: 5, decimals: 0 }),
  drift: scrub("Drift", 1, { min: 0, max: 2, step: 0.1, decimals: 1 }),
  aberration: scrub("Aberration", 40, {
    min: 0,
    max: 80,
    step: 2,
    decimals: 0,
  }),
  bend: scrub("Bend", 50, { min: 0, max: 240, step: 10, decimals: 0 }),
  fade: scrub("Fade", 0.85, { min: 0, max: 1, step: 0.05 }),
  threshold: scrub("Threshold", 0.1, { min: 0, max: 0.3, step: 0.01 }),
  smoothing: scrub("Smoothing", 0.25, { min: 0, max: 1, step: 0.05 }),
};

export function ParticleRevealEntry() {
  const controls = useDemoControls(CONTROLS);
  const values = controls.values;
  const [pageBg, setPageBg] = useState("#000000");
  const setContentEl = useDemoScrollbarGutter();

  useLayoutEffect(() => {
    const read = () =>
      setPageBg(getComputedStyle(document.body).backgroundColor);
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <ParticleReveal
        {...values}
        background={pageBg}
        className="page-enter inset-0 z-30"
        style={{ position: "fixed" }}
      >
        <div
          ref={setContentEl}
          className="min-h-full bg-background px-5 pt-24 pb-10 sm:px-8 lg:pt-16 lg:pr-8 lg:pl-72"
        >
          <MockSite />
        </div>
      </ParticleReveal>

      <DemoControls
        title="Particle Reveal controls"
        snippet={{
          component: "ParticleReveal",
          props: { ...values, background: pageBg },
        }}
        controls={controls}
      />
    </>
  );
}
