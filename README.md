# LeiBox

**装下你的 UI 灵感与组件。**

雷师傅的 UI 灵感与组件收藏箱，收集值得留下的界面、交互和设计细节。浏览真实演示、查看组件文档、追溯原始来源，为下一个界面找到灵感。

A personal collection of UI inspiration, interactive components and design references, with Chinese and English interfaces.

[![GitHub Stars](https://img.shields.io/github/stars/leishifu666/LeiBox?style=social)](https://github.com/leishifu666/LeiBox)
[![在线演示](https://img.shields.io/badge/Website-LeiBox-111111?style=flat)](https://leibox-ui.netlify.app/)

[访问网站](https://leibox-ui.netlify.app/) · [浏览组件](https://leibox-ui.netlify.app/components) · [阅读文档](https://leibox-ui.netlify.app/docs) · [AI 接入](https://leibox-ui.netlify.app/docs/mcp)

## 项目预览

以下截图来自 [LeiBox 在线站点](https://leibox-ui.netlify.app/)。在线内容持续更新，具体功能以所使用的代码版本为准。

### 首页

![LeiBox 首页：UI 灵感与组件收藏箱](docs/screenshots/leibox-home.png)

### 组件浏览

![LeiBox 深色主题组件列表：交互动效与设计参考](docs/screenshots/leibox-components.png)

### 交互演示

![LeiBox 玻璃文件夹演示：展开文件预览与组件文档](docs/screenshots/leibox-glass-folder.png)

## 可以做什么

- **找灵感**：通过组件列表和搜索查看交互效果与设计细节。
- **看演示**：在浏览器中体验效果，再查看代码示例和参数说明。
- **切换语言**：默认中文，点击导航中的 **EN / 中** 切换；选择保存在当前浏览器。
- **选择框架与渲染方式**：上游效果提供 React、Vue、Svelte、Solid、Preact 和原生 JavaScript 示例，以及 WebGL / WebGPU 实现；以具体组件页为准。
- **追溯来源**：保留组件出处、原作者署名及相关许可。

部分原生 HTML-in-Canvas 效果依赖浏览器实验能力，普通浏览器使用相应降级显示。

## 本地运行

需要 Node.js 22 或更新版本，推荐 Node.js 24。

~~~sh
git clone https://github.com/leishifu666/LeiBox.git
cd LeiBox
npm ci
npm run build
npm start
~~~

打开 [http://127.0.0.1:3000](http://127.0.0.1:3000)。开发时使用 `npm run dev`。

项目使用 Next.js 静态导出；`npm start` 启动仓库提供的本地预览服务。

## 技术栈

Next.js · React · TypeScript · Tailwind CSS · WebGL / WebGPU

## 支持项目

如果 LeiBox 帮你找到了灵感，欢迎点击本页右上角的 **Star**。

星标徽章展示 GitHub 上的 Star 数量，随数据更新。

发现问题或有组件建议，可以 [提交 Issue](https://github.com/leishifu666/LeiBox/issues)。

## 来源与许可

项目基于 [DavidHDev/canvas-ui](https://github.com/DavidHDev/canvas-ui)，初始导入版本为 `a04a99b235299ee79a123a16ccb2e6cf9da74b6b`，独立维护 LeiBox 的界面与内容。

保留上游署名及 [MIT + Commons Clause 许可](LICENSE.md)。使用、修改或分发前请阅读完整许可；第三方组件、字体与素材遵循各自的许可声明。上游资料见 [README-UPSTREAM.md](README-UPSTREAM.md)。

本地实现与历史取证说明见 [README-LOCAL.md](README-LOCAL.md) 和 [双语说明](docs/LOCALIZATION.md)；其中标注的本地研究材料并不包含在仓库中。
