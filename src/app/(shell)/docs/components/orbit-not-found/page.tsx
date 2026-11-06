import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { T } from "@/components/common/language-provider";
import { ComponentDocHeader, MotionDemoSection } from "@/components/docs/component-doc-chrome";
import { OrbitNotFoundPreview } from "@/components/docs/orbit-not-found-preview";
import { Footer } from "@/components/landing/footer";
import { ORBIT_NOT_FOUND } from "@/data/interaction-previews";

export const metadata: Metadata = {
  title: "组件环游 404",
  description: ORBIT_NOT_FOUND.description,
  alternates: { canonical: ORBIT_NOT_FOUND.href },
};

export default function OrbitNotFoundDoc() {
  return (
    <div className="page-enter">
      <article className="mx-auto w-full max-w-3xl" data-component-document={ORBIT_NOT_FOUND.slug}>
        <ComponentDocHeader
          title={ORBIT_NOT_FOUND.name}
          description={ORBIT_NOT_FOUND.description}
          tags={[ORBIT_NOT_FOUND.category, "Next.js", "GSAP"]}
        />
        <MotionDemoSection instructions="Hover over a card or focus it with Tab to pause the orbit. Select it to view the component.">
          <OrbitNotFoundPreview />
          <div className="mt-3 flex justify-center">
            <Link href="/demos/orbit-not-found" prefetch={false} className="inline-flex items-center gap-1.5 rounded px-1 py-1 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2">
              <T>Open full preview</T><ArrowUpRight aria-hidden className="size-3.5" />
            </Link>
          </div>
        </MotionDemoSection>
        <section className="mt-8" aria-labelledby="orbit-source">
          <h2 id="orbit-source" className="text-lg font-semibold tracking-[-0.01em]"><T>Code</T></h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            <T>LeiBox renders this component from Next.js app/not-found.tsx. The items prop supplies the previews and destination links.</T>
          </p>
          <a href="https://github.com/leishifu666/LeiBox/tree/main/src/components/not-found-experiments" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2">
            <T>View source on GitHub</T><ArrowUpRight aria-hidden className="size-3.5" />
          </a>
        </section>
      </article>
      <div className="mx-auto mt-24 w-full max-w-3xl"><Footer variant="docs" /></div>
    </div>
  );
}
