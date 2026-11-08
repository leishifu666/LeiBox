import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

import { INTERACTION_COMPONENTS } from "../src/data/interaction-components.ts";
import { COMPONENTS } from "../src/data/components.ts";
import { ORBIT_NOT_FOUND } from "../src/data/orbit-not-found.ts";
import { getMotionPackages } from "../src/lib/motion-packages.ts";
import { interactionTranslations } from "../src/lib/i18n/interactions.ts";
import { docsTranslations } from "../src/lib/i18n/docs.ts";
import { AI_DISCOVERY, type Discovery } from "../src/data/ai-discovery.ts";
import { PUBLIC_SITE_URL } from "../src/lib/site-url.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "ai");
const frameworks = ["react", "vue", "svelte", "solid", "preact", "vanilla"] as const;

const configuredBase = PUBLIC_SITE_URL;
let siteBase = "";
if (configuredBase) {
  const parsed = new URL(configuredBase);
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.pathname !== "/" || parsed.search || parsed.hash || parsed.username || parsed.password) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an HTTP(S) origin without a path, credentials, query, or fragment.");
  }
  siteBase = parsed.origin;
}
const localLink = (pathname: string) => `${siteBase}${pathname}`;
const normalize = (text: string) => text.trim().replace(/\s+/g, " ");
const translations = new Map(Object.entries({ ...docsTranslations, ...interactionTranslations }).map(([en, zh]) => [normalize(en), zh]));
const zh = (text: string) => translations.get(normalize(text)) ?? text;
await fs.mkdir(path.join(OUT, "components"), { recursive: true });
await fs.copyFile(path.join(ROOT, "integrations/skills/leibox/SKILL.md"), path.join(OUT, "SKILL.md"));
type CatalogItem = { slug: string; name: { en: string; zh: string }; description: { en: string; zh: string }; keywords?: string; docsPath: string; detailPath: string; markdownPath: string; previewPath: string; frameworks: readonly string[]; renderers: readonly string[]; source: Record<string, unknown>; distribution: Record<string, unknown>; discovery: Discovery };
function discovery(slug: string): Discovery {
  const profile = AI_DISCOVERY[slug];
  if (!profile) throw new Error(`Missing task-oriented search metadata for ${slug}: update src/data/ai-discovery.ts`);
  return profile;
}
const items: CatalogItem[] = [];

async function addReference(
  component: Pick<CatalogItem, "slug" | "docsPath" | "previewPath" | "keywords" | "frameworks" | "renderers"> & {
    name: string; description: string; sourceUrl: string; provider: "upstream" | "github";
  },
) {
  const { slug, docsPath, previewPath, keywords, sourceUrl, provider } = component;
  const isUpstream = provider === "upstream";
  const notice = isUpstream
    ? { en: "Use the Canvas UI documentation to choose a framework and install from its original registry.", zh: "从 Canvas UI 原站选择框架和渲染器，按原站说明安装。" }
    : { en: "Use the GitHub source and the LeiBox documentation to integrate this React / Next.js example.", zh: "通过 GitHub 查看 React / Next.js 源码，结合 LeiBox 文档接入。" };
  const detailPath = `/ai/components/${slug}.json`;
  const markdownPath = `/ai/components/${slug}.md`;
  const profile = discovery(slug);
  const entry: CatalogItem = {
    slug, docsPath, previewPath, keywords, detailPath, markdownPath,
    name: { en: component.name, zh: zh(component.name) },
    description: { en: component.description, zh: zh(component.description) },
    frameworks: component.frameworks, renderers: component.renderers,
    discovery: { ...profile, caveat: isUpstream ? `${profile.caveat} ${notice.zh}` : profile.caveat },
    source: {
      kind: isUpstream ? "upstream-reference" : "project-reference",
      provider: isUpstream ? "Canvas UI" : "LeiBox",
      url: sourceUrl,
      license: isUpstream ? "MIT + Commons Clause. Follow the original provider's terms." : "See the notices in the LeiBox repository.",
    },
    distribution: { canRedistributeSource: false, installFromThisSite: false, installProvider: provider, notice },
  };
  await fs.writeFile(path.join(OUT, "components", `${slug}.json`), JSON.stringify({ ...entry, packages: {} }, null, 2));
  await fs.writeFile(path.join(OUT, "components", `${slug}.md`), [
    `# ${entry.name.en} / ${entry.name.zh}`, "", entry.description.en, "", entry.description.zh, "",
    `[LeiBox demo and documentation](${localLink(docsPath)}) · [${entry.source.provider} source](${sourceUrl})`, "",
    notice.en, "", notice.zh, "",
  ].join("\n"));
  items.push(entry);
}

