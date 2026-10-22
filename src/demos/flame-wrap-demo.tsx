"use client";

import { T, useLanguage } from "@/components/common/language-provider";

import { useState } from "react";

import { motion } from "motion/react";

import { color, scrub } from "@/components/demos/control-schema";
import { DemoControls } from "@/components/demos/demo-controls";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { FlameWrap } from "@/components/docs/live/FlameWrap";
import { cn } from "@/lib/utils";

export const FLAME_WRAP_CONTROLS = {
  flame: color("Color", "#4e89ff"),
  intensity: scrub("Intensity", 0.5, { min: 0, max: 3, step: 0.05 }),
  height: scrub("Flame height", 170, {
    min: 40,
    max: 200,
    step: 2,
    decimals: 0,
  }),
  spread: scrub("Glow spread", 8, { min: 8, max: 96, step: 1, decimals: 0 }),
  radius: scrub("Corner radius", 40, { min: 0, max: 48, step: 1, decimals: 0 }),
  speed: scrub("Speed", 0.25, { min: 0, max: 3, step: 0.05 }),
  scale: scrub("Detail", 0.75, { min: 0.05, max: 1, step: 0.01 }),
  turbulence: scrub("Turbulence", 0.5, { min: 0, max: 1, step: 0.01 }),
  turbulenceScale: scrub("Turbulence scale", 0.5, {
    min: 0.2,
    max: 3,
    step: 0.05,
  }),
  turbulenceReach: scrub("Turbulence reach", 25, {
    min: 4,
    max: 80,
    step: 1,
    decimals: 0,
  }),
  sparks: scrub("Sparks", 1.5, { min: 0, max: 3, step: 0.05 }),
  sparkSize: scrub("Spark size", 0.35, { min: 0.2, max: 2.5, step: 0.05 }),
  sparkDensity: scrub("Spark density", 1, { min: 0.3, max: 2.5, step: 0.05 }),
  sparkSpeed: scrub("Spark speed", 1, { min: 0.1, max: 3, step: 0.05 }),
  rim: scrub("Molten rim", 2.5, { min: 0, max: 3, step: 0.05 }),
  melt: scrub("Edge melt", 4.5, { min: 0, max: 24, step: 0.5, decimals: 1 }),
  distortion: scrub("Heat shimmer", 10, {
    min: 0,
    max: 16,
    step: 0.5,
    decimals: 1,
  }),
  smoke: scrub("Smoke", 1.5, { min: 0, max: 2, step: 0.05 }),
  ember: scrub("Ember glow", 2, { min: 0, max: 2, step: 0.05 }),
  scorch: scrub("Scorch", 0, { min: 0, max: 2, step: 0.05 }),
};

export function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

const STATS: [string, string][] = [
  ["1,204", "Followers"],
  ["342", "Following"],
  ["86", "Projects"],
];

