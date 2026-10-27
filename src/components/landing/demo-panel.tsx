"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { T } from "@/components/common/language-provider";
import { Terminal } from "lucide-react";
import { CopyButton } from "@/components/docs/copy-button";

/** Shared playback gate for the small homepage demonstrations. */
export function useDemoActivity() {
  const ref = useRef<HTMLDivElement>(null);
  const [activity, setActivity] = useState({ active: false, reduced: false });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let visible = false;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setActivity({ active: visible && !document.hidden && !media.matches, reduced: media.matches });
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= 0.2;
      sync();
    }, { threshold: [0, 0.2] });
    observer.observe(node);
    document.addEventListener("visibilitychange", sync);
    media.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      media.removeEventListener("change", sync);
    };
  }, []);

  return { ref, ...activity };
}

export function DemoPanelHeader({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return <div className="demo-panel-header">
    <span aria-hidden className="demo-panel-icon">{icon}</span>
    <span className="demo-panel-title"><T>{title}</T></span>
    <div className="ml-auto flex shrink-0 items-center gap-2">{children}</div>
  </div>;
}

export function DemoCommand({ command, label = "shadcn CLI", className = "" }: { command: string; label?: string; className?: string }) {
  const split = command.lastIndexOf(" ");
  return <div className={`demo-command ${className}`}>
    <div className="demo-command-heading"><Terminal aria-hidden className="size-3" /><span><T>{label}</T></span><CopyButton text={command} /></div>
    <code>{command.slice(0, split + 1)}<span className="demo-command-package">{command.slice(split + 1)}</span></code>
  </div>;
}