await addReference({
  ...ORBIT_NOT_FOUND, docsPath: ORBIT_NOT_FOUND.href, previewPath: ORBIT_NOT_FOUND.preview,
  provider: "github", frameworks: ["react"], renderers: [],
});

for (const component of INTERACTION_COMPONENTS) {
  const packages = await getMotionPackages(component.slug);
  const detailPath = `/ai/components/${component.slug}.json`;
  const markdownPath = `/ai/components/${component.slug}.md`;
  const entry: CatalogItem = {
    slug: component.slug,
    name: { en: component.name, zh: zh(component.name) },
    description: { en: component.description, zh: zh(component.description) },
    keywords: component.keywords,
    docsPath: component.href, detailPath, markdownPath,
    previewPath: component.preview,
    discovery: discovery(component.slug),
    frameworks: packages.map((pack) => pack.framework), renderers: component.renderers ?? [],
    source: {
      kind: "project-source", provider: "LeiBox", implementation: component.codeSource ?? "LeiBox component package",
      designReference: component.referenceUrl ?? null, designAuthor: component.referenceAuthor ?? null,
      ...(component.original ? { original: true, author: "雷师傅" } : {}),
      license: component.referenceLicense ?? "Retain source notices and design-reference attribution; no blanket license is assigned by the catalog.",
    },
    distribution: { canRedistributeSource: true, installFromThisSite: true, installProvider: "leibox", notice: { en: "Complete source files from this project's existing framework package. Preserve included notices and reference attribution.", zh: "提供本站已有框架代码包的完整文件，保留源码声明与设计参考署名。" } },
  };
  const packageRefs: Record<string, unknown> = {};
  const folder = path.join(OUT, "packages", component.slug);
  await fs.mkdir(folder, { recursive: true });
  for (const pack of packages) {
    const url = `/ai/packages/${component.slug}/${pack.framework}.json`;
    const payload = {
      schemaVersion: 1, slug: component.slug, framework: pack.framework, component: pack.component,
      dependencies: pack.dependencies, install: pack.install, usage: pack.usage, source: entry.source,
      files: pack.files.map((file) => ({ path: file.fileName, content: file.source, sha256: createHash("sha256").update(file.source).digest("hex") })),
    };
    await fs.writeFile(path.join(folder, `${pack.framework}.json`), JSON.stringify(payload));
    packageRefs[pack.framework] = { url, component: pack.component, dependencies: pack.dependencies, usage: pack.usage, files: pack.files.map((file) => file.fileName) };
  }
  await fs.writeFile(path.join(OUT, "components", `${component.slug}.json`), JSON.stringify({ ...entry, packages: packageRefs, instructions: { en: component.instructions ?? "", zh: zh(component.instructions ?? "") } }, null, 2));
  await fs.writeFile(path.join(OUT, "components", `${component.slug}.md`), [
    `# ${entry.name.en} / ${entry.name.zh}`, "", entry.description.en, "", entry.description.zh, "",
    `Docs: ${localLink(component.href)}`, `Detail: ${localLink(detailPath)}`, "",
    "Use the installed LeiBox Skill to pull the selected framework's complete source, or fetch one package JSON directly:", "",
    ...packages.map((pack) => `- ${pack.label}: ${localLink(`/ai/packages/${component.slug}/${pack.framework}.json`)}`), "",
    `Design reference: ${component.original ? "LeiShiFu original interaction / 雷师傅原创" : component.referenceUrl ?? "Not supplied"}`, `Source notice: ${entry.source.license}`, "",
  ].join("\n"));
  items.push(entry);
}

for (const component of COMPONENTS) {
  await addReference({
    ...component,
    slug: component.href.split("/").at(-1)!,
    docsPath: component.href, previewPath: component.video, sourceUrl: `https://canvasui.dev${component.href}`,
    provider: "upstream", frameworks, renderers: ["webgl", "webgpu"],
  });
}

