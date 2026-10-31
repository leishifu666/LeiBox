# 腾讯云宝塔部署记录

部署日期：2026-10-29。部署的是当前本地工作树，包含组件列表「无界留白」及本地已有的组件修改，未创建 Git 提交。

## 运行位置

- 服务器：`1.12.37.50`
- 项目目录：`/opt/Project/leibox`
- 宝塔：网站 → Node项目 → `leibox`
- 域名：`leibox.pantoria.cn`，当前绑定 HTTP 80
- 前端：项目目录中的 `out/`，由 Next.js 静态导出
- 后端与静态文件服务：`scripts/serve-local.mjs`、`scripts/contact-mail.mjs`
- Node：宝塔管理的 Node 22，以 `www` 用户运行
- 启动命令：`node --env-file-if-exists=.env.local scripts/serve-local.mjs`
- 监听：`127.0.0.1:3107`，由 Nginx 反向代理，无需公网放行 3107
- 运行环境：项目根目录 `.env.local`，包含 `NODE_ENV=production`、`PORT=3107`、`TRUST_PROXY=true` 和既有联系邮件配置；权限为 `600`，所有者 `www`
- Nginx 配置：`/www/server/panel/vhost/nginx/node_leibox.conf`
- 本次 Nginx 修改前备份：上述文件名后追加 `.before-leibox-proxy-20261029`

Node 服务直接使用标准库，不依赖服务器安装完整的前端 node_modules。运行和重启可通过宝塔的 `leibox` 项目「服务」页操作。服务器重启恢复尚未通过实际重启验证。

## 构建与更新

在原项目目录执行：

```powershell
$env:NEXT_PUBLIC_SITE_URL='https://leibox.pantoria.cn'
npm run build
node --test scripts/contact-mail.test.mjs scripts/serve-proxy.test.mjs
```

上传新的 `out/` 和必要的运行脚本前，先备份远端当前版本；仅更新 `/opt/Project/leibox`，保留远端 `.env.local`。Nginx 配置修改后先运行 `nginx -t`，通过后再执行 `nginx -s reload`。

打包时排除 `out/previews/`、`out/404-preview*`、`out/logo-transition-preview*` 和 `out/submit-state-preview*` 等设计实验。不要将本地工作记录、浏览器脚本和环境凭据放进网站公开目录。

## 本次验证

生产构建通过，联系接口及 HTTPS 反向代理回归测试共 17 项通过。

服务器内实际验证：首页、组件列表、流体提示气泡详情、AI 目录、Skill 发现索引和联系接口均返回 200；联系接口报告 `available: true`。以 HTTPS 来源提交空表单返回 `400 invalid_email`，未发送真实邮件。Nginx 代理联系接口及 Skill 发现索引正常，配置语法检查通过，宝塔显示服务「开启」。

初期部分公网 HTTP 请求成功，后续公网请求曾被重定向至腾讯云的备案提示页。用户确认已完成腾讯云备案或接入，并要求不再检查该项。未修改域名解析或腾讯云账号配置。

Let's Encrypt 文件验证失败，返回 `Error reading HTTP response body: reader size limit exceeded`；未签发、部署 HTTPS 证书，也未开启 HTTP 强制跳转 HTTPS。当前服务器程序部署完成，公网域名访问和 HTTPS 不视为已验收通过。

## 新域名同步（2026-10-29）

站点公开地址统一为 `https://leibox.pantoria.cn`。已同步首页及文档中的安装命令、复制内容、AI 目录与组件文档、`llms.txt`、Skill 源文件、下载副本、两个发现入口，以及 Skill 辅助脚本的默认来源地址。构建脚本、README 和历史部署说明使用同一公开地址。

生产构建通过；组件目录、Skill、联系接口及反向代理共 34 项相关测试通过。增量包 `leibox-domain-sync-20261029.tar.gz` 的 SHA-256 为 `5f3c35eecdd5e315f26f726ba56d7dc1b2edbc94e04efeabcb6b3f056732a5cd`。服务器先核对旧文件摘要，再备份并替换 521 个文件，替换后摘要全部一致；备份位于 `/opt/Project/leibox/backups/domain-sync-20261029`，含变更清单。

服务器内验证首页、安装、AI 接入、AI 说明、Skill 下载文件及发现入口均已使用新域名；Nginx 转发 Skill 文件正常，联系接口仍报告 `available: true`。本次未修改收件邮箱、邮件环境配置、Nginx 或 DNS，未发送真实邮件，未重启运行中的 Node 服务。

本地生产导出页面实测：首页、安装及 AI 接入均显示新安装命令；安装命令复制与 AI 文档 Markdown 复制均进入成功状态。375 / 768 / 1440 宽度截图自查通过，页面未产生横向溢出。历史 Netlify 适配器另有 4 项回归测试通过。

此前已安装的 Skill 副本仍可能保存旧地址，需要从新域名更新或重装一次；之后组件目录继续实时读取。公网 HTTPS 证书问题仍未解决，本次服务器内验证不能替代公网 HTTPS 验收。

## 安装复制、HTTPS 与公网 Skill 验证（2026-10-31）

复制修复提交为 `362de2f`，已推送至 GitHub `main`。公网 HTTP 页面实际复现了 `isSecureContext=false`、`navigator.clipboard` 不存在的问题；共享复制函数增加仅在 Clipboard API 不可用时使用的兼容复制，保留焦点和选区。浏览器明确拒绝现代 API 时仍提示失败，不改用旧 API 绕过权限。安装命令、延迟加载的源码复制、真实失败反馈共四项浏览器回归通过。

