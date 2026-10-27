# Glyph Rain / 字符雨

Falling glyph streams that light up your live HTML, with drop heads that surge where your cursor cuts through.

下落的字符流照亮实时 HTML，光标穿过时，字符雨的前端会涌动增强。

Docs: /docs/components/glyph-rain
Machine-readable detail: /ai/components/glyph-rain.json
Original provider: https://canvasui.dev/docs/components/glyph-rain
License: [MIT + Commons Clause](https://github.com/DavidHDev/canvas-ui/blob/a04a99b235299ee79a123a16ccb2e6cf9da74b6b/LICENSE.md)

## Source and installation

Reference entry. This AI catalog does not redistribute component source. Install directly from the author's registry under its license; the @canvas-ui namespace belongs to the upstream author.

来源收藏条目。本 AI 目录不重新分发组件源码；如需使用，请遵守作者许可并直接从作者的注册表安装。@canvas-ui 属于上游作者。

Choose the project's actual framework and renderer. Example for React/WebGL, from the upstream provider:

```sh
npx shadcn@latest add @canvas-ui/glyph-rain-react
```

For WebGPU append `-webgpu` to the item name. Available frameworks: React, Vue, Svelte, Solid, Preact, vanilla TypeScript. Commands for each combination are in the JSON detail.

## API metadata

| Property | Type | Default | Description / 说明 |
| --- | --- | --- | --- |
| charset | string | katakana + digits | Characters used for the falling glyphs. Deduplicated into a glyph atlas. / 下落字形使用的字符，去重后生成字形图集。 |
| cell | number | 15 | Size of one glyph cell in CSS pixels (8 to 64). / 单个字形单元的尺寸，单位为 CSS 像素（8 至 64）。 |
| color | [number, number, number] | [0.267, 0.455, 1] | Rain color as [r, g, b] in 0 to 1 range. / 字符雨颜色，使用 [r, g, b]，范围为 0 至 1。 |
| headColor | [number, number, number] | [0.169, 0.416, 1] | Color of the bright head glyph as [r, g, b] in 0 to 1 range. / 明亮头部字形的颜色，使用 [r, g, b]，范围为 0 至 1。 |
| speed | number | 0.2 | Fall speed in screen heights per second (0.05 to 3). / 下落速度，单位为屏幕高度/秒（0.05 至 3）。 |
| speedVariance | number | 0.5 | Per-column speed variation (0 to 1). / 各字符列的速度差异（0 至 1）。 |
| density | number | 0.15 | Fraction of drops that spawn each cycle (0 to 1). / 每个周期生成的雨滴比例（0 至 1）。 |
| trail | number | 0.65 | Length multiplier for the fading trails (0.2 to 3). / 渐隐拖尾的长度倍数（0.2 至 3）。 |
| glow | number | 1.75 | Brightness of the drop heads and the light they cast (0 to 3). / 雨滴头部及其投射光线的亮度（0 至 3）。 |
| mutate | number | 0 | How fast glyphs mutate into other characters (0 to 4). / 字形变为其他字符的速度（0 至 4）。 |
| flicker | number | 0 | Random brightness flicker of the streaks (0 to 1). / 光迹随机亮度闪烁的强度（0 至 1）。 |
| layers | number | 2 | Parallax rain layers behind the front one (1 to 3). / 前景层后方的视差雨层数量（1 至 3）。 |
| dim | number | 0.5 | How much the unlit page dims (0 to 1). 0 keeps it fully readable. / 未照亮页面的变暗程度（0 至 1），0 保持完整可读。 |
| light | number | 2.8 | Strength of the light the drops shine onto the page (0 to 3). / 雨滴照向页面的光照强度（0 至 3）。 |
| lightRadius | number | 240 | Radius of each drop's light pool in CSS pixels (20 to 600). / 每个雨滴光池的半径，单位为 CSS 像素（20 至 600）。 |
| lightHeight | number | 172 | How high above the page the lights float, in CSS pixels. Higher is softer. / 光源悬浮于页面上方的高度，单位为 CSS 像素；越高越柔和。 |
| relief | number | 0.05 | Embossed 3D shading of the page under the lights (0 to 2). / 光照下页面的三维浮雕明暗强度（0 至 2）。 |
| stir | number | 0.7 | How strongly the cursor stirs the rain as it passes (0 to 1). 0 disables it. / 光标经过时搅动字符雨的强度（0 至 1），0 关闭。 |
| stirRadius | number | 260 | How far the stirring reaches to either side of the cursor, in CSS pixels. / 搅动影响光标两侧的距离，单位为 CSS 像素。 |
| settle | number | 0.9 | Seconds the stirred wake takes to settle back to its own rhythm. / 被搅动的尾流恢复自身节奏所需的秒数。 |
| className | string |  | Classes applied to the wrapper element. / 应用到包装元素的 CSS 类。 |

## Browser notes

- WebGPU builds need a browser with WebGPU; verify the current browser support before choosing a renderer.
- HTML-in-Canvas is experimental. Check the component's current upstream browser/fallback documentation. Do not assume DOM capture works in every browser.
