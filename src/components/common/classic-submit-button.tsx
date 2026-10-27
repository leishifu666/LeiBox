"use client";

import { gsap } from "gsap";
import { Check, CircleAlert } from "lucide-react";
import { useLayoutEffect, useRef, useSyncExternalStore, type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";
import styles from "./classic-submit-button.module.css";

export type SubmissionButtonState = "idle" | "checking" | "loading" | "success" | "error" | "invalid" | "unavailable";

/** Gemini's selected 01 motion, shared by the comparison and the real form. */
export function animateClassicSubmission(root: HTMLButtonElement, state: SubmissionButtonState, reduced: boolean) {
  const label = root.querySelector<HTMLElement>("[data-submit-label]")!;
  const loader = root.querySelector<HTMLElement>("[data-submit-loader]")!;
  const ring = root.querySelector<HTMLElement>("[data-submit-ring]")!;
  const success = root.querySelector<SVGSVGElement>("[data-submit-success]")!;
  const error = root.querySelector<SVGSVGElement>("[data-submit-error]")!;
  const waiting = state === "loading" || state === "checking";
  const result = state === "success" ? success : state === "error" ? error : null;
  const width = parseFloat(getComputedStyle(root).getPropertyValue("--submit-width")) || 104;
  gsap.set(root, { width });

  if (reduced) {
    gsap.set([root, label, loader, ring, success, error], { clearProps: "transform,opacity,visibility" });
    gsap.set([loader, success, error], { autoAlpha: 0 });
    gsap.set(label, { x: waiting || result ? 12 : 0, opacity: 1 });
    if (waiting) {
      gsap.set(loader, { left: 24, x: 0, y: 0, xPercent: -50, yPercent: -50, autoAlpha: 1 });
      gsap.set(ring, { opacity: 1 });
    } else if (result) gsap.set(result, { autoAlpha: 1 });
    return null;
  }

  const timeline = gsap.timeline();
  timeline.to(root, { x: 0, scale: 1, duration: 0.2 }, 0);
  if (waiting) {
    timeline.to([success, error], { autoAlpha: 0, duration: 0.15 }, 0)
      .to(loader, { autoAlpha: 1, left: 24, duration: 0.3 }, 0)
      .to(ring, { opacity: 1, duration: 0.3 }, 0)
      .to(label, { x: 12, y: 0, opacity: 0.8, duration: 0.3 }, 0)
      .to(ring, { rotation: "+=360", duration: 1, repeat: -1, ease: "none" }, 0);
  } else if (result) {
    timeline.to(state === "success" ? error : success, { autoAlpha: 0, duration: 0.15 }, 0)
      .to(loader, { autoAlpha: 0, duration: 0.2 }, 0)
      .fromTo(result, { scale: 0.5, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.4, ease: "back.out(2)" }, 0.1)
      .to(label, { x: 12, y: 0, opacity: 1, duration: 0.3 }, 0);
  } else {
    timeline.to([loader, success, error], { autoAlpha: 0, duration: 0.2 }, 0)
      .to(label, { x: 0, y: 0, opacity: 1, duration: 0.3 }, 0);
    if (state === "invalid") {
      timeline.to(root, { x: 2, duration: 0.08, repeat: 1, yoyo: true, ease: "sine.inOut" }, 0.2)
        .set(root, { x: 0 });
    }
  }
  return timeline;
}

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(listener: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}
const readMotion = () => window.matchMedia(motionQuery).matches;
const serverMotion = () => true;

export function ClassicSubmitButton({ state, feedbackVersion = 0, active = true, className, children, ...props }: ComponentPropsWithoutRef<"button"> & {
  state: SubmissionButtonState;
  feedbackVersion?: number;
  active?: boolean;
}) {
  const root = useRef<HTMLButtonElement>(null);
  const context = useRef<gsap.Context | null>(null);
  const reduced = useSyncExternalStore(subscribeMotion, readMotion, serverMotion);

  useLayoutEffect(() => {
    context.current = gsap.context(() => {}, root);
    return () => { context.current?.revert(); context.current = null; };
  }, []);

  useLayoutEffect(() => {
    let timeline: gsap.core.Timeline | null = null;
    context.current?.add(() => {
      if (root.current) timeline = animateClassicSubmission(root.current, active ? state : "idle", reduced || !active);
    });
    // Retain the current pose when a response arrives; revert only on unmount.
    return () => { timeline?.kill(); };
  }, [state, feedbackVersion, active, reduced, children]);

  return <button {...props} ref={root} className={cn(styles.button, className)} data-submit-button data-variant="1" data-state={state}
    aria-busy={state === "loading" || state === "checking"}>
    <span data-submit-label>{children}</span>
    <span data-submit-loader aria-hidden><span data-submit-ring /></span>
    <Check data-submit-success aria-hidden strokeWidth={2} />
    <CircleAlert data-submit-error aria-hidden strokeWidth={1.8} />
  </button>;
}
