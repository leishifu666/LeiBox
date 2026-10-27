export const NOTES_TEXT = [
 'Mon. Client call at 11. Drink coffee before it this time',
 'Feedback from Yaroslav: make the logo bigger. Also smaller. Ideally both by Friday',
 'Ideas I’ll never ship: a calendar that cancels meetings for you. A Figma plugin that renames every Frame 2847',
 'Thing I keep relearning: nobody reads the case study. People read the first line and look at the pictures, so that’s where the time goes ◉',
 'Rent due on the 5th. Dentist on the 9th, don’t move it again. Renew the portfolio domain, it lapsed last year',
 'Note to self: the good idea usually shows up on the walk home. Take the long way and write it down before the crosswalk',
 'Remember to send the proposal. Keep it simple, then make it a little better tomorrow.',
];
export const NOTES_COLORS = [
 {id:'white',name:'White',ink:'#eeeeef',center:'#d0d3db',color:'#e5e7ed',edge:'#ffffff'},
 {id:'rose',name:'Rose',ink:'#f38aa7',center:'#ef4265',color:'#f57191',edge:'#ffb1c8'},
 {id:'yellow',name:'Yellow',ink:'#e6cf67',center:'#c9a522',color:'#e1c54b',edge:'#fff0a3'},
 {id:'green',name:'Green',ink:'#77f172',center:'#16df19',color:'#4beb40',edge:'#b2ff91'},
 {id:'cyan',name:'Cyan',ink:'#80e9e6',center:'#11bfc4',color:'#4ae3df',edge:'#a4fff1'},
 {id:'blue',name:'Blue',ink:'#9c86f3',center:'#3e18e7',color:'#6943ef',edge:'#a790ff'},
 {id:'purple',name:'Purple',ink:'#b17ee6',center:'#8e08ce',color:'#a637e7',edge:'#d59aff'},
 {id:'pink',name:'Pink',ink:'#e68dd4',center:'#dd4eb2',color:'#ed82d2',edge:'#ffc2ee'},
];
export const NOTES_TEXT_COLOR_PROMPT = `实现“文字选区调色器”：一个可真实选择文字、跨行改变文字颜色的深色备忘录演示，重点是紧凑的磨砂悬浮调色器和选区颜色反馈。

画面与布局
- 基准场景900×1080，背景#08090a，中心带极弱的墨绿黑径向渐变。居中一台400×844的手机，以1.17倍展示，外壳圆角62、2px #444447描边、9px内边距、黑灰金属渐变和底部柔和阴影；左右有细长侧键。内屏圆角49，背景#111113。外层按容器比例等比缩小，保持完整手机，不横向溢出。
- 顶部状态栏51px高，左侧9:41、中央120×35黑色胶囊，右侧手机信号、Wi-Fi和电量。图标用已安装的图标库或CSS绘制，不加载图片。下面43px导航：左侧灰色返回箭头及Notes，中间粗体Next week plans，右侧Done。字号14，底部132×4灰白色Home横条。
- 文字滚动区距内屏顶部112、底部35，左右25，正文20px/25px、字距-.1px，字体Arial, Helvetica, sans-serif；苹果平台可用-system-ui作为回退。顶部与底部54–66px渐隐遮罩，隐藏滚动条，滚动只在备忘录内发生。初始滚动65px。
- 正文按顺序提供完整段落：“Mon. Client call at 11. Drink coffee before it this time”；“Feedback from Yaroslav: make the logo bigger. Also smaller. Ideally both by Friday”；“Ideas I’ll never ship: a calendar that cancels meetings for you. A Figma plugin that renames every Frame 2847”；“Thing I keep relearning: nobody reads the case study. People read the first line and look at the pictures, so that’s where the time goes ◉”；“Rent due on the 5th. Dentist on the 9th, don’t move it again. Renew the portfolio domain, it lapsed last year”；“Note to self: the good idea usually shows up on the walk home. Take the long way and write it down before the crosswalk”；“Remember to send the proposal. Keep it simple, then make it a little better tomorrow.” 段落间距25px。初始第四段清晰，其余段落整体透明度.15及blur(.35px)，点击或选择某段时该段恢复清晰、其他段压暗，160ms power2.out。bigger预置黄色，smaller预置青色，Frame 2847预置紫色，Rent和Dentist预置粉色。

选区与调色器
- 正文必须是真实可选择的DOM文字。用浏览器Selection/Range读取开始和结束字符偏移，支持鼠标拖选、双击单词和跨行选取，不用预制按钮代替文字。按全局字符偏移持久化每个字符的颜色，只在新选区边界拆分文字节点，连续切色直接更新现有span的颜色，不能反复替换段落。必要时用Selection.setBaseAndExtent一次恢复原Range，不先清空选区。支持跨段落，不依赖HTML字符串注入用户文字。
- 选区用Range.getClientRects取得真实行框，合并同一行相邻矩形，绘制半透明色块，圆角2。初始白色高亮透明度.2，切色后用对应文字颜色约.32透明度。高亮块、首尾手柄和最近选区条目在切色时保留节点身份，只更新颜色及必要坐标，不清空重建覆盖层。选区首尾各有1px白色竖线和7px白色圆点，起点圆点在上方、终点圆点在下方。手柄可鼠标或触屏拖动，依据光标命中位置调整字符边界。
- 选区形成后，180×84调色器出现在选区第一行上方约102px，多行选区水平居中于手机，单行依据选区中心定位，限制在手机内12px边界，空间不足时翻到下方。底部16px旋转方块形成8px小尖角，并跟随选区实际中心。背景从#353638e8到#242527f5，圆角16、1px极淡内描边、blur(18px) saturate(1.4)磨砂，0 9px 24px #0006阴影。
- 调色器内边距12，左侧3×3色点，每个17×17、间距6，右侧间距9后为85px最近选区列表。八种颜色按行：白、玫红、黄；绿、青、蓝；紫、粉、彩虹自定义。文字色依次#eeeeef/#f38aa7/#e6cf67/#77f172/#80e9e6/#9c86f3/#b17ee6/#e68dd4。色点为中心深、边缘亮的径向渐变及极弱彩色光晕，不是平涂实心圆；选中态外扩3px细灰白圆环。
- 第九个色点是彩虹色环，中间挖成#292a2e。点击展开面板底部的彩虹色相滑块，0–360度，拖动实时设置hsl(hue 76% 72%)。此项是可用性的补全；关闭后恢复紧凑面板。
- 右侧四行最近选区，各13px高、3px行距、4px圆角、7.2px文字，左侧2×7颜色短条。初始记录Frame 2847、bigger、smaller、Rent。当前选区置顶、白色清晰，其余三行半透明、.35px轻微模糊，尾部渐隐。重新选中相同范围仅置顶不重复记录；点击记录会滚动到那段文字并恢复该范围选区。颜色变更同步更新记录短条，不改变选区范围。

运动与状态链
- 使用GSAP，选区形成到面板出现约180ms，从opacity0、scale.82、y7到1/1/0，back.out(1.45)，变换原点在尖角。关闭140ms power2.in，scale.92、y3；保留同一个面板节点，快速重选与关闭立即覆盖旧动画，不闪烁或残留隐藏控件。
- 切色立即更新持久颜色与高亮，选中文字仅用140ms power1.out平滑过渡颜色；不改变字距、字号、行高或文字几何，不播放发光脉冲。快速换色从当前可见颜色接续，不能闪回旧颜色。选中色点从scale.9回到1，180ms back.out(2)。保持所有文字、下方段落、选区手柄和调色器位置稳定，不做按钮悬停上浮或图标位移。
- 点击正文其他位置、Done或Escape关闭并移除选区手柄，颜色保留。Notes重置演示和历史。滚动/容器缩放更新选区矩形与面板锚点，滚到不可见时关闭。仅当前实例内处理事件。

键盘、触屏和生命周期
- 每个段落可聚焦，Enter选择整段并聚焦调色器，Control/Command+A只选择当前段；方向键在八色和自定义色之间移动焦点，Home/End跳到首末，Enter或Space应用，Escape关闭并返回段落。面板有dialog语义、颜色按钮radio和aria-checked、最近选区为有明确名称的按钮，屏幕阅读器实时播报颜色和选中文字。
- 触屏轻触有颜色的文字可恢复该词选区，长按380ms选择命中单词；移动超过8px取消长按以保留滚动。原生文本选择可用，手柄拖动采用pointer capture并正确释放，不能阻塞普通滚动。
- 减少动态效果时即时切换但保留选择、调色、历史、键盘和触屏。无联网、保存或同步后端，不加载远程字体与素材。支持同页多个独立实例，卸载时只清理自身Range、GSAP、计时器、监听器和观察器。验证拖选跨行、连续换色、历史回跳、快速开关、自定义色、键盘、触屏、减少动态效果和重新挂载。`;
