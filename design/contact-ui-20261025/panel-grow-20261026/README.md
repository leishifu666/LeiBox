# 联系面板开合动画

用户已选择 **01 平滑延展**，现已接入实际网站：http://127.0.0.1:3000/ 。点击导航邮件按钮、页面联系按钮或底部推荐按钮，玻璃外壳从实际按钮矩形长到屏幕中央，关闭时收回对应按钮。移动端同样居中。保留之前的03标签切换及现有表单提交逻辑。

六方案记录：http://127.0.0.1:4174/panel-grow-20261026/index.html 。每个“体验”按钮打开同一全尺寸居中表单，默认无选用项。本HTML只演示动画，不发送邮件。

Gemini 3.1 Pro / High 根据用户纠正重写方案，Codex 修复几何、焦点、反向和视口适配后验证，再按用户选定的01迁入React。初期卡片内弹出的布局已废弃，材料移到 `work/panel-grow-motion-20261026/superseded-card-layout/`。

实际修改：`contact-button.tsx`记录触发元素，`contact-card.tsx`与`landing/cta.tsx`传入各自按钮，`contact-panel.tsx`保留原生dialog焦点约束，使用GSAP驱动外壳边界、内容显现及背景淡化。打开壳动画500ms、内容从300ms开始显现，整体600ms；收起反向。展开完成恢复自然布局，错误提示、文本域调整和窗口变化仍可重排。

验证：ESLint、Next生产构建通过；六方案105项、实际网站33项浏览器检查通过。覆盖真实按钮起点、中央终点、各页面入口、提前反向关闭、焦点/滚动恢复、375/768/1440明暗布局、减少动态效果、窗口缩放及原有POST契约。提交测试拦截请求，没有发送真实邮件；未验证实际邮件投递，未发布或提交Git。

记录：`centered-verification.json`、`site-verification.json`。有效截图为 `centered-*`、`site-centered-*`；`site-live.png`是实际网站交互预览画面。源文件备份和本轮脚本位于 `work/panel-grow-motion-20261026/`。
