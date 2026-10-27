# Particle Object / 粒子物体

Rebuilds any 3D model, SVG, or image as particles that scatter around the cursor and spring back into shape.

将任意 3D 模型、SVG 或图片重建为粒子，在光标周围散开后弹回原来的形状。

Docs: /docs/components/particle-object
Machine-readable detail: /ai/components/particle-object.json
Original provider: https://canvasui.dev/docs/components/particle-object
License: [MIT + Commons Clause](https://github.com/DavidHDev/canvas-ui/blob/a04a99b235299ee79a123a16ccb2e6cf9da74b6b/LICENSE.md)

## Source and installation

Reference entry. This AI catalog does not redistribute component source. Install directly from the author's registry under its license; the @canvas-ui namespace belongs to the upstream author.

来源收藏条目。本 AI 目录不重新分发组件源码；如需使用，请遵守作者许可并直接从作者的注册表安装。@canvas-ui 属于上游作者。

Choose the project's actual framework and renderer. Example for React/WebGL, from the upstream provider:

```sh
npx shadcn@latest add @canvas-ui/particle-object-react
```

For WebGPU append `-webgpu` to the item name. Available frameworks: React, Vue, Svelte, Solid, Preact, vanilla TypeScript. Commands for each combination are in the JSON detail.

## API metadata

| Property | Type | Default | Description / 说明 |
| --- | --- | --- | --- |
| src | string |  | URL of the asset: GLB/glTF, SVG, PNG, JPEG, WebP, or GIF. Object URLs from a file input work too. The format is detected from the bytes, not the extension. Draco-compressed models are supported via a decoder fetched on demand. / 素材 URL：GLB/glTF、SVG、PNG、JPEG、WebP 或 GIF；也支持文件输入生成的 Object URL。根据字节内容识别格式，而非扩展名。按需下载解码器以支持 Draco 压缩模型。 |
| count | number | 14000 | Number of particles the asset is rebuilt from. / 重建素材使用的粒子数量。 |
| size | number | 2.4 | Particle size in CSS pixels at the model's distance. / 模型所在距离处的粒子尺寸，单位为 CSS 像素。 |
| sizeVariance | number | 0.6 | Random per-particle size variation (0 to 1). / 每个粒子尺寸的随机差异（0 至 1）。 |
| color | string | "" | Override color as any CSS color. Leave empty to keep the asset's own colors. / 覆盖颜色，可使用任意 CSS 颜色；留空保留素材原色。 |
| radius | number | 110 | Radius of the cursor's push field in CSS pixels. / 光标推动场的半径，单位为 CSS 像素。 |
| strength | number | 1 | How hard the cursor pushes particles away. / 光标推开粒子的力度。 |
| swirl | number | 0.6 | Tangential curl of the push (0 to 2). Particles spiral around the cursor instead of only fleeing it. / 推动的切向卷曲强度（0 至 2），使粒子环绕光标旋转。 |
| spring | number | 1 | How quickly displaced particles spring back home. / 位移粒子弹回原位的速度。 |
| damping | number | 0.35 | Velocity damping (0 to 1). Lower values keep particles wobbling longer. / 速度阻尼（0 至 1），较低值使粒子摆动更久。 |
| drift | number | 0.6 | Idle shimmer of the resting particles (0 disables). / 静止粒子的闲置闪动强度，0 关闭。 |
| background | string | "" | Background color behind the particles. Leave empty for a transparent canvas. / 粒子后方的背景颜色，留空则画布透明。 |
| scale | number | 3 | Size of the longest side of the asset in scene units. The camera sits about 4 units away. / 素材最长边的大小，单位为场景单位；摄像机距离约为 4 个单位。 |
| xOffset | number | 0 | Horizontal offset of the asset in scene units. / 素材的水平偏移，单位为场景单位。 |
| yOffset | number | 0 | Vertical offset of the asset in scene units. / 素材的垂直偏移，单位为场景单位。 |
| floatIntensity | number | 2 | Strength of the floating bob animation (0 disables). / 上下漂浮动画的强度（0 关闭）。 |
| rotationIntensity | number | 1 | Strength of the idle rocking rotation (0 disables). / 闲置摇摆旋转的强度（0 关闭）。 |
| floatSpeed | number | 2 | Speed of the float and rocking animation. / 漂浮与摇摆动画的速度。 |
| orbit | boolean | true | Let the user orbit the camera by dragging. / 允许用户拖动以环绕观察物体。 |
| zoom | boolean | false | Let the user zoom with the scroll wheel or pinch. / 允许用户使用滚轮或双指手势缩放。 |
| autoRotate | boolean | false | Spin the camera around the asset turntable-style. / 让摄像机以转台方式环绕素材。 |
| autoRotateSpeed | number | 2 | Turntable speed when autoRotate is on. / autoRotate 开启时的转台速度。 |
| fov | number | 65 | Camera field of view in degrees. / 相机视场角，单位为度。 |
| cameraDistance | number | 4.2 | Camera distance from the center of the asset. / 摄像机与素材中心的距离。 |
| dracoDecoderPath | string | "https://www.gstatic.com/draco/versioned/decoders/1.5.7/" | Base URL of the Draco decoder, fetched only when a model needs it. / Draco 解码器的基础网址，仅在模型需要时加载。 |
| onLoad | () => void |  | Called after an asset finishes loading. / 素材加载完成后调用。 |
| onError | (error: unknown) => void |  | Called when an asset fails to load. / 素材加载失败时调用。 |
| className | string |  | Classes applied to the wrapper element. / 应用到包装元素的 CSS 类。 |

## Browser notes

- WebGPU builds need a browser with WebGPU; verify the current browser support before choosing a renderer.
- HTML-in-Canvas is experimental. Check the component's current upstream browser/fallback documentation. Do not assume DOM capture works in every browser.
