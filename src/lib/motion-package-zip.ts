import type { CodeContent, MotionPackageRef } from "@/lib/doc-asset-types";
import { loadDocAsset } from "@/lib/load-doc-asset";

export async function createMotionPackageZip(pack: MotionPackageRef, signal: AbortSignal) {
  const [{ zip, strToU8 }, files] = await Promise.all([
    import("fflate"),
    Promise.all(pack.files.map(async ({ fileName, url }) => {
      const { source } = await loadDocAsset<CodeContent>(url);
      if (typeof source !== "string") throw new Error(`Missing source for ${fileName}`);
      return [fileName, source] as const;
    })),
  ]);
  signal.throwIfAborted();

  const entries = Object.fromEntries(files.map(([name, source]) => [name, strToU8(source)]));
  if (!Object.hasOwn(entries, "README.md")) {
    entries["README.md"] = strToU8([
      `# ${pack.component} — ${pack.label}`,
      "",
      "## Install",
      "",
      pack.dependencies.length ? `\`\`\`sh\n${pack.install}\n\`\`\`` : pack.install,
      "",
      "Keep the package files together in their original directory structure. Preserve embedded font and third-party license notices.",
      "",
      "## Usage",
      "",
      "```" + pack.files[0].fileName.split(".").pop(),
      pack.usage,
      "```",
      "",
    ].join("\n"));
  }

  return new Promise<Blob>((resolve, reject) => {
    const terminate = zip(entries, { level: 3 }, (error, bytes) => {
      signal.removeEventListener("abort", cancel);
      if (error) reject(error);
      else resolve(new Blob([bytes], { type: "application/zip" }));
    });
    function cancel() {
      terminate();
      reject(signal.reason);
    }
    signal.addEventListener("abort", cancel, { once: true });
  });
}
