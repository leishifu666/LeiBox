"use client";

import { useLayoutEffect, useState } from "react";

import { color, scrub } from "@/components/demos/control-schema";
import {
  DemoControls,
  useDemoScrollbarGutter,
} from "@/components/demos/demo-controls";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { MockSite } from "@/components/playground/mock-site";
import { DecryptReveal } from "@/components/docs/live/DecryptReveal";

const CONTROLS = {
  radius: scrub("Radius", 400, { min: 60, max: 900, step: 10, decimals: 0 }),
  softness: scrub("Softness", 0.5, { min: 0.05, max: 1, step: 0.05 }),
  cell: scrub("Cell size", 10, { min: 6, max: 32, step: 1, decimals: 0 }),
  aspect: scrub("Cell aspect", 0.75, { min: 0.35, max: 1.25, step: 0.05 }),
  colored: scrub("Colored", 1, { min: 0, max: 1, step: 0.05 }),
  brightness: scrub("Brightness", 1, { min: 0.2, max: 3, step: 0.05 }),
  legibility: scrub("Legibility", 1, { min: 0, max: 1, step: 0.05 }),
  contrast: scrub("Contrast", 1, { min: 0.3, max: 3, step: 0.05 }),
  exposure: scrub("Exposure", 1, { min: 0.2, max: 3, step: 0.05 }),
  scramble: scrub("Scramble", 0.1, { min: 0, max: 1, step: 0.02 }),
  scrambleSpeed: scrub("Scramble speed", 6, {
    min: 0,
    max: 30,
    step: 0.5,
    decimals: 1,
  }),
  edgeWidth: scrub("Edge width", 0.2, { min: 0, max: 1, step: 0.02 }),
  edgeFlicker: scrub("Edge flicker", 1, { min: 0, max: 1, step: 0.02 }),
  edgeGlow: scrub("Edge glow", 2, { min: 0, max: 3, step: 0.05 }),
  edgeTint: scrub("Edge tint", 0.75, { min: 0, max: 1, step: 0.02 }),
  aberration: scrub("Aberration", 10, { min: 0, max: 24, step: 0.5 }),
  passthrough: scrub("Passthrough", 0.15, { min: 0, max: 1, step: 0.02 }),
  threshold: scrub("Threshold", 0.025, { min: 0.005, max: 0.3, step: 0.005 }),
  smoothing: scrub("Smoothing", 0.2, { min: 0, max: 1, step: 0.05 }),
  color: color("Cipher color", "#4ade80"),
};

export function DecryptRevealEntry() {
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
      <DecryptReveal
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
      </DecryptReveal>

      <DemoControls
        title="Decrypt Reveal controls"
        snippet={{
          component: "DecryptReveal",
          props: { ...values, background: pageBg },
        }}
        controls={controls}
      />
    </>
  );
}
