import { T as TranslatedText } from "@/components/common/language-provider";

import type { Metadata } from "next";

import { CodeBlock } from "@/components/docs/code-block";
import { CopyButton } from "@/components/docs/copy-button";
import { highlight } from "@/components/docs/highlight";
import { InstallTabs } from "@/components/docs/install-tabs";
import { LinkCards } from "@/components/docs/link-cards";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Rendering: WebGL and WebGPU",
  description:
    "Choose between Canvas UI's WebGL and WebGPU renderer builds. Both ship the same effect and the same public API.",
  alternates: { canonical: "/docs/rendering" },
};

const INSTALL_COMMAND = "npx shadcn@latest add @canvas-ui/ripple-react-webgpu";
const WEBGPU_TYPES = `/// <reference types="@webgpu/types" />`;

const PAGE_MARKDOWN = `# Rendering

Every Canvas UI effect ships in two renderer builds: WebGL and WebGPU. They expose the same props, the same option types, and the same public API. Pick the renderer you want: the effect looks and moves the same.

## Choosing a renderer

WebGPU is a matter of taste, not a requirement. Pick WebGL for the widest browser support and zero dependencies. Pick WebGPU if you want WGSL, a WebGPU-native and compute-ready pipeline, or you are standardizing on WebGPU.

| | WebGL | WebGPU |
| --- | --- | --- |
| Shading language | GLSL | WGSL |
| Dependencies | None, except three for the object effects | vgpu, plus three for the object effects |
| Frameworks | React, Vue, Svelte, Solid, Preact, vanilla | React, Vue, Svelte, Solid, Preact, vanilla |
| Browser support | Widest support through WebGL2 | Chrome/Edge 113+, Safari 26+ / iOS 26, Firefox 141+ |
| Fallback behavior | Falls back to regular HTML when html-in-canvas is unavailable | Shows wrapped content unchanged when WebGPU is unavailable |
| Install suffix | None, for example \`@canvas-ui/ripple-react\` | \`-webgpu\`, for example \`@canvas-ui/ripple-react-webgpu\` |

## Install the WebGPU build

Use the renderer selector in the install block, or add the WebGPU registry item directly:

\`\`\`sh
${INSTALL_COMMAND}
\`\`\`

## TypeScript setup

The WebGPU build depends on \`@webgpu/types\`. The CLI adds it as a devDependency. If your TypeScript setup does not already include WebGPU types, add this to a \`.d.ts\` file:

\`\`\`ts
${WEBGPU_TYPES}
\`\`\`

## How it works

Each installed component is still a single source file. React files inline the engine in files like \`Ripple.tsx\`. Vanilla WebGPU files use names like \`RippleWebGPU.ts\`, while the WebGL vanilla files use \`RippleVanilla.ts\`.

The public shape stays the same: \`create<Base>()\`, \`<Base>Options\`, \`setOptions()\`, and \`destroy()\`. The WebGPU path shares one device per page, initializes lazily and asynchronously, and returns \`null\` synchronously when \`navigator.gpu\` or an adapter is missing so framework wrappers can fall back without throwing.

The renderer uses a premultiplied surface. The page is captured with html-in-canvas, uploaded as a texture, then sampled by WGSL shaders written as inline template strings. Mipmaps are generated in WebGPU wherever the matching WebGL build used them.

## Switching later

The API is identical, so switching renderers is usually replacing the installed file with the other build. The docs renderer selector remembers your WebGL or WebGPU choice across pages.

## Browser support

- WebGL build: WebGL2 browsers, with html-in-canvas effects using the documented html-in-canvas fallback behavior.
- WebGPU build: Chrome/Edge 113+, Safari 26+ / iOS 26, and Firefox 141+.
- If navigator.gpu is missing, or no adapter is available, the WebGPU component renders the wrapped content unchanged.

## Pinch zoom

Both renderers increase capture and rendering resolution when you pinch to zoom. The HTML keeps its CSS size and position, so panning, clicks, and scrolling stay aligned.

The normal device-pixel-ratio budget is capped at 2×, then multiplied by the zoom scale. To keep large canvases within GPU limits, buffers are also capped at 8192 pixels per dimension and 16 megapixels in total, or the device's lower WebGL limit. Extreme zoom can reach this quality ceiling.

## What is the same / what differs

The look, motion, props, option types, and public API are the same. WebGPU needs a modern browser and adds \`vgpu\`. Both builds ship for all six frameworks, because the wrappers are shared and only the engine file differs.

## Next steps

- Read the installation guide: https://canvasui.dev/docs/installation
- Try Ripple: https://canvasui.dev/docs/components/ripple
`;

