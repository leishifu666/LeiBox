"use client";

import { useState } from "react";
import { useTheme } from "next-themes";

import { scrub, toggle } from "@/components/demos/control-schema";
import { DemoControls } from "@/components/demos/demo-controls";
import {
  EntryPage,
  StatusPill,
  type EntryStatus,
} from "@/components/playground/entries/shared";
import { MOCK_IMAGES, MockSite } from "@/components/playground/mock-site";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { GlassObject } from "@/components/docs/live/GlassObject";

const CONTROLS = {
  autoRotate: toggle("Auto rotate", false),
  ior: scrub("Refraction", 1.75, { min: 1, max: 2.33, step: 0.01 }),
  thickness: scrub("Thickness", 4, { min: 0, max: 4, step: 0.05 }),
  roughness: scrub("Frost", 0.25, { min: 0, max: 1, step: 0.01 }),
  dispersion: scrub("Dispersion", 1.5, { min: 0, max: 2, step: 0.05 }),
  clearcoat: scrub("Clearcoat", 0.5, { min: 0, max: 1, step: 0.05 }),
  depth: scrub("Depth", 0.1, { min: 0.04, max: 0.8, step: 0.02 }),
  bevel: scrub("Bevel", 1, { min: 0, max: 1, step: 0.05 }),
  environmentIntensity: scrub("Environment", 1, {
    min: 0,
    max: 4,
    step: 0.1,
    decimals: 1,
  }),
  scale: scrub("Scale", 3, { min: 0.5, max: 6, step: 0.1, decimals: 1 }),
  floatIntensity: scrub("Float", 1, { min: 0, max: 6, step: 0.1, decimals: 1 }),
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
  fov: scrub("Field of view", 55, { min: 20, max: 100, step: 1, decimals: 0 }),
  cameraDistance: scrub("Camera distance", 4, {
    min: 2,
    max: 10,
    step: 0.1,
    decimals: 1,
  }),
};

export function GlassObjectEntry() {
  const { resolvedTheme } = useTheme();
  const controls = useDemoControls(CONTROLS);
  const { autoRotate, ...values } = controls.values;
  const toggles = { autoRotate };
  const [status, setStatus] = useState<EntryStatus>("loading");

  return (
    <>
      <EntryPage>
        <MockSite
          heroMedia={
            <div className="absolute inset-0">
              <GlassObject
                src="/assets/bolt-mark.svg"
                {...values}
                {...toggles}
                zoom={false}
                tint=""
                background={resolvedTheme === "dark" ? "#0a0a0a" : "#ffffff"}
                backgroundImage={MOCK_IMAGES.glassBackdrop}
                onLoad={() => setStatus("ready")}
                onError={() => setStatus("error")}
                className="h-full w-full"
              />
              <StatusPill status={status} />
            </div>
          }
        />
      </EntryPage>

      <DemoControls
        title="Glass Object controls"
        snippet={{
          component: "GlassObject",
          props: {
            src: "/assets/bolt-mark.svg",
            ...values,
            ...toggles,
            background: resolvedTheme === "dark" ? "#0a0a0a" : "#ffffff",
            backgroundImage: MOCK_IMAGES.glassBackdrop,
          },
        }}
        controls={controls}
      />
    </>
  );
}
