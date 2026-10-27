import { T as TranslatedText } from "@/components/common/language-provider";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { ApiReference, type ApiProp } from "@/components/docs/api-reference";
import { CodeTabs, type CodeVariant } from "@/components/docs/code-tabs";
import { CopyMenu, type StandaloneCopyContent } from "@/components/docs/copy-menu";
import { CopyButton } from "@/components/docs/copy-button";
import { DependencyTabs } from "@/components/docs/dependency-tabs";
import { COMPONENT_CATALOG } from "@/data/component-catalog";
import type { MotionPackageRef } from "@/lib/doc-asset-types";
import { getDocAssets } from "@/lib/doc-assets";
import { MotionPrompt } from "@/components/docs/motion-framework-tabs";
import { cn } from "@/lib/utils";

export interface ComponentDocProps {
  title: string;
  description: string;
  /** Optional boxed demo. Omit when the whole page is the demo. */
  preview?: ReactNode;
  /** Optional extra content rendered before the Install section. */
  beforeInstall?: ReactNode;
  /** One entry per framework, pre-highlighted on the server. */
  variants: CodeVariant[];
  /** Registry item base name, e.g. "liquid" for /r/liquid-react.json. */
  installItem: string;
  /** Small tag chips shown under the description, e.g. ["html-in-canvas"]. */
  tags?: string[];
  /**
   * Show a warning above the demo when Chrome's HTML-in-Canvas flag is off.
   * Set this only for effects that don't render without the flag, not for
   * effects that degrade to a usable fallback.
   */
  requiresHtmlInCanvas?: boolean;
  /** Props table shown in the API reference section. */
  apiReference?: ApiProp[];
  /** Local sources use the same document layout without a registry install. */
  copyContent?: StandaloneCopyContent;
  installation?: ReactNode;
  code?: ReactNode;
  afterCode?: ReactNode;
  recreationPrompt?: string;
  motionPackages?: MotionPackageRef[];
}

export async function ComponentDoc({
  title,
  description,
  preview,
  beforeInstall,
  installItem,
  tags,
  apiReference,
  copyContent,
  installation,
  code,
  afterCode,
  recreationPrompt,
  motionPackages,
  requiresHtmlInCanvas = false,
}: ComponentDocProps) {
  const dependencies = motionPackages?.[0]?.dependencies ?? [];
  const devDependencies: string[] = [];
  const hasWebGPU = false;

  return (
    <article className="mx-auto w-full max-w-3xl" data-component-document={installItem}>
      <div className="flex items-start justify-between gap-4">
        <h1 className="min-w-0 text-3xl font-semibold tracking-[-0.02em]">
          <TranslatedText>{title}</TranslatedText>
        </h1>
        {copyContent ? <CopyMenu title={title} standalone={copyContent} motionPackages={motionPackages} /> : null}
      </div>
      <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
        <TranslatedText>{description}</TranslatedText>
      </p>
      {(tags && tags.length > 0) || hasWebGPU ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {Array.from(
            new Set([...(tags ?? []), ...(hasWebGPU ? ["webgl", "webgpu"] : [])]),
          ).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border/60 px-2.5 py-0.5 text-[11.5px] text-muted-foreground"
            >
              <TranslatedText>{tag}</TranslatedText>
            </span>
          ))}
        </div>
      ) : null}


      {preview ? (
        <section className="mt-8" aria-label="Preview">
          <div data-component-demo-panel className="relative h-105 touch-none overflow-hidden rounded-xl border border-border/60 bg-background">
            {preview}
          </div>
        </section>
      ) : null}

      {beforeInstall}

      <section className="mt-8" aria-label="Installation">
        <h2
          id="install"
          className="scroll-mt-24 text-lg font-semibold tracking-[-0.01em]"
        ><TranslatedText>
          Install
        </TranslatedText></h2>
        <div className="mt-3">
          {installation}
        </div>
      </section>

      {dependencies.length > 0 || devDependencies.length > 0 || hasWebGPU ? (
        <section className="mt-8" aria-label="Dependencies">
          <h2
            id="dependencies"
            className="scroll-mt-24 text-lg font-semibold tracking-[-0.01em]"
          ><TranslatedText>
            Dependencies
          </TranslatedText></h2>
          <p className="mt-2 text-[13px] text-muted-foreground"><TranslatedText>
            The install command above adds these automatically. If you copy the
            source by hand, install them yourself.
          </TranslatedText></p>
          <div className="mt-3">
            <DependencyTabs
              dependencies={dependencies}
              devDependencies={devDependencies}
              webgpuDependencies={hasWebGPU ? [] : undefined}
              webgpuDevDependencies={
                hasWebGPU ? [] : undefined
              }
            />
          </div>
        </section>
      ) : null}

      <section className="mt-8" aria-label="Code">
        <h2
          id="code"
          className="scroll-mt-24 text-lg font-semibold tracking-[-0.01em]"
        ><TranslatedText>
          Code
        </TranslatedText></h2>
        <div className="mt-3">
          {code}
        </div>
      </section>

      {afterCode}

      {motionPackages ? <MotionPrompt packages={motionPackages} /> : recreationPrompt ? (
        <section className="mt-8" aria-label="Recreation prompt">
          <div className="flex items-center justify-between gap-3">
            <h2 id="prompt" className="scroll-mt-24 text-lg font-semibold tracking-[-0.01em]"><TranslatedText>Recreation prompt</TranslatedText></h2>
            <CopyButton text={recreationPrompt} label="Copy prompt" />
          </div>
          <pre translate="no" className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-border/60 p-4 font-sans text-[13px] leading-6 whitespace-pre-wrap">{recreationPrompt}</pre>
        </section>
      ) : null}

      {apiReference && apiReference.length > 0 ? (
        <section className="mt-8" aria-label="API reference">
          <h2
            id="api-reference"
            className="scroll-mt-24 text-lg font-semibold tracking-[-0.01em]"
          ><TranslatedText>
            API reference
          </TranslatedText></h2>
          <div className="mt-3">
            <ApiReference props={apiReference} />
          </div>
        </section>
      ) : null}

      <ComponentPager slug={installItem} />
    </article>
  );
}

