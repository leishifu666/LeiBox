"use client";

import { CopyButton } from "@/components/docs/copy-button";
import { ChoiceSelect } from "@/components/docs/choice-select";
import {
  RENDERERS,
  resolveFramework,
  useRenderer,
} from "@/components/docs/renderer";
import { usePreference } from "@/hooks/use-preference";

export interface CodeVariant {
  /** Short identifier, e.g. "react". */
  id: string;
  /** Tab label, e.g. "React". */
  label: string;
  /** File name shown above the code. */
  fileName: string;
  /** Raw source, used for the copy button. */
  source: string;
  /** Pre-highlighted HTML produced on the server. */
  html: string;
}

export function CodeTabs({
  variants,
  webgpuVariants = [],
}: {
  /** WebGL sources, one per framework. */
  variants: CodeVariant[];
  /** WebGPU (vgpu) sources; empty when the component has no WebGPU build. */
  webgpuVariants?: CodeVariant[];
}) {
  const hasWebGPU = webgpuVariants.length > 0;
  const [renderer, setRenderer] = useRenderer(hasWebGPU);
  const list = renderer === "webgpu" ? webgpuVariants : variants;
  const [storedId, setActiveId] = usePreference(
    "framework",
    variants[0]?.id ?? "react",
    variants.map((variant) => variant.id),
  );
  const activeId = resolveFramework(storedId, renderer);
  const active = list.find((v) => v.id === activeId) ?? list[0];

  if (!active) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/40 pr-1.5 pl-2">
        <div className="flex min-w-0 items-center gap-1">
          {hasWebGPU ? (
            <ChoiceSelect
              label="Renderer"
              options={RENDERERS}
              value={renderer}
              onValueChange={setRenderer}
            />
          ) : null}
          <ChoiceSelect
            label="Framework"
            options={list}
            value={active.id}
            onValueChange={setActiveId}
          />
        </div>
        <CopyButton text={active.source} />
      </div>
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-2">
        <span className="text-[12px] text-muted-foreground">
          {active.fileName}
        </span>
        <span className="text-[12px] text-muted-foreground">
          {renderer === "webgpu" ? "WebGPU · WGSL" : "WebGL · GLSL"}
        </span>
      </div>
      <div
        className="docs-code max-h-[480px] overflow-y-auto text-[13px] leading-6"
        dangerouslySetInnerHTML={{ __html: active.html }}
      />
    </div>
  );
}
