"use client";

import { useEffect, useRef, useState } from "react";

import {
  createGlassObject,
  type GlassObjectInstance,
  type GlassObjectOptions,
} from "./GlassObjectVanilla";

export interface GlassObjectProps extends GlassObjectOptions {
  className?: string;
  style?: React.CSSProperties;
}

export function GlassObject({
  className,
  style,
  ...options
}: GlassObjectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const instanceRef = useRef<GlassObjectInstance | null>(null);
  const [initialOptions] = useState(options);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    instanceRef.current = createGlassObject({ canvas }, initialOptions);
    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [initialOptions]);

  useEffect(() => {
    instanceRef.current?.setOptions(options);
  });

  return (
    <div className={className} style={{ position: "relative", ...style }}>
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          touchAction: "none",
        }}
      />
    </div>
  );
}

export type { GlassObjectInstance, GlassObjectOptions };

export default GlassObject;
