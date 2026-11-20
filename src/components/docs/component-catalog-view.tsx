"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { T } from "@/components/common/language-provider";
import { COMPONENT_CATEGORY_LABELS, type ComponentCategory } from "@/data/component-categories";
import { useComponentCategory } from "@/hooks/use-component-category";

export interface ComponentCatalogCard {
  href: string;
  name: string;
  description: string;
  primary: ComponentCategory;
  secondary?: ComponentCategory;
  preview: ReactNode;
  layout?: string;
  wide: boolean;
}

export function ComponentCatalogView({ cards }: { cards: ComponentCatalogCard[] }) {
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
        {visible.map(({ href, name, description, primary, preview, layout, wide }) => (
          <li key={href} data-preview-card data-component-card={href} data-component-doc-layout={layout} className="group relative flex h-full flex-col gap-4">
            <div className={`relative flex shrink-0 items-center justify-center overflow-hidden ${wide ? "aspect-[16/10] bg-white" : "aspect-4/3 rounded-xl bg-[#f4f4f4]"}`}>
              {preview}
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
        ))}
      </ul>
    </section>
  );
}
