"use client";

import { gsap } from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type MouseEvent } from "react";

import { SiteLogo } from "@/components/common/site-logo";

gsap.registerPlugin(ScrollToPlugin);

export function HomeLogoLink({ className }: { className?: string }) {
  const pathname = usePathname();
  const scrollTween = useRef<gsap.core.Tween | null>(null);

  useEffect(() => () => {
    // 只停止当前回顶动画，离开首页时不回滚已经发生的滚动。
    scrollTween.current?.kill();
  }, [pathname]);

  function returnToTop(event: MouseEvent<HTMLAnchorElement>) {
    if (pathname !== "/" || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    scrollTween.current?.kill();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.scrollY <= 1) {
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }

    scrollTween.current = gsap.to(window, {
      scrollTo: { y: 0, autoKill: true },
      duration: 0.6,
      ease: "power3.inOut",
      onComplete: () => { scrollTween.current = null; },
    });
  }

  return (
    <Link href="/" aria-label="LeiBox home" className={className} onClick={returnToTop}>
      <SiteLogo navigation />
    </Link>
  );
}
