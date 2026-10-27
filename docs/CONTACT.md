# 联系与组件投稿

`POST /api/contact` 将访客留言或组件投稿发往 `leir0491@gmail.com`。收件人由服务端配置，浏览器不能更改；回复邮件会发给访客填写的地址。接口使用 Resend 的邮件发送 API，不需要 Gmail 密码或授权码。

## 配置发信

本地创建已被 Git 忽略的 `.env.local`：

```dotenv
RESEND_API_KEY=填写你的发信API密钥
CONTACT_FROM=已在Resend验证的发件邮箱
CONTACT_TO=leir0491@gmail.com
```

`CONTACT_FROM` 可为单独邮箱，或 `网站名 <hello@your-domain.example>`。请使用 Resend 允许的发件域名和身份；Gmail 地址是收件人，不必把它作为发件人。密钥仅放在服务器环境中，不要发到聊天或写入前端。

2026-10-27 用户确认以后使用该 Gmail 收信。当前本地配置采用 `LeiBox <onboarding@resend.dev>` 测试发件身份，固定投递到该 Resend 账号的注册邮箱。账号尚无自有验证域名，不能用此身份向其他邮箱任意发信。密钥已保存在被 Git 忽略的 `.env.local` 中，仅具备发送权限；不要把它复制进文档或公开静态资源。

配置后重启本地预览服务。`npm start` 由 Node 加载 `.env.local`；直接执行脚本时可用：

```sh
node --env-file-if-exists=.env.local scripts/serve-local.mjs
```

Cloudflare Worker 部署时通过 Worker secrets 设置 `RESEND_API_KEY` 和 `CONTACT_FROM`，可选 `CONTACT_TO`。接口在同一个 Worker 中提供；纯静态托管及 Next 开发服务本身不提供发信接口。

未配置时返回 HTTP 503 `service_unavailable`，不会假报成功。HTTP 200 `{ "ok": true }` 只表示邮件服务已接受请求，不保证即时进入收件箱；实际到达仍需配置后检查收件与垃圾邮件目录。

表单首次打开时以 `GET /api/contact` 检查服务配置，仅返回 `{ "available": true/false }`，不暴露密钥或发件身份，也不发送邮件或占用应用的发送额度。检测结果在当前页面中复用，重新配置服务后刷新页面。未配置时页面明确提示、禁用直接提交，并保留填写内容和「改用邮件」入口。配置检测只确认服务器具备必要配置，真实投递还取决于服务商接受请求。

## 表单契约

JSON 字段：`name`（选填，最多80字符）、`email`（必填，最多254字符）、`topic`（`message` 或 `submission`）、`message`（10—6000字符）、`url`（选填，最多2048字符，HTTP/HTTPS，投稿时必填）、`website`（蜜罐，留空）。可选 `subject` 最多120字符。称呼、邮箱与主题不接受换行。仅接受这些字段，总请求体最多32 KiB；邮件使用纯文本，不把访客内容作为 HTML 或邮件头。

接口检查同源与 JSON 类型，提供每客户端每10分钟5次、当前服务实例每10分钟50次的基本限流。Node 按实际连接地址计数，不信任客户端自报 IP；Worker 使用 Cloudflare 提供的地址。实例内限流会随重启或 Worker 实例更换重置，可额外绑定 `CONTACT_IP_LIMIT` / `CONTACT_GLOBAL_LIMIT` 供平台限流。

留言不写入本地数据库，也不记录全文日志。提交时内容经 Resend 转发到站主邮箱；表单不自动替访客订阅邮件。

发送次数在请求内容通过校验且发信配置完整之后才计数。服务尚未配置时连续尝试始终返回 503，不会积累为误导性的“发送过于频繁”。

## 验证

```sh
node --test scripts/contact-mail.test.mjs
```

自动测试只调用模拟发信服务，不发送真实邮件。API 字段依据 [Resend Send Email 文档](https://resend.com/docs/api-reference/emails/send-email)。实际投递验证留待发信配置完成后进行。

2026-10-27 本地实际投递已完成：用户授权后，通过真实表单发送一封测试邮件，接口返回 200，Gmail 收件箱中已查到对应测试编号。具体证据见 `work/contact-delivery-fix-20261027/verification.md`。这不代表 Netlify 正式站点已同步此次环境配置。
