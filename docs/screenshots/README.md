# 当前页面截图

采集日期：2026-10-29（Asia/Shanghai）。

来自当前本地生产构建 http://127.0.0.1:3107，中文、浅色主题，启用系统减少动态效果。构建包含保留的本地修改；这些图片用于展示实际页面，不作为公网可用性验收。

| 截图 | 页面 | 实际状态 | 视口 |
| --- | --- | --- | --- |
| [首页](leibox-home.png) | / | 首页首屏与真实交互演示 | 1440 × 1280 |
| [组件浏览](leibox-components.png) | /components | 无外框的组件列表（39 项） | 1440 × 1100 |
| [玻璃文件夹交互](leibox-glass-folder.png) | /docs/animations/glass-folder | 键盘打开 My Files 文件夹 | 1440 × 1100 |
| [玻璃物体与自定义背景](leibox-glass-object.png) | /docs/components/glass-object | 真实模型加载完成，使用雪山湖泊背景 | 1440 × 1100 |
| [AI 接入](leibox-ai-integration.png) | /docs/mcp | 新域名的 Skill 安装命令与实时组件检索说明 | 1440 × 1100 |

玻璃文件夹通过键盘打开 My Files；玻璃物体等待真实模型加载完成。此次使用 ego-browser 直接截取运行页面，未生成、拼接或替换页面元素，未注入截图专用样式。

构建编号、基准提交、采集时间与各图 SHA-256 见 [capture.json](capture.json)。

自动重新采集：先运行 `npm run build` 和 `npm start`，再运行 `node scripts/capture-readme-screenshots.mjs`。如服务使用其他端口，可用 `TEST_BASE_URL` 指定地址。该脚本使用 Playwright 采集相同页面与交互状态，并重新生成记录。
