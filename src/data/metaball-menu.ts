import type { MotionEntry } from "./interaction-components";

const name = "SVG Metaball Menu";
const description = "Three quick actions peel away from a plus button and merge back into one monochrome shape.";
const instructions = "Move the mouse into the menu to close it, or press the plus button to toggle it. The menu cycles while idle.";

export const METABALL_MENU_ENTRY: MotionEntry = {
  slug: "metaball-menu", href: "/docs/animations/metaball-menu",
  name, description, instructions, category: "Menu interaction",
  keywords: "metaball gooey svg menu radial quick actions gaussian alpha blur 菜单 黏球 融合 黑白 快捷操作 高斯模糊",
  preview: "/assets/components/metaball-menu.png", sourceFile: "metaball-menu.html",
  canvasWidth: 720, canvasHeight: 300, responsive: true, recreatedHtml: true, viewportPlayback: true,
  codeSource: "A React SVG implementation of the supplied filter and motion specifications.",
  prompt: `用 React 实现黑白 SVG 黏球菜单。原点是直径 54px 的圆形加号触发器，三个直径 44px 的操作圆起始在同一点。展开时在 550ms 内移动到 (-63,-38)、(0,-68)、(63,-38) CSS px，收起时沿同路径返回。将四个圆单独放入无指针事件的 SVG 滤镜组。feGaussianBlur 对 SourceAlpha 使用 7px 标准差；feColorMatrix 的 alpha 行为 0 0 0 28 -11；feFlood 生成单色，再用 feComposite 的 in 操作将其限制到阈值轮廓。真实 HTML 按钮和清晰图标放在滤镜外的上层，圆形和按钮共用同一偏移量、缓动和时长。组件可见且空闲时循环播放，鼠标进入时收起，点击加号可手动切换。按钮持有焦点时暂停自动播放；收起后禁用并隐藏三个操作按钮。Escape 关闭并将焦点送回触发器。系统减少动态效果时关闭自动播放，手动切换仍可用。每个实例的 SVG 滤镜 ID 唯一。操作示例为消息、收藏和分享，使用 onAction 向宿主报告选择。`,
};

export const METABALL_MENU_API = [
  { key: "autoplay", type: "boolean", defaultValue: "true", en: "Cycle only while the menu is visible and idle.", zh: "仅在菜单可见且空闲时自动展开和收起。" },
  { key: "defaultOpen", type: "boolean", defaultValue: "false", en: "Set the initial open state.", zh: "设置菜单的初始展开状态。" },
  { key: "onAction", type: '(action: "message" | "bookmark" | "share") => void', en: "Receive the selected action when a satellite button is pressed.", zh: "点击操作按钮时，返回消息、收藏或分享的操作标识。" },
  { key: "locale", type: '"en" | "zh"', defaultValue: '"en"', en: "Set the language of the action labels.", zh: "设置按钮无障碍名称的语言。" },
  { key: "reducedMotion", type: "boolean", en: "Disable spatial transitions and autoplay, as with the system reduced-motion setting.", zh: "关闭位移动画和自动播放，行为与系统减少动态效果设置一致。" },
];

export const metaballMenuTranslations = Object.fromEntries([
  [name, "黑白黏球菜单"],
  [description, "三个快捷操作从加号圆钮中分离，收起时融为一体。"],
  [instructions, "鼠标移入时收起，点击加号可切换。空闲时菜单自动演示。"],
  ...METABALL_MENU_API.map(({ en, zh }) => [en, zh]),
]);
