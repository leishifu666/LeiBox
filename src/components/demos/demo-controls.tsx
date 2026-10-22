"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Check,
  Link as LinkIcon,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { play } from "cuelume";
import {
  createContext,
  Fragment,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { T, useLanguage } from "@/components/common/language-provider";

import type { ControlSchema } from "@/components/demos/control-schema";
import { ColorRow } from "@/components/demos/color-picker";
import {
  publishDemoSnippet,
  type DemoSnippet,
} from "@/components/demos/snippet-store";
import { Scrubber } from "@/components/docs/scrubber";
import type { DemoControlsHandle } from "@/hooks/use-demo-controls";

export { ColorRow };

const EASE = [0.23, 1, 0.32, 1] as const;

const emptySubscribe = () => () => {};

export function useDemoScrollbarGutter() {
  const [contentEl, setContentEl] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const el = contentEl;
    if (!el) return;
    const root = document.documentElement;
    const update = () => {
      if (!el.isConnected) return;
      const gutter = Math.max(
        0,
        Math.round(root.clientWidth - el.getBoundingClientRect().width),
      );
      root.style.setProperty("--demo-sbw", `${gutter}px`);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      root.style.removeProperty("--demo-sbw");
    };
  }, [contentEl]);

  useEffect(() => {
    const el = contentEl;
    if (!el) return;
    const canvas = [
      ...document.querySelectorAll<HTMLCanvasElement>("canvas[layoutsubtree]"),
    ].find((node) => node.contains(el));
    const scroller = canvas?.firstElementChild;
    if (!(scroller instanceof HTMLElement)) return;

    const prevScrollbarWidth = scroller.style.scrollbarWidth;
    scroller.style.scrollbarWidth = "none";

    const thumb = document.createElement("div");
    thumb.setAttribute("aria-hidden", "true");
    thumb.className = "demo-overlay-thumb";
    document.body.appendChild(thumb);

    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const layout = () => {
      const max = scroller.scrollHeight - scroller.clientHeight;
      if (max <= 1) {
        thumb.style.opacity = "0";
        return false;
      }
      const trackTop = 8;
      const trackHeight = window.innerHeight - 16;
      const height = Math.max(
        36,
        (scroller.clientHeight / scroller.scrollHeight) * trackHeight,
      );
      const top =
        trackTop + (scroller.scrollTop / max) * (trackHeight - height);
      thumb.style.height = `${height}px`;
      thumb.style.transform = `translateY(${top}px)`;
      return true;
    };

    const show = () => {
      if (!layout()) return;
      thumb.style.opacity = "1";
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        thumb.style.opacity = "0";
      }, 1000);
    };

    show();
    scroller.addEventListener("scroll", show, { passive: true });
    window.addEventListener("resize", show);
    const observer = new ResizeObserver(() => layout());
    observer.observe(el);
    observer.observe(scroller);

    return () => {
      scroller.removeEventListener("scroll", show);
      window.removeEventListener("resize", show);
      observer.disconnect();
      if (hideTimer) clearTimeout(hideTimer);
      thumb.remove();
      scroller.style.scrollbarWidth = prevScrollbarWidth;
    };
  }, [contentEl]);

  return setContentEl;
}

function ScrollFade({ children }: { children: ReactNode }) {
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = scrollEl;
    if (!el) return;
    const update = () => {
      const top = el.scrollTop > 4;
      const bottom = el.scrollHeight - el.clientHeight - el.scrollTop > 4;
      el.style.setProperty("--fade-top", top ? "1" : "0");
      el.style.setProperty("--fade-bottom", bottom ? "1" : "0");
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [scrollEl]);

  return (
    <div
      ref={setScrollEl}
      className="demo-controls-scroll flex max-h-[min(60vh,480px)] flex-col gap-1.5 overflow-y-auto"
    >
      {children}
    </div>
  );
}

export const DemoControlsTargetContext = createContext<HTMLElement | null>(
  null,
);

function ShareLinkButton() {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const copy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    // play() fires an audible sound, so it's worth skipping once this
    // button is gone -- unlike the setState calls below, a sound with no
    // visible source is actually perceivable after unmount.
    if (!mountedRef.current) return;
    play("bloom");
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={t("Copy link to this configuration")}
      title={t("Copy a link to this exact configuration")}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {copied ? (
        <Check aria-hidden className="size-3" />
      ) : (
        <LinkIcon aria-hidden className="size-3" />
      )}
      <T>{copied ? "Copied" : "Share"}</T>
    </button>
  );
}

export interface DemoControlsProps<S extends ControlSchema> {
  /** Panel heading, e.g. "Peel controls". */
  title: string;
  /** Schema-backed control state from `useDemoControls`. */
  controls: DemoControlsHandle<S>;
  /**
   * Replace the generated row for specific schema keys with bespoke UI,
   * rendered at the key's schema position (e.g. a model loader for a
   * `custom` control, or a color row with a theme-derived swatch).
   */
  rows?: Partial<Record<keyof S & string, ReactNode>>;
  /** Extra cleanup after the URL state resets (ephemeral local state). */
  onReset?: () => void;
  /**
   * Portal the widget to document.body. Use for boxed demos inside docs
   * pages, where an animated ancestor transform would otherwise become the
   * containing block for fixed positioning.
   */
  portal?: boolean;
  /**
   * Current component configuration, published to the playground sidebar
   * so its copy actions can emit the component exactly as configured.
   */
  snippet?: DemoSnippet;
}

