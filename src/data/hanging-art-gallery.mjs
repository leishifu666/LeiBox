export const HANGING_ART_GALLERY_PROMPT = `实现可独立运行的“3D 悬挂画廊”：一根贯穿画面的细金属横杆，下方以五根不同长度的黑色细绳悬挂五幅异形画框。默认只有中间圆框正面朝向用户，其余四幅露出不同材质的背面。悬停或轻点某一画框，它绕自身竖轴真实翻转到正面，之前的画框翻回背面，挂点同时沿横杆弹性移动。不要用两张图片交叉淡入或CSS卡片替代真实厚度、背面、金属反光和摆动。

画面、内容与尺寸
默认容器960×540，白底，整体可随父容器宽度和height参数变化；独立演示占满视口。无标题、说明条或多余卡片外壳。字体为 -apple-system, BlinkMacSystemFont, "Inter", "SF Pro Text", "Helvetica Neue", Arial, sans-serif。背景可由CSS变量控制，以便缩略预览使用#f4f4f4。画面中的横杆、线、吊环、画框与阴影全部是真实Three.js三维场景，作者与年份使用覆盖在canvas上的原生DOM。
五幅画从左到右为：Leonardo da Vinci，1503，蒙娜丽莎，天然橡木拱门框；Johannes Vermeer，1665，戴珍珠耳环的少女，深黑亮漆椭圆框，背面有两圈金色细描边；Katsushika Hokusai，1831，神奈川冲浪里，古金圆框，背面为浮雕金色螺旋纹；Vincent van Gogh，1889，星月夜，未上釉的红陶花边框，背面哑光带细微斑点与中心凹环；Gustav Klimt，1908，吻，青瓷釉色超椭圆框，背面有细裂纹。
制作阶段准备上述五幅作品的可合法使用图像以及木纹、金色螺旋和青瓷裂纹三幅材质图，并内嵌进本次产物；运行时不访问远程图片或字体。各图包含其自身来源和许可记录，不能把作品名称当作已取得图像许可。画作保持真实比例并按下列UV范围裁切，不换成渐变占位。材质背图可程序绘制：木纹使用多层细长波纹与结疤；金属螺旋用中心向外渐宽的连续浮雕曲线；青瓷为浅绿底加不规则细裂纹。

几何参数
全局单位与角度遵循Three.js。横杆在y=1.48，是半径.044、长34、36径向分段的CylinderGeometry，绕Z旋转π/2。每幅画挂点为独立hangerGroup，包含沿杆的半径.052长.052金属套环，下面pendulumGroup包含半径.008、10径向段的竖直绳，绳下端是TorusGeometry(.026,.007,12,24)吊眼。画框medallionGroup中心y=-(绳长+画高/2)，位于pendulumGroup内，因此挂点滑动产生的摆动绕绳顶发生，而正反翻面绕画框自身中心发生。
五项数据按width,height,depth,bevel,wireLen,insetScale,uvInsetX,uvInsetY排列：
拱门 1.46,2.08,.13,.030,.56,.875,.075,.055；
椭圆 1.44,2.00,.13,.032,.70,.89,.075,.060；
圆形 1.90,1.90,.14,.036,.84,.895,.065,.065；
花边 1.92,1.90,.14,.032,.92,.845,.115,.095；
超椭圆 1.66,1.64,.13,.036,.64,.855,.09,.08。
拱门下部为矩形，上半圆半径width/2、圆心y=height/2-width/2；椭圆半轴width/2和height/2；圆形半径width/2。花边用240段，θ均匀0到2π，r=(width/2)*(.905+.095*abs(cos(5θ))^.58)，x=cosθ*r，y=sinθ*r*height/width。超椭圆用140段、n=4.2，x=sign(cosθ)*abs(cosθ)^(2/n)*width/2，y同理用sin与height。
实体为ExtrudeGeometry，depth见表，bevelEnabled true、bevelSegments7、steps1、bevelSize及Thickness为表中bevel、curveSegments72；几何沿Z平移-depth/2后计算顶点法线。按包围盒归一化XY生成平面UV，背面法线Z<-.5时反转U，以保证背部材质方向。正面作品使用按insetScale缩小的相同轮廓ShapeGeometry，faceZ=depth/2+bevel+.0022；UV由uvInset插值到1-uvInset。下面另有比例insetScale+.011的暗色内唇，Z比作品低.0009，色#161412、roughness.96、metalness0、opacity.28。圆框正反各加实体金属圆环，半径width*.482、管径正面.026背面.024，18×96分段，Z=±(depth/2+bevel*.55)。黑漆/古金/红陶的背面是相同轮廓的独立面，绕Y旋π，Z=-faceZ，比例古金.94、其余.96。画框实体、正反面和略大1.08倍的不可见碰撞平面参与同一Raycaster选择。

渲染与PBR材质
使用Three.js r128，单独固定该版本，保留其sRGBEncoding、旧版光强与LinearToneMapping处理，避免混用新版灯光导致曝光变化。WebGLRenderer antialias true、alpha true，透明清屏，pixelRatio=min(devicePixelRatio,2)，启用PCFSoftShadowMap，outputEncoding=sRGBEncoding，toneMapping=LinearToneMapping，exposure=.94。颜色贴图用sRGB，法线/粗糙/金属度图保持线性；LINEAR与mipmap线性滤波，CLAMP_TO_EDGE，anisotropy=min(8,设备上限)。
橡木：MeshStandardMaterial，木纹map，roughness .80、metalness0、envMapIntensity .25。黑漆框：色#08080c，roughness .14、metalness .08、clearcoat .90、clearcoatRoughness .08、env1.25。黑漆背面的1024²颜色图底#08080c，金属度底#0e0e0e、粗糙度底#262626；两圈椭圆位于纹理中心，半轴分别(.436,.448)和(.408,.422)乘图尺寸；颜色图金色#c7a452，线宽4.6和3.8，金属图线#ededed宽5.4和4.6，粗糙度线#404040；背面material metalness/roughness均1、clearcoat.85、clearcoatRoughness.09、env1.15。
古金框：色#c29842，metalness .86、roughness .24、clearcoat .15、clearcoatRoughness .20、env1.85；古金背map螺旋图并乘色#ffe8b5，metalness .78、roughness .30、clearcoat .12、clearcoatRoughness .24、env1.80。红陶框：色#c45236、roughness .95、metalness0、env .22；红陶背部512²纹理基色RGB196,82,54，使用种子1889的mulberry32噪声，grain=(rand-.5)*.075，少量±.1斑点，归一化中心半径r=.092附近宽.011的余弦凹环，亮度shade=1+.45*grain+speckle-.3*ring，normal高度=.5+.3*grain+.45*speckle-.6*ring；roughness .95、metalness0、env .25、normalScale(.65,.65)。青瓷：裂纹map、roughness .30、metalness0、clearcoat .75、clearcoatRoughness .14、env1.05。画作正面统一roughness .92、metalness0、env0，保持无镜面眩光的印刷表面。绳色#222428、roughness .38、metalness .85、env1.25，套环色#c8ccd4、roughness .22、metalness .90、env1.5。横杆色#d8dce2、metalness .90、roughness .22、clearcoat .20、clearcoatRoughness .16、env1.65。
为木纹、金螺旋、青瓷分别生成与图像像素对齐的512²高度、法线图。亮度=.299R+.587G+.114B；Sobel gx=(tr+2mr+br)-(tl+2ml+bl)，gy=(bl+2bc+br)-(tl+2tc+tr)，法线normalize(-gx*strength,-gy*strength,1)，编码到0–255；DataTexture flipY=true，使其匹配图像贴图方向。normalStrength分别1.4、2.2、1.2，normalScale分别.55、1.15、.42。金螺旋另由亮度生成.18到.54的线性粗糙度图，保留深浅浮雕反光。红陶高度法线strength1.4。

灯光与摄影棚环境
不要以纯白环境把金属洗成塑料。用PMREMGenerator从独立摄影棚场景生成环境贴图，背景#1f2228；黑色负补光板#060709：34×34平面在y=-7，18×12前板在(0,-1,14)朝向原点；22×6柔光板#d8dce4在(0,10.5,1.5)绕X转π/2；7.5×8.5暖色主板#fff3de在(-10.5,5.5,6.5)朝向原点；3.5×9.5冷色边板#c8d2e2在(11,3.5,5.5)；14×6灰色补光板#4a4c52在(0,4.5,13)，均双面。PMREM fromScene sigma .035。生成后释放临时摄影棚几何和材质，保留render target至组件销毁。
正式场景：白色AmbientLight强度.34；HemisphereLight白/底#ddd9d0强度.14、位置(0,9,4)；主DirectionalLight色#fffdf8强度.44、位置(-4.4,5.8,10.5)，2048×1024阴影，shadow camera near2 far25 left/right±8.5 top/bottom±4.5，radius7，bias-.0004；冷边光#eef4ff强度.10、位置(6,2.5,6.5)。墙面为40×24平面在z=-.82，ShadowMaterial opacity .145，仅收柔和阴影。

相机、排布与弹簧
PerspectiveCamera fov30、near.1、far100，aspect=容器宽/高；目标可见宽12.15、高7.4；z=max((12.15/aspect)/(2*tan(15°)),7.4/(2*tan(15°)),11.2)，相机在(0,-.08,z)朝向(0,-.08,0)，保证五件作品完整进入窄屏画面，不以全屏窗口尺寸替代实例尺寸。
针对activeIndex 0至4，各挂点横坐标的参考表依次为[188,622,976,1362,1748]、[140,574,1006,1362,1748]、[170,526,960,1393,1749]、[170,556,911,1344,1778]、[170,555,941,1296,1730]。每项换为世界x=(值-960)/1920*11.4。默认active=2，用第三行坐标初始化，选中的正面rotY=0，其余rotY=π；选中scale1.055、z=.22，其余1和0。
按RAF真实时间积分，dt夹在0到.04s，lastTime只可单调递增；贴图加载回调可能先于旧时间戳的RAF交付，不能用负dt反向积分。半隐式弹簧velocity+=((target-value)*stiffness-velocity*damping)*dt，value+=velocity*dt。横移stiffness68/damping12.5；Y翻转72/11.2；X倾斜60/10.5；缩放和前移75/13；绳摆38/6.2。挂点加速度ax=(新vx-旧vx)/max(dt,.001)，摆角目标clamp(-ax*.0045,-.07,.07)+sin(t*.85+index*1.25)*.004。悬停已选画框时，将世界碰撞点转换到画框局部坐标，除以半宽高并clamp±1；rotY目标额外加localX*.14，rotX目标=-localY*.08。轻点施加Y旋转角速度+.85的小冲量；它是翻面后的轻晃，不是打开链接或新页面。

标签和交互
每帧从画框局部(0,-height/2-.18,0)投影到屏幕，更新真实DOM标签位置。只有active且cos(rotY)>.35时显示。画家字号clamp(12px,1.15%容器宽,17px)、字重450、字距-.012em、色#18181b、行高1.3；年份clamp(11px,.95%宽,14px)，上距2px、字距.01em、行高1.25，色#737378。隐藏标签下移6px，opacity转场.28s cubic-bezier(.22,1,.36,1)。投影位置在小屏需按实际标签半宽夹进容器左右8px以内，不能裁掉边缘画家姓名。隐藏标签aria-hidden，不能让五条不可见文字同时朗读。
鼠标悬停选中，移出后保持最后选择并让倾斜回正；触屏轻点一次即可选中，不依赖hover。canvas可聚焦并有说明性aria-label，只有焦点位于组件内时处理左/右方向键循环选择、Home到第一幅、End到最后一幅；阻止本次方向键滚动，宿主页别处不受影响。底部提供五个原生画家按钮，平时视觉隐藏，键盘focus-within时显示，位置底部16px居中、间距6px、可换行、pill边框#e4e4e7，白色92%背景、12px深字。按钮aria-pressed同步当前选择，焦点轮廓清楚。Esc或失焦时清掉悬停倾斜。

API、减少动态及清理
options.active为0–4整数，默认2，外部更新不触发onActiveChange；用户选择新画作时调用onActiveChange(index)。options.height控制实例高度；idleMotion默认true，false时取消正弦微摆，弹簧收敛后停止RAF；reducedMotion遵循显式选项或系统偏好，关闭翻转、微摆和冲量，用户选择后立即正确呈现正反状态及标签，无持续RAF。resize更新相机、画布像素比、投影；多个实例不共享活动状态、DOM ID、键盘监听或资源。
图片与PBR贴图全部加载且初帧绘制完成后才宣布ready，缩略图此前保留封面，不能把空白canvas当成ready。页面隐藏时停止帧，可见后重设时间基准。销毁取消RAF、监听、观察器和未完成的图像回调，逐一dispose所有独占geometry/material/texture、阴影map、PMREM render target、renderer和renderLists，forceContextLoss，清空canvas并移出DOM。销毁后图像load不能重新生成GPU资源。
无WebGL时保留同样五幅作品的静态图片选择器、作者年份、键盘/触屏和active回调，并明确这是静态降级，不能把它作为三维效果验收。完整交付所选框架的原生生命周期入口、共享核心、完整内嵌资源、依赖与使用示例，不能使用iframe冒充组件。检查五种前后面、悬停多个局部点、切换中途反向、重复点击、触屏选择、键盘作用域、减动效、多实例与卸载，375/768/1440及改高后无溢出，标签与物体投影始终对齐。`;
