# Canvas UI 本地复刻

目标：<https://canvasui.dev/>。本项目最初为空，已导入上游完整网站源码，并保留原始字体、CSS、页面、35种效果的着色器、六框架组件、WebGL/WebGPU版本和媒体。

固定来源：`DavidHDev/canvas-ui@a04a99b235299ee79a123a16ccb2e6cf9da74b6b`。这是可核查的公开源码版本；不将它冒充已确认的线上部署commit。源码与线上表现通过浏览器另行对比。

## 运行

使用 Node.js 22 或更新版本；本机验证为 Node 24。

```powershell
npm ci
npm run build
npm start
```

打开 <http://127.0.0.1:3000/>。`npm run dev` 可用于开发；订阅模拟接口仅由 `npm start` 的静态预览服务提供，Next开发服务没有连接真实订阅后端。

原配置使用静态导出，`next start` 不支持该输出，因此 `npm start` 已改用 `scripts/serve-local.mjs`。该服务支持导出HTML、Next 16分段RSC预取、真实站内切换以及MP4/WebM Range播放和拖动定位。

## 原生HTML-in-Canvas

普通浏览器保留原站的DOM、GPU overlay、视频降级策略。完整HTML捕获依赖Chromium实验能力。测试使用独立Chrome进程参数：

```text
--enable-blink-features=CanvasDrawElement
```

也可以在独立Chrome中启用 `chrome://flags/#canvas-draw-element` 后重启。没有修改用户现有浏览器的全局设置，没有挪用绑定原站域名的origin-trial token。

参数与API依据：[Chromium源码说明](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/blink/renderer/core/paint)、[WICG HTML-in-Canvas](https://wicg.github.io/html-in-canvas/)。当前测试已确认 `drawElementImage` 实际执行，且WebGPU上下文确实创建。

## 证据与复跑

本节取证文件及机器专用审计脚本仅保留在原工作目录，不上传 GitHub；仓库包含应用源码、素材、双语界面及可移植的本地服务回归测试。

- [页面清单与结构](docs/research/PAGE_TOPOLOGY.md)：44个页面，其中35个组件详情。
- [源码出处与许可](docs/research/SOURCE_AUDIT.md)：原始归档、版本、依赖和证据边界。
- [20组组件规格](docs/research/components/)：源码参数、状态与响应式。
- [62份DOM与逐节点样式](docs/research/dom-styles/index.json)：共30166个节点的computed、位置尺寸、伪元素、媒体及CSS规则；完整HTML同步保存。
- [行为清单](docs/research/BEHAVIORS.md) / [机器清单](docs/research/BEHAVIORS.json)：六类扫描、独立ID和状态。
- [四宽截图与像素对照](docs/research/qa/index.html)：375/390/768/1440。
- [全站浏览器记录](docs/research/page-audit/README.md)。
- [原生GPU采样](docs/research/native-audit/README.md)：原站WebGL、本地WebGL、本地WebGPU及有界面复核。
- [参数状态采样](docs/research/demo-audit/)：真实修改、前后值、还原、URL与截图。
- [安装及Playground选择流程](docs/research/shared-flows/comparison.json)：48种命令组合、菜单与35种移动选择状态。
- [补充操作](docs/research/focused-audit/)：复制/焦点/自动阶段/横向snap/导航逐帧状态/表单模拟等。
- [导航API追踪](docs/research/navigation-api-traces.json)：真实click零点，原站/本地有界面与无头复核；本轮未触发`startViewTransition`，保留CSS但不宣称250ms共享转场实际播放。
- 构建与类型日志：`docs/research/build-final.log`、`docs/research/typecheck.log`。

```powershell
node --test scripts/serve-local.test.mjs
npx tsc --noEmit
npm run audit:pages
npm run audit:behaviors
node scripts/audit-focused.cjs
node scripts/compare-evidence.cjs
```

浏览器审计脚本使用本机已配置的Playwright运行时及Chrome；不参与应用构建。脚本默认不向原站提交订阅、不点击外站发布。

## 本次实现改动

- 导入完整上游实现，未以截图、iframe或近似动画替代网站。
- 原生背景和3张YouTube缩略图下载到 `public/assets/`，保留真实字节与SHA256下载回执。
- 增加本地静态服务及3项有价值的回归测试，修正启动方式和RSC分段路径。
- 取证目录排除在TypeScript应用编译范围外。
- 增加可复跑的原站/本地审计、规格和视觉对照。

## 必要边界

- `/api/subscribe` 为本地模拟：错误/成功状态可操作，不储存邮箱、不发送邮件、不调用原站订阅接口。真实Cloudflare Turnstile/Resend服务未配置。原站验证码槽位受第三方状态影响，可能造成局部高度变化。
- YouTube iframe与GitHub实时数值保留真实外部入口。YouTube播放取决于外网/第三方策略，GitHub数值和`/celebrate`会随实时数据不同。
- 粒子与GPU效果包含时间、随机初相位和设备栅格差异。相同源码、实际运行和采样通过不等于每一个时刻都逐像素一致。
- 首屏静态区的像素统计仅覆盖面板上方、排除实时GitHub计数，不扩大为整站还原率。全部条件参数组合、浏览器和显卡矩阵未穷举。
- 原站已有交互按原样保留。例如移动菜单没有额外添加原实现不存在的Esc关闭。
- 保留上游 [LICENSE.md](LICENSE.md) 和署名。GitHub 版本加入中英文切换，代码示例、命令和 API 字段保留英文；未部署线上网站。
