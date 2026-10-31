"use client";

import { T } from "@/components/common/language-provider";
import { ChoiceSelect } from "@/components/docs/choice-select";
import { SnippetTabs } from "@/components/docs/snippet-tabs";
import { CodeBlock } from "@/components/docs/code-block";
import { CopyButton } from "@/components/docs/copy-button";
import { usePreference } from "@/hooks/use-preference";
import { DeferredCode } from "./deferred-code";
import type { MotionPackageRef as MotionPackage } from "@/lib/doc-asset-types";

function usePackage(packages: MotionPackage[]) {
  const [framework, setFramework] = usePreference("framework", "react", packages.map(pack => pack.framework));
  return { active: packages.find(pack => pack.framework === framework) ?? packages[0], setFramework };
}
export function MotionInstallTabs({ packages }: { packages: MotionPackage[] }) {
  const { active, setFramework } = usePackage(packages);
  return <div>
    <div className="mb-3"><ChoiceSelect label="Framework" options={packages.map(pack => ({ id: pack.framework, label: pack.label }))} value={active.framework} onValueChange={setFramework} /></div>
    <CodeBlock source={active.install} />
    <p className="mt-3 text-[13px] leading-6 text-muted-foreground"><T>Keep the four package files together. Styles and fonts are included; your framework build tool compiles the entry file.</T></p>
  </div>;
}
export function MotionCodeTabs({ packages }: { packages: MotionPackage[] }) {
  const { active, setFramework } = usePackage(packages);
  return <div>
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <ChoiceSelect label="Framework" options={packages.map(pack => ({ id: pack.framework, label: pack.label }))} value={active.framework} onValueChange={setFramework} />
      <CopyButton sourceUrl={active.bundleUrl} label="Copy full code bundle" />
    </div>
    <SnippetTabs key={active.framework} storageKey={`motion-${active.slug}-${active.framework}`} tabs={active.files} label="Source file" />
  </div>;
}
export function MotionUsage({ packages }: { packages: MotionPackage[] }) {
  const { active } = usePackage(packages);
  return <section className="mt-8" aria-label="Usage">
    <h2 id="usage" className="scroll-mt-24 text-lg font-semibold tracking-[-0.01em]"><T>Usage</T></h2>
    <div className="mt-3"><CodeBlock source={active.usage} fileName={active.framework === "vue" ? "App.vue" : active.framework === "svelte" ? "App.svelte" : active.framework === "vanilla" ? "app.ts" : "App.tsx"} /></div>
    <p className="mt-3 text-[13px] leading-6 text-muted-foreground"><T>{active.slug === "deep-agent-composer" || active.slug === "reasoning-effort-slider" ? "These adapters mount the original Deep Agent React components. React and React DOM are required in every framework." : "The shared native core handles the interaction. Each framework mounts, updates, and destroys its own instance."}</T></p>
  </section>;
}
export function MotionPrompt({ packages }: { packages: MotionPackage[] }) {
  const { active } = usePackage(packages);
  return <section className="mt-8" aria-label="Recreation prompt">
    <div className="flex items-center justify-between gap-3"><h2 id="prompt" className="scroll-mt-24 text-lg font-semibold tracking-[-0.01em]"><T>Recreation prompt</T></h2><CopyButton text={active.prompt} sourceUrl={active.promptUrl} label="Copy prompt" /></div>
    {active.promptUrl ? <div className="mt-3 overflow-hidden rounded-xl border border-border/60"><DeferredCode url={active.promptUrl} prose /></div> : <pre translate="no" className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-border/60 p-4 font-sans text-[13px] leading-6 whitespace-pre-wrap">{active.prompt}</pre>}
  </section>;
}
