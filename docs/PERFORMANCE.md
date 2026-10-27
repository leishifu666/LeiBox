# 性能维护

组件页面只把框架名、文件名和内容哈希地址发送给浏览器。静态源码、高亮和完整复制包由 `npm run docs:assets` 生成到 `public/doc-assets/`，已接入 dev/prebuild。代码区接近视口时读取当前文件；切换框架或渲染器时读取所选版本；复制完整页面时才读取所需的其他源码。请求共享最近使用的 24 项缓存，失败可重试，快速切换不会把旧响应显示成新文件。交互预览源码只缓存最近 4 项，预览停止后释放组件持有的源码及生成文档。

重组件卡片、文档侧栏、相邻组件链接及首页组件跑马灯禁用自动路由预取。后续新增组件请保持此约束，避免一次浏览加载整套源码。

`npm run assets:optimize` 为列表图片、首页背景及视频缩略图生成多尺寸 WebP，并更新 `src/data/optimized-media.json`。保留原图及原始视频；图片按实际 CSS 尺寸选择，较小原图也保留其原始尺寸版本以支持高像素密度屏幕。

视频卡片使用该命令生成的带内容哈希的 WebP 首帧海报。空闲时不设置视频 src，不再通过播放一次取得首帧。悬停或键盘聚焦且接近视口时加载；失去交互后等待 350ms 卸载媒体源，离屏、隐藏或启用减少动态效果时立即卸载。全部海报应随源码交付，日常构建复用现有产物。

首页跑马灯保留两份完整目录链接和原有 CSS 滚动，只在可见轨道左右各 320px 的缓冲区挂载预览。离开整段跑马灯或页面隐藏时卸载媒体，轨道占位和键盘入口仍保留。首页模拟复制到 Claude/Codex 的操作演示只运行弹窗当前选择的组件，背景卡片使用海报。弹窗直接挂载 GlassFolder 的原生 DOM 引擎，以 Shadow DOM 隔离样式，不再创建额外的 iframe 文档与渲染子进程。展开、添加文件与循环播放继续执行真实组件逻辑。

该原生引擎由 `npm run motion:build` 从同一份组件源生成到 `src/lib/motion-core/site-previews/`，与下载包的引擎保持一致，禁止手改生成文件。首页适配层只负责尺寸、预览背景、播放节奏和卸载清理。目录卡片与完整详情页沿用各自的预览和交互方式。

首页视频提供 720px/24fps 和 540px/24fps 两份 H.264，保留完整演示时长。先显示海报，进入视口后延迟启动；离屏、页面隐藏或用户启用减少动态效果时暂停，省流量/2G 时只显示海报。页底 GPU 效果在接近视口时挂载，装饰性画布的像素密度上限为 1.25，其余组件仍沿用原有预算；离开 700ms 后卸载并释放独立 WebGL 上下文及画布存储，焦点仍在页底时保留内容。上下文释放延迟到下一任务，允许 React Strict Mode 的立即重挂载取消释放。

首页演示面板由 `outputs/gemini-home-panels-redesign/build.cjs` 生成。每段面板只保留当前时间线，重建前通过 Context.kill(false) 清空旧引用且保留当前画面，框架下划线也使用统一清理路径。修改适配器后运行 `node outputs/gemini-home-panels-redesign/build.cjs`，不要手改 generated.js。源码浏览面板的 iframe 仅在当前演示步骤可见且面板活动时加载。

优化过的视频是普通网站素材，应随源码交付。日常构建复用这些文件，不要求 Netlify 安装 FFmpeg。如果替换原始视频，需要在本机设置 `FFMPEG_PATH` 指向 FFmpeg 后重新生成，并保留新的产物。构建不会下载或安装编码器。

MiSans 保留小米原始 WOFF2 文件、字形、字重与 unicode-range。按照随附许可，没有裁剪或重新编码字体；对带哈希的字体文件启用长期缓存。内容哈希代码及优化图片/视频也启用 immutable 缓存，代码索引保持重新验证。公共 headers 和 Netlify 配置保持一致，本地预览服务提供相同的资源缓存规则。

验证命令：

```powershell
npm run build
npm run test:performance
node scripts/test-memory-lifecycle.mjs
npm run test:motion:types
node --test scripts/serve-local.test.mjs scripts/contact-mail.test.mjs scripts/collection-cli.test.mjs scripts/netlify-deploy.test.mjs
```

服务测试默认访问 `http://127.0.0.1:3000`，可用 `TEST_BASE_URL` 指定其他本地预览端口。Netlify 快照相关测试需在构建后运行 `node scripts/prepare-netlify.mjs`。

性能回归测试限制详情 HTML/RSC、缩略图、海报及视频大小，验证六框架、双渲染器、完整复制包、共享源文件去重、失败请求重试及旧缓存淘汰。内存生命周期浏览器测试验证视频按需加载、键盘和减少动态效果、跑马灯循环和挂载窗口、GPU 上下文反复释放恢复，以及切换 200 次后动画引用保持有界，并生成 375 / 768 / 1440 截图。浏览器测试需先构建并运行本地预览，不要与构建同时读取 out/。

进程私有内存、工作集、JavaScript 堆、GPU 进程内存及显存是不同口径。GPU 驱动和浏览器缓存会使进程数字波动，资源释放的功能检查不能代替同环境下的总体内存复测。没有新增浏览器遥测、追踪或外部监控。
