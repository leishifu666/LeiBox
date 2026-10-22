"use client";

import { T, useLanguage } from "@/components/common/language-provider";

import { Send } from "lucide-react";
import { useLayoutEffect, useState } from "react";

import { scrub } from "@/components/demos/control-schema";
import { DemoControls } from "@/components/demos/demo-controls";
import { useDemoControls } from "@/hooks/use-demo-controls";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ParticleReveal } from "@/components/docs/live/ParticleReveal";

const CONTROLS = {
  radius: scrub("Radius", 500, { min: 60, max: 600, step: 10, decimals: 0 }),
  softness: scrub("Softness", 0.75, { min: 0.05, max: 1, step: 0.05 }),
  size: scrub("Size", 1, { min: 0.5, max: 3, step: 0.25 }),
  scatter: scrub("Scatter", 25, { min: 0, max: 200, step: 5, decimals: 0 }),
  drift: scrub("Drift", 1, { min: 0, max: 2, step: 0.1, decimals: 1 }),
  aberration: scrub("Aberration", 40, {
    min: 0,
    max: 80,
    step: 2,
    decimals: 0,
  }),
  bend: scrub("Bend", 50, { min: 0, max: 240, step: 10, decimals: 0 }),
  fade: scrub("Fade", 0.85, { min: 0, max: 1, step: 0.05 }),
  threshold: scrub("Threshold", 0.1, { min: 0, max: 0.3, step: 0.01 }),
  smoothing: scrub("Smoothing", 0.25, { min: 0, max: 1, step: 0.05 }),
};

const AVATAR_URL =
  "https://pbs.twimg.com/profile_images/2077672716639862784/KpSO9Y3A_400x400.jpg";

function ContactScene() {
  const { t } = useLanguage();
  return (
    <div className="flex h-full w-full items-center justify-center bg-background px-4 py-6 sm:px-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={AVATAR_URL}
              crossOrigin="anonymous"
              alt={t("David's profile picture")}
              className="size-11 shrink-0 rounded-full border border-border/60 object-cover"
            />
            <div className="min-w-0">
              <CardTitle><T>Contact David</T></CardTitle>
              <CardDescription className="mt-0.5">
                <T>Typically replies within a day</T>
              </CardDescription>
            </div>
            <span className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              <span
                aria-hidden
                className="size-1.5 rounded-full bg-emerald-500"
              />
              <T>Online</T>
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pr-name"><T>Name</T></Label>
              <Input id="pr-name" placeholder={t("Ada Lovelace")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pr-email"><T>Email</T></Label>
              <Input id="pr-email" placeholder="ada@example.com" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pr-message"><T>Message</T></Label>
            <Textarea
              id="pr-message"
              placeholder={t("Hey David, I have an idea for a new canvas component...")}
              className="min-h-24 resize-none"
            />
          </div>
          <Button className="w-full">
            <Send aria-hidden className="size-3.5" />
            <T>Send message</T>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function ParticleRevealDemo() {
  const { t } = useLanguage();
  const controls = useDemoControls(CONTROLS);
  const values = controls.values;
  const [pageBg, setPageBg] = useState("#000000");

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
    <section className="mt-8" aria-label={t("Demo")}>
      <div className="relative h-130 touch-none overflow-hidden rounded-xl border border-border/60 bg-background">
        <ParticleReveal
          {...values}
          background={pageBg}
          className="inset-0"
          style={{ position: "absolute" }}
        >
          <ContactScene />
        </ParticleReveal>
      </div>
      <p className="mt-2 text-[13px] text-muted-foreground">
        <T>Move your cursor over the scene to reveal the UI.</T>
      </p>

      <DemoControls
        title={t("Particle Reveal controls")}
        snippet={{ component: "ParticleReveal", props: { ...values } }}
        controls={controls}
        portal
      />
    </section>
  );
}
