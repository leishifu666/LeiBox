"use client";

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { useLiveRenderer } from "@/components/docs/live-renderer";
import type { ParticleRevealOptions, ParticleRevealInstance } from "@/lib/ParticleReveal/ParticleRevealVanilla";

/** Each renderer stays in its own chunk; the fallback video imports neither. */
export function HeroParticleLayer({ children, style, ...options }: ParticleRevealOptions & { children: ReactNode; style?: CSSProperties }) {
  const renderer = useLiveRenderer();
  const source = useRef<HTMLCanvasElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const output = useRef<HTMLCanvasElement>(null);
  const [initial] = useState(options);
  const [failedRenderer, setFailedRenderer] = useState<string>();
  const failed = failedRenderer === renderer;
  useEffect(() => {
    let cancelled = false;
    let instance: ParticleRevealInstance | null = null;
    const load = renderer === "webgpu"
      ? import("@/lib/ParticleReveal/ParticleRevealWebGPU")
      : import("@/lib/ParticleReveal/ParticleRevealVanilla");
    load.then(engine => {
      if (cancelled || !source.current || !content.current || !output.current) return;
      instance = engine.createParticleReveal({ source: source.current, content: content.current, output: output.current }, initial);
      if (!instance) setFailedRenderer(renderer);
    }).catch(() => { if (!cancelled) setFailedRenderer(renderer); });
    return () => { cancelled = true; instance?.destroy(); };
  }, [renderer, initial]);
  return <div style={{ position: "relative", ...style }}>
    <canvas ref={source}
      // @ts-expect-error experimental html-in-canvas attribute
      layoutsubtree="true" suppressHydrationWarning
      style={failed ? { display: "none" } : { position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      {!failed ? <div ref={content} style={{ position: "relative", width: "100%", height: "100%", overflow: "auto" }}>{children}</div> : null}
    </canvas>
    {failed ? <div ref={content} style={{ position: "relative", width: "100%", height: "100%", overflow: "auto" }}>{children}</div> : null}
    <canvas ref={output} aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
  </div>;
}