export default async function RenderingPage() {
  const typesHtml = await highlight(WEBGPU_TYPES, "typescript");

  return (
    <article className="page-enter mx-auto w-full max-w-3xl">
      <div className="typeset typeset-docs">
        <div className="flex items-start justify-between gap-4">
          <h1><TranslatedText>Rendering</TranslatedText></h1>
          <CopyButton
            text={PAGE_MARKDOWN}
            label="Copy as Markdown"
            className="mt-1 shrink-0 border border-border/70 px-3"
          />
        </div>
        <p className="max-w-xl text-muted-foreground"><TranslatedText>
          Every Canvas UI effect ships in two renderer builds: WebGL and WebGPU.
          They expose the same props, the same option types, and the same public
          API. Pick the renderer you want, the effect should look and move the
          same.
        </TranslatedText></p>

        <h2><TranslatedText>Choosing a renderer</TranslatedText></h2>
        <p><TranslatedText>
          WebGPU is a matter of taste, not a requirement. Pick WebGL for the
          widest browser support and zero dependencies. Pick WebGPU if you want
          WGSL, a WebGPU-native and compute-ready pipeline, or you are
          standardizing on WebGPU.
        </TranslatedText></p>
        <table>
          <thead>
            <tr>
              <th />
              <th><TranslatedText>WebGL</TranslatedText></th>
              <th><TranslatedText>WebGPU</TranslatedText></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th><TranslatedText>Shading language</TranslatedText></th>
              <td><TranslatedText>GLSL</TranslatedText></td>
              <td><TranslatedText>WGSL</TranslatedText></td>
            </tr>
            <tr>
              <th><TranslatedText>Dependencies</TranslatedText></th>
              <td><TranslatedText>None, except three for the object effects</TranslatedText></td>
              <td><TranslatedText>vgpu, plus three for the object effects</TranslatedText></td>
            </tr>
            <tr>
              <th><TranslatedText>Frameworks</TranslatedText></th>
              <td><TranslatedText>React, Vue, Svelte, Solid, Preact, vanilla</TranslatedText></td>
              <td><TranslatedText>React, Vue, Svelte, Solid, Preact, vanilla</TranslatedText></td>
            </tr>
            <tr>
              <th><TranslatedText>Browser support</TranslatedText></th>
              <td><TranslatedText>Widest support through WebGL2</TranslatedText></td>
              <td><TranslatedText>Chrome/Edge 113+, Safari 26+ / iOS 26, Firefox 141+</TranslatedText></td>
            </tr>
            <tr>
              <th><TranslatedText>Fallback behavior</TranslatedText></th>
              <td><TranslatedText>Falls back to regular HTML when html-in-canvas is unavailable</TranslatedText></td>
              <td><TranslatedText>Shows wrapped content unchanged when WebGPU is unavailable</TranslatedText></td>
            </tr>
            <tr>
              <th><TranslatedText>Install suffix</TranslatedText></th>
              <td><TranslatedText>None, for example @canvas-ui/ripple-react</TranslatedText></td>
              <td><TranslatedText>-webgpu, for example @canvas-ui/ripple-react-webgpu</TranslatedText></td>
            </tr>
          </tbody>
        </table>

        <h2><TranslatedText>Install the WebGPU build</TranslatedText></h2>
        <p><TranslatedText>
          Use the renderer selector in the install block, or add the WebGPU
          registry item directly:
        </TranslatedText></p>
        <div className="not-typeset my-6">
          <InstallTabs item="ripple" hasWebGPU />
        </div>

        <h2><TranslatedText>TypeScript setup</TranslatedText></h2>
        <p><TranslatedText>
          The WebGPU build depends on </TranslatedText><code>@webgpu/types</code><TranslatedText>. The CLI adds
          it as a devDependency. If your TypeScript setup does not already
          include WebGPU types, add this to a </TranslatedText><code>.d.ts</code><TranslatedText> file:
        </TranslatedText></p>
        <div className="my-6">
          <CodeBlock
            html={typesHtml}
            source={WEBGPU_TYPES}
            fileName="webgpu.d.ts"
          />
        </div>

        <h2><TranslatedText>How it works</TranslatedText></h2>
        <p><TranslatedText>
          Each installed component is still a single source file. React files
          inline the engine in files like </TranslatedText><code>Ripple.tsx</code><TranslatedText>. Vanilla WebGPU
          files use names like </TranslatedText><code>RippleWebGPU.ts</code><TranslatedText>, while the WebGL
          vanilla files use </TranslatedText><code>RippleVanilla.ts</code>.
        </p>
        <p><TranslatedText>
          The public shape stays the same: </TranslatedText><code>create&lt;Base&gt;()</code>,{" "}
          <code>&lt;Base&gt;Options</code>, <code>setOptions()</code><TranslatedText>, and</TranslatedText>{" "}
          <code>destroy()</code><TranslatedText>. The WebGPU path shares one device per page,
          initializes lazily and asynchronously, and returns </TranslatedText><code>null</code><TranslatedText>
          synchronously when </TranslatedText><code>navigator.gpu</code><TranslatedText> or an adapter is missing
          so framework wrappers can fall back without throwing.
        </TranslatedText></p>
        <p><TranslatedText>
          The renderer uses a premultiplied surface. The page is captured with
          html-in-canvas, uploaded as a texture, then sampled by WGSL shaders
          written as inline template strings. Mipmaps are generated in WebGPU
          wherever the matching WebGL build used them.
        </TranslatedText></p>

        <h2><TranslatedText>Switching later</TranslatedText></h2>
        <p><TranslatedText>
          The API is identical, so switching renderers is usually replacing the
          installed file with the other build. The docs renderer selector
          remembers your WebGL or WebGPU choice across pages.
        </TranslatedText></p>

        <h2><TranslatedText>Browser support</TranslatedText></h2>
        <ul>
          <li><TranslatedText>
            WebGL build: WebGL2 browsers, with html-in-canvas effects using the
            documented html-in-canvas fallback behavior.
          </TranslatedText></li>
          <li><TranslatedText>
            WebGPU build: Chrome/Edge 113+, Safari 26+ / iOS 26, and Firefox
            141+.
          </TranslatedText></li>
          <li><TranslatedText>
            If </TranslatedText><code>navigator.gpu</code><TranslatedText> is missing, or no adapter is available,
            the WebGPU component renders the wrapped content unchanged.
          </TranslatedText></li>
        </ul>

        <h2><TranslatedText>Pinch zoom</TranslatedText></h2>
        <p><TranslatedText>
          Both renderers increase capture and rendering resolution when you pinch
          to zoom. The HTML keeps its CSS size and position, so panning, clicks,
          and scrolling stay aligned.
        </TranslatedText></p>
        <p><TranslatedText>
          The normal device-pixel-ratio budget is capped at 2×, then multiplied by
          the zoom scale. To keep large canvases within GPU limits, buffers are
          also capped at 8192 pixels per dimension and 16 megapixels in total, or
          the device&apos;s lower WebGL limit. Extreme zoom can reach this quality
          ceiling.
        </TranslatedText></p>

        <h2><TranslatedText>What is the same / what differs</TranslatedText></h2>
        <p><TranslatedText>
          The look, motion, props, option types, and public API are the same.
          WebGPU needs a modern browser and adds </TranslatedText><code>vgpu</code><TranslatedText>. Both builds
          ship for all six frameworks, because the wrappers are shared and only
          the engine file differs.
        </TranslatedText></p>

        <h2><TranslatedText>Next steps</TranslatedText></h2>
        <div className="mt-6">
          <LinkCards
            items={[
              {
                href: "/docs/installation",
                title: "Installation",
                description: "Install from the CLI or copy the source manually.",
              },
              {
                href: "/docs/components/ripple",
                title: "Ripple",
                description: "Water ripples from every click over live HTML.",
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
