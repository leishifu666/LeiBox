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
import { AsciiObject } from "@/components/docs/live/AsciiObject";

const MODEL_URL = "/assets/models/bolt.glb";
const DEFAULT_HIGHLIGHT = "#066aff";

const CHARSETS: Record<string, string | undefined> = {
  full: undefined,
  simple: " .:-=+*#%@",
  digits: " .012345689",
};

const CONTROLS = {
  ascii: toggle("ASCII", true),
  colored: toggle("Scene colors", true, {
    when: (values) => values.ascii === true,
  }),
  invert: toggle("Invert", false, {
    when: (values) => values.ascii === true,
  }),
  autoRotate: toggle("Auto rotate", false),
  charsetChoice: radio(
    "Characters",
    "full",
    [
      { value: "full", label: "Full" },
      { value: "simple", label: "Simple" },
      { value: "digits", label: "Digits" },
    ],
    { when: (values) => values.ascii === true },
  ),
  cellSize: scrub("Cell size", 10, { min: 4, max: 28, step: 1, decimals: 0 }),
  cellAspect: scrub("Cell aspect", 0.6, { min: 0.35, max: 1.25, step: 0.05 }),
  contrast: scrub("Contrast", 1.5, {
    min: 0.5,
    max: 4,
    step: 0.1,
    decimals: 1,
  }),
  edgeContrast: scrub("Edge snap", 3, {
    min: 1,
    max: 6,
    step: 0.1,
    decimals: 1,
  }),
  exposure: scrub("Exposure", 1, { min: 0, max: 3, step: 0.05 }),
  color: color("Character color", "#ffffff", {
    when: (values) => values.colored === false,
  }),
  environmentIntensity: scrub("Environment", 1, {
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

export function AsciiObjectEntry() {
  const { resolvedTheme } = useTheme();
  const controls = useDemoControls(CONTROLS);
  const {
    highlight,
    ascii,
    colored,
    invert,
    autoRotate,
    charsetChoice,
    color: glyphColor,
    ...values
  } = controls.values;
  const toggles = { ascii, colored, invert, autoRotate };
  const charset = CHARSETS[charsetChoice];
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
                <AsciiObject
                  src={MODEL_URL}
                  {...values}
                  {...toggles}
                  {...(charset ? { charset } : {})}
                  color={glyphColor}
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
        title="ASCII Object controls"
        snippet={{
          component: "AsciiObject",
          props: {
            src: MODEL_URL,
            ...values,
            ...toggles,
            ...(charset ? { charset } : {}),
            color: glyphColor,
            highlight,
          },
        }}
        controls={controls}
      />
    </>
  );
}
