export const GLASS_TAB_ICONS={
  calendar:`<g transform="translate(-1 -1)"><rect x="5" y="9" width="53" height="48" rx="11" fill="{dark}"/><path d="M19 7v9m25-9v9" stroke="#626365" stroke-width="5" stroke-linecap="round"/><rect x="5" y="23" width="53" height="38" rx="9" fill="{paper}"/><path d="M7 31v-1a7 7 0 0 1 7-7h35a7 7 0 0 1 7 7" fill="none" stroke="white" stroke-opacity=".85" stroke-width="1.4"/><path d="m19 42 6-4v16m10-16h14L40 54" fill="none" stroke="#242526" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></g>`,
  notes:`<g transform="translate(-3 0)"><rect x="24" y="7" width="37" height="43" rx="12" fill="{dark}"/><rect x="8" y="20" width="37" height="42" rx="10" fill="{paper}"/><rect x="8" y="20" width="37" height="42" rx="10" fill="{transmission}" stroke="{rim}" stroke-width="1.4"/><path d="M17 34h18M17 46h11" stroke="#303134" stroke-width="4.5" stroke-linecap="round"/></g>`,
  people:`<g transform="translate(-2 1)"><circle cx="44" cy="20" r="10" fill="{dark}"/><path d="M27 58v-4a18 18 0 0 1 36 0v4Z" fill="{dark}"/><circle cx="25" cy="24" r="10" fill="{paper}" stroke="#fff" stroke-width="1.2"/><path d="M7 58v-4a18 18 0 0 1 36 0v4Z" fill="{paper}"/><path d="M7 58v-4a18 18 0 0 1 36 0v4Z" fill="{transmission}" opacity=".65"/></g>`,
  folder:`<g transform="translate(2 1)"><path d="M6 23v-8a7 7 0 0 1 7-7h15l7 8h16a7 7 0 0 1 7 7v25H6Z" fill="{dark}"/><rect x="6" y="24" width="52" height="35" rx="9" fill="{paper}"/><path d="M7 34v-2a8 8 0 0 1 8-8h34a8 8 0 0 1 8 8" fill="none" stroke="white" stroke-opacity=".8" stroke-width="1.5"/></g>`,
  note:`<rect x="5" y="9" width="42" height="49" rx="10" fill="{paper}" stroke="{rim}" stroke-width="1.2"/><path d="M15 25h17M15 36h10" stroke="#4c4d50" stroke-width="4.5" stroke-linecap="round"/><path d="m39 39 15-16" stroke="{dark}" stroke-width="11" stroke-linecap="round"/><path d="M33 49Q32 49 33 46L35 38 43 44 35 49Q34 50 33 49Z" fill="#26272a"/>`,
  checklist:`<rect x="7" y="6" width="50" height="53" rx="12" fill="{paper}" stroke="{rim}" stroke-width="1.3"/><path d="m17 21 5 5 10-10M41 21h8m-8 22h8" stroke="#444548" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="23" cy="44" r="7" fill="none" stroke="#292a2c" stroke-width="5"/>`,
  photo:`<path d="M6 27Q6 18 15 18H21Q24 18 25 14L26 11Q27 9 30 9H37Q40 9 41 12L43 16Q44 18 47 18H51Q60 18 60 27V49Q60 58 51 58H15Q6 58 6 49Z" fill="{paper}"/><path d="M7 30V27Q7 19 15 19H21Q25 19 26 14L27 12Q28 10 30 10H37Q39 10 40 13L42 17Q44 19 47 19H51Q59 19 59 27" fill="none" stroke="#fff" stroke-width="1.6"/><circle cx="33" cy="37" r="10" fill="{black}"/><circle cx="49" cy="25" r="2.5" fill="#4b4c4e"/>`,
  scan:`<rect x="19" y="16" width="26" height="36" rx="10" fill="{paper}" stroke="{rim}"/><path d="M20 7h-3a10 10 0 0 0-10 10v3m37-13h3a10 10 0 0 1 10 10v3M7 44v3a10 10 0 0 0 10 10h3m37-13v3a10 10 0 0 1-10 10h-3" fill="none" stroke="{dark}" stroke-width="5.5" stroke-linecap="round"/>`,
  voice:`<rect x="22" y="5" width="20" height="36" rx="10" fill="{paper}" stroke="{rim}" stroke-width="1.4"/><path d="M29 18h6m-6 10h6" stroke="#4b4c4f" stroke-width="5" stroke-linecap="round"/><path d="M12 29v3a20 18 0 0 0 40 0v-3M32 50v8m-10 0h20" fill="none" stroke="{dark}" stroke-width="5" stroke-linecap="round"/>`,
  sketch:`<rect x="5" y="10" width="54" height="44" rx="13" fill="{paper}"/><path d="M7 27v-4a11 11 0 0 1 11-11h29a11 11 0 0 1 10 8" fill="none" stroke="{rim}" stroke-width="1.5"/><path d="M16 42C22 40 26 21 31 22C38 23 26 40 32 42C36 44 42 32 49 29" fill="none" stroke="#242527" stroke-width="5.6" stroke-linecap="round" stroke-linejoin="round"/>`,
 };
