"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "@/components/common/language-provider";
import { useDemoActivity } from "@/components/landing/demo-panel";
import { cn } from "@/lib/utils";
import { optimizedImage } from "@/lib/optimized-image";
import panels from "./claude-panels.generated.json";
import { claudeDictionary, mountClaudePanel } from "./claude-panels.generated.js";

type PanelKind = keyof typeof panels;
function panelMarkup(html: string, sizes: string) {
  return html.replace(/(<img\b[^>]*?\bsrc=")(\/assets\/components\/[^"]+)"/g, (match, prefix: string, url: string) => {
    const image = optimizedImage(url, sizes);
    return "srcSet" in image
      ? `${prefix}${image.src}" srcset="${image.srcSet}" sizes="${image.sizes}"`
      : match;
  });
}

// Keep React from replacing the DOM owned by the scoped controller on a parent update.
const content = {
  discovery: { __html: panelMarkup(panels.discovery.html, "(min-width: 1024px) 540px, 100vw") },
  frameworks: { __html: panels.frameworks.html },
  agent: { __html: panelMarkup(panels.agent.html, "72px") },
};
interface PanelController {
  setStep(index: number): void;
  setLocale(locale: string): void;
  setTheme(theme: string): void;
  setActive(active: boolean): void;
  destroy(): void;
}

/** Mount Gemini's HTML design using the existing scoped panel adapter. */
export function ClaudePanel({ kind, className, stepRequest, onStepChange }: {
  kind: PanelKind;
  className?: string;
  stepRequest?: { index: number; version: number };
  onStepChange?: (index: number) => void;
}) {
  const { t, locale } = useLanguage();
  const { ref, active, reduced } = useDemoActivity();
  const controller = useRef<PanelController | null>(null);
  const translate = useRef(t);
  const notify = useRef(onStepChange);

  useEffect(() => { translate.current = t; notify.current = onStepChange; }, [t, onStepChange]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    let alive = true;
    const english = claudeDictionary.en as Record<string, string>;
    const instance = mountClaudePanel(root, {
      locale: "zh-CN", theme: "light", active: false,
      translate: (key: string, values?: Record<string, string | number>) => {
        const source = key === "f.title" ? "Component source" : key === "d.title" ? "Component collection" : english[key] ?? key;
        return translate.current(source).replace(/\{(\w+)\}/g, (match: string, name: string) => values?.[name] === undefined ? match : String(values[name]));
      },
      onStepChange: (index: number) => {
        // Native initialization can emit immediately; React updates stay outside the effect call.
        queueMicrotask(() => { if (alive) notify.current?.(index); });
      },
    }) as PanelController;
    controller.current = instance;
    const syncTheme = () => instance.setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    syncTheme();
    return () => { alive = false; observer.disconnect(); instance.destroy(); controller.current = null; };
  }, [kind, ref]);

  useEffect(() => { controller.current?.setLocale(locale === "en" ? "en" : "zh-CN"); }, [locale, kind]);
  useEffect(() => { controller.current?.setActive(active); }, [active, kind]);
  useEffect(() => { if (stepRequest) controller.current?.setStep(stepRequest.index); }, [stepRequest]);

  const panel = panels[kind];
  return <div ref={ref} className={cn(panel.className, className)} data-leibox-panel={kind} data-claude-panel={kind} data-panel-active={active} data-reduced-motion={reduced} dangerouslySetInnerHTML={content[kind]} />;
}
