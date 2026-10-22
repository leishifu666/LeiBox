# Canvas UI · 中文 / English

[Canvas UI](https://canvasui.dev/) 的本地复刻与双语界面，包含 35 种效果、组件文档和演练场。默认中文；点击导航中的 **EN / 中** 即时切换，选择保存在当前浏览器。

## 运行

需要 Node.js 22 或更新版本（本机验证 Node.js 24）。

```sh
npm ci
npm run build
npm start
```

打开 [本地预览](http://127.0.0.1:3000/)。开发使用 `npm run dev`。

## 双语范围

- 主页、导航、搜索、组件列表、文档、效果参数、演练场、订阅及隐私页面。
- 支持中文与英文搜索；切换语言保留已打开的组件、参数和交互状态。
- 品牌、代码示例、命令、API 属性名及 URL 参数保留英文，便于复制和使用。
- 原生 HTML-in-Canvas 需要浏览器实验能力；普通浏览器使用原有降级行为。

订阅接口为本地模拟，不保存邮箱或发送邮件。未配置线上发布。

## 检查

```sh
npx tsc --noEmit
node --test scripts/serve-local.test.mjs
npm run build
```

浏览器语言回归：`node scripts/test-localization.cjs`，需可用的 Playwright 和 Chrome；支持通过 `PLAYWRIGHT_MODULE_PATH` 指定 Playwright 模块目录。截图和原站研究材料保留在本地，不进入 Git。实现与验证范围见 [双语说明](docs/LOCALIZATION.md)。

## 来源与许可

基于 [DavidHDev/canvas-ui](https://github.com/DavidHDev/canvas-ui)，固定源码版本 `a04a99b235299ee79a123a16ccb2e6cf9da74b6b`。保留上游署名与 [MIT + Commons Clause 许可](LICENSE.md)，详见 [上游说明](README-UPSTREAM.md)。此版本为本地复刻及汉化，独立于原站维护。

更多本地取证和运行细节见 [README-LOCAL.md](README-LOCAL.md)；其中研究证据链接仅在原工作目录可用。
