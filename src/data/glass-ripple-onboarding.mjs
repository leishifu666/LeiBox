export const GLASS_RIPPLE_ONBOARDING_PROMPT = `实现“同心玻璃波纹引导页”：白底画面中央是一张竖向圆角卡片，底图为厚涂松林山谷风景，画作会通过真实同心玻璃波纹持续折射。下半部有轻磨砂说明面板、中心九芒星旋转按钮和底部白色Get Started按钮。点击星芒或背景叠加一次短波包，点击Get Started打开三项目标选择；这是本地UI演示，不创建账号、保存财务数据或提供实际预算建议。

画作与容器
默认组件720×780，可填满父容器宽度并接收height参数；独立页面填满视口。白背景#fff，场景为flex水平垂直居中，左右16px，竖向padding clamp(12px,场景高*.03,32px)。卡片宽高比例219:460；高=min(场景高*.9,780,(场景宽-32)*460/219)，宽=高*219/460，不允许窄屏只压缩宽度而拉长画作。圆角clamp(28px,场景高*.052,42px)，overflow hidden、isolation isolate、背景#213022。阴影0 20px 55px rgba(15,24,18,.10)和0 4px 14px rgba(15,24,18,.06)。卡片是container-type:inline-size，后续cqw均相对卡片宽。
制作并内嵌一幅768×1376竖幅厚涂风景画，运行时无远程图片依赖。画面上半是米灰橄榄色天空，调色#c8c5a6、#b7b59b、#ded9b9，粗大不规则刮刀笔触与凸起油彩。右侧与下部大片深绿松林从右上约(97%,7%)、(77%,23%)、(58%,32%)逐层伸入，针叶树形由重复三角枝团和曲折厚涂块组成，色#142e23、#294b31、#456045，棕红细树干。左侧下半约y45%–65%为淡紫灰山峦#92939d与深灰绿远林；左下y61%与65%有两座小屋，陶粉色斜屋顶#b77867、浅灰墙。底部y72%以后是浓密绿草和黄花，黄花大小错落、笔触厚实，色#b99932、#d5b856、#e4cf78。可通过绘画工具生成，也可用固定种子Canvas多边形/短曲线笔刷绘制；最终嵌入完整图像数据，不能假定外部文件已存在。背景保留可辨认的松树、山、房屋和黄花，不换成纯色或抽象渐变。

分层与原生UI
卡片z1为铺满的canvas，z2为pointer-events none的底部暗角，z3为欢迎UI，z4为目标选择覆盖层。暗角为纵向渐变：0–56%透明，80% rgba(14,22,14,.18)，100% rgba(12,20,12,.34)。真实DOM文案和按钮保持清晰，不把整个界面预合成到背景纹理中。
全局字体为 -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif，字体平滑，无网络字体要求。欢迎说明面板left/right7.4%、top65.5%、bottom11.4%，圆角9.5cqw，背景rgba(24,34,24,.17)，边框白色8%，backdrop blur2.5px saturate1.04。面板内顶部padding15.5cqw、左右5.5cqw、底5cqw，文字居中、色白94%、字号3.92cqw、字重450、行高1.44、字距-.012em、text-shadow 0 1px 6px黑28%。文案严格分三行：“Take control of your finances with” / “budgets that fit your needs and help” / “you reach your goals faster.”，每行white-space nowrap。
星芒中心位于卡片(50%,65.5%)，圆形按钮宽高19.5cqw，translate(-50%,-50%)，背景白13%，backdrop blur2px。SVG占按钮66%，viewBox0 0 64 64；以(32,32)为中心，将一条从(32,7.5)至(32,21.5)的白色圆头线分别旋转0、40、80、120、160、200、240、280、320度，stroke-width4.2。星芒shadow 0 1px 4px黑25%。3秒无限循环：0–12%保持0°，12–66%平滑旋转至360°，66–100%休止；缓动cubic-bezier(.65,0,.35,1)。它是可聚焦的原生button，aria-label为“Trigger ripple pulse”。
主按钮容器left/right4.55%、bottom1.55%、height=max(7.95%,44px)。按钮满宽高、pill圆角、白底#fff、字色#181a18，字体继承、字号3.72cqw、字重600、字距-.01em，文案“Get Started”。阴影0 4px 16px黑18%，hover仅背景#f6f7f5和阴影0 6px 20px黑22%，active scale.975、背景#eceee9；过渡.18s cubic-bezier(.22,1,.36,1)，无hover上浮。

WebGL玻璃折射算法
使用WebGL1，context alpha false、antialias true、preserveDrawingBuffer true。canvas像素等于卡片实际CSS宽高乘min(devicePixelRatio,2)。全屏TRIANGLE_STRIP顶点[-1,-1,1,-1,-1,1,1,1]；v_uv=(a_pos.x*.5+.5,.5-a_pos.y*.5)，片元highp float。背景图作为TEXTURE_2D，CLAMP_TO_EDGE、LINEAR放大缩小，保留图片朝向，不额外翻Y。每个实例有独立纹理、程序和缓冲。
coverUV：canvasAspect=分辨率宽/高，imgAspect=图宽/高；若canvasAspect>imgAspect则scale.y=imgAspect/canvasAspect，否则scale.x=canvasAspect/imgAspect；返回(uv-.5)*(scale*.94)+.5，形成居中cover与轻微放大。
同心中心固定(.5,.655)，与DOM星芒完全重合。delta=(uv-center)*(aspect,1)，dist=length(delta)，dir=dist>.0001?delta/dist:(0,-1)，angle=atan(delta.y,delta.x)。wavelength=.158、period=2秒、speed=.158/2；organicWarp=.0045*sin(angle*3+time*.55)+.0025*cos(angle*5-time*.38)；warpedDist=dist+organicWarp*smoothstep(.05,.28,dist)；theta=(warpedDist-time*speed)/wavelength*2π。
非对称平滑波斜率waveSlope(theta)：skewed=theta+.44*sin(theta)，d1=cos(skewed)*(1+.44*cos(theta))，d2=.22*cos(2theta-.55)，返回d1+d2。包络env=smoothstep(.032,.11,dist)*exp(-dist*1.12)，slope=waveSlope(theta)*env，使星芒内部较平静、中段折射明显、天空区域自然变弱。不要以硬边圆环、位图缩放或CSS透明线圈冒充主要玻璃波纹。
点击追加波包：pulseAge=time-pulseStart，只在0–2.4秒作用；radius=pulseAge*.42，diff=dist-radius，packet=exp(-diff²*240)*(1-pulseAge/2.4)，slope+=sin(diff*52)*packet*1.45。点击位置不改变波心，始终由星芒向外扩散。
位移disp=dir*(slope*.030)/(aspect,1)。steepness=clamp(abs(slope),0,2)，blurStep=dir*(.0026*steepness)/(aspect,1)。分别对coverUV(uv-disp)、coverUV(uv-disp-blurStep)、coverUV(uv-disp+blurStep)采样，各UV夹到.002–.998；三次颜色按.56、.22、.22混合，只做轻微径向光学柔化，不能把画作模糊成不可辨认的色块。
法线N=normalize((-dir*slope*.52,1))，光方向L=normalize((-.22,-.55,.80))，视线V=(0,0,1)，半程向量H=normalize(L+V)。shading=1+(dot(N,L)-dot((0,0,1),L))*.14，颜色乘shading。镜面高光spec=max(dot(N,H),0)^52*.18*env；Fresnel=(1-max(dot(N,V),0))^3.8*.11*env；颜色加(.94,.96,.92)*(spec+Fresnel)，夹到0–1，alpha1。连续波纹应呈柔和有深度的玻璃透镜，保持油画原色，不出现粗硬高光线或浓烈彩虹边。

目标选择覆盖层
点击Get Started同时触发一次pulse，欢迎UI opacity降0、向上10px并缩至.98，过渡.42s cubic-bezier(.22,1,.36,1)。覆盖层absolute inset0、z4、flex底部对齐，padding上6cqw、左右4.8cqw、底4.5cqw，背景从顶部rgba(16,26,18,.10)渐到下方.52；初始opacity0、下移18px，打开后opacity1、位移0，过渡.38s同缓动。
目标卡圆角9cqw，背景rgba(24,32,26,.72)、blur18px saturate1.2、白16%边框、padding6.5cqw 5.5cqw 5.5cqw、阴影0 18px 40px黑28%。头部左右排列“Choose your focus”和关闭按钮，标题4.8cqw/600、字距-.02em；关闭圆钮至少44×44，白18%边框、白10%底、白色乘号、hover白22%，可访问名“Back to welcome”。副标题“Pick a starting budget goal to personalize your plan.”，3.5cqw、白76%、行高1.45、下距5cqw。
三个目标按顺序为“Monthly spending balance”“Build an emergency fund”“Save for a milestone”，内部值依次spending/emergency/milestone。默认spending。goal-list gap2.6cqw、下距5.5cqw；按钮padding3.6cqw 4.2cqw、至少高44px、圆角4.5cqw、白14%边框、白8%底、白字3.7cqw/500、左右排列文案与圆形勾选。hover底白15%；选中底白22%、边框白55%。右侧圆环4.6cqw、1.5px白45%描边；选中时白底、深色勾号。Continue按钮白底#fff、深字#181a18、pill、padding3.8cqw、3.9cqw/600、至少高44px，active scale.98。下方status上距3cqw、3.3cqw、色rgba(215,240,212,.92)、居中、最小高4.5cqw；提交显示“Ready: ”加当前目标名称。

交互、可访问性与API
欢迎层与选择层同步inert和aria-hidden，隐藏的按钮不能被Tab访问。打开后用户操作聚焦已选目标，关闭或Esc返回Get Started；自动缩略预览或外部参数更新不夺取宿主页焦点。目标组选用radiogroup，按钮role=radio、aria-checked，只有当前选项tabIndex0，其他-1；上下/左右方向键循环、Home/End跳到首尾，并聚焦所选项。选择控件只处理实例内部键盘事件，不做全页焦点陷阱；Tab仍能离开这个嵌入组件。勾号aria-hidden，status role=status aria-live=polite，所有按钮focus-visible使用白色2px轮廓及深绿外圈。
支持options.open、goal、paused，以及通用height/reducedMotion。onOpenChange(open)仅在用户打开/关闭时回调；onGoalChange(goal)仅在用户改变目标时回调；onContinue(goal)在用户提交时回调。外部更新open/goal不发出用户回调，不重建实例或重新解码画作。所有业务状态均在实例内，两个组件互不影响。

播放、降级、生命周期与交付
每帧按真实可见时间累加time，暂停、页面隐藏或系统减少动态时停止RAF；恢复时重设时间基准并从当前相位继续，不跳过后台时长。paused同时暂停星芒CSS动画；reducedMotion还取消星芒旋转、界面位移过渡和点击波包，保留静态画作/玻璃状态、选择和提交功能。图片实际解码、纹理上传与首帧绘制后才宣布ready，列表此前保留封面，不以空白canvas冒充已就绪。
无WebGL时使用Canvas2D的明确降级：居中cover绘图，波长=canvas高*.158，周期2秒，偏移=(time%2)/2*波长；从第5到0圈依次圆形clip并重绘，偶数圈cover放大1.035、奇数圈.975，以rgba(255,255,255,max(.04,.22-i*.035))、线宽max(1,canvas宽*.004)画细边；波心同(.5,.655)。它保留动态圈层与完整表单，但不宣称具有同样的Fresnel折射。
输出所选框架的原生生命周期入口、共享DOM/WebGL核心、完整内嵌画作、依赖和用法，不用iframe冒充组件。ResizeObserver更新卡片尺寸、canvas和波心，375/768/1440与改高后保持比例、按钮至少44px且无溢出。销毁停止RAF和CSS动画，断开监听与观察器、取消未完成图片回调，deleteShader/program/buffer/texture并释放context，canvas尺寸置1；延迟图片加载与失焦事件都不能重新绘制已卸载组件。验收持续波动、点击短波包、旋转周期、打开/关闭、三项键盘与触屏选择、回调、外部更新、暂停恢复、减动效、Canvas2D降级、多实例和快速卸载。`;
