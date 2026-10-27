"use client";

import { useEffect, useRef } from "react";

export function SoftArrow() {
  const host = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!host.current || !canvas.current) return;
    const element = host.current;
    const surface = canvas.current;
    const abort = new AbortController();
    let destroy: (() => void) | undefined;

    import("./soft-arrow-scene").then(async ({ createSoftArrow }) => {
      if (abort.signal.aborted) return;
      destroy = await createSoftArrow(element, surface, abort.signal);
      if (abort.signal.aborted) destroy?.();
    }).catch(() => {
      // The transparent Blender render remains visible if WebGL cannot start.
      element.dataset.render = "poster";
    });

    return () => { abort.abort(); destroy?.(); };
  }, []);

  return (
    <span ref={host} aria-hidden="true" data-soft-arrow data-render="poster" className="relative -mr-1 block size-8 shrink-0 pointer-events-none [&[data-render=live]>img]:invisible">
      {/* Both fallbacks come from the same Blender mesh, with real alpha. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/landing/soft-arrow/silver.png" alt="" width="32" height="32" className="absolute inset-0 size-full dark:hidden" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/landing/soft-arrow/black.png" alt="" width="32" height="32" className="absolute inset-0 hidden size-full dark:block" />
      <canvas ref={canvas} className="absolute inset-0 size-full" />
    </span>
  );
}
