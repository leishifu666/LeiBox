# Glass Object / 玻璃物体

Turns any 3D model, SVG, or image into floating liquid glass with real refraction, dispersion, and frost.

将任意 3D 模型、SVG 或图片变为悬浮液态玻璃，呈现真实折射、色散与磨砂效果。

Docs: /docs/components/glass-object
Machine-readable detail: /ai/components/glass-object.json
Original provider: https://canvasui.dev/docs/components/glass-object
License: [MIT + Commons Clause](https://github.com/DavidHDev/canvas-ui/blob/a04a99b235299ee79a123a16ccb2e6cf9da74b6b/LICENSE.md)

## Source and installation

Reference entry. This AI catalog does not redistribute component source. Install directly from the author's registry under its license; the @canvas-ui namespace belongs to the upstream author.

来源收藏条目。本 AI 目录不重新分发组件源码；如需使用，请遵守作者许可并直接从作者的注册表安装。@canvas-ui 属于上游作者。

Choose the project's actual framework and renderer. Example for React/WebGL, from the upstream provider:

```sh
npx shadcn@latest add @canvas-ui/glass-object-react
```

For WebGPU append `-webgpu` to the item name. Available frameworks: React, Vue, Svelte, Solid, Preact, vanilla TypeScript. Commands for each combination are in the JSON detail.

## API metadata

| Property | Type | Default | Description / 说明 |
| --- | --- | --- | --- |
| src | string |  | URL of the asset: GLB/glTF, SVG, PNG, JPEG, WebP, or GIF. Object URLs from a file input work too. The format is detected from the bytes, not the extension. SVGs and images are traced and extruded into a rounded glass slab; models keep their geometry. Draco-compressed models are supported via a decoder fetched on demand. / 素材 URL：GLB/glTF、SVG、PNG、JPEG、WebP 或 GIF；也支持文件输入产生的 Object URL。根据字节内容识别格式，而非扩展名。SVG 与图片会描摹并拉伸为圆润玻璃板，模型保留自身几何。按需下载解码器以支持 Draco 压缩模型。 |
| ior | number | 1.75 | Index of refraction of the glass (1 to 2.33). / 玻璃折射率（1 至 2.33）。 |
| thickness | number | 4 | Thickness of the glass volume in scene units. Drives how strongly light bends. / 玻璃体积厚度，单位为场景单位，决定光线弯折的强度。 |
| roughness | number | 0.25 | Surface roughness (0 to 1). Higher values frost the glass. / 表面粗糙度（0 至 1），值越高玻璃越磨砂。 |
| dispersion | number | 1.5 | Chromatic dispersion of the refraction (0 to 2). Splits light into rainbow fringes like real glass. / 折射的色散程度（0 至 2），像真实玻璃一样把光分成彩虹边缘。 |
| clearcoat | number | 0.5 | Clearcoat layer on top of the glass (0 to 1). / 玻璃表面的清漆层强度（0 至 1）。 |
| tint | string | "" | Tint color of the glass volume as any CSS color. Leave empty to keep the glass clear. / 玻璃体积的着色，可使用任意 CSS 颜色；留空保持透明。 |
| tintDensity | number | 2 | How strongly the tint absorbs light through the volume. / 着色吸收穿过体积光线的强度。 |
| depth | number | 0.1 | Extrusion depth of 2D assets (SVG or image) as a fraction of their longest side. / 二维素材（SVG 或图片）的拉伸深度，相对于其最长边。 |
| bevel | number | 1 | Edge rounding of extruded 2D assets (0 to 1). Higher values melt the edges into a liquid lip. / 拉伸二维素材的边缘圆润程度（0 至 1）；较高值使边缘呈液态唇口。 |
| highlight | string | "#066aff" | Accent color of the ring light in the studio environment. / 工作室环境中环形灯的强调色。 |
| environmentIntensity | number | 1 | Brightness of the studio environment lighting. / 工作室环境光亮度。 |
| background | string | "" | Background color behind the glass. Leave empty for a transparent canvas; an opaque color shows through the refraction. / 玻璃后方的背景颜色。留空则画布透明；不透明颜色会透过折射显示。 |
| backgroundImage | string | "" | URL of an image shown as a backdrop behind the glass, cover-fit to the view. The glass samples and refracts it. Leave empty to disable. / 玻璃后方的背景图 URL，以 cover 方式填满视图。玻璃会采样并折射它；留空关闭。 |
| scale | number | 3 | Size of the longest side of the asset in scene units. The camera sits about 4 units away. / 素材最长边的大小，单位为场景单位；摄像机距离约为 4 个单位。 |
| xOffset | number | 0 | Horizontal offset of the asset in scene units. / 素材的水平偏移，单位为场景单位。 |
| yOffset | number | 0 | Vertical offset of the asset in scene units. / 素材的垂直偏移，单位为场景单位。 |
| floatIntensity | number | 1 | Strength of the floating bob animation (0 disables). / 上下漂浮动画的强度（0 关闭）。 |
| rotationIntensity | number | 1 | Strength of the idle rocking rotation (0 disables). / 闲置摇摆旋转的强度（0 关闭）。 |
| floatSpeed | number | 2 | Speed of the float and rocking animation. / 漂浮与摇摆动画的速度。 |
| orbit | boolean | true | Let the user orbit the camera by dragging. / 允许用户拖动以环绕观察物体。 |
| zoom | boolean | false | Let the user zoom with the scroll wheel or pinch. / 允许用户使用滚轮或双指手势缩放。 |
| autoRotate | boolean | false | Spin the camera around the asset turntable-style. / 让摄像机以转台方式环绕素材。 |
| autoRotateSpeed | number | 2 | Turntable speed when autoRotate is on. / autoRotate 开启时的转台速度。 |
| fov | number | 55 | Camera field of view in degrees. / 相机视场角，单位为度。 |
| cameraDistance | number | 4 | Camera distance from the center of the asset. / 摄像机与素材中心的距离。 |
| dracoDecoderPath | string | "https://www.gstatic.com/draco/versioned/decoders/1.5.7/" | Base URL of the Draco decoder, fetched only when a model needs it. / Draco 解码器的基础网址，仅在模型需要时加载。 |
| onLoad | () => void |  | Called after an asset finishes loading. / 素材加载完成后调用。 |
| onError | (error: unknown) => void |  | Called when an asset fails to load. / 素材加载失败时调用。 |
| className | string |  | Classes applied to the wrapper element. / 应用到包装元素的 CSS 类。 |

## Browser notes

- WebGPU builds need a browser with WebGPU; verify the current browser support before choosing a renderer.
- HTML-in-Canvas is experimental. Check the component's current upstream browser/fallback documentation. Do not assume DOM capture works in every browser.
