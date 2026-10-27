import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run this script using npm run build:netlify.");
const result = spawnSync(process.execPath, [npmCli, "run", "build"], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || "https://leibox-ui.netlify.app",
  },
});
if (result.status !== 0) process.exit(result.status || 1);
await import("./prepare-netlify.mjs");
