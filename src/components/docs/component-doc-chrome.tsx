import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode, Ref } from "react";
import { T } from "@/components/common/language-provider";
import type { MotionDocLayout } from "@/lib/motion-doc-layout";

export function ComponentDocHeader({ title, description, tags, actions }: {
  title: string;
  description: string;
  tags?: string[];
  actions?: ReactNode;
}) {
  return (
    <>
      <Link href="/components" prefetch={false} className="mb-4 inline-flex items-center gap-1.5 rounded text-[13px] text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4">
        <ArrowLeft aria-hidden className="size-3.5" />
        <T>Back to components</T>
      </Link>
      <div className="flex items-start justify-between gap-4">
        <h1 className="min-w-0 text-3xl font-semibold tracking-[-0.02em]"><T>{title}</T></h1>
        {actions}
      </div>
      <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground"><T>{description}</T></p>
      {tags?.length ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {[...new Set(tags)].map(tag => (
            <span key={tag} className="rounded-full border border-border/60 px-2.5 py-0.5 text-[11.5px] text-muted-foreground">
              <T>{tag}</T>
            </span>
          ))}
        </div>
      ) : null}
    </>
  );
}

export function MotionDemoSection({ instructions, children }: { instructions?: string; children: ReactNode }) {
  return (
    <section className="mt-8" aria-label="Demo">
      <h2 className="text-lg font-semibold tracking-[-0.01em]"><T>Demo</T></h2>
      <p className="mt-2 text-[13px] text-muted-foreground"><T>{instructions}</T></p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function MotionDemoFrame({ width, height, responsive, viewportRef, children }: Pick<MotionDocLayout, "width" | "height" | "responsive"> & {
  viewportRef?: Ref<HTMLDivElement>;
  children: ReactNode;
}) {
  return (
    <div data-component-demo-panel className="overflow-hidden rounded-xl border border-border/60">
      <div
        ref={viewportRef}
        className="relative w-full overflow-hidden bg-white"
        style={responsive ? { height } : { aspectRatio: `${width} / ${height}`, maxHeight: height }}
      >
        {children}
      </div>
    </div>
  );
}
