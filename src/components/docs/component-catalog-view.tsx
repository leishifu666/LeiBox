"use client";

import Link from "next/link";
import { InteractionPreview } from "@/components/common/interaction-preview";
import { T } from "@/components/common/language-provider";
import { PreviewVideo } from "@/components/common/preview-video";
import { COMPONENT_CATALOG } from "@/data/component-catalog";
import { COMPONENT_CATEGORY_LABELS, componentCategories } from "@/data/component-categories";
import { useComponentCategory } from "@/hooks/use-component-category";
import { usesViewportMotionPlayback } from "@/lib/site-motion";

// Navigation already loads the catalogue. Render from that data without resending it in the route.
const cards = COMPONENT_CATALOG.map(component => ({ ...component, ...componentCategories(component.href) }));

export function ComponentCatalogView({ motionLayouts }: { motionLayouts: Record<string, string | undefined> }) {
  const [category] = useComponentCategory();
  const visible = category
    ? [
        ...cards.filter(({ primary }) => primary === category),
        ...cards.filter(({ secondary }) => secondary === category),
      ]
    : cards;
  const label = category ? COMPONENT_CATEGORY_LABELS.get(category) : undefined;

  return (
    <section id="interaction" className="mt-10 scroll-mt-24" aria-labelledby={label ? "components-category-title" : "components-title"}>
      <div aria-live="polite">
        {label && (
          <h2 id="components-category-title" className="mb-5 flex items-baseline gap-2 text-base font-medium tracking-tight">
            <T>{label}</T>
            <span className="text-sm font-normal text-muted-foreground tabular-nums">{visible.length}</span>
          </h2>
        )}
      </div>
      <ul className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map(component => {
          const { href, name, description, primary } = component;
          const wide = component.kind === "interaction" && usesViewportMotionPlayback(component.slug);
          return (
            <li key={href} data-preview-card data-component-card={href} data-component-doc-layout={motionLayouts[href]} className="group relative flex h-full flex-col gap-4">
              <div className={`relative flex shrink-0 items-center justify-center overflow-hidden ${wide ? "aspect-[16/10] bg-white" : "aspect-4/3 rounded-xl bg-[#f4f4f4]"}`}>
                {component.kind === "interaction" ? (
                  <InteractionPreview
                    slug={component.slug}
                    poster={component.preview}
                    source={component.sourceFile ? `/motion/${component.slug}.html` : undefined}
                    width={component.canvasWidth}
                    height={component.canvasHeight}
                  />
                ) : (
                  <PreviewVideo src={component.video} className="absolute inset-0 size-full object-cover" />
                )}
              </div>
              <Link prefetch={false} href={href} className="block px-1 after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4">
                {label ? (
                  <h3 className="text-[15px] font-medium tracking-tight"><T>{name}</T></h3>
                ) : (
                  <h2 className="text-[15px] font-medium tracking-tight"><T>{name}</T></h2>
                )}
                <p className="mt-1 text-sm leading-6 text-pretty text-muted-foreground"><T>{description}</T></p>
                {category && primary !== category && (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    <T>Main category</T> · <T>{COMPONENT_CATEGORY_LABELS.get(primary)}</T>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
