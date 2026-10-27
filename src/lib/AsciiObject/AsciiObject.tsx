"use client";

import { useEffect, useRef, useState } from "react";

import {
  createAsciiObject,
  type AsciiObjectInstance,
  type AsciiObjectOptions,
} from "./AsciiObjectVanilla";

export interface AsciiObjectProps extends AsciiObjectOptions {
  className?: string;
  style?: React.CSSProperties;
}

export function AsciiObject({
  className,
  style,
  ...options
}: AsciiObjectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const instanceRef = useRef<AsciiObjectInstance | null>(null);
  const [initialOptions] = useState(options);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    instanceRef.current = createAsciiObject({ canvas }, initialOptions);
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

export type { AsciiObjectInstance, AsciiObjectOptions };

export default AsciiObject;
