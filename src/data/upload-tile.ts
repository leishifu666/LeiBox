import type { MotionEntry } from "./interaction-components";

const name = "Dissolve Upload Tile";
const description = "An attachment assembles from grains as it uploads, then disintegrates on failure, cancellation or removal.";
const instructions = "Choose a simulated result and add an attachment. Click during upload to cancel, or remove the finished tile with the cross.";

export const UPLOAD_TILE_ENTRY: MotionEntry = {
  slug: "upload-tile", href: "/docs/animations/upload-tile", name, category: "File upload",
  description, instructions,
  keywords: "dissolve upload tile upload tray grain attachment progress abort cancel file size error 上传 附件 瓦片 进度 粒子 取消 超限",
  preview: "/assets/components/upload-tile.png", sourceFile: "upload-tile.html",
  canvasWidth: 820, canvasHeight: 348, responsive: true, recreatedHtml: true, viewportPlayback: true,
  referenceUrl: "https://dissolve.rselmi.com/",
  referenceSourceUrl: "https://www.npmjs.com/package/dissolve-ui/v/0.0.6",
  referencePackage: "dissolve-ui@0.0.6", referenceAuthor: "Rayan Selmi · dissolve",
  referenceLicense: "MIT License · Copyright (c) 2026 Rayan Selmi.",
  referenceNotes: "Uses Dissolve's original Web grain assembly, dust and snap effects, with a simulated upload for the LeiBox preview.",
  codeSource: "MIT-licensed dissolve upload tile and Canvas 2D grain engine, with a LeiBox attachment tray and framework adapters.",
  prompt: `制作聊天输入框的附件组件 UploadTray 和单个 UploadTile。附件由调用方传入，每项有稳定 id、name、以字节为单位的 size、可选缩略图 uri。上传由 upload(file, onProgress, signal) 驱动，onProgress 接收 0 到 1，AbortSignal 负责取消；超过 maxSize 时跳过上传。
用 Canvas 2D 预绘制 72px 正方形圆角卡片，图片铺满，其余显示文件图标、扩展名、截断的名称和大小。把卡片切成 2px 的粒子，以每点的横坐标和固定噪声计算先后顺序，上传进度越高，从左到右落下的粒子越多。上传成功并拼完整张卡片时，右上角才淡入移除按钮。拒绝时先拼完整张卡片，抖动三次、染红，再化作尘粒，附件占位同时收拢。上传中点击卡片时取消请求，已呈现的粒子从点击点向外弹散。用 onRemove(file, reason) 通知调用者，reason 为 rejected、cancelled 或 removed。键盘也可取消或移除。使用 CSS 主题变量控制颜色，兼容减少动态效果。试玩用可切换结果的模拟上传，支持成功、上传失败和超出大小。`,
};

export const UPLOAD_TILE_API = [
  { key: "files", type: "(UploadFile & { id: string })[]", en: "Attachments with stable IDs, names, and sizes in bytes. An optional uri shows a thumbnail.", zh: "每个附件包含稳定 ID、文件名、字节大小，可选 uri 用来显示缩略图。" },
  { key: "upload", type: "UploadFn", en: "Upload the file, report progress from 0 to 1, and stop when the AbortSignal aborts.", zh: "上传文件，报告 0 到 1 的进度，并响应 AbortSignal 取消请求。" },
  { key: "maxSize", type: "number", en: "Maximum file size in bytes. Larger files are rejected before uploading.", zh: "文件大小上限，单位为字节。超限时直接进入错误动画。" },
  { key: "onAdd", type: "() => void", en: "Show the add button and call this function when it is pressed.", zh: "提供此回调可显示添加按钮，点击时由应用打开自己的文件选择器。" },
  { key: "onDone", type: "(file: UploadFile) => void", en: "Called once the upload resolves and the tile is whole.", zh: "上传成功且粒子拼成完整附件时触发。" },
  { key: "onRemove", type: "(file: UploadFile, reason: RemoveReason) => void", en: "Called after dismissal. Remove the file from the controlled files array.", zh: "附件退场后触发，应用可从 files 中移除该文件。" },
  { key: "size", type: "number", defaultValue: "72", en: "Tile side length in pixels for new attachments.", zh: "新加入附件的边长，单位为像素。" },
  { key: "gap", type: "number", defaultValue: "6", en: "Spacing between tiles, in addition to the space around each tile.", zh: "附件之间的额外间距。" },
  { key: "tileClassName", type: "string", en: "Style the tile face. Theme colors also read the --dissolve-* CSS variables.", zh: "设置附件表面的样式，颜色也可用 --dissolve-* CSS 变量覆盖。" },
  { key: "haptics", type: "boolean", en: "Enable vibration where the browser supports it.", zh: "在支持振动的浏览器启用触觉反馈。" },
  { key: "locale", type: '"en" | "zh"', defaultValue: '"en"', en: "Set the language of the attachment labels and demo controls.", zh: "设置附件无障碍标签和演示控件语言。" },
];

export const uploadTileTranslations = Object.fromEntries([
  [name, "Dissolve 粒子上传"],
  ["File upload", "附件上传"],
  [description, "上传时粒子逐步拼成附件，失败、取消或移除时散开。"],
  [instructions, "选择模拟结果，再添加附件。上传中点击附件可取消，完成后可用叉号移除。"],
  ...UPLOAD_TILE_API.map(({ en, zh }) => [en, zh]),
]);
