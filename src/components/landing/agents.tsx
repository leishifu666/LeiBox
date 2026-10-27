"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { T } from "@/components/common/language-provider";
import { ClaudePanel } from "@/components/landing/claude-panel";
import { Reveal } from "@/components/landing/reveal";
import { Stitches } from "@/components/landing/stitches";

export function Agents() {
  return (
    <section
      aria-labelledby="agents-heading"
      className="relative border-t border-dashed border-border/60"
    >
      <Stitches />
      <div className="w-full px-5 py-24 sm:px-8 sm:py-32">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <Reveal className="order-2 lg:order-1">
            <ClaudePanel kind="agent" />
          </Reveal>

          <Reveal delay={100} className="order-1 lg:order-2">
            <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase"><T>
              AI-ready
            </T></p>
            <h2
              id="agents-heading"
              className="mt-3 text-3xl font-medium tracking-tighter text-balance sm:text-4xl"
            ><T>
              Ready for your AI workflow.
            </T></h2>
            <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground"><T>
              Install LeiBox Skill once. Ask your AI to find a component,
              choose your framework, and pull the complete source into your project.
            </T></p>
            <Link
              href="/docs/mcp#install-skill"
              className="group mt-6 inline-flex items-center gap-1.5 text-[15px] font-medium text-foreground transition-colors duration-150 hover:text-muted-foreground"
            ><T>
              Install the LeiBox Skill
              </T><ArrowRight
                aria-hidden
                strokeWidth={2.25}
                className="size-[15px]"
              />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
