import type { MotionEntry } from "./interaction-components";

export const THINKING_ORB_WIDTH = 820;
export const THINKING_ORB_HEIGHT = 390;
export const THINKING_ORB_NAME = "Dissolve Thinking Orb";
const description = "A 180-dot orb morphs between six agent states and responds to the pointer.";
const instructions = "Switch the agent state, drag across the orb, or adjust the simulated voice level while listening.";

export const THINKING_ORB_ENTRY: MotionEntry = {
  slug: "thinking-orb",
  href: "/docs/animations/thinking-orb",
  name: THINKING_ORB_NAME,
  category: "Status indicator",
  description,
  instructions,
  keywords: "智能体 状态 粒子球 呼吸 环形 雷达 监听 音量 完成 错误 dissolve thinking orb status agent canvas particles radar",
  preview: "/assets/components/thinking-orb.png",
  sourceFile: "thinking-orb.html",
  canvasWidth: THINKING_ORB_WIDTH,
  canvasHeight: THINKING_ORB_HEIGHT,
  responsive: true,
  recreatedHtml: true,
  viewportPlayback: true,
  referenceUrl: "https://dissolve.rselmi.com/",
  referenceSourceUrl: "https://www.npmjs.com/package/dissolve-ui/v/0.0.6",
  referencePackage: "dissolve-ui@0.0.6",
  referenceAuthor: "Rayan Selmi · dissolve",
  referenceLicense: "MIT License · Copyright (c) 2026 Rayan Selmi.",
  referenceNotes: "Uses the official dissolve Web Canvas 2D renderer and particle motion, with a LeiBox preview and framework adapters.",
  codeSource: "MIT-licensed dissolve ThinkingOrb Web source, adapted for the LeiBox preview and framework packages.",
  prompt: `制作一个在 Canvas 2D 中绘制的智能体粒子状态球。用均匀分布在 Fibonacci 球面上的 180 个点，透视深度控制点大小和透明度。默认尺寸 96px。idle 缓慢旋转呼吸；thinking 拆成三层不同角度和转速的圆环；searching 变成扁圆盘，按角度扫过雷达亮弧；listening 按 0 到 1 的输入音量脉动；done 收束成绿色对勾；error 变红并受重力下落反弹，约 900ms 后重组为球。切换时从每个点此刻坐标开始，沿缓动曲线逐点交错插值 600ms，每点延迟 1.5ms。快速切换时保留当前位置。interactive 打开时，指针半径 40px 内的点会被推开，移走后按弹簧阻尼原路回稳。按设备像素比绘制，离屏或销毁后暂停，减少动态效果时使用静态姿态和短过渡。用横向可换行的键盘可操作状态选择器和模拟音量滑杆构建试玩，嵌入时可隐藏控件，使用 --dissolve-foreground、--dissolve-success、--dissolve-danger 换色。`,
};

export const THINKING_ORB_API = [
  { key: "state", type: '"idle" | "thinking" | "searching" | "listening" | "done" | "error"', defaultValue: '"idle"', en: "Set the agent state. The dots morph from their current positions.", zh: "设置智能体状态，粒子从当前位置开始变形。" },
  { key: "size", type: "number", defaultValue: "96", en: "Orb width and height in CSS pixels.", zh: "设置粒子球的宽高，单位为 CSS 像素。" },
  { key: "level", type: "number | { value: number }", en: "Normalized voice level from 0 to 1. The orb reads a level object on each frame.", zh: "传入 0 到 1 的音量。传入对象时，粒子球逐帧读取其值。" },
  { key: "interactive", type: "boolean", defaultValue: "false", en: "Let dots repel the pointer and spring back on release.", zh: "启用粒子避让鼠标或手指，松开后弹回。" },
  { key: "color", type: "string", en: "Override the base dot color. Done and error use the dissolve success and danger tokens.", zh: "覆盖默认粒子颜色。完成和错误读取 Dissolve 的成功与错误色令牌。" },
  { key: "dots", type: "number", defaultValue: "180", en: "Number of dots in the orb.", zh: "粒子球的点数。" },
  { key: "dotSize", type: "number", en: "Set the dot diameter in CSS pixels.", zh: "设置粒子直径，单位为 CSS 像素。" },
  { key: "haptics", type: "boolean", defaultValue: "false", en: "Vibrate on done and error when the browser supports it.", zh: "浏览器支持时，在完成和错误状态触发振动。" },
  { key: "showControls", type: "boolean", defaultValue: "false", en: "Show state and voice level controls for a demo.", zh: "在演示中显示状态和音量控件。" },
  { key: "locale", type: '"en" | "zh"', defaultValue: '"en"', en: "Set the language of the demo controls.", zh: "设置演示控件语言。" },
];

export const thinkingOrbTranslations = Object.fromEntries([
  [THINKING_ORB_NAME, "Dissolve 状态粒子球"],
  [description, "由 180 个粒子组成的状态球，在六种智能体状态间变形，也会避让指针。"],
  [instructions, "切换智能体状态，划过粒子球，或在聆听时拖动滑杆模拟音量。"],
  ...THINKING_ORB_API.map(({ en, zh }) => [en, zh]),
]);
