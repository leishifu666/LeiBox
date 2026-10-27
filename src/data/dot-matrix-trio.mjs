export const DOT_MATRIX_TRIO_COPY = {
  "left": [
    "Browse interfaces",
    "Collect UI ideas",
    "Save handy pieces"
  ],
  "right": [
    "Watch animations",
    "Inspect the code",
    "Rebuild your own"
  ]
};

export const DOT_MATRIX_TRIO_BRAND_SVG = String.raw`<svg width="603.900954" height="208" viewBox="0 0 603.900954 208" role="img" aria-label="LeiBox"><g fill="currentColor"><g transform="scale(0.499071) translate(-63.742 -47.613)"><path d="M212 59.403 A88 88 0 0 1 300 59.403 L404.258 119.597 A88 88 0 0 1 448.258 195.807 L448.258 316.193 A88 88 0 0 1 404.258 392.403 L300 452.597 A88 88 0 0 1 212 452.597 L107.742 392.403 A88 88 0 0 1 63.742 316.193 L63.742 195.807 A88 88 0 0 1 107.742 119.597 Z M247 273.618802154 L247 392.618802154 A27 27 0 0 0 287.5 416.001488056 L390.55702305 356.501488056 A27 27 0 0 0 363.55702305 309.736116252 L301 345.85343035 L301 273.618802154 A27 27 0 0 0 247 273.618802154 Z" fill-rule="evenodd"/></g><g transform="translate(235.900954 60)"><path d="M0 8 A8 8 0 0 1 16 8 V77 A7 7 0 0 0 23 84 H48 A8 8 0 0 1 48 100 H23 A23 23 0 0 1 0 77 Z" fill-rule="evenodd"/><path d="M123.944409 85.395136 A38 38 0 1 1 129.032923 47.27946 A8 8 0 0 1 114.282219 53.477582 A22 22 0 1 0 111.336237 75.544552 A8 8 0 0 1 123.944409 85.395136 Z" fill-rule="evenodd"/><path d="M75.097844 82.27721 L152.097844 44.27721 A7 7 0 0 0 145.902156 31.72279 L68.902156 69.72279 A7 7 0 0 0 75.097844 82.27721 Z" fill-rule="evenodd"/><path d="M142 38 A7 7 0 0 1 156 38 V100 H142 Z" fill-rule="evenodd"/><path d="M140 10 A10 10 0 1 1 160 10 A10 10 0 1 1 140 10 Z" fill-rule="evenodd"/><path d="M0 0 H33 C52 0 62 10 62 25 C62 36 55 43 47 46 C60 49 64 57 64 71 C64 90 53 100 33 100 H0 Z M16 15 H32 C42 15 47 20 47 28 C47 36 42 40 32 40 H16 Z M16 54 H32 C44 54 51 58 51 70 C51 81 43 85 32 85 H16 Z" fill-rule="evenodd" transform="translate(168 0)"/><path d="M236 62 A36 38 0 1 1 308 62 A36 38 0 1 1 236 62 Z M252 62 A20 22 0 1 1 292 62 A20 22 0 1 1 252 62 Z" fill-rule="evenodd"/><path d="M304 24 L322 24 L336 48 L350 24 L368 24 L345 62 L368 100 L350 100 L336 76 L322 100 L304 100 L327 62 Z" fill-rule="evenodd"/></g></g></svg>`;

