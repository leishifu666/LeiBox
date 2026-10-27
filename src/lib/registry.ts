import fs from "node:fs";
import path from "node:path";

const LIB_ROOT = path.join(process.cwd(), "src/lib");

interface ComponentDef {
  /** Directory and file base name under src/lib, e.g. "Liquid". */
  base: string;
  description: string;
  /** npm packages the component needs at runtime. */
  dependencies?: string[];
  /** npm packages the component needs for types only. */
  devDependencies?: string[];
}

const COMPONENTS: Record<string, ComponentDef> = {
  "ascii-object": {
    base: "AsciiObject",
    description:
      "Renders any GLB/glTF model, SVG, or image in a floating studio scene as ASCII characters chosen by shape, so glyphs trace the object's edges. Built on three.js.",
    dependencies: ["three"],
    devDependencies: ["@types/three"],
  },
  asciify: {
    base: "Asciify",
    description:
      "Redraws your page as live ascii characters in a soft radius around the cursor, with real glyph, shade block, and binary ramps. The HTML stays interactive in Chromium and Firefox.",
  },
  "particle-object": {
    base: "ParticleObject",
    description:
      "Rebuilds any GLB/glTF model, SVG, or image as a cloud of particles that the cursor pushes, swirls, and springs back into shape. Built on three.js.",
    dependencies: ["three"],
    devDependencies: ["@types/three"],
  },
  "particle-scroll": {
    base: "ParticleScroll",
    description:
      "Dissolves everything below a chosen line into drifting sand that reassembles as you scroll. The HTML stays interactive. No dependencies.",
  },
  "glyph-rain": {
    base: "GlyphRain",
    description:
      "Rains glowing glyph streams over your live HTML while every drop head casts a real pool of light onto the page beneath, with embossed relief shading. The HTML stays interactive. No dependencies.",
  },
  frost: {
    base: "Frost",
    description:
      "Covers your page in a frozen pane of ice with refraction and frost grain. Hovering melts a hole through the frost, which freezes back over. The HTML stays interactive. No dependencies.",
  },
  glass: {
    base: "Glass",
    description:
      "A cursor-following glass lens that refracts your page like real glass, with a crystal ball zoom over target elements. The HTML stays interactive. No dependencies.",
  },
  "glass-object": {
    base: "GlassObject",
    description:
      "Turns any GLB/glTF model, SVG, or image into a floating liquid-glass object with real refraction, chromatic dispersion, frost, and tinted absorption, lit by a studio environment. Built on three.js.",
    dependencies: ["three"],
    devDependencies: ["@types/three"],
  },
  "liquid-object": {
    base: "LiquidObject",
    description:
      "Renders any GLB/glTF model, SVG, or image in a studio environment, then drags it through an invisible GPU fluid that swirls under the cursor and splits the light into chromatic fringes. Built on three.js.",
    dependencies: ["three"],
    devDependencies: ["@types/three"],
  },
};

function read(base: string, fileName: string) {
  return fs.readFileSync(path.join(LIB_ROOT, base, fileName), "utf8");
}

/** Keep shared runtime helpers in the single-file, installed component too. */
function inlineEngineHelpers(engine: string) {
  return engine.replace(
    /import\s*\{[^}]*\}\s*from\s*["']\.\.\/(canvas-viewport|html-in-canvas|rect-cache)["'];\r?\n*/g,
    (_import, helper: string) =>
      fs.readFileSync(path.join(LIB_ROOT, `${helper}.ts`), "utf8")
        .replace(/^export /gm, "") + "\n",
  );
}

export type Renderer = "webgl" | "webgpu";

export const RENDERERS: readonly Renderer[] = ["webgl", "webgpu"];

/** Engine file name for a renderer, e.g. "RippleVanilla.ts" or "RippleWebGPU.ts". */
export function engineFileName(base: string, renderer: Renderer) {
  return renderer === "webgpu" ? `${base}WebGPU.ts` : `${base}Vanilla.ts`;
}

/** True when the component ships a WebGPU (vgpu) engine. */
export function hasWebGPUEngine(component: string): boolean {
  const def = COMPONENTS[component];
  if (!def) return false;
  return fs.existsSync(path.join(LIB_ROOT, def.base, engineFileName(def.base, "webgpu")));
}

function vanillaImport(base: string) {
  return new RegExp(
    `[ \\t]*import\\s*\\{[^}]*\\}\\s*from\\s*["']\\./${base}Vanilla["'];\\r?\\n*`,
  );
}

function makeStandalone(
  base: string,
  wrapper: string,
  engine: string,
  kind: "react" | "solid" | "preact" | "vue" | "svelte",
) {
  const body = engine.trimEnd();
  if (kind === "react" || kind === "solid" || kind === "preact") {
    return wrapper
      .replace(vanillaImport(base), body + "\n\n")
      .replace(/\nexport type \{[^}]*\};\n?/, "\n");
  }
  const stripped = wrapper.replace(vanillaImport(base), "");
  if (kind === "vue") {
    return `<script lang="ts">\n${body}\n</script>\n\n${stripped}`;
  }
  const moduleTag = '<script module lang="ts">';
  if (stripped.includes(moduleTag)) {
    return stripped.replace(moduleTag, `${moduleTag}\n${body}\n`);
  }
  return `<script module lang="ts">\n${body}\n</script>\n\n${stripped}`;
}

