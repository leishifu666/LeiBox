import type { MotionEntry } from "./interaction-components.ts";
import type { Discovery } from "./ai-discovery.ts";

type ApiField = { key: string; type: string; en: string; zh: string };
type Library = {
  page: string;
  packageName: string;
  version: string;
  name: string;
  zh: string;
  category: string;
  renderer: string;
  width: number;
  height: number;
  description: [en: string, zh: string];
  instructions: [en: string, zh: string];
  search: string;
  visualTags: string[];
  caveat: string;
  api: ApiField[];
  extraDependencies?: string[];
};

const selectDependencies = ["@base-ui/react@1.6.0", "lucide-react@1.24.0"];

export const LIBRARIES_DEV: Record<string, Library> = {
  "border-beam": {
    page: "beam", packageName: "border-beam", version: "1.4.1",
    name: "Border Beam", zh: "流光描边", category: "Surface effect", renderer: "css", width: 820, height: 440,
    description: ["A ribbon of light runs along a card, button or input border.", "一束流光沿着卡片、按钮或输入框的边缘游走。"],
    instructions: ["Change the beam shape, colour and intensity, or pause the light.", "切换光带造型和配色，调节强度，或暂停流光。"],
    search: "流光 边框 描边 走马灯 呼吸光 border beam glow outline pulse",
    visualTags: ["glow", "outline", "light"],
    caveat: "开源原包提供边框光带，LeiBox 为独立预览注册连续插值属性，并保留造型、色板与强度调节。",
    extraDependencies: selectDependencies,
    api: [
      { key: "size", type: '"md" | "sm" | "line" | "pulse-inner" | "pulse-outside"', en: "Choose a travelling beam, baseline, or pulsing border.", zh: "选择环绕、底边扫光或呼吸描边。" },
      { key: "colorVariant", type: '"colorful" | "mono" | "ocean" | "sunset" | "forest" | "candy" | "ice" | "gold"', en: "Set the beam palette.", zh: "选择边缘光带的配色。" },
      { key: "strength", type: "number", en: "Set the light intensity between 0 and 1.", zh: "将光效强度设置在 0 到 1 之间。" },
      { key: "active", type: "boolean", en: "Enable or pause the effect.", zh: "开启或暂停光带动效。" },
      { key: "theme", type: '"dark" | "light"', en: "Match a dark or light surface.", zh: "适配深色或浅色界面。" },
    ],
  },
  "thinking-orbs": {
    page: "orbs", packageName: "thinking-orbs", version: "0.3.2",
    name: "Thinking Orbs", zh: "思考粒子球", category: "Status indicator", renderer: "canvas", width: 820, height: 440,
    description: ["Particle orbs give nine AI processing states distinct motion.", "九种粒子球动效，分别表现搜索、推理、聆听和其他 AI 工作状态。"],
    instructions: ["Choose a state to see its motion. Change the size to preview an inline indicator or an avatar.", "切换工作状态，比较粒子轨迹。调整尺寸，查看行内和头像大小的显示效果。"],
    search: "思考 粒子 球 搜索 推理 监听 编织 加载 thinking orbs particles loading state",
    visualTags: ["particles", "orb", "minimal"],
    caveat: "九种状态使用独立的上游 Canvas 2D 动画，可随减少动态效果设置定格。",
    extraDependencies: selectDependencies,
    api: [
      { key: "state", type: '"working" | "searching" | "solving" | "listening" | "connecting" | "weaving" | "composing" | "breathing" | "shaping"', en: "Set the particle animation.", zh: "指定粒子球的动画状态。" },
      { key: "size", type: "20 | 32 | 64", en: "Set the indicator size in CSS pixels.", zh: "设置指示器尺寸，单位为 CSS 像素。" },
      { key: "speed", type: "number", en: "Animation speed multiplier.", zh: "动画速度倍数。" },
    ],
  },
  "liquid-gooey": {
    page: "gooey", packageName: "liquid-gooey", version: "0.2.2",
    name: "Liquid Gooey", zh: "流体黏合", category: "Morph interaction", renderer: "svg", width: 820, height: 440,
    description: ["Nearby shapes stretch, join and separate like liquid.", "形状靠近时像液体一样拉伸、黏合，拉开后自然分离。"],
    instructions: ["Bring the shapes together and try the different motion settings.", "让形状靠近，体验黏合和拉开时的变化，并试试不同的动效设置。"],
    search: "液态 黏连 融合 果冻 变形 gooey liquid merging morph svg",
    visualTags: ["liquid", "morph", "organic"],
    caveat: "依据开源包的原始黏合算法渲染，演示支持键盘操作。",
    api: [
      { key: "mode", type: '"morph" | "move" | "melt" | "bend"', en: "Choose a liquid deformation demo.", zh: "选择融合、移动、熔融或弯曲演示。" },
      { key: "open", type: "boolean", en: "Expand or collapse the morphing controls.", zh: "展开或收起融合动效的按钮组。" },
      { key: "fill", type: "string", en: "Set the liquid shape fill colour.", zh: "设置流体形状的填充颜色。" },
    ],
  },
  "voice-glow": {
    page: "voice", packageName: "voice-glow", version: "0.3.0",
    name: "Voice Glow", zh: "语音浮光", category: "Audio visualizer", renderer: "canvas", width: 820, height: 460,
    description: ["A voice-reactive glow rises from the edge of a surface.", "光晕从界面边缘升起，随音量和语音状态变化。"],
    instructions: ["Adjust the simulated level, voice state, shape and palette.", "调节模拟音量，切换语音状态、光晕造型和配色。"],
    search: "语音 音量 光晕 可视化 录音 输入框 voice glow audio reactive speech",
    visualTags: ["glow", "audio", "gradient"],
    caveat: "预览使用模拟音量。应用可传入自己的音量读数或已有音频流。",
    extraDependencies: selectDependencies,
    api: [
      { key: "type", type: '"default" | "pill" | "mobile"', en: "Choose the shape of the voice glow.", zh: "选择光晕所在的容器形态。" },
      { key: "colorVariant", type: '"colorful" | "mono" | "ocean" | "sunset" | "forest" | "candy" | "ice" | "gold"', en: "Set the voice glow palette.", zh: "选择语音浮光的配色。" },
      { key: "state", type: '"idle" | "listening" | "processing"', en: "Set the demo’s voice activity.", zh: "设置待机、聆听或处理状态。" },
      { key: "level", type: "number | (() => number)", en: "Provide a normalized audio level between 0 and 1.", zh: "传入 0 到 1 之间的音量数值或读取函数。" },
      { key: "stream", type: "MediaStream | null", en: "Use an audio stream supplied by the host application.", zh: "使用宿主应用已经取得的音频流。" },
    ],
  },
  "bot-avatars": {
    page: "bots", packageName: "bot-avatars", version: "0.2.2",
    name: "Bot Avatars", zh: "智能体表情头像", category: "Status indicator", renderer: "canvas", width: 820, height: 440,
    description: ["Eighteen animated avatar shapes idle, work and fall asleep in Canvas 2D.", "十八种 Canvas 2D 头像会张望、工作或进入睡眠。"],
    instructions: ["Try another shape, material or activity to see how the avatar responds.", "切换头像造型、材质或工作状态，观察表情和动作变化。"],
    search: "智能体 机器人 头像 毛绒 表情 动画 agent avatar bot face fur",
    visualTags: ["avatar", "fabric", "character"],
    caveat: "上游 Canvas 2D 材质与动画支持定格，头像可以用状态值跟随应用工作流。",
    extraDependencies: selectDependencies,
    api: [
      { key: "type", type: '"clover" | "flower" | "triangle" | "square" | "blob" | "ghost" | "circle" | "drop" | "star" | "droid" | "mech" | "alien" | "hexagon" | "cat" | "cloud" | "pill" | "pebble" | "puddle"', en: "Select one of the eighteen avatar silhouettes.", zh: "从十八种头像轮廓中选择。" },
      { key: "state", type: '"default" | "working" | "sleeping"', en: "Set the avatar’s activity.", zh: "设置头像的活动状态。" },
      { key: "shading", type: '"fabric" | "plastic" | "crisp" | "smooth" | "flat"', en: "Set the avatar material.", zh: "设置头像的表面材质。" },
      { key: "face", type: '"eyes" | "mouth"', en: "Choose eyes only or eyes and mouth.", zh: "选择只显示眼睛，或同时显示眼睛和嘴巴。" },
    ],
  },
  "liquid-metal": {
    page: "metal", packageName: "metal-fx", version: "2.0.11",
    name: "Liquid Metal", zh: "流体金属", category: "Surface effect", renderer: "webgl", width: 820, height: 440,
    description: ["Chrome reflections give controls and text a shifting metal finish.", "铬金属反光在控件和文字表面流动。"],
    instructions: ["Try the available metal finishes and change the intensity.", "切换金属材质并调整反光强度。"],
    search: "液态 金属 铬 银 金 反光 按钮 liquid metal chrome shader",
    visualTags: ["chrome", "metal", "reflection"],
    caveat: "WebGL2 渲染金属表面，硬件不支持时保留可用的普通控件。",
    api: [
      { key: "preset", type: '"chromatic" | "silver" | "gold"', en: "Choose chromatic, silver or gold metal.", zh: "选择彩铬、银色或金色金属。" },
      { key: "variant", type: '"circle" | "button"', en: "Shape the metal control as a circle or a pill.", zh: "将金属控件显示为圆形或胶囊形。" },
      { key: "strength", type: "number", en: "Set reflection intensity between 0 and 1.", zh: "将反光强度设置在 0 到 1 之间。" },
      { key: "paused", type: "boolean", en: "Freeze the metal motion.", zh: "定格金属动效。" },
      { key: "theme", type: '"dark" | "light"', en: "Match a dark or light surface.", zh: "适配深色或浅色界面。" },
    ],
  },
};

