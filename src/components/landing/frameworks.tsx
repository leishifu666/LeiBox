import { T } from "@/components/common/language-provider";

import { FrameworkTabs } from "@/components/landing/framework-tabs";
import { Reveal } from "@/components/landing/reveal";
import { Stitches } from "@/components/landing/stitches";

export function Frameworks() {
  return (
    <section
      aria-labelledby="frameworks-heading"
      className="relative border-t border-dashed border-border/60"
    >
      <Stitches />
      <div className="w-full px-5 py-24 sm:px-8 sm:py-32">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <Reveal>
            <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase"><T>
              Framework agnostic
            </T></p>
            <h2
              id="frameworks-heading"
              className="mt-3 text-3xl font-medium tracking-tighter text-balance sm:text-4xl"
            ><T>
              One component, six flavors.
            </T></h2>
            <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground"><T>
              The GlassFolder example includes React, Vue, Svelte, Solid, Preact,
              and vanilla TypeScript versions. Check the source, dependencies,
              and license notes before using it.
            </T></p>
          </Reveal>
          <Reveal delay={100}>
            <FrameworkTabs />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
