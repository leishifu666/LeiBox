import { T as TranslatedText } from "@/components/common/language-provider";

import type { Metadata } from "next";

import { CopyButton } from "@/components/docs/copy-button";
import { LinkCards } from "@/components/docs/link-cards";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Introduction",
  description:
    "Canvas UI is a free, open source component library of creative canvas effects for React, Solid, Preact, Vue, Svelte, and vanilla JS, with WebGL and WebGPU (via vgpu) builds of every effect.",
  alternates: { canonical: "/docs" },
};

const PAGE_MARKDOWN = `# Introduction

Canvas UI is an open source library of creative components drawn on canvas. Real HTML, rendered inside a canvas element, with GPU effects running over it in WebGL or WebGPU. Copy, paste, and ship.

## What is this?

A collection of canvas effects for the web: fluid simulations, shaders, and other visual experiments. They render over real HTML, so the content underneath stays interactive.

Most of the library is built on the html-in-canvas API, an experimental browser capability that lets a canvas element lay out and paint live DOM content. Your components become a texture that shaders can sample and distort, without screenshots, iframes, or DOM-to-image hacks. Some effects skip the API entirely and are pure 3D and shader work that runs everywhere today.

## Framework agnostic

Every component ships in six flavors: React, Solid, Preact, Vue, Svelte, and vanilla TypeScript. Each one is a single standalone file, built on the same engine with the same options. Pick your framework once in the docs and every install command and code example follows.

## Two renderer builds

Every effect ships as WebGL and WebGPU builds with the same public API. Use WebGL for the widest support, or WebGPU for WGSL and a WebGPU-native pipeline. Read the rendering guide: https://canvasui.dev/docs/rendering

## You own the code

Components are distributed through a shadcn registry. Installing one drops the source file into your project, where you can read it, change it, and version it like anything else you wrote. There is no package to update and nothing to lock you in.

## Browser support

The html-in-canvas API is an experimental Chrome feature, currently in origin trial. Components detect support at runtime and degrade gracefully: without it, your content renders as normal HTML and the parts of the effect that can still run, still do. Nothing breaks for users on other browsers.

## Next steps

- Read the installation guide: https://canvasui.dev/docs/installation
- Try Liquid, the first component: https://canvasui.dev/docs/components/liquid
`;

export default function DocsPage() {
  return (
    <article className="page-enter mx-auto w-full max-w-3xl">
      <div className="typeset typeset-docs">
        <div className="flex items-start justify-between gap-4">
          <h1><TranslatedText>Introduction</TranslatedText></h1>
          <CopyButton
            text={PAGE_MARKDOWN}
            label="Copy as Markdown"
            className="mt-1 shrink-0 border border-border/70 px-3"
          />
        </div>
        <p className="max-w-xl text-muted-foreground"><TranslatedText>
          Canvas UI is an open source library of creative components drawn on
          canvas. Real HTML, rendered inside a canvas element, with GPU
          effects running over it in WebGL or WebGPU. Copy, paste, and ship.
        </TranslatedText></p>

        <h2><TranslatedText>What is this?</TranslatedText></h2>
        <p><TranslatedText>
          A collection of canvas effects for the web: fluid simulations,
          shaders, and other visual experiments. They render over real HTML, so
          the content underneath stays interactive.
        </TranslatedText></p>
        <p><TranslatedText>
          Most of the library is built on the html-in-canvas API, an
          experimental browser capability that lets a canvas element lay out and
          paint live DOM content. Your components become a texture that shaders
          can sample and distort, without screenshots, iframes, or DOM-to-image
          hacks. Some effects skip the API entirely and are pure 3D and shader
          work that runs everywhere today.
        </TranslatedText></p>

        <h2><TranslatedText>Framework agnostic</TranslatedText></h2>
        <p><TranslatedText>
          Every component ships in six flavors: React, Solid, Preact, Vue,
          Svelte, and vanilla TypeScript. Each one is a single standalone file,
          built on the same engine with the same options. Pick your framework
          once in the docs and every install command and code example follows.
        </TranslatedText></p>

        <h2><TranslatedText>Two renderer builds</TranslatedText></h2>
        <p><TranslatedText>
          Every effect ships as WebGL and WebGPU builds with the same public
          API. Use WebGL for the widest support, or WebGPU for WGSL and a
          WebGPU-native pipeline. Read the</TranslatedText>{" "}
          <a href="/docs/rendering"><TranslatedText>rendering guide</TranslatedText></a>.
        </p>

        <h2><TranslatedText>You own the code</TranslatedText></h2>
        <p><TranslatedText>
          Components are distributed through a shadcn registry. Installing one
          drops the source file into your project, where you can read it, change
          it, and version it like anything else you wrote. There is no package
          to update and nothing to lock you in.
        </TranslatedText></p>

        <h2><TranslatedText>Browser support</TranslatedText></h2>
        <p><TranslatedText>
          The html-in-canvas API is an experimental Chrome feature, currently in
          origin trial. Components detect support at runtime and degrade
          gracefully: without it, your content renders as normal HTML and the
          parts of the effect that can still run, still do. Nothing breaks for
          users on other browsers.
        </TranslatedText></p>

        <h2><TranslatedText>Next steps</TranslatedText></h2>
        <div className="mt-6">
          <LinkCards
            items={[
              {
                href: "/docs/installation",
                title: "Installation",
                description: "Requirements, the CLI, and manual setup.",
              },
              {
                href: "/docs/components/liquid",
                title: "Liquid",
                description:
                  "A pointer-driven fluid simulation over live HTML.",
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
