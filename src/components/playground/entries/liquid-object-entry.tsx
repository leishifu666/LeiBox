"use client";

import { useState } from "react";
import { useTheme } from "next-themes";

import { scrub, toggle } from "@/components/demos/control-schema";
import { DemoControls } from "@/components/demos/demo-controls";
import {
  EntryPage,
  HERO_BLEED_CLASS,
  HERO_BLEED_SCALE,
  StatusPill,
  type EntryStatus,
} from "@/components/playground/entries/shared";
import { MockSite } from "@/components/playground/mock-site";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { LiquidObject } from "@/components/docs/live/LiquidObject";

const MODEL_URL = "/assets/models/bolt.glb";

const CONTROLS = {
  autoRotate: toggle("Auto rotate", true),
  distortion: scrub("Distortion", 2, { min: 0, max: 3, step: 0.02 }),
  aberration: scrub("Color fringe", 0.75, { min: 0, max: 1, step: 0.01 }),
  grain: scrub("Grain", 1, { min: 0, max: 1, step: 0.01 }),
  metallic: scrub("Metallic", 0.15, { min: 0, max: 1, step: 0.01 }),
  sheen: scrub("Shine", 1.6, { min: 0, max: 2, step: 0.02 }),
  cursorSize: scrub("Cursor size", 1, { min: 0.05, max: 1, step: 0.01 }),
  persistence: scrub("Ripples", 0.6, { min: 0, max: 1, step: 0.01 }),
  swirl: scrub("Swirl", 0.5, { min: 0, max: 1, step: 0.01 }),
  iridescence: scrub("Iridescence", 1.5, { min: 0, max: 2, step: 0.02 }),
  splash: scrub("Splash", 1.2, { min: 0, max: 2, step: 0.02 }),
  ambient: scrub("Idle drift", 1, { min: 0, max: 2, step: 0.02 }),
  wobble: scrub("Wobble", 0, { min: 0, max: 2, step: 0.02 }),
  brightness: scrub("Brightness", 1, { min: 0, max: 2, step: 0.02 }),
  saturation: scrub("Saturation", 1.2, { min: 0, max: 2, step: 0.02 }),
  scale: scrub("Size", 3, { min: 1, max: 5, step: 0.05 }),
};

export function LiquidObjectEntry() {
  const { resolvedTheme } = useTheme();
  const controls = useDemoControls(CONTROLS);
  const { autoRotate, ...values } = controls.values;
  const toggles = { autoRotate };
  const [status, setStatus] = useState<EntryStatus>("loading");

  return (
    <>
      <EntryPage>
        <MockSite
          heroBleed
          heroMedia={
            <>
              <div
                className={`absolute inset-0 rounded-2xl ${
                  resolvedTheme === "dark" ? "bg-[#0a0a0a]" : "bg-white"
                }`}
              />
              <div className={HERO_BLEED_CLASS}>
                <LiquidObject
                  src={MODEL_URL}
                  {...values}
                  {...toggles}
                  scale={values.scale * HERO_BLEED_SCALE}
                  cursorSize={values.cursorSize * HERO_BLEED_SCALE}
                  orbit={false}
                  background=""
                  onLoad={() => setStatus("ready")}
                  onError={() => setStatus("error")}
                  className="h-full w-full"
                />
              </div>
              <StatusPill status={status} />
            </>
          }
        />
      </EntryPage>

      <DemoControls
        title="Liquid Object controls"
        snippet={{
          component: "LiquidObject",
          props: { src: MODEL_URL, ...values, ...toggles },
        }}
        controls={controls}
      />
    </>
  );
}
