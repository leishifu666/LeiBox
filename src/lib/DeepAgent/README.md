# Deep Agent 原版组件迁移

`original/` 中的49个 `.source` 文件逐字节迁入自用户的 Deep Agent 桌面项目；扩展名用于避免将 React 18 源码重复纳入宿主 TypeScript 检查，不改变文件内容。SHA256 记录见 `original/manifest.json`。

实际运行原版 `Composer`、`ModelThinkingSelector`、`EffortSlider`、`MorphingMenuShell`、权限菜单、上下文容量、附件和图片预览组件。保留原 JSX、Tailwind 类名、颜色令牌、图标、连续圆角、GSAP 动效与手势逻辑。旧的手写 DOM 近似版已移除。

- `scripts/import-deep-agent-original.mjs [desktop目录]`：导入只读源码，用原项目 Tailwind 3 和连续圆角插件生成 `original.css`，并按原主题函数生成默认 Codex 浅色令牌
- `scripts/build-deep-agent-source.mjs`：将原 React UI 与平台适配器打包成独立 HTML 和可复制引擎，由 `motion:build` 自动调用；正常构建不依赖外部原项目目录
- `original-host.mjs`：每个实例的浏览器宿主与本地 API 适配；替代 Tauri 设置、附件持久化和模型调用，提供受控值、事件与清理
- `original-demo.jsx`：仅负责外部展示容器与输入状态；滑块区块的标题及间距直接沿用原版菜单区块，不添加标题、提示、徽章或模拟回复
- `original-adaptations.json`：原版浮层放入本实例 Shadow DOM，以及原版全局通知销毁的适配记录。界面布局不重写

所有六框架入口共享原版 React UI，因此均需要 React / React DOM。代码包附完整依赖安装命令；控件库通过npm安装，不把第三方库源码塞进复制内容。`deep-agent-base-ui` 和 `deep-agent-lucide` 别名锁定原版 Base UI 1.8 与 Lucide 1.43，避免改变组件网站已有版本。独立 HTML 已包含这些依赖。

`simple / medium / deep` 是原版界面档位，不是供应商请求协议。`onSubmit` 返回原版附件、技能、提及和权限数据；由接入方连接真实 Agent。演示不上传文件、不持久化设置、不请求模型服务。

验收对照是直接从原项目源码独立渲染的组件，采用相同默认主题和本地服务适配，不能称为已运行完整 Tauri 后端。
