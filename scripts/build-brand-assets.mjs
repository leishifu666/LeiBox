import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const brand = path.join(root, "design/brand/leibox");
const publicDir = path.join(root, "public");
const source = path.join(brand, "master.svg");
await fs.mkdir(brand, { recursive: true });
const selected = await fs.readFile(source, "utf8");
await fs.writeFile(path.join(brand, "selected-source.svg"), selected);
const lD = selected.match(/data-role="l-centerline" d="([^"]+)"/)[1];
const shellD = selected.match(/<path d="([^"]+)" fill="#000" mask=/)[1];
const n = lD.match(/[-0-9.]+/g).map(Number);
const A = { x: n[0], y: n[1] }, E = { x: n[2], y: n[3] }, B = { x: n[4], y: n[5] };
const strokeWidth = Number(selected.match(/stroke-width="([^"]+)"/)[1]);
const radius = strokeWidth / 2;
const length = Math.hypot(B.x - E.x, B.y - E.y);
const u = { x: (B.x - E.x) / length, y: (B.y - E.y) / length };
const normal = { x: -u.y, y: u.x };
const f = value => Number(value.toFixed(9)).toString();
const pt = p => f(p.x) + " " + f(p.y);
const offset = (p, sign) => ({ x: p.x + sign * normal.x * radius, y: p.y + sign * normal.y * radius });
const outerElbow = offset(E, 1);
const innerY = E.y - normal.y * radius + u.y * (radius + normal.x * radius) / u.x;
// Outline of the exact selected round-cap / round-join stroke.
// The single closed contour becomes a real hole with evenodd, including in SVGLoader.
const holeD = [
  "M" + pt({ x: A.x - radius, y: A.y }),
  "L" + pt({ x: E.x - radius, y: E.y }),
  "A" + radius + " " + radius + " 0 0 0 " + pt(outerElbow),
  "L" + pt(offset(B, 1)),
  "A" + radius + " " + radius + " 0 0 0 " + pt(offset(B, -1)),
  "L" + pt({ x: E.x + radius, y: innerY }),
  "L" + pt({ x: A.x + radius, y: A.y }),
  "A" + radius + " " + radius + " 0 0 0 " + pt({ x: A.x - radius, y: A.y }),
  "Z"
].join(" ");
const compoundD = shellD + " " + holeD;
const shape = color => '<path fill="' + color + '" fill-rule="evenodd" clip-rule="evenodd" d="' + compoundD + '"/>';
const mark = color => '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="LeiBox"><title>LeiBox</title>' + shape(color) + '</svg>\n';
// Approved outlined ei ligature: reuse the vector master, never substitute a font.
const outlinedBrand = path.join(root, "design/brand/leibox-ei-20261023");
const wordmarks = {
  "#000": await fs.readFile(path.join(outlinedBrand, "logo.svg"), "utf8"),
  "#fff": await fs.readFile(path.join(outlinedBrand, "logo-white.svg"), "utf8"),
};
const wordmark = color => wordmarks[color];
const favicon = mark("#fff");
const appIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="#fff"/>' + shape("#000") + '</svg>\n';
const og = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#0a0a0a"/>' + wordmark("#fff").trim().replace("<svg ", '<svg x="100" y="150" ') + '<text x="104" y="440" fill="#b7b7b7" font-family="Segoe UI,Arial,sans-serif" font-size="30">A collection of good UI. Ready for your next idea.</text><path d="M100 520h1000" stroke="#343434"/></svg>\n';
const textFiles = {
  "leibox-mark.svg": mark("#000"),
  "leibox-logo.svg": wordmark("#fff"),
  "logo.svg": wordmark("#fff"),
  "logo-icon.svg": mark("#fff"),
  "favicon.svg": favicon,
  "leibox-og.svg": og
};
for (const [name, data] of Object.entries(textFiles)) await fs.writeFile(path.join(publicDir, name), data);
await fs.writeFile(path.join(brand, "leibox-mark.svg"), mark("#000"));
await fs.writeFile(path.join(brand, "leibox-mark-white.svg"), mark("#fff"));
await fs.writeFile(path.join(brand, "leibox-wordmark.svg"), wordmark("#000"));
await fs.writeFile(path.join(brand, "leibox-wordmark-white.svg"), wordmark("#fff"));
await sharp(Buffer.from(mark("#000"))).resize(1024, 1024).png().toFile(path.join(brand, "leibox-mark.png"));
await sharp(Buffer.from(mark("#fff"))).resize(1024, 1024).png().toFile(path.join(brand, "leibox-mark-white.png"));
for (const [name, size] of [["apple-touch-icon.png", 180], ["icon-192.png", 192], ["icon-512.png", 512]]) {
  await sharp(Buffer.from(appIcon)).resize(size, size).png().toFile(path.join(publicDir, name));
}
await sharp(Buffer.from(og)).png().toFile(path.join(publicDir, "leibox-og.png"));
// Modern ICO container with PNG frames, keeping the fallback browser icon in sync.
const frames = await Promise.all([16, 32, 48].map(size => sharp(Buffer.from(favicon)).resize(size, size).png().toBuffer().then(data => ({size,data}))));
const header = Buffer.alloc(6 + frames.length * 16);
header.writeUInt16LE(1, 2); header.writeUInt16LE(frames.length, 4);
let pos = header.length;
frames.forEach((frame, i) => {
  const start = 6 + i * 16;
  header[start] = frame.size; header[start + 1] = frame.size;
  header.writeUInt16LE(1, start + 4); header.writeUInt16LE(32, start + 6);
  header.writeUInt32LE(frame.data.length, start + 8); header.writeUInt32LE(pos, start + 12);
  pos += frame.data.length;
});
await fs.writeFile(path.join(publicDir, "favicon.ico"), Buffer.concat([header, ...frames.map(x => x.data)]));
await fs.writeFile(path.join(brand, "geometry.json"), JSON.stringify({ selected: "01-balanced-spacing-revised", source: path.relative(root, source).replaceAll(path.sep, "/"), elbow: E, verticalEnd: A, diagonalEnd: B, strokeWidth, radius, lengthVertical: Math.hypot(A.x-E.x,A.y-E.y), lengthDiagonal: length, shellD, holeD, compoundD, note: "Claude spacing revision: arms shortened together to 119 and translated (-8, 8/sqrt(3)); selected shell and roundness retained. Mask stroke converted to a closed evenodd hole for SVGLoader compatibility." }, null, 2));
// The running local preview serves out/ dynamically; no application code changes are needed.
const outDir = path.join(root, "out");
const assets = [...Object.keys(textFiles), "apple-touch-icon.png", "icon-192.png", "icon-512.png", "leibox-og.png", "favicon.ico"];
if (await fs.stat(outDir).then(s => s.isDirectory()).catch(() => false)) {
  for (const name of assets) await fs.copyFile(path.join(publicDir, name), path.join(outDir, name));
}
console.log(JSON.stringify({selected:"01-balanced-spacing-revised",brandFiles:brand,updatedAssets:assets,lengthRatio:Math.hypot(A.x-E.x,A.y-E.y)/length},null,2));