function SchemaRows<S extends ControlSchema>({
  controls,
  rows,
}: {
  controls: DemoControlsHandle<S>;
  rows?: Partial<Record<keyof S & string, ReactNode>>;
}) {
  const set = controls.setValue as (key: string, value: unknown) => void;
  const values = controls.values as Record<string, string | number | boolean>;

  return (
    <>
      {Object.entries(controls.schema).map(([key, def]) => {
        if (def.when && !def.when(values)) return null;

        const override = rows?.[key as keyof S & string];
        if (override !== undefined) {
          return <Fragment key={key}>{override}</Fragment>;
        }

        switch (def.kind) {
          case "scrub":
            return (
              <Scrubber
                key={key}
                label={def.label}
                min={def.min}
                max={def.max}
                step={def.step}
                decimals={def.decimals}
                value={values[key] as number}
                onValueChange={(next) => set(key, next)}
              />
            );
          case "toggle":
            return (
              <SwitchRow
                key={key}
                label={def.label}
                checked={values[key] as boolean}
                onCheckedChange={(next) => set(key, next)}
              />
            );
          case "radio":
            return (
              <RadioRow
                key={key}
                label={def.label}
                options={def.options}
                value={values[key] as string}
                onValueChange={(next) => set(key, next)}
              />
            );
          case "color": {
            const value = values[key] as string;
            const auto = def.auto !== undefined && value === def.defaultValue;
            return (
              <ColorRow
                key={key}
                label={def.label}
                value={auto && def.auto ? def.auto.swatch : value}
                displayValue={auto && def.auto ? def.auto.label : undefined}
                onValueChange={(next) => set(key, next)}
                onReset={
                  value !== def.defaultValue
                    ? () => set(key, def.defaultValue)
                    : undefined
                }
              />
            );
          }
          case "custom":
            return null;
        }
      })}
    </>
  );
}

export function DemoControls<S extends ControlSchema>({
  title,
  controls,
  rows,
  onReset,
  portal = false,
  snippet,
}: DemoControlsProps<S>) {
  const shouldReduceMotion = useReducedMotion();
  const inlineTarget = useContext(DemoControlsTargetContext);
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const { isDefault } = controls;
  const handleReset = () => {
    controls.reset();
    onReset?.();
  };

  useEffect(() => {
    if (!snippet) return;
    publishDemoSnippet(snippet);
  }, [snippet]);

  useEffect(() => () => publishDemoSnippet(null), []);

  if (inlineTarget) {
    return createPortal(
      <div className="flex flex-col">
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[12px] font-medium text-muted-foreground/70">
            <T>Controls</T>
          </p>
          <button
            type="button"
            onClick={handleReset}
            disabled={isDefault}
            className="inline-flex cursor-pointer items-center gap-1 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <RotateCcw aria-hidden className="size-3" />
            <T>Reset</T>
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          <SchemaRows controls={controls} rows={rows} />
        </div>
      </div>,
      inlineTarget,
    );
  }

  if (portal && !mounted) return null;

  const widget = (
    <div className="fixed right-[calc(1rem+var(--demo-sbw,0px))] bottom-4 z-40 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 8, scale: 0.98 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 8, scale: 0.98 }
            }
            transition={{ duration: open ? 0.3 : 0.15, ease: EASE }}
            className="w-72 rounded-2xl border border-border/60 bg-background/85 p-3 shadow-xl shadow-black/5 backdrop-blur-xl backdrop-saturate-150"
          >
                <div className="mb-2 flex items-center justify-between pl-1">
              <p className="text-[13px] font-semibold tracking-[-0.01em]">
                <T>{title}</T>
              </p>
              <div className="flex items-center">
                <ShareLinkButton />
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isDefault}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                >
                  <RotateCcw aria-hidden className="size-3" />
                  <T>Reset</T>
                </button>
              </div>
            </div>
            <ScrollFade>
              <SchemaRows controls={controls} rows={rows} />
            </ScrollFade>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border/60 bg-background/70 px-4 py-2.5 text-[13px] font-medium backdrop-blur-xl backdrop-saturate-150 transition-colors hover:bg-muted/70"
      >
        {open ? (
          <X aria-hidden className="size-3.5" />
        ) : (
          <SlidersHorizontal aria-hidden className="size-3.5" />
        )}
        <T>Controls</T>
      </button>
    </div>
  );

  return portal ? createPortal(widget, document.body) : widget;
}

export function SwitchRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className="flex h-8 w-full shrink-0 cursor-pointer items-center justify-between rounded-lg bg-muted/60 px-3 transition-[background-color,opacity] hover:bg-muted/80"
    >
      <span className="text-[12.5px] font-medium text-foreground/90">
        <T>{label}</T>
      </span>
      <span
        className={`relative h-4.5 w-8 rounded-full transition-colors ${
          checked ? "bg-foreground" : "bg-border"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-3.5 rounded-full bg-background transition-transform ${
            checked ? "translate-x-3.5" : ""
          }`}
        />
      </span>
    </button>
  );
}

export function RadioRow<V extends string>({
  label,
  options,
  value,
  onValueChange,
}: {
  label: string;
  options: readonly { value: V; label: string }[];
  value: V;
  onValueChange: (value: V) => void;
}) {
  const { t } = useLanguage();
  return (
    <div
      role="radiogroup"
      aria-label={t(label)}
      className="flex h-8 w-full shrink-0 items-center gap-1 rounded-lg bg-muted/60 p-1"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onValueChange(option.value)}
          className={`h-6 flex-1 cursor-pointer rounded-md text-[12px] font-medium transition-colors ${
            value === option.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <T>{option.label}</T>
        </button>
      ))}
    </div>
  );
}
