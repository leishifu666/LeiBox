"use client";

import { useState } from "react";
import { T } from "@/components/common/language-provider";
import { ClaudePanel } from "@/components/landing/claude-panel";
import { Reveal } from "@/components/landing/reveal";
import { Stitches } from "@/components/landing/stitches";

const STEPS = [
  {
    index: "01",
    title: "Pick a component",
    body: "Browse the library and find the effect that fits. Every demo on this site is the real component, running live.",
    window: "LeiBox / Components",
  },
  {
    index: "02",
    title: "Check the source and license",
    body: "Each item keeps its original source and license. Copy or install it only when that license permits.",
    window: "Canvas UI · install example",
  },
  {
    index: "03",
    title: "Bring the idea into your project",
    body: "Use the documented options as a starting point, then adapt the interaction and layout to fit your interface.",
    window: "hero.tsx",
  },
];

export function HowItWorks() {
  const [phase, setPhase] = useState(0);
  const [stepRequest, setStepRequest] = useState<{ index: number; version: number }>();
  const goTo = (index: number) => { setPhase(index); setStepRequest(previous => ({ index, version: (previous?.version ?? 0) + 1 })); };

  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="relative border-t border-dashed border-border/60"
    >
      <Stitches />
      <div className="w-full px-5 py-24 sm:px-8 sm:py-32">
        <Reveal>
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase"><T>
            How it works
          </T></p>
          <h2
            id="how-it-works-heading"
            className="mt-3 text-3xl font-medium tracking-tighter text-balance sm:text-4xl"
          ><T>
            Explore, understand, adapt.
          </T></h2>
        </Reveal>

        <Reveal
          delay={80}
          className="mt-12 grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16"
        >
          <ol className="order-2 flex flex-col lg:order-1">
            {STEPS.map((step, index) => {
              const active = phase === index;
              return (
                <li key={step.index}>
                  <button
                    type="button"
                    onClick={() => goTo(index)}
                    aria-current={active ? "step" : undefined}
                    className="w-full py-5 text-left"
                  >
                    <p
                      className={`font-mono text-sm transition-colors duration-200 ${
                        active ? "text-foreground" : "text-muted-foreground/70"
                      }`}
                    >
                      {step.index}
                    </p>
                    <h3
                      className={`mt-2 text-lg font-medium tracking-tight transition-colors duration-200 ${
                        active ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      <T>{step.title}</T>
                    </h3>
                    <div
                      className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                        active ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p
                          className={`max-w-sm pt-2 text-sm leading-6 text-muted-foreground transition-opacity duration-300 ${
                            active ? "opacity-100" : "opacity-0"
                          }`}
                        >
                          <T>{step.body}</T>
                        </p>
                      </div>
                    </div>
                  </button>
                  <div className="relative h-px overflow-hidden bg-border/60">
                    {active && <div className="absolute inset-0 bg-foreground" />}
                  </div>
                </li>
              );
            })}
          </ol>

          <ClaudePanel kind="discovery" className="order-1 min-w-0 lg:order-2" stepRequest={stepRequest} onStepChange={setPhase} />
        </Reveal>
      </div>
    </section>
  );
}
