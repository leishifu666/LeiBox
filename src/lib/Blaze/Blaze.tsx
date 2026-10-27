"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  createBlaze,
  supportsHtmlInCanvas,
  type BlazeInstance,
  type BlazeOptions,
} from "./BlazeVanilla";

export interface BlazeProps extends BlazeOptions {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Release the dedicated GPU context when a disposable scene leaves the page. */
  releaseOnUnmount?: boolean;
  /** Optional density budget for large decorative scenes. */
  maxPixelRatio?: number;
}

const emptySubscribe = () => () => {};

export function Blaze({ children, className, style, releaseOnUnmount = false, maxPixelRatio = Infinity, ...options }: BlazeProps) {
  const sourceRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLCanvasElement>(null);
  const instanceRef = useRef<BlazeInstance | null>(null);
  const releaseTimer = useRef<number | undefined>(undefined);
  const [initialOptions] = useState(options);
  const [failed, setFailed] = useState(false);

  const supported = useSyncExternalStore(
    emptySubscribe,
    supportsHtmlInCanvas,
    () => false,
  );
  const native = supported && !failed;

  useEffect(() => {
    window.clearTimeout(releaseTimer.current);
    const source = sourceRef.current;
    const content = contentRef.current;
    const output = outputRef.current;
    if (!source || !content || !output) return;
    instanceRef.current = createBlaze(
      { source, content, output },
      initialOptions,
      maxPixelRatio,
    );
    if (native && !instanceRef.current) setFailed(true);
    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
      if (releaseOnUnmount) {
        // Strict Mode immediately sets this effect up again on the same canvas.
        // Defer context loss so that setup can cancel it and reuse that canvas.
        releaseTimer.current = window.setTimeout(() => {
          output.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext();
          output.width = output.height = source.width = source.height = 1;
        }, 0);
      }
    };
  }, [initialOptions, native, releaseOnUnmount, maxPixelRatio]);

  useEffect(() => {
    instanceRef.current?.setOptions(options);
  });

  return (
    <div className={className} style={{ position: "relative", ...style }}>
      <canvas
        ref={sourceRef}
        // @ts-expect-error experimental html-in-canvas attribute
        layoutsubtree="true"
        suppressHydrationWarning
        style={
          native
            ? { position: "absolute", inset: 0, width: "100%", height: "100%" }
            : { display: "none" }
        }
      >
        {native ? (
          <div
            ref={contentRef}
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              overflow: "auto",
            }}
          >
            {children}
          </div>
        ) : null}
      </canvas>
      {!native ? (
        <div
          ref={contentRef}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "auto",
          }}
        >
          {children}
        </div>
      ) : null}
      <canvas
        ref={outputRef}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

export type { BlazeInstance, BlazeOptions };

export default Blaze;
