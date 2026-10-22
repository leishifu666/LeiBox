"use client";

import { T } from "@/components/common/language-provider";
import { useState } from "react";
import { MousePointer2 } from "lucide-react";

import { radio, scrub } from "@/components/demos/control-schema";
import { DemoControls, RadioRow } from "@/components/demos/demo-controls";
import { EntryPage } from "@/components/playground/entries/shared";
import { MockDashboard, MockSite } from "@/components/playground/mock-site";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { Peel } from "@/components/docs/live/Peel";
import type { PeelMode, PeelSide } from "@/lib/Peel/PeelVanilla";

const DEFAULT_SIDE: PeelSide = "left";
const DEFAULT_MODE: PeelMode = "hover";

const CONTROLS = {
  mode: radio("Mode", DEFAULT_MODE, [
    { value: "hover", label: "Hover" },
    { value: "cursor", label: "Cursor" },
  ]),
  side: radio("Side", DEFAULT_SIDE, [
    { value: "left", label: "Left" },
    { value: "right", label: "Right" },
    { value: "top", label: "Top" },
    { value: "bottom", label: "Bottom" },
  ]),
  reveal: scrub("Reveal", 250, { min: 80, max: 480, step: 10, decimals: 0 }),
  zone: scrub("Zone", 200, { min: 40, max: 400, step: 10, decimals: 0 }),
  curl: scrub("Curl", 300, { min: 40, max: 400, step: 10, decimals: 0 }),
  bow: scrub("Bow", 75, { min: -150, max: 150, step: 5, decimals: 0 }),
  shade: scrub("Shade", 0.25, { min: 0, max: 1, step: 0.05 }),
  shine: scrub("Shine", 1, { min: 0, max: 1, step: 0.05 }),
  shineDistance: scrub("Shine distance", 1200, {
    min: 0,
    max: 1200,
    step: 50,
    decimals: 0,
  }),
  bulge: scrub("Bulge", 50, { min: 0, max: 200, step: 10, decimals: 0 }),
  perspective: scrub("Perspective", 2000, {
    min: 400,
    max: 3000,
    step: 50,
    decimals: 0,
  }),
  smoothing: scrub("Smoothing", 0.3, { min: 0.05, max: 1, step: 0.05 }),
};

function Layer({
  badge,
  variant,
}: {
  badge: string;
  variant: "modern" | "legacy";
}) {
  return (
    <div className="relative h-full w-full">
      <MockDashboard variant={variant} />
      <span
        className={`absolute right-4 bottom-4 rounded-full px-3 py-1.5 text-[12px] font-medium ${
          variant === "modern"
            ? "bg-foreground text-background"
            : "bg-[#3a382f] font-mono text-[#ece9e2]"
        }`}
      >
        <T>{badge}</T>
      </span>
    </div>
  );
}

export function PeelEntry() {
  const controls = useDemoControls(CONTROLS);
  const { setValue } = controls;
  const [peeked, setPeeked] = useState(false);

  const { side, mode, ...values } = controls.values;

  return (
    <>
      <EntryPage>
        <MockSite
          heroMedia={
            <div
              className="absolute inset-0 touch-none"
              onPointerEnter={() => setPeeked(true)}
            >
              <Peel
                {...values}
                side={side}
                mode={mode}
                shineColor="auto"
                className="inset-0"
                style={{ position: "absolute" }}
                under={<Layer badge="bolt in 2019" variant="legacy" />}
              >
                <Layer badge="bolt today" variant="modern" />
              </Peel>
              <div
                aria-hidden
                className={`pointer-events-none absolute inset-x-0 bottom-4 flex justify-center transition-opacity duration-500 ${
                  peeked ? "opacity-0" : "opacity-100"
                }`}
              >
                <span className="flex animate-bounce items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-[13px] font-medium text-white shadow-lg backdrop-blur-sm">
                  <MousePointer2 aria-hidden className="size-3.5" />
                  <T>{mode === "hover"
                    ? "Hover the dashboard to peel back the redesign"
                    : "Move your cursor across to peel back the redesign"}</T>
                </span>
              </div>
            </div>
          }
        />
      </EntryPage>

      <DemoControls
        title="Peel controls"
        snippet={{
          component: "Peel",
          props: { ...values, side, mode, shineColor: "auto" },
        }}
        controls={controls}
        rows={{
          mode: (
            <RadioRow
              label="Mode"
              options={CONTROLS.mode.options}
              value={mode}
              onValueChange={(next) => {
                setValue("mode", next);
                setPeeked(false);
              }}
            />
          ),
        }}
      />
    </>
  );
}
