"use client";

import { useState } from "react";
import { useTheme } from "next-themes";

import { color, radio, scrub, toggle } from "@/components/demos/control-schema";
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
import { DitheredObject } from "@/components/docs/live/DitheredObject";

const MODEL_URL = "/assets/models/bolt.glb";
const DEFAULT_HIGHLIGHT = "#066aff";

const CONTROLS = {
  dither: toggle("Dither", true),
  method: radio(
    "Pattern",
    "bayer",
    [
      { value: "bayer", label: "Bayer" },
      { value: "halftone", label: "Halftone" },
      { value: "floyd", label: "Floyd" },
    ],
    { when: (values) => values.dither === true },
  ),
  grayscale: toggle("Grayscale", true),
  invert: toggle("Invert", false),
  autoRotate: toggle("Auto rotate", false),
  gridSize: scrub("Grid size", 4, { min: 1, max: 20, step: 1, decimals: 0 }),
  pixelSizeRatio: scrub("Pixelation", 1, {
    min: 1,
    max: 10,
    step: 1,
    decimals: 0,
  }),
  environmentIntensity: scrub("Environment", 0.1, {
    min: 0,
    max: 5,
    step: 0.1,
    decimals: 1,
  }),
  roughness: scrub("Roughness", 0.15, { min: 0, max: 1, step: 0.01 }),
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
  highlight: color("Highlight", DEFAULT_HIGHLIGHT),
};

export function DitheredObjectEntry() {
  const { resolvedTheme } = useTheme();
  const controls = useDemoControls(CONTROLS);
  const { highlight, grayscale, invert, dither, autoRotate, ...values } =
    controls.values;
  const toggles = { grayscale, invert, dither, autoRotate };
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
                <DitheredObject
                  src={MODEL_URL}
                  {...values}
                  {...toggles}
                  scale={values.scale * HERO_BLEED_SCALE}
                  zoom={false}
                  background=""
                  highlight={highlight}
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
        title="Dithered Object controls"
        snippet={{
          component: "DitheredObject",
          props: { src: MODEL_URL, ...values, ...toggles, highlight },
        }}
        controls={controls}
      />
    </>
  );
}
