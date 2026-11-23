export const ACCOUNT_BURN_PROMPT = `实现一个可独立运行的“长按燃烧转场”。这是本地动画演示，所有删除、恢复和登录均不调用网络或改变真实账号。没有图片、字体下载或服务依赖，DOM 文字必须始终可访问，不能把整个界面绘制成位图。

布局与外观
容器默认720×540，可填满父容器，独立页面填满视口；375px手机不横向溢出。白底，内容水平垂直居中。字体栈为 -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif。白屏内容向上4px，顶部小字“Keshav, @kshvbgde”13.5px，色#636366，行高1.35，下间距14px。标题“Delete your account?”，字重700，字号clamp(28px,4.4%容器宽,37px)，行高1.12，字距-.03em，色#0e0e10，下距12px。副标题“Your 412 links and 38 collections go with it.”，clamp(14px,1.8%容器宽,15.5px)，行高1.45，色#5c5c60，下距26px。按钮“Hold to delete”，黑色#111白字，至少174×45，左右padding28，9999px圆角，14.5px/500。hover仅变#1a1a1d，按住缩至.986，无hover上浮。

按钮有四层：普通白标签；渐变熔化冷却层；从左到右裁切的蓄力填充和深色重复标签；领先填充的12px发光火花。填充色标为#3b0400 0%、#6d0b00 22%、#b01d00 54%、#e84b00 78%、#ff9a14 91%、#ffe066 97%、#fffbe0 100%。clip-path inset(0 (1-p)*100% 0 0)，火花x=p*实际按钮宽-6px；用径向渐变从白黄到透明橙，超出按钮上下各6px。按钮外缘inset -2px，圆角相同，blur1.4px，线性渐变#b83b0a,#ff9924,#ffe699,#a468e6,#6d3da8。蓄力后半程外缘透明度增强：r=max(0,(p-.5)/.5)，发光随r²增长；p>.7时可加入小于.6px随机颤动。恢复完成后的冷却层渐变#6b1505,#b83c10,#e38c38，初始opacity .85，每秒衰减1.5。

目标屏为纯黑背景、居中登录表单，最大宽344px，两侧至少24px。标题“Sign in”，同上标题字号，下距10；副标题“Your account is gone.”，色#86868b，下距30。表单输入框placeholder“Email”，高度46，左右padding22，圆角pill，背景#18181a，白字14.5，白色7%边框，focus背景#202024、边框白24%；placeholder色#929297。Continue按钮同宽同高，白底黑字，hover #ececef，active缩至.988。反馈区域最小18px，12.5px，色#a1a1a6。下面“Restore my account”透明按钮，13.5px，色#a1a1a6，hover白色，focus可见下划线。邮件提交只显示本地反馈：空值“Enter your email address to continue.”；格式错误“Enter a valid email address.”；有效“Demo only. No sign-in request was sent.”。用textContent插入反馈，不拼接用户HTML。

分层与核心渲染
五层按z从1到5排列：白色删除DOM；透明2D burn canvas，承接离屏WebGL2底图；用真实CSS clip-path裁切的登录DOM；透明2D bloom canvas，承接前景HDR火焰；独立2D纸屑/火星canvas。画布均absolute inset0、pointer-events:none，不阻挡DOM。底层绘制黑洞，登录DOM背景可透明，透过其可见同一黑洞。不要用交叉淡入或整屏橙色遮罩取代纸张燃烧、流体烟和火焰。

WebGL2离屏context设置alpha true、antialias/depth/stencil false、premultipliedAlpha和preserveDrawingBuffer true。请求EXT_color_buffer_float、OES_texture_float_linear。画布分辨率为容器CSS尺寸乘min(devicePixelRatio,2)。模拟固定256×256，RGBA16F/HALF_FLOAT纹理，LINEAR采样、CLAMP_TO_EDGE。速度、染料和压力各有read/write双FBO，另有curl、div，HDR金字塔256²、128²、64²、32²。全屏三角形quad放VAO/VBO。每一可见运动帧的模拟dt限制.033s，动画时间单独使用实际可见经过时间，不能因低帧率延长2.2秒长按或4.7秒转场。

每帧依序：curl；外力与涡度约束；散度；14次Jacobi压力迭代并swap；压力梯度投影；速度反向半拉格朗日平流；染料平流及衰减；沿燃烧边注入热染料；HDR提取；四级Kawase模糊；HDR加权合成到前景；底图合成后blit到burn canvas。速度的curl为(dVy/dx-dVx/dy)，取邻域curl绝对值的梯度归一化，乘中心curl作旋转涡度力；另加上升浮力、噪声旋流以及以按钮为中心的径向扩张/回收力。压力Jacobi=(L+R+B+T-div)/4；速度减去压力梯度；平流采样uv-dt*velocity*texelSize。染料保留密度与热度，火焰颜色由暗红、橙、金黄至白热插值，低温烟雾灰黑，不把烟全部涂成橙色。燃烧环附近按多尺度噪声注入细薄的白热火线、橙色舌状火苗和漂浮烟气。HDR提取应按热度保留超1亮度，Kawase四角偏移采样，四级模糊叠回原始清晰火线，中心白黄、外围暖橙与少量紫红，而非单一宽高斯光晕。

纸张边缘与DOM裁切须共享同一确定性噪声：fract(sin(dot(p,(127.1,311.7)))*43758.5453123)作二维格点hash，双线性插值权重f*f*(3-2*f)。四层fbm初始权重.5，每层减半，坐标矩阵[1.94,-.49;.49,1.94]并加(11.3,7.1)。对于方向d=(cosθ,sinθ)、归一化半径R、时间t，n=d*1.45+(t*.035,-t*.055)，lobe=fbm(n*1.35+(2.1,1.3))，tear=fbm(n*3.9+(-t*.08,4.7))，jag=fbm(d*10.5+(5.2,-t*.12))；o=max(0,1-R*1.65)，基础边距R*length(d*(1+o*.36,1-o*.24))；扰动=((lobe-.5)*.22+(tear-.5)*.095+(jag-.5)*.034)*min(1,R*2.5)。最终边距为max(0,基础+扰动)。初始小孔略竖长，扩展后变为不规则纸边。shader底图要在边缘保留焦黑炭化带、细裂纹、发光边、烟雾与内部纯黑。DOM用96个θ均匀取样点构造polygon，距离减.008以掩住细缝，点位置为按钮中心+(dx*距离*容器高,-dy*距离*容器高)，与GL坐标Y翻转匹配；接近全覆盖时切clip none。几何原点必须是实例内的按钮中心，嵌在页面中滚动、改变宽高后仍对齐。

粒子单独Canvas2D，最多780个。包括大小约1.8–6px的焦纸屑、.7–2.5px的细火星、1–4px的灰烬。纸屑用随机5至8边的折断多边形，不是圆点；自身旋转、sin/cos翻滚使纵轴压缩，在空气旋流中缓缓上升。部分纸屑有中空轮廓和橙色燃烧描边，火星用白黄核心和径向发光。粒子沿同一个噪声环发射、向外漂散，暖色在生命周期前段褪去成炭灰，alpha平滑淡出。黑屏尾段逐渐清除灰烬，白色Continue按钮上方避免深色碎屑突兀遮挡。恢复先全屏发射灰烬向按钮中心聚拢，然后沿反向缩小的火环散落，尾部留按钮下方卷曲烟丝。需要层次丰富但不能不停生成无限粒子。

完整状态链
delete→burning→signin→restoring→delete。默认idle不运行永久RAF。按住鼠标主键、触屏或Space/Enter持续2.2秒，p按真实时间增长；提前放手/取消/失焦/Esc时停止蓄力，p每秒回落2.4，p> .65阶段少量火星领先填充。指针按住期间capture，忽略第二根手指，不让别的pointerup终止主指针。p达到1才点燃，停止holding，按钮在燃烧开始.12秒后隐藏。burning总时长4.7秒，R=(t/4.7)^1.75*最大角距离；最大角距离按宽高比与按钮位置计算四角的最远归一化距离再加.48。flare初值1，每秒下降1.25。中段从按钮向全屏扩张，登录文字与控件严格通过纸洞逐渐揭示；.04–.92进度发射纸屑和火星。完成后才能操作登录屏，尾灰约3.5秒衰减到干净纯黑。点击Restore开始4.7秒恢复；前1.25秒保持黑屏并聚拢粒子，之后q=(t-1.25)/3.45，R=(1-q^.88)*最大角距离，白屏从外向内恢复；q>.78按钮预热，结束后按钮熔红冷却并留烟。过渡期间两屏均inert，不接受重复触发。用户启动的过渡结束后聚焦目标输入/长按按钮，自动预览不能夺取宿主页焦点。

可访问性、API与生命周期
所有控件为原生button/input，隐藏屏同步inert和aria-hidden，错误输入aria-invalid，反馈role=status aria-live=polite；焦点清晰且对比足够。减少动态效果时保留持续长按门槛，用可取消计时器和静态填充反馈，达到阈值立即切换，无火焰、颤动或粒子。无WebGL2/浮点FBO时保留同一状态链、DOM和噪声纸洞裁切，用黑色目标屏替代GPU烟火；该降级不能冒充完整流体渲染。页面隐藏时取消当前长按，暂停所有帧，恢复可见后以新时间基准继续转场，不把后台时长补入动画。
提供options.height、reducedMotion、holdDuration(秒，默认2.2，最小.3)、state('delete'|'signin'，外部设置立即重置，不触发用户回调)、onStateChange(实际用户完成转场时传最终屏状态)。update应能换参数、更新回调和中止当前转场；宽高变化通过ResizeObserver更新画布及按钮几何，不用浏览器全屏尺寸替代组件尺寸。同页多个实例隔离DOM、样式和事件。destroy取消RAF、计时器、监听与观察器，逐一删除GL shader/program/texture/framebuffer/VAO/buffer，主动释放离屏context并把canvas尺寸设1，卸载重挂载无残留。

交付完整可运行文件和依赖说明，保留核心算法，使用所选框架原生生命周期挂载共享DOM/WebGL核心，不能用iframe冒充组件。验证长按未达阈值取消、键盘/触屏完整烧开和恢复、有效/无效邮箱本地反馈、降级、减少动态、外部state重置、多实例及卸载，375/768/1440不溢出。`;
