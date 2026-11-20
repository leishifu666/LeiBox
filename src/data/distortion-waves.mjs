export const DISTORTION_WAVES_PROMPT = `实现「折射波浪视图转场」。点击卡片中的触发元素后，界面先向触发源轻微内吸蓄力，随后从该位置荡出一道带有实时 DOM 折射、五通道色散、渐进高斯模糊、OKLab 边缘色晕、玻璃细线与漂浮微粒的彩色波浪，将当前视图平滑切换为目标视图；再次触发时波浪反向收拢回源元素并切回原视图。

画布与排版
- 舞台宽 100%、默认最小高度 540px，纯白背景 #ffffff，居中纵向排列演示卡片与底部控制条（间距 20px），字体使用系统无衬线回退栈：-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", "PingFang SC", "Helvetica Neue", sans-serif。
- 卡片采用 CSS Grid 单格堆叠（grid-area: 1 / 1），外层圆角 32px、overflow: hidden、isolation: isolate、黑色卡片背景 #111111，无外边框与阴影。vertical 模式宽 380px、内容最小高 386px；center 模式宽 354px、内容最小高 348px；horizontal 模式宽 440px、内容最小高 300px。375px 窄屏时卡片自适应可用宽度，圆角 26px，无横向溢出。
- 卡片内部分三层：第一层 content（初始视图）、第二层 revealed（目标视图，未揭示时 opacity: 0、pointer-events: none、inert、aria-hidden="true"）、顶层 overlay（z-index: 2、pointer-events: none，仅子按钮恢复 pointer-events: auto），中间插入的 WebGL2 画布位于 z-index: 1、pointer-events: none，使顶层按钮保持清晰且持续可点击。

三种交互视图
- vertical 模式（默认，转账确认卡片）：content 顶部放 48×48px 圆形照片头像，复用项目“品牌海报三联卡片”的透明眼镜人像，缩小并嵌入组件以便离线运行。下方依次为 13px 灰色文字“Sending to ”加粗白色“Maya Chen”、32px 等宽数字金额“$1,250.00”，以及 #242426 圆角 18px 详情框内的四行数据（From / Everyday ·· 4821、Arrives / In seconds、Fee / Free、Note / Studio rent）；revealed 将头像切换为 #5be87d 到 #1ea640 的 48px 绿色圆形对勾标，标题变为“Sent to Maya Chen”，第二行变为“Arrived / Just now”（#5ee87d）。底部 overlay 放置全宽 48px 高、圆角 24px、白底 #f5f5f7 黑字 #111111 的主按钮（Confirm / Done），该按钮同时作为波浪起始源，点击左右不同位置会让波浪前沿朝点击处倾斜。
- center 模式（余额充值卡片）：content 顶部放 48px 深灰圆形叠币图标作为波浪源，下方为 24px 标题“Add credits”、13px 副标题“Current balance: $65.73”与三条带圆形勾标的权益列表；revealed 在源圆原地切换为绿色对勾标，标题变为“Credits added / New balance: $85.73”，波浪以环形向外扩散且在源圆半径内保持清晰（hold）。底部按钮在“Buy $20 tokens”与“Done”间切换。
- horizontal 模式（版本发布卡片）：overlay 左侧放置宽 60px、圆角 20px、沿用白底 #f5f5f7 和黑色文字 #111111 的纵向触发条（Ship / Back）作为起始源，右侧内边距 96px 展示状态胶囊（Draft · v2.4 / Published · Live）、标题、摘要与元信息，波浪自左侧横向扫向右侧。
- 底部控制条包含 Type 分段切换（Vertical / Center / Horizontal）与五枚圆形色板按钮（Colorful、Green、Ocean、Sunset、Mono），均使用原生 button 与 aria-pressed 状态，可见 #2563eb 键盘焦点轮廓。
- 点击模式按钮时，选中滑块滑至目标，卡片宽高在约 540ms 内插值，内容交叉淡入淡出。切入或离开 horizontal 时，白色主按钮先收成短胶囊，再伸展到目标位置。快速切换从当前形态继续，系统减少动态效果时直接到达目标。

DOM 快照与 WebGL2 渲染算法
- 实时 DOM 截图：遍历卡片内可见元素，收集与浏览器默认样式差异化的 computedStyle、内联样式与伪元素（::before / ::after），序列化为带 foreignObject 的 SVG data URL 并光栅化到离屏 2D Canvas，排除 overlay 与画布节点；默认样式探测使用空 ShadowRoot 配合 all: initial，不创建隐藏 iframe。
- 模糊金字塔：将 content 与 revealed 快照上传为带 mipmap 的 WebGL2 纹理，按降采样因子 round(sigmaPx / 5) 分别执行横向与纵向分离高斯模糊，生成近景模糊（sigma 7pt）与远景模糊（默认 18pt，center 为 10.8pt）两级纹理。
- 波浪前沿模型：单次总时长 total = anticipation + max(travel×0.6, linger + rimFade, linger + hairlineLinger + hairlineFade, particleLife)。vertical / horizontal 默认 anticipation 0.5s、travel 2.28s、linger -0.35s、rimFade 3.03s、returnSpeed 1.45、pull 24、inhale 56、amplitude 34、lensWidth 150、aberration 0.78、swell 22、blur 18、rimWidth 14、hairlineWidth 1.5、particleCount 64；center 默认 anticipation 0.25s、travel 3.43s、aberration 0、particleCount 89、amplitude 20.4、blur 10.8、palette green。前向传播曲线为 cubic-bezier(0.22, 1, 0.36, 1)，反向收起速率乘以 returnSpeed。
- 片元着色器：先按带椭圆压缩（squash 1.4，center 为 1）的胶囊/环形距离场与双正弦起伏计算前沿有符号距离 d；在前沿附近按高斯包络做沿法向折射偏移与向源点内吸，并以 5 通道光谱权重对偏移矢量采样产生色散；按前沿前后不对称高斯核在清晰/近模糊/远模糊三层间混合；用平滑带 coverZone=60pt 将 content 过渡到 revealed。
- 边缘光晕与粒子：五组预设色板（colorful 7 色、green 7 色、ocean 7 色、sunset 7 色、mono 7 色）在 CPU 转换到 OKLab 空间，在片元中沿前沿与卡片周长插值再转回 sRGB 并加 1/255 抖动去条带；沿着卡片圆角边界 SDF 计算 7 个随时间漂移的高斯厚薄团块，叠加边缘彩色光晕与 1.5pt 玻璃白光细线；独立点精灵着色器绘制前段汇聚与发射后向外飘散闪烁的白色微粒。

状态、无障碍与控制接口
- 点击主按钮在未揭示与已揭示间切换，动画中途再次点击立即反向平顺过渡，不产生闪烁或跳变；切换模式时重置状态并更新默认色板。
- 支持 options.type（"vertical" | "horizontal" | "center"）、options.palette（预设名或六位十六进制色值）、options.revealed、options.scrub（0–1 手动定格进度）、options.showControls、options.onRevealedChange、options.onFinish、options.height、options.reducedMotion。
- 不支持 WebGL2 或启用减少动态效果（系统偏好或 options.reducedMotion = true）时自动回退为 300ms 透明度交叉淡变，所有按钮、状态切换与键盘操作完整保留。卸载时取消 RAF 与计时器、断开 MutationObserver / ResizeObserver、移除监听器、调用 WEBGL_lose_context 释放显存并清理样式探测节点。`;
