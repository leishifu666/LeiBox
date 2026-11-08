export const IMAGE_ACCORDION_PROMPT = `制作「弹性图片手风琴」。把五张竖图裁成窄条横排。悬停或聚焦一张，它以弹簧动效打开，邻图也略微展开，远处图片让出宽度。整个横栏的外框始终不变。手机点按选中，再点同一张收起。

结构和画面
- #f4f4f4 背景上居中一条 340×300px 的横栏。窄于340px时等比缩小整个场景，不改变内部比例。横栏 display:flex、固定宽高、overflow:hidden、默认 gap 8px，允许0–20。横栏和每张卡片统一 border-radius=min(gap,12)；gap为0时方角连续拼接。
- 五张2:3竖幅复古北欧旅行摄影，按海边飞鸟、棕色高地牛、海岸红木屋、峡湾远眺者、渡轮候船队伍排列。独立创作并内嵌，画面主体尽量在每张正中。图片填满卡片，object-fit:cover，禁止原生拖动。无可见文字或遮罩，按钮的无障碍名称描述图片。
- 卡片是原生按钮，flex-basis:0、min-width:0、flex-shrink:1、overflow:hidden，无边框内边距。用 flex-grow 分配宽度，照片不参与最小宽度计算。焦点在图内显示2px轮廓。支持 images 传1–5张 {name,src}，更换图片后仍是同一340px横栏。

比例和弹簧
- 静止所有卡片 grow=1。活动索引 a，图片索引 i，令 s=.35+.009*reach。目标 T_i=100*exp(-((abs(i-a)/s)^2))。无活动卡时所有 T_i=0。reach 默认35，范围0–100。
- 每张有连续状态 value_i 和 velocity_i，都从0开始。grow=max(.05,1+(.4+.028*open)*value_i/100)。open 默认50，范围0–100。其余图同一帧让出宽度，无级联延迟。
- 同一个 RAF 时钟。dt 以1/60秒为单位，首帧取1，后续 dt=clamp((now-prev)/16.67,0,2.5)。t=bounce/100，k=.08+.16*t，decay=.62+.2*t。v=(v+(T-value)*k*dt)*decay^dt，value+=v*dt。bounce 默认10，范围0–100。目标距离和速度均小于.02时吸附到目标并清零。全部静止则停止RAF。更换目标从当前位置和速度续跑，避免中断跳位。

输入与交付
- 鼠标进入卡片即展开，移出横栏后恢复。用 pointerout 的 relatedTarget 判断是否仍在栏内；相邻卡片切换时不中途清空。触屏点按固定展开，再点同一张取消。Tab 聚焦展开，Enter/Space 可固定或取消，显示焦点。原生纵向滚动保留，touch-action:pan-y。减少动态时立即更新宽度。
- options 支持 open、reach、bounce、gap、images、reducedMotion。React、Vue、Svelte、Solid、Preact、Vanilla 共享同一 DOM 内核，用各自原生生命周期。更新参数保留弹簧状态；卸载时取消 RAF 和事件。验证五图总宽始终340、默认约61.6px均分、中央卡与邻居都有可见过渡、快速切换不中断、gap=0时内外圆角一致、触屏、键盘和双实例。`;