// File-based discovery also installs the standalone helper; no Git checkout is required.
const skillRoot = path.join(ROOT, "integrations/skills/leibox");
const currentSlugs = new Set(items.map(item => item.slug));
for (const file of await fs.readdir(path.join(OUT, "components"))) {
  const match = file.match(/^([a-z]+(?:-[a-z]+)*)\.(json|md)$/);
  if (match && !currentSlugs.has(match[1])) await fs.unlink(path.join(OUT, "components", file));
}
const skillSource = await fs.readFile(path.join(skillRoot, "SKILL.md"), "utf8");
const description = skillSource.match(/^description: (.+)$/m)![1];
const skillFiles = ["SKILL.md", "scripts/leibox.mjs", "agents/openai.yaml"];
for (const wellKnown of ["agent-skills", "skills"]) {
  const base = path.join(ROOT, "public/.well-known", wellKnown);
  for (const file of skillFiles) {
    const destination = path.join(base, "leibox", file);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(path.join(skillRoot, file), destination);
  }
  await fs.writeFile(path.join(base, "index.json"), JSON.stringify({ skills: [{ name: "leibox", description, files: skillFiles }] }, null, 2));
}
await fs.mkdir(path.join(OUT, "scripts"), { recursive: true });
await fs.copyFile(path.join(skillRoot, "scripts/leibox.mjs"), path.join(OUT, "scripts/leibox.mjs"));
await fs.mkdir(path.join(OUT, "agents"), { recursive: true });
await fs.copyFile(path.join(skillRoot, "agents/openai.yaml"), path.join(OUT, "agents/openai.yaml"));

