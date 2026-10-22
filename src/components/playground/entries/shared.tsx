"use client";

import { T } from "@/components/common/language-provider";
import type { ReactNode } from "react";

export type EntryStatus = "loading" | "ready" | "error";

export const HERO_BLEED_CLASS = "absolute -inset-x-[25%] -inset-y-[70%] z-10";
export const HERO_BLEED_SCALE = 0.55;

export function EntryPage({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-svh overflow-x-clip px-5 pt-24 pb-10 sm:px-8 lg:pt-16 lg:pr-8 lg:pl-72">
      <div className="page-enter">{children}</div>
    </main>
  );
}

export function StatusPill({ status }: { status: EntryStatus }) {
  if (status === "ready") return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center">
      <span className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-[12px] font-medium text-muted-foreground backdrop-blur-sm">
        <T>{status === "loading" ? "Loading asset…" : "Could not load the asset."}</T>
      </span>
    </div>
  );
}
