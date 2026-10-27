import {INLINE_AGENT_ICONS} from './inline-agent-icons.mjs';

export const COLLECTION_ITEMS=[
 {id:'claude',name:'Claude',color:'#F2E6DE',svg:INLINE_AGENT_ICONS.claude},
 {id:'codex',name:'Codex',color:'#EAE9FF',svg:INLINE_AGENT_ICONS.chatgpt},
 {id:'grok',name:'Grok',color:'#E5E5E5',svg:INLINE_AGENT_ICONS.grok},
];

export const COLLECTION_LAYOUT_PROMPT=`创建“列表卡片堆叠切换”组件。在白色场景中用三个按钮切换同一组Claude、Codex、Grok图像的布局：List view列表、Card view并排卡片、Pack view叠放。三张图像始终使用同一组DOM节点，连续移动、改变尺寸和旋转；不得为每种视图复制一套图片再交叉淡入。

布局：1280×720设计舞台居中，父容器较窄时整体等比缩放，375/768/1440无横向溢出。场景白底。宽512的内容区在舞台x384、y140。标题为Collectibles，Arial/Helvetica/system-ui/sans-serif，16px、500字重、20px行高、#171717。三枚按钮在内容区y38，高32，宽100/108/110，间距10，文字为List view、Card view、Pack view，14px、20px行高。未选中#888；选中#171717。一个共享浅灰#E9E9E9圆角胶囊位于按钮下层，随选项移动并改变宽度，不能同时出现三个选中背景。焦点2px #747474描边、外距3px；hover只调整文字颜色，不上浮、不移动图标。横线在内容区y88，宽512、高1，#EDEDED；卡片模式淡出，其他模式显示。图像区域在内容区y130。

三张图像顺序固定为Claude、Codex、Grok，图像是下面完整SVG数据，分别置于#F2E6DE、#EAE9FF、#E5E5E5方形底板，SVG居中，占方形宽高74%，保留各自内层viewBox和比例，不重新近似品牌路径。SVG中的$id必须替换为当前组件实例与图片独有的前缀。底板无外部图片请求、无文字水印，边缘使用极淡白色内框。

列表：三个方形76×76，x0，y依次0/88/176，圆角5。每项的灰色占位条均为#E6E6E6，高20、圆角1：主条x92、y14+88i、宽204；副条x92、y40+88i、宽76；右条x448、y27+88i、宽64。保留这些灰条，不能增加真实价格或后端数据。

卡片：每张方形宽高s=(512-2×20)/3=157.333333，x=i×(s+20)，y0，圆角10，旋转0。每项主条在x同图、y=s+10，宽s×5/6；副条在x同图、y=s+36，宽s×.315；右条在x=图x+s×.738、y=s+36，宽s×.262。三个图及其灰条同时平滑重排，不更换节点。

叠放：三张方形都回到76×76、圆角12。左上角x依次200/218/236，y依次6/0/6，旋转依次-14/0/14度；层级从Claude到Grok递增，不重排DOM。各项灰条淡出。共享的两条叠放说明条位于x204、y104、宽104，以及x230、y130、宽52，高均20，按当前布局淡入淡出。叠放模式仍保留全部三张图像，不能合并成一张静态图片。

交互与动画：默认List view。点击、触屏、Enter或Space选择视图；在标签上方向键循环，Home/End选首末，使用tablist/tab/tabpanel语义、aria-selected、唯一的aria-controls和roving tabindex。保持图片节点身份，目标布局切换时从当前屏幕状态继续，先停止旧动画但不重置其当前值。图像x/y/width/height/rotation/borderRadius用GSAP同时过渡，约550ms、power2.out；灰条位置和尺寸约400ms，退出透明度180ms，叠放说明条约220ms、进入延迟80ms；共享选中胶囊约320ms、power2.out。三个图像同时启动，无随机错峰、无自动轮播、无hover升起。动画数值为明确实现参数。快速点击时始终以最后一次选择为目标，无闪白、跳回起点或遗留旧动画。

API与生命周期：options.view为list/card/pack，可初始化和运行中更新；options.height调整场景高度；options.reducedMotion覆盖系统偏好，减少动态时所有图像、灰条和指示胶囊直接到目标值，交互仍可用。高度变化时设计舞台居中并根据可用高度缩小。共享框架无关DOM核心，提供当前框架原生挂载、更新和卸载。每个实例独立，不写宿主body、不注入全局样式。销毁GSAP时间线、字体或尺寸观察、媒体查询和事件监听；异步ready回调在销毁后不得修改宿主。

交付完整框架入口、核心、CSS、类型、依赖与使用示例。验证三张图在每次切换前后保持同一DOM身份；列表/卡片/叠放三态的实际位置、尺寸、旋转和层级；连续快速切换、键盘、触屏、外部view更新、减少动态、同页多实例与卸载后无动画。独立提示词必须包含下面全部SVG，不依赖外部素材。`
 +'\n\n完整SVG内部标记\n每项外层添加svg viewBox="0 0 64 64"，内部保留下面嵌套SVG的viewBox。\n'
 +COLLECTION_ITEMS.map(item=>item.name+'\n'+item.svg).join('\n\n');
