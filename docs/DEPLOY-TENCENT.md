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
