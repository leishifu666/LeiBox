# 联系与投稿 · HTML 设计预览

精简方案现已应用到网站实际的“联系与投稿”组件，首页与组件页共用；本地网站入口为 http://127.0.0.1:3000/ 。保留原有 POST /api/contact 发信逻辑，实际站点检查见 `site-verification.json`，截图为 `site-*.png`。没有发布到线上，也没有提交 Git。

最新精简版：`refined.html`，由 Gemini 基于 Claude 稿按用户反馈重做。默认文案及占位文字由196字符降至59字符；已删掉多余说明和完成页，保留简短的按需反馈。截图为 `refined-*.png`，交互检查见 `refined-verification.json`。独立预览不发邮件，现有网站未替换。

后续重试已成功收回 Claude 新设计，入口为 `claude.html`，说明见 `claude-README.md`。下文保留首轮 Gemini 交付的记录。

打开 `index.html` 即可使用，无需构建或联网。本地预览：http://127.0.0.1:4174/

基于 Gemini 3.1 Pro / High 在 Google AI Studio 返回的设计与 HTML，由 Codex 修正交互、调整表单层级并验证。Gemini 首次输出遇到内部错误，已在同一会话补全代码。Claude / Hark 项目提交未生效，聊天及内置浏览器兜底也未回收结果，因此本稿不宣称是双模型共同完成。

主要优化：双选内容类型、正文提前、必填提示、就地校验、推荐时动态要求链接、简化邮件底栏、关闭及编辑时保留内容。使用项目已有的 GSAP 3.12.7，已内嵌在 HTML 中；支持减少动态效果及库不可用时的基本操作。

此处为交互演示，主按钮不会调用邮件接口。邮件地址链接会由用户主动打开邮件客户端。未修改现有网站弹窗，未发布、未提交 Git。

`preview-375.png`、`preview-768.png`、`preview-1440.png` 为默认状态截图；`state-*.png` 为校验、推荐、完成等状态。验证结果见 `verification.json` 与 `verification-extra.json`，包含 45 项检查、短屏、动画中间帧、对比度及离线检查。

没有发送真实邮件，未验证实际邮件投递，也没有进行真人可用性测试。
