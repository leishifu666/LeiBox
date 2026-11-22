export const GENIE_MENU_PROMPT = String.raw`制作“吸附展开菜单”。白色圆形省略号按钮先拉出一段黏性液滴，液滴脱离时一张四项菜单从纵深中翻展出来，文字随整张卡一起变形，收起时迅速吸回圆钮。使用真实DOM、SVG滤镜和CSS 3D，完整保留展开470ms、收起175ms的不对称节奏，并支持0.3倍慢速观察和任意时刻反向。

舞台与画面
默认720×540，整体填满容器，字体-apple-system, BlinkMacSystemFont, SF Pro Text, Inter, Helvetica Neue, Arial, sans-serif。背景是一幅抽象油画，以赭石、灰褐、橄榄绿、暗橙和浅灰蓝为主，有柔和斑驳笔触，无人物与文字。自行绘制并内嵌这幅背景，运行时不请求远程资源，cover铺满、居中。玻璃外框从左下延伸进场景，left和bottom各为负边框厚度，top17.6%、right29.5%；宽度720以下变top12%、right8%。边框厚度clamp(12px,容器宽2.2%,22px)，右上圆角clamp(26px,容器宽4.2%,44px)，只在上、右留边。外框145度白色34%→浅米灰24%→浅灰褐28%渐变，blur22px saturate1.1，上和右1px灰褐22%描边、细内高光、0 20px 50px黑色14%投影。内纸面#fafafa，铺满，右上圆角同上，其余角随边缘裁切。

菜单锚点在纸面右上，top/right均clamp(22px,容器宽3.6%,44px)，宽310高320，pointer-events:none，perspective620px、perspective-origin50% 45%。圆钮48×48在锚点top0/right0，白色底由下层SVG圆绘制，透明原生button覆盖、可指针操作。初始黑色横向三圆点图标20×20，展开后变18×18的叉，实线1.9px、圆头。按住按钮scale.93，150ms缓动cubic-bezier(.22,1,.36,1)，可见焦点圈。

菜单卡top62/right0，248×218，内距11，圆角26，白色，1px黑色5.5%边框，transform-origin86% 100%，preserve-3d、backface-visibility:hidden，阴影0 18px 42px黑色8.5%加0 4px 12px黑色4%。卡内四个49px高原生按钮，依次Select notes、View gallery、Pin folder、Share folder；文字16.5px、400、字距-.012em、#1a1a1a，横向padding14px，图文gap13px。19–20px线性深灰图标分别是圈中勾、四格、图钉、三节点分享，生成时内联适合的开源图标并保留许可。悬停/聚焦高亮为#f5f5f5圆角14胶囊，宽100%高49，Y=行号×49，210ms位移、150ms透明度过渡。按住行scale.985。选中后纸面左下28/24px显示1600ms小胶囊提示，白92%、1px黑6%边、13px灰字，8×14内距，透明度和Y8→0分别220/240ms。右下18px放深褐色半透明速度胶囊，包含1×和0.3× Slow，选中项白92%底、深字，未选中项白78%字。

SVG液滴几何
SVG在锚点left/top-40px，390×400，viewBox=-40 -40 390 400，overflow:visible。按钮中心(286,24)，半径24，最上层23.5半径黑色5%细描边。液体本体与按钮同为纯白。两个复制的黑色轮廓生成阴影，一层SourceAlpha高斯12px、向下7px、透明度乘.095，另一层高斯4px、向下2px、透明度乘.06。黏连滤镜对同组的圆和液滴先GaussianBlur，再以alpha通道矩阵0 0 0 24 -10提高阈值，RGB不变；滤镜范围至少160%，保留空间。

设p为0到1的空间进度，S(a,b,x)=t*t*(3-2*t)，t=clamp((x-a)/(b-a),0,1)；L(a,b,t)=a+(b-a)*t；C(t)=1-(1-t)^3，Q(t)=1-(1-t)^4，I(t)在前半段4t^3、后半段1-(-2t+2)^3/2。p≤.004或p≥.36时清空液滴路径、移除黏连滤镜、按钮细描边透明度1。其余阶段dp=clamp(p/.34)，pull=I(dp)：
ty=L(22,64,S(.18,1,dp))，by=L(38,134,pull)，trx=L(299,304,pull)，brx=L(301,306,pull)，tlx=L(273,250,S(.15,1,dp))，blx=L(271,236,pull)，r=L(15,22,pull)。
由上左(tlx,ty)、上右(trx,ty)、下右(brx,by)、下左(blx,by)生成圆角梯形。实际角半径取min(r,上宽*.48,下宽*.48,高*.48)。左右斜边分别计算单位方向(lux,luy)和(rux,ruy)。路径从(tlx+r,ty)到(trx-r,ty)，用Q经过(trx,ty)到(trx+rux*r,ty+ruy*r)，沿右边到(brx-rux*r,by-ruy*r)，Q经过(brx,by)到(brx-r,by)，再沿底至(blx+r,by)，Q经过(blx,by)到(blx-lux*r,by-luy*r)，沿左边到(tlx+lux*r,ty+luy*r)，Q经过(tlx,ty)回起点并闭合。无有效宽高时返回空路径。
gooEnv=dp<.88?sin(clamp(dp/.88)*PI):0，高斯标准差gooEnv*7.8，大于.2时在液体和两份阴影的内组启用黏连滤镜，否则移除。液滴透明度1-S(.25,.35,p)，按钮细描边透明度1-gooEnv*.92。必须让液滴先与圆相连再变细脱离，再与三维卡交接。

三维展开与文字
p≤.20时菜单透明0，固定translate3d(10px,-145px,-110px) rotateX(48deg) scale(.24,.32)，行内容透明0、无交互。之后k=clamp((p-.22)/.78)，卡透明度S(.22,.31,p)，scaleX=L(.26,1,Q(k))，scaleY=L(.32,1,C(k))，rotateX=48*(1-S(.05,.96,k)^.92)度，rotateY=0。Z=L(-95,0,C(k))+16*sin(k*PI)*S(.2,.7,k)。Y=L(-146,0,Q(k))+4.5*sin(clamp((k-.25)/.75)*PI)*(1-k*.35)。X=L(6,0,C(k))。将translate3d、rotateX/Y、scale3d组合在同一个菜单元素上，文字也在这个元素内随之形变。
动态投影的floatBoost=sin(k*PI)，主阴影Y=L(12,18,k)+10*floatBoost，模糊=L(24,42,k)+16*floatBoost，alpha=L(.06,.085,k)+.025*floatBoost；第二层维持0 4px 12px黑4%。圆角L(34,26,S(0,.6,k))。展开内容可见度S(.42,.84,p)，收起内容可见度S(.70,.98,p)，透明度等于该值，模糊=(1-可见度)*11px，小于.08px时清除filter。p>.78且目标打开时才启用卡片输入并解除inert，其余阶段菜单仍绘制但不可聚焦或点击。
圆钮三点图标的出场进度d=S(0,.22,p)，透明度1-d、scale(1-.45*d)、blur2.4*d；叉图标进场e=S(.08,.34,p)，透明度e、rotate从-45°到0°按C(e)插值、scale .65→1，blur2.2*(1-e)。

时钟、中断与操作
展开空间进度p=Bezier(.28,.04,.14,1,u)，收起p=1-Bezier(.42,0,.22,1,u)，其中u为按470ms或175ms推进的时间进度，时长再除当前速度1或.3。Bezier应先用六次Newton迭代求横坐标参数，再求对应纵坐标，导数小于1e-6时停，最后夹在0–1。每帧时间差最多50ms。点击反向时保留当前p，对新的单调曲线二分14次求对应u，不能从头播放或切两张图。完成后吸附端点、停止RAF。速度按钮变更只改变后续时钟推进。
圆钮点击开关，菜单选中后收回并反馈操作名，点击场景空白或Esc收起。菜单打开时键盘焦点可进入首项，方向键循环，Home/End跳首尾，空格/Enter执行；Esc与选中后返回圆钮，Tab离开菜单后关闭且尊重原来的焦点去向。收起时菜单inert，配合aria-expanded、aria-haspopup=menu和四个menuitem。触屏点开、点选，避免依赖hover。鼠标高亮只在当前菜单实例内移动。
暴露options.open默认false，options.speed为1或.3，options.onAction(action)在用户执行项时调用一次，外部open更新不触发操作。options.height控制舞台高度，options.reducedMotion覆盖系统偏好，开启时直接呈现目标端点、禁用过渡，仍可完整选择和反馈。原生生命周期共享框架无关核心，多实例隔离样式、滤镜ID、状态和事件，销毁清理RAF与计时器。
验收470/175ms节奏、初期液滴颈部、中期透视俯仰、文字随卡翻展、快速反向、慢速切换、四项反馈、外部关闭、Esc与Tab、触屏、减少动态效果、多实例和卸载。在375/768/1440px检查菜单边缘、可见焦点和溢出。`;