function ComponentPager({ slug }: { slug: string }) {
  const entries = COMPONENT_CATALOG;
  const index = entries.findIndex((entry) => entry.href.endsWith(`/${slug}`));
  if (index === -1) return null;
  const prev = index > 0 ? entries[index - 1] : null;
  const next = index < entries.length - 1 ? entries[index + 1] : null;

  return (
    <nav
      aria-label="Component pagination"
      className="not-typeset mt-12 grid grid-cols-1 gap-3 border-t border-border/60 pt-6 sm:grid-cols-2"
    >
      {prev ? <PagerLink entry={prev} direction="prev" /> : null}
      {next ? <PagerLink entry={next} direction="next" /> : null}
    </nav>
  );
}

function PagerLink({
  entry,
  direction,
}: {
  entry: { href: string; name: string };
  direction: "prev" | "next";
}) {
  const isPrev = direction === "prev";
  const Arrow = isPrev ? ArrowLeft : ArrowRight;

  const arrow = (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors duration-150 group-hover:border-foreground/20 group-hover:text-foreground">
      <Arrow
        aria-hidden
        className={cn(
          "size-4 transition-transform duration-200 ease-out",
          isPrev ? "group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5",
        )}
      />
    </span>
  );

  return (
    <Link prefetch={false}
      href={entry.href}
      rel={direction}
      className={cn(
        "group flex min-w-0 items-center gap-3 rounded-xl border border-border/60 px-4 py-3.5 transition-colors duration-150 hover:border-border hover:bg-muted/30",
        !isPrev && "text-right sm:col-start-2",
      )}
    >
      {isPrev ? arrow : null}
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          <TranslatedText>{isPrev ? "Previous" : "Next"}</TranslatedText>
        </span>
        <span className="mt-0.5 block truncate text-sm font-medium text-foreground">
          <TranslatedText>{entry.name}</TranslatedText>
        </span>
      </span>
      {isPrev ? null : arrow}
    </Link>
  );
}