export const libraryDemoApi: ApiField[] = [
  { key: "locale", type: '"en" | "zh"', en: "Language of the standalone demonstration controls.", zh: "独立演示控件的界面语言。" },
  { key: "showControls", type: "boolean", en: "Show the controls below the demonstration.", zh: "显示演示下方的控制栏。" },
];

export const librariesDevEntries: MotionEntry[] = Object.entries(LIBRARIES_DEV).map(([slug, library]) => {
  const { name, category, description, instructions, search, width, height, page, renderer, packageName, version } = library;
  const pageUrl = `https://libraries.dev/${page}`;
  const packageId = `${packageName}@${version}`;
  return {
    slug, name, category,
    href: `/docs/animations/${slug}`, description: description[0], instructions: instructions[0],
    keywords: `${search} Libraries.dev Jakub Antalik ${packageName}`,
    preview: `/assets/components/${slug}.png`, sourceFile: `${slug}.html`,
    canvasWidth: width, canvasHeight: height, responsive: true, recreatedHtml: true, viewportPlayback: true,
    ...(renderer === "webgl" ? { renderers: [renderer] } : {}),
    prompt: `制作「${library.zh}」的可交互演示。核心效果：${description[1]} 演示操作：${instructions[1]} 在纯白舞台上居中呈现主体，底部控制区以一条浅灰线分隔。短选项使用有焦点反馈的分段选择，长选项使用支持键盘操作的白底列表弹层，滑杆显示当前数值。窄屏允许整组控件换行。核心渲染方式：${renderer}。减少动态效果时保持可阅读的静态结果和完整的控制状态。`,
    referenceUrl: pageUrl,
    referenceAuthor: "Jakub Antalik · Libraries.dev",
    referenceSourceUrl: `https://github.com/Jakubantalik/Libraries.dev/tree/main/packages/${packageName}`,
    referencePackage: packageId,
    referenceNotes: `LeiBox demonstration using the published ${packageId} effect.`,
    referenceLicense: `MIT License · Copyright (c) 2026 Jakub Antalik · ${packageId}.${slug === "liquid-metal" ? " Paper Shaders retain their Apache-2.0 license and notice." : ""}`,
    codeSource: `LeiBox demo and six framework mount entries, powered by the MIT-licensed ${packageId} React renderer.`,
  };
});

export const librariesDevTranslations = Object.fromEntries(Object.values(LIBRARIES_DEV).flatMap(library => [
  [library.name, library.zh], library.description, library.instructions,
  ...library.api.map(({ en, zh }) => [en, zh]),
]).concat(libraryDemoApi.map(({ en, zh }) => [en, zh])));

export const librariesDevDiscovery: Record<string, Discovery> = Object.fromEntries(
  Object.entries(LIBRARIES_DEV).map(([slug, library]) => [slug, {
    category: slug.startsWith("voice-") ? "media" : "feedback",
    useCases: library.description,
    searchTerms: [...library.search.split(" "), library.packageName, "libraries.dev", library.zh],
    visualTags: library.visualTags,
    interactions: ["click", "keyboard", "touch"],
    caveat: library.caveat,
  }]),
);
