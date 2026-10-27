export const RADIAL_ACTIONS=[
 {key:'mail',label:'Mail',color:'#0762ca',shape:'<rect x="6" y="14" width="88" height="72" rx="24"/><path d="M27 38 50 53 73 38" fill="none" stroke="var(--rm-color)" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>'},
 {key:'photos',label:'Photos',color:'#0b9db3',shape:'<rect x="16" y="16" width="68" height="68" rx="16" fill="none" stroke="white" stroke-width="11"/><circle cx="36" cy="36" r="6.5"/><path d="M18 71 30 55Q35 49 40 55L63 83H20ZM50 52 61 34Q66 27 72 34L82 49V80H73Z"/>'},
 {key:'notifications',label:'Notifications',color:'#e00001',shape:'<g transform="translate(0 5) scale(1 .9)"><circle cx="50" cy="20" r="8"/><path d="M27 47Q27 24 50 24T73 47V61L80 72Q84 79 75 79H25Q16 79 20 72L27 61Z"/><path d="M38 84H62Q59 95 50 95T38 84Z"/></g>'},
 {key:'messages',label:'Messages',color:'#0bac2d',shape:'<path d="M50 6C24 6 6 23 6 46C6 59 11 69 19 76L14 89Q12 94 20 91L36 86Q43 88 50 88C76 88 94 71 94 46C94 22 76 6 50 6Z"/>'},
 {key:'calendar',label:'Calendar',color:'#d90022',shape:'<rect x="14" y="15" width="72" height="70" rx="19" fill="none" stroke="white" stroke-width="9"/><path d="M17 34V28Q17 17 30 17H70Q83 17 83 28V34Z"/><circle cx="44" cy="44" r="3.8"/><circle cx="56" cy="44" r="3.8"/><circle cx="68" cy="44" r="3.8"/><circle cx="32" cy="56" r="3.8"/><circle cx="44" cy="56" r="3.8"/><circle cx="56" cy="56" r="3.8"/><circle cx="68" cy="56" r="3.8"/><circle cx="32" cy="68" r="3.8"/><circle cx="44" cy="68" r="3.8"/><circle cx="56" cy="68" r="3.8"/>'},
 {key:'compose',label:'Compose',color:'#c79606',shape:'<g transform="translate(5 5) scale(.9)"><path d="m59 16 6-6Q74 2 82 10L88 16Q96 24 87 33L82 38Z"/><path d="M53 22 76 45 38 83Q35 86 31 86L14 88Q10 88 11 83L13 66Q13 63 16 60Z"/></g>'},
];

