import { T as TranslatedText } from "@/components/common/language-provider";

import type { Metadata } from "next";

import { CodeBlock } from "@/components/docs/code-block";
import { CodeTabs, type CodeVariant } from "@/components/docs/code-tabs";
import { CopyButton } from "@/components/docs/copy-button";
import { highlight } from "@/components/docs/highlight";
import { InstallTabs } from "@/components/docs/install-tabs";
import { LinkCards } from "@/components/docs/link-cards";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Installation",
  description:
    "Install Canvas UI components with the shadcn CLI or copy the source directly into your project.",
  alternates: { canonical: "/docs/installation" },
};

const USAGE = [
  {
    id: "react",
    label: "React",
    fileName: "page.tsx",
    lang: "tsx",
    source: `import { Liquid } from "@/components/canvasui/Liquid";

export default function Page() {
  return (
    <Liquid rainbow style={{ height: 480 }}>
      <YourContent />
    </Liquid>
  );
}`,
  },
  {
    id: "vue",
    label: "Vue",
    fileName: "App.vue",
    lang: "vue",
    source: `<script setup lang="ts">
import Liquid from "@/components/canvasui/Liquid.vue";
</script>

<template>
  <Liquid rainbow style="height: 480px">
    <YourContent />
  </Liquid>
</template>`,
  },
  {
    id: "svelte",
    label: "Svelte",
    fileName: "+page.svelte",
    lang: "svelte",
    source: `<script lang="ts">
  import Liquid from "$lib/components/canvasui/Liquid.svelte";
</script>

<Liquid rainbow>
  <YourContent />
</Liquid>`,
  },
  {
    id: "solid",
    label: "Solid",
    fileName: "App.tsx",
    lang: "tsx",
    source: `import { Liquid } from "@/components/canvasui/Liquid";

export default function App() {
  return (
    <Liquid rainbow style={{ height: "480px" }}>
      <YourContent />
    </Liquid>
  );
}`,
  },
  {
    id: "preact",
    label: "Preact",
    fileName: "App.tsx",
    lang: "tsx",
    source: `import { Liquid } from "@/components/canvasui/Liquid";

export default function App() {
  return (
    <Liquid rainbow style={{ height: "480px" }}>
      <YourContent />
    </Liquid>
  );
}`,
  },
  {
    id: "vanilla",
    label: "Vanilla",
    fileName: "main.ts",
    lang: "typescript",
    source: `import { createLiquid } from "@/components/canvasui/LiquidVanilla";

const liquid = createLiquid(
  {
    source: document.querySelector<HTMLCanvasElement>("#source")!,
    content: document.querySelector<HTMLDivElement>("#content")!,
    output: document.querySelector<HTMLCanvasElement>("#output")!,
  },
  { rainbow: true },
);

liquid.setOptions({ radius: 0.4 });
liquid.destroy();`,
  },
] as const;

const PAGE_MARKDOWN = `# Installation

Install any component with the shadcn CLI, or copy the source straight from its docs page. Either way, the code ends up in your project.

## Requirements

Some components are built on the html-in-canvas API and currently need Chrome with the canvas-draw-element flag enabled. Each component page tells you if it applies. Paste this into your address bar, enable the flag, and restart:

\`\`\`
chrome://flags/#canvas-draw-element
\`\`\`

For production, Chrome offers an [origin trial](https://developer.chrome.com/blog/html-in-canvas-origin-trial) that enables the API for your visitors without any flags. This site runs on an origin trial token itself, which is why the effects work here in a plain Chrome install. Tokens are bound to a specific domain, so this only benefits canvasui.dev: to get the same on your own site, register your domain for the trial and serve the token via a meta tag or HTTP header. In browsers without support, components fall back automatically: your content renders as regular HTML and no errors are thrown.

Beyond that, TypeScript is recommended, since every file ships as typed source. React components target React 19, Solid components target Solid 1.9, Preact components target Preact 10, Vue components target Vue 3.5, and Svelte components target Svelte 5. Any dependencies a component needs are installed by the CLI and listed on its docs page.

Renderers: every effect has a WebGL build and a WebGPU build where available. WebGL is the default. WebGPU builds use vgpu, WGSL shaders, and the -webgpu registry suffix. Read the rendering guide: https://canvasui.dev/docs/rendering

## Install with the CLI

Every component has a registry entry per framework and per renderer: six WebGL entries and six WebGPU entries. Pick your package manager, renderer, and framework below, and the docs remember your choices everywhere.

\`\`\`sh
npx shadcn@latest add @canvas-ui/liquid-react
\`\`\`

The renderer selector switches the command between the WebGL item and the WebGPU item. WebGPU registry names add -webgpu after the framework, for example @canvas-ui/liquid-react-webgpu.

The CLI drops the file into components/canvasui/ in your project (Svelte: src/lib/components/canvasui/, so the \`$lib\` import resolves). If you have not used shadcn before, run \`npx shadcn@latest init\` first.

## Install manually

Open the component page, switch the code block to your framework and renderer, copy the file into your project, and import it.

## Use it

Wrap the part of your interface the effect should run over. Props are optional and can be changed live.

\`\`\`tsx
${USAGE[0].source}
\`\`\`

For vanilla WebGPU, import from LiquidWebGPU.ts instead of LiquidVanilla.ts. The createLiquid call is the same.

## Next steps

- Read the rendering guide: https://canvasui.dev/docs/rendering
- Try Liquid, the first component: https://canvasui.dev/docs/components/liquid
- Set up the MCP server: https://canvasui.dev/docs/mcp
`;

