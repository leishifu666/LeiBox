# Particle Scroll / 粒子滚动

Dissolves your live HTML below a chosen line into fine sand particles that reassemble on scroll.

将指定分界线下方的实时 HTML 化为细沙粒子，并随滚动重新聚合。

Docs: /docs/components/particle-scroll
Machine-readable detail: /ai/components/particle-scroll.json
Original provider: https://canvasui.dev/docs/components/particle-scroll
License: [MIT + Commons Clause](https://github.com/DavidHDev/canvas-ui/blob/a04a99b235299ee79a123a16ccb2e6cf9da74b6b/LICENSE.md)

## Source and installation

Reference entry. This AI catalog does not redistribute component source. Install directly from the author's registry under its license; the @canvas-ui namespace belongs to the upstream author.

来源收藏条目。本 AI 目录不重新分发组件源码；如需使用，请遵守作者许可并直接从作者的注册表安装。@canvas-ui 属于上游作者。

Choose the project's actual framework and renderer. Example for React/WebGL, from the upstream provider:

```sh
npx shadcn@latest add @canvas-ui/particle-scroll-react
```

For WebGPU append `-webgpu` to the item name. Available frameworks: React, Vue, Svelte, Solid, Preact, vanilla TypeScript. Commands for each combination are in the JSON detail.

## API metadata

| Property | Type | Default | Description / 说明 |
| --- | --- | --- | --- |
| point | number | 0.68 | Viewport fraction of the formation line. Content assembles as it scrolls up past this line and dissolves back below it. / 成形线在视口中的比例位置；内容向上滚过此线时聚合，回到下方时重新溶解。 |
| band | number | 420 | Height in CSS pixels of the transition band where particles progressively reassemble. / 粒子逐渐重新聚合的过渡带高度，单位为 CSS 像素。 |
| density | number | 2 | Grain spacing in CSS pixels. Smaller values mean finer, denser sand. / 颗粒间距，单位为 CSS 像素；值越小沙粒越细密。 |
| size | number | 1.25 | Size of fully scattered dust grains in CSS pixels. Grains grow to cover their cell as they land. / 完全散开时的尘埃颗粒尺寸，单位为 CSS 像素；落定时颗粒会长大并覆盖其单元。 |
| spread | number | 220 | Maximum distance in CSS pixels particles scatter from their home position. / 粒子偏离原位的最大距离，单位为 CSS 像素。 |
| gravity | number | 0.35 | Downward bias of the scattered cloud (-1 to 1), like sand settling. Negative values lift it. / 散开粒子云的向下偏移（-1 至 1），如沙粒沉降；负值使其上浮。 |
| drift | number | 0.7 | Idle float speed of scattered particles (0 to 1). 0 freezes the cloud. / 散开粒子的闲置浮动速度（0 至 1），0 冻结粒子云。 |
| swirl | number | 60 | Sideways arc in CSS pixels particles take while flying home. / 粒子飞回原位时的侧向弧线幅度，单位为 CSS 像素。 |
| stagger | number | 0.7 | Per-particle randomness of reassembly timing (0 to 1). / 各粒子重新聚合时序的随机程度（0 至 1）。 |
| fade | number | 0.85 | Opacity of fully scattered particles (0 to 1). / 完全散开粒子的透明度（0 至 1）。 |
| settle | number | 1.2 | Seconds a row of dust takes to condense into the page once the reveal reaches it. / 显现抵达后，一行尘埃凝聚为页面所需的秒数。 |
| smoothing | number | 0.6 | Seconds the damped scroll takes to catch up with the real scroll. Higher feels more fluid. / 阻尼滚动追上真实滚动所需的秒数，值越高越有流动感。 |
| className | string |  | Classes applied to the wrapper element. / 应用到包装元素的 CSS 类。 |

## Browser notes

- WebGPU builds need a browser with WebGPU; verify the current browser support before choosing a renderer.
- HTML-in-Canvas is experimental. Check the component's current upstream browser/fallback documentation. Do not assume DOM capture works in every browser.
