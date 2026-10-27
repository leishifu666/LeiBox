import fs from "node:fs/promises";
import path from "node:path";

export const MOTION_FRAMEWORKS = [
  { id: "react", label: "React" }, { id: "vue", label: "Vue" },
  { id: "svelte", label: "Svelte" }, { id: "solid", label: "Solid" },
  { id: "preact", label: "Preact" }, { id: "vanilla", label: "Vanilla" },
] as const;
export type MotionFramework = (typeof MOTION_FRAMEWORKS)[number]["id"];
export interface MotionSourceFile { id: string; label: string; fileName: string; source: string; html?: string }
export interface MotionPackage {
  framework: MotionFramework;
  label: string;
  component: string;
  slug: string;
  dependencies: string[];
  install: string;
  usage: string;
  prompt: string;
  bundle: string;
  files: MotionSourceFile[];
}
export async function getMotionPackages(slug: string): Promise<MotionPackage[]> {
  return JSON.parse(await fs.readFile(path.join(process.cwd(), "public/motion-frameworks", slug, "packages.json"), "utf8"));
}
