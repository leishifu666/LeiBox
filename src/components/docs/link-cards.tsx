import { T as TranslatedText } from "@/components/common/language-provider";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface LinkCard {
  /** Destination route. */
  href: string;
  /** Card title. */
  title: string;
  /** Short muted description shown under the title. */
  description: string;
}

export function LinkCards({ items }: { items: LinkCard[] }) {
  return (
    <div className="not-typeset grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group flex min-w-0 items-center gap-3 rounded-xl border border-border/60 px-4 py-3.5 transition-colors duration-150 hover:border-border hover:bg-muted/30"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-foreground">
              <TranslatedText>{item.title}</TranslatedText>
            </span>
            <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">
              <TranslatedText>{item.description}</TranslatedText>
            </span>
          </span>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors duration-150 group-hover:border-foreground/20 group-hover:text-foreground">
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
            />
          </span>
        </Link>
      ))}
    </div>
  );
}
