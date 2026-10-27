/** Standalone visual and behavioral specification; no external asset prerequisites. */
export const BLUE_FLUTED_GLASS_PROMPT = String.raw`创建一个名为 Blue Fluted Glass Background（蓝色棱纹流动背景）的独立实时动效组件。画面只有缓慢形变的蓝白流体、竖向磨砂玻璃棱纹和固定的白色 LeiBox 矢量标志。不能播放视频或用静态图片交叉淡入代替连续形变，也不要添加宣传标题、导航、卡片或设置面板。以下数值为本实现的完整重建规格。

布局与视觉
- 默认场景 1200×833px，填满容器，position:relative、overflow:hidden、isolation:isolate、背景 #f4f4f4。独立展示时场景填满视口；嵌入时由 height 控制。场景固定比例缩小时内容一起缩放；支持 375 / 768 / 1440px，不出现横向滚动。
- Canvas 绝对铺满底层，CSS filter:blur(1.25px)、transform:scale(1.008) 保持边缘不漏底。实际分辨率等于布局宽高乘 min(devicePixelRatio,1.5)。程序化场景不需要字体、图片或素材下载。
- Logo 水平垂直居中，宽度为场景的22%，宽高比603.900954:208，白色，pointer-events:none，drop-shadow(0 1px 3px #00132e20)。Logo 保持固定，不受棱纹折射、流体移动或鼠标位置影响；保持图标与字标的真实比例，不用普通字体重打品牌名。
- 完整矢量如下，可在生成的组件中内嵌；所有 path 与分组变换均为本规格的一部分：
<svg class="bfg-logo" width="603.900954" height="208" viewBox="0 0 603.900954 208" role="img" aria-label="LeiBox"><title>LeiBox</title><g fill="currentColor"><g transform="scale(0.499071) translate(-63.742 -47.613)"><path d="M212 59.403 A88 88 0 0 1 300 59.403 L404.258 119.597 A88 88 0 0 1 448.258 195.807 L448.258 316.193 A88 88 0 0 1 404.258 392.403 L300 452.597 A88 88 0 0 1 212 452.597 L107.742 392.403 A88 88 0 0 1 63.742 316.193 L63.742 195.807 A88 88 0 0 1 107.742 119.597 Z M247 273.618802154 L247 392.618802154 A27 27 0 0 0 287.5 416.001488056 L390.55702305 356.501488056 A27 27 0 0 0 363.55702305 309.736116252 L301 345.85343035 L301 273.618802154 A27 27 0 0 0 247 273.618802154 Z" fill-rule="evenodd"/></g><g transform="translate(235.900954 60)"><path d="M0 8 A8 8 0 0 1 16 8 V77 A7 7 0 0 0 23 84 H48 A8 8 0 0 1 48 100 H23 A23 23 0 0 1 0 77 Z" fill-rule="evenodd"/><path d="M123.944409 85.395136 A38 38 0 1 1 129.032923 47.27946 A8 8 0 0 1 114.282219 53.477582 A22 22 0 1 0 111.336237 75.544552 A8 8 0 0 1 123.944409 85.395136 Z" fill-rule="evenodd"/><path d="M75.097844 82.27721 L152.097844 44.27721 A7 7 0 0 0 145.902156 31.72279 L68.902156 69.72279 A7 7 0 0 0 75.097844 82.27721 Z" fill-rule="evenodd"/><path d="M142 38 A7 7 0 0 1 156 38 V100 H142 Z" fill-rule="evenodd"/><path d="M140 10 A10 10 0 1 1 160 10 A10 10 0 1 1 140 10 Z" fill-rule="evenodd"/><path d="M0 0 H33 C52 0 62 10 62 25 C62 36 55 43 47 46 C60 49 64 57 64 71 C64 90 53 100 33 100 H0 Z M16 15 H32 C42 15 47 20 47 28 C47 36 42 40 32 40 H16 Z M16 54 H32 C44 54 51 58 51 70 C51 81 43 85 32 85 H16 Z" fill-rule="evenodd" transform="translate(168 0)"/><path d="M236 62 A36 38 0 1 1 308 62 A36 38 0 1 1 236 62 Z M252 62 A20 22 0 1 1 292 62 A20 22 0 1 1 252 62 Z" fill-rule="evenodd"/><path d="M304 24 L322 24 L336 48 L350 24 L368 24 L345 62 L368 100 L350 100 L336 76 L322 100 L304 100 L327 62 Z" fill-rule="evenodd"/></g></g></svg>
- 字体回退栈 system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif；画面本身没有需要渲染的正文。

连续流体与折射算法
- WebGL 1 渲染全屏矩形：顶点坐标[-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]，顶点着色器只把二维 position 写入 vec4(position,0,1)。上下文 alpha:false、antialias:false、depth:false、preserveDrawingBuffer:true。
- time 单位为秒。相位 time×2π/28，所有低频形变使用相位的整数谐波，使28秒周期边界连续；不是随机重生成的色团。图形包括纵向主脊、顶部蓝色冠部、底部弯曲带、乘性浅色空洞；多层连续高斯密度形成平滑折叠。
- 71根等距竖向棱纹固定在屏幕坐标上。每条棱纹通过fract(x×71)-0.5获得横向局部坐标，真实改变流体采样位置；不能只在渐变上盖透明竖线。包含Canvas的1.008倍边缘放大后，1200px展示宽度下棱纹周期约17.04px，1920px下约27.26px。蓝色区域才出现轻微棱面亮暗。五次竖向采样权重0.40、0.24、0.24、0.06、0.06，偏移0、±0.025、±0.055，得到柔化的玻璃材质。
- 使用以下完整 fragment shader；resolution 为实际Canvas像素宽高，time 为累计有效播放秒数：
precision highp float;
uniform vec2 resolution;
uniform float time;
float blob(vec2 p,vec2 center,vec2 radius,float angle){
  p-=center;float c=cos(angle),s=sin(angle);
  p=mat2(c,-s,s,c)*p/radius;
  return exp(-dot(p,p));
}
vec3 fluid(vec2 p,float t){
  float s=sin(t),c=cos(t);
  p.x+=.025*sin(p.y*7.0+t*2.0);
  float trunk=blob(p,vec2(.52+.15*s-.07*sin(t*2.0),.76),vec2(.235,.46),-.12-.52*s);
  float crown=blob(p,vec2(.77-.55*s,.20-.10*sin(t*2.0)),vec2(.235,.23),-.50+.45*s);
  float baseY=1.045-.17*p.x+.075*sin(p.x*5.0+t*2.0);
  float base=exp(-pow((p.y-baseY)/.092,2.0));
  float hole=blob(p,vec2(.85-.55*s,.59-.13*s),vec2(.19+.025*c,.32),.1+.5*s);
  float density=(trunk+.56*crown+.90*base)*(1.0-.78*hole);
  vec3 color=mix(vec3(.957),vec3(.66,.80,.89),smoothstep(.015,.20,density));
  color=mix(color,vec3(.10,.48,.73),smoothstep(.16,.49,density));
  color=mix(color,vec3(.015,.135,.28),smoothstep(.40,.73,density));
  color=mix(color,vec3(.008,.025,.087),smoothstep(.62,.93,density));
  return color;
}
void main(){
  vec2 uv=vec2(gl_FragCoord.x/resolution.x,1.0-gl_FragCoord.y/resolution.y);
  // The lenses refract the fluid itself; they are not an opacity stripe overlay.
  float rib=fract(uv.x*71.0)-.5;
  vec2 refracted=uv+vec2(rib*.018,(rib*rib-.0833)*.034);
  float t=time*6.28318530718/28.0;
  vec3 color=fluid(refracted,t)*.40;
  color+=fluid(refracted+vec2(0.,.025),t)*.24;
  color+=fluid(refracted-vec2(0.,.025),t)*.24;
  color+=fluid(refracted+vec2(0.,.055),t)*.06;
  color+=fluid(refracted-vec2(0.,.055),t)*.06;
  float edge=pow(abs(rib)*2.0,10.0);
  float blue=(1.0-color.r)*smoothstep(.02,.18,color.b-color.r);
  color+=vec3(.018,.025,.03)*(rib*.65+edge*.24)*blue;
  gl_FragColor=vec4(clamp(color,0.0,1.0),1.0);
}
- 色板由着色器连续混合：#f4f4f4、RGB(168.3,204,226.95)、RGB(25.5,122.4,186.15)、RGB(3.825,34.425,71.4)、RGB(2.04,6.375,22.185)，禁止换成紫色、彩虹、镜面金属或黑色条纹。
- RAF 每帧推进有效时间，dt上限0.05s；暂停、页面隐藏和离屏时不累计时间，恢复时从当前形状继续。第一次挂载立即绘制完整t=0帧，不能先空白。resize改变分辨率时保留播放相位。

操作、可访问性与边界
- 整个场景为可聚焦的本地暂停控件，role=button，tabindex=0。点击、轻触、Enter或Space切换暂停/继续；键盘防止空格滚动。aria-pressed只表达用户暂停状态，aria-label在Pause background animation和Resume background animation间切换，隐藏aria-live文字分别为Animation paused和Animation playing。
- 焦点样式为内缩7px的3px白色轮廓，加9px内阴影#0b3c69；无hover位移，不让Logo或图标运动。
- 背景没有鼠标跟随效果，多个鼠标位置均不改变图案；仅时间使流体连续流动，手动暂停时保持完全同一帧。反复快速切换只保留一条RAF，不跳到初始形状。重新挂载才回到t=0。
- prefers-reduced-motion或options.reducedMotion为true时保留静态完整画面，禁止持续RAF；更新为false或系统取消减少动态效果后恢复。系统偏好变化要立即响应。
- WebGL不可用或着色器失败时显示静态降级：960×666画布先填#f4f4f4，再从(525,520)半径20到440绘制径向渐变，色标0=#020820、.45=#073d69、.7=#378fbe、1=#f4f4f4；保留矢量Logo，不把降级画面声明为实时动画。
- 不请求业务后端。实例DOM、样式与事件封闭在独立容器/ShadowRoot；禁止给宿主body改样式或留下全局ID。至少验证同页两个实例的独立暂停。
- ResizeObserver更新尺寸，IntersectionObserver处理离屏，visibilitychange处理页面隐藏。卸载时取消RAF、解绑点击/键盘/偏好/可见性监听、disconnect观察器，释放WebGL Buffer、Program并通过WEBGL_lose_context释放上下文。重复销毁无副作用。

验收
- 检查t=0、约6秒和约12秒：主蓝脊和浅色凹槽连续迁移，固定竖纹对同一流体产生折射，Logo坐标和路径保持不变。暂停前后实际Canvas像素相同，恢复后实际像素变化。
- 点击、触屏、空格、回车、重复中断、减少动态效果、resize、多实例、卸载与重新挂载均实际运行。封面使用t=0完整绘制帧；等待首帧再展示动画，离开预览后释放实例。`;
