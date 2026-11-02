# 组件卡片六方案

由 Google AI Studio 的 Gemini 3.1 Pro（`gemini-3.1-pro-preview`，High）根据用户截图生成，并回收一轮修正。日期：2026-10-28。

打开 `index.html`，通过顶部 01—06 切换：无界留白、通体白卡、画框内衬、左侧线柱、悬浮覆盖、错位拼贴。HTML、CSS、JavaScript 均在同一文件；图片保存在相邻的 assets 目录。

本地预览：http://127.0.0.1:3000/previews/component-cards-six-20261028/index.html

每版可以通过 `?variant=1` 至 `?variant=6` 直接打开。文档链接指向正在运行的本地开发站。

浏览器已检查六版在 375 / 768 / 1440 宽度的布局、图片加载、文字裁切和页面横向溢出，保存 18 张真实截图于 screenshots。已验证方案按钮 Enter / Space 操作、浏览器后退以及无效方案参数回到第一版。详细记录见 validation.json。

这是独立的 HTML 设计预览，尚未替换正式组件列表。