通过宝塔为 `leibox.pantoria.cn` 申请并部署 Let's Encrypt 证书，到期日为 **2027-01-28**。公网 HTTPS、Skill 发现索引、Skill 文件及组件接口已实际访问成功；此前另一个域名的证书不匹配问题已消除。未开启强制 HTTP 跳转，HTTP 复制兼容路径也单独进行了线上验证。

发布包从上述 Git 提交对应的暂存树单独导出、构建，未将工作区其他未提交组件改动混入本次发布。服务器校验 2,504 个文件，更新 1,397 个文件；更改前的文件备份位于 `/opt/Project/leibox/backups/copy-skill-362de2f`。发布包 SHA-256 为 `cf29d18eb2a692b02b158eebad92481fd30dec9e40323f424f95163ec4ee4c8b`。保留服务端 `.env.local`，未重启 Node 服务。

Skill 源文件在 `integrations/skills/leibox/`，公开下载在 `/ai/`，两个安装发现入口为 `/.well-known/agent-skills/` 和 `/.well-known/skills/`。使用 `skills` **1.7.4**、Node **24.22.1** 从干净目录通过公开 HTTPS 地址安装，三个文件 `SKILL.md`、`scripts/leibox.mjs`、`agents/openai.yaml` 均落盘；默认安装和 `--copy` 模式均成功。安装后的工具实际搜索、查询详情、校验并下载了玻璃文件夹的四个 React 源文件。

本机旧 Node 24.11.0 曾在安装器显示完成后出现 Windows libuv 退出断言；没有把该进程算作成功。换用已安装的 Node 24.22.1 后退出码为 0。用户使用旧 Node 遇到相同退出断言时应更新 Node 维护版本，不应关闭 TLS 校验。

独立发布构建与相关 15 项回归检查通过。公网 HTTP、HTTPS 页面均复制出完整且精确的安装命令，HTTPS 组件页也实际复制了 211,629 字符的异步代码包。内部回执位于 `outputs/skill-install-fix-20261031/`；未发送真实邮件或提交网站表单。

## 两个新组件与导航性能（2026-10-31）

补发折边滚动表情选择器（`folded-emoji-scroll`）和渐变卡片环形轮播（`gradient-ring-cards`），组件目录从 30 项增加到 32 项。源码提交为 `07a5f04`，轮播快速连续切换的修复为 `2be58d1`；两个组件共 12 套原生框架包均实际编译、挂载并验证更新、多实例和卸载。

导航性能修复提交为 `47d79e1`、`abca2f5`。旧版过渡克隆会立即请求全部 9 张屏幕外原图，单张约 0.6–0.8 MB。现在先在惰性模板中清理图片源，只保留已加载且可见的画面；真实浏览器回归确认这些额外请求由 9 个降为 0 个。图片预览复用已有 WebP 响应式资源，客户端导航清单不再导入完整提示词，浏览页初始 JavaScript 未压缩总量减少 498,267 字节。

完整提示词独立存入带内容摘要的 `/doc-assets/` 文件，滚动到提示词区域或复制时加载当前框架版本。保留完整文案及六框架差异，并逐项与原始包核对。轮播详情的 HTML 从 1,954,751 字节降为 128,371 字节，路由数据从 1,646,942 字节降为 50,478 字节。

服务器观察到 4 个 CPU、负载约 0.03，内网读取浏览页与演示文件约 5–31 ms；没有将公网传输等待误判成 CPU 不足。Nginx 原 gzip 类型漏掉 `text/x-component`，现通过站点扩展 `/www/server/panel/vhost/nginx/extension/leibox/leibox-rsc-gzip.conf` 补齐，保留父级其他 MIME 类型，配置副本见 `docs/nginx/leibox-rsc-gzip.conf`。语法检查、平滑重载和解压后文件摘要校验均通过；公网 HTTPS 路由响应实际带 gzip。未修改证书、邮件环境或重启 Node 服务。

最终发布版本为 `abca2f5e77f5c210280aa61b112050f6f31370a2`，校验 2,835 个文件，更新 730 个文件。增量包 SHA-256 为 `5d191d739c1bc11aa84ca69a603124085e7e79236bac84bbb302680d2dbb4ba0`，备份位于 `/opt/Project/leibox/backups/deferred-prompts-abca2f5`；此前导航资源及 Nginx 配置变更记录位于 `/opt/Project/leibox/backups/navigation-performance-47d79e1`。服务端 `.env.local` 摘要保持一致。

生产构建、28 项性能/复制/Skill/下载检查通过；375、768、1440 三种宽度下验证进入、返回、首页卡片、键盘、滚动恢复、打断和减少动态效果。提示词首次进入不下载，复制与滚动显示的内容均与完整原文一致。公网重新安装 Skill 后，实际下载并校验了两个新组件的全部 12 套框架包，共 48 个源码文件。公网复测未出现额外原图请求，测量期间未发现主线程长任务；本地 3000 预览也已重新构建。首次打开仍包含字体与演示资源下载，实测时间受缓存及网络条件影响，不承诺所有场景秒开。内部证据位于 `outputs/new-components-release-20261031/`。
