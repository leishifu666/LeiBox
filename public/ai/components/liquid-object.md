# Liquid Object / 流体物体

Drags any 3D model, SVG, or image through invisible liquid that swirls under the cursor and splits the light into color.

让任意 3D 模型、SVG 或图片穿过隐形液体，在光标下旋转流动，并将光线分解为色彩。

Docs: /docs/components/liquid-object
Machine-readable detail: /ai/components/liquid-object.json
Original provider: https://canvasui.dev/docs/components/liquid-object
License: [MIT + Commons Clause](https://github.com/DavidHDev/canvas-ui/blob/a04a99b235299ee79a123a16ccb2e6cf9da74b6b/LICENSE.md)

## Source and installation

Reference entry. This AI catalog does not redistribute component source. Install directly from the author's registry under its license; the @canvas-ui namespace belongs to the upstream author.

来源收藏条目。本 AI 目录不重新分发组件源码；如需使用，请遵守作者许可并直接从作者的注册表安装。@canvas-ui 属于上游作者。

Choose the project's actual framework and renderer. Example for React/WebGL, from the upstream provider:

```sh
npx shadcn@latest add @canvas-ui/liquid-object-react
```

For WebGPU append `-webgpu` to the item name. Available frameworks: React, Vue, Svelte, Solid, Preact, vanilla TypeScript. Commands for each combination are in the JSON detail.

## API metadata

| Property | Type | Default | Description / 说明 |
| --- | --- | --- | --- |
| src | string |  | URL of the asset to display: GLB/glTF, SVG, PNG, JPEG, WebP, or GIF. Object URLs from a file input work too. The format is sniffed from the bytes, not the extension. / 要显示的素材 URL：GLB/glTF、SVG、PNG、JPEG、WebP 或 GIF；也支持文件输入生成的 Object URL。根据字节内容识别格式，而非扩展名。 |
| distortion | number | 2 | How far the liquid drags the object as it flows. / 液体流动时拖拽物体的距离。 |
| aberration | number | 0.75 | Strength of the chromatic lens fringe in a soft radius around the cursor. / 光标周围柔和范围内的彩色镜头边缘强度。 |
| grain | number | 1 | Amount of animated film grain. Subtle across the frame, strongest inside the cursor lens. / 动态胶片颗粒量；全画面较轻，光标镜头内最强。 |
| sheen | number | 1.6 | Brightness of the light glinting off the moving liquid. / 运动液体反射闪光的亮度。 |
| cursorSize | number | 1 | Size of the area the cursor disturbs. / 光标扰动区域的大小。 |
| cursorForce | number | 1 | How hard the cursor pushes the liquid. / 光标推动液体的力度。 |
| persistence | number | 0.6 | How long the ripples keep flowing after the cursor stops. / 光标停止后涟漪继续流动的时长。 |
| swirl | number | 0.5 | How much the flow curls into swirls and eddies. / 流动卷成旋涡与涡流的程度。 |
| iridescence | number | 1.5 | Strength of the rainbow shimmer where the liquid flows. / 液体流动处彩虹光泽的强度。 |
| splash | number | 1.2 | Strength of the liquid burst fired when the canvas is clicked or tapped. 0 disables. / 点击或轻触画布时液体爆发的强度，0 关闭。 |
| ambient | number | 1 | Amount of slow idle drift that keeps the surface alive while the cursor is away. / 光标离开时使表面保持活力的缓慢漂移量。 |
| wobble | number | 0 | How much the object tilts and bounces like jelly in response to the cursor. / 物体响应光标时，像果冻般倾斜弹动的程度。 |
| gloss | number | 0.65 | Surface finish of extruded 2D assets, from matte to mirror. Models keep their own materials. / 拉伸二维素材的表面质感，从哑光到镜面；模型保留自身材质。 |
| metallic | number | 0.15 | How metallic the asset reads. 0 keeps the original material finish, 1 turns it to polished metal. / 素材的金属质感，0 保留原材质外观，1 变为抛光金属。 |
| tint | string |  | Tint multiplied over the asset colors. Empty string keeps the original colors. / 与素材颜色相乘的着色；空字符串保留原色。 |
| depth | number | 0.05 | Extrusion depth of 2D assets (SVG or image) as a fraction of their longest side. / 二维素材（SVG 或图片）的拉伸深度，相对于其最长边。 |
| bevel | number | 0.5 | Edge rounding of extruded 2D assets (0 to 1). Higher values melt the edges into a liquid lip. / 拉伸二维素材的边缘圆润程度（0 至 1）；较高值使边缘呈液态唇口。 |
| highlight | string | #ffffff | Accent color of the ring light in the studio environment. / 工作室环境中环形灯的强调色。 |
| environmentIntensity | number | 1 | Brightness of the studio environment lighting. / 工作室环境光亮度。 |
| brightness | number | 1 | Output brightness. 1 is neutral. / 输出亮度，1 为中性值。 |
| saturation | number | 1.2 | Output color saturation. 0 is grayscale, 1 is neutral. / 输出色彩饱和度，0 为灰度，1 为中性值。 |
| background | string |  | Background color behind the object. Empty string keeps the canvas transparent. / 物体后方的背景色，空字符串保持画布透明。 |
| scale | number | 3 | Size of the longest side of the asset in scene units. The camera sits about 4 units away. / 素材最长边的大小，单位为场景单位；摄像机距离约为 4 个单位。 |
| xOffset | number | 0 | Horizontal offset of the asset in scene units. / 素材的水平偏移，单位为场景单位。 |
| yOffset | number | -0.2 | Vertical offset of the asset in scene units. / 素材的垂直偏移，单位为场景单位。 |
| floatIntensity | number | 1 | Strength of the floating bob animation (0 disables). / 上下漂浮动画的强度（0 关闭）。 |
| rotationIntensity | number | 0.5 | Strength of the idle rocking rotation (0 disables). / 闲置摇摆旋转的强度（0 关闭）。 |
| floatSpeed | number | 1.5 | Speed of the float and rocking animation. / 漂浮与摇摆动画的速度。 |
| orbit | boolean | true | Let the user orbit the camera by dragging. / 允许用户拖动以环绕观察物体。 |
| zoom | boolean | false | Let the user zoom with the scroll wheel or pinch. / 允许用户使用滚轮或双指手势缩放。 |
| autoRotate | boolean | false | Spin the camera around the asset turntable-style. / 让摄像机以转台方式环绕素材。 |
| autoRotateSpeed | number | 2 | Turntable speed when autoRotate is on. / autoRotate 开启时的转台速度。 |
| fov | number | 60 | Camera field of view in degrees. / 相机视场角，单位为度。 |
| cameraDistance | number | 4 | Camera distance from the center of the asset. / 摄像机与素材中心的距离。 |
| dracoDecoderPath | string | https://www.gstatic.com/draco/versioned/decoders/1.5.7/ | Base URL of the Draco decoder, fetched only when a model needs it. / Draco 解码器的基础网址，仅在模型需要时加载。 |
| onLoad | (() => void) \| null |  | Called after an asset finishes loading. / 素材加载完成后调用。 |
| onError | ((error: unknown) => void) \| null |  | Called when an asset fails to load. / 素材加载失败时调用。 |

## Browser notes

- WebGPU builds need a browser with WebGPU; verify the current browser support before choosing a renderer.
- HTML-in-Canvas is experimental. Check the component's current upstream browser/fallback documentation. Do not assume DOM capture works in every browser.
