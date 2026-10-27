"use client";

import { useEffect, useRef } from "react";
import type { MotionController } from "@/lib/motion-core/motion-runtime";
import { interactionPreviewCss } from "./interaction-preview-player";

export type SitePreviewSlug = "glass-folder";
export const hasSiteNativePreview = (slug: string): slug is SitePreviewSlug => slug === "glass-folder";

/** The guided demo mounts the same native engine delivered in its source package. */
export function SiteNativePreview({ slug, height, onReady }: { slug: SitePreviewSlug; height: number; onReady: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false;
    let instance: MotionController | undefined;
    const timers = new Set<number>();
    const frames = new Set<number>();
    const later = (callback: () => void, delay: number) => {
      const id = window.setTimeout(() => { timers.delete(id); if (!disposed) callback(); }, delay);
      timers.add(id);
    };
    const frame = (callback: FrameRequestCallback) => {
      const id = requestAnimationFrame(time => { frames.delete(id); if (!disposed) callback(time); });
      frames.add(id);
    };
    import("@/lib/motion-core/site-previews/glass-folder.generated.js").then(({ mountGlassFolder }) => {
      if (disposed || !host.current) return;
      instance = mountGlassFolder(host.current, { height });
      const root = instance.root;
      const css = document.createElement("style");
      css.textContent = interactionPreviewCss(slug).replace(/\bhtml\b|\bbody\b/g, ".motion-body")
        // The tutorial scales a desktop scene even on a narrow parent page.
        + ".glass-folder-demo{grid-template-columns:repeat(3,minmax(0,1fr));padding:95px 45px 65px;gap:28px}.gf-demo-slot{padding-top:30px}";
      root.append(css);
      const click = (selector: string) => root.querySelector<HTMLElement>(selector)?.click();
      const replay = () => {
        click(".gf-root .gf-hit");
        later(() => click(".gf-root .gf-key--add"), 1100);
        later(() => click(".gf-root .gf-hit"), 2600);
        later(replay, 4800);
      };
      const painted = () => {
        if (root.querySelector("canvas.gf-art:not([data-ready])")) { frame(painted); return; }
        frame(() => frame(onReady));
        later(replay, 900);
      };
      frame(painted);
    }).catch(() => { /* Retain the poster when the native engine cannot start. */ });
    return () => {
      disposed = true;
      timers.forEach(clearTimeout);
      frames.forEach(cancelAnimationFrame);
      instance?.destroy();
    };
  }, [slug, height, onReady]);
  return <div ref={host} data-site-native-preview={slug} className="size-full" />;
}
