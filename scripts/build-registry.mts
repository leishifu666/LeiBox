import fs from "node:fs";
import path from "node:path";

import { getMotionPackages } from "../src/lib/motion-packages.ts";
import { LEIBOX_HERO_COMPONENT, LEIBOX_HERO_REGISTRY_NAME } from "../src/lib/leibox-install.ts";
import { INTERACTION_COMPONENTS } from "../src/data/interaction-components.ts";

const OUT_DIR = path.join(process.cwd(), "public/r");

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });


// Serve the homepage's own implementation instead of relabeling upstream code.
const heroPackage = (await getMotionPackages(LEIBOX_HERO_COMPONENT)).find((entry) => entry.framework === "react")!;
const heroEntry = INTERACTION_COMPONENTS.find((entry) => entry.slug === LEIBOX_HERO_COMPONENT)!;
const leiboxItem = {
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name: LEIBOX_HERO_REGISTRY_NAME,
  type: "registry:block",
  title: `LeiBox · ${heroEntry.name} (React)`,
  description: heroEntry.description,
  author: "LeiBox",
  dependencies: heroPackage.dependencies,
  files: heroPackage.files.map((file) => ({
    path: `registry/leibox/${LEIBOX_HERO_COMPONENT}/${file.fileName}`,
    type: "registry:file",
    target: `@components/leibox/${LEIBOX_HERO_COMPONENT}/${file.fileName}`,
    content: file.source,
  })),
  meta: { implementation: "LeiBox recreation", designReference: heroEntry.referenceUrl, designAuthor: heroEntry.referenceAuthor },
  docs: `Import { ${heroPackage.component} } from '@/components/leibox/${LEIBOX_HERO_COMPONENT}/${heroPackage.component}'. Design reference: ${heroEntry.referenceUrl}`,
};
fs.writeFileSync(path.join(OUT_DIR, `${LEIBOX_HERO_REGISTRY_NAME}.json`), JSON.stringify(leiboxItem, null, 2));

const registry = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "leibox",
  homepage: process.env.NEXT_PUBLIC_SITE_URL || "https://leibox-ui.netlify.app",
  items: [leiboxItem].map((item) => ({
    name: item.name,
    type: item.type,
    title: item.title,
    description: item.description,
    dependencies: item.dependencies,

    files: item.files.map((file) => ({
      path: file.path,
      type: file.type,
      target: file.target,
    })),
  })),
};
fs.writeFileSync(
  path.join(OUT_DIR, "registry.json"),
  JSON.stringify(registry, null, 2),
);

console.log("Built the LeiBox project registry entry and index.");