export default async function InstallationPage() {
  const usageVariants: CodeVariant[] = await Promise.all(
    USAGE.map(async (entry) => ({
      id: entry.id,
      label: entry.label,
      fileName: entry.fileName,
      source: entry.source,
      html: await highlight(entry.source, entry.lang),
    })),
  );

  return (
    <article className="page-enter mx-auto w-full max-w-3xl">
      <div className="typeset typeset-docs">
        <div className="flex items-start justify-between gap-4">
          <h1><TranslatedText>Installation</TranslatedText></h1>
          <CopyButton
            text={PAGE_MARKDOWN}
            label="Copy as Markdown"
            className="mt-1 shrink-0 border border-border/70 px-3"
          />
        </div>
        <p className="max-w-xl text-muted-foreground"><TranslatedText>
          Install any component with the shadcn CLI, or copy the source straight
          from its docs page. Either way, the code ends up in your project.
        </TranslatedText></p>

        <h2><TranslatedText>Requirements</TranslatedText></h2>
        <p><TranslatedText>
          Some components are built on the html-in-canvas API and currently need
          Chrome with the canvas-draw-element flag enabled. Each component page
          tells you if it applies. Paste this into your address bar, enable the
          flag, and restart:
        </TranslatedText></p>
        <div className="my-6">
          <CodeBlock source="chrome://flags/#canvas-draw-element" />
        </div>
        <p><TranslatedText>
          For production, Chrome offers an</TranslatedText>{" "}
          <a
            href="https://developer.chrome.com/blog/html-in-canvas-origin-trial"
            target="_blank"
            rel="noreferrer"
          ><TranslatedText>
            origin trial
          </TranslatedText></a>{" "}<TranslatedText>
          that enables the API for your visitors without any flags. This site
          runs on an origin trial token itself, which is why the effects work
          here in a plain Chrome install. Tokens are bound to a specific
          domain, so this only benefits canvasui.dev: to get the same on your
          own site, register your domain for the trial and serve the token via
          a meta tag or HTTP header. In browsers without support, components
          fall back automatically: your content renders as regular HTML and no
          errors are thrown.
        </TranslatedText></p>
        <p><TranslatedText>
          Beyond that, TypeScript is recommended, since every file ships as
          typed source. React components target React 19, Solid components
          target Solid 1.9, Preact components target Preact 10, Vue components
          target Vue 3.5, and Svelte components target Svelte 5. Any
          dependencies a component needs are installed by the CLI and listed on
          its docs page.
        </TranslatedText></p>
        <p><TranslatedText>
          Renderers: every effect has a WebGL build and a WebGPU build where
          available. WebGL is the default. WebGPU builds use </TranslatedText><code>vgpu</code><TranslatedText>,
          WGSL shaders, and the </TranslatedText><code>-webgpu</code><TranslatedText> registry suffix. Read the</TranslatedText>{" "}
          <a href="/docs/rendering"><TranslatedText>rendering guide</TranslatedText></a>.
        </p>

        <h2><TranslatedText>Install with the CLI</TranslatedText></h2>
        <p><TranslatedText>
          Every component has a registry entry per framework and per renderer:
          six WebGL entries and six WebGPU entries. Pick your package manager,
          renderer, and framework below, and the docs remember your choices
          everywhere.
        </TranslatedText></p>
        <div className="not-typeset my-6">
          <InstallTabs item="liquid" hasWebGPU />
        </div>
        <p><TranslatedText>
          The renderer selector switches the command between the WebGL item and
          the WebGPU item. WebGPU registry names add </TranslatedText><code>-webgpu</code><TranslatedText> after
          the framework, for example </TranslatedText><code>@canvas-ui/liquid-react-webgpu</code>.
        </p>
        <p><TranslatedText>
          The CLI drops the file into </TranslatedText><code>components/canvasui/</code><TranslatedText> in your
          project (Svelte: </TranslatedText><code>src/lib/components/canvasui/</code><TranslatedText>, so the</TranslatedText>{" "}
          <code>$lib</code><TranslatedText> import resolves). If you have not used shadcn
          before, run </TranslatedText><code>npx shadcn@latest init</code><TranslatedText> first.
        </TranslatedText></p>

        <h2><TranslatedText>Install manually</TranslatedText></h2>
        <p><TranslatedText>
          Prefer not to use a CLI? Open the component page, switch the code
          block to your framework and renderer, copy the file into your project,
          and import it.
        </TranslatedText></p>

        <h2><TranslatedText>Use it</TranslatedText></h2>
        <p><TranslatedText>
          Wrap the part of your interface the effect should run over. Props are
          optional and can be changed live.
        </TranslatedText></p>
        <div className="not-typeset my-6">
          <CodeTabs variants={usageVariants} />
        </div>
        <p><TranslatedText>
          For vanilla WebGPU, import from </TranslatedText><code>LiquidWebGPU.ts</code><TranslatedText> instead
          of </TranslatedText><code>LiquidVanilla.ts</code><TranslatedText>. The </TranslatedText><code>createLiquid</code><TranslatedText> call is
          the same.
        </TranslatedText></p>

        <h2><TranslatedText>Next steps</TranslatedText></h2>
        <div className="mt-6">
          <LinkCards
            items={[
              {
                href: "/docs/rendering",
                title: "Rendering",
                description: "Choose WebGL or WebGPU for each component.",
              },
              {
                href: "/docs/components/liquid",
                title: "Liquid",
                description:
                  "A pointer-driven fluid simulation over live HTML.",
              },
              {
                href: "/docs/mcp",
                title: "MCP server",
                description:
                  "Let your AI assistant install components for you.",
              },
            ]}
          />
        </div>
      </div>

      <div className="mt-24">
        <Footer variant="docs" />
      </div>
    </article>
  );
}
