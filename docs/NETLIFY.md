# LeiBox 的 Netlify 部署历史

- 当前正式域名：https://leibox.pantoria.cn
- 项目管理：https://app.netlify.com/projects/leibox-ui
- 项目 ID：`dadbc431-b78f-44e6-8d25-bf20d77f31d8`
- 已发布版本：`6adde5699d2189d35e6faeab`（LeiBox Skill 主动推荐与任务检索索引，2026-10-25 北京时间）。本次在汉化版 `6adde1073c516ab5a7bf7dad` 上新增轻量索引、Schema 和 Agent 访问说明，更新 Skill、完整目录、组件详情及 llms.txt；新增 3 个文件、更新 50 个文件，源码包未改。前次 Skill 及数据发布以 `6addce5e7b66fc6774e40054` 为基底，经 `6addd78e874717898a1c54a8` 和 `6addd90a62d54fa2d15afb58` 发布全站源码检索并修正 SKILL.md 大小写路径。页面文件及 API 函数代码、路由和限流配置保持一致。生产网站已设为公开访问，预览仍保留默认私有设置。GitHub Star 自动更新版本为 `6add3beae9fdb7fe79d8944c`；Logo 恢复原 25px 显示高度的版本为 `6adb3203352195a391a0fb16`；ei 连字初次发布为 `6adb27b845dd22480c98c31d`，MiSans 字体更新为 `6adb10f64b3060ef9e8eee5c`。
- 本地项目仍为 `F:\雷师傅\ui组件网站`，没有创建 worktree，也没有提交或推送 Git。

2026-10-29 起，当前部署位于腾讯云宝塔，见 [腾讯云部署记录](./DEPLOY-TENCENT.md)。以下保留 Netlify 的原部署方式和历史验证结果，不代表新域名的验收状态。

## 架构与存储

Next.js 使用 `output: "export"`，网页、图片、视频、六框架组件及 AI 元数据由 Netlify 托管。构建先输出 `out/`，再生成独立的 `.netlify/publish/` 发布快照，避免其他本地构建覆盖正在上传的文件。当前没有服务端文件上传或用户文件持久化需求，因此无需阿里云 OSS，也没有创建 OSS 资源。

`netlify/functions/api.ts` 复用现有 Worker 的留言与订阅处理逻辑，映射到 `/api/*`。本地预览的订阅模拟不会用于线上。

## 构建及更新

使用 Node.js 24。`netlify.toml` 设置构建命令 `npm run build:netlify`、发布目录 `.netlify/publish`，并关闭不需要的 Next.js SSR 适配器。构建会生成 Next 16 导航分段文件的平铺别名和正确的 RSC MIME 响应头。

已登录 Netlify 并完成项目关联后，在原项目目录运行：

```powershell
netlify deploy --prod
```

如在其他机器上，先执行 `netlify link --id dadbc431-b78f-44e6-8d25-bf20d77f31d8`。本次为本地构建上传，没有连接 Git 自动发布。

如果改正式域名，需要同步修改 Netlify 构建环境的 `NEXT_PUBLIC_SITE_URL` 并重新构建。

## LeiBox Skill 公网安装

首页的入口用于安装 Skill，让 AI 搜索并拉取全站组件，命令固定使用正式网站：

```sh
npx skills add https://leibox.pantoria.cn --skill leibox
```

`scripts/build-ai-catalog.mts` 从网站组件集合及真实框架包生成完整目录、组件详情、168 个本站框架源码包和两个兼容的 well-known Skill discovery 入口。当前覆盖 37 个组件；Skill 自带独立的 Node.js 搜索与源码拉取工具。旧的单组件注册表仍保留，但不再是首页主安装方式。

已从正式 HTTPS 地址安装到空项目，并用安装后的脚本搜索中文需求、拉取 React/Vue 本站组件与原作者的 Canvas UI 源码；拉取的组件编译、渲染三个画布并清理通过。12 项 AI 回归测试检查目录覆盖、全部源码与校验值、冲突保护和 discovery 文件。回执及验证证据在 `work/leibox-skill-20261025/`。测试使用 Node.js 24.19.0；本次未更换系统默认 Node。

