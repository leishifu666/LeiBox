# LeiBox 资源加载修复与部署验收

2026-11-06。本文记录代码修复和本地验证结果；正式站部署与腾讯云 CDN 配置尚未执行。Git 提交与推送状态以仓库记录为准，线上效果需按下文验收。

### 同日复核记录

用户要求再次核实后，原日志的摘要校验一致，但直接在当前目录复跑曾出现 2 项失败，原因是 `public/site-motion-manifest.json` 与较早的 `out/` 不一致，18 个哈希演示文件不存在于该导出。随后两次完整构建遇到 Windows/文件系统 `UNKNOWN` 写入错误，分别涉及 Deep Agent 的生成 HTML；未查明具体占用或文件系统原因，不把它说成已修复。

已把当前应用源码复制到 `outputs/performance-recheck-20261106/clean-source/`，使用同一套依赖进行干净构建，退出码为 0。该副本重新执行 56 项检查、40 个演示加载、重复下载、GitHub 查询、发布/清理、TypeScript 和 ESLint，所有命令退出码均为 0；发布/清理仍有 1 项既有平台测试跳过。逐项退出码见 `outputs/performance-recheck-20261106/clean-results/results.json`。原工作目录重新静态导出成功，缓存、资源预算、共享下载和生成器共 20 项关键检查也通过。

因此，“测试通过”准确指已记录的本地构建和回归范围，并不表示当前工作目录的完整构建已排除文件写入问题，也不表示正式站已完成部署或 CDN 验收。首次失败与两次构建失败日志均保留在 `outputs/performance-recheck-20261106/`。

**首次发布必须同步真实服务配置。** 原发布器只上传 `out/`，不会更新运行中的 Node 服务脚本。需通过管理员通道同步新版 `scripts/serve-local.mjs` 并重启 LeiBox 项目，或先安装本文的 Nginx 静态资源配置。沙箱内的共享字体需要 `Access-Control-Allow-Origin: *`。不能只上传页面后就视为缓存修复生效。

## 采用的解决方案

官方资料支持以下做法：

