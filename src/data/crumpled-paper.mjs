export const CRUMPLED_PAPER_PROMPT=`从零实现“揉皱纸张展开”可交互组件。三张米白纸团在鼠标移入时连续展开成手写信、蓝色山景照片和印刷信，移出时收回。纸面必须有细密折痕、薄纸卷边、哑光高光和随轮廓变化的落影；不能将纸团做成带尖刺的水晶球，也不能用两张图、视频或整页截图互相淡入代替网格形变。

布局与渲染
- 设计坐标1200×800，纯暖灰背景#e7e3db，无额外标题、边框或可见控件。中心(268,400)、(600,400)、(932,400)，整体缩放k=min(width/1200,height/800)。展开纸张296×374，边缘保留小于1px的不规则起伏。左右纸团约150×205，中间约185×185。
- 一个透明WebGL画布渲染三张纸，一个下层Canvas2D接收真实网格投影。纸面上叠三个透明语义button，范围随展开进度从168×218 / 184×185变为296×374，居中缩放k；焦点outline 2px #497687，outline-offset12px。画布aria-hidden，button有内容说明及aria-expanded。
- 禁止把颗粒、污渍或几条直线当成完整纸张材质。把彩色纸面图案、几何折叠、细皱褶法线及地面投影分开实现。三张面图可以先在Canvas2D/SVG中按下述内容生成，序列化成内嵌数据图像；最终组件包含全部像素，离线使用，不依赖任何外链、预先存在的图片或字体文件。

三张纸面图案，绘制分辨率1200×1500
- 纸底#f4f0e7，均匀极细纸纤维和低幅随机颗粒，局部明度变化不超过3%；不铺大块灰褐色圆形斑。正文墨色#435268或#44413b。手写字体Segoe Print / Bradley Hand / Comic Sans MS / cursive，签名Segoe Script / Brush Script MT / cursive；印刷Courier New / monospace，抬头Georgia / Times New Roman / serif。使用完整系统回退栈。
- 手写信：右上(1080,150)右对齐39px“14 October”。正文从(100,300)起，约44px手写、行距88px、段间额外24px，逐行“Dear Ada,”、空行、“I found your letter in the pocket of”、“my old coat — a little crumpled, but”、“every word still there.”、空行、“The lake was silver again this”、“morning. I walked the long way”、“round and thought of you.”、空行、“Come in spring? I’ll keep the kettle”、“warm and the window open.”。右下(730,1240)写40px“With love,”，(820,1390)写120px蓝灰斜体签名“June”。按可用高度适当收紧行距，保持正文不接触边缘。
- 蓝色照片：象牙白窄边框，照片区域(60,60,1080,1190)，下方留较宽空白写字。浅雾青天空，远山到近山依次#b6d6df、#8ac0d2、#5da5bf、#3387a7、#1b6e94、#18567f、#163d66；山脊有自然层叠的非规则波动和密集森林细纹，不是几条光滑正弦色带。可独立生成160个采样点的每层轮廓：x=60+i*1080/159，y=240+layer*135+sin(i*.035+layer*2.4)*95+sin(i*.09+layer)*32+sin(i*.27+layer*2)*7+seededRandom*9；闭合至y1250，裁切在照片区域。以蓝色半透明细竖线和点簇绘制树木，细节随远近递增。下边(92,1360)写45px手写“Blue Ridge, first light”，(1110,1360)右对齐27px“Oct. ’25”。
- 印刷信：顶部居中(600,150)40px衬线、宽字距“ATELIER NORD”，(510,180)-(690,180)1px短横线，下方(600,220)28px斜体“Paper & Print”。(1080,350)右对齐31px“12 October”。正文起点(120,430)，31px等宽、行距54px、段间额外26px，逐行“Dear Sam,”、空行、“Thank you for the drawings. They arrived”、“a little creased, which I think made them”、“better — paper remembers where it has been.”、空行、“The new prints are drying on the line.”、“I have set one aside for you; it has a small”、“fold in the corner I did not have the heart”、“to fix.”、空行、“Warmly,”。下面写72px蓝灰手写“Elin”、31px等宽“Elin Aro”。右下(920,1040)绘制约310×126px红色圆角空心邮戳，旋转-.15弧度，色#a6555d，粗边4px、略有磨损，文字“RECEIVED / 14 OCT”。

多尺度折痕材质
- 每张纸独立生成512×640高度场，固定mulberry32种子729+index*113；叠三层抖动三角网格，(列数,行数,高度幅度,边缘槽深)分别(11,14,2.4,.045)、(23,29,.52,.025)、(45,56,.10,.008)。内部网格点xy抖动±0.4格，边界不抖动；顶点高度为(random-.5)*2*幅度。
- 格子按奇偶交替拆成两三角形，扫描三角包围盒，用重心坐标插值顶点高度。最近三角边距离d由重心权重乘对应顶点到对边的高度求最小值；高度再减groove*exp(-d*d/1.1)，记录低幅边缘凹槽遮蔽。三层相加形成大小不一的平面折面，避免密集黑线网。
- 在纸高1/3和2/3加两道旧折线：d=y-640*(fold+(x/512-.5)*.006)，高度减.28*exp(-d*d/3.4)，加.13*exp(-(d-2.1)^2/4.8)，形成圆钝沟和偏移亮边。不要把折线画成粗黑分割线。
- 中央差分求dx、dy，分别乘512/296和640/374转为设计尺寸斜率，RG存128+100*斜率，B存凹槽强度，A255；线性采样、CLAMP_TO_EDGE。高度场同时给展开几何约.72倍的微起伏。
- 片元用dFdx/dFdy世界位置求每三角法线，以UV导数恢复切线和副切线；N=normalize(N-(T*slopeX+B*slopeY)*mix(.48,.95,p))。展开后仍保留皱褶，不能将所有法线混回纯平面。
- 图案先pow(rgb,2.2)转线性空间。主光normalize(-.30,-.48,.82)，辅光normalize(.7,.15,.6)。令key=max(0,dot(N,L))、fill=max(0,dot(N,F))，照明mix(.12+.91*key+.10*fill,.30+.67*key+.12*fill,p)。展开时额外加入低角度掠射光p*(max(0,dot(N,normalize(-.55,-.78,.32)))-.32)*.16，凸脊柔亮、凹槽柔暗。
- 闭合遮蔽.80+.20*smoothstep(-75,65,z)，随p趋向1；折槽额外乘1-groove*mix(.12,.055,p)。背面用象牙纸色(.961,.946,.905)混入正面图案4.5%，表现极轻透印。半角向量高光pow(max(0,dot(N,H)),38)*.045，最后pow(rgb,1/2.2)返回sRGB，形成哑光纸而非金属或塑料。

同一张三角网格连续形变
- 每纸32列40行，种子41、54、67；内部UV顶点抖动±.35格，边界保持连续。u,v范围0..1，展开F=((u-.5)*296+edgeU,(v-.5)*374+edgeV,heightField*.72+sin(7u+4v)*.5)，edgeU=.55*sin(33v+index)+.24*sin(63v)，edgeV=.55*sin(35u+index)+.26*sin(59u)。
- 闭合初始形状采用圆帽包裹：cu=u-.5、cv=v-.5、rho=hypot(cu,cv)、angle=4.82*rho；r=1+.65*(.12*sin(31u+10v+index)*sin(28v-8u)+.048*sin(65u-23v))。左右rx72、ry102，中间rx90、ry87，rz76；C=(sin(angle)*cu/rho*rx*r,sin(angle)*cv/rho*ry*r,cos(angle)*76*r)，rho为0时xy为0。加x偏移5.5*sin(18v+2index)，y偏移4*sin(17u+index)。
- front=max(0,cos(angle*.65))，z再加front*(17*sin(25v+1.8*sin(12u))+9*sin(34u-7v))，x加5*front*sin(25v+15u)，y加5*front*sin(25u-11v)，形成连贯褶皱而非独立随机尖刺。
- 中间照片中心压入34*exp(-((u-.55)^2+(v-.46)^2)/.025)。右边缘curl=clamp((u-.78)/.22,0,1)、t=curl*curl*(3-2curl)，用t将C混到(66+22*cos(4.7124curl)+5*sin(26v),(v-.5)*164+6*sin(31v),90+17*sin(28v)+10*sin(πcurl))，让白边翻到蓝色照片前方。
- 生成全部三角边约束，去重后每条静止长度为UV平展边长*1.48。运行260轮位置约束，每轮交替遍历方向：d=Q-P，correction=d*(length(d)-rest)/length(d)*.42，P加correction，Q减correction。每轮将超出椭球的顶点向内投影68%，椭球左右半径(76,108,84)，中间(94,94,84)。保持三角边长度的局部余量自然折成小面，而不是缩成光滑球；不需要模拟真实纸纤维或导入模型库。
- 全部顶点身份、UV和三角拓扑不变，位置mix(C,F,p)，z额外加sin(pπ)*sin(8u+11v)*13。局部透视1000/(1000-z)，再乘k并加中心；裁剪坐标x=screenX/width*2-1、y=1-screenY/height*2、z=-z/400。深度测试LEQUAL、不剔除背面，屏幕y向下所以正面绕序CW。

真实轮廓落影
- 先将同一张网格投影到地面，above=max(0,z+mix(80,9,p))，xy加(.23,.30)*above，投影不施加相机透视，颜色(.17,.145,.11)。将透明WebGL结果复制到下层2D画布，叠加4k像素模糊、透明度.17及9k像素模糊、透明度.07，再清空WebGL并渲染彩色纸面。
- 纸团影子随折角和翻边变化，展开后自然变成长方形边缘软影。不要用固定椭圆冒充投影，不在文字上叠屏幕坐标阴影。

输入、运动与生命周期
- 鼠标移入一张纸只展开该项，其余收回，移开后收回。每纸p初始0、速度v0，目标t=0或1。dt=min(.032,elapsedSeconds)，每帧3子步：v+=((t-p)*210-26*v)*dt/3，p+=v*dt/3；误差<.0002且速度<.002时吸附。渲染p限制0..1，约.5.. .7秒，可随时反转，不能中断后重生成网格。
- Tab聚焦展开，失焦收回；左右箭头循环三项，Enter/Space切换，Escape收起。触屏tap切换；pointerdown先标记touch，focus不得提前展开造成同次点击双切换。桌面click保持hover的展开状态。焦点与aria-expanded同步。
- prefers-reduced-motion或options.reducedMotion开启时直接绘制目标；不依赖下一次RAF才完成。闲置停止RAF，激活、调整尺寸或图像解码完成时再绘制。DPR上限2，观察容器尺寸而非只看窗口。
- 三张数据图像全部解码并实际绘制后才发首帧ready；首帧前保留外部封面。图像异步解码时检查实例是否已销毁，卸载清空onload/onerror、移除src，禁止创建新的GPU资源。卸载取消RAF、ResizeObserver、所有监听器，删除顶点缓冲、彩色/折痕纹理和program，释放WebGL上下文。多实例相互隔离。WebGL不可用时用Canvas2D展示纸张并保留按钮交互。
- 输出所选框架的原生组件入口、框架无关核心、完整样式、内嵌数据图像、安装和使用说明，全部可离线运行，不用iframe作为组件。不要添加登录、支付或其他后端。

验收
- 视觉检查三纸闭合、三纸分别展开、细折痕与字体/照片、白边翻卷、软影及中途反转；纸面内容全程附着同一网格。与单纯功能测试分开判断材质效果。
- 实测鼠标、焦点、键盘、触摸、减少动态效果、多实例、尺寸更新和快速卸载重挂。375/768/1440不横向溢出，闲置无持续动画，首帧不闪白，卸载无延迟绘制或GPU残留。`;