主动推荐版新增 `recommend`，支持任务用途词排序、框架/渲染器/类别过滤、排除视觉标签和有界候选数，返回匹配词、推荐依据与接入注意事项。`/ai/search-index.json` 覆盖 37 个组件，约 31 KB，不包含源码；`/ai/search-index.schema.json` 定义字段，`/ai/README.md` 说明分层访问流程。索引版本来自内容 SHA-256，框架和下载地址从现有真实代码包生成。

当前 16 项 AI 测试通过，包含 Schema 校验、目录覆盖、中英文任务推荐、过滤与无结果处理，以及全部源码包与冲突保护。已从公网全新安装并用安装后的脚本推荐等待反馈、长文章节导航、团队邀请和聊天输入框，再拉取 React 加载组件的 4 个源码文件并校验内容。证据在 `work/leibox-skill-proactive-20261025/`；本机全局安装版已同步。已开启 `allow_implicit_invocation`，实际自主触发仍取决于宿主的 Skill 发现机制，本次未声称完成独立模型的新会话触发测试。

此次仅发布上述公开 Skill 与数据，没有发布本地其他网页改版。当前页面基底仍为 `work/github-stars-20261025/publish/` 加上公开安装与汉化相关的数据增量；不要用旧页面快照覆盖新 AI 数据。Netlify 文件 API 会把 SKILL.md 路径规范化为小写，发布清单应先统一路径大小写再合并；实际 HTTP 大写路径也可访问。

Skill 的界面显示名称为“LeiBox 组件库”，简介、说明和默认提示词均为中文；机器标识和调用方式仍为 `leibox` / `$leibox`。汉化源文件位于 `integrations/skills/leibox/`，由目录生成器同步到公开分发入口。本机全局安装版也已同步，验证记录位于 `work/leibox-skill-zh-20261025/`。

## GitHub Star 自动更新

右上角按钮指向 `leishifu666/LeiBox`，匿名读取 GitHub 仓库接口的 `stargazers_count`。0 是有效数量；读取失败时保留已有数量或显示 GitHub，不将未知结果冒充 0。缓存按仓库隔离，有效期 5 分钟；页面保持打开时定时刷新，从其他页面切回来时重新读取。没有在浏览器中使用 GitHub 令牌。

本次只修改 `src/lib/github.ts` 与 `src/components/common/github-stars.tsx`。当前本地还包含未发布的首页和组件改动，所以完整生产构建只用于生成这两个模块；发布时将它们链接进上一版线上快照，并更新相关资源地址。原页面结构、其他模块、CSS 与媒体保持原样。模块 ID 和依赖已核对一致；发布快照和打包检查在 `work/github-stars-20261025/`。本次正式快照是该目录的 `publish/`，不是包含完整本地改版的 `.netlify/publish/`。

类型检查、相关源码 ESLint、8 项部署和资源回归检查通过。浏览器验证了真实数量、缓存 0、返回页面重新取数及过期缓存替换，并检查了 375 / 768 / 1440 页头和站内导航；Logo 保持 25px。生产站点 10 项资源检查通过：页面使用新组件与正确仓库地址，组件块及品牌文件 SHA-256 一致。页面检查考虑了 Netlify 注入托管注释和 Pretty URLs 重写；未把平台后处理后的 HTML 声称为逐字节相同。函数实现文件与上一版一致，函数包仅 package.json 中的仓库元信息和开发依赖元数据有所不同。

## 邮件配置

当前新项目未配置邮件服务凭据。留言 API 会返回 `503 service_unavailable`，不会虚假提示发送成功；页面中的邮箱直达链接仍可使用。

