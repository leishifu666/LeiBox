"use client";

import { T as TranslatedText, useLanguage } from "@/components/common/language-provider";


import { motion, useReducedMotion } from "motion/react";
import { useCallback, useRef, useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

export interface ScrubberProps {
  className?: string;
  /** Number of decimal places to display. */
  decimals?: number;
  defaultValue?: number;
  /** Label displayed on the left side of the track. */
  label?: string;
  max?: number;
  min?: number;
  onValueChange?: (value: number) => void;
  step?: number;
  /** Number of tick marks (0 to hide). */
  ticks?: number;
  value?: number;
}

const clamp = (val: number, min: number, max: number) =>
  Math.min(Math.max(val, min), max);

const roundToStep = (val: number, step: number, min: number) =>
  Math.round((val - min) / step) * step + min;

const HOVER_QUERY = "(hover: hover) and (pointer: fine)";

function subscribeHover(callback: () => void) {
  const mq = window.matchMedia(HOVER_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

const getIsHoverDevice = () => window.matchMedia(HOVER_QUERY).matches;

export function Scrubber({
  label = "Value",
  value: controlledValue,
  defaultValue = 0,
  onValueChange,
  min = 0,
  max = 1,
  step = 0.01,
  decimals = 2,
  ticks = 0,
  className,
}: ScrubberProps) {
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const isHoverDevice = useSyncExternalStore(
    subscribeHover,
    getIsHoverDevice,
    () => false,
  );

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;
  const range = max - min;
  const percentage = range > 0 ? ((value - min) / range) * 100 : 0;
  const isActive = isDragging || (isHoverDevice && isHovering);

  const setValue = useCallback(
    (newValue: number) => {
      const clamped = clamp(roundToStep(newValue, step, min), min, max);
      if (!isControlled) {
        setInternalValue(clamped);
      }
      onValueChange?.(clamped);
    },
    [step, min, max, isControlled, onValueChange],
  );

  const getValueFromPointer = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) {
        return value;
      }
      const rect = track.getBoundingClientRect();
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      return min + ratio * range;
    },
    [min, range, value],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      try {
        trackRef.current?.setPointerCapture(e.pointerId);
      } catch {}
      setIsDragging(true);
      setValue(getValueFromPointer(e.clientX));
    },
    [getValueFromPointer, setValue],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) {
        return;
      }
      if (e.pointerType === "mouse" && e.buttons === 0) {
        setIsDragging(false);
        return;
      }
      setValue(getValueFromPointer(e.clientX));
    },
    [isDragging, getValueFromPointer, setValue],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let next: number | undefined;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowUp":
          next = value + step;
          break;
        case "ArrowLeft":
        case "ArrowDown":
          next = value - step;
          break;
        case "Home":
          next = min;
          break;
        case "End":
          next = max;
          break;
        default:
          return;
      }
      e.preventDefault();
      setValue(next);
    },
    [value, step, min, max, setValue],
  );

  const springConfig = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, duration: 0.25, bounce: 0.1 };

  return (
    <div className={cn("relative w-full select-none", className)}>
      <div
        aria-label={t(label)}
        aria-valuemax={max}
        aria-valuemin={min}
        aria-valuenow={Number(value.toFixed(decimals))}
        className="relative h-8 cursor-pointer overflow-hidden rounded-lg bg-muted/60 outline-offset-2 hover:bg-muted/80 focus-visible:outline-2 focus-visible:outline-ring"
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onLostPointerCapture={handlePointerUp}
        ref={trackRef}
        role="slider"
        style={{ touchAction: "none" }}
        tabIndex={0}
      >
        <div
          className="pointer-events-none absolute inset-y-0 left-0 rounded-lg bg-foreground/10"
          style={{
            width: `${percentage}%`,
            transition: isDragging
              ? "none"
              : "width 150ms cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        />

        {ticks > 0 && (
          <div className="pointer-events-none absolute inset-0">
            {Array.from({ length: ticks }, (_, i) => {
              const pos = ((i + 1) / (ticks + 1)) * 100;
              return (
                <div
                  className="absolute top-1/2 h-1.5 w-px -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/20"
                  key={pos}
                  style={{ left: `${pos}%` }}
                />
              );
            })}
          </div>
        )}

        <div
          className="pointer-events-none absolute z-3 -ml-[5px]"
          style={{
            top: "50%",
            left: `${percentage}%`,
            transform: "translateX(-50%) translateY(-50%)",
            transition: isDragging
              ? "none"
              : "left 150ms cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        >
          <motion.div
            animate={{
              opacity: isActive ? 0.8 : 0.2,
              scaleX: isActive ? 1 : 0.7,
              scaleY: isActive ? 1 : 0.7,
            }}
            className="h-4 w-1 rounded-full bg-foreground/90"
            transition={springConfig}
          />
        </div>

        <div className="pointer-events-none absolute top-1/2 left-3 z-4 -translate-y-1/2 text-[12.5px] font-medium whitespace-nowrap text-foreground/90">
          <TranslatedText>{label}</TranslatedText>
        </div>

        <div
          className="pointer-events-none absolute top-1/2 right-3 z-4 -translate-y-1/2 text-[12.5px] font-medium text-muted-foreground"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {value.toFixed(decimals)}
        </div>
      </div>
    </div>
  );
}
