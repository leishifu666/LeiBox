import { T as TranslatedText } from "@/components/common/language-provider";

import type { Metadata } from "next";

import { CodeBlock } from "@/components/docs/code-block";
import { CopyButton } from "@/components/docs/copy-button";
import { highlight } from "@/components/docs/highlight";
import { SnippetTabs, type SnippetTab } from "@/components/docs/snippet-tabs";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "MCP Server",
  description:
    "Use the Canvas UI registry with the shadcn MCP server so your AI assistant can browse and install components.",
  alternates: { canonical: "/docs/mcp" },
};

const REGISTRY_CONFIG = `{
  "registries": {
    "@canvas-ui": "https://canvasui.dev/r/{name}.json"
  }
}`;

const CODEX_CONFIG = `[mcp_servers.shadcn]
command = "npx"
args = ["shadcn@latest", "mcp"]`;

const ADD_COMMAND = "npx shadcn@latest add @canvas-ui/liquid-react";

const initCommand = (client: string) =>
  `npx shadcn@latest mcp init --client ${client}`;

const PROMPTS = [
  "Show me the components in the @canvas-ui registry",
  "Add liquid from the @canvas-ui registry to my hero section",
];

const CLIENTS = [
  { id: "claude", label: "Claude Code", source: initCommand("claude") },
  { id: "cursor", label: "Cursor", source: initCommand("cursor") },
  { id: "vscode", label: "VS Code", source: initCommand("vscode") },
  {
    id: "codex",
    label: "Codex",
    source: CODEX_CONFIG,
    fileName: "~/.codex/config.toml",
  },
  { id: "opencode", label: "OpenCode", source: initCommand("opencode") },
] as const;

const PAGE_MARKDOWN = `# MCP server

Use the Canvas UI registry with the shadcn MCP server so your AI assistant can browse and install components for you.

The shadcn MCP server works with any shadcn-compatible registry, including this one. Point it at the Canvas UI registry and your assistant can list components, read their metadata, and add them straight to your project.

## Configure the registry

Canvas UI is a trusted shadcn registry, so the @canvas-ui namespace works out of the box, with or without MCP:

\`\`\`sh
${ADD_COMMAND}
\`\`\`

WebGPU registry items use the same name with -webgpu after the framework, for example @canvas-ui/liquid-react-webgpu.

Optionally, you can pin the registry in your components.json file:

\`\`\`json
${REGISTRY_CONFIG}
\`\`\`

## Set up your client

### Claude Code

\`\`\`sh
${initCommand("claude")}
\`\`\`

Restart Claude Code. Use the /mcp command to debug the server.

### Cursor

\`\`\`sh
${initCommand("cursor")}
\`\`\`

Open Cursor Settings and enable the MCP server for shadcn.

### VS Code

\`\`\`sh
${initCommand("vscode")}
\`\`\`

Open .vscode/mcp.json and select Start next to the shadcn server, then prompt through GitHub Copilot.

### Codex

Add the following to ~/.codex/config.toml, then restart Codex:

\`\`\`toml
${CODEX_CONFIG}
\`\`\`

### OpenCode

\`\`\`sh
${initCommand("opencode")}
\`\`\`

Restart OpenCode.

## Prompts to try

${PROMPTS.map((prompt) => `- ${prompt}`).join("\n")}
`;

export default async function McpPage() {
  const [configHtml, codexHtml] = await Promise.all([
    highlight(REGISTRY_CONFIG, "json"),
    highlight(CODEX_CONFIG, "toml"),
  ]);

  const clientTabs: SnippetTab[] = CLIENTS.map((client) => ({
    id: client.id,
    label: client.label,
    fileName: "fileName" in client ? client.fileName : undefined,
    source: client.source,
    html: client.id === "codex" ? codexHtml : undefined,
  }));

  const prompts = (
    <ul>
      {PROMPTS.map((prompt) => (
        <li key={prompt}>{prompt}</li>
      ))}
    </ul>
  );

  const footers = {
    claude: (
      <>
        <p><TranslatedText>Restart Claude Code and try the following prompts:</TranslatedText></p>
        {prompts}
        <p><TranslatedText>
          You can use the </TranslatedText><code>/mcp</code><TranslatedText> command in Claude Code to debug the
          MCP server.
        </TranslatedText></p>
      </>
    ),
    cursor: (
      <>
        <p><TranslatedText>
          Open Cursor Settings and enable the MCP server for shadcn, then try
          the following prompts:
        </TranslatedText></p>
        {prompts}
      </>
    ),
    vscode: (
      <>
        <p><TranslatedText>
          Open </TranslatedText><code>.vscode/mcp.json</code><TranslatedText> and select Start next to the shadcn
          server, then try the following prompts with GitHub Copilot:
        </TranslatedText></p>
        {prompts}
      </>
    ),
    codex: (
      <>
        <p><TranslatedText>Restart Codex and try the following prompts:</TranslatedText></p>
        {prompts}
      </>
    ),
    opencode: (
      <>
        <p><TranslatedText>Restart OpenCode and try the following prompts:</TranslatedText></p>
        {prompts}
      </>
    ),
  };

  return (
    <article className="page-enter mx-auto w-full max-w-3xl">
      <div className="typeset typeset-docs">
        <div className="flex items-start justify-between gap-4">
          <h1><TranslatedText>MCP server</TranslatedText></h1>
          <CopyButton
            text={PAGE_MARKDOWN}
            label="Copy as Markdown"
            className="mt-1 shrink-0 border border-border/70 px-3"
          />
        </div>
        <p className="max-w-xl text-muted-foreground"><TranslatedText>
          Use the Canvas UI registry with the shadcn MCP server, and let your AI
          assistant browse and install components for you.
        </TranslatedText></p>
        <p><TranslatedText>
          The shadcn MCP server works with any shadcn-compatible registry,
          including this one. Point it at the Canvas UI registry and your
          assistant can list components, read their metadata, and add them
          straight to your project.
        </TranslatedText></p>

        <h2><TranslatedText>Configure the registry</TranslatedText></h2>
        <p><TranslatedText>
          Canvas UI is a trusted shadcn registry, so the</TranslatedText>{" "}
          <code>@canvas-ui</code><TranslatedText> namespace works out of the box, with or
          without MCP:
        </TranslatedText></p>
        <div className="my-6">
          <CodeBlock source={ADD_COMMAND} />
        </div>
        <p><TranslatedText>
          WebGPU registry items use the same name with </TranslatedText><code>-webgpu</code>{" "}<TranslatedText>
          after the framework, for example</TranslatedText>{" "}
          <code>@canvas-ui/liquid-react-webgpu</code>.
        </p>
        <p><TranslatedText>
          Optionally, you can pin the registry in your</TranslatedText>{" "}
          <code>components.json</code><TranslatedText> file:
        </TranslatedText></p>
        <div className="my-6">
          <CodeBlock
            html={configHtml}
            source={REGISTRY_CONFIG}
            fileName="components.json"
          />
        </div>

        <h2><TranslatedText>Set up your client</TranslatedText></h2>
        <p><TranslatedText>Run the setup for your client, straight from your project:</TranslatedText></p>
        <div className="mt-6">
          <SnippetTabs
            storageKey="mcp-client"
            tabs={clientTabs}
            footers={footers}
          />
        </div>
      </div>

      <div className="mt-24">
        <Footer variant="docs" />
      </div>
    </article>
  );
}
