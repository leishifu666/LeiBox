import {RADIAL_ACTIONS} from './staggered-radial-menu.mjs';

export const SOFT_WHEEL_ACTIONS=RADIAL_ACTIONS.map(({key,label,shape})=>({key,label,color:'#f8f8f8',shape:shape.replaceAll('stroke="white"','stroke="#000"')}));

export const SOFT_ACTION_WHEEL_PROMPT=`从零实现“柔光环形菜单展开”：浅灰背景中央的柔白圆按钮，点击加号后，六个黑色图标圆按钮以很短的顺时针间隔从外围收拢成环，弹性过冲再停稳；点击关闭后，六项同时向外散开并模糊淡出。保留细灰边、内侧白高光、轻薄的下方阴影和灰色关闭符号。场景只包含这组控件。

布局和材质
- 基准960×960画布，纯色背景#f1f1f1。舞台960×960，在容器中按k=min(width/960,height/960)等比居中，背景填满。没有可见标题、文字标签、说明、装饰线或业务界面。
- 中心(480,480)，主圆按钮194×194，左383上383。周围六圆按钮178×178，基准左391上391；停稳半径224，角度从-90度开始每项增加60度。对应圆心约(480,256)、(674,368)、(674,592)、(480,704)、(286,592)、(286,368)。所有圆面保持正圆，不能随容器挤成椭圆。
- 圆面border:1px solid transparent，双背景：linear-gradient(180deg,#fff 0%,#f3f3f3 2%,#f9f9f9 60%,#f9f9f9 98%,#fff 100%) padding-box，以及conic-gradient(from 0deg,#c9c9c9,#7c7c7c 25%,#b5b5b5 50%,#7c7c7c 75%,#c9c9c9) border-box。圆角50%，外影0 14px 24px rgba(0,0,0,.055)。白色内高光直接绘在填充首尾的细窄色带内，避免模糊的白色内阴影冲淡侧边灰线。边线很细，左右略深，上下较亮；不得改成厚边、亮光描边或大块深灰卡片。
- hover只改变圆面光照：160度#dedede到#ededed的内填充，保留同一细边；阴影inset 0 1px 8px rgba(0,0,0,.035)、inset 0 -1px 1px #fff、0 7px 15px rgba(0,0,0,.04)。active内填充#d9d9d9到#e9e9e9。按钮和图标没有hover位移或缩放。
- 主按钮加号由两条60×12、圆端半径7的黑条组成，颜色#030403，60×60容器居中；水平条left0/top24，竖条旋转90度。展开旋转45度变×，并将整体opacity从1降到.6；回弹时旋转可略超过45度，透明度使用clamp后的进度。关闭恢复0度与opacity1。主圆本身不旋转、变形或缩放。

完整本地图形
- 顺时针无障碍名称/动作键依次Mail/mail、Photos/photos、Notifications/notifications、Messages/messages、Calendar/calendar、Compose/compose，视觉不显示这些文字。
- 每个SVG为100×100，viewBox 0 0 100 100，默认fill:#000，aria-hidden=true；圆按钮的--rm-color为#f8f8f8，供信封V形浅色切口使用。图形数据如下，shape直接作为SVG内部内容，不需要外部图片、图标库或字体：
${JSON.stringify(SOFT_WHEEL_ACTIONS)}
- 信封为黑色圆角面与浅色V线；相框为黑色圆框、太阳和山；铃铛、对话泡、点阵日历、笔均是黑色圆润实心符号。不要用细线图标替代。

状态和运动
- 六项各自保存position、velocity、opacity、blur、fromOpacity、fromBlur、elapsed、delay。初始position=0、velocity=0、opacity=0、blur=24，目标closed=0/opened=1。主加号旋转单独保存position、velocity，初始0。
- 打开时每项延迟i*.015秒，总错峰75ms；顺序Mail到Compose。关闭时六项无延迟同时启动。中途反向时全部取消新增延迟，从当前实际位置、速度、透明度、模糊继续，不重置到端点，不排队等待上一轮结束。
- 一个RAF循环，只在变化时运行。dt=min(.032,elapsedSeconds)，各项elapsed累计dt；未到delay保持原样。开始后activeDt=min(dt,elapsed-delay)，将activeDt分3子步。每子步velocity+=((target-position)*stiffness-velocity*damping)*activeDt/3，position+=velocity*activeDt/3。打开刚度204.0625、阻尼15.5，关闭刚度820、阻尼57；误差<.0001且速度<.002时吸附目标。
- 圆心半径radius=450-226*position，按固定角度x=cos(angle)*radius、y=sin(angle)*radius绘制translate，允许position超过1带来向内过冲，再回弹到224。初始和关闭目标半径450，按钮从外围进入，不从中心按钮内部长出来，也不整体转动外圈。
- 切换时记录当前fromOpacity/fromBlur。令t=elapsed-delay，s(u)=clamp(u,0,1)^2*(3-2*clamp(u,0,1))。opacity=fromOpacity+(target-fromOpacity)*s(t/(opened?.1:.15))；blur=fromBlur+((opened?0:24)-fromBlur)*s(t/(opened?.15:.13))。低于.01px的blur直接设filter:none；opacity<=.001时visibility:hidden。目标不可见时立即关闭交互，不等淡出结束。
- 旋转使用相同打开/关闭刚度与阻尼，直接将整帧dt分3子步，不加交错延迟；angle=45*position，opacity=1-.4*clamp(position)。停稳之后停止RAF，保留实际可操作状态。

输入、语义和本地行为
- 中央真实button，aria-label为Open actions或Close actions，aria-haspopup=menu，aria-controls关联唯一菜单ID，aria-expanded立即反映目标。菜单role=menu，aria-label=Quick actions，六按钮role=menuitem，使用上述英文aria-label。
- closed时菜单inert；每项在opened=false或opacity<.95时自身inert且pointer-events:none，避免隐藏控件挡住中央按钮。单一roving tabindex。
- 鼠标click和真实触屏tap切换；不叠加touchstart与click。Enter/Space打开并在首项显现后聚焦Mail；中央方向下/右打开聚焦首项，上/左聚焦末项。菜单右/下顺时针一项、左/上逆时针一项，Home/End首末，Escape关闭并还焦点；目标尚未显现时等opacity>=.95再聚焦。Tab离开舞台或点击按钮以外空白时关闭。
- focus-visible使用5px #626aa6轮廓、offset9，中央可用#8c9cff；不增加悬浮工具条或可见业务文案。
- 六项只更新本地选择与隐藏aria-live提示，发出radial-menu-action事件，detail.action为动作键，bubbles/composed为true，然后关闭并还焦点。不访问相机、文件或麦克风，不发邮件、不上传、不请求后端。

适配与交付
- ResizeObserver只重算舞台缩放，不重置状态，支持options.height。系统prefers-reduced-motion及options.reducedMotion开启时，六项和旋转同步吸附目标并绘制，不等下一帧，输入仍可用。
- 多实例隔离DOM、ID、状态和输入。卸载取消RAF与ready帧，断开ResizeObserver和选项MutationObserver，移除媒体查询、文档、窗口和控件监听。没有闲置计时器或卸载后回调。
- 初次布局实际绘制后才通知ready。全组件不用图片、字体下载、远程资源或后端；辅助文本字体Arial/Helvetica/sans-serif。
- 提供所选框架完整源码、依赖、安装及使用示例，使用原生生命周期绑定框架无关DOM核心，不用iframe或运行时字符串求值冒充组件。
- 验收初始、打开过冲、稳态、同时散开、快速反向与重复点击；实际采样位置、模糊和透明度随时间变化。测试触屏、键盘、六动作、减少动态效果、375/768/1440、多实例和卸载清理。`;
