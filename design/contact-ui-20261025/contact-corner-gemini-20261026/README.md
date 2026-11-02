# Gemini 联系面板圆角调整

已通过 Google AI Studio 的 Gemini 3.1 Pro Preview（High）回收完整方案，并应用到真实网站。

- 外框：16px
- 输入框、分段轨道、提交按钮：10px
- 分段选中块及文字焦点区：6px
- 关闭按钮 hover 区：8px
- 提交按钮左右内边距：24px，高度保持40px

原方案见 `gemini-design.json`，型号及最终回答身份见 `generation.json`。本地将外框16px限定到联系面板，保留用户已认可的搜索面板18px；共同的玻璃样式、GSAP展开/收回及末段淡出逻辑继续复用。

已核对375 / 768 / 1440宽度的明暗截图、居中位置、开关及焦点恢复、分段选择、表单校验和减少动态效果；未发送实际邮件。浏览器记录见 `visual-evidence.json`。ESLint与Next生产构建通过。

构建时发现未被网站引用的 `outputs/` 独立示例被全局TypeScript通配符纳入，因 `window.__destroy` 示例类型冲突导致失败。仅在 `tsconfig.json` 的排除项增加 `outputs`；网站源码和实际导入代码仍参加类型检查。

预览：http://127.0.0.1:3000/
