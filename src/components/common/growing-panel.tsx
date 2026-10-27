"use client";

import { gsap } from "gsap";
import { useLayoutEffect, useRef, type MouseEvent, type ReactNode, type RefObject } from "react";

type GrowingPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: HTMLElement | null;
  triggerSelector: string;
  closeRef: RefObject<() => void>;
  focusRef: RefObject<HTMLElement | null>;
  kind: "contact" | "search";
  label?: string;
  labelledBy?: string;
  children: ReactNode;
};

// 搜索与联系面板共用已选的 01 动效，避免入口、收回和滚动锁定各写一套。
export function GrowingPanel({ open, onOpenChange, trigger, triggerSelector, closeRef, focusRef, kind, label, labelledBy, children }: GrowingPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const surfaceRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const backdropStartRef = useRef(false);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const surface = surfaceRef.current;
    const content = contentRef.current;
    if (!dialog || !surface || !content || !open) return;
    let previousFocus = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const previousRootOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    // 页面滚动条始终隐藏，锁定时无需补 padding，也不会让固定导航横向跳动。
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    if (!dialog.open) dialog.showModal();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timeline: gsap.core.Timeline | undefined;
    let closing = false;
    const context = gsap.context(() => {}, dialog);
    const source = () => {
      let element = trigger;
      if (!element?.isConnected || !element.getBoundingClientRect().width) {
        element = [...document.querySelectorAll<HTMLElement>(triggerSelector)]
          .find((button) => button.getBoundingClientRect().width > 0) ?? null;
      }
      const rect = element?.getBoundingClientRect();
      if (!rect?.width || !rect.height) {
        return { rect: new DOMRect(window.innerWidth / 2 - 16, window.innerHeight / 2 - 16, 32, 32), radius: 16 };
      }
      previousFocus = element;
      const radius = Math.min(parseFloat(getComputedStyle(element!).borderTopLeftRadius), rect.width / 2, rect.height / 2);
      return { rect, radius };
    };
    const clearGeometry = () => {
      gsap.set([surface, content], { clearProps: "all" });
      gsap.set(dialog, { "--panel-backdrop-opacity": 1 });
    };
    const morph = (target: DOMRect, origin: ReturnType<typeof source>) => {
      timeline?.kill();
      const radius = parseFloat(getComputedStyle(surface).borderTopLeftRadius);
      context.add(() => {
        gsap.set(surface, { position: "absolute", left: 0, top: 0, margin: 0, maxWidth: "none", maxHeight: "none" });
        // 固定内容排版，只让玻璃外壳从按钮矩形长到中央。
        gsap.set(content, { width: target.width - 2, height: target.height - 2, flexShrink: 0 });
        timeline = gsap.timeline({
          paused: true,
          onComplete: () => { if (!closing) clearGeometry(); },
          onReverseComplete: () => onOpenChange(false),
        })
          .fromTo(surface, {
            x: origin.rect.left, y: origin.rect.top, width: origin.rect.width, height: origin.rect.height, borderRadius: origin.radius,
          }, {
            x: target.left, y: target.top, width: target.width, height: target.height, borderRadius: radius, duration: 0.5, ease: "power3.inOut",
          }, 0)
          // 反向播放时让空玻璃壳先淡出，与底下的按钮交叠，避免结束时硬切成图标。
          .fromTo(surface, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: "power1.inOut" }, 0)
          .fromTo(content, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.3)
          .fromTo(dialog, { "--panel-backdrop-opacity": 0 }, { "--panel-backdrop-opacity": 1, duration: 0.3, ease: "power2.inOut" }, 0);
        if (closing) timeline.progress(1).reverse();
        else timeline.play();
      });
    };

    if (!motion.matches) morph(surface.getBoundingClientRect(), source());
    focusRef.current?.focus({ preventScroll: true });

    let focusFrame = 0;
    const containPreviewFocus = () => {
      cancelAnimationFrame(focusFrame);
      focusFrame = requestAnimationFrame(() => {
        // 背景演示 iframe 的自动选区可能绕过原生 inert 抢焦点。
        if (!closing && dialog.open && document.activeElement instanceof HTMLIFrameElement && !dialog.contains(document.activeElement)) {
          focusRef.current?.focus({ preventScroll: true });
        }
      });
    };
    window.addEventListener("blur", containPreviewFocus);
    document.addEventListener("focusin", containPreviewFocus);

    closeRef.current = () => {
      if (closing) return;
      closing = true;
      const origin = source();
      if (motion.matches) { onOpenChange(false); return; }
      if (timeline?.isActive() && timeline.progress() < 1) timeline.reverse();
      else morph(surface.getBoundingClientRect(), origin);
    };
    const motionChange = () => {
      if (!motion.matches) return;
      timeline?.kill();
      if (closing) onOpenChange(false);
      else context.add(clearGeometry);
    };
    const resized = () => {
      timeline?.kill();
      if (closing) onOpenChange(false);
      else context.add(clearGeometry);
    };
    motion.addEventListener("change", motionChange);
    window.addEventListener("resize", resized);

    return () => {
      motion.removeEventListener("change", motionChange);
      window.removeEventListener("resize", resized);
      window.removeEventListener("blur", containPreviewFocus);
      document.removeEventListener("focusin", containPreviewFocus);
      cancelAnimationFrame(focusFrame);
      context.revert();
      closeRef.current = () => onOpenChange(false);
      if (dialog.open) dialog.close();
      onOpenChange(false);
      document.documentElement.style.overflow = previousRootOverflow;
      document.body.style.overflow = previousBodyOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open, onOpenChange, trigger, triggerSelector, closeRef, focusRef]);

  function outside(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return false;
    const rect = surfaceRef.current!.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      aria-labelledby={labelledBy}
      data-growing-panel={kind}
      onCancel={(event) => { event.preventDefault(); closeRef.current(); }}
      onClose={() => { if (!dialogRef.current?.open) onOpenChange(false); }}
      onPointerDown={(event) => { backdropStartRef.current = outside(event); }}
      onClick={(event) => { if (backdropStartRef.current && outside(event)) closeRef.current(); backdropStartRef.current = false; }}
      className="fixed inset-0 m-0 h-[100dvh] w-screen max-h-none max-w-none place-items-center overflow-hidden border-0 bg-transparent p-0 text-foreground outline-none backdrop:bg-white/40 backdrop:backdrop-blur-md backdrop:opacity-[var(--panel-backdrop-opacity,1)] dark:backdrop:bg-black/40 [&[open]]:grid"
    >
      <section ref={surfaceRef} data-panel-surface data-contact-surface={kind === "contact" ? "" : undefined} data-search-surface={kind === "search" ? "" : undefined} className="relative flex max-h-[calc(100svh-40px)] w-[440px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border/60 bg-background/85 text-foreground shadow-xl shadow-black/10 [--muted-foreground:oklch(0.5_0_0)] backdrop-blur-xl backdrop-saturate-150 dark:border-white/[0.18] dark:shadow-black/40 dark:[--muted-foreground:oklch(0.74_0_0)] data-[contact-surface]:rounded-[16px]">
        <div ref={contentRef} className="flex min-h-0 w-full flex-col">{children}</div>
      </section>
    </dialog>
  );
}
