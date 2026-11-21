import { T } from "@/components/common/language-provider";
import type { Metadata } from "next";

import { ComponentCatalogView } from "@/components/docs/component-catalog-view";
import { Footer } from "@/components/landing/footer";
import { INTERACTION_COMPONENTS } from "@/data/interaction-components";
import { motionDocLayout } from "@/lib/motion-doc-layout";

const motionLayouts = Object.fromEntries(INTERACTION_COMPONENTS
  .filter(entry => entry.href.startsWith("/docs/animations/"))
  .map(entry => [entry.href, JSON.stringify(motionDocLayout(entry))]));

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

      <ComponentCatalogView motionLayouts={motionLayouts} />

      <div className="mt-24">
        <Footer variant="docs" />
      </div>
    </article>
  );
}
