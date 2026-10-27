"use client";

import { useLanguage } from "@/components/common/language-provider";

import { type ReactNode } from "react";

import { radio, scrub } from "@/components/demos/control-schema";
import {
  DemoControls,
  useDemoScrollbarGutter,
} from "@/components/demos/demo-controls";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { Glass } from "@/lib/Glass/Glass";

const CONTROLS = {
  shape: radio("Lens shape", "circle", [
    { value: "circle", label: "Circle" },
    { value: "square", label: "Square" },
    { value: "rectangle", label: "Rectangle" },
  ]),
  size: scrub("Size", 120, { min: 40, max: 280, step: 4, decimals: 0 }),
  aspect: scrub("Aspect", 1.7, { min: 1, max: 3, step: 0.05 }),
  corner: scrub("Corner", 32, { min: 0, max: 120, step: 2, decimals: 0 }),
  ior: scrub("IOR", 1.5, { min: 1.05, max: 2, step: 0.01 }),
  edge: scrub("Edge", 0.7, { min: 0, max: 0.95, step: 0.01 }),
  bevel: scrub("Bevel", 4, { min: 1, max: 10, step: 0.25 }),
  depth: scrub("Depth", 250, { min: 20, max: 800, step: 10, decimals: 0 }),
  aberration: scrub("Aberration", 1, { min: 0, max: 3, step: 0.05 }),
  blur: scrub("Blur", 0, { min: 0, max: 4, step: 0.1, decimals: 1 }),
  reflection: scrub("Reflection", 1, { min: 0, max: 2, step: 0.05 }),
  shine: scrub("Shine", 0.01, { min: 0, max: 2, step: 0.05 }),
  zoom: scrub("Zoom", 1.5, { min: 1, max: 3, step: 0.05 }),
  follow: scrub("Follow", 0.2, { min: 0.02, max: 1, step: 0.02 }),
};

export function GlassDemo({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const controls = useDemoControls(CONTROLS);
  const setContentEl = useDemoScrollbarGutter();

  const { shape, ...values } = controls.values;

  return (
    <>
      <Glass
        {...values}
        shape={shape}
        targets="h1, h2, h3, a, button, code"
        className="page-enter inset-0 z-30"
        style={{ position: "fixed" }}
      >
        <div
          ref={setContentEl}
          className="min-h-full bg-background px-5 pt-24 pb-10 sm:px-8 lg:pt-16 lg:pr-8 lg:pl-72"
        >
          {children}
        </div>
      </Glass>

      <DemoControls
        title={t("Glass controls")}
        snippet={{
          component: "Glass",
          props: { ...values, shape, targets: "h1, h2, h3, a, button, code" },
        }}
        controls={controls}
      />
    </>
  );
}
