/** @jsxImportSource preact */

import { useEffect, useRef, useState } from "preact/hooks";
import type { JSX } from "preact";

import {
  createLiquidObject,
  type LiquidObjectInstance,
  type LiquidObjectOptions,
} from "./LiquidObjectVanilla";

export interface LiquidObjectProps extends LiquidObjectOptions {
  className?: string;
  style?: JSX.CSSProperties;
}

export function LiquidObject({
  className,
  style,
  ...options
}: LiquidObjectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const instanceRef = useRef<LiquidObjectInstance | null>(null);
  const [initialOptions] = useState(options);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    instanceRef.current = createLiquidObject({ canvas }, initialOptions);
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

export type { LiquidObjectInstance, LiquidObjectOptions };

export default LiquidObject;