export interface ComponentSource {
  id: "react" | "solid" | "preact" | "vue" | "svelte" | "vanilla";
  label: string;
  fileName: string;
  lang: "tsx" | "vue" | "svelte" | "typescript";
  source: string;
}

const WEBGPU_DEPENDENCIES = ["vgpu"];
const WEBGPU_DEV_DEPENDENCIES = ["@webgpu/types"];

export function getComponentDependencies(
  component: string,
  renderer: Renderer = "webgl",
): {
  dependencies: string[];
  devDependencies: string[];
} {
  const def = COMPONENTS[component];
  const dependencies = def?.dependencies ?? [];
  const devDependencies = def?.devDependencies ?? [];
  if (renderer === "webgpu") {
    return {
      dependencies: [...WEBGPU_DEPENDENCIES, ...dependencies],
      devDependencies: [...WEBGPU_DEV_DEPENDENCIES, ...devDependencies],
    };
  }
  return { dependencies, devDependencies };
}

export function getDemoSource(component: string): string | null {
  const file = path.join(process.cwd(), "src/demos", `${component}-demo.tsx`);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, "utf8");
}

/**
 * Standalone sources per framework. The WebGPU renderer swaps the WebGL engine
 * for the vgpu one; the wrappers are shared because both engines expose the
 * same API.
 */
export function getComponentSources(
  component: string,
  renderer: Renderer = "webgl",
): ComponentSource[] {
  const def = COMPONENTS[component];
  if (!def) throw new Error(`Unknown component: ${component}`);
  const { base } = def;
  if (renderer === "webgpu" && !hasWebGPUEngine(component)) return [];
  const engine = inlineEngineHelpers(read(base, engineFileName(base, renderer)));
  return [
    {
      id: "react",
      label: "React",
      fileName: `${base}.tsx`,
      lang: "tsx",
      source: makeStandalone(base, read(base, `${base}.tsx`), engine, "react"),
    },
    {
      id: "vue",
      label: "Vue",
      fileName: `${base}.vue`,
      lang: "vue",
      source: makeStandalone(base, read(base, `${base}.vue`), engine, "vue"),
    },
    {
      id: "svelte",
      label: "Svelte",
      fileName: `${base}.svelte`,
      lang: "svelte",
      source: makeStandalone(
        base,
        read(base, `${base}.svelte`),
        engine,
        "svelte",
      ),
    },
    {
      id: "solid",
      label: "Solid",
      fileName: `${base}.tsx`,
      lang: "tsx",
      source: makeStandalone(
        base,
        read(base, `${base}.solid.tsx`),
        engine,
        "solid",
      ),
    },
    {
      id: "preact",
      label: "Preact",
      fileName: `${base}.tsx`,
      lang: "tsx",
      source: makeStandalone(
        base,
        read(base, `${base}.preact.tsx`),
        engine,
        "preact",
      ),
    },
    {
      id: "vanilla",
      label: "Vanilla",
      fileName: engineFileName(base, renderer),
      lang: "typescript",
      source: engine,
    },
  ];
}

interface RegistryFile {
  path: string;
  content: string;
  type: string;
  target: string;
}

export interface RegistryItem {
  $schema: string;
  name: string;
  type: string;
  title: string;
  description: string;
  dependencies: string[];
  devDependencies: string[];
  files: RegistryFile[];
}

export const REGISTRY_ITEMS = Object.keys(COMPONENTS).flatMap((component) => [
  ...(["react", "vue", "svelte", "solid", "preact", "vanilla"] as const).map(
    (flavor) => `${component}-${flavor}`,
  ),
  ...(hasWebGPUEngine(component)
    ? (["react", "vue", "svelte", "solid", "preact", "vanilla"] as const).map(
        (flavor) => `${component}-${flavor}-webgpu`,
      )
    : []),
]);

export function getRegistryItem(name: string): RegistryItem | null {
  const match =
    /^([a-z-]+)-(react|solid|preact|vue|svelte|vanilla)(-webgpu)?$/.exec(name);
  if (!match) return null;
  const [, component, id, gpuSuffix] = match;
  const renderer: Renderer = gpuSuffix ? "webgpu" : "webgl";
  const def = COMPONENTS[component];
  if (!def) return null;
  const source = getComponentSources(component, renderer).find(
    (entry) => entry.id === id,
  );
  if (!source) return null;
  const { dependencies, devDependencies } = getComponentDependencies(
    component,
    renderer,
  );

  const target =
    id === "svelte"
      ? `src/lib/components/canvasui/${source.fileName}`
      : `components/canvasui/${source.fileName}`;
  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name,
    type: "registry:component",
    title:
      renderer === "webgpu"
        ? `${def.base} (${source.label}, WebGPU)`
        : `${def.base} (${source.label})`,
    description:
      renderer === "webgpu"
        ? `${def.description} WebGPU build, rendered with vgpu.`
        : def.description,
    dependencies:
      id === "solid"
        ? ["solid-js", ...dependencies]
        : id === "preact"
          ? ["preact", ...dependencies]
          : dependencies,
    devDependencies,
    files: [
      {
        path: target,
        content: source.source,
        type: id === "react" ? "registry:component" : "registry:file",
        target,
      },
    ],
  };
}
