"use client";

import { T } from "@/components/common/language-provider";

import { ContactCard } from "@/components/common/contact-card";
import { Reveal } from "@/components/landing/reveal";
import { Stitches } from "@/components/landing/stitches";

export function Newsletter() {
  return (
      <section
        id="contact"
        aria-labelledby="contact-heading"
        className="relative border-t border-dashed border-border/60"
      >
        <Stitches />
        <div className="w-full px-5 py-24 sm:px-8 sm:py-32">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
            <Reveal>
              <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase"><T>
                Add to the box
              </T></p>
              <h2
                id="contact-heading"
                className="mt-3 text-3xl font-medium tracking-tighter text-balance sm:text-4xl"
              ><T>
                What should LeiBox collect next?
              </T></h2>
              <p className="mt-4 max-w-sm text-base leading-7 text-muted-foreground">
                <T>This collection grows with good discoveries. Share something useful, thoughtful, or simply worth a closer look.</T>
              </p>
            </Reveal>
            <Reveal delay={100}>
              <div className="rounded-[calc(var(--radius)+1.25rem)] border border-border/60 bg-muted/30 p-2">
                <div className="rounded-[calc(var(--radius)+0.75rem)] border border-dashed border-border/70 bg-background p-4 sm:p-5">
                  <ContactCard />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
  );
}
