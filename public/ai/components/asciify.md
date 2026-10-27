# Asciify / 字符透镜

A soft lens that follows your cursor and redraws the live HTML beneath it as ascii characters.

柔和的透镜跟随光标，将下方的实时 HTML 重绘为 ASCII 字符。

Docs: /docs/components/asciify
Machine-readable detail: /ai/components/asciify.json
Original provider: https://canvasui.dev/docs/components/asciify
License: [MIT + Commons Clause](https://github.com/DavidHDev/canvas-ui/blob/a04a99b235299ee79a123a16ccb2e6cf9da74b6b/LICENSE.md)

## Source and installation

Reference entry. This AI catalog does not redistribute component source. Install directly from the author's registry under its license; the @canvas-ui namespace belongs to the upstream author.

来源收藏条目。本 AI 目录不重新分发组件源码；如需使用，请遵守作者许可并直接从作者的注册表安装。@canvas-ui 属于上游作者。

Choose the project's actual framework and renderer. Example for React/WebGL, from the upstream provider:

```sh
npx shadcn@latest add @canvas-ui/asciify-react
```

For WebGPU append `-webgpu` to the item name. Available frameworks: React, Vue, Svelte, Solid, Preact, vanilla TypeScript. Commands for each combination are in the JSON detail.

## API metadata

| Property | Type | Default | Description / 说明 |
| --- | --- | --- | --- |
| radius | number | 0.4 | Radius of the ascii lens around the cursor, relative to the screen height. / 指针周围 ASCII 镜片的半径，相对于屏幕高度。 |
| softness | number | 1 | Edge feather of the lens as a fraction of the radius (0 to 1). / 镜片边缘羽化宽度，相对于半径的比例（0 至 1）。 |
| scale | number | 2 | Size of one glyph pixel in CSS pixels. Characters are 5x5 glyph pixels. / 单个字形像素的 CSS 像素尺寸。字符由 5×5 个字形像素构成。 |
| spacing | number | 1 | Empty glyph pixels around each character (0 to 3). / 每个字符周围的空白字形像素数（0 至 3）。 |
| charset | "ascii" \| "blocks" \| "binary" | "ascii" | Built-in character ramp: real ascii glyphs, shade blocks, or binary digits. / 内置字符梯度：真实 ASCII 字符、阴影方块或二进制数字。 |
| glyphs | number[] | [] | Custom ramp of packed 5x5 bitmaps (dark to bright), overrides charset. / 从暗到亮排列的自定义 5×5 位图梯度，覆盖 charset。 |
| background | [number, number, number] \| "auto" | [0, 0, 0] | Paper color behind the glyphs as [r, g, b] in 0-1 range, or "auto" to match the page background. / 字形后方的底色，使用 0 至 1 范围的 [r, g, b]，或设为 auto 匹配页面背景。 |
| backgroundOpacity | number | 0 | Opacity of the background behind the glyphs (0 to 1). / 字形后方背景的不透明度（0 至 1）。 |
| contrast | number | 1 | Contrast applied to character density before picking a glyph. / 选择字形前应用到字符密度的对比度。 |
| brightness | number | 0 | Density offset applied before picking a glyph (-1 to 1). / 选择字形前应用的密度偏移（-1 至 1）。 |
| invert | number | 0 | Invert character density inside the effect (0 to 1). / 效果区域中的字符密度反转程度（0 至 1）。 |
| strength | number | 1 | Coverage of asciified cells inside the lens (0 to 1). / 镜片内 ASCII 单元的覆盖比例（0 至 1）。 |
| baseStrength | number | 0 | Ascii coverage across the whole screen, outside the lens (0 to 1). / 镜片外整个屏幕的 ASCII 覆盖比例（0 至 1）。 |
| followSpeed | number | 3 | How quickly the lens follows the cursor. Higher is snappier. / 镜片跟随指针的速度。值越高，响应越直接。 |
| glow | number | 0.75 | Soft phosphor glow around the text dots (0 to 1). / 文字像素周围柔和的荧光强度（0 至 1）。 |
| aberration | number | 0.75 | Soft chromatic aberration toward the lens edge (0 to 1). / 朝镜片边缘增加的柔和色差（0 至 1）。 |

## Browser notes

- WebGPU builds need a browser with WebGPU; verify the current browser support before choosing a renderer.
- HTML-in-Canvas is experimental. Check the component's current upstream browser/fallback documentation. Do not assume DOM capture works in every browser.
