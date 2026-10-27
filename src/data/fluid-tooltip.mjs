export const FLUID_TOOLTIP_ITEMS=[
 {id:'today',label:'Today',shortcut:'⌘1'},
 {id:'tasks',label:'Tasks',shortcut:'⌘2'},
 {id:'calendar',label:'Calendar',shortcut:'⌘3'},
 {id:'focus',label:'Focus',shortcut:'⌘4'},
 {id:'settings',label:'Settings',shortcut:'⌘5'},
 {id:'profile',label:'LeiBox',shortcut:''},
];

export const FLUID_TOOLTIP_PROMPT=`创建“流体提示气泡”组件：蓝灰色侧栏包含五个线条图标和底部LeiBox圆形Logo。鼠标悬停或键盘聚焦时，右侧只有一个黑色胶囊提示气泡。气泡沿入口纵向连续移动并随内容改变宽度，文字固定在各入口的高度，由移动胶囊裁切显现，形成上下滚动的流体切换。不要给每个按钮各放一个淡入气泡，也不增加面板标题、介绍、辅助标签或导航内容页。

布局与材质
- 设计坐标1288×1080，外层占满容器并隐藏溢出。背景是从左上#224d6b、经#52778c到右下#a1adb7的163度蓝灰渐变；从x194开始覆盖满高的蓝灰面板，面板145度渐变#43536f→#4b566b，左缘2px白色12%细线，左投影-20px 0 46px #112a3e30。轻微静态颗粒可用180×180 SVG滤镜：feTurbulence fractalNoise、baseFrequency .8、numOctaves 3、seed17、stitchTiles stitch，覆盖层opacity .024、pointer-events none。
- 侧栏位于(236,218)，宽100px。六个按钮100×100，间隔9px，中心y依次268、377、486、595、704、813，中心x286。默认Today选中，白色11%背景、35px圆角；悬停另一个按钮时仅给它白色2.5%浅背景，原选中项保持。背景变化.13秒；图标与按钮不在hover时上浮或位移。
- 前五个图标44×44、颜色#d6dbe3、24×24 viewBox、圆端圆角、描边1.6。底部为66×66白色圆形头像槽，4px内边距，使用下述真正的LeiBox图形，不能保留人物照片。Logo背景白色，图形黑色，L形挖空显出白底。
- 胶囊左侧x356，比按钮右边多20px；高86px，圆角43px，背景#1e1e23，阴影0 6px 22px #1b203a12，overflow hidden、pointer-events none。横向padding32px，标签与快捷键间隔18px。标签为38px/46、600字重、字距-.8px、#f2f2f3；快捷键38px/46、600、字距-1.2px、#89898e，快捷键格子最小宽75px。字体Inter、Arial、Helvetica、Microsoft YaHei、sans-serif，允许无外部字体时直接使用回退字体。宽度实时测量当前标签与快捷键的max-content宽，再加64px并向上取整。
- 六行内容依次Today/⌘1、Tasks/⌘2、Calendar/⌘3、Focus/⌘4、Settings/⌘5、LeiBox/无快捷键。头像对应文字是LeiBox，不能出现原人物名或作者来源区块。

精确矢量
- 所有图标用fill none、stroke currentColor、stroke-linecap round、stroke-linejoin round。太阳：circle(12,12,r4)，短射线path依次M12 3v1、M12 20v1、M3 12h1、M20 12h1、m18.364 5.636-.707.707、m6.343 17.657-.707.707、m5.636 5.636.707.707、m17.657 17.657.707.707。
- Tasks饼图：实心象限path为M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z；其余圆环path为M21.21 15.89A10 10 0 1 1 8 2.83，stroke-dasharray为36 3 1.7 3 1.7 3。
- Calendar：path M8 2v4、M16 2v4；rect(x3,y4,w18,h18,rx2)；横线path M3 10h18。Focus：circle(12,12,r10)与实心circle(12,12,r1)。
- Settings外轮廓path：M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915；内圈circle(12,12,r3)。上述图形来自可保留MIT声明的Lucide图标。
- LeiBox图形viewBox 0 0 512 512，黑色path、fill-rule与clip-rule均evenodd，d为M212 59.403 A88 88 0 0 1 300 59.403 L404.258 119.597 A88 88 0 0 1 448.258 195.807 L448.258 316.193 A88 88 0 0 1 404.258 392.403 L300 452.597 A88 88 0 0 1 212 452.597 L107.742 392.403 A88 88 0 0 1 63.742 316.193 L63.742 195.807 A88 88 0 0 1 107.742 119.597 Z M247 273.618802154 L247 392.618802154 A27 27 0 0 0 287.5 416.001488056 L390.55702305 356.501488056 A27 27 0 0 0 363.55702305 309.736116252 L301 345.85343035 L301 273.618802154 A27 27 0 0 0 247 273.618802154 Z。可把这个内嵌SVG转成data URI供img使用，不依赖预先存在的图片文件。

共享胶囊与真实裁切
- 胶囊永久保留同一DOM节点，以状态{y,width,opacity}驱动；y为顶部坐标。内部label-track左32px，包含六条绝对定位的max-content flex行，每行高86px，第i行的top=入口中心y-43。
- 每帧胶囊translateY(state.y)，内部label-track同时translateY(-state.y)。因此文字在整个画布中的高度保持不变，只有胶囊裁切窗口上下移动：朝上切换时新文字从上沿露出、旧文字从下沿移出，朝下反之。保留这种移动中的双行裁切，不用单纯opacity交叉淡入替换。
- 第一次进入时立即把y和宽度放在对应入口，opacity在.15秒power2.out内0→1。换入口时，从当前正在渲染的y与width向目标中心y-43和新测量宽度过渡，时长.43秒、expo.out；快速跨多项时kill旧补间并从当前数值接续，不跳回旧目标，不排队。气泡高度始终86px，不额外拉长或捏成水滴，不让图标跟着运动。
- 指针离开按钮后等待75ms；进入下一项会取消隐藏，以免经过9px间隙闪烁。如果仍有本组件按钮获得键盘焦点，保留该按钮的提示；否则opacity用.15秒power2.out收回。完全隐藏时aria-hidden true并移除aria-describedby。重新进入正在淡出的气泡时保留当前几何继续移动。

交互与可复用API
- Hover和focus只改变提示，不改变选中项。点击、Enter、Space或本组件内的Meta/Control+1…5更新本地选中项；仅当选中id确实变化时调用options.onSelect(id)，不导航到虚构链接、不打开账户或网络请求。头像同样是可聚焦可选择的profile按钮。
- Up/Down或Left/Right在六项间循环移动焦点，Home到Today、End到LeiBox，Escape立即收起提示并保留焦点；Tab与Shift+Tab正常工作。点击组件空白或组件外部关闭提示，触屏轻点同样可显示和选择。
- options.active为today/tasks/calendar/focus/settings/profile之一，默认today；options.onSelect为本地选择回调；options.profileLabel默认LeiBox；options.logoSrc允许替换Logo图片，省略或加载失败恢复上述内嵌矢量。所有状态按实例独立，不污染宿主页面。
- 使用nav、button、唯一的role tooltip、aria-label、aria-current与按需aria-describedby；可见焦点环3px、#e9edf7、outline-offset 5px。快捷键文字仅为视觉提示，不制造重复朗读。

适配、生命周期与验收
- 1288×1080画布按容器宽度等比缩放；场景高度变化时内部舞台再按min(1,height/1080)缩放并居中，按钮、文本和提示一同变换。窗口变化后重新测量真实文字宽度；字体加载完成后再做首次精确测量。
- 减少动态效果时直接设置最终y、宽度、透明度，所有交互仍可用。隐藏页面暂停活动补间，显示时继续。destroy清理GSAP补间、隐藏计时器、监听器、ResizeObserver和字体使用，异步字体完成后不得重新启动。
- 实测所有入口、上下方向、连续快速跨项、两行同时被胶囊裁切、真实宽度插值、字体测量、离开与重新进入、键盘与触屏、选中回调、外部更新、坏图片回退、减少动态效果、多实例和动画中卸载。375/768/1440无横向溢出。保留完整代码和提示词的真实复制成功/失败反馈。`;
