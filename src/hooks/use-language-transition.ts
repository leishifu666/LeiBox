"use client";

import { gsap } from "gsap";
import { usePathname } from "next/navigation";
import { useCallback, useLayoutEffect, useRef } from "react";
import { flushSync } from "react-dom";

import type { Locale } from "@/lib/i18n/translate";

type Rect = { x: number; y: number; width: number; height: number };
type TextSnapshot = { node: HTMLElement; text: string; rect: Rect; copy: HTMLElement };
const skip = "pre,code,script,style,textarea,input,select,svg,[inert],[aria-hidden='true'],[data-language-ghosts]";
const panelSelector = "main section[aria-labelledby],main > article,.agent-demo,.hero-panel-enter,[data-component-card] > :first-child,[data-component-demo-panel]";
const ghostStyles = ["fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight", "letterSpacing", "textAlign", "textTransform", "textWrap", "whiteSpace", "color", "backgroundColor", "border", "borderRadius", "padding", "boxSizing", "display", "listStyle", "alignItems", "justifyContent", "gap", "overflow", "textOverflow"] as const;
const text = (node: HTMLElement) => node.textContent?.trim().replace(/\s+/g, " ") ?? "";
const rect = (node: HTMLElement): Rect => {
  const box = node.getBoundingClientRect();
  return { x: box.x, y: box.y, width: box.width, height: box.height };
};
function visible(node: HTMLElement) {
  const box = node.getBoundingClientRect();
  if (box.width <= 1 || box.height <= 1 || box.bottom <= 0 || box.top >= innerHeight || box.right <= 0 || box.left >= innerWidth) return false;
  const css = getComputedStyle(node);
  return css.visibility === "visible" && css.opacity !== "0";
}

function captureText(): TextSnapshot[] {
  const nodes = new Set<HTMLElement>();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    if (!walker.currentNode.textContent?.trim()) continue;
    let node = walker.currentNode.parentElement;
    if (!node || node.closest(skip)) continue;
    // Transform a real text container; changing an inline span's display would
    // alter line breaks before the language switch even starts.
    while (getComputedStyle(node).display === "inline" && node.parentElement) node = node.parentElement;
    if (node === document.body || node.closest(skip) || node.querySelector("input,textarea,pre,code,canvas,video,iframe") || !visible(node)) continue;
    nodes.add(node);
  }
  return [...nodes].filter(node => {
    for (let parent = node.parentElement; parent; parent = parent.parentElement) if (nodes.has(parent)) return false;
    return true;
  }).map(node => {
    const copy = node.cloneNode(true) as HTMLElement;
    const css = getComputedStyle(node);
    // The visual copy leaves its original CSS ancestry. Freeze computed styles
    // so its font, wrapping, button surface, and theme stay identical.
    for (const name of ghostStyles) copy.style[name] = css[name];
    copy.removeAttribute("id");
    copy.removeAttribute("data-language-toggle");
    copy.querySelectorAll("[data-language-toggle]").forEach(child => child.removeAttribute("data-language-toggle"));
    copy.querySelectorAll("[id]").forEach(child => child.removeAttribute("id"));
    const box = rect(node);
    Object.assign(copy.style, {
      position: "absolute", left: `${box.x}px`, top: `${box.y}px`,
      width: `${box.width}px`, height: `${box.height}px`, margin: "0",
      transform: "none", animation: "none", transition: "none", pointerEvents: "none",
    });
    return { node, text: text(node), rect: box, copy };
  });
}

