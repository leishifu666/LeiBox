export const GALAXY_BRAIN_PATH='M30 14C30 5 20 4 16 12C9 11 5 20 9 26C2 30 3 39 10 43C6 50 11 59 19 57C24 63 30 58 30 52Z';
export const GALAXY_BRAIN_FOLDS='M30 27Q28 35 22 35M10 43Q15 44 17 48M16 12Q13 17 16 20';
export const GALAXY_BRAIN_FOLD_TIERS=[
 {level:1,width:2.8,paths:['M29 25Q28 21 24 21C20 21 18 17 21 14']},
 {level:2,width:2.6,paths:['M28 42C23 39 19 41 20 45Q21 48 25 47']},
 {level:3,width:2.5,paths:['M12 28C15 25 19 26 20 29Q21 33 17 34']},
 {level:4,width:2.2,paths:['M21 21Q18 19 15 22','M20 53Q24 55 27 51']},
 {level:5,width:1.9,paths:['M10 36Q13 34 16 37','M24 35Q27 37 25 40']},
];

export const GALAXY_EFFORT_SLIDER_PROMPT=`从零实现“脑形滑块粒子增强”。一个深灰设置卡片里，粉红脑形滑块依次经过 Low、Medium、High、Extra、Max、Galaxy 六档；思考强度越高，脑形中的褶皱从主沟、支沟到细褶皱逐层增加。进入 Galaxy 后，轨道变成闪动的紫蓝像素网格，脑形放大并发光，方形粒子沿多条射线向外流动，卡片短促震动。此控件只保存本地设置，不执行真实推理请求。

结构、尺寸与文字
- 基准场景945×516，纯色背景#111111，水平垂直居中。独立舞台固定945×516，缩放系数min(可用宽/945,可用高/516)，位置居中，外层背景铺满，不依赖宿主页body或外部资源。
- 卡片左252.5、上124、宽440、高258，2px实线#292929，16px圆角，底色#191919，阴影0 18px 28px -12px #0003。尺寸含边框。卡片允许粒子溢出，场景边界裁切。
- 字体栈Arial, Helvetica, sans-serif，无需字体下载，正常字重400。标题左22、上25，一行35px，字号26px，Effort颜色#848484，右侧隔16px显示当前档位，普通颜色#e1e1e1，Galaxy颜色#9dcef3。无额外品牌或标题。
- 卡片右3、上7的70×70帮助按钮，无底色、23px内边距；增大透明命中区便于移动端操作，图标位置保持不变。24×24圆圈问号图标，描边#848484、2px：圆心(12,12)、半径10；问号路径M9.5 8.2a2.6 2.6 0 0 1 5 .8c0 2-2.5 2.2-2.5 4，底点M12 16.5h.01，圆端。hover只改颜色#bfbfbf，不位移或缩放。
- 上97、左右22是一行Faster和Smarter，分别左右对齐，24px/29px、#848484。卡片左47、上205显示Recommended，同字号颜色，不随档位改动。它对应第二档的较长推荐刻度。
- 滑块透明命中区域左22、右22、上133、高72、圆角12，role=slider、tabindex=0。轨道位于命中区上15、下17，高40、宽392，底色#272727、圆角10、裁切内部像素。轨道与脑形本身保持同一DOM身份。
- 六个刻度圆点直径6，横坐标16+i×358/5，i=0到5，纵坐标18，颜色rgba(255,255,255,.20)。第二项为高20、宽6、上10、圆角3、颜色rgba(255,255,255,.27)的长刻度；其他是圆点。不加描边或阴影，刻度自然混合下方的灰色轨道、紫色填充或像素层，不能改成固定亮粉白色。刻度始终保留，像素层下方绘制，不能把Galaxy做成另一个独立控件。
- 脑形SVG48×48、viewBox 0 0 64 64，中心初始位于命中区(16,36)，DOM居中偏移(-24,-24)。左右两半独立填充粉色#ff92ce，深酒红描边#650e3c、宽5、圆端圆角。左半path为${GALAXY_BRAIN_PATH}；内折痕path为${GALAXY_BRAIN_FOLDS}，无填充、线宽4.2；右半复用两条path，transform=translate(64 0) scale(-1 1)。无需图标库或图片。正常脑形不因hover上浮。
- 递增褶皱是此实现的交互设计，不将其描述成原作者源码或真实脑部生理变化。保留上述同一轮廓与主沟，六档依次为：Low仅主沟；Medium增加上部支沟；High增加下部支沟；Extra增加外侧支沟；Max增加顶部和下部细分支；Galaxy增加中部细褶皱。新增左半球路径的完整分层数据为${JSON.stringify(GALAXY_BRAIN_FOLD_TIERS)}。每层在左右半球各实例化一次，右半球同样镜像；每条路径均无填充、使用深色轮廓变量作为描边、圆端圆角，线宽取该层width，从2.8递减到1.9，保留主沟更粗的4.2层级。每条新增path设置pathLength=1、stroke-dasharray=1；各层g设置data-tier为level、初始opacity=0及--ge-fold-hidden=1，path的stroke-dashoffset读取该变量。

数值、状态与输入
- 内部position、velocity、target、galaxy、galaxyVelocity独立保存，全部初始0。档位索引round(clamp(target,0,5))；可见与无障碍名称按Low/Medium/High/Extra/Max/Galaxy同步。aria-valuemin=0、aria-valuemax=5、aria-valuenow为当前档位、aria-valuetext为上述英文名、aria-orientation=horizontal。
- 真实指针按下轨道或脑形后，聚焦滑块并获取pointer capture，记录开始档位。触屏采用同一PointerEvent链、touch-action:none。拖动换算value=clamp((指针在轨道内的x-16)/358×5,0,5)，连续更新target，标签按最近档切换，松手吸附round(target)，pointercancel回到按下时档位；重复触摸不抢占已进行的指针。
- 点击任意位置同样按最近档吸附。左/下减一，右/上加一，Home及Escape回Low，End到Galaxy，PageUp/PageDown加减2，全部阻止默认页面滚动。键盘在拖动中接管时释放捕获。边缘钳制0到5。键盘焦点轮廓2px #b591ff、offset4，不使用无轮廓焦点。
- 每次用户提交档位，在根节点发送冒泡且composed的effort-change自定义事件，detail={value:数字0到5,level:英文档名}。拖动中间值只更新视觉，松手提交。取消不提交。不同实例的值与事件互不干扰。
- 帮助按钮hover或focus显示一段tooltip，点击切换、移开/失焦隐藏、Escape关闭。文案完整为Drag the brain or use arrow keys to choose Low, Medium, High, Extra, Max or Galaxy. Higher effort adds brain folds; Galaxy adds particles. This control uses local demo state. 气泡在卡片上方12px，左右22，内边距12px 14px，圆角9、底#242424、1px边框#444、文字#dedede 14px/20px、阴影0 6px 24px #0005。帮助按钮有aria-expanded、aria-controls，焦点轮廓2px #b591ff。气泡是辅助适配，不影响滑块状态。

连续移动和Galaxy变形
- 仅一个requestAnimationFrame循环，帧间dt=min(.032,实际秒数)，每帧拆3子步。普通移动弹簧k=420、damping=32，v+=((target-position)×k-v×damping)×dt/3，然后position+=v×dt/3；误差<.0002且速度<.002时吸附。横坐标16+clamp(position,0,5)/5×358，禁止用两张静帧淡入冒充移动。快速反向保留当前位置和速度，只替换目标。
- 褶皱跟随同一弹簧的实际position，而非整数标签或另一组计时器。令p=clamp(position,0,5)，每层tier取其level，u=clamp((p-tier+.85)/.7,0,1)，reveal=u*u*(3-2*u)。该层opacity=reveal，--ge-fold-hidden=1-reveal，即线条沿路径逐步画出并渐显。第1层在0.15到0.85展开，第2层在1.15到1.85展开，依此类推到第5层4.15到4.85；回拉用相同公式反向收回，始终保留相同SVG及所有路径节点。静止在六档时可见褶皱路径数分别为2、4、6、8、12、16（包含左右两条基础复合路径，不计脑形轮廓）。减少动态效果时直接按目标档位绘制完整对应密度；不能让高档位仍显示低档位的简脑，也不能用六张图交叉淡入代替生长。
- 普通轨道填充左到脑形中心，宽16+position/5×358。视觉为灰底被莓紫逐渐染亮，强度越高，前缘越偏冷紫，不能使用整条亮粉色渐变。用五个色标重建合成后的呈现色，位置依次为0%、30%、60%、90%、100%。四组RGB色板依次对应Medium、High、Extra、Max：[[[49,42,45],[86,57,76],[125,73,112],[161,89,146],[175,94,157]],[[49,42,45],[81,55,76],[112,69,107],[143,83,139],[153,87,150]],[[49,42,45],[78,56,74],[108,69,110],[129,84,149],[136,90,163]],[[49,42,45],[77,56,74],[102,67,111],[118,84,153],[124,90,167]]]。这些是独立重建的画面呈现色，不宣称是原作者CSS参数。
- 每次绘制令t=clamp(position-1,0,3)，index=min(2,floor(t))，blend=t-index；五个色标的每个RGB通道都取round(palette[index]+(palette[index+1]-palette[index])*blend)，生成横向linear-gradient。颜色随实际连续位置变化，保留中途反向时的衔接，不能只在标签改变时跳色。Low到Medium使用第一组，Max到Galaxy使用第四组并配合1-g淡出；左侧始终保持#312a2d附近的暗灰紫。Max的中段约#66436f、90%处约#765499、最前缘约#7c5aa7，脑形图标保留粉红色。
- 标题变档时将新词拆为字符span，每字220ms、间隔15ms，opacity从0到1，filter blur(4px)到0，translateY从5px到0，缓动cubic-bezier(.2,.7,.2,1)。快速改档取消旧文字动画；不是整个标题或卡片淡入淡出。
- 当最近档位进入Galaxy时记录进入时钟entered，galaxy目标变1，离开变0，使用k190、damping25的同一弹簧积分。g=clamp(galaxy,0,1)，age=max(0,clock-entered)，burst=exp(-age×6)×g。脑形scale=1+.25g+.2burst；填充rgb(255-85g,146+4g,206+39g)，轮廓rgb(101-45g,14+2g,60+77g)。两层drop-shadow半径4+10burst、9+15burst，颜色#8351ff及#7543fc70。进出保留同一SVG并反向衔接，不重建脑形。
- Galaxy填充透明度g，普通渐变透明度1-g。卡片震动振幅shake=g×(.28+exp(-age×7)×2.1)，x=sin(clock×93)×shake，y=cos(clock×117)×shake×.65，进入时强而短、随后微弱。所有数值是自包含的重建参数，不宣称原作者使用这些算法。

轨道像素与放射粒子算法
- 像素Canvas392×40，CSS覆盖轨道，底色linear-gradient(90deg,#10091d,#25123f)，49列×5行。确定性hash(n)=fract(sin(n×127.1+311.7)×43758.5453)。色板依次#80d5d8、#dc8cd5、#b3a3e8、#7061b5、#f4c1eb、#6656a0，不使用噪声图片。
- 每帧清空像素，n=row×49+col，seed=hash(n+7)，wave=.5+.5sin(clock×(2+3seed)+n×1.618)，density=.14+.78×(col/48)^1.6。若seed>density+.16sin(clock×1.8+col×.2)跳过。否则alpha=g×(.18+.72wave)×(.22+.78col/48)，颜色取色板floor(hash(n+211)×6)。在(col×8+1,row×8+.5)画圆角1.3方块，seed>.74时边长5.7，否则5.1；右密左疏并持续闪动。
- 放射Canvas640×390，卡片左-100、上-60，pointer-events:none，不裁切在轨道内。粒子中心(100+22+16+position/5×358,60+141+28)，实时跟随脑形。26条射线角度ray×2.399963，seed=hash(ray+94)，speed=15+24seed，每条7个方块。
- radius=27+((dot×13+clock×speed+seed×40)%87)+exp(-age×5)×dot×3；fade=(1-clamp((radius-27)/110,0,1))^1.6，pulse=.45+.55sin(clock×4+ray+dot)^2。方块位置=center+(cos(angle),sin(angle))×radius，seed>.65边长3，否则2；alpha=g×fade×pulse×(.4+.35exp(-age×5))，颜色依(ray+dot)%6循环。初次进入形成爆发，之后沿射线持续流动；离开Galaxy连同光晕和像素一起退去。

适配、清理和验收
- 使用ResizeObserver更新舞台缩放，不重置状态。375、768、1440宽下保留居中比例、完整底色，无水平溢出。Canvas全部内嵌，无远程素材、网络请求、字体依赖或真实模型调用。
- 同时遵循prefers-reduced-motion和组件reducedMotion选项。减少动态效果时立刻把位置和g吸附目标，保留六档和静态像素，取消文字动画、震动、放射流动，仍可鼠标/键盘/触屏选择；切换偏好不丢当前档位。
- 普通档位停稳后无RAF；Galaxy需要持续绘制。离屏或文档隐藏停止RAF，再可见时恢复，暂停时间不计入积分。实例销毁清理RAF、文字动画、ResizeObserver、IntersectionObserver、选项MutationObserver、媒体查询及窗口/文档监听器，删除实例DOM；支持卸载、重新挂载及同页两个实例。
- 交付框架入口、交互核心、样式/内嵌SVG、依赖说明和完整使用示例。测试六档拖拽、轨道点击、全套键盘、触屏、取消、快速反向、进入及离开Galaxy、帮助气泡、系统和选项减少动态效果、多实例、卸载。验证Galaxy像素随时间变化、普通档位停止动画、卸载后无残留，不能只验静态截图。`;
