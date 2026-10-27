import type { ReactNode } from "react";
import { optimizedImage } from "@/lib/optimized-image";
import { AmbientParticles } from "./ambient-particles";
export function HeroReveal({ backgroundUrl, children }: { backgroundUrl: string; children: ReactNode }) {
  return <div className="absolute inset-0 overflow-hidden">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img {...optimizedImage(backgroundUrl, "(min-width: 1152px) 1088px, 100vw")} alt="" className="absolute inset-0 size-full object-cover" />
    <AmbientParticles tone="day" />{children}
  </div>;
}
