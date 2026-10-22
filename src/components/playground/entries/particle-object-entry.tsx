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
import { ParticleObject } from "@/components/docs/live/ParticleObject";

const MODEL_URL = "/assets/models/bolt.glb";

const CONTROLS = {
  autoRotate: toggle("Auto rotate", false),
  count: scrub("Particles", 14000, {
    min: 1000,
    max: 60000,
    step: 1000,
    decimals: 0,
  }),
  size: scrub("Size", 2.4, { min: 0.5, max: 8, step: 0.1, decimals: 1 }),
  sizeVariance: scrub("Variance", 0.6, { min: 0, max: 1, step: 0.05 }),
  radius: scrub("Push radius", 110, {
    min: 20,
    max: 320,
    step: 5,
    decimals: 0,
  }),
  strength: scrub("Push strength", 1, {
    min: 0,
    max: 4,
    step: 0.1,
    decimals: 1,
  }),
  swirl: scrub("Swirl", 0.6, { min: 0, max: 2, step: 0.05 }),
  spring: scrub("Spring", 1, { min: 0.1, max: 4, step: 0.05 }),
  damping: scrub("Damping", 0.35, { min: 0, max: 1, step: 0.02 }),
  drift: scrub("Drift", 0.6, { min: 0, max: 3, step: 0.1, decimals: 1 }),
  scale: scrub("Scale", 3, { min: 0.5, max: 6, step: 0.1, decimals: 1 }),
  floatIntensity: scrub("Float", 2, { min: 0, max: 6, step: 0.1, decimals: 1 }),
  rotationIntensity: scrub("Rocking", 1, {
    min: 0,
    max: 4,
    step: 0.1,
    decimals: 1,
  }),
  floatSpeed: scrub("Float speed", 2, {
    min: 0,
    max: 8,
    step: 0.1,
    decimals: 1,
  }),
  fov: scrub("Field of view", 65, { min: 20, max: 100, step: 1, decimals: 0 }),
  cameraDistance: scrub("Camera distance", 4.2, {
    min: 2,
    max: 10,
    step: 0.1,
    decimals: 1,
  }),
};

export function ParticleObjectEntry() {
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
                <ParticleObject
                  src={MODEL_URL}
                  {...values}
                  {...toggles}
                  scale={values.scale * HERO_BLEED_SCALE}
                  zoom={false}
                  background=""
                  color=""
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
        title="Particle Object controls"
        snippet={{
          component: "ParticleObject",
          props: { src: MODEL_URL, ...values, ...toggles },
        }}
        controls={controls}
      />
    </>
  );
}
