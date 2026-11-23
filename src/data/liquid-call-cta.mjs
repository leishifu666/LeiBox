export const LIQUID_CALL_CTA_PROMPT = `实现“液态预约按钮”：白色画面中央横排一枚写着“Book a call”的深色胶囊按钮，右侧为四瓣凹面星形和细线X两个圆形按钮。主按钮受指针吸引，边缘形成连续液态颈，拉远后断开一颗独立液滴，主体带弹性回缩。悬停时出现低饱和虹彩网状渐变、跟随高光和宽而柔和的彩色外晕。三个按钮均是本地演示动作，不预设实际预约日历、页面跳转或社交账号；通过回调让接入方决定业务行为。

布局与字体
默认容器720×540，可随父容器宽度和height参数变化；独立页面填满视口。背景#fff，无标题、说明卡片或额外装饰。字体Inter，制作时可内嵌合法字体及许可；运行不访问远程字体。完整回退栈为 -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif。
基础横排宽579px，三个控件尺寸分别287×99、99×99、99×99，两个间隙均47px，整行保持这些比例，不允许flex分别压缩按钮。横排水平垂直居中，以中心为缩放原点；scale=max(0,min(1,(容器宽-64)/579,(容器高-64)/219))。只对整行缩放，指针坐标计算须除以实际缩放率。375px页面中可用宽度约311px，圆形按钮仍约53px，不能横向溢出。
主按钮无DOM背景，实际胶囊由透明canvas绘制，圆角半径49.5px。按钮文字单独使用Arial, Helvetica, sans-serif，保留原生按钮字形；提示信息使用Inter。文字为白色34px/500、字距-.014em、行高1，位于canvas之上、pointer-events none。默认文字“Book a call”，可用label参数修改，并同步可访问名称；超长文案在按钮内部省略，不撑破布局。按下文字缩至.972，transform过渡.24s cubic-bezier(.22,1,.36,1)。键盘focus-visible在按钮外6px画2px圆角描边，色rgba(112,82,132,.55)。
canvas的逻辑尺寸607×419，来自胶囊四侧各160px溢出；左上为按钮左上(-160,-160)，pointer-events none。实际像素乘min(devicePixelRatio,2)，CSS尺寸保持逻辑尺寸。父场景负责裁切容器之外的极淡光晕，不能按按钮边界裁掉细颈或液滴。
两个圆钮白底、1.75px边框#e5e5e5、图标色#111。hover缩放1.07、背景#f4f4f4、边框#bcbcbc，无上浮；active缩至.965、.14s。hover transform过渡.34s cubic-bezier(.22,1,.36,1)，背景与边框.22s；focus-visible边框#666并加0 0 0 3px rgba(42,40,41,.14)。禁用时三个按钮均为原生disabled，opacity .5，取消hover变形与所有动作。

图标构造
星形使用44×44 viewBox，四片分离的实心黑色凹面三角，路径分别为：M20.1 2.2 C19.5 11.8 11.8 19.5 2.2 20.1 L20.1 20.1 Z；M23.9 2.2 C24.5 11.8 32.2 19.5 41.8 20.1 L23.9 20.1 Z；M20.1 41.8 C19.5 32.2 11.8 24.5 2.2 23.9 L20.1 23.9 Z；M23.9 41.8 C24.5 32.2 32.2 24.5 41.8 23.9 L23.9 23.9 Z。中心保持十字形白缝，不能换成常见五角星。
X图标显示35×35，viewBox 0 0 36 36；空心斜杠路径M4.6 3.5 H12.4 L31.4 32.5 H23.6 Z，stroke-width2.1，fill none，miter join；另一斜向细线分两段M30.2 3.5 L19.6 15.8 M16.4 19.5 L5.4 32.5，stroke-width2.15、square cap。按钮可访问名分别为“Explore highlights”和“Visit X profile”，SVG aria-hidden。

SDF液态形状与输出
使用WebGL1全屏quad，不使用图片遮罩或两张静态图淡变模拟液态。context alpha true、antialias true、premultipliedAlpha true。顶点坐标[-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]，vUv=aPos*.5+.5。片元highp float，逻辑坐标p=(vUv-.5)*(607,419)，p.y取反。
胶囊半尺寸half=(143.5,49.5)*pressScale，r=half.y，q=abs(p)-(half.x-r,0)，dPill=length(max(q,0))+min(max(q.x,q.y),0)-r。指针液球dBlob=length(p-blobPos)-blobRadius。多项式smooth minimum：h=clamp(.5+.5*(b-a)/max(k,.0001),0,1)，smin(a,b,k)=mix(b,a,h)-k*h*(1-h)。blobRadius>.25时用smoothK合并液球与胶囊。独立液滴dDrop=length(p-dropPos)-dropRadius，dropRadius>.2时再以k=5.5合并，足够远时自然分离。抗锯齿宽1.05逻辑像素，shapeAlpha=1-smoothstep(-.525,.525,d)。默认色RGB(.165,.157,.161)，近似#2a2829。
颜色、独立液滴、边缘透明度和外晕必须根据同一个最终距离d合成，不用单纯box-shadow。输出预乘色outPremul=fillCol*shapeAlpha+glowCol*glowAlpha，outAlpha=shapeAlpha+glowAlpha；透明区域保持干净。

虹彩与光晕的精确配色
nx=clamp((p.x+143.5)/287,0,1)，ny=clamp((p.y+49.5)/99,0,1)。四个基础RGB为taupe(.518,.460,.428)、rose(.560,.325,.440)、plum(.425,.295,.490)、slate(.340,.402,.498)。drift=sin(time*.6)*.03；先以smoothstep(.04,.44+drift,nx)混合taupe→rose，再以smoothstep(.36,.67-drift,nx)混至plum，再以smoothstep(.58,.95,nx)混至slate。
upperBerry=exp(-((nx-.46)/.28)^2-((ny-.18)/.45)^2)，以upperBerry*.32混入(.515,.290,.435)。distLight=length(p-lightPos)，warmCore=exp(-distLight²/86²)，以warmCore*.74混入香槟桃色(.805,.680,.585)。blushRing=exp(-(distLight-46)²/54²)，以blushRing*.22*(1-nx*.4)混入(.655,.410,.505)。innerRim=smoothstep(-22,-.5,d)*shapeAlpha，虹彩增加(.036,.028,.040)*innerRim。最后由hoverMix把默认深灰混向虹彩。
外晕从左粉RGB(1,.74,.85)向中薰衣草(.84,.75,.97)在nx .10–.55平滑过渡，再在.50–.94过渡到蓝(.75,.81,.99)。outerDist=max(d,0)，strength=exp(-outerDist²/40²)*.38+exp(-outerDist²/88²)*.16，glowAlpha=strength*hoverMix*(1-shapeAlpha)。加入极细屏幕抖动消除色带：p3=fract(vec3(pixel.x,pixel.y,pixel.x)*.1031)，p3+=dot(p3,p3.yzx+33.33)，hash=fract((p3.x+p3.y)*p3.z)，alpha+=((hash-.5)/255)*hoverMix并限制≥0。不要增加明显颗粒纹理。

输入、吸附和断开状态
用实际主按钮getBoundingClientRect求中心与rect.width/287缩放率，把client坐标变换为胶囊中心逻辑坐标lx,ly。使用未缩放按压的sdPill求指针距离d。仅在实例区域内监听悬停；按住后可以通过指针捕获继续跟踪到区域外，同页多个实例不能互相吸附。
初始engaged=false，blobRadius0、hoverMix0、dropRadius0、pressScale1。距离d<22时吸附。如果当前blobRadius<2，把液球起点投到胶囊内部：cx=clamp(x,-94,94)，v=(x-cx,y)，最大半径49.5*.55；若length(v)超该半径则缩回该长度，保留cx偏移。清空XY速度。
吸附时targetPos=(lx,ly)。若d≤0，targetRadius39、targetK48、targetHover1；否则t=min(d/86,1)，targetRadius=37-24t，targetK=46-18t；d<56时targetHover1，再远则max(.25,1-(d-56)/38)。所以表面先鼓起，再拉出越来越细的颈，不是一颗等大圆球硬跟随。
已吸附且d>86时断开：engaged=false，在当前blob位置生成独立滴，初速度为blob速度*.12，初半径clamp(blobRadius*.62,7.5,11.5)；主blob目标投回最近胶囊内部，targetRadius0、targetK28、hover目标为焦点高光.55或0。指针快速返回d<22可从当前形状重新吸附，不先瞬间清空动画。移出实例或取消指针时主体回缩；鼠标按压scale目标.968，松开、取消、失焦恢复1。只接受主指针和主键，其他手指不能取消当前输入。触屏轻点/移动及原生按钮点击都可操作，pointercancel不能触发动作。

弹簧积分与时间
每帧dt=clamp((now-lastTime)/1000,0,.04)，lastTime单调不下降；唤醒或从后台恢复时重设时基，不能把后台时间补入物理。对XY位置使用半隐式积分：v+=((target-pos)*k-v*c)*dt，pos+=v*dt。吸附k240/c22，回缩k280/c17，保留适量欠阻尼弹性。半径同式，吸附k210/c23、回缩k260/c20，并限制半径≥0。smoothK指数平滑rate14。独立滴位置+=速度*dt，速度乘exp(-10dt)，半径乘exp(-16dt)，小于.25清零。
高光只在engaged时以1-exp(-9.5dt)跟随blob位置，初值(-30,10)，形成略落后的光学深度。hoverMix升高rate4.6、回落rate6.4，以1-exp(-rate*dt)插值。pressScale以rate24平滑到按压目标。保持悬停/焦点时渐变有细微漂移；回缩、光晕和液滴完全收敛后停止RAF，初始深色静态状态不运行永久循环。

操作反馈与接入API
三个原生button按Tab顺序可达，Enter/Space触发本地反馈。底部28px居中的深色pill toast，白色13px/500、字距-.01em、padding9px 16px、圆角9999、shadow 0 8px 24px rgba(0,0,0,.12)，初始opacity0且下移14px，出现opacity1、位移0，过渡.24/.28s，2秒后关闭；快速重复点击重置同一计时器。role=status、aria-live=polite，只有点击后显示。消息依次为“Call booking selected (demo)”“Highlights selected (demo)”“X profile selected (demo)”。onAction(action)分别传book、highlights、profile，不能替用户打开预约或社交页面。
支持options.label、disabled、onAction以及通用height/reducedMotion。参数更新不能重新挂载整个组件，独立实例的label、禁用状态、液态参数、toast、回调和字体租约都要隔离。

减动效、降级与交付
遵循系统或显式reducedMotion：保留原生focus轮廓和静态虹彩反馈，不拉伸、甩滴、抖动、持续漂移或循环RAF；指针和键盘仍可触发三个动作。禁用时取消输入和动画反馈。页面隐藏、窗口失焦、pointercancel都释放按压与指针捕获，不能出现卡住的缩小状态。
无WebGL时使用Canvas2D绘制同尺寸圆角胶囊，hover使用#8d6d68→#7c4d6e→#58657c三段渐变和36px紫色柔光，默认#2a2829，保留按钮、焦点与回调；这是静态轮廓降级，不宣称存在完整SDF细颈或独立滴。
提供框架无关DOM/WebGL核心和所选框架原生生命周期入口，完整内嵌字体许可、依赖和使用示例，不用iframe冒充组件。字体与canvas首帧真实完成后再宣布ready。destroy取消RAF、toast计时器、监听及ResizeObserver，删除shader/program/buffer，释放WebGL context，把canvas尺寸设1；移除有焦点的按钮或字体异步完成后都不能重新绘制已释放的上下文。验收多个边缘方向、内部移动、86px外断开、快速回返、按压取消、键盘、触屏、减动效、无WebGL、多实例、改高和卸载，375/768/1440页面与列表标题保持对齐，复制出的代码包可直接编译使用。`;
