// Icon paths: Lucide Contributors, ISC; full notice is embedded by the package builder.
export const FLOOD_ICON_BODIES={
 rocket:'<path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09"/><path d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05"/>',
 zap:'<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
 palette:'<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>',
 globe:'<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
 aperture:'<circle cx="12" cy="12" r="10"/><path d="m14.31 8 5.74 9.94"/><path d="M9.69 8h11.48"/><path d="m7.38 12 5.74-9.94"/><path d="M9.69 16 3.95 6.06"/><path d="M14.31 16H2.83"/><path d="m16.62 12-5.74 9.94"/>',
 clapperboard:'<path d="m12.296 3.464 3.02 3.956"/><path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3z"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="m6.18 5.276 3.1 3.899"/>',
 layers:'<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>',
};
export const FLOOD_ICONS=Object.fromEntries(Object.entries(FLOOD_ICON_BODIES).map(([name,body])=>[name,`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`]));
export const FLOOD_PALETTES=[['#0b2a5c','#3b8cff','#cfe4ff'],['#2b0b40','#a34dff','#ead9ff'],['#5a1670','#ef5bd8','#ffd1f3'],['#003c34','#19c7a0','#c6fff0'],['#4a2600','#ffa22b','#ffe9c9']];
export const FLOOD_ITEMS=[
 {title:'Instant deploys',description:"Push to main and it's live worldwide before the kettle boils.",icon:'rocket'},
 {title:'Edge functions',description:'Run code a few milliseconds from every visitor, not an ocean away.',icon:'zap'},
 {title:'Design tokens',description:'One source of colour, type and spacing that every surface reads from.',icon:'palette'},
 {title:'Global CDN',description:'Assets cached in hundreds of cities and purged in under a second.',icon:'globe'},
 {title:'Media pipeline',description:'Images and video resized, compressed and served in the right format.',icon:'aperture'},
 {title:'Preview links',description:'Every branch gets its own URL, so reviews happen on the real thing.',icon:'clapperboard',colors:['#3a0a0a','#ff4d3d','#ffd2c2']},
];
export const SHADER_FLOOD_PROMPT=`创建可运行的“液体注入卡片”组件。

布局和内容
外层默认白色、最小高度720px、四边48px留白，居中最大1024px的3列2行卡片网格，间隔16px。容器宽度不足900px将场景留白改24px，不足740px改2列，不足570px改1列；自然增高，不裁掉末行。每卡最小256px高、圆角28px、1px #e4e4e7 边线、#fafafa 底色、内边距28px。顶部48px正方形白色图标盒，圆角16px，极轻内描边和阴影；图标24px、线宽2、圆端点圆连接。图标和文字不位移。文字区 margin-top:auto、padding-top:40px；标题24px/32px、600、字距-.6px，正文15px/24px、400、上间距8px。无衬线字体 ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif。闲置标题#18181b，正文#71717a；展开时标题白色，正文白色80%，颜色过渡200ms。键盘焦点有2px灰色外轮廓、偏移4px。深色变体使用#09090b场景、#18181b卡片、#27272a边线、#f4f4f5标题、#a1a1aa正文。
默认六项内容与图标键：${JSON.stringify(FLOOD_ITEMS)}。
五组内置三色色板按深、中、浅排序并循环：${JSON.stringify(FLOOD_PALETTES)}。items数组每项为{title,description,icon,colors?}，colors为三个十六进制颜色；省略时按索引循环内置五组；第六演示卡明确使用红色。icon支持rocket、zap、palette、globe、aperture、clapperboard、layers，未知值显示layers。标题和正文用textContent写入。

图标完整几何
以下SVG主体均置于viewBox="0 0 24 24"，fill="none"、stroke="currentColor"、stroke-width="2"、stroke-linecap="round"、stroke-linejoin="round"的SVG中：${JSON.stringify(FLOOD_ICON_BODIES)}。

鼠标、轻触与键盘状态
每张卡保留独立progress∈[0,1]、target、from、origin、started、duration。pointerover首次进入卡时，以事件位置换算到卡内归一化坐标作为origin，target=1；pointerout真正离开时将出界位置夹到[0,1]，以该离开点为新origin、target=0。内部图标或文字间移动不重启动画。圆形遮罩半径 r=progress×1.5×sqrt(w²+h²)/sqrt(2)，圆心=origin×卡片宽高，同时裁切28px圆角和1px内缩边界。进入520ms，离开420ms，三次easeOut=1-(1-t)^3；从当前progress重新插值，快速进入、离开和折返不中断为0或1。邻卡交接时旧卡排空、新卡注入可并行。圆形边界平滑清楚，内部液体纹理独立流动。
移动端点击卡片从落点展开，第二次点同一卡收起，点另一卡先收前一张；允许垂直滚动，不捕获拖动。点组件外部收起。Tab聚焦时从中心展开，失焦收起；方向键依次导航，Home/End定位首尾，Enter/Space切换，Escape收起但保留焦点。aria-pressed与目标状态同步。减少动态效果时遮罩立即就位，纹理固定时间0，全部操作保留。

独立实时液体算法
用一个透明WebGL1画布覆盖整组卡片，逐卡设置viewport与scissor，仅绘制展开中或排空中的卡片。单一程序和单一动画循环；文字与图标为画布上方真实DOM，卡片底色在其下方。使用带导数扩展的片元着色器，2D value noise的格点hash为q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);fract((q.x+q.y)*q.z)，格内插值f=f*f*(3-2*f)。四层fbm振幅从.533开始每层减半，坐标用矩阵(.8,.6,-.6,.8)旋转后乘2.03并加(4.7,1.3)。像素坐标uv居中并按宽高比修正，乘2.4，加(seed*.173,seed*.097)。令t=运行秒数*.15，q向量两分量分别计算fbm(p+(t*.22,-t*.17))与fbm(p+(5.2,1.3)+(-t*.18,t*.23))后减.5；r两分量为fbm(p+3.3q+(1.7,9.2)+t*.13)与fbm(p+3.3q+(8.3,2.8)-t*.12)后减.5；field=fbm(p+3.0r+1.0q)。f=smoothstep(.17,.77,field)，先以smoothstep(.05,.57,f)在深、中色间混合，再以pow(smoothstep(.72,.99,f),1.7)*.58混入浅色。slope=length(dFdx(field),dFdy(field))*卡高*.17；以(1-smoothstep(.006,.034,abs(field-.43)))*.88加上(1-smoothstep(.003,.018,abs(field-.59)))*.24计算细褶皱，将颜色混向深色*.28，权重上限.94，补pow(max(0,1-slope*2),8)*.025倍浅色高光；底部向顶部的亮度为mix(.24,1.12,smoothstep(-.08,1,uv.y))。圆角与圆形距离边缘各做约1.3px抗锯齿。形态是持续流动的彩色大理石与深色细褶皱，不用图片、视频或静态渐变冒充着色器。
seed默认0，每卡实际种子=seed+索引*7.31，更新seed只改变形态，不能改色板或文案。speed默认1，范围0..3，0冻结纹理但保留遮罩操作。实时纹理与遮罩使用独立时间，帧间dt上限.08秒。画布按实际显示尺寸分配，DPR不超过1.5；所有卡闲置、离屏、页面隐藏时停RAF。显卡不可用或丢失时换成标明canvas2d的回退：同样的圆角与圆形裁切、三色渐变、随时间缓慢变形的透明曲线褶皱；交互保持可用，不将回退称为同一着色器。

API与实现约束
支持options.items、seed、speed、theme(light/dark)、background(十六进制色)、height、reducedMotion。同页实例互不干扰；动态更新items重建DOM和色板，使用事件委托避免旧卡监听器堆积。更新尺寸同步viewport/scissor和坐标，灰色列表缩略图场景仍应铺满背景。卸载取消RAF、移除事件、断开观察器、释放WebGL程序/缓冲/上下文；重新挂载恢复默认状态。无后端、无外部字体、无远程媒体。分别提供所选框架原生生命周期入口和完整可复制的实现。

验收
从四边进入、四边离开、快速折返、跨卡切换、触屏轻触、键盘与减少动态效果均实测；截图比较idle、局部注入、满卡、排空状态，并验证真实纹理随时间变化。自定义色板和seed独立更新；多实例、卸载后无帧循环、缺少WebGL仍可用。375/768/1440宽无横向溢出，全部卡片可访问。`;