- 静态内容使用内容哈希 URL，并配合长期缓存；更新内容产生新 URL，避免旧缓存与新页面错配。[MDN HTTP 缓存](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)、[腾讯云节点缓存](https://cloud.tencent.com/document/product/228/47672)。
- `no-cache` 要求重新验证，不等于完全禁止保存；ETag / Last-Modified 可以使未变内容返回 304。腾讯云遵循源站策略时，需要单独确认节点是否缓存。[MDN HTTP 缓存](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)。
- 不再需要的 fetch 应通过 AbortController 取消；仅忽略结果不能停止带宽消耗。[MDN abort()](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort)。
- Next.js 静态导出依靠实际 Web 服务提供 HTTP 头；不能依赖 Next 服务器的动态 headers 行为。[Next.js 静态导出](https://nextjs.org/docs/app/guides/static-exports)。

实现分成四部分：

| 位置 | 修改 | 目的 |
| --- | --- | --- |
| `scripts/build-site-motion.mjs` | 生成独立的网站演示，HTML、JS、CSS、字体使用内容哈希；图片按场景尺寸生成 WebP | 减少首次流量，并让后续访客复用 CDN 缓存 |
| `src/lib/motion-document.ts` | 消费者计数、共享请求、10 秒导航交接、取消、重试、4 个空闲文档缓存 | 消除卡片与详情的重复文档下载，避免遗留请求 |
| `scripts/serve-local.mjs` | 哈希资源一年 immutable，普通静态资源一小时，ETag、Last-Modified、304、字体 MIME 与 CORS | 让真实响应头与缓存策略一致 |
| `src/components/common/github-stars.tsx` | 焦点刷新尊重已有缓存，失败退避并参考 Retry-After / rate-limit-reset | 避免截图中反复的 GitHub 403 请求 |

40 个 HTML 演示使用新交付流程；分享邀请和验证码的两个原生 React 预览保留原入口。原始 HTML 和六框架源码包保留，网站编译器不会回写它们。MiSans 原字体和声明没有裁剪、重编码；被拆出的其他字体保留原字节及许可。旧弹性权限组件的 Google Fonts 依赖换为仓库已有的带 OFL 声明的 Inter。

图片处理针对网站演示：揉皱纸张最大宽度 800px（展开纸张约 296 CSS px），品牌海报 800px，音乐封面 480px，其他场景最多 1024px，保留比例。PNG 使用无损 WebP，照片采用 WebP quality 88。原始下载内容保留原图。

专辑隧道的网站版本复用已有的渐进纹理能力，仍保留全部 55 张封面。首阶段与后续批次分别统计，避免用延迟加载隐藏总流量。

## 结果：同时计入脚本、样式和字体

以下为本地产物 gzip 体积，KB 采用 1000 B。不是只比较 HTML 文件大小。

| 演示 | 原自包含文件 | 新网站首次阶段 | 包含后续资源的总量 |
| --- | ---: | ---: | ---: |
| 揉皱纸张 | 668.7 KB | 125.5 KB | 125.5 KB，减少约 81% |
| 专辑封面隧道 | 3542.3 KB | 469.8 KB | 1274.4 KB，减少约 64% |
| 品牌海报卡片 | 1043.5 KB | 441.2 KB | 441.2 KB |
| 蜘蛛音乐播放器 | 1133.4 KB | 807.9 KB | 807.9 KB |

Deep Agent 的首次资源仍约 753 KB gzip，本轮主要改善其长期缓存，没有把完整 React UI 偷换为简化演示。

### 3 Mbps 受控测试

本地 CDN 测试夹具对所有未命中资源共享 3,000,000 bit/s 回源上限，每次未命中增加 100ms；文本资源使用 gzip。每次访问使用全新的浏览器上下文，验证共享边缘缓存，而非仅浏览器内存缓存。旧版本回放先前实测的 no-cache 策略。测试仅在本机运行，没有对正式站压测。

| 场景 | 旧策略：演示可用 | 新策略：演示可用 | 旧 / 新回源字节 |
| --- | ---: | ---: | ---: |
| 首个访客 | 3.186 秒 | 1.742 秒 | 670,056 / 126,895 B |
| 边缘缓存已有资源的新访客 | 3.192 秒 | 0.695 秒 | 668,688 / 0 B |
| 5 个新访客同时访问，边缘已预热 | 全部 11.851 秒 | 全部 2.002 秒 | 3,343,440 / 0 B |

这些数据包含夹具的 favicon 请求，故与纯演示体积有少量差异。它们证明流量减少及缓存复用，不承诺正式站达到同样毫秒数。此前正式站测得的 11–18 KB/s 异常下载速度，仍需结合源站出口、限速与 CDN 回源日志确认；代码优化不能替代这部分运行环境排查。

## TDD 与回归证据

按“先失败、再实现、再回归”推进：

| Evidence | 失败观察 → 修复后的结果 | 本机证据与复跑 |
| --- | --- | --- |
| E-001 | 旧缓存、条件请求和生成器检查失败 → 分类缓存、304 和完整资源预算通过 | `outputs/performance-fix-20261106/tdd-red.log`、`regression.log`；`npm run test:delivery` |
| E-002 | 悬停后进入详情下载 2 次 → 下载 1 次 | `tdd-browser-red.log`、`browser-dedup.json`；`npm run test:delivery:browser` |
| E-003 | 立即取消会打断导航交接 → 新消费者接管；取消导航超时后释放 | `tdd-navigation-red.log`、`regression.log`；`node --test scripts/motion-document.test.mjs` |
| E-004 | Google Fonts 仍在网站 CSS → 改为本地许可字体 | `tdd-fonts-red.log`、`tdd-fonts-green.log`；`node --test scripts/site-motion.test.mjs` |
| E-005 | 模拟 GitHub 403 后 6 次焦点事件产生共 7 次请求 → 共 1 次 | `tdd-github-red.log`、`github-refresh.json`；`npm run test:delivery:github` |
| E-006 | 单访客和 5 人共享回源瓶颈 → 新哈希资源可跨访客复用 | `bandwidth.json`；`npm run test:delivery:bandwidth` |
| E-007 | 重建会留下已退出当前生成结果的哈希资源 → 仅移除已识别且不再引用的本地生成文件，保留人工文件 | `tdd-retired-assets-red.log`、`tdd-retired-assets-green.log`；`node --test scripts/site-motion.test.mjs` |

对应 Findings：F-001（E-001/E-006）是缓存头和大资源交付问题；F-002（E-002/E-003）是请求生命周期问题；F-003（E-004/E-005）是可避免的第三方请求。

Path P-001：悬停卡片 → 获取哈希文档 → 点击时保留有时限的请求所有权 → 详情接管同一 Promise → 沙箱执行缓存的脚本与样式 → 其他访客由边缘缓存复用同一资源。普通离开卡片且没有导航消费者时取消请求；导航没有完成时，最多保留 10 秒。

验证范围：

- 生产构建、TypeScript、变更文件 ESLint 通过。
- 56 项自动检查通过，涵盖缓存、304、取消与交接、资源预算、来源、源码分发、联系接口等。
- 40 个网站演示在保留 `sandbox="allow-scripts"` 的框架内加载检查通过，未记录脚本或字体加载错误；检查包含 Shadow DOM、Canvas、SVG 和纯 CSS 场景，不等于穷举每个交互状态。
- 揉皱纸张的键盘交互及 375 / 768 / 1440 宽度验证通过；原有组件进入、返回、滚动恢复、中断、缩放、修饰键与减少动态效果回归通过。
- 发布/清理测试 22 项完成，含 1 项 Windows 下不可执行的既有平台测试跳过。
- Nginx 1.28.3 隔离容器中配置语法通过，实际资源返回 200、immutable、CORS 和正确 MIME；缺失资源返回 404。容器禁用外部网络，未改生产配置。
- Next 开发服务的字体 HEAD 请求返回 200、`font/woff` 与 CORS `*`。开发时 headers 的静态导出提示不用于生产；生产头由 Node 或 Nginx 提供。

现场原始日志在本机 `outputs/`，不随源码自动分发。上述测试脚本已留在仓库中，可以重新生成证据。

## 上线操作

### 源站

1. 发布前构建并运行下文检查。发布器仍只部署 main 已提交版本；本轮没有自动提交。
2. 通过管理员通道把本仓库 `scripts/serve-local.mjs` 同步到服务器同路径，保留 `.env.local`，在宝塔只重启 LeiBox Node 项目。
3. 推荐在域名的 Nginx server 块内安装 [leibox-motion-static.conf](nginx/leibox-motion-static.conf)，让哈希资源直接由 Nginx 提供。示例沿用现有部署目录 `/opt/Project/leibox/out`；使用其他目录时同步 root。该 location 内的 add_header 会影响继承，沿用站点已有的 HSTS/CSP 等自定义响应头。
4. 源站保留文本 gzip，使用更新后的 [RSC gzip 类型配置](nginx/leibox-rsc-gzip.conf)。JPEG、PNG、WebP、WOFF2 不需要重复 gzip。
5. 配置变更后先在服务器执行 `nginx -t`，成功后再平滑 reload。本地容器测试不能替代实际宝塔配置的合并检查。
6. 管理员同步新版 `scripts/deploy/cleanup.py` 到服务器既有的 `scripts/leibox-release-cleanup.py`，以便按原来的 24 小时和两份回滚备份规则退休新资源。发布密钥不增加更新自身接收器或服务脚本的权限。

### 腾讯云 CDN

域名管理 → 当前域名 → 缓存配置。先核对规则及优先级，建议如下：

| 路径 | 节点策略 | 说明 |
| --- | --- | --- |
| `/assets/motion/` | 遵循源站或缓存一年，强制缓存关闭 | 源站应返回 `public,max-age=31536000,immutable`；名字含内容哈希 |
| `/_next/static/`、`/assets/optimized/`、`/fonts/misans/` | 保留现有长期缓存 | 原先已命中的资源不必改为短缓存 |
| `/motion/`、`/landing/`、`/fonts/misans.css` | 遵循源站的一小时缓存 | 兼容下载和非哈希资源 |
| 普通页面、RSC、AI 目录与 Skill 发现文件 | 遵循源站的重新验证策略 | 不把所有 HTML / JSON 全站强制缓存 |
| `/api/` | 不缓存，优先级最高 | 联系接口不进入共享缓存 |

腾讯云遵循源站时，`no-cache/no-store/private` 会影响节点缓存。修复源站后无需用“全站强制缓存”绕过；它可能把接口或不合适的页面表示混在一起。规则底部优先级更高。依据：[节点缓存](https://cloud.tencent.com/document/product/228/47672)、[缓存未生效](https://cloud.tencent.com/document/product/228/61084)。

同时核对：

- HTTPS 配置中启用 HTTP/2，改善多资源并行访问；它不等于 HTTP/2 回源支持。[官方 HTTP/2 配置](https://cloud.tencent.com/document/product/228/41689)。
- 智能压缩同时保留 Gzip，控制台提供 Brotli 时可一并开启；确认 JS/CSS/HTML/JSON/SVG/RSC 类型和大小范围，尤其 Deep Agent 大脚本。当前部分平台或区域的 Brotli 支持不同。[官方智能压缩](https://intl.cloud.tencent.com/zh/document/product/228/35220)。
- 核对访问控制的下行限速、源站限速、回源协议与日志，定位此前远低于 3 Mbps 的实际速度。[官方下行限速](https://cloud.tencent.com/document/product/228/45076)。
- 首次发布后预热常访问的哈希文档、依赖脚本、样式和字体；先选常用组件，避免在 3 Mbps 源站上同时预热所有源码包。内容更新后哈希路径会变化，保留旧资源供已打开的页面使用。

### 发布后验收

部署完成后再执行下列只读检查，第二次请求应命中缓存。不要在文件尚未发布时提前预热其不存在的地址。

```powershell
$site = 'https://leibox.pantoria.cn'
$manifest = Invoke-RestMethod "$site/site-motion-manifest.json"
$runtimeUrl = $site + $manifest.components.'crumpled-paper'.documentUrl
curl.exe -sS -D - -o NUL $runtimeUrl
curl.exe -sS -D - -o NUL $runtimeUrl
```

确认：第二次 `X-Cache` / `X-Cache-Lookup` 显示 HIT，哈希资源含 immutable，字体带 CORS `*`，JS/CSS/HTML 有正确 MIME 与压缩。使用浏览器重新执行“列表悬停 → 详情 → 返回”，确认没有同一文档的两个完整下载，并检查字体、交互、源码复制和失效重试。

## 本地复跑

```powershell
npm run build
npm run test:delivery
npm run test:performance
python -m unittest discover -s scripts/deploy -p 'test_*.py'
# 独立终端执行 npm start，随后在测试终端设置：
$env:TEST_BASE_URL='http://127.0.0.1:3000'
npm run test:delivery:browser
npm run test:delivery:site
npm run test:delivery:bandwidth
npm run test:delivery:github
```

新增网站资源由构建脚本维护，不手改 `public/assets/motion/`、`public/site-motion-manifest.json` 或 `src/data/site-motion.json`。修改交互仍回到原动效核心与各自生成器，随后重新构建。
