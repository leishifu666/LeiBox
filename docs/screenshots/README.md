# 当前页面截图

采集日期：2026-10-28（Asia/Shanghai）。

来自当前工作树构建后运行的本地网站 http://127.0.0.1:3000，包含尚未提交的本地修改，不代表线上部署已同步。中文、浅色主题，启用系统减少动态效果。

| 截图 | 页面 | 实际状态 | 视口 |
| --- | --- | --- | --- |
| [首页](leibox-home.png) | / | 首页首屏与组件预览 | 1440 × 1280 |
| [组件浏览](leibox-components.png) | /components | 当前 39 个组件的列表 | 1440 × 1100 |
| [玻璃文件夹交互](leibox-glass-folder.png) | /docs/animations/glass-folder | 键盘打开 My Files 文件夹 | 1440 × 1100 |
| [玻璃物体与自定义背景](leibox-glass-object.png) | /docs/components/glass-object | 模型加载完成，使用选定的雪山湖泊背景 | 1440 × 1100 |

玻璃文件夹截图通过键盘激活实际的 Open My Files 按钮，等待展开完成；玻璃物体截图等待真实模型加载完成。所有图片均为浏览器直接截图，未生成、拼接或替换页面元素，也没有注入截图专用样式。

采集时间、构建编号、基准提交和各图 SHA-256 见 [capture.json](capture.json)。

复现：先运行 npm run build 和 npm start，再运行 node scripts/capture-readme-screenshots.mjs。
