export const EFFORT_SLIDER_PROMPT = `制作一个可独立嵌入的模型思考强度滑块

外观
- 采用 Deep Agent 模型菜单中独立的264px「推理强度」区块，左右内边距12px，保留原版字体与连续圆角，不添加卡片说明、档位徽章或额外文案
- 标题「推理强度」为12px，下方轨道高30px、胶囊圆角，浅灰背景，白色滑块26px，顶部2px，起点左边3px，1px浅灰边和轻微阴影
- 三档文案「简单」「中度」「深度」，分别对应 simple / medium / deep，默认 medium。轨道下6px显示11px标签，当前档加粗并随蓝紫色相变化
- 轨道填充随位置从深灰蓝流动到淡紫。Canvas绘制七条对角柔光带与64个细微星点，色相为210+ratio²×63。最低档保留32px填充，最高档隐藏三个定位圆点

交互与运动
- 点轨道、点档位标签、键盘方向键和Home/End都可切换。拖动中连续预览，松手吸附最近档，只在提交新档时发出一次 onValueChange(value)，取消手势回到已提交值
- GSAP驱动位置500ms不超调滑行；按下80ms缩至0.96，松手320ms恢复
- 速度驱动滑块身体拉伸、偏移和倾斜，速度上限3.5，变形上限0.46，90ms跟随；停顿后用stiffness400/damping23/时长720ms的弹簧归位，反向拖动连续过渡
- 星点速度随强度和拖速提高，通过积分相位维持连续。GSAP ticker绘制，后台不绘制；卸载移除ticker、监听器和ResizeObserver
- 禁用状态不能操作。支持运行时受控value更新与回滚、reducedMotion更新；减少动态效果时静态呈现当前档，不改变交互结果
- role=slider，aria-valuemin=0，aria-valuemax=2，aria-valuenow和aria-valuetext与当前预览一致，键盘焦点清晰可见。支持触屏和多实例

接口
- options.value: simple | medium | deep，options.onValueChange(value)，options.disabled，options.height，options.reducedMotion
- thinking-change事件detail.value传递UI档位。模型参数映射由调用者实现，不假定每个模型都支持同一推理协议
- 使用原版 React EffortSlider 与 Radix Slider 控制手势，GSAP保留原版createEffortMotion与createEffortField算法，避免另写一套DOM近似版
- 六框架入口共享这一套 React UI，均需React与React DOM；所有样式和依赖代码完整交付，不请求桌面应用、服务端或远程素材`;

export const DEEP_AGENT_COMPOSER_PROMPT = `制作一个可复制嵌入的 Agent 对话输入框与模型思考强度菜单

输入框
- 使用 Deep Agent 原版 Composer、InputSurface 及其全部子组件，保留原来的JSX、类名、样式、图标和GSAP动效，不能重新拼装近似界面
- 白色输入框基础圆角24px，按连续圆角规则支持superellipse时乘1.6；内边距14px、底部10px，阴影0 8px 24px rgba(31,38,48,.09)，聚焦阴影0 10px 30px rgba(31,38,48,.13)
- textarea占满宽度，最小高60px，14px正文、24px行高，提示「尽管问...」；保留透明textarea、文字镜像、光标和原版自动增高
- 底部左侧32px添加附件按钮，以及「请求批准 / 自动审查 / 完全访问」权限菜单；右侧32px上下文容量指示、模型与思考胶囊、原版发送按钮
- 保留原版附件卡片、图片预览、@候选、权限互斥、模型菜单、上下文浮层、空输入禁用、Enter提交、Shift+Enter换行和中文输入法组合输入处理
- 提交通过onSubmit传递text/model/thinking/attachments/skills/mentions/permission，交给接入方处理。不额外添加标题、回复气泡、说明文字或模拟回执

模型菜单
- 初始状态按原版收起，点击模型胶囊后264px白色面板向上连续变形。直接使用原版MorphingMenuShell，同一外壳内宽高、连续圆角、阴影、透明度与模糊共同变化
- 打开宽度stiffness306.25/damping28/700ms，高度stiffness196/damping18.34/860ms，延迟57ms；关闭宽度400/33/640ms延迟70ms，高度600.25/40/620ms。GSAP支持中途反向
- 模型区域标题12px，模型行32px，默认示例deepseek-chat和deepseek-reasoner。选择模型后选中底色以220ms移动，右侧勾选更新，菜单保留展开
- 分隔线下显示「推理强度」与三档滑块；胶囊保留羽毛/灯泡/大脑图标并同步当前强度。菜单开关、外部点击、Escape及焦点按原版逻辑处理
- 使用Lucide开源图标并保留许可，禁用按钮hover上浮及hover图标运动

${EFFORT_SLIDER_PROMPT}

输入框扩展接口
- options.models、options.selectedModel、options.onModelChange(model)、options.onSubmit(message)
- options.busy、options.stopping、options.onStop控制原版发送与停止状态
- 模型名仅用于界面演示；onSubmit由调用方接入真实Agent。默认实现不联网、不读取目录、不上传附件、不声称模型已完成任务`;

export const DEEP_AGENT_API = [
  { name: "options.value", type: '"simple" | "medium" | "deep"', defaultValue: '"medium"', description: "Selected thinking depth. Updates and rollbacks keep the same instance." },
  { name: "options.onValueChange", type: "(value: ThinkingDepth) => void", description: "Called once when a new stop is committed, after dragging, clicking, or keyboard input." },
  { name: "options.disabled", type: "boolean", defaultValue: "false", description: "Disable interaction while keeping the selected value visible." },
];
export const DEEP_AGENT_COMPOSER_API = [
  { name: "options.models", type: "string[]", description: "Model labels supplied by your application. Default names are demonstration data." },
  { name: "options.selectedModel", type: "string", description: "Selected model label. Can be updated without remounting." },
  { name: "options.onModelChange", type: "(model: string) => void", description: "Called when a different model is selected." },
  { name: "options.onSubmit", type: "(message: { text: string; model: string; thinking: ThinkingDepth; attachments: ComposerAttachment[]; skills: ComposerSkillSelection[]; mentions: ComposerMention[]; permission: string }) => void", description: "Receive the message and UI settings. Connect your own Agent API here; the demo sends no network requests." },
  { name: "options.busy / options.stopping / options.onStop", type: "boolean / boolean / (() => void)", description: "Use the original Composer send and stop states." },
];
