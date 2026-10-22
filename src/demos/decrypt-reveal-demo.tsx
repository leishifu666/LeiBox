"use client";

import { T, useLanguage } from "@/components/common/language-provider";

import { Fingerprint, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { useLayoutEffect, useState } from "react";

import { color, scrub } from "@/components/demos/control-schema";
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
import { DecryptReveal } from "@/components/docs/live/DecryptReveal";

const CONTROLS = {
  radius: scrub("Radius", 400, { min: 60, max: 600, step: 10, decimals: 0 }),
  softness: scrub("Softness", 0.5, { min: 0.05, max: 1, step: 0.05 }),
  cell: scrub("Cell size", 10, { min: 6, max: 32, step: 1, decimals: 0 }),
  aspect: scrub("Cell aspect", 0.75, { min: 0.35, max: 1.25, step: 0.05 }),
  colored: scrub("Colored", 1, { min: 0, max: 1, step: 0.05 }),
  brightness: scrub("Brightness", 1, { min: 0.2, max: 3, step: 0.05 }),
  legibility: scrub("Legibility", 1, { min: 0, max: 1, step: 0.05 }),
  contrast: scrub("Contrast", 1, { min: 0.3, max: 3, step: 0.05 }),
  exposure: scrub("Exposure", 1, { min: 0.2, max: 3, step: 0.05 }),
  scramble: scrub("Scramble", 0.1, { min: 0, max: 1, step: 0.02 }),
  scrambleSpeed: scrub("Scramble speed", 6, {
    min: 0,
    max: 30,
    step: 0.5,
    decimals: 1,
  }),
  edgeWidth: scrub("Edge width", 0.2, { min: 0, max: 1, step: 0.02 }),
  edgeFlicker: scrub("Edge flicker", 1, { min: 0, max: 1, step: 0.02 }),
  edgeGlow: scrub("Edge glow", 2, { min: 0, max: 3, step: 0.05 }),
  edgeTint: scrub("Edge tint", 0.75, { min: 0, max: 1, step: 0.02 }),
  aberration: scrub("Aberration", 10, { min: 0, max: 24, step: 0.5 }),
  passthrough: scrub("Passthrough", 0.15, { min: 0, max: 1, step: 0.02 }),
  threshold: scrub("Threshold", 0.025, { min: 0.005, max: 0.3, step: 0.005 }),
  smoothing: scrub("Smoothing", 0.2, { min: 0, max: 1, step: 0.05 }),
  color: color("Cipher color", "#4ade80"),
};

function DossierScene() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background px-4 py-6 sm:px-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/40">
              <Lock aria-hidden className="size-5 text-emerald-500" />
            </span>
            <div className="min-w-0">
              <CardTitle><T>Classified dossier</T></CardTitle>
              <CardDescription className="mt-0.5">
                <T>Clearance level 5 - eyes only</T>
              </CardDescription>
            </div>
            <span className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              <span
                aria-hidden
                className="size-1.5 rounded-full bg-emerald-500"
              />
              <T>Encrypted</T>
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/60 p-3">
              <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                <Fingerprint aria-hidden className="size-3.5" />
                <T>Subject</T>
              </div>
              <p className="mt-1.5 text-sm font-semibold"><T>Agent Nightfall</T></p>
              <p className="text-xs text-muted-foreground"><T>ID 7729-BRAVO</T></p>
            </div>
            <div className="rounded-lg border border-border/60 p-3">
              <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                <KeyRound aria-hidden className="size-3.5" />
                <T>Cipher</T>
              </div>
              <p className="mt-1.5 text-sm font-semibold"><T>AES-256-GCM</T></p>
              <p className="text-xs text-muted-foreground"><T>Rotated 6h ago</T></p>
            </div>
          </div>
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              <T>Last transmission</T>
            </p>
            <p className="mt-1.5 text-sm leading-relaxed">
              <T>Package secured at the drop point. Extraction window opens at 02:00 local. Awaiting confirmation on the second key holder.</T>
            </p>
          </div>
          <Button className="w-full">
            <ShieldCheck aria-hidden className="size-3.5" />
            <T>Grant clearance</T>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function DecryptRevealDemo() {
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
        <DecryptReveal
          {...values}
          background={pageBg}
          className="inset-0"
          style={{ position: "absolute" }}
        >
          <DossierScene />
        </DecryptReveal>
      </div>
      <p className="mt-2 text-[13px] text-muted-foreground">
        <T>Move your cursor over the cipher to decrypt the UI.</T>
      </p>

      <DemoControls
        title={t("Decrypt Reveal controls")}
        snippet={{ component: "DecryptReveal", props: { ...values } }}
        controls={controls}
        portal
      />
    </section>
  );
}
