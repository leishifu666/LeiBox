# LeiBox 当前标志

图形标志：1 号“均衡圆角”，采用 Claude 留白修正版。外壳沿用选定轮廓，两臂等长等粗，右端与下方的黑边接近等厚。完整组合已更新为用户定稿的 ei 连字，矢量母版与标准制图见 [leibox-ei-20261023](../leibox-ei-20261023/README.md)。

- master.svg：Claude 的透明 mask 原稿，是生成资源的输入。
- leibox-mark.svg / leibox-mark-white.svg：黑标 / 反白标，透明镂空使用纯矢量复合路径。
- leibox-wordmark.svg / leibox-wordmark-white.svg：带自定义 ei 连字轮廓的完整组合，同步自定稿母版。
- leibox-mark.png / leibox-mark-white.png：1024px 透明 PNG。
- geometry.json：当前几何；geometry-before-spacing.json：调整前记录。
- validation.json：独立几何、栅格、尺寸与在线文件校验。
- 浏览器 favicon.svg / favicon.ico 使用透明底反白标志，无方形底板；ICO 含16/32/48px。favicon-validation.json 记录透明度和白色像素检查，favicon-head-validation.json 记录在线页面的图标缓存版本。

重新生成：在项目根目录运行 node scripts/build-brand-assets.mjs。完整组合直接使用定稿的黑色 / 反白 SVG，不再用系统字体生成字标；网页分享图也使用同一组合。
检查当前在线预览：运行 node scripts/verify-brand-assets.mjs（本地服务需已启动）。

代码出处和前后对比：../../logo-explorations/leibox-2026-10-22/claude-spacing-revision/。
图形标志的 SVG 复合路径转换只改变表达方式，保留 Claude 生成的轮廓；生产文件和原稿已作实际栅格对比。组合比例与字标几何制图位于上述 ei 连字母版目录。

