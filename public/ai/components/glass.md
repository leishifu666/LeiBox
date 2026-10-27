# Glass / 玻璃透镜

A cursor-following glass lens that refracts your live HTML and zooms in on targets like a crystal ball.

玻璃透镜跟随光标，折射实时 HTML，并像水晶球一样放大目标。

Docs: /docs/components/glass
Machine-readable detail: /ai/components/glass.json
Original provider: https://canvasui.dev/docs/components/glass
License: [MIT + Commons Clause](https://github.com/DavidHDev/canvas-ui/blob/a04a99b235299ee79a123a16ccb2e6cf9da74b6b/LICENSE.md)

## Source and installation

Reference entry. This AI catalog does not redistribute component source. Install directly from the author's registry under its license; the @canvas-ui namespace belongs to the upstream author.

来源收藏条目。本 AI 目录不重新分发组件源码；如需使用，请遵守作者许可并直接从作者的注册表安装。@canvas-ui 属于上游作者。

Choose the project's actual framework and renderer. Example for React/WebGL, from the upstream provider:

```sh
npx shadcn@latest add @canvas-ui/glass-react
```

For WebGPU append `-webgpu` to the item name. Available frameworks: React, Vue, Svelte, Solid, Preact, vanilla TypeScript. Commands for each combination are in the JSON detail.

## API metadata

| Property | Type | Default | Description / 说明 |
| --- | --- | --- | --- |
| shape | "circle" \| "square" \| "rectangle" | "circle" | Lens shape: "circle", "square", or "rectangle". / 镜片形状："circle"、"square" 或 "rectangle"。 |
| size | number | 120 | Lens size (radius, or half height for rectangles) in CSS pixels. / 镜片尺寸，单位为 CSS 像素；圆形为半径，矩形为半高。 |
| aspect | number | 1.7 | Width to height ratio of the rectangle shape (1 to 3). / 矩形形状的宽高比（1 至 3）。 |
| corner | number | 32 | Corner radius for square and rectangle shapes in CSS pixels. / 正方形及矩形的圆角半径，单位为 CSS 像素。 |
| ior | number | 1.5 | Index of refraction of the glass (1 to 2). Higher bends light more strongly at the rim. / 玻璃折射率（1 至 2），值越高边缘对光线的弯折越强。 |
| edge | number | 0.7 | Fraction of the lens that stays optically flat before the rim starts bending (0 to 1). / 镜片边缘开始弯折前保持光学平坦的比例（0 至 1）。 |
| bevel | number | 4 | How sharply the rim curves away (1 to 10). / 镜片边缘弯曲的锐度（1 至 10）。 |
| depth | number | 250 | Optical depth in CSS pixels: how far the glass floats above the page, which scales the refraction displacement. / 光学深度，单位为 CSS 像素：玻璃悬浮于页面上方的距离，决定折射位移的大小。 |
| aberration | number | 1 | Chromatic aberration strength at the rim (0 to 3). 0 disables the spectral split. / 边缘色差强度（0 至 3），0 关闭光谱分离。 |
| blur | number | 0 | Frosted blur of the glass face (0 to 4). 0 keeps the glass optically clear. / 玻璃表面的磨砂模糊程度（0 至 4），0 保持光学清晰。 |
| reflection | number | 1 | Strength of the fresnel reflection on the rim (0 to 2). 0 disables it. / 边缘菲涅耳反射的强度（0 至 2），0 关闭。 |
| shine | number | 0.01 | Specular rim highlight (0 to 2) that keeps the lens visible over plain backgrounds. 0 disables it. / 镜面边缘高光（0 至 2），使镜片在纯色背景上仍可见；0 关闭。 |
| zoom | number | 1.5 | Magnification while hovering a target element (1 to 3), like a crystal ball. / 悬停目标元素时的放大倍数（1 至 3），类似水晶球。 |
| targets | string | "[data-glass-target]" | CSS selector for the elements that trigger the crystal ball zoom on hover. / 触发悬停水晶球放大的元素 CSS 选择器。 |
| follow | number | 0.2 | How quickly the lens follows the cursor (0 to 1). 1 snaps to it. / 镜片跟随光标的速度（0 至 1），1 表示紧贴。 |
| className | string |  | Classes applied to the wrapper element. / 应用到包装元素的 CSS 类。 |

## Browser notes

- WebGPU builds need a browser with WebGPU; verify the current browser support before choosing a renderer.
- HTML-in-Canvas is experimental. Check the component's current upstream browser/fallback documentation. Do not assume DOM capture works in every browser.
