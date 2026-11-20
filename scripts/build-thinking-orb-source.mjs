import { bundleDissolveSource, readDissolveDemoStyles } from "./build-dissolve-source.mjs";

export async function buildThinkingOrbSource(entry) {
  const css = await readDissolveDemoStyles();
  const source = `
import { createThinkingOrbDemo } from "./thinking-orb-demo";
export function mountThinkingOrb(target, options = {}) {
  return createThinkingOrbDemo(target, options, ${JSON.stringify(css)});
}
`;
  const demo = `
const preview = document.documentElement.hasAttribute("data-leibox-motion-preview");
const localeOf = lang => lang === "zh" ? "zh" : "en";
const height = () => Math.max(${entry.canvasHeight}, innerHeight);
const instance = mountThinkingOrb(document.querySelector("main"), {
  showControls: true,
  ...(preview ? { state: "thinking" } : {}),
  height: height(),
  size: 216,
  interactive: !preview,
  locale: localeOf(new URLSearchParams(location.search).get("lang"))
});
if (preview) instance.root.querySelector(".orb-stage").dataset.preview = "true";
const resize = () => instance.update({ height: height() });
const localize = event => {
  if (parent !== window && event.source === parent && event.data?.type === "leibox-library-locale") {
    instance.update({ locale: localeOf(event.data.locale) });
  }
};
const ready = requestAnimationFrame(() => {
  document.body.dataset.motionReady = "true";
  if (parent !== window) parent.postMessage({ type: "leibox-preview-ready", slug: "thinking-orb" }, "*");
});
addEventListener("resize", resize);
addEventListener("message", localize);
addEventListener("pagehide", event => {
  if (event.persisted) return;
  cancelAnimationFrame(ready);
  removeEventListener("resize", resize);
  removeEventListener("message", localize);
  instance.destroy();
});
`;
  return bundleDissolveSource(entry, "ThinkingOrb", source, demo);
}
