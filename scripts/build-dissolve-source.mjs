import fs from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";

const coreDir = path.resolve("src/lib/motion-core");

export function readDissolveDemoStyles() {
  return fs.readFile(path.join(coreDir, "libraries-dev/demo.css"), "utf8");
}

export async function bundleDissolveSource(entry, component, source, demo) {
  const license = await fs.readFile(path.join(coreDir, "dissolve/LICENSE"), "utf8");
  const config = {
    stdin: { contents: source, sourcefile: `${entry.slug}-entry.js`, resolveDir: coreDir },
    bundle: true, write: false, platform: "browser", target: "es2020",
    banner: { js: `/*! dissolve-ui@0.0.6 · ${component}\n${license.trim()}\n*/` },
  };
  const [engine, standalone] = await Promise.all([
    build({
      ...config,
      format: "esm",
      plugins: [{
        name: "leibox-motion-runtime",
        setup(build) {
          build.onResolve({ filter: /^\.\/motion-runtime$/ }, () => ({ path: "./motion-runtime", external: true }));
        },
      }],
    }),
    build({ ...config, stdin: { ...config.stdin, contents: source + demo }, format: "iife", minify: true }),
  ]);
  const html = `<!doctype html>
<html lang="en" data-leibox-library translate="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${entry.name}</title>
<style>html,body{margin:0;min-height:100%;background:#fff}main{width:100%;min-width:0}</style>
</head><body><main></main><script>${standalone.outputFiles[0].text.replace(/<\/script/gi, "<\\/script")}</script></body></html>
`;
  await fs.writeFile(`public/motion/${entry.slug}.html`, html);
  return engine.outputFiles[0].text;
}
