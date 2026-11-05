export const MULTI_CURSOR_BUILDER_PROMPT=String.raw`从零制作“多光标页面搭建”交互组件。它在一个独立的可滚动区域里演示12个彩色光标协作搭建作品集：开场围绕六边形标记旋转、向外散开、拉出白色页面，然后依次打字、改字体、画图片框、搬入图片、摆放统计卡片和标签、铺开贡献格。下滚继续搭建，上滚反向撤回。画面必须是可访问的真实DOM、真实图片、原生滚动及Canvas2D光标/选框，不能用视频、截图或iframe代替交互。

结构和视觉
默认宽1120、高760，height可改。根容器为position:relative的div，overflow:hidden、container-type:inline-size。内层滚动区域绝对定位inset:0、overflow:auto、overscroll-behavior:contain、scrollbar-gutter:stable、tabindex=0；内容、Canvas、居中开场标记、底部工具条各有独立层。不要锁定宿主body、修改history或滚动外层页面。同页多实例互不影响。
底色#e7e7e9，22px节距的#cfcfd3单像素点阵。页面白色，最大宽1160，外边距0 auto 140，内边距28px 72px 40px，轻阴影0 1px 2px黑色5%和0 8px 40px黑色5%。上方小字行距页面顶部56px，文字“Desktop”“Lei Shifu — Portfolio”“1160 × auto”，11.5px灰色。浅色预览将外围和滚动区域完整铺为#f4f4f4，页面仍白色。
字色#111214、次级#55585f、弱化#8b8e95，边线#ececee，强调紫#5b5ff0，选框蓝#0d99ff，辅助线红#f24822。正文字体Inter,-apple-system,"Segoe UI",system-ui,sans-serif；衬线Instrument Serif,Georgia,serif；等宽JetBrains Mono,ui-monospace,Menlo,monospace。无需外部字体也可运行，可将相应OFL字体内嵌并保留声明。Canvas标签使用600 11px无衬线，圆角4px、彩色底白字、高19px。

品牌标记
开场居中72×72的黑色圆角六边形镂空L。使用512×512 viewBox，路径为M212 59.403 A88 88 0 0 1 300 59.403 L404.258 119.597 A88 88 0 0 1 448.258 195.807 L448.258 316.193 A88 88 0 0 1 404.258 392.403 L300 452.597 A88 88 0 0 1 212 452.597 L107.742 392.403 A88 88 0 0 1 63.742 316.193 L63.742 195.807 A88 88 0 0 1 107.742 119.597 Z M247 273.618802154 L247 392.618802154 A27 27 0 0 0 287.5 416.001488056 L390.55702305 356.501488056 A27 27 0 0 0 363.55702305 309.736116252 L301 345.85343035 L301 273.618802154 A27 27 0 0 0 247 273.618802154 Z；fill-rule=evenodd。导航中使用同样符号配文字LeiBox，整体高32px，不把小符号拉伸成长字标。

完整导航字标的内嵌SVG如下，直接创建这些矢量路径而非依赖字体排字：
<svg width="603.900954" height="208" viewBox="0 0 603.900954 208" role="img" aria-label="LeiBox"><title>LeiBox — custom ei ligature</title><desc>Existing LeiBox symbol combined with custom vector lettering. All logo glyphs are outlines, independent of installed fonts.</desc><g fill="#111214"><g id="existing-symbol" transform="scale(0.499071) translate(-63.742 -47.613)"><path d="M212 59.403 A88 88 0 0 1 300 59.403 L404.258 119.597 A88 88 0 0 1 448.258 195.807 L448.258 316.193 A88 88 0 0 1 404.258 392.403 L300 452.597 A88 88 0 0 1 212 452.597 L107.742 392.403 A88 88 0 0 1 63.742 316.193 L63.742 195.807 A88 88 0 0 1 107.742 119.597 Z M247 273.618802154 L247 392.618802154 A27 27 0 0 0 287.5 416.001488056 L390.55702305 356.501488056 A27 27 0 0 0 363.55702305 309.736116252 L301 345.85343035 L301 273.618802154 A27 27 0 0 0 247 273.618802154 Z" fill-rule="evenodd"/></g><g id="custom-wordmark" transform="translate(235.900954 60)"><path id="letter-L" d="M0 8 A8 8 0 0 1 16 8 V77 A7 7 0 0 0 23 84 H48 A8 8 0 0 1 48 100 H23 A23 23 0 0 1 0 77 Z" fill-rule="evenodd"/><path id="e-bowl" d="M123.944409 85.395136 A38 38 0 1 1 129.032923 47.27946 A8 8 0 0 1 114.282219 53.477582 A22 22 0 1 0 111.336237 75.544552 A8 8 0 0 1 123.944409 85.395136 Z" fill-rule="evenodd"/><path id="ei-shared-stroke" d="M75.097844 82.27721 L152.097844 44.27721 A7 7 0 0 0 145.902156 31.72279 L68.902156 69.72279 A7 7 0 0 0 75.097844 82.27721 Z" fill-rule="evenodd"/><path id="i-body" d="M142 38 A7 7 0 0 1 156 38 V100 H142 Z" fill-rule="evenodd"/><path id="i-dot" d="M140 10 A10 10 0 1 1 160 10 A10 10 0 1 1 140 10 Z" fill-rule="evenodd"/><path id="letter-B" d="M0 0 H33 C52 0 62 10 62 25 C62 36 55 43 47 46 C60 49 64 57 64 71 C64 90 53 100 33 100 H0 Z M16 15 H32 C42 15 47 20 47 28 C47 36 42 40 32 40 H16 Z M16 54 H32 C44 54 51 58 51 70 C51 81 43 85 32 85 H16 Z" fill-rule="evenodd" transform="translate(168 0)"/><path id="letter-o" d="M236 62 A36 38 0 1 1 308 62 A36 38 0 1 1 236 62 Z M252 62 A20 22 0 1 1 292 62 A20 22 0 1 1 252 62 Z" fill-rule="evenodd"/><path id="letter-x" d="M304 24 L322 24 L336 48 L350 24 L368 24 L345 62 L368 100 L350 100 L336 76 L322 100 L304 100 L327 62 Z" fill-rule="evenodd"/></g></g></svg>


页面内容
导航高44px、左右分布品牌、Work/Experience/Stack/Contact锚点和浅绿“Available · Dec 2026”状态胶囊。每一项是独立搬运积木。
首屏padding-top76px。12px等宽小标题“Creative developer — Shanghai”；主标题“Building interfaces that feel physical.”，末词斜体紫色，82px/1.0衬线、400字重、字距-.025em、最大880px。18px/1.6说明“I design and engineer realtime 3D sites, launch films and small tools — the kind of work where the last two percent of motion is the whole point.”，最大600px。下面是黑底“See selected work →”及白底描边“Get in touch”按钮，高44px、圆角12px、间距12px，上间距30px。
首图上间距48px、高420px、圆角20px；下方四张统计卡片“7 yrs / building for the web”“40+ / shipped projects”“60 fps / or it isn't done”“1.2k / albums on the wall”，四列、间距16px、圆角16px、内边距20px 22px，数字40px衬线。
后续section上间距56px、顶部细线、padding64px 0 8px。依次是“01 — Selected work”“Things that move.”；两列项目网格，间距20px，四张卡片，每张缩略图高260px、圆角18px，下面有标题、序号和两行项目说明。标题分别可用Iridescent glass、Glass study、Concrete light、Curved terrace；编号01至04。
接着“02 — Experience”“Where I've been building.”和三条经历：Independent / Creative Developer / 2024 — now；Pantoria / Lead Motion Developer / 2022 — 2024；Freelance / 3D & Web Developer / 2019 — 2022。每行24px上下内边距、底线，列宽200px/1fr/130px、间距24px。
然后“03 — Stack”“Tools I reach for.”及13个标签：Three.js、WebGL / GLSL、TypeScript、React、GSAP、Blender、After Effects、FFmpeg、Node.js、Figma、Python、Playwright、Web Audio。标签高38px、圆角10px、左右15px、间距10px，前置9px彩色小方块。
再后是“04 — Activity”“Shipping, most days.”，53列×7行贡献格，格距4px、外padding22px、圆角16px，五色#ebedf0/#c6e9cf/#86d39b/#3fae66/#1f7a44。底部“1,284 contributions in the last year”和Less/More图例。
尾部“05 — Contact”“Let's build something that moves.”，末词斜体紫色、72px、居中，联系和返回顶部按钮；页脚“© 2026 Lei Shifu”“Designed & built in public, one cursor at a time.”。这是本地视觉演示的内容，可替换，不代表真实业务统计或服务。
五张图片均随产物内嵌：首图是暖灰色混凝土柱和极简展台；四张项目图依次是冷紫虹彩玻璃、蓝灰透明玻璃细节、斜射光下的混凝土墙面、奶油白弧形建筑露台。可按这些明确的材质、光线和构图生成或绘制新图；运行时不依赖远程素材或既有图片文件。

光标与开场时间线
7个工作光标依次为Lei/Ada/Kai/Momo/Ren/Yuki/Sol，颜色#0d99ff/#9747ff/#ff24bd/#14ae5c/#ffa629/#f24822/#00b5ce；另有Nova/Jin/Mia/Theo/Lina五个围观光标。光标用Canvas矢量绘制：箭头多边形顶点(0,0),(0,18.2),(5.1,13.4),(12.9,13.4)，彩色填充、1.4px白边；按下时scale .92；十字为原点处±9px两条正交线，先白色4px再深色1.6px描边；I形文本光标为y=-10至10的竖线和上下弯曲端帽，同样双描边。用小画布缓存各种颜色/工具/按压状态及姓名标签。
开场2.3秒：对第n个光标令g=n%6、j=floor(n/6)，角度a=g*1.047+t*(g奇数?1:-1)*(1.3+(g%3)*.15)，半径r=92+(g%3)*30+sin(t*1.7+g)*10。中心位置(cx+cos(a)*r*1.5,cy+sin(a)*r*.66)，沿切线再错开j*22px，光标旋转为切线角减1.25。透明度min(1,t*1.8)。接下来.6秒以1-(1-k)^3向外散开，距离260–500px，姓名逐渐显示；Logo .5秒缩到.5并淡出。
随后主光标先.35秒移动到白色页面左上，再.75秒用easeInOutCubic拉出页面遮罩和蓝色Desktop框。此后解除内层滚动锁定，显示工具条，进入搭建。skipIntro=true时直接进入搭建，不自动显示整页已完成状态。

搭建调度和连续回退
每个积木保存当前局部时间s、时长D、方向dir、执行者和已缓存的真实布局。滚动时，积木顶部小于视口高*.82则目标搭建；大于*.92则目标回退；中间区保持当前目标。已经越出视口上缘的积木直接完成；远在视口下方且无人操作的已搭积木复位。前一积木完成至少min(D,.2)秒后才开放后一积木；回退从下往上排队。
从空闲工作光标中选择离当前操作点最近的一个，先以easeInOutCubic飞过去，飞行时长clamp(距离/1500,.22,.55)秒，到位才推进局部时间。正向1倍，反向2.2倍，s限制在0至D；反向从当前s接续，不能重播一张截图。easeInOutCubic(t)=t<.5?4*t^3:1-(-2*t+2)^3/2。
普通文本：.45秒拉出文字框、.14秒回到插入点，然后逐字显示；D=.59+字符数/(字符数>60?110:46)。标题：.22秒后以34字符/秒打字，T1=.22+字符数/34；接着.38秒光标移到字体弹窗，.18秒点击，最后.55秒变成衬线目标字号；总D=T1+1.11。未输入部分用不可见span保留布局，标题预留最终高度，显示I形插入光标。字体弹窗232×78、圆角10px、白底、轻投影，含Text标签、字体名和字号框；点击前显示Inter/15，点击后显示Instrument Serif及82/52/72。
图片和项目卡片：.6秒从左上拉出矩形，.38秒移出取图，.8秒沿带30px正弦上拱的曲线把缩略图片搬回中心，1.78秒开始用.22秒渐入真实图片，1.9秒显示卡片说明，D=2.08秒。搬图在Canvas绘制真实图片，宽从150px变到目标宽一半，带轻投影和文件名标签。
搬运积木：.32秒移到侧方，随后.72秒搬回原位，左右偏移min(360,视口宽*.3)，垂直路径有14px正弦拱起。直接变换同一个DOM元素translate3d；结束清理临时transform/will-change。标签：.25秒开始，每项延后.15秒，每项.2秒用back缓动放大落下，back(t)=1+2.7*(t-1)^3+1.7*(t-1)^2。贡献格：.3秒起1.9秒从左上扫到右下，扫过的格子显现，当前矩形和已显示单元数同步。
执行中的积木绘制1px蓝色选框，四角7px白色蓝边控制点，11px类别名和17px高蓝底尺寸标签；结束后.8秒淡出。搬运将要吸附时显示红色竖向对齐线、相邻间距标记。点击波纹持续.45秒，半径3→17、透明度.7→0。
空闲工作光标缓慢跟随归一化home位置，并加50px/36px正弦漂移，跟随系数1-exp(-dt*1.4)。围观光标每2–4秒换一个工作光标，以80–160px偏移跟随；没有任务时按视口比例缓慢游动，不能突然传送。

坐标、性能和生命周期
所有坐标相对于组件根容器，来自getBoundingClientRect并保留小数：先减根容器left/top，再除宿主CSS缩放比例，最后加内层scrollTop/Left。搬运元素测量时扣除自己的translate；标签子元素缩放在批量测量时临时还原。批量完成布局写入后统一读取矩形；文字变化后只批量测一次插入点。滚动条槽位在开场锁定时也保留，避免居中页面在解锁后横移；解锁和尺寸变化触发重新测量。
Canvas只覆盖组件可视区，不覆盖整个宿主窗口；绘图矩阵按实际局部CSS宽高与画布像素宽高比例计算。根据显示缩放和DPR设置分辨率，最多约240万像素。工作时最多60fps、空闲漂移30fps；暂停、离屏、隐藏页面或销毁后取消RAF。使用逻辑时钟，恢复后不累计停留期间时间；speed范围.25–2。缓存光标和标签，DPR变化后清空相应缓存。禁止每帧读写整页布局或拦截滚轮做逐帧scrollTo。
滚动区域可键盘聚焦；原生方向键/PageUp/PageDown/Home/End滚动，空格或P暂停/继续，R重播并恢复播放。工具条包含工具状态、姓名头像、滚动百分比、Pause/Resume及Replay真按钮。锚点只滚动当前实例内部。触屏原生上下滑动，按钮可点。容器900px以下内边距改24px，主标题52px、联系标题48px，经历单列，导航链接隐藏；600px以下按钮组按可用宽度换行，工具条隐藏头像，保证Pause和Replay完整可见。
options.playing默认true；speed默认1；skipIntro默认false；showToolbar默认true；height默认760；reducedMotion覆盖系统偏好；onPhaseChange收到intro/burst/board/build；onReplay只在用户重播时触发。更新选项保留当前时间线，除skipIntro改变需要重启。减少动态效果立即显示完整页面、保留滚动和按钮、不启动RAF。用组件独立的字体名和引用计数注册字体，最后一实例卸载时移除；卸载还要断开所有ResizeObserver/IntersectionObserver和监听器。
交付React、Vue、Svelte、Solid、Preact、Vanilla原生入口，复用框架无关DOM/Canvas核心，提供四文件完整代码、真实依赖和使用示例。验证双实例不同位置、外层页面滚动、传统滚动条、不同DPR、375/768/1440、触屏、暂停、重播、连续回退、字体样式及卸载零残留。`;
