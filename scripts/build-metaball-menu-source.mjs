import fs from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";

export async function buildMetaballMenuSource(entry) {
  const dependencies = ["react", "react-dom", "lucide-react"];
  const source = `
import { mountLibraryDemo } from "./libraries-dev/mount.jsx";
import { MetaballMenu } from "./metaball-menu";

const labels = { message: ["Message", "消息"], bookmark: ["Bookmark", "收藏"], share: ["Share", "分享"] };
function Scene({ options, preview, locale, reducedMotion }) {
  return <MetaballMenu
    autoplay={options.autoplay}
    defaultOpen={options.defaultOpen ?? preview}
    reducedMotion={reducedMotion}
    locale={locale}
    onAction={options.onAction}
  />;
}
const scene = {
  slug: "metaball-menu",
  width: ${entry.canvasWidth},
  height: ${entry.canvasHeight},
  Scene,
  css: ".library-demo { display: grid; place-items: center; min-height: var(--motion-height); background: #fff; }",
};
export function mountMetaballMenu(target, options = {}, settings) {
  return mountLibraryDemo(target, options, scene, settings);
}
`;
  const demo = `
const preview = document.documentElement.hasAttribute("data-leibox-motion-preview");
const locale = lang => lang === "zh" ? "zh" : "en";
const height = () => Math.max(scene.height, innerHeight);
const main = document.querySelector("main");
const status = document.querySelector("[role=status]");
const surfaceLanguage = () => document.documentElement.lang;
let readyFrame = 0;
document.documentElement.lang = locale(new URLSearchParams(location.search).get("lang"));
const instance = mountMetaballMenu(main, {
  height: height(),
  locale: surfaceLanguage(),
  onAction(action) { status.textContent = labels[action][surfaceLanguage() === "zh" ? 1 : 0]; }
}, { preview, onReady() {
  readyFrame = requestAnimationFrame(() => {
    document.body.dataset.motionReady = "true";
    if (parent !== window) parent.postMessage({ type: "leibox-preview-ready", slug: "metaball-menu" }, "*");
  });
} });
const resize = () => instance.update({ height: height() });
const localize = event => {
  if (parent === window || event.source !== parent || event.data?.type !== "leibox-library-locale") return;
  document.documentElement.lang = locale(event.data.locale);
  instance.update({ locale: surfaceLanguage() });
};
addEventListener("resize", resize);
addEventListener("message", localize);
addEventListener("pagehide", event => {
  if (event.persisted) return;
  cancelAnimationFrame(readyFrame);
  removeEventListener("resize", resize);
  removeEventListener("message", localize);
  instance.destroy();
});
`;
  const notices = await Promise.all([...dependencies, "scheduler"].map(name => fs.readFile(path.join("node_modules", name, "LICENSE"), "utf8")));
  const config = {
    stdin: { contents: source, loader: "jsx", sourcefile: "metaball-menu-entry.jsx", resolveDir: path.resolve("src/lib/motion-core") },
    bundle: true, write: false, platform: "browser", jsx: "automatic", target: "es2020", legalComments: "inline",
  };
  const [engine, standalone] = await Promise.all([
    build({
      ...config,
      format: "esm",
      external: dependencies,
      plugins: [{
        name: "leibox-motion-runtime",
        setup(build) {
          build.onResolve({ filter: /^\.\.\/motion-runtime$/ }, () => ({ path: "./motion-runtime", external: true }));
        },
      }],
    }),
    build({
      ...config,
      stdin: { ...config.stdin, contents: source + demo },
      format: "iife",
      minify: true,
      define: { "process.env.NODE_ENV": '"production"' },
      banner: { js: `/*!\n${notices.join("\n\n").replaceAll("*/", "* /")}\n*/` },
    }),
  ]);
  const html = `<!doctype html>
<html lang="en" data-leibox-library translate="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${entry.name}</title>
<style>html,body{margin:0;min-height:100%;background:#fff}main{width:100%;min-width:0}[role=status]{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}</style>
</head><body><main></main><span role="status"></span><script>${standalone.outputFiles[0].text.replace(/<\/script/gi, "<\\/script")}</script></body></html>
`;
  await fs.writeFile("public/motion/metaball-menu.html", html);
  return { engine: engine.outputFiles[0].text, dependencies };
}
