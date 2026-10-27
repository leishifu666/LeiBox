"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/** An independent 2D particle field; it never captures or redraws the DOM. */
export function AmbientParticles({ tone = "night" }: { tone?: "day" | "night" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current, host = canvas?.parentElement;
    if (!canvas || !host) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let width = 0, height = 0, last = 0, inView = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const points = Array.from({ length: tone === "day" ? 180 : 65 }, (_, index) => ({
      x: (index * 0.61803398875) % 1, y: (index * 0.41421356237) % 1,
      radius: 0.4 + (index % 5) * 0.2, speed: 0.004 + (index % 7) * 0.001,
    }));
    const paint = (time: number) => {
      context.clearRect(0, 0, width, height);
      const seconds = time / 1000;
      for (const point of points) {
        const y = ((point.y - seconds * point.speed) % 1 + 1) % 1;
        const x = (point.x + Math.sin(seconds * 0.16 + point.y * 8) * 0.012) * width;
        const opacity = tone === "day" ? 0.22 : (0.15 + y * 0.5) * Math.sin(Math.PI * y);
        context.fillStyle = tone === "day" ? `rgba(255,255,255,${opacity})` : `rgba(113,162,239,${opacity})`;
        context.beginPath(); context.arc(x, y * height, point.radius, 0, Math.PI * 2); context.fill();
      }
    };
    const tick = (seconds: number) => {
      const time = seconds * 1000;
      if (time - last > 32) { paint(time); last = time; }
    };
    const sync = () => {
      gsap.ticker.remove(tick);
      if (inView && !document.hidden && !reduced.matches) gsap.ticker.add(tick);
      else paint(0);
    };
    const resize = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width; height = entry.contentRect.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0); paint(0);
    });
    const visibility = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); });
    resize.observe(host); visibility.observe(host);
    document.addEventListener("visibilitychange", sync); reduced.addEventListener("change", sync);
    return () => {
      gsap.ticker.remove(tick); resize.disconnect(); visibility.disconnect();
      document.removeEventListener("visibilitychange", sync); reduced.removeEventListener("change", sync);
      canvas.width = canvas.height = 0;
    };
  }, [tone]);
  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 size-full" />;
}