要启用留言，在 Netlify 项目环境变量中设置服务端的 `RESEND_API_KEY` 和已由 Resend 验证的 `CONTACT_FROM`，然后重新部署。`CONTACT_TO` 可选，默认 `leir0491@gmail.com`。不要将密钥写进 `NEXT_PUBLIC_*`、源码或公开静态目录。

如需启用邮件订阅，还需配置自己的 `RESEND_SEGMENT_ID`、`TURNSTILE_SECRET_KEY` 及构建变量 `NEXT_PUBLIC_TURNSTILE_SITE_KEY`。没有沿用上游网站的订阅分组或验证码凭据。

## 验证命令

```powershell
node --test scripts/netlify-deploy.test.mjs scripts/contact-mail.test.mjs
```

先完成 `npm run build:netlify`，再运行部署测试，因为导航测试会检查实际发布快照。

首次部署验证：生产构建及类型检查成功，17 项本地测试通过；匿名访问的 42 项线上检查通过，其中包括 35 个导出页面地址、首页静态资源、RSC 跳转文件、视频 Range、AI 目录、安装注册表、404 和 API 错误状态。375 / 768 / 1440 宽度截图已核对；浏览器实测首页到列表、列表到组件详情的站内跳转，留言弹窗的 Escape 关闭及焦点恢复，以及文件夹演示展开、添加文件。未测试真实邮件投递，也未穷举所有组件参数和浏览器。

MiSans 更新：字体随网站自托管，无需 OSS。生产构建和类型检查、相关文件的 ESLint 及 4 项部署测试通过；线上 61 项资源检查通过，其中包含全部 56 个原始字体分块的 SHA-256 校验、4 个代表页面及字体许可声明。浏览器实测线上标题、正文、导航及等宽区域中的中文均使用自托管 MiSans，英文代码仍使用 Geist Mono；站内跳转与三个宽度的首页检查通过。字体来源与使用说明见 [FONTS.md](./FONTS.md)。Netlify 项目设置中的 Powered by Netlify 标识已关闭，线上未发现标识 iframe。

ei 连字 Logo 更新：共用组件采用定稿的纯轮廓 SVG，按原比例显示并适配明暗主题，分享图同步更新。原图形、favicon、ICO 和应用图标的 SHA-256 保持不变。生产构建与类型检查、相关源码 ESLint、8 项部署及现有资源回归检查通过；14 项线上页面和资源核验通过。实际查看了正式网站 375 / 768 / 1440 宽度的首页，以及手机和桌面的反白效果、组件侧栏；测试了首页到组件页的站内跳转和 Logo 的 Enter 返回首页。本地手机导航展开与 Logo 也已检查。线上 MiSans 正常加载，未发现 Netlify 标识 iframe。发布回执、截图及核验明细位于 `work/logo-rollout-20261023/`；未穷举所有页面与浏览器。

Logo 尺寸更正：初次替换时保留了 112px 宽度，却使新组合高度升至约 39px。用户指出后，网站共用 Logo 已恢复原来的 25px 高度并等比缩放，移动页头也取消了单独的宽度覆盖。SVG 母版不变。生产构建、类型检查、相关源码 ESLint 与 4 项部署测试通过；正式网站三个宽度的首页、桌面与手机组件页，以及深色模式实测均为 25px 高。回执和截图见 `work/logo-size-fix-20261023/`。

帆船动效修复发布：使用独立发布快照上传当前网站，帆船支持同一章节内滚动转向、反向倾斜、静止阅读时的轻微摇摆与扩散水波。生产构建、类型检查、4 项部署测试和 13 项邮件处理回归检查通过；线上实际验证六框架代码包及提示词复制、缩放演示中的真实滚轮转向与减少动效，以及 375 / 768 / 1440 宽度。18 项线上页面和资源检查通过，六框架核心脚本与发布快照逐字节一致，HTML 核验仅规范化 Netlify 注入的托管注释、Pretty URLs 及属性顺序，RSC 跳转 MIME 正常。发布回执与线上核验记录位于 `work/sailing-deploy-20261023/`。未执行真实邮件投递，也未穷举全部组件与浏览器。