export const STAGGERED_RADIAL_MENU_PROMPT=`从零实现“环形菜单交错展开”。黑色正方形场景中央只有白色圆形加号按钮；点击后，六个彩色圆按钮从外围沿径向依次收拢，模糊消退、弹性停稳；关闭时以相反顺序向外散开、模糊淡出。不能把此效果做成从中心长出按钮，也不能同时淡入六项。

画面与布局
- 基准画布960×960，背景纯黑#000，无可见标题、文字标签、辅助线或额外面板。舞台960×960，容器按k=min(width/960,height/960)等比居中，背景覆盖整个容器。
- 中央圆按钮中心(480,480)，178×178，圆角50%，白色#fff。按钮左391、上391。加号由两条60×12黑条组成，圆端半径7，水平条左0上24，竖条旋转90度；60×60容器居中，黑色#030403。展开旋转45度成为×，关闭回0度，按钮不位移或缩放。hover只将中央底色改为#ededed，active为#e4e4e4，不能hover上浮或让图标跟着飘动。
- 六圆按钮直径178，以同一中心按角度-90、-30、30、90、150、210度排列，停稳半径224。位置分别约(480,256)、(674,368)、(674,592)、(480,704)、(286,592)、(286,368)。括号为圆心。初始和关闭目标半径451，按钮始终沿自己的径向移动，图标保持正向不旋转。
- 顺时针六项：蓝色Mail #0762ca、青色Photos #0b9db3、红色Notifications #e00001、绿色Messages #0bac2d、玫红Calendar #d90022、黄色Compose #c79606。彩色圆面平整，inset 0 1px 1.5px rgba(255,255,255,.3)及inset 0 0 0 1.5px rgba(255,255,255,.12)表现很薄的边缘高光，不增加外部光晕、投影或彩色渐变背景。
- 图标均为白色实心圆润形状，100×100，居中，viewBox 0 0 100 100。Mail是白色圆角信封带蓝色V形切口；Photos是白色圆角相框、太阳和山；Notifications是白色铃铛；Messages是带左下尾巴的白色对话泡；Calendar是圆角框、顶栏和十个圆点；Compose是右上倾斜的白色笔。完整图形数据如下，shape直接作为SVG内部内容，SVG默认fill:white，圆按钮style设置--rm-color为对应颜色：
${JSON.stringify(RADIAL_ACTIONS)}

连续状态与动画
- 每个按钮独立保存position、velocity、opacity、blur、fromOpacity、fromBlur、elapsed、delay。初始position=0、velocity=0、opacity=0、blur=24，初始不可见且不可聚焦。全局opened=false，旋转另有position=0和velocity=0。唯一RAF只在变化时运行，闲置停止。
- 触发打开时，目标position=1；第i项delay=i*.05秒，顺序从Mail沿顺时针到Compose。触发关闭时目标position=0，delay=(5-i)*.025秒，以Compose到Mail的反向顺序散开。中途反向时取消所有新增延迟，保留实际位置、速度、当前透明度和模糊，从当前位置继续，不能重置或等上一轮播完。
- 每帧dt=min(.032,elapsedSeconds)。elapsed累计实际dt；未到delay的项保持原样。开始后activeDt=min(dt,elapsed-delay)，避免跨越延迟边界时提前整帧移动。将activeDt分成3子步，velocity+=((target-position)*stiffness-velocity*damping)*activeDt/3，position+=velocity*activeDt/3。打开刚度250、阻尼18；关闭刚度300、阻尼30。误差<.0001且速度<.002时吸附目标。radius=451-227*position；x=cos(angle)*radius，y=sin(angle)*radius，以CSS translate(x,y)加在圆按钮上，允许弹性超过停稳位置。不可通过缩放整张图来模拟。
- 每次切换从当前opacity与blur开始：t=elapsed-delay，smooth(u)=clamp(u,0,1)^2*(3-2*clamp(u,0,1))，opacity=fromOpacity+(target-fromOpacity)*smooth(t/.1)；blur=fromBlur+((opened?0:24)-fromBlur)*smooth(t/(opened?.15:.13))。blur低于.01px时显式filter:none，透明度<=.001时visibility:hidden。显示和位置动画独立，所以先有外围模糊轮廓，再逐渐清晰回弹。
- 加号旋转使用另一个弹簧，打开刚度250、阻尼18，关闭刚度300、阻尼30，目标0或1，rotation=45*position度，每帧dt分3子步；旋转与第一项同步开始，无交错延迟。打开轻微超过45度后回弹，关闭平缓归正；重复点击可随时反向，不能创建叠加计时器。
- 此参数基于可复现的测量重建，不要求或声称使用某种原作者动画库。

操作、语义与范围
- 使用真实button，中央aria-label为Open actions/Close actions，aria-haspopup=menu、aria-controls关联菜单，aria-expanded立即反映目标。六项role=menuitem、aria-label按上述英文名，菜单role=menu、aria-label=Quick actions。closed时菜单inert；按钮自身在opened=false或opacity<.95时inert且pointer-events:none。隐藏项不可拦截中心按钮或接收键盘焦点。
- 鼠标或触屏点击中央按钮切换状态，触屏使用click，不叠加touchstart导致重复切换。Enter/Space打开时等首项显现后聚焦Mail；中央方向下/右打开并聚焦首项，方向上/左聚焦末项。菜单右/下沿顺时针移动一项，左/上逆向，Home/End首末，Escape关闭并将焦点还中央。聚焦目标若仍未显现，待它opacity>=.95再聚焦。
- Tab离开舞台时收起；点击按钮之外的黑色空白时收起。提供focus-visible轮廓：彩色按钮白色5px、offset9；中央按钮#8c9cff同尺寸轮廓。仅显示焦点轮廓，不增加业务界面或可见文案。
- 视频未展示菜单之后的应用界面。六项点击只记本地选择、更新隐藏aria-live提示、发出radial-menu-action事件，detail.action为mail/photos/notifications/messages/calendar/compose，bubbles和composed为true，然后关闭并还焦点；不发邮件、不上传、不录音、不连接后端、不请求权限。

适配与生命周期
- ResizeObserver仅更新舞台缩放，不重置打开状态。支持容器高度配置。375/768/1440宽度无横向滚动，背景填满，圆面不挤成椭圆。
- 系统prefers-reduced-motion和组件options.reducedMotion开启时，同步把六项和旋转吸附目标、直接绘制，保留所有操作，不等待下一帧；组件选项变更与系统媒体查询变更均可生效。
- 多实例DOM、ID、状态、输入和事件互相隔离。卸载取消RAF及ready帧，断开ResizeObserver/选项MutationObserver，移除媒体查询、文档、窗口和控件监听器；没有闲置计时器或全局事件残留。
- 初次真实布局和绘制完成后通知ready。图标全部内嵌，无字体、外部图标或图片资源依赖；辅助文字使用Arial/Helvetica/sans-serif即可。

交付与验收
- 给出所选框架完整可运行代码、原生生命周期入口、真实依赖、安装方式与使用示例，不能用iframe或运行时字符串求值代替组件。共享与框架无关的DOM核心，保证每实例独立更新和卸载。
- 对照初始、六项稳态、打开中途、关闭中途及快速反向：打开第一项早于第六项约250ms，关闭反向跨度125ms，位置沿各自射线变化；不能只校验最后aria值。
- 实测鼠标、触屏、键盘、六项本地事件、尺寸更新、多实例、减少动态效果和卸载无残留。`;
