# LeiBox · Claude 等臂 L 代码版

由 Hark / Claude Opus 5.5（站点默认）编写，Codex 回收并在原项目运行验证。

- 本轮项目：https://hark.com/project/bb8312f5-3b32-46b5-b6d5-eec50a18d3a0
- 实际交接：handoff.txt；上传参考：reference.png。
- Claude 原始完整源码：claude-original.html；可运行版本：index.html。两份 HTML 内容相同，未把位图嵌入 SVG。
- 六份独立透明 SVG：svg/；对应 512px 透明 PNG：01-balanced.png 至 06-compact.png。
- 预览：preview-six.png；移动与平板：preview-375.png、preview-768.png；深色透底：preview-dark.png。

## 已验证

- 浏览器实际运行，六款均以同一个 length 计算两个端点，以单一 strokeWidth 画两臂。
- SVG 序列化保留三位小数，离线回读两臂长度差最大约 0.000385 个 viewBox 单位；四位小数长度比均为 1.0000 : 1。不是声称浮点坐标完全无舍入误差。
- 浏览器实际屏幕坐标测量和独立 SVG 文件回读均通过；记录在 geometry-1440.json、ui-validation.json、svg-validation.json。
- 六款导出的 L 转折点 alpha=0、黑色实体 alpha=255、画布外部 alpha=0，确认真实镂空，非白块遮盖。
- 已查看 375 / 768 / 1440 宽度截图，无横向溢出；检查 24 / 48 / 96px 预览、背景切换、键盘焦点。
- 普通截图在窗口最小化后失败，改用同一 Ego 页面的 CDP 截图完成并实际查看。

## 验证边界

Ego 的浏览器下载事件等待超时，不能确认自动点击后的原生下载是否完成。六份交付 SVG 已直接使用页面同一导出函数保存，并独立渲染验证。

外壳按参考的圆角盒子方向参数化重建，并非逐像素描摹原位图。当前为六版可编辑 Logo 供比较，尚未选定或替换正式站点标志，未制作完整 VI 标准制图。

