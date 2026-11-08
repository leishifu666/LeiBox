# LeiBox Agent 组件检索入口

面向正在制作或优化网页、应用界面的 Agent。无需用户知道组件名称，先根据页面的具体用途检索并比较少量候选。

当前可检索 58 个组件，其中 48 个提供本站框架源码包。内容版本 revision 为 ec051883c3d34df3327ccc7d3d34972cba515288c41efff69e0d838b1c30f73e。以后以实时 total/items 为准。

## 按需读取

1. GET /ai/search-index.json：先读取紧凑的任务索引，不含源码。
2. 根据 name、summary、discovery.useCases/searchTerms 匹配需求；按 frameworks、renderers、discovery.category 筛选，结合 visualTags、interactions 和 caveat 比较。
3. 返回 1–3 个候选，使用 docsPath 或 previewPath 展示效果，说明具体用途与限制。
4. 沿选中项的 detailPath 读取详情。本站源码包地址在 packages[framework].url，参考条目的来源链接在 source.url。
5. 用户要求实现时，按详情的分发方式取得源码，再接入项目并验证。

所有 / 开头的链接相对于本站 origin。GET 返回静态 JSON；不支持向这些地址附加 query/framework 参数来过滤，需要在客户端筛选，或使用 Skill 自带的查询工具。

## 索引字段

字段结构见 /ai/search-index.schema.json。slug 为稳定组件标识；name 为中英文名称；summary 为简短说明。discovery 提供用途、搜索词、风格、交互及接入注意事项。frameworks/renderers 对应本站源码包或来源文档。
facets 提供可用类别、框架和视觉标签及对应条目数；revision 是索引内容的 SHA-256，不同内容对应不同版本。可在当前任务内复用已读取的索引，下一次任务重新获取。

## 安装后的工具

node "<技能安装目录>/scripts/leibox.mjs" recommend "图片生成等待" --framework react --limit 3
node "<技能安装目录>/scripts/leibox.mjs" recommend "长文章节导航" --category navigation
node "<技能安装目录>/scripts/leibox.mjs" recommend "加载反馈" --exclude-tag particles

recommend 通过公开的用途词匹配排序，返回 matchedTerms/reasons，score 只用于同一次查询的相对排序，不是质量评分或概率。尊重用户排除的风格，可使用 --exclude-tag（多个标签用逗号分隔）。明确关键词可用 search，多词要求同时匹配。无推荐结果时返回 count: 0；可以改短用途词重试一次，不捏造组件。

## 来源与边界

sourceProvider 为 leibox、upstream 或 github，分别对应本站源码包、Canvas UI 原站和 LeiBox GitHub 仓库。完整来源和许可见详情。
