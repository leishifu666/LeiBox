"use client";

import { useLanguage } from "@/components/common/language-provider";

import { type ReactNode } from "react";

import {
  color,
  scrub,
  toggle,
} from "@/components/demos/control-schema";
import {
  DemoControls,
  useDemoScrollbarGutter,
} from "@/components/demos/demo-controls";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { Frost } from "@/components/docs/live/Frost";

const CONTROLS = {
  frost: scrub("Frost", 0.05, { min: 0, max: 1, step: 0.05 }),
  strength: scrub("Strength", 0.7, { min: 0, max: 4, step: 0.1, decimals: 1 }),
  contrast: scrub("Contrast", 3, { min: 0.5, max: 4, step: 0.1, decimals: 1 }),
  crispness: scrub("Crispness", 1, { min: 0.5, max: 4, step: 0.1, decimals: 1 }),
  highlight: scrub("Highlight", 0.3, { min: 0, max: 1, step: 0.05 }),
  haze: scrub("Haze", 0.5, { min: 0, max: 1, step: 0.05 }),
  tintStrength: scrub("Tint", 0.3, { min: 0, max: 1, step: 0.05 }),
  refraction: scrub("Refraction", 1, { min: 0, max: 3, step: 0.1, decimals: 1 }),
  detail: scrub("Detail", 2, { min: 0, max: 6, step: 0.1, decimals: 1 }),
  textureScale: scrub("Texture scale", 2, { min: 0.3, max: 3, step: 0.05 }),
  meltRadius: scrub("Melt radius", 0.25, { min: 0.05, max: 0.5, step: 0.01 }),
  meltNoise: scrub("Melt noise", 0.25, { min: 0, max: 0.5, step: 0.01 }),
  meltStrength: scrub("Melt speed", 0.75, { min: 0.05, max: 1, step: 0.05 }),
  refreeze: scrub("Refreeze", 2, { min: 0, max: 10, step: 0.5, decimals: 1 }),
  opacity: scrub("Opacity", 0.6, { min: 0, max: 1, step: 0.05 }),
  shimmer: scrub("Shimmer", 0, { min: 0, max: 1, step: 0.05 }),
  meltEdges: toggle("Melt edges", true),
  tintThin: color("Tint thin", "#d1dbff"),
  tintThick: color("Tint thick", "#eaf5ff"),
};

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

export function FrostDemo({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const controls = useDemoControls(CONTROLS);
  const setContentEl = useDemoScrollbarGutter();

  const { tintThin, tintThick, meltEdges, ...values } = controls.values;

  return (
    <>
      <Frost
        {...values}
        meltEdges={meltEdges}
        tintThin={hexToRgb(tintThin)}
        tintThick={hexToRgb(tintThick)}
        className="page-enter inset-0 z-30"
        style={{ position: "fixed" }}
      >
        <div
          ref={setContentEl}
          className="min-h-full bg-background px-5 pt-24 pb-10 sm:px-8 lg:pt-16 lg:pr-8 lg:pl-72"
        >
          {children}
        </div>
      </Frost>

      <DemoControls
        title={t("Frost controls")}
        controls={controls}
        snippet={{
          component: "Frost",
          props: {
            ...values,
            meltEdges,
            tintThin: hexToRgb(tintThin),
            tintThick: hexToRgb(tintThick),
          },
        }}
      />
    </>
  );
}
