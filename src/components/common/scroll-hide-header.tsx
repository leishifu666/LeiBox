"use client";

import { gsap } from "gsap";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

export function ScrollHideHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const header = ref.current;
    if (!header) return;
    const content = Array.from(header.children);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scrollY = () => Math.max(0, Math.min(
      window.scrollY,
      document.documentElement.scrollHeight - window.innerHeight,
    ));
    let previousY = scrollY();
    let direction = 0;
    let distance = 0;
    let visible = true;

    const context = gsap.context(() => {
      gsap.set(header, { willChange: "transform" });
    }, header);
    const animate = context.add("animate", (show: boolean, immediate: boolean) => {
      const instant = immediate || reducedMotion.matches;
      const offscreen = Number(gsap.getProperty(header, "yPercent")) <= -75;
      gsap.killTweensOf(content);
      if (instant || !show) {
        gsap.set(content, { y: 0 });
      } else {
        if (offscreen) gsap.set(content, { y: -12 });
        gsap.to(content, {
          y: 0,
          duration: 0.45,
          ease: "back.out(1.5)",
          overwrite: true,
        });
      }
      // Floating controls sit below the top edge, so also clear their top inset.
      const inset = parseFloat(getComputedStyle(header).top) || 0;
      gsap.to(header, {
        yPercent: show ? 0 : -100,
        y: show ? 0 : -inset - 1,
        duration: instant ? 0 : 0.3,
        // The background must never overshoot its top edge; only content rebounds.
        ease: show ? "power2.out" : "power2.in",
        overwrite: true,
      });
    });

    const setVisible = (show: boolean, immediate = false) => {
      if (visible === show && !immediate) return;
      visible = show;
      header.inert = !show;
      header.style.pointerEvents = show ? "" : "none";
      header.dataset.scrollNav = show ? "visible" : "hidden";
      if (show) header.removeAttribute("aria-hidden");
      else header.setAttribute("aria-hidden", "true");
      animate(show, immediate);
    };

    const isLocked = () => {
      const focused = document.activeElement;
      return Boolean(header.querySelector('[aria-expanded="true"]')) || (
        focused instanceof HTMLElement &&
        header.contains(focused) &&
        focused.matches(":focus-visible")
      );
    };

    const onScroll = () => {
      const currentY = scrollY();
      const delta = currentY - previousY;
      previousY = currentY;

      if (currentY <= 48 || isLocked()) {
        distance = 0;
        setVisible(true);
        return;
      }
      if (!delta) return;

      const nextDirection = Math.sign(delta);
      if (nextDirection !== direction) distance = 0;
      direction = nextDirection;
      // Accumulate small trackpad events instead of discarding each tiny delta.
      distance += Math.abs(delta);
      if (distance >= (direction > 0 ? 24 : 6)) {
        setVisible(direction < 0);
        distance = 0;
      }
    };

    const reveal = () => {
      previousY = scrollY();
      distance = 0;
      setVisible(true, true);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      // Remove inert before the browser chooses the next Tab target.
      if (event.key === "Tab") reveal();
    };
    const onFocusIn = () => reveal();
    const onMenuChange = () => {
      if (isLocked()) reveal();
    };
    const onMotionChange = () => setVisible(visible, true);
    const observer = new MutationObserver(onMenuChange);
    observer.observe(header, {
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-expanded"],
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", reveal);
    document.addEventListener("keydown", onKeyDown);
    header.addEventListener("focusin", onFocusIn);
    reducedMotion.addEventListener("change", onMotionChange);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", reveal);
      document.removeEventListener("keydown", onKeyDown);
      header.removeEventListener("focusin", onFocusIn);
      reducedMotion.removeEventListener("change", onMotionChange);
      observer.disconnect();
      context.revert();
      header.inert = false;
      header.style.removeProperty("pointer-events");
      header.removeAttribute("aria-hidden");
      header.dataset.scrollNav = "visible";
    };
  }, [pathname]);

  return (
    <header
      ref={ref}
      className={className}
      data-scroll-nav="visible"
    >
      {children}
    </header>
  );
}