// The recommendation index deliberately omits long license text, APIs and source packages.
const indexItems = items.map((entry) => ({
  slug: entry.slug, name: entry.name, summary: entry.description.zh,
  frameworks: entry.frameworks, renderers: entry.renderers,
  docsPath: entry.docsPath, detailPath: entry.detailPath, previewPath: entry.previewPath,
  sourceProvider: entry.distribution.installProvider, discovery: entry.discovery,
}));
const revision = createHash("sha256").update(JSON.stringify(indexItems)).digest("hex");
const facet = (values: string[]) => Object.fromEntries([...new Set(values)].sort().map((value) => [value, values.filter((item) => item === value).length]));
const searchIndex = {
  $schema: "/ai/search-index.schema.json", schemaVersion: 1, revision, total: indexItems.length,
  links: { catalog: "/ai/catalog.json", guide: "/ai/README.md", skill: "/ai/SKILL.md" },
  facets: {
    categories: facet(items.map((item) => item.discovery.category)),
    frameworks: facet(items.flatMap((item) => [...item.frameworks])),
    visualTags: facet(items.flatMap((item) => item.discovery.visualTags)),
  },
  items: indexItems,
};
await fs.writeFile(path.join(OUT, "search-index.json"), JSON.stringify(searchIndex));
await fs.copyFile(path.join(ROOT, "scripts/ai-search-index.schema.json"), path.join(OUT, "search-index.schema.json"));
const catalog = {
  schemaVersion: 1,
  title: "LeiBox UI collection metadata",
  revision,
  ...(siteBase ? { siteOrigin: siteBase } : {}),
  links: { searchIndex: "/ai/search-index.json", searchSchema: "/ai/search-index.schema.json", agentGuide: "/ai/README.md", catalog: "/ai/catalog.json", llms: "/llms.txt", docs: "/docs", components: "/components", skill: "/ai/SKILL.md", aiGuide: "/docs/mcp" },
  capabilities: { list: true, bilingualSearch: true, componentMetadata: true, sourceDownload: true, sourceRedistribution: true, perComponentDistribution: true, autoInstall: false },
  classificationPolicy: {
    supportedKinds: ["project-source", "upstream-reference", "project-reference"],
    distribution: "Use LeiBox packages for project-source entries. Reference entries link to the provider's documentation or repository.",
  },
  items,
};
await fs.writeFile(path.join(OUT, "catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`);
await fs.writeFile(path.join(OUT, "README.md"), [
  "# LeiBox Agent 组件检索入口", "",
  "面向正在制作或优化网页、应用界面的 Agent。无需用户知道组件名称，先根据页面的具体用途检索并比较少量候选。", "",
  `当前可检索 ${items.length} 个组件，其中 ${INTERACTION_COMPONENTS.length} 个提供本站框架源码包。内容版本 revision 为 ${revision}。以后以实时 total/items 为准。`, "",
  "## 按需读取", "",
  "1. GET /ai/search-index.json：先读取紧凑的任务索引，不含源码。", 
  "2. 根据 name、summary、discovery.useCases/searchTerms 匹配需求；按 frameworks、renderers、discovery.category 筛选，结合 visualTags、interactions 和 caveat 比较。",
  "3. 返回 1–3 个候选，使用 docsPath 或 previewPath 展示效果，说明具体用途与限制。",
  "4. 沿选中项的 detailPath 读取详情。本站源码包地址在 packages[framework].url，参考条目的来源链接在 source.url。",
  "5. 用户要求实现时，按详情的分发方式取得源码，再接入项目并验证。", "",
  "所有 / 开头的链接相对于本站 origin。GET 返回静态 JSON；不支持向这些地址附加 query/framework 参数来过滤，需要在客户端筛选，或使用 Skill 自带的查询工具。", "",
  "## 索引字段", "",
  "字段结构见 /ai/search-index.schema.json。slug 为稳定组件标识；name 为中英文名称；summary 为简短说明。discovery 提供用途、搜索词、风格、交互及接入注意事项。frameworks/renderers 对应本站源码包或来源文档。",
  "facets 提供可用类别、框架和视觉标签及对应条目数；revision 是索引内容的 SHA-256，不同内容对应不同版本。可在当前任务内复用已读取的索引，下一次任务重新获取。", "",
  "## 安装后的工具", "",
  'node "<技能安装目录>/scripts/leibox.mjs" recommend "图片生成等待" --framework react --limit 3',
  'node "<技能安装目录>/scripts/leibox.mjs" recommend "长文章节导航" --category navigation',
  'node "<技能安装目录>/scripts/leibox.mjs" recommend "加载反馈" --exclude-tag particles', "",
  "recommend 通过公开的用途词匹配排序，返回 matchedTerms/reasons，score 只用于同一次查询的相对排序，不是质量评分或概率。尊重用户排除的风格，可使用 --exclude-tag（多个标签用逗号分隔）。明确关键词可用 search，多词要求同时匹配。无推荐结果时返回 count: 0；可以改短用途词重试一次，不捏造组件。", "",
  "## 来源与边界", "",
  "sourceProvider 为 leibox、upstream 或 github，分别对应本站源码包、Canvas UI 原站和 LeiBox GitHub 仓库。完整来源和许可见详情。", "",
].join("\n"));
const llms = [
  "# LeiBox / UI 设计与组件收藏",
  "",
  "> 按界面开发需求推荐组件，查找匹配框架的源码包或原始来源。Start with the task-oriented search index; fetch details and source only for selected components.",
  "",
  "## Machine-readable entry points",
  "",
  `- [Task search index](${localLink("/ai/search-index.json")}): Compact use cases, bilingual intent terms, categories, visual tags, interactions, caveats, supported frameworks and detail links. Read this first.`,
  `- [Index schema](${localLink("/ai/search-index.schema.json")}): Versioned field contract for agents and indexers.`,
  `- [Agent guide](${localLink("/ai/README.md")}): Recommendation workflow, filters, source retrieval and static endpoint behavior.`,
  `- [Catalog JSON](${localLink("/ai/catalog.json")}): All ${items.length} entries, stable slugs, bilingual descriptions, frameworks, renderers, and provenance.`,
  `- [Component list](${localLink("/components")}): Human-facing previews.`,
  `- [Documentation](${localLink("/docs")}): Usage and browser capabilities.`,
  `- [AI integration guide](${localLink("/docs/mcp")}): Skill installation, search and source downloads.`,
  `- [LeiBox Skill](${localLink("/ai/SKILL.md")}): Install with npx skills add ${siteBase} --skill leibox.`,
  "",
  "Paths beginning with / are relative to the origin serving this file. When only a local preview is running, remote AI services cannot fetch it; use the local CLI or paste the copied metadata/prompt.",
  "",
  "## Components",
  "",
  ...items.map((entry) => `- [${entry.name.en} / ${entry.name.zh}](${localLink(entry.markdownPath)}): ${entry.description.en}`),
  "",
  "## Use with an AI assistant",
  "",
  "Read the compact task index, match the user's actual UI task, compare a few candidates, then fetch only their detailPath. Explain relevance and caveats. Use the project's real framework and existing design system. Do not require the user to mention LeiBox first or force unrelated decorative effects.",
  "",
  "The installed Skill includes scripts/leibox.mjs: recommend, list, search, show, and pull. Recommend uses indexed intent terms with framework/category/renderer filters and a bounded result count; it returns matching evidence, not a quality score. Pull downloads the selected framework's complete file set without running it or overwriting different existing files. New published entries are found from the live index; Skill instruction/tool upgrades require updating the installed Skill.",
  "",
  "## Provenance and distribution",
  "",
  "Preserve source notices and design attribution. Availability from this collection is not a claim that all designs and third-party code were authored by LeiBox.",
  "",
].join("\n");
await fs.writeFile(path.join(ROOT, "public/llms.txt"), llms);
console.log(`Built ${items.length} bilingual entries, ${INTERACTION_COMPONENTS.length * frameworks.length} framework source packages and the installable LeiBox Skill.`);
