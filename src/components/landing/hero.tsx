import { T } from "@/components/common/language-provider";
import Link from "next/link";
import { preload } from "react-dom";
import { ArrowRight } from "lucide-react";

import { HeroReveal } from "@/components/landing/hero-reveal";
import { CopyButton } from "@/components/docs/copy-button";
import { COMPONENTS } from "@/data/components";

const INSTALL_COMMAND =
  "npx shadcn@latest add @canvas-ui/particle-reveal-react";

export function Hero() {
  preload("/assets/fallback-hero-poster.jpg", {
    as: "image",
    fetchPriority: "high",
  });
  return (
    <section className="flex min-h-svh w-full flex-col px-5 pt-28 pb-2.5 sm:px-8 sm:pt-36">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-start px-2.5 text-left sm:items-center sm:text-center">
        <h1
          style={{ "--enter-index": 0 } as React.CSSProperties}
          className="hero-enter text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[1.04] font-medium tracking-tighter text-balance"
        ><T>
          Creative components, in a new dimension.
        </T></h1>

        <p
          style={{ "--enter-index": 1 } as React.CSSProperties}
          className="hero-enter mt-5 max-w-md text-base leading-7 text-pretty text-muted-foreground"
        ><T>
          An open source library of tasteful html-in-canvas components, in
          WebGL or WebGPU. Framework agnostic.
        </T></p>

        <div
          style={{ "--enter-index": 2 } as React.CSSProperties}
          className="hero-enter mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-6"
        >
          <Link
            href="/docs"
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground px-6 text-[15px] font-medium tracking-[-0.01em] text-background transition-[opacity,transform] duration-150 ease-out hover:opacity-85 active:scale-[0.98]"
          ><T>
            Get started
            </T><ArrowRight
              aria-hidden
              strokeWidth={2.25}
              className="-mr-1.5 size-[15px] transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </Link>
          <Link
            href="/components"
            className="inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-[15px] font-medium text-foreground transition-colors duration-150 hover:bg-muted active:scale-[0.98] sm:h-auto sm:border-0 sm:px-0 sm:hover:bg-transparent sm:hover:text-muted-foreground sm:active:scale-100"
          ><T>
            Browse components
          </T></Link>
        </div>
      </div>

      <div className="hero-panel-enter relative mx-auto mt-16 min-h-72 w-full flex-1 overflow-hidden rounded-2xl bg-muted sm:mt-20 sm:min-h-[27rem]">
        <HeroReveal
          background={
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/assets/hero-background.jpg"
              alt=""
              crossOrigin="anonymous"
              className="absolute inset-0 h-full w-full object-cover"
            />
          }
        >
          <div className="absolute inset-0 flex overflow-y-auto p-5 sm:p-6">
            <div className="m-auto grid w-full max-w-xl grid-cols-2 gap-4 text-white sm:max-w-2xl">
              <div className="relative isolate overflow-hidden rounded-2xl border border-white/10 bg-black/25 p-5 sm:p-6">
                <div
                  aria-hidden
                  className="absolute inset-0 -z-10 rounded-[inherit] backdrop-blur-md"
                />
                <p className="text-sm font-medium sm:text-base"><T>Components</T></p>
                <p className="mt-8 text-4xl font-medium tracking-tight sm:mt-12 sm:text-6xl">
                  {COMPONENTS.length}
                </p>
                <p className="mt-3 font-mono text-[10px] tracking-widest text-white/70 uppercase sm:text-xs"><T>
                  And counting
                </T></p>
              </div>
              <div className="relative isolate overflow-hidden rounded-2xl border border-white/10 bg-black/25 p-5 sm:p-6">
                <div
                  aria-hidden
                  className="absolute inset-0 -z-10 rounded-[inherit] backdrop-blur-md"
                />
                <p className="text-sm font-medium sm:text-base"><T>Open source</T></p>
                <p className="mt-8 text-4xl font-medium tracking-tight sm:mt-12 sm:text-6xl">
                  100%
                </p>
                <p className="mt-3 font-mono text-[10px] tracking-widest text-white/70 uppercase sm:text-xs"><T>
                  Free forever
                </T></p>
              </div>
              <div className="col-span-2 relative isolate hidden overflow-hidden rounded-2xl border border-white/10 bg-black/25 p-5 sm:block sm:p-6">
                <div
                  aria-hidden
                  className="absolute inset-0 -z-10 rounded-[inherit] backdrop-blur-md"
                />
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium sm:text-base"><T>Install</T></p>
                  <p className="font-mono text-[10px] tracking-widest text-white/70 uppercase sm:text-xs"><T>
                    One command
                  </T></p>
                </div>
                <div className="mt-6 flex items-center justify-between gap-3 sm:mt-8">
                  <code className="min-w-0 font-mono text-[11px] leading-5 tracking-tight break-all whitespace-normal sm:overflow-x-auto sm:text-[13px] sm:leading-6 sm:break-normal sm:whitespace-nowrap">
                    {INSTALL_COMMAND}
                  </code>
                  <CopyButton
                    text={INSTALL_COMMAND}
                    className="shrink-0 text-white/70 hover:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </HeroReveal>
      </div>
    </section>
  );
}