export const DOT_MATRIX_TRIO_PROMPT = String.raw`从零制作 Dot Matrix Ripple and Spiral（点阵波纹与旋涡）组件。以三个实时Canvas点阵、卡片印刷排版和固定蓝紫到薄荷色背景组成完整三联画。不能使用视频、图片、iframe或预渲染关键帧。参数是独立重建值，并非原作者算法。

布局与颜色
默认设计坐标960×540，容器position:relative、overflow:hidden、isolation:isolate、高540px。内部固定960×540舞台居中，缩放为min(容器宽/960,容器高/540)。大屏居中，小屏保持三联并排和全部画面，不横向溢出。375、768、1440px下均保留同一构图。场景背景为linear-gradient(100deg,#ffffff0c,#ffffff00)叠加linear-gradient(180deg,#5152c8 0%,#6386c7 30%,#79cdd0 68%,#a7f1da 100%)，固定不随动画移动。
三张矩形卡片宽213、高341、y=98.5，x依次125、369.5、614，间距31.5。没有圆角或阴影。卡片上部Canvas为213×213，下部白色信息区213×128；前两张Canvas背景#050505，内部x8,y12,w197,h191填#000。右卡整体背景#fdfdfd。
字体栈Arial,Helvetica,"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif；button继承字体。左卡英文正文恰好三行“${DOT_MATRIX_TRIO_COPY.left.join(" / ")}”，右卡英文正文恰好三行“${DOT_MATRIX_TRIO_COPY.right.join(" / ")}”，斜杠只表示换行，不作为页面文案。正文黑色、字重600、16.8px、行高17.2px、字距-.65px，位置为信息区左18.5、上61。左右信息区左18.5、上18.5放完整LeiBox矢量标志，宽49.36、高17，保留定制ei连笔，不能用普通字体替代。中卡不放正文，仅在左18.5、下17放LeiBox定制字标矢量，宽176、高47.83，viewBox为0 0 368 100。完整Logo如下：${DOT_MATRIX_TRIO_BRAND_SVG}。中间字标取其中translate(235.900954 60)分组里的全部路径，去掉该分组的平移，保留B字形路径自身的translate(168 0)。三个信息区右上都有6×6细黑角标，距右和上18.5；左右卡右下也有角标，中卡左上有角标。角标只画相邻两边，线宽.5。

图形与点阵
每块Canvas采用min(devicePixelRatio,2)像素比，逻辑坐标213×213。20行×20列，点中心(x,y)=(20+列×173/19,20+行×173/19)，圆点半径3.35。中心为(106.5,106.5)，r=hypot(x-106.5,y-106.5)，θ=atan2(y-106.5,x-106.5)。前两块移除行8至11且列8至11的16个点。第三块移除行9至10且列9至10的4个点。
三块Canvas中心均放同一个LeiBox六边形L形镂空标志，使用上述完整Logo的第一个path，按evenodd填充，不描边。Path2D直接使用原始512坐标系路径；绘制时先translate(106.5,106.5)，scale(18/416.774,18/416.774)，再translate(-256,-256)，以18px高居中放置。前两块标志为#fdfdfd，右块为#050505；L形内孔透出Canvas背景。标志始终固定，不随点阵旋转或变色。

运动公式与同步
三块共享累计有效播放秒数t，初始t=0。使用一个requestAnimationFrame循环，dt=min((now-last)/1000,.05)，离屏、隐藏和暂停期间不累积t，恢复时清空last，避免时间跳跃。各帧直接在原Canvas更新点的颜色或有无，不新建DOM圆点。
左卡为双色同心波：sin(r×.074+1.37-t×π/2)>0时点为#dfff8f，否则#31afe9。波从中心连续向外扩散，点的位置和尺寸固定。
中卡为八臂旋涡：sin(θ×8+r×.156+4.97-t×4)≥.25时绘制#dfff8f圆点，否则不画。曲臂连续旋转，点仍锁在规则网格，不把整个Canvas机械旋转。
右卡为两秒周期的扩张圆盘：phase=(t+2-1/30)%2，半径R=76×phase，r≤R绘制#e4ff8e，其他点不绘制。每周期末圆盘扩张充满网格，下一周期清除后再次从中心长出，保持约两秒节奏，不做透明度呼吸。四角各保留3颗黑点：列≤1或≥18且行≤1或≥18，但排除内角(1,1)、(18,1)、(1,18)、(18,18)。这些黑色定位点始终显示，不随圆盘消失。

交互与生命周期
三张卡片均为原生button，aria-label分别描述Ripple、Spiral、Pulse及暂停/继续，aria-pressed同步。点击、触屏轻触、Enter或Space切换三块整体暂停/继续；暂停保持当前位图，在每张卡片右上12px处显示24px白底圆形Ⅱ标记。重复点击恢复当前相位。hover只显示鼠标手势，不改变点阵算法或速度。键盘focus-visible使用3px黑色轮廓、7px偏移。
Home或Escape重置t=0并恢复播放；左右方向键暂停并单步±1/30秒，t不得小于0。屏幕阅读器的隐藏status播报暂停、播放、重置和单步反馈。动画期间不逐帧播报。
prefers-reduced-motion为reduce或reducedMotion选项为true时绘制静态帧且停止RAF；系统/选项恢复后允许从当前相位继续。用户仍可用方向键单步。IntersectionObserver检测离屏并暂停，visibilitychange处理页面隐藏。ResizeObserver更新舞台缩放、DPR和Canvas。仅在挂载后访问DOM，所有查询局限于当前实例，可使用ShadowRoot隔离样式和选择器。销毁时清除RAF、媒体监听、事件监听、ResizeObserver、IntersectionObserver和MutationObserver，并释放Canvas缓冲区；重新挂载恢复初始帧。不得给宿主body附加样式、全局ID、定时任务或状态。

交付与验收
提供当前框架的完整入口、框架无关核心、类型声明与生命周期实现，使用原生挂载/更新/卸载API；不要求调用外部服务，不需要运行时依赖、图片或字体。height选项改变实例高度，reducedMotion选项覆盖系统偏好。鼠标点击与键盘操作均走同一状态机，多实例互不干扰。验证三块在多个时刻均真实变化、暂停后位图与时间固定、恢复连续、重置和单步有效、离屏/隐藏/卸载无残留任务；375/768/1440无溢出，原生焦点可见，减少动态效果只显示静帧。完整说明安装、导入、使用和销毁方式，不省略文件实现。`;