export function FlameProfileCard({ radius }: { radius: number }) {
  const { locale } = useLanguage();
  return (
    <div
      className="flex h-full w-full flex-col border border-border/60 bg-card px-8 pt-10 pb-7 text-center shadow-sm"
      style={{ borderRadius: radius }}
    >
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted text-[15px] font-semibold tracking-tight text-foreground">
        <T>EB</T>
      </div>
      <p className="mt-3 text-[16px] font-semibold tracking-tight text-card-foreground">
        <T>Ember Blackwood</T>
      </p>
      <p className="mt-0.5 text-[12.5px] text-muted-foreground"><T>@emberburns</T></p>
      <p className="mx-auto mt-3 max-w-[220px] text-[12.5px] leading-relaxed text-muted-foreground">
        <T>Pyrotechnics engineer. Building things that burn bright.</T>
      </p>
      <div className="mt-auto border-t border-border/60 pt-4">
        <div className="flex items-center justify-center gap-8">
          {STATS.map(([value, label]) => (
            <div key={label} className="flex flex-col">
              <span className="text-[14px] font-semibold tracking-tight text-card-foreground tabular-nums">
                {value}
              </span>
              <span className="mt-0.5 text-[11px] text-muted-foreground">
                <T>{label}</T>
              </span>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-4 w-full cursor-pointer rounded-full bg-foreground py-2 text-[12.5px] font-semibold text-background transition-opacity hover:opacity-90"
        >
          {locale === "zh" ? "关注" : "Follow"}
        </button>
      </div>
    </div>
  );
}

function FlameNotificationCard({ radius }: { radius: number }) {
  return (
    <div
      className="flex h-full w-full items-center border border-border/60 bg-card px-7 py-6 shadow-sm"
      style={{ borderRadius: radius }}
    >
      <div className="flex w-full items-center gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-[15px] font-semibold tracking-tight text-foreground">
          <T>EB</T>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[13.5px] font-semibold tracking-tight text-card-foreground">
              <T>Trending now</T>
            </p>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              <T>2m ago</T>
            </span>
          </div>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
            <T>Your launch post is blowing up. 2,431 likes in the last hour.</T>
          </p>
        </div>
      </div>
    </div>
  );
}

function FlameStreakCard({ radius }: { radius: number }) {
  return (
    <div
      className="flex h-full w-full flex-col border border-border/60 bg-card px-8 pt-8 pb-7 shadow-sm"
      style={{ borderRadius: radius }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-muted-foreground">
          <T>Streak</T>
        </span>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10.5px] font-semibold text-foreground">
          <T>Live</T>
        </span>
      </div>
      <div className="mt-auto">
        <p className="text-[44px] leading-none font-semibold tracking-tight text-card-foreground tabular-nums">
          47
        </p>
        <p className="mt-1.5 text-[12.5px] text-muted-foreground">
          <T>days in a row</T>
        </p>
      </div>
      <div className="mt-5 border-t border-border/60 pt-3.5">
        <p className="text-[11.5px] text-muted-foreground">
          <T>Personal best · 52 days</T>
        </p>
      </div>
    </div>
  );
}

const EXAMPLES = [
  { id: "profile", label: "Profile" },
  { id: "notification", label: "Notification" },
  { id: "streak", label: "Streak" },
] as const;

type ExampleId = (typeof EXAMPLES)[number]["id"];

const EXAMPLE_LAYOUT: Record<ExampleId, { className: string; height: number }> =
  {
    profile: { className: "w-[300px] sm:w-[320px]", height: 336 },
    notification: { className: "w-[320px] sm:w-[360px]", height: 128 },
    streak: { className: "w-[250px]", height: 236 },
  };

export function FlameWrapDemo() {
  const { t } = useLanguage();
  const controls = useDemoControls(FLAME_WRAP_CONTROLS);
  const [example, setExample] = useState<ExampleId>("profile");
  const { flame, ...values } = controls.values;
  const rgb = hexToRgb(flame);
  const layout = EXAMPLE_LAYOUT[example];

  return (
    <>
      <div className="relative flex h-[560px] items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-background">
        <FlameWrap
          {...values}
          color={rgb}
          className={layout.className}
          style={{
            height: layout.height,
            marginTop: Math.round(values.height / 2),
          }}
        >
          {example === "profile" ? (
            <FlameProfileCard radius={values.radius} />
          ) : example === "notification" ? (
            <FlameNotificationCard radius={values.radius} />
          ) : (
            <FlameStreakCard radius={values.radius} />
          )}
        </FlameWrap>
      </div>

      <div className="mt-3 flex justify-center">
        <Tabs
          value={example}
          onValueChange={(value) => setExample(value as ExampleId)}
        >
          <TabsList
            aria-label={t("Example content")}
            className="rounded-full border border-border/60 bg-card p-1 group-data-horizontal/tabs:h-auto"
          >
            {EXAMPLES.map((item) => (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="h-auto flex-none cursor-pointer rounded-full border-0 px-4 py-1.5 text-[12px] font-medium after:hidden data-active:bg-transparent data-active:shadow-none dark:data-active:bg-transparent"
              >
                {example === item.id ? (
                  <motion.span
                    layoutId="flame-example-pill"
                    className="absolute inset-0 rounded-full bg-foreground"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                ) : null}
                <span
                  className={cn(
                    "relative z-10 transition-colors duration-200",
                    example === item.id
                      ? "text-background"
                      : "text-muted-foreground",
                  )}
                >
                  <T>{item.label}</T>
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <DemoControls
        title={t("Flame Wrap controls")}
        portal
        snippet={{
          component: "FlameWrap",
          props: { ...values, color: rgb },
        }}
        controls={controls}
      />
    </>
  );
}
