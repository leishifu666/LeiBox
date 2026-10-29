import { T } from "@/components/common/language-provider";
import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/landing/footer";
import { PreviewVideo } from "@/components/common/preview-video";
import { InteractionPreview } from "@/components/common/interaction-preview";
import { COMPONENT_CATALOG } from "@/data/component-catalog";

export const metadata: Metadata = {
  title: "Components",
  description:
    "Browse all LeiBox components, interactions, and visual effects in one collection, with live previews, source code, and recreation prompts.",
  alternates: { canonical: "/components" },
};

export default function ComponentsPage() {
  return (
    <article className="page-enter mx-auto w-full max-w-5xl">
      <h1 id="components-title" className="text-3xl font-semibold tracking-[-0.02em]"><T>Components</T></h1>
      <p className="mt-3 max-w-xl text-base leading-7 text-balance text-muted-foreground"><T>
        Creative components you can drop into any project. Browse the collection
        and make them yours. More on the way.
      </T></p>

      <section id="interaction" className="mt-10 scroll-mt-24" aria-labelledby="components-title">
        <ul className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {COMPONENT_CATALOG.map((component) => (
            <li key={component.href} data-preview-card data-component-card={component.href} className="group relative flex h-full flex-col gap-4">
                <div className="relative flex aspect-4/3 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f4f4f4]">
                  {component.kind === "interaction" ? (
                  <InteractionPreview slug={component.slug} poster={component.preview} source={component.sourceFile ? `/motion/${component.slug}.html` : undefined} width={component.canvasWidth} height={component.canvasHeight} />
                  ) : (
                    <PreviewVideo src={component.video} className="absolute inset-0 size-full object-cover" />
                  )}
                </div>
                <Link prefetch={false} href={component.href} className="block px-1 after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4">
                  <h2 className="text-[15px] font-medium tracking-tight"><T>{component.name}</T></h2>
                  <p className="mt-1 text-sm leading-6 text-pretty text-muted-foreground"><T>{component.description}</T></p>
                </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-24">
        <Footer variant="docs" />
      </div>
    </article>
  );
}