export const GLASS_TAB_MENU_PROMPT=`从零实现“玻璃标签栏展开菜单”。四项图标标签栏右侧有独立圆形加号按钮；点击标签时，同一个白色选中块变得通透并弹性滑到新位置；点击加号时，原来的玻璃外壳先收窄，再向上展开为3列2行菜单，按钮旋转成关闭符号。保持同一外壳身份，不能直接替换两张状态图，也不要给图标或按钮添加悬停上浮。

画面、布局与材质
- 设计画布1080×1080，无额外可见标题、导航、说明或业务内容。全幅浅灰紫背景，左上(27%,17%)大面积柔白亮斑；四角基色约#f5f4f7，右侧中部#e2e3e8，底部#d9d7e1。用径向白光与177.62度线性渐变叠加，避免纯白背景或彩色装饰。
- 场景按k=min(containerWidth/1080,containerHeight/1080)等比居中；设计舞台1080×1080。交互组合左65、底318、宽950、高446。主玻璃壳左0、底0，闭合宽762高147、圆角73.5；展开宽762高446、圆角86，底边始终在舞台y762。加号按钮位于组合右下角，147×147，圆形；与壳间距40px。
- 壳与圆按钮均2px rgba(255,255,255,.85)边框，160度渐变白色透明度.42到.25，inset 0 1px 2px白高光；壳外影0 13px 42px -13px rgba(76,73,91,.22)，backdrop-filter blur(25px) saturate(1.1)。玻璃是轻薄半透明灰白，有明亮边缘，不能用厚实灰卡片替代。
- 闭合标签栏四等份。内容盒762×147、bottom:-3px、内边距15px，四个按钮各183×116。图标64×64，依次Calendar、Notes、People、Files；没有可见文字。选中块初始在左15、上16（含外壳边框与内容盒定位后，画布绝对坐标约80,632），179×116、圆角65、近白底、1.5px白边和0 7px 17px rgba(82,77,99,.15)投影。
- 菜单内边距24、行列间距16；3列2行，各格约227×191、圆角57。格子用rgba(111,107,124,.10)到rgba(105,101,119,.145)的浅灰渐变，文字黑色，Inter风格、完整回退Inter / Arial / Helvetica / sans-serif，33px、字重500、行高1.15、字间距0；未提供字体时保持此回退栈并校准Checklist约138px、Note约68px、Photo约85px的实际字形宽度。图标60×60，与文字间距24、内容中心向下偏4px；从左到右、从上到下文字为Note、Checklist、Photo、Scan、Voice、Sketch。悬停只微调背景亮度，不移动按钮或图标。
- 加号是两条长42、宽6、圆角5的黑条，中心重合，位于44×44容器，整体向左光学校正1px；展开时整体旋转45度成为×。

内嵌灰阶立体SVG图标
- 以下全部图形由内嵌SVG生成，不依赖图片、字体图标库、远程资源或预先存在的文件。每个viewBox为0 0 64 64，aria-hidden。每个图标内部使用唯一渐变ID，防止多实例碰撞。
- {paper}为左上至右下的银灰渐变：notes/people标签图标为#ededf0 / 45%位置#dadade / #cbccd1；六个菜单图标为#e3e3e6 / 45%位置#d4d4d8 / #c7c7cd。{dark}替换成从上#5d5e60到右下#1d1e20的线性渐变；{black}替换成圆心(.3,.25)、半径.8的径向渐变，从#505153到#050506。叠白色细边表现高光，深色部件位于浅色部件后方。calendar数字17直接用圆端描边路径，不能依赖系统字体替换。
- {rim}为从上至下的白色描边渐变，起点alpha .95、48%处.3、底部0，表示顶边高光逐渐淡去；不要给整个灰面加同等明亮的轮廓。
- calendar前层银面改用垂直渐变：#949496、20% #b2b2b5、60% #dad9dc、100% #d9d8dc；folder前层垂直渐变：#929396、25% #a3a3a6、65% #cecdd2、100% #d4d3d8。顶部深灰透影与一道白色弧形边同时存在，不能画成上白下灰的塑料片。
- {transmission}为局部透影径向渐变，圆心(.9,.35)、半径.95，颜色#242426，起点alpha .58、45%处.3、末端0；notes前层同形叠一层，people前身同形叠一层并设opacity .65，表现后层透过浅色前层的灰影，不使用外发光或均匀黑蒙层。
- 按钮图标键为calendar/notes/people/folder，菜单键为note/checklist/photo/scan/voice/sketch。逐项完整SVG内部内容如下（把五个占位标记替换成该SVG自己的url(#渐变ID)）：
${JSON.stringify(GLASS_TAB_ICONS)}

连续形变与运动
- 五个带速度的标量：opening（外壳高）、selection（横向选中位置）、compression（外壳收窄）、press（圆按钮脉冲）、content（菜单显现）；均初始p=0、v=0。opening/content目标0或1，selection目标0/1/2/3，compression/press目标0。
- 每帧dt=min(.032,elapsedSeconds)，3子步，v+=((target-p)*stiffness-v*damping)*dt/3，p+=v*dt/3。五项刚度/阻尼依次为400/26、330/26、400/22、420/24、480/30；误差<.0001且速度<.001时吸附目标。保留当前速度与位置以支持中途反向，闲置停止RAF。
- 切换菜单立即改变目标与ARIA，并给press速度加16，上限18。若从完整闭合/展开端点切换（目标距离>.95），先只播放按钮反馈：外壳高度延迟75ms开始，宽度收窄冲量延迟90ms开始，打开时内容显现延迟170ms开始；收起时content立即开始淡化。中途反向取消这些起步延迟，沿当前位置继续，不能重置到端点。所有延迟由RAF累计dt推进，不增加多个无法取消的计时器。
- 宽度冲量为compression.v+=17*目标距离，上限20；c=clamp(compression.p,-.02,.47)，壳宽762*(1-c)，左偏移(762-width)/2，高147+299*clamp(opening.p,0,1.02)，底边固定0。轻微允许超出目标尺寸再回弹。外壳圆角73.5+12.5*clamp(opening.p,0,1)。
- 标签内容固定762×147，以水平中心和底边为原点scaleX(width/762)，透明度1-smoothstep(.03,.39,p)，blur=22*sin(πp)。菜单内容固定758×442，以底边中心为原点scale(width/762,height/446)，透明度r=clamp(content.p,0,1)，blur=22*(1-r)。低于.01px时filter直接设none，停稳保持锐利；两套控件不能同时接收交互。
- 圆按钮scale=1+.6*clamp(press.p,0,.48)，按下时短暂增至约180px并变为近实心白；加号旋转45*p度。旋转随延迟后的外壳进度发生，按钮亮起/放大先发生。普通hover不改变transform。
- 选中块横移selection.p*183px。travel=clamp(abs(selection.v)/7,0,1)，scaleX=1+.08*travel、scaleY=1+.25*travel；底色白色alpha=.98-.95*travel，阴影alpha由.15减至.08，偏移7到4、模糊17到22。移动中呈薄玻璃轮廓，停稳恢复白色179×116胶囊。
- 在图标上方另放同尺寸、同步位置的透明镜片，白色alpha .12、backdrop-filter blur(.65px)，镜片opacity=travel。它只在移动时对覆盖范围内的图标轻微提亮与柔化；停稳opacity0。图标本身不位移，不能把所有图标一起淡化。
- 背景使用接近纵向的177.62度线性渐变，端点rgb(212.26,208.59,223.64)到rgb(208.49,207.49,217.85)，其上覆盖高斯白色亮斑。归一坐标下亮斑中心(.2583,.1703)，半径参数sx=.9263、sy=.5820；R=((x-.2583)/.9263)^2+((y-.1703)/.5820)^2，alpha=.90826*exp(-R^.9468)。可用21个等距径向渐变停靠点近似，椭圆半径185.26%与116.41%，第i个5%停靠点alpha=.90826*exp(-(4*(i/20)^2)^.9468)。保持灰白柔光，不引入额外彩色光斑。
- 上述时间、曲线和光照为逐帧测量后的可复现重建参数，不声称使用了特定原作动画库。

语义、输入与本地行为
- 使用语义button。标签区域role=tablist，四按钮role=tab、aria-label分别Calendar/Notes/People/Files，aria-selected与tabindex采用单一选中项；各自关联仅供屏幕阅读器的tabpanel，不能为了展示内容额外造页面。左右方向键循环选中并聚焦，Home/End到首末，Enter/Space保持原生按钮行为。
- 加号aria-haspopup=menu、aria-controls指向菜单、aria-expanded反映目标，aria-label在Open creation menu和Close creation menu之间切换。菜单role=menu，六项role=menuitem。关闭时菜单inert，打开时标签栏inert；菜单在content.p>.62时才接收指针与焦点，收起过程中标签栏在p<=.38才解除inert。不可见内容不能接收焦点或挡住外层按钮。
- Enter/Space打开菜单后，在内容清晰时聚焦第一项；加号的向下/向上键分别打开并聚焦首项/末项。菜单方向键左右移动一格，上下移动三格，Home/End到首末；Escape关闭并将焦点还给加号。Tab离开整个组合时收起。点击组合之外的空白也收起。
- 点击六项只记录本地选择、更新隐藏的aria-live提示、关闭菜单并还焦点，不访问相机、麦克风、文件系统或真实后端。可以向宿主发出glass-tab-action自定义事件，detail.action为所选英文名，bubbles及composed为true。参考范围没有拍照、录音或编辑器界面，不能自行扩展。
- 鼠标与触屏均用真实click；触摸无需hover，不能绑定touchstart加click导致一次点击切换两次。focus-visible显示3px #555d7d内侧轮廓，outline-offset -7px。

尺寸、减少动态效果与清理
- 容器ResizeObserver只更新舞台缩放，不能重置当前选中项和菜单状态。375/768/1440宽度无横向滚动，场景背景填满容器，玻璃轮廓相对位置不变。
- prefers-reduced-motion及options.reducedMotion开启后立即将五个状态吸附各自目标并绘制，保留完整操作；不依赖下一次RAF完成。组件选项变化时监听宿主的减少动态效果标记，不能只监听系统matchMedia。
- 支持options.height修改场景高度，多实例隔离DOM、渐变ID、状态与事件。卸载取消RAF，断开ResizeObserver、选项MutationObserver，移除媒体查询/文档/窗口监听和所有残留任务；组件入口不使用iframe或执行字符串代码。
- 图标、嵌入字体和DOM初次布局实际完成后才通知预览ready。列表封面和动态首帧背景均#f4f4f4；外部预览只在当前卡片悬停或键盘聚焦时实例化，自动演示点击原生控件，移开即释放，不能触发外层导航。

验收
- 对照闭合、四项选中、展开、收起、中途反向和快速重复点击；观察高度、收窄、模糊、透明度、加号角度及选中块通透变化，不能只测最终aria值。
- 实测鼠标点击、触屏tap、方向键/Home/End/Enter/Space/Escape、外部点击、减少动态效果、尺寸更新、多实例与卸载。提供所选框架完整四文件实现、安装和使用说明，不留未实现核心，不新增后端。`;