export function useLanguageTransition(locale: Locale, commit: (next: Locale) => void) {
  const active = useRef<(() => void) | null>(null);
  const pathname = usePathname();
  useLayoutEffect(() => () => active.current?.(), [pathname]);

  return useCallback((next: Locale) => {
    active.current?.();
    if (next === locale) return;
    const root = document.documentElement;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const pageTransition = document.querySelector("main[data-component-entry-state]:not([data-component-entry-state='idle'])");
    if (reduced.matches || document.hidden || root.dataset.themeTransition || pageTransition) {
      commit(next);
      return;
    }
    // One-time entrance animations with fill-mode:both override GSAP's inline
    // opacity/transform. Consume them so switching cannot snap or replay them.
    document.querySelectorAll<HTMLElement>(".hero-enter,.hero-panel-enter").forEach(node => { node.style.animation = "none"; });
    const snapshots = captureText();
    const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const actions = [...document.querySelectorAll<HTMLElement>("[data-hero-actions]")].filter(visible).map(node => ({
      node, before: rect(node),
      links: [...node.querySelectorAll<HTMLElement>("a")].map(link => ({ node: link, before: rect(link) })),
      arrows: [...node.querySelectorAll<HTMLElement>("[data-soft-arrow]")].map(arrow => ({ node: arrow, before: rect(arrow) })),
    }));
    const panels = [...document.querySelectorAll<HTMLElement>(panelSelector)]
      .filter(node => !node.closest(skip) && visible(node)).map(node => ({ node, before: rect(node) }));
    const previousAnchor = root.style.overflowAnchor;
    root.style.overflowAnchor = "none";
    flushSync(() => commit(next));
    const pairs = snapshots.filter(snapshot => snapshot.node.isConnected && text(snapshot.node) !== snapshot.text && snapshot.node.getClientRects().length > 0 && getComputedStyle(snapshot.node).visibility === "visible")
      .map(snapshot => ({ ...snapshot, after: rect(snapshot.node) }));
    const movingPanels = panels.filter(panel => panel.node.isConnected)
      .map(panel => ({ ...panel, after: rect(panel.node), transform: getComputedStyle(panel.node).transform }))
      .filter(panel => Math.abs(panel.before.y - panel.after.y) > 1);
    const movingNodes = new Set(movingPanels.map(panel => panel.node));
    // Move the highest affected section once; moving its nested cards again
    // would apply the same page displacement twice.
    const layoutRoots = movingPanels.filter(panel => {
      for (let parent = panel.node.parentElement; parent; parent = parent.parentElement) if (movingNodes.has(parent)) return false;
      return true;
    });
    if (!pairs.length) { root.style.overflowAnchor = previousAnchor; return; }
    const committedScroll = { x: scrollX, y: scrollY };

    const layer = document.createElement("div");
    layer.dataset.languageGhosts = "";
    layer.setAttribute("aria-hidden", "true");
    layer.inert = true;
    Object.assign(layer.style, { position: "fixed", inset: "0", zIndex: "40", pointerEvents: "none", overflow: "visible" });
    const headerLayer = layer.cloneNode(false) as HTMLDivElement;
    headerLayer.dataset.languageGhosts = "header";
    headerLayer.style.zIndex = "10000";
    // Scrolling sections pass behind the fixed navigation. Only its own text
    // copies belong above it; a single top layer lets body content cover it.
    for (const pair of pairs) (pair.node.closest("header") ? headerLayer : layer).append(pair.copy);
    document.body.append(layer, headerLayer);
    root.dataset.languageTransition = "gravity-focus";
    let context: gsap.Context | null = null;
    let startFrame = 0;
    const layoutAnimations: Animation[] = [];
    const finish = () => {
      cancelAnimationFrame(startFrame);
      layoutAnimations.forEach(animation => animation.cancel());
      context?.revert();
      context = null;
      layer.remove();
      headerLayer.remove();
      delete root.dataset.languageTransition;
      active.current = null;
      window.removeEventListener("resize", finish);
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("pointerdown", finish, true);
      document.removeEventListener("keydown", finish, true);
      document.removeEventListener("visibilitychange", finish);
      reduced.removeEventListener("change", finish);
      root.style.overflowAnchor = previousAnchor;
      // Hiding the button can release focus to body or a demo iframe. Restore
      // it before the next native pointer/keyboard action continues normally.
      if (focused?.isConnected && visible(focused)) focused.focus({ preventScroll: true });
    };
    const onScroll = (event: Event) => {
      // A document shrinking near its bottom can queue its own scroll event.
      // That committed position is already included in the measured geometry.
      const pageScroll = event.target === document || event.target === root || event.target === window;
      if (!pageScroll || Math.abs(scrollY - committedScroll.y) > 1 || Math.abs(scrollX - committedScroll.x) > 1) finish();
    };
    active.current = finish;
    window.addEventListener("resize", finish);
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    document.addEventListener("pointerdown", finish, true);
    document.addEventListener("keydown", finish, true);
    document.addEventListener("visibilitychange", finish);
    reduced.addEventListener("change", finish);
    context = gsap.context(() => {
      gsap.set(pairs.map(pair => pair.copy), { filter: "blur(0px)" });
      const timeline = gsap.timeline({ paused: true, onComplete: finish });
      const ease = gsap.parseEase("power3.inOut");
      const layoutMotion = (node: HTMLElement, frame: (progress: number) => Keyframe) => {
        const keyframes = Array.from({ length: 33 }, (_, index) => ({ offset: index / 32, ...frame(ease(index / 32)) }));
        const animation = node.animate(keyframes, { duration: 550, fill: "both" });
        animation.id = "language-layout";
        animation.pause();
        animation.currentTime = 0;
        layoutAnimations.push(animation);
      };
      for (const panel of layoutRoots) {
        const dy = panel.before.y - panel.after.y;
        const original = panel.transform === "none" ? "" : ` ${panel.transform}`;
        layoutMotion(panel.node, progress => ({ transform: `translate3d(0, ${dy * (1 - progress)}px, 0)${original}` }));
      }
      for (const action of actions) {
        const after = rect(action.node);
        const dy = action.before.y - after.y;
        layoutMotion(action.node, progress => ({ transform: `translate3d(0, ${dy * (1 - progress)}px, 0)` }));
        // Let the centered flex row follow the real button widths. Scaling the
        // row would stretch text, while fading whole links makes surfaces jump.
        for (const link of action.links) {
          const width = rect(link.node).width;
          layoutMotion(link.node, progress => ({ width: `${link.before.width + (width - link.before.width) * progress}px`, minWidth: "0px", flexShrink: "0" }));
        }
        for (const arrow of action.arrows) {
          const current = rect(arrow.node);
          const dx = arrow.before.x - current.x, dy = arrow.before.y - current.y;
          layoutMotion(arrow.node, progress => ({ transform: `translate3d(${dx * (1 - progress)}px, ${dy * (1 - progress)}px, 0)` }));
        }
      }
      // Selected Gemini scheme ②, with the approved 1px focus treatment.
      pairs.forEach((pair, index) => {
        const dx = pair.after.x - pair.rect.x, dy = pair.after.y - pair.rect.y;
        const distance = Math.hypot(dx, dy) || 1, travel = Math.min(distance, 12);
        const x = dx / distance * travel, y = dy / distance * travel;
        const delay = index / pairs.length * .12;
        if (pair.node.hasAttribute("data-language-label") || layoutRoots.some(panel => panel.node.contains(pair.node))) {
          layoutMotion(pair.copy, progress => ({ transform: `translate3d(${dx * progress}px, ${dy * progress}px, 0)` }));
          timeline.to(pair.copy, { autoAlpha: 0, filter: "blur(1px)", duration: .35, ease: "power1.inOut" }, delay);
          timeline.fromTo(pair.node, { autoAlpha: 0, filter: "blur(1px)" },
            { autoAlpha: 1, filter: "blur(0px)", duration: .5, ease: "power2.out" }, delay + .15);
          return;
        }
        timeline.to(pair.copy, { x, y, autoAlpha: 0, filter: "blur(1px)", duration: .35, ease: "power1.inOut" }, delay);
        timeline.fromTo(pair.node, { x: -x, y: -y, autoAlpha: 0, filter: "blur(1px)" },
          { x: 0, y: 0, autoAlpha: 1, filter: "blur(0px)", duration: .5, ease: "power2.out" }, delay + .15);
      });
      // Start after the ticker has a fresh frame time; layout preparation must
      // not count as elapsed animation and skip the beginning of the motion.
      startFrame = requestAnimationFrame(() => {
        // The demo can occupy the main thread. Native playback keeps the CTA's
        // geometry moving between JS frames, using the same sampled GSAP ease.
        layoutAnimations.forEach(animation => animation.play());
        timeline.play(0);
      });
    }, document.body);
  }, [locale, commit]);
}
