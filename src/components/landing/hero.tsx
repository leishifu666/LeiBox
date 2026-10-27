import { T } from "@/components/common/language-provider";
import Link from "next/link";
import { preload } from "react-dom";

import { HeroReveal } from "@/components/landing/hero-reveal";
import { HeroInstallCommand } from "@/components/landing/hero-install-command";
import { COMPONENT_CATALOG } from "@/data/component-catalog";
import { optimizedImage } from "@/lib/optimized-image";
import { SoftArrow } from "@/components/landing/soft-arrow";
import styles from "./hero-english.module.css";

export function Hero() {
  preload(optimizedImage("/landing/agent-demo/alpine-lake.png").src, {
    as: "image",
    fetchPriority: "high",
  });
  return (
    <section className="flex min-h-svh w-full flex-col px-5 pt-28 pb-2.5 sm:px-8 sm:pt-36">
      <div data-hero-copy className={`mx-auto flex w-full max-w-2xl flex-col items-start px-2.5 text-left sm:items-center sm:text-center ${styles.copy}`}>
        <h1
          data-hero-title
          style={{ "--enter-index": 0 } as React.CSSProperties}
          className="hero-enter text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[1.04] font-medium tracking-tighter text-balance"
        ><T>
          Your box of UI ideas and components.
        </T></h1>

        <p
          data-hero-description
          style={{ "--enter-index": 1 } as React.CSSProperties}
          className="hero-enter mt-5 max-w-md text-base leading-7 text-pretty text-muted-foreground"
        ><T>
          LeiBox is my collection of UI inspiration, interaction details, and
          useful components. Explore the demos, check the sources, and find
          ideas for your next interface.
        </T></p>

        <div
          data-hero-actions
          style={{ "--enter-index": 2 } as React.CSSProperties}
          className="hero-enter mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-6"
        >
          <Link
            href="/docs"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground px-6 text-[15px] font-medium tracking-[-0.01em] text-background transition-[opacity,transform] duration-150 ease-out hover:opacity-85 active:scale-[0.98]"
          ><span data-language-label className="inline-block whitespace-nowrap"><T>
            Get started
            </T></span><SoftArrow />
          </Link>
          <Link
            href="/components"
            className="inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-[15px] font-medium text-foreground transition-colors duration-150 hover:bg-muted active:scale-[0.98] sm:h-auto sm:border-0 sm:px-0 sm:hover:bg-transparent sm:hover:text-muted-foreground sm:active:scale-100"
          ><span data-language-label className="inline-block whitespace-nowrap"><T>
            Browse components
          </T></span></Link>
        </div>
      </div>

      <div className="hero-panel-enter relative mx-auto mt-16 min-h-72 w-full flex-1 overflow-hidden rounded-2xl bg-muted sm:mt-20 sm:min-h-[27rem]">
        <HeroReveal backgroundUrl="/landing/agent-demo/alpine-lake.png">
          <div className="absolute inset-0 flex overflow-y-auto p-5 sm:p-6">
            <div className="m-auto grid w-full max-w-xl grid-cols-2 gap-4 text-white sm:max-w-2xl">
              <div className="relative isolate overflow-hidden rounded-2xl border border-white/10 bg-black/25 p-5 sm:p-6">
                <div
                  aria-hidden
                  className="absolute inset-0 -z-10 rounded-[inherit] backdrop-blur-md"
                />
                <p className="text-sm font-medium sm:text-base"><T>Collected components</T></p>
                <p className="mt-8 text-4xl font-medium tracking-tight sm:mt-12 sm:text-6xl">
                  {COMPONENT_CATALOG.length}
                </p>
                <p className="mt-3 font-mono text-[10px] tracking-widest text-white/70 uppercase sm:text-xs"><T>
                  Curated and growing
                </T></p>
              </div>
              <div className="relative isolate overflow-hidden rounded-2xl border border-white/10 bg-black/25 p-5 sm:p-6">
                <div
                  aria-hidden
                  className="absolute inset-0 -z-10 rounded-[inherit] backdrop-blur-md"
                />
                <p className="text-sm font-medium sm:text-base"><T>Live demos</T></p>
                <p className="mt-8 text-4xl font-medium tracking-tight sm:mt-12 sm:text-6xl">
                  100%
                </p>
                <p className="mt-3 font-mono text-[10px] tracking-widest text-white/70 uppercase sm:text-xs"><T>
                  Inspect before you use
                </T></p>
              </div>
              <div className="col-span-2 relative isolate hidden overflow-hidden rounded-2xl border border-white/10 bg-black/25 p-5 sm:block sm:p-6">
                <div
                  aria-hidden
                  className="absolute inset-0 -z-10 rounded-[inherit] backdrop-blur-md"
                />
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium sm:text-base">LeiBox Skill</p>
                  <p className="font-mono text-[10px] tracking-widest text-white/70 uppercase sm:text-xs"><T>
                    Install once, access every component
                  </T></p>
                </div>
                <HeroInstallCommand />
              </div>
            </div>
          </div>
        </HeroReveal>
      </div>
    </section>
  );
}
