"use client";

import { useEffect, useRef, useState } from "react";

import {
  createParticleObject,
  type ParticleObjectInstance,
  type ParticleObjectOptions,
} from "./ParticleObjectVanilla";

export interface ParticleObjectProps extends ParticleObjectOptions {
  className?: string;
  style?: React.CSSProperties;
}

export function ParticleObject({
  className,
  style,
  ...options
}: ParticleObjectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const instanceRef = useRef<ParticleObjectInstance | null>(null);
  const [initialOptions] = useState(options);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    instanceRef.current = createParticleObject({ canvas }, initialOptions);
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

export type { ParticleObjectInstance, ParticleObjectOptions };

export default ParticleObject;
