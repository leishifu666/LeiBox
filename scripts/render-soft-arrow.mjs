import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import { chromium } from "playwright";
import sharp from "sharp";

// Render the site's existing model, material and timeline at 2x CSS resolution.
const dir = "public/landing/soft-arrow";
const size = 64;
const fps = 60;
const model = await readFile(`${dir}/soft-arrow.glb`);
const { outputFiles: [bundle] } = await build({
  entryPoints: ["src/components/landing/soft-arrow-scene.ts"],
  bundle: true,
  format: "iife",
  globalName: "SoftArrow",
  write: false,
});
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
try {
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  await page.route("https://arrow.test/**", route => route.request().url().endsWith(".glb")
    ? route.fulfill({ body: model, contentType: "model/gltf-binary" })
    : route.fulfill({ contentType: "text/html", body: "<!doctype html><span><canvas></canvas></span>" }));
  await page.goto("https://arrow.test");
  await page.addScriptTag({ content: bundle.text });

  for (const [name, dark] of [["silver", false], ["black", true]]) {
    const { frames, delays } = await page.evaluate(async ({ dark, fps, size }) => {
      document.documentElement.classList.toggle("dark", dark);
      const host = document.querySelector("span");
      const canvas = document.querySelector("canvas");
      const readback = new OffscreenCanvas(size, size).getContext("2d", { willReadFrequently: true });
      const frames = [], delays = [];
      await SoftArrow.createSoftArrow(host, canvas, new AbortController().signal, (drawAt, duration, rest) => {
        const count = Math.round(duration * fps);
        for (let i = 0; i <= count; i++) {
          drawAt(Math.min(i / fps, duration));
          readback.clearRect(0, 0, size, size);
          readback.drawImage(canvas, 0, 0);
          frames.push(Array.from(readback.getImageData(0, 0, size, size).data));
          delays.push(i === count ? Math.round(rest * 1000) : Math.round((i + 1) * 1000 / fps) - Math.round(i * 1000 / fps));
        }
      });
      return { frames, delays };
    }, { dark, fps, size });
    assert(frames[0].some((channel, i) => i % 4 === 3 && channel > 0));
    assert.notDeepEqual(frames[0], frames[Math.floor(frames.length / 2)]);
    const loop = `${dir}/${name}-loop.webp`;
    const { size: bytes } = await sharp(Buffer.concat(frames.map(frame => Buffer.from(frame))), {
      raw: { width: size, height: size * frames.length, pageHeight: size, channels: 4 },
    }).webp({ lossless: true, effort: 5, delay: delays, loop: 0 }).toFile(loop);
    await sharp(`${dir}/${name}.png`).webp({ lossless: true, effort: 6 }).toFile(`${dir}/${name}.webp`);
    console.log(`${loop}: ${bytes} bytes`);
  }
} finally {
  await browser.close();
}
