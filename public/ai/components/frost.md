# Frost / 冰霜

A frozen pane of ice over your live HTML that melts under the cursor and refreezes.

在实时 HTML 上覆盖冰层，光标划过时融化，离开后重新结冰。

Docs: /docs/components/frost
Machine-readable detail: /ai/components/frost.json
Original provider: https://canvasui.dev/docs/components/frost
License: [MIT + Commons Clause](https://github.com/DavidHDev/canvas-ui/blob/a04a99b235299ee79a123a16ccb2e6cf9da74b6b/LICENSE.md)

## Source and installation

Reference entry. This AI catalog does not redistribute component source. Install directly from the author's registry under its license; the @canvas-ui namespace belongs to the upstream author.

来源收藏条目。本 AI 目录不重新分发组件源码；如需使用，请遵守作者许可并直接从作者的注册表安装。@canvas-ui 属于上游作者。

Choose the project's actual framework and renderer. Example for React/WebGL, from the upstream provider:

```sh
npx shadcn@latest add @canvas-ui/frost-react
```

For WebGPU append `-webgpu` to the item name. Available frameworks: React, Vue, Svelte, Solid, Preact, vanilla TypeScript. Commands for each combination are in the JSON detail.

## API metadata

| Property | Type | Default | Description / 说明 |
| --- | --- | --- | --- |
| frost | number | 0.05 | Base frozen coverage added on top of the frost pattern. / 在冰霜图案上叠加的基础冻结覆盖量。 |
| strength | number | 0.7 | Multiplier on the frost noise pattern. Higher freezes more. / 冰霜噪声图案的倍数，值越高冻结越多。 |
| contrast | number | 3 | Contrast of the frost noise pattern. / 冰霜噪声图案的对比度。 |
| crispness | number | 1 | Contrast of the final frost mask. Higher is crisper edges. / 最终冰霜遮罩的对比度，值越高边缘越清晰。 |
| highlight | number | 0.3 | How much sparkling grain mixes into the frost. / 混入冰霜的闪烁颗粒量。 |
| highlightStrength | number | 0.8 | How strongly the sparkles tint toward white. / 闪光趋向白色的着色强度。 |
| haze | number | 0.5 | Base blur haze over the content, even outside thick frost. / 内容上方的基础模糊雾层，即使不在厚霜区域也存在。 |
| tintThin | [number, number, number] | [0.82, 0.86, 1.05] | Frost color where the layer is thin, as [r, g, b] in 0-1. / 薄冰霜区域的颜色，使用 [r, g, b]，范围为 0 至 1。 |
| tintThick | [number, number, number] | [0.92, 0.96, 1.1] | Frost color where the layer is thick, as [r, g, b] in 0-1. / 厚冰霜区域的颜色，使用 [r, g, b]，范围为 0 至 1。 |
| tintStrength | number | 0.3 | How much the frost tint colors the frozen areas. / 冰霜着色影响冻结区域的程度。 |
| saturation | number | 1.2 | Saturation multiplier applied to the frosted content. / 冰霜下内容的饱和度倍数。 |
| brightness | number | 0.85 | Brightness multiplier applied to the frosted content. / 冰霜下内容的亮度倍数。 |
| refraction | number | 1 | How far the icy surface bends light. 0 disables it. / 冰面弯折光线的程度，0 关闭。 |
| ior | number | 1.31 | Index of refraction of the ice. Water ice is about 1.31. / 冰的折射率，水冰约为 1.31。 |
| detail | number | 2 | Strength of the fine surface detail in the refraction. / 折射中细微表面细节的强度。 |
| textureScale | number | 2 | Scale of the icy relief pattern. Higher is larger features. / 冰面浮雕图案的缩放，值越高特征越大。 |
| fresnel | number | 0.8 | Fresnel boost of the refraction at grazing angles. / 掠射角下折射的菲涅耳增强程度。 |
| meltRadius | number | 0.25 | Radius of the melt spot under the cursor. / 光标下方融化区域的半径。 |
| meltNoise | number | 0.25 | Irregularity of the melt edge. 0 is a clean circle. / 融化边缘的不规则程度，0 为完整圆形。 |
| meltStrength | number | 0.75 | How quickly hovering melts the frost. / 悬停融化冰霜的速度。 |
| refreeze | number | 2 | How fast melted areas freeze back over. 0 never refreezes. / 已融化区域重新冻结的速度，0 表示不再冻结。 |
| edgeFade | number | 0.1 | Keeps the edges of the pane frozen. 0 lets everything melt. / 保持冰面边缘冻结的强度，0 允许全部融化。 |
| meltEdges | boolean | true | Lets the frozen borders of the pane melt too. / 允许冰面的冻结边缘也融化。 |
| introDuration | number | 2.5 | Seconds for the frost to grow in from the edges on load. 0 disables. / 加载时冰霜从边缘生长所需的秒数，0 关闭。 |
| opacity | number | 0.6 | Overall opacity of the frost layer. Lower shows more content. / 冰霜层的整体透明度，值越低显示的内容越多。 |
| shimmer | number | 0 | Animated twinkle of the highlight grain. 0 is static. / 高光颗粒的动态闪烁，0 为静态。 |
| quality | number | 1 | Resolution multiplier for the blur passes (0.25-1). / 模糊渲染的分辨率倍数（0.25 至 1）。 |
| className | string |  | Classes applied to the wrapper element. / 应用到包装元素的 CSS 类。 |

## Browser notes

- WebGPU builds need a browser with WebGPU; verify the current browser support before choosing a renderer.
- HTML-in-Canvas is experimental. Check the component's current upstream browser/fallback documentation. Do not assume DOM capture works in every browser.
