import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { T } from "@/components/common/language-provider";
import { CodeBlock } from "@/components/docs/code-block";
import { CopyButton } from "@/components/docs/copy-button";
import { highlight } from "@/components/docs/highlight";
import { Footer } from "@/components/landing/footer";
import { COMPONENT_CATALOG } from "@/data/component-catalog";
import { LEIBOX_SKILL_INSTALL_COMMAND } from "@/lib/leibox-skill";

export const metadata: Metadata = {
  title: "AI integration",
  description: "Install LeiBox Skill, search the live collection and pull complete component source into your project.",
  alternates: { canonical: "/docs/mcp" },
};
const EXAMPLE = "用 LeiBox 找一个玻璃文件夹组件，使用我项目里的 React，把完整源码接入当前页面。";
const COMMANDS = `node <installed-skill>/scripts/leibox.mjs search "玻璃 文件夹"
node <installed-skill>/scripts/leibox.mjs show glass-folder --framework react
node <installed-skill>/scripts/leibox.mjs pull glass-folder --framework react --out src/components/leibox/glass-folder`;
const MARKDOWN = `# LeiBox Skill

${LEIBOX_SKILL_INSTALL_COMMAND}

Install the Skill in the AI client you use. Then ask it to search the live LeiBox collection, choose your project's framework and pull the complete source into your project. No LeiBox repository checkout, API key or MCP server is required.

Example: ${EXAMPLE}

Current collection: ${COMPONENT_CATALOG.length} components. The Skill fetches /ai/catalog.json for every query, so new published entries are available without reinstalling the Skill.

${COMMANDS}

Project source is fetched from LeiBox; Canvas UI reference source is fetched directly from the original provider. Keep source notices and design references. Pull does not overwrite different existing files or run downloaded code.`;

export default async function AiIntegrationPage() {
  const skillSource = await readFile(path.join(process.cwd(), "integrations/skills/leibox/SKILL.md"), "utf8");
  const skillHtml = await highlight(skillSource, "markdown");
  return (
    <article className="page-enter mx-auto w-full max-w-3xl">
      <div className="typeset typeset-docs">
        <div className="flex items-start justify-between gap-4">
          <h1><T>Use the LeiBox Skill</T></h1>
          <CopyButton text={MARKDOWN} label="Copy as Markdown" className="mt-1 shrink-0 border border-border/70 px-3" />
        </div>
        <p className="max-w-xl text-muted-foreground"><T>Install once. Let your AI search the collection and pull complete component source into your project.</T></p>
        <h2 id="install-skill"><T>Install the LeiBox Skill</T></h2>
        <p><T>Run this command in your project and choose the AI client you use. No LeiBox repository checkout, API key or MCP server is required.</T></p>
        <div className="my-6"><CodeBlock source={LEIBOX_SKILL_INSTALL_COMMAND} fileName="Terminal" /></div>
        <h2><T>Ask your AI</T></h2>
        <p><T>After installation, describe the component you need and your AI will search, choose the matching framework and download the actual source files.</T></p>
        <blockquote><T>Use LeiBox to find a glass folder component and integrate its React source into my current page.</T></blockquote>
        <p><T>The Skill reads the live catalog every time. Newly published components become searchable without reinstalling it.</T></p>
        <h2><T>The complete collection</T></h2>
        <p><strong>{COMPONENT_CATALOG.length}</strong> <T>components are currently searchable, with six framework versions where offered.</T></p>
        <ul>
          <li><a href="/ai/catalog.json"><code>/ai/catalog.json</code></a> — <T>Searchable component metadata</T></li>
          <li><a href="/ai/components/glass-folder.json"><code>/ai/components/glass-folder.json</code></a> — <T>Example component detail as JSON</T></li>
          <li><a href="/ai/packages/glass-folder/react.json"><code>/ai/packages/glass-folder/react.json</code></a> — <T>Complete React source, dependencies and usage</T></li>
          <li><a href="/llms.txt"><code>/llms.txt</code></a> — <T>Index for AI readers</T></li>
        </ul>
        <h2><T>Search and download with the installed helper</T></h2>
        <p><T>The Skill includes a standalone Node.js helper. Resolve its path from the installed Skill folder and run it in your target project.</T></p>
        <div className="my-6"><CodeBlock source={COMMANDS} fileName="LeiBox Skill" /></div>
        <p><T>Pull downloads the selected framework&apos;s complete file set and checks its content hashes. It preserves different existing files and does not execute code or install dependencies.</T></p>
        <h2><T>Source and distribution</T></h2>
        <p><T>LeiBox framework packages are downloaded from this website. Canvas UI reference entries are downloaded directly from their original provider. Keep the source notices and each component&apos;s design-reference attribution.</T></p>
        <details className="my-6 rounded-xl border border-border/60 p-4">
          <summary className="cursor-pointer text-sm font-medium"><T>Read Skill instructions</T></summary>
          <div className="mt-4"><CodeBlock html={skillHtml} source={skillSource} fileName="SKILL.md" /></div>
        </details>
        <p><a href="/ai/SKILL.md" download="SKILL.md"><T>Download SKILL.md</T></a></p>
      </div>
      <div className="mt-24"><Footer variant="docs" /></div>
    </article>
  );
}
