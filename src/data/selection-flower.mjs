export const SELECTION_FLOWER_TEXT = [
  'Drag across a line. Every character the selection swallows puts something in the ground behind it — a stem finding its angle, a leaf turning over, a head of petals opening one at a time.',
  'Nothing here is placed by hand. A seeded generator picks the family, the length, the bend of every joint, the side each leaf takes and how far it swings out. The same rules run every time; the results never repeat.',
  'Let go, and it grows backwards. Petals fold into the bud, leaves close along their attachment points, stems retract into the point they came from. Nothing dissolves — it simply un-grows.',
  'Only a highlight plants anything. The cursor can do it too, if you turn it on.',
];

export const SELECTION_FLOWER_PROMPT = `制作“文字选区开花”交互组件：真实文字拖选经过的每个非空白字符种下一株程序花朵，松手后沿原生长路径反向收回。无服务器、无远程素材、无外部字体。以下尺寸与运动数值为可复现的重建规格。

布局与文字
- 基准画布 822×720px，纯白背景 #fff，正文黑色 #111。内部文章宽658px，左边82px，顶部52px。固定设计坐标随容器等比缩小，在375/768/1440px无水平溢出；大容器保持文章居中。场景position:relative与isolation:isolate；花朵Canvas绝对铺满场景、z-index:0、pointer-events:none；文章position:relative、z-index:1且背景透明。文字与原生绿色选区在最前，完整遮住经过它们的茎、叶与花瓣。花从选区边缘后面长出，不能把植物画在文字或选区上面。所有正文仍是可拖选、复制的真实文字节点，不转为图片。
- 标题两行，第一行“Select any of this and”，第二行“watch it flower.”。Georgia, 'Times New Roman', serif 字体栈，常规字重，72px、行高80px、字距-3px，底部间距32px。
- 正文 'Times New Roman', Times, serif，21.5px、行高36px、段间距24px。第三段第一句斜体。四段逐字如下：
${SELECTION_FLOWER_TEXT.map((text,i)=>`${i+1}. ${text}`).join('\n')}
- ::selection 背景#2fca4e、文字白色；不把文字内容替换成绿色标签。可聚焦文章段落，focus-visible 显示2px深绿色外轮廓、偏移6px。屏幕阅读器可读操作说明及一次交互结果，不逐帧播报。

状态与输入
- idle 无花朵。pointerdown 在文章内开启拖选，浏览器本身维护Selection；selectionchange时只接受起止节点都在本实例文章内的非折叠Range。用TreeWalker遍历文本节点、逐字符Range.getBoundingClientRect()取得真实选中文字的局部坐标，支持从右往左、跨行、跨段及标题文字。
- 每个选中非空白字符以文本节点序号和字符偏移作稳定键。同一次拖选扩展时只创建新出现的字符植株；已有植株不能更换身份、随机形态或坐标。缩短选区时离开的字符反向生长，再次经过时从当前进度接回。新一次拖选使用新种子。
- pointerup、pointercancel、失去窗口焦点、移到外部后松手：所有植株目标变为0。绿色浏览器选区按系统行为保留，不在松手时立即删除。收回结束才移除植株。新拖选可中断收回，绝不以透明淡出代替反向生长。
- Enter/Space在聚焦段落选取前36字符并开花，1.3秒后反向收回；Shift+左右方向键扩缩键盘选区，Home/End选取开头或整段；Escape清除本实例选区、收回花朵。触屏保留原生长按拖选，轻点段落选择触点附近词组并开花，1.3秒后收回；垂直滑动不误触。
- 只移动鼠标不种花。末段关于cursor的文字属于演示正文，没有额外开关。不得凭空增加工具栏、花朵按钮或业务后端。

植物绘制与确定性
- Canvas 2D以设备像素比绘制、上限2。每次手势产生32位随机种子；每株以seed XOR imul(节点序号+1,73856093) XOR imul(字符偏移+1,19349663)初始化xorshift32。每次随机x^=x<<13;x^=x>>>17;x^=x<<5，返回(x>>>0)/4294967296。约65%的字符种植，长选区均匀采样，最多160株，避免整篇选择产生无界任务。
- 锚点为每个真实字符Range矩形的中心：(left+width/2,top+height/2)，换算到场景局部坐标。不得分别贴在字符上边或下边播种；根部必须藏在绿色选区内部。向下概率0.38，茎长16–56px，横向弯曲bend=-30至30px。花形五类：5瓣圆花、6瓣圆花、8瓣细菊、4瓣圆花、仅含苞的小芽，等概率选择。花头尺度混合：35%为5–10px、45%为10–17px、20%为18–23px；仅含苞类型用4–6px。少数大花与小芽混合，不能把所有花画成同尺寸小图标。色板#f21b3f红、#ffb35b橙、#f4d64c黄、#9bc9ec蓝、#a47bdf紫、#f1afd0粉、#fff7db米白。花心黄、橙或暖粉。花头和花瓣带#20241b的1–1.2px清晰轮廓，实心平涂，无噪点、阴影或模糊。
- 先画绿色茎：从锚点出发的二次曲线B(t)=(1-t)^2 P0+2(1-t)t P1+t^2 P2。P1=(anchorX+bend*.35+curve,anchorY+direction*length*.48)，P2=(anchorX+bend,anchorY+direction*length)，curve在-12至12px随机。生长只画曲线0到s的一段，用28个采样点；不缩放整株。茎描边深绿2.4px，再细描#67b868 1.1px。
- 在茎进度t=.42、.7处以65%与35%概率分别长叶，允许无叶、单叶和双叶，避免每株一模一样。叶长7–15px，两个二次曲线构成尖头封闭叶片，绿色填充黑色细描。叶片本身进度从0长到1，再按同一路径关闭。
- 花头先含苞再逐瓣打开。芽头尺寸clamp((growth-.25)/.22,0,1)*min(radius*.24,3.5)，竖向椭圆半径是横向1.25倍；仅含苞类型不生成花瓣或花心。第k瓣角度2π*k/N+seedRotation，瓣中心距花心radius*.6，椭圆长轴radius*.64、短轴一般为radius*.46，8瓣细菊为radius*.28；每瓣独立展开，progress_k=clamp((growth-.42-k*.027)/.32,0,1)，用easeOutBack系数1.1控制轻微弹性。花心最后出现，半径clamp((growth-.54)/.3,0,1)*radius*.25。颜色/花型/长度只由该株seed确定，不随绘制帧改变。

运动、反向与清理
- 每株progress从0增长至1，目标改动时保留当前progress；时间步dt=min((now-prev)/1000,.04)，增长速度3.3/s，收回速度2.7/s。stem=clamp(growth/.62,0,1)；叶片在growth .22至.68依次展开；花瓣在.42之后分瓣展开。向下花用同一算法反转方向。保持全程不透明；收回先闭花瓣、再闭叶、最后缩回茎，结束移除。
- 花头在活跃拖选时只有1–2px、约1.5Hz的微摆；收回与减少动态效果时禁用微摆。不引入持续漂浮粒子。动画只在植株存在且可见时运行；IntersectionObserver离屏暂停，visibilitychange隐藏暂停，重新可见恢复。
- prefers-reduced-motion与options.reducedMotion时选中文字仍可用，花朵即时显示最终形态、松手即时清空，不循环绘制；运行时切换偏好也须生效。options.height调整外部场景高度，不能破坏文字定位。
- 多实例使用独立种子、Canvas、选区所有权和动画控制器，DOM不访问宿主全局ID、不改宿主body样式。destroy幂等，取消RAF、计时器、观察器、媒体查询及所有鼠标/键盘/选区监听器；React StrictMode重新挂载正常。卸载时仅清除属于该实例的浏览器选区。

交付与验收
- 给出完整框架入口、共享DOM/Canvas交互核心、样式和类型声明，提供真实安装与使用示例，不以iframe代替组件。全部必要文字、色板、随机算法和几何公式已在本文内，不需要补取素材。
- 验证鼠标从左到右及反向拖选、跨行、选择扩缩、松手收回的中间帧、快速二次拖选、外部松手、Escape、Enter、Shift+方向键、触屏轻点与滚动。保持同一选区和Canvas合成层，分别比较完整绘图与只清空Canvas选区矩形内绘图时的实际截图：绿色底和白字应逐像素一致，花朵只从边缘后面显露；邻行黑字也不能被花朵覆盖。不能通过隐藏Canvas元素改变浏览器文字抗锯齿后比较。检查花朵随时间真的生长、种子在一株生命周期内稳定、收回时节点/对象身份保持、收回结束后画布无残留。验证两实例互不干扰、减少动态效果、三档宽度和卸载后RAF停止。`;
