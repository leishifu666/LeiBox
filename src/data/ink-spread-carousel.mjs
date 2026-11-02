import {INK_VERTEX,INK_FRAGMENT} from '../lib/motion-core/ink-spread-shaders.mjs';

export const INK_SLIDES=[
 {alt:'Black yaks and a distant red-hooded figure on an emerald hillside',rect:[0,0,.5,.5]},
 {alt:'White horses below a snowy peak and green alpine slopes',rect:[.5,0,.5,.5]},
 {alt:'A platinum-haired portrait with green face paint and leafy shadows',rect:[0,.5,.5,.5]},
 {alt:'Red-cloaked walkers ascending a green mountainside',rect:[.5,.5,.5,.5]},
];

export const INK_SPREAD_CAROUSEL_PROMPT=`从零创建可直接运行的“墨水扩散图片轮播”。白色圆角竖卡片置于浅灰背景，每次点击图片或左右按钮，下一张照片从实际落点向外晕开。不规则的液态边界有一条很薄的透镜折射带；图片保持静止，不横移，不整张交叉淡入。所有数据与交互在本地，不需要服务器。

布局与图片
- 标准场景 940×876px，背景 #eaeaea；卡片在水平和垂直正中，453.333×586.667px，白色边框 13.333px，外圆角40px、内圆角26px，内部图片约426.667×560px。场景整体按可用宽度等比缩小，不横向溢出，height参数可改变场景高度。列表缩略图把场景背景切为#f4f4f4。
- 左右两个白色实心圆按钮叠在照片垂直中线，64×64px，分别距内边缘20px；按钮透明伪元素向四边各扩4px，形成72×72px实际点击区，使375px视口的热区仍至少24px。黑色左右chevron线条图标30px、2.5px圆头笔画，使用Lucide开源图标库。悬停背景#ededed、按下#dedede，只改颜色，不上浮。焦点显示3px深色外轮廓与白色间隙。
- 卡片后方有两层相同图片的柔焦影子，矩形外扩到右侧，模糊38px，圆角44px，整体向右44px、向下8px，缩放.94，最终不透明度.18。旧影子与新影子随扩散进度互换颜色。其他界面文字只保留读屏说明和加载失败时的简短消息。
- 在本次产物中制作并内嵌一张2×2照片图集，不请求网络素材。四个象限均为竖向3:4画面，无间隙、边框或文字：①翡翠绿山坡、远处黑衣红兜帽小人、前景两头黑色长毛牦牛；②雪白尖峰、深蓝绿天空、斜向绿坡上吃草的白马；③铂金短发成年人的近景，眼周与鼻梁绿色舞台彩绘、黑色背心、叶影；④红斗篷行人沿绿坡向上攀登、远处雪峰与淡紫天空。整体为柔和光影的超现实摄影风格。可通过Canvas程序绘制独立风景图集作为无素材环境的替代，但不能依赖外部图片才运行。
- 图集四个UV矩形按顺序为${JSON.stringify(INK_SLIDES.map(s=>s.rect))}，格式是左上角x/y与宽/高。每次取样限制到各象限内部，避免图集边缘串色。允许images参数传入2–12张字符串或{src,alt}对象，解码全部成功后才替换；跨域图片要求CORS。加载失败保留已可用照片，显示“Could not load these images. The previous photos are still available.”并提供读屏反馈。

完整着色器与驱动
- WebGL1 Canvas覆盖内卡片，DPR上限2。四张默认图共用一张texture，min/mag过滤LINEAR，wrap为CLAMP_TO_EDGE，不开mipmap。顶点全屏两三角形。
- 顶点着色器完整内容：\n${INK_VERTEX}\n
- 片元着色器完整内容：\n${INK_FRAGMENT}\n
- v_uv来自全屏顶点，片元中转成左上角为0的图像坐标；u_origin是点击相对图片的位置，限制0–1。u_aspect为内卡片宽高比。u_fromRect、u_toRect含图集坐标；普通图片使用[0,0,1,1]。每轮改变u_seed，默认roughness=.6。
- 动画默认900ms；累计可见时间t，p=1-(1-clamp(t/duration,0,1))^1.7。每帧更新u_progress、两层影子opacity、data-progress；结束时p精确为1，交换当前图与目标图，宣布照片序号及替代文本，停止RAF。静止时不持续绘图。
- 快速切换时，先把当前帧通过copyTexImage2D保存为独立快照纹理，作为新动画的起点，下一目标从上一次已请求序号继续循环计算。快照坐标为[0,1,1,-1]以校正帧缓冲的Y方向。保留同一个Canvas与按钮节点，不闪回旧图，不排队播放过时动画；最后一次操作决定最终图。
- 无WebGL时用Canvas2D绘制同样的照片与由128点极坐标路径形成的噪声扩散遮罩，不能只做淡入。轮廓半径在4%、7%、13%不同频率的sin/cos起伏，并随进度变化；中断时保留当前2D画布快照。WebGL上下文丢失时停止扩散并显示已解码的当前图，恢复后重建程序和纹理。

操作与生命周期
- 初始第一张。点击照片从真实点击位置切换下一张；左右按钮分别循环上一张/下一张，源点是各按钮实际中心或点击点在内卡片的坐标。四张图片环绕循环。图片点击区与按钮为三个平级原生button，禁止嵌套按钮。
- 键盘Left/Right切换；Home选择第一张、End选择最后一张；Enter或Space使用原生button语义。键盘源点左侧为(.12,.5)、右侧为(.88,.5)，图片按钮的键盘源点是中心。触屏轻点真实可用；不触发页面跳动。
- API：index初始/更新序号；duration默认900，限制250–2400ms；roughness默认.6，限制0–1；images可替换图源；onIndexChange在用户触发的最后一次切换完成时调用一次，传序号。外部index更新不触发此回调。height改变场景高度，reducedMotion覆盖系统偏好。
- 暂停离屏与页面隐藏的动画，恢复可见后从同一进度继续，不能在后台跑完。减少动态效果直接切到目标图并同步全部状态；偏好在动画途中改变也立即生效。
- 所有DOM、样式、状态和GL资源限定实例；销毁时取消RAF、解除输入/媒体/可见性监听与观察器、删除纹理/缓存/缓冲/程序及shader、释放WebGL上下文。异步图片解码完成后不得操作已销毁实例或覆盖较新的图源请求。
- 验收：点击图片的左上/右下与左右按钮，实际扩散中心必须不同；录制早中晚三帧能看到边界移动，原图未被揭开区域保持原色；快速切换不闪回、最终序号正确；触屏、键盘、图片加载失败、WebGL关闭/丢失/恢复、减少动态效果、离屏恢复、多实例、更新、挂载卸载重挂载均可用。375/768/1440无溢出、焦点可见。`;
