# LeiBox Skill 与全站源码检索

安装 Skill 后，在支持自动发现的 AI 客户端中，Agent 会按当前界面任务主动检索适合的 LeiBox 组件，说明推荐理由，再按项目实际框架接入完整源码。用户不必先提 LeiBox 或知道组件名字。使用方不需要克隆 LeiBox 仓库、启动开发服务器或配置 MCP 服务。

```sh
npx skills add https://leibox-ui.netlify.app --skill leibox
```

安装器会让使用者选择 AI 客户端和安装范围。该命令使用公开的 Skill discovery 地址，安装 `SKILL.md`、`scripts/leibox.mjs` 和 `agents/openai.yaml`，其中启用了隐式调用。安装不会启动后台任务，是否自动选择此 Skill 仍取决于宿主的 Skill 发现机制。

安装后可以直接向 AI 说：

> 给图片生成过程加一个等待反馈，用项目现有的 React 接入。

Skill 会先检查项目，再检索相关用途，通常推荐 1–3 个候选并说明限制。已要求实现且方向明确时直接接入；只咨询方案时仅推荐。已有明确组件或设计系统时遵循原选择，不强加装饰。

## 实时目录与下载

- `/ai/search-index.json`：优先读取的紧凑索引，包含每个组件的用途类别、应用场景、中英文用途词、视觉标签、交互方式、注意事项、框架和预览/详情路径；不包含源码。
- `/ai/search-index.schema.json`：索引的 JSON Schema 字段契约。
- `/ai/README.md`：Agent 检索、推荐、分层取源码的访问说明。
- `/ai/catalog.json` 与 `/llms.txt`：完整目录及发现入口，保留中英文名称、描述、框架、来源与分发信息。
- `/ai/components/{slug}.json`：组件详情、源码提供者、六框架下载地址或上游注册表地址。
- `/ai/packages/{slug}/{framework}.json`：本站组件的完整原始文件、SHA-256、依赖和使用示例。读取一个框架即可，不必下载所有框架。
- `/ai/SKILL.md` 与 `/ai/scripts/leibox.mjs`：可直接阅读的 Skill 及独立脚本。
- `/.well-known/agent-skills/index.json` 与 `/.well-known/skills/index.json`：Skill 安装器发现入口。

每次查询都读取线上目录。新增组件并发布后即可检索，不必把组件列表写死在 Skill 内；Skill 指令或工具本身升级时，需要更新已安装的 Skill。索引提供内容 SHA-256 `revision`，以及类别、框架和风格标签的 `facets`。所有路径相对于提供文件的网站 origin；这些端点是静态 JSON，查询参数不会替你过滤，使用方应自行筛选或调用 Skill 工具。

## Skill 中的独立工具

以下路径以实际安装位置为准。在使用方项目目录中执行，脚本可使用绝对路径：

```sh
node <installed-skill>/scripts/leibox.mjs recommend "图片生成等待" --framework react --limit 3
node <installed-skill>/scripts/leibox.mjs recommend "长文章节导航" --category navigation --limit 2
node <installed-skill>/scripts/leibox.mjs recommend "加载反馈" --exclude-tag particles
node <installed-skill>/scripts/leibox.mjs search "玻璃 文件夹"
node <installed-skill>/scripts/leibox.mjs show glass-folder --framework react
node <installed-skill>/scripts/leibox.mjs pull glass-folder --framework react --out src/components/leibox/glass-folder
```

脚本支持 `recommend`、`list`、`search`、`show`、`pull`。recommend 用可查看的中英文用途词匹配，返回匹配词和推荐依据，默认最多 3 项、最多允许 10 项；分数是同次查询的排序依据，不是质量评分或概率。支持框架、渲染器、用途类别过滤，以及排除风格标签。无合适推荐时返回 `count: 0`，不随意补齐候选。search 保留多关键词同时匹配的方式。

查询只读；pull 下载源码、核对文件校验值并写入指定目录，不执行代码或 npm 命令。同内容文件复用；遇到不同的已有文件，在写入前报冲突，不覆盖用户工作。推荐仅请求轻量索引，show/pull 再按需取详情与单个框架源码。

本站原有动效组件读取本站框架代码包；Canvas UI 参考条目直接从原作者的公开注册表拉取，保留其许可和署名。完整检索覆盖两类条目，不把上游代码重新声明成本站原创。

## 生成与维护

安装验证使用 Node.js 24.19.0。Windows 上的旧版 Node.js 24.11.0 配合 skills 1.7.4 曾在显示“Installation complete”后出现 `UV_HANDLE_CLOSING` 退出异常；使用维护中的 Node.js 22 LTS 或更新的 Node.js 24。独立查询/拉取脚本本身使用 Node.js 18+ 标准库，不依赖该安装器运行。

```sh
npm run motion:build
npm run ai:catalog
npm run test:ai
```

生成器读取当前组件数据和真实六框架包，同步生成索引、目录、详情、源码包及 Skill discovery 文件。新增组件时，在 `src/data/ai-discovery.ts` 同步维护用途信息；框架与下载地址仍从真实包派生。Schema 源文件为 `scripts/ai-search-index.schema.json`。不要手改 public 下的生成文件。项目内可维护的 Skill 源码位于 `integrations/skills/leibox/`。

仓库原有的本地查询 CLI 仍可使用，但它不是安装 Skill 的前提：

```sh
npm --silent run ui -- search "玻璃 文件夹"
```
