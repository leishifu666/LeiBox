"use client";

import { gsap } from "gsap";
import { useLayoutEffect, useRef, type ReactNode } from "react";

const CATEGORY_MOTION = {
  openDuration: 0.62,
  closeDuration: 0.484,
  revealDuration: 0.43,
  hideDuration: 0.22,
  offset: -7,
} as const;

/** Keep both lists mounted so category changes can reverse from their current heights. */
export function DocsCategoryPanel({ id, category, expanded, reducedMotion, children }: {
  id: string;
  category: string;
  expanded: boolean;
  reducedMotion: boolean;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);

  useLayoutEffect(() => {
    const element = panel.current!;
    const content = list.current!;
    const items = [...content.children];
    const finish = () => {
      if (expanded) gsap.set(element, { height: "auto" });
    };

    if (expanded && element.offsetHeight === 0) {
      gsap.set(items, { opacity: 0, y: CATEGORY_MOTION.offset });
    }

    gsap.to(element, {
      height: expanded ? content.offsetHeight : 0,
      duration: reducedMotion ? 0 : expanded ? CATEGORY_MOTION.openDuration : CATEGORY_MOTION.closeDuration,
      ease: expanded ? "back.out(1.2)" : "power2.inOut",
      overwrite: true,
      onComplete: finish,
    });
    gsap.to(items, {
      opacity: expanded ? 1 : 0,
      y: expanded ? 0 : CATEGORY_MOTION.offset,
      duration: reducedMotion ? 0 : expanded ? CATEGORY_MOTION.revealDuration : CATEGORY_MOTION.hideDuration,
      ease: "power3.out",
      overwrite: true,
    });

    return () => {
      // Killing a tween preserves the interrupted pose for the next direction.
      gsap.killTweensOf([element, ...items]);
    };
  }, [expanded, reducedMotion]);

  return (
    <div ref={panel} id={id} data-sidebar-category-panel={category}
      aria-hidden={!expanded} inert={!expanded} className="overflow-hidden" style={{ height: 0 }}>
      <ul ref={list} className="flex flex-col gap-0.5 py-1 pl-3">
        {children}
      </ul>
    </div>
  );
}
