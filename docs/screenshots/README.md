# 当前页面截图

采集日期：2026-10-28（Asia/Shanghai）。

来自当前工作树构建后运行的本地网站 http://127.0.0.1:3000，不是线上部署状态的证明。视口为 1440 × 1100，中文、浅色主题，启用系统减少动态效果。

- `leibox-home.png`：`/`
- `leibox-components.png`：`/components`
- `leibox-glass-folder.png`：`/docs/animations/glass-folder`

玻璃文件夹截图通过键盘激活实际的 Open My Files 按钮进入展开状态。所有图片均为浏览器直接截图，未生成、拼接或替换页面元素。截图 SHA-256 和基准提交见 [capture.json](capture.json)。

复现：先运行 npm run build 和 npm start，再运行 node scripts/capture-readme-screenshots.mjs。
