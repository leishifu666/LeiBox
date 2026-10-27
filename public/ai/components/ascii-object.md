# ASCII Object / ASCII 物体

Any GLB/glTF model, SVG, or image floating in a studio scene, redrawn as shape-matched ASCII characters.

让任意 GLB/glTF 模型、SVG 或图片悬浮在影棚场景中，并以贴合轮廓的 ASCII 字符重绘。

Docs: /docs/components/ascii-object
Machine-readable detail: /ai/components/ascii-object.json
Original provider: https://canvasui.dev/docs/components/ascii-object
License: [MIT + Commons Clause](https://github.com/DavidHDev/canvas-ui/blob/a04a99b235299ee79a123a16ccb2e6cf9da74b6b/LICENSE.md)

## Source and installation

Reference entry. This AI catalog does not redistribute component source. Install directly from the author's registry under its license; the @canvas-ui namespace belongs to the upstream author.

来源收藏条目。本 AI 目录不重新分发组件源码；如需使用，请遵守作者许可并直接从作者的注册表安装。@canvas-ui 属于上游作者。

Choose the project's actual framework and renderer. Example for React/WebGL, from the upstream provider:

```sh
npx shadcn@latest add @canvas-ui/ascii-object-react
```

For WebGPU append `-webgpu` to the item name. Available frameworks: React, Vue, Svelte, Solid, Preact, vanilla TypeScript. Commands for each combination are in the JSON detail.

## API metadata

| Property | Type | Default | Description / 说明 |
| --- | --- | --- | --- |
| src | string |  | URL of the asset to display: GLB/glTF, SVG, PNG, JPEG, WebP, or GIF. Object URLs from a file input work too. The format is sniffed from the bytes, not the extension. Draco-compressed models are supported via a decoder fetched on demand, and flat art is mounted as a card lit by the same studio. / 要显示的素材网址：支持 GLB/glTF、SVG、PNG、JPEG、WebP 或 GIF，也支持文件输入生成的对象 URL。通过字节识别格式，而不依赖扩展名。Draco 压缩模型会按需加载解码器，二维素材则作为卡片放入同一灯光场景。 |
| ascii | boolean | true | Render the object as ASCII characters. Turn off to see the raw render. / 将物体渲染为 ASCII 字符。关闭后显示原始渲染。 |
| cellSize | number | 10 | Height of one character cell in CSS pixels. / 单个字符单元的高度，单位为 CSS 像素。 |
| cellAspect | number | 0.6 | Width of a character cell relative to its height (0.35 to 1.25). / 字符单元宽度相对于高度的比例（0.35 至 1.25）。 |
| charset | string | all 95 printable ASCII characters | Characters the renderer may choose from. Each character's shape is measured and matched against the underlying render, so glyphs like / and _ land on matching edges. A space is always available for empty cells. / 渲染器可使用的字符。每个字符的形状都会与底层画面匹配，让 /、_ 等字符落在相应边缘。空白单元始终可以使用空格。 |
| colored | boolean | true | Tint each character with the scene color underneath it. Turn off for a single-color look. / 使用下方场景颜色为每个字符着色。关闭后使用单色。 |
| color | string | "#ffffff" | Character color used when colored is off. / colored 关闭时使用的字符颜色。 |
| contrast | number | 1.5 | Tone contrast of the character selection. 1 keeps the original tones, higher values deepen shadows. / 字符选择的明暗对比度。1 保留原始色调，更高的值会加深阴影。 |
| edgeContrast | number | 3 | How strongly characters snap to edges and contours of the object. 1 turns the effect off. / 字符贴合物体边缘和轮廓的程度。1 表示关闭此效果。 |
| exposure | number | 1 | Brightness multiplier applied before characters are chosen. / 选择字符前应用的亮度倍数。 |
| invert | boolean | false | Invert the object tones so dark areas get the dense characters. / 反转物体明暗，使暗部使用更密集的字符。 |
| background | string | "" (transparent) | Background color behind the characters. Leave empty for a transparent canvas. / 字符后方的背景色。留空时画布透明。 |
| highlight | string | "#066aff" | Accent color of the ring light in the studio environment. / 工作室环境中环形灯的强调色。 |
| environmentIntensity | number | 1 | Brightness of the studio environment lighting. / 工作室环境光亮度。 |
| roughness | number | -1 | Roughness override applied to every material (0 to 1). Negative keeps the asset's own values. / 对所有材质应用的粗糙度覆盖值（0 至 1）；负值保留素材自身的设置。 |
| scale | number | 3 | Size of the longest side of the object in scene units. The camera sits about 4 units away. / 物体最长边的场景单位尺寸。相机距离约为 4 个单位。 |
| xOffset | number | 0 | Horizontal offset of the object in scene units. / 物体水平偏移，单位为场景单位。 |
| yOffset | number | 0 | Vertical offset of the object in scene units. / 物体垂直偏移，单位为场景单位。 |
| floatIntensity | number | 2 | Strength of the floating bob animation (0 disables). / 上下漂浮动画的强度（0 关闭）。 |
| rotationIntensity | number | 1 | Strength of the idle rocking rotation (0 disables). / 闲置摇摆旋转的强度（0 关闭）。 |
| floatSpeed | number | 2 | Speed of the float and rocking animation. / 漂浮与摇摆动画的速度。 |
| orbit | boolean | true | Let the user orbit the camera by dragging. / 允许用户拖动以环绕观察物体。 |
| zoom | boolean | false | Let the user zoom with the scroll wheel or pinch. / 允许用户使用滚轮或双指手势缩放。 |
| autoRotate | boolean | false | Spin the camera around the object turntable-style. / 让相机像转台一样环绕物体旋转。 |
| autoRotateSpeed | number | 2 | Turntable speed when autoRotate is on. / autoRotate 开启时的转台速度。 |
| fov | number | 65 | Camera field of view in degrees. / 相机视场角，单位为度。 |
| cameraDistance | number | 4.2 | Camera distance from the center of the object. / 相机到物体中心的距离。 |
| dracoDecoderPath | string | "https://www.gstatic.com/draco/versioned/decoders/1.5.7/" | Base URL of the Draco decoder, fetched only when a model needs it. / Draco 解码器的基础网址，仅在模型需要时加载。 |
| onLoad | () => void |  | Called after an asset finishes loading. / 素材加载完成后调用。 |
| onError | (error: unknown) => void |  | Called when an asset fails to load. / 素材加载失败时调用。 |
| className | string |  | Classes applied to the wrapper element. / 应用到包装元素的 CSS 类。 |

## Browser notes

- WebGPU builds need a browser with WebGPU; verify the current browser support before choosing a renderer.
- HTML-in-Canvas is experimental. Check the component's current upstream browser/fallback documentation. Do not assume DOM capture works in every browser.
