"use client";

import { useCallback, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import { gsap } from "gsap";

type ThemeTransition = { theme: "light" | "dark"; finish: () => void };

// Buttons and the D shortcut share the same document-wide snapshot.
let activeTransition: ThemeTransition | null = null;

export function useThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const ownedTransition = useRef<ThemeTransition | null>(null);

  useEffect(() => () => ownedTransition.current?.finish(), []);

  const toggleTheme = useCallback((source?: HTMLElement) => {
    const root = document.documentElement;
    const current = activeTransition?.theme ??
      (root.classList.contains("dark") ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    activeTransition?.finish();

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!document.startViewTransition || motion.matches || document.hidden) {
      setTheme(next);
      return;
    }

    const button = source ?? Array.from(
      document.querySelectorAll<HTMLElement>("[data-theme-toggle]"),
    ).find((element) => element.getClientRects().length > 0);
    const rect = button?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    ) + 260;
    const snapshots: Animation[] = [];
    const previousName = root.style.viewTransitionName;
    const geometry = document.createElement("style");
    geometry.textContent = `
      :root::view-transition-image-pair(theme-incoming) {
        width: ${radius * 2}px; height: ${radius * 2}px;
        left: ${x - radius}px; top: ${y - radius}px;
        transform-origin: ${radius}px ${radius}px;
      }
      :root::view-transition-new(theme-incoming) {
        width: ${window.innerWidth}px; height: ${window.innerHeight}px;
        left: ${radius - x}px; top: ${radius - y}px;
        transform-origin: ${x}px ${y}px;
      }
    `;
    let committed = false;
    let finished = false;
    const commit = () => {
      if (committed) return;
      committed = true;
      setTheme(next);
    };
    const finish = () => {
      if (finished) return;
      finished = true;
      commit();
      snapshots.forEach((animation) => animation.cancel());
      transition.skipTransition();
      geometry.remove();
      motion.removeEventListener("change", finish);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (activeTransition === state) {
        activeTransition = null;
        delete root.dataset.themeTransition;
        root.style.viewTransitionName = previousName;
      }
      if (ownedTransition.current === state) ownedTransition.current = null;
    };
    const onVisibilityChange = () => {
      if (document.hidden) finish();
    };
    const state: ThemeTransition = { theme: next, finish };
    activeTransition = state;
    ownedTransition.current = state;
    root.dataset.themeTransition = "soft-focus";
    root.style.viewTransitionName = "theme-outgoing";
    document.head.appendChild(geometry);
    motion.addEventListener("change", finish);
    document.addEventListener("visibilitychange", onVisibilityChange);

    const transition = document.startViewTransition(() => {
      if (finished) return;
      root.style.viewTransitionName = "theme-incoming";
      flushSync(commit);
    });
    void transition.ready.then(() => {
      if (finished) return;
      // Bake GSAP's curve into compositor keyframes. A busy main thread must not
      // hold up the reveal by advancing a paused animation on every JS frame.
      const maskFrames: Keyframe[] = [];
      const imageFrames: Keyframe[] = [];
      const ease = gsap.parseEase("power2.inOut");
      for (let index = 0; index <= 192; index++) {
        const offset = index / 192;
        const scale = Math.max(0.001, ease(offset));
        maskFrames.push({ offset, transform: `scale(${scale})` });
        imageFrames.push({ offset, transform: `scale(${1 / scale})` });
      }
      for (const [keyframes, pseudoElement] of [
        [maskFrames, "::view-transition-image-pair(theme-incoming)"],
        [imageFrames, "::view-transition-new(theme-incoming)"],
      ] as const) {
        const animation = root.animate(keyframes, { duration: 650, fill: "both", pseudoElement });
        snapshots.push(animation);
      }
      void Promise.all(snapshots.map((animation) => animation.finished)).then(finish, finish);
    }, finish);
    void transition.finished.then(finish, finish);
  }, [setTheme]);

  return { resolvedTheme, toggleTheme };
}
