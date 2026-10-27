import { MOTION_PROMPTS } from "./motion-prompts.mjs";
import { FLUID_TOOLTIP_PROMPT } from "./fluid-tooltip.mjs";
import { BRAND_POSTER_CARDS_PROMPT } from "./brand-poster-cards.mjs";
import { COLLECTION_LAYOUT_PROMPT } from "./collection-layout-morph.mjs";
import { SPIDER_MUSIC_PLAYER_PROMPT } from "./spider-music-player.mjs";
import { DOT_MATRIX_TRIO_PROMPT } from "./dot-matrix-trio.mjs";
import { INLINE_TEXT_MORPH_PROMPT } from "./inline-text-morph.mjs";
import { SELECTION_FLOWER_PROMPT } from "./selection-flower.mjs";
import { GALAXY_EFFORT_SLIDER_PROMPT } from "./galaxy-effort-slider.mjs";
import { NOTES_TEXT_COLOR_PROMPT } from "./notes-text-color.mjs";
import { STAGGERED_RADIAL_MENU_PROMPT } from "./staggered-radial-menu.mjs";
import { SOFT_ACTION_WHEEL_PROMPT } from "./soft-action-wheel.mjs";
import { ELASTIC_PANEL_RESIZE_PROMPT } from "./elastic-panel-resize.mjs";
import { GRADIENT_COVER_WALL_PROMPT } from "./gradient-cover-wall.mjs";

import { GLASS_FOLDER_PROMPT, COSMIC_PANELS_PROMPT } from "./folder-cosmos.mjs";
import { THINKING_PARTICLES_PROMPT } from "./thinking-particles.mjs";
import { CRUMPLED_PAPER_PROMPT } from "./crumpled-paper.mjs";
import { SAILING_TOC_PROMPT } from "./sailing-toc.mjs";
import { GLASS_TAB_MENU_PROMPT } from "./glass-tab-menu.mjs";
import { HAMMERHEAD_CHART_PROMPT } from "./hammerhead-chart.mjs";
import { EFFORT_SLIDER_PROMPT, DEEP_AGENT_COMPOSER_PROMPT } from "./deep-agent.mjs";
/** Interactive examples and their individual source references. */
export interface MotionEntry {
  slug: string;
  href: string;
  name: string;
  category: string;
  description: string;
  keywords: string;
  preview: string;
  sourceFile?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  instructions?: string;
  prompt?: string;
  referenceUrl?: string;
  referenceAuthor?: string;
  referenceAuthorUrl?: string;
  referenceNotes?: string;
  referenceLicense?: string;
  codeSource?: string;
  responsive?: boolean;
  suppliedSource?: string;
  recreatedHtml?: boolean;
}

export const INTERACTION_COMPONENTS: MotionEntry[] = [
  {
    slug: "fluid-tooltip", href: "/docs/animations/fluid-tooltip", name: "Fluid Tooltip", category: "Tooltip interaction",
    description: "One dark capsule follows six navigation items, changes width, and reveals anchored labels through a moving crop. The profile uses the LeiBox logo.",
    keywords: "流体 提示 气泡 胶囊 导航 侧栏 悬浮 Logo LeiBox fluid tooltip capsule navigation sidebar hover profile",
    preview: "/assets/components/fluid-tooltip.png", sourceFile: "流体提示气泡.html", canvasWidth: 1288, canvasHeight: 1080,
    instructions: "Hover or focus the icons to move the tooltip. Click to select; arrow keys move focus and Escape closes it.",
    prompt: FLUID_TOOLTIP_PROMPT, recreatedHtml: true,
    codeSource: "Independent LeiBox DOM/CSS/GSAP tooltip implementation with an embedded brand mark, Lucide icons and Inter font.",
  },
  {
    slug: "spider-music-player", href: "/docs/animations/spider-music-player", name: "Spider Track Switcher", category: "Music interaction",
    description: "An eight-legged spider spins a web around an album cover and carries it between the queue and player, with real album artwork and working local controls.",
    keywords: "蜘蛛 蛛丝 结网 专辑 封面 音乐 播放器 队列 切歌 牵引 spider web music player album cover queue track switcher Divan Raj",
    preview: "/assets/components/spider-music-player.png", sourceFile: "蜘蛛牵引切歌.html", canvasWidth: 1416, canvasHeight: 1080,
    instructions: "Choose a queue row, or use previous and next to watch the spider fetch and return covers. Search, pause, seek, like and add tracks locally; the demo does not stream audio.",
    prompt: SPIDER_MUSIC_PLAYER_PROMPT, recreatedHtml: true,
    referenceUrl: "https://x.com/desdivj/status/2114305692547043677/video/1", referenceAuthor: "Divan Raj", referenceAuthorUrl: "https://x.com/desdivj",
    referenceNotes: "Decoded all 403 frames of the original 2832×2160, 60fps, 6.7167s clip. Close-up reviews measured the concentric 78/68/60px device corners, 24px artwork corners, column separators and control icons. The spider is clipped inside the white screens and has independently drawn tapered leg segments, knee joints, curved sharp feet, palps and a shaded teardrop abdomen. The right-screen spider fetches left queue thumbnails; the left-screen spider returns the right main cover. That cross-screen role is preserved for repeated requests and first/last-track wrapping, rather than blindly alternating sides. Cover wind-up tremor and a roughly 0.267s landing recoil were measured separately: the case peaks near 3.5px translation and 0.3 degrees rotation with opposite signs for forward/reverse. Font choice, paths, web geometry, gait and easing remain reconstruction estimates. At the user's request, all album images are real Apple Music/iTunes covers, paired with verified song and artist metadata. Search, adding, keyboard, touch, rapid-action coalescing and reduced motion are local adaptations. Playback uses a local timer without audio.",
    referenceLicense: "Original motion design/source license not supplied or independently verified. Reference footage remains internal. Album covers retain their respective owners' rights and Apple Music source records; no free artwork redistribution license is claimed. No song audio, commercial font or original author code is included.",
    codeSource: "Independent DOM, inline SVG and GSAP reconstruction. Eight verified third-party album covers with copyright and source records are used as requested; no AI-generated cover art is used.",
  },
  {
    slug: "collection-layout-morph", href: "/docs/animations/collection-layout-morph", name: "Collection Layout Morph", category: "Layout transition",
    description: "The same three Claude, Codex and Grok SVG images smoothly move between a list, a card row and an overlapping pack.",
    keywords: "列表 卡片 叠放 堆叠 布局 切换 图片 共享 元素 Claude Codex Grok list card pack shared layout morph collectibles Shawn Kel",
    preview: "/assets/components/collection-layout-morph.png", sourceFile: "列表卡片堆叠切换.html", canvasWidth: 1280, canvasHeight: 720,
    instructions: "Choose List view, Card view or Pack view. Use arrow keys, Home or End on the tabs; all three SVG images keep their identity through rapid changes.",
    prompt: COLLECTION_LAYOUT_PROMPT, recreatedHtml: true,
    referenceUrl: "https://x.com/shawn_kel/status/2087937950424129978/video/1", referenceAuthor: "Previous Leon", referenceAuthorUrl: "https://x.com/shawn_kel",
    referenceNotes: "Decoded all 770 frames of the original 1282×720, 60fps, 12.833s clip, titled Same element, new position. Measured List/Card/Pack targets, moving selection pill and metadata bars. The user requested three images instead of two, using existing Claude, Codex and Grok SVGs. The three-column sizing, three-card pack, logo backgrounds, keyboard/touch support and external view option are local adaptations. Transition timing/easing is a measured reconstruction, not the original Motion source.",
    referenceLicense: "Original layout/code license not supplied or independently verified; original illustrations and reference video are not redistributed. Reused existing Claude/Codex vectors retain Lobe Icons Copyright (c) 2023 LobeHub and MIT notice. Grok Bot artwork source is recorded separately without claiming an MIT license for it.",
    codeSource: "Independent persistent-DOM layout state machine and GSAP transitions. Three embedded SVGs reuse the project's pinned Graphical/Lobe Icons assets, with their source records and applicable license notices retained.",
  },
  {
    slug: "brand-poster-cards", href: "/docs/animations/brand-poster-cards", name: "Brand Poster Cards", category: "Brand layout",
    description: "Three portrait posters pair a small corner symbol, a centered brand wordmark, and a shared introduction. The photographs gently zoom while the branding stays fixed.",
    keywords: "品牌 海报 三联 卡片 人像 图片 肖像 字标 标志 排版 LeiBox brand poster cards portrait triptych logo identity photography",
    preview: "/assets/components/brand-poster-cards.png", sourceFile: "品牌海报三联卡片.html", canvasWidth: 1200, canvasHeight: 675,
    instructions: "Hover or focus a portrait for a gentle photo zoom. Tap, Enter or Space pins it; Escape clears it. Copy the component to replace the three photos, wordmark, corner symbol, and description.",
    prompt: BRAND_POSTER_CARDS_PROMPT, recreatedHtml: true,
    referenceAuthor: "User-provided screenshot; author unknown",
    referenceNotes: "Measured the user-provided 3840×2160 static Ninja presentation: three approximately 728×1226 panels at x640/1558/2475, left-top symbols, centered white lockups and repeated bottom copy. Replaced all portraits with the user's three 816×1456 images and reused the exact existing LeiBox SVG wordmark and symbol. Shared English copy is the current site's approved brand introduction, retaining the reference's English language. The user confirmed no original author or URL is available. Photo zoom, keyboard, touch and image replacement are local adaptations, not observed original motion.",
    referenceLicense: "Original layout designer/license unknown. User supplied the replacement portraits and requested reuse of the site's own LeiBox brand assets; no original Ninja images, logo or copy are redistributed.",
    codeSource: "Independent DOM/CSS/GSAP reconstruction of a user-provided screenshot, with user-provided portrait assets and existing LeiBox brand vectors.",
  },
  {
    slug: "dot-matrix-trio", href: "/docs/animations/dot-matrix-trio", name: "Dot Matrix Ripple and Spiral", category: "Dot animation",
    description: "Three synchronized dot grids form expanding two-color ripples, a rotating spiral, and a growing circular pulse on printed cards.",
    keywords: "点阵 波纹 旋涡 漩涡 圆形 扩散 三联 卡片 LeiBox 雷师傅 Chris Halaska dot matrix ripple spiral pulse",
    preview: "/assets/components/dot-matrix-trio.png", sourceFile: "点阵波纹与旋涡.html", canvasWidth: 960, canvasHeight: 540,
    instructions: "Click or tap a card to pause or resume all three patterns. Use Enter or Space when focused, arrow keys to step, and Home or Escape to reset.",
    prompt: DOT_MATRIX_TRIO_PROMPT, recreatedHtml: true,
    referenceUrl: "https://x.com/chalaska/status/2096917032621199665/video/1", referenceAuthor: "Chris Halaska", referenceAuthorUrl: "https://x.com/chalaska",
    referenceNotes: "Downloaded the author-posted 3840×2160, 376-frame, 29.97fps, 12.545s clip. Observed three 20×20 grids, a fixed blue-to-mint backdrop, two-color radial waves, a curved spiral, and a two-second expanding disk with four fixed corner markers. Layout measured at 960×540. Trigonometric fields approximate the recorded motion. At the user's request, Circuit marks and text were replaced with the existing LeiBox vector brand and copy drafted through Gemini 3.1 Pro. Pause, frame-step, reset and keyboard controls are added adaptations; the clip only shows automatic playback.",
    referenceLicense: "Original design, Circuit brand and artwork license not verified. Reference media is retained only as internal evidence; no original artwork, font or source code is included.",
    codeSource: "Independent DOM and Canvas reconstruction by LeiBox; no original author source code was obtained or redistributed.",
  },
  {
    slug: "selection-flower", href: "/docs/animations/selection-flower", name: "Text Selection Flowers", category: "Text selection",
    description: "Drag to select real text and grow seeded, outlined flowers around each character; release to fold the petals, leaves, and stems back into the page.",
    keywords: "文字 选区 选择 拖选 开花 花朵 生长 收回 植物 随机 text selection flowers bloom grow reverse seeded canvas Omerico",
    preview: "/assets/components/selection-flower.png", sourceFile: "文字选区开花.html", canvasWidth: 822, canvasHeight: 720,
    instructions: "Drag across the text, then release to watch the flowers grow backwards. Focus a paragraph and press Enter, extend with Shift + arrow keys, or clear with Escape. Touch supports tapping and native text selection.",
    prompt: SELECTION_FLOWER_PROMPT, recreatedHtml: true,
    referenceUrl: "https://x.com/omer_assa/status/2083862523640496179/video/1", referenceAuthor: "Omerico", referenceAuthorUrl: "https://x.com/omer_assa",
    referenceNotes: "Downloaded the original available 822×720 H.264 clip, decoded all 533 frames (8.876667s, nominal 60fps), and compared three selections: first paragraph across two lines, second paragraph, and italic third paragraph. Observed green/white native selection, seeded coloured flowers with black outlines, stems and leaves, and reverse growth after release while selection remains. Georgia/Times are local font substitutions; growth rates, seed formula and geometry are measured reconstruction estimates. Keyboard selection, touch tapping and reduced motion are accessibility adaptations. The final sentence mentions an optional cursor mode, but no control or cursor-mode interaction is shown, so it is not added.",
    referenceLicense: "Original design/source license not supplied or independently verified. Reference footage is internal evidence only; no original source, font files or vector artwork are redistributed.",
    codeSource: "Independent DOM Selection/Range and Canvas 2D implementation from observed video frames. Flower geometry and deterministic generator are newly written local reconstruction code.",
  },
  {
    slug: "inline-text-morph", href: "/docs/animations/inline-text-morph", name: "Inline Phrase Morph", category: "Text interaction",
    description: "Click three inline pills to morph shared letters, resize the sentence, and swap illustrated stickers with a spring.",
    keywords: "内联 词组 文字 字符 字母 变形 重排 胶囊 图标 Torph Graphical text morph inline phrase letter flip",
    preview: "/assets/components/inline-text-morph.png", sourceFile: "内联词组变形.html", canvasWidth: 1044, canvasHeight: 684,
    instructions: "Click a highlighted word to cycle its text and sticker. Use Enter, Space, arrow keys, Home or End; each group changes independently.",
    prompt: INLINE_TEXT_MORPH_PROMPT, recreatedHtml: true,
    referenceUrl: "https://x.com/lochieaxon/status/2107673625696641174/video/1", referenceAuthor: "Graphical", referenceAuthorUrl: "https://www.graphicalui.com/",
    referenceNotes: "The 2088×1368, 586-frame, 10.281s video was posted by Lochie Axon and links to Graphical. Checked the recorded language, customize, and agent cycles, and the current public landing page's 200ms Torph text transition. Original GT Standard L is replaced by licensed Inter. Claude, Cursor and Grok Bot now use the reference page's existing SVGs; Codex uses Lobe Icons' existing colour SVG, with its app tile removed and a white sticker outline added. Themes and spacing adapt the reference inline SVG geometry and paint order; other feature stickers are locally reconstructed.",
    referenceLicense: "Graphical's design and additional artwork license not independently verified. Lobe Icons' Codex, Claude and Cursor vector contributions retain Copyright (c) 2023 LobeHub and the full MIT notice. Grok Bot's source is recorded separately without claiming an MIT license for it. No commercial font files or reference video are redistributed.",
    codeSource: "Independently rebuilt layout, remaining feature stickers, width spring and lifecycle; themes/spacing SVG geometry and paint order follow the reference. Existing agent SVGs from Graphical and Lobe Icons retain their source records and applicable notices. Bundled Torph 0.1.3 by Lochie Axon under MIT with its complete notice retained.",
  },
  {
    slug: "galaxy-effort-slider", href: "/docs/animations/galaxy-effort-slider", name: "Brain Particle Effort Slider", category: "Drag & focus",
    description: "A pink brain gains more folds as effort increases through six levels, then glows with a twinkling pixel track, dotted rays, and a brief shake in Galaxy mode.",
    keywords: "脑形 大脑 褶皱 脑沟 沟回 生长 滑块 推理 强度 粒子 点阵 发光 六档 银河 brain folds wrinkles particle effort slider galaxy low medium high extra max ozzy",
    preview: "/assets/components/galaxy-effort-slider.png", sourceFile: "脑形滑块粒子增强.html", canvasWidth: 945, canvasHeight: 516,
    instructions: "Drag the brain, click the track, or use arrow keys to change effort. End selects Galaxy; Home or Escape resets to Low. Values stay in this local demo.",
    prompt: GALAXY_EFFORT_SLIDER_PROMPT, recreatedHtml: true,
    referenceUrl: "https://x.com/ozzyxs1a/status/2107523169649389677/video/1", referenceAuthor: "ozzy", referenceAuthorUrl: "https://x.com/ozzyxs1a",
    referenceNotes: "Downloaded the original 1890×1032 clip and decoded all 315 frames (5.55s). Observed Low → Medium → High → Extra → Max → Galaxy, a persistent brain thumb, pink progress fill, staggered blurred letters, a violet pixel track, radial square particles and short card vibration. Half-size 945×516 geometry measured from frames 0, 140 and 160; spring/particle coefficients are reconstruction estimates. Keyboard, touch, cancellation, help tooltip and reverse motion are local accessibility adaptations. Progressively growing brain folds are a later user-requested design extension, not an observed feature of the original clip.",
    referenceLicense: "Original design/source license not supplied or independently verified. The reference video is retained for internal comparison only.",
    codeSource: "Independent DOM, inline SVG and Canvas reconstruction from the reference video; no original author code, fonts or assets obtained.",
  },
  {
    slug: "notes-text-color", href: "/docs/animations/notes-text-color", name: "Notes Text Color", category: "Text selection",
    description: "Select note text to open a frosted nine-color palette, tint a real multiline selection, and return to recently colored passages.",
    keywords: "文字 选区 调色器 颜色 笔记 备忘录 荧光 历史 磨砂 notes text color selection palette highlight typography",
    preview: "/assets/components/notes-text-color.png", sourceFile: "文字选区调色器.html", canvasWidth: 900, canvasHeight: 1080,
    instructions: "Drag to select text, double-click a word, or tap a colored phrase. Pick a color or revisit a recent selection. Focus a paragraph and press Enter for keyboard controls; Notes resets the demo.",
    prompt: NOTES_TEXT_COLOR_PROMPT, recreatedHtml: true,
    referenceUrl: "https://x.com/heydamir/status/2106779932659470606/video/1", referenceAuthor: "Damir Sokolovsky", referenceAuthorUrl: "https://x.com/heydamir",
    referenceNotes: "Observed the original 1800×2160, 19.283-second video: dark phone notes, focused paragraph, multiline selection handles, a compact 3×3 frosted palette, tinted text, and four recent text-color entries. Layout and animation timings are reconstructed estimates; keyboard controls, draggable handles, and the custom hue slider complete the local interaction. The camera zoom in the latter half is footage presentation, not a palette state.",
    referenceLicense: "Original design/source license not supplied or verified; the original video and author source are not redistributed.",
    codeSource: "Independent DOM, Selection/Range, CSS and GSAP reconstruction from observed video frames.",
  },
  {
    slug: "bounding-box-resize", href: "/docs/animations/bounding-box-resize", name: "Bounding Box Resize", category: "Drag & focus",
    description: "Eight square handles morph into directional arrows, with live size pills, editable dimensions, and guides as the selection resizes.",
    keywords: "选框 拖拽 缩放 边框 控制点 箭头 尺寸 输入 形变 bounding box resize handles arrows dimensions guides selection",
    preview: "/assets/components/bounding-box-resize.png", sourceFile: "选框拖拽缩放.html", canvasWidth: 1200, canvasHeight: 600,
    instructions: "Drag a corner or edge handle. Click a visible size pill to type a dimension; Enter applies it and Escape cancels. Focus a handle to use arrow keys, Shift for larger steps, or Escape to reset.",
    prompt: MOTION_PROMPTS["bounding-box-resize"], recreatedHtml: true,
    referenceUrl: "https://x.com/azlenelza/status/2106600214593462393/video/1", referenceAuthor: "Azlen", referenceAuthorUrl: "https://x.com/azlenelza",
    referenceNotes: "Observed the original 1920×960, 858-frame video at 60fps: eight square-to-arrow handles, corner resize to 384×261, editing height to 200, and right-edge resize back to 291 with a horizontal guide. Intro/outro magnification is treated as presentation framing. Dimensions and geometry were measured; spring coefficients, minimum sizes and keyboard support are local adaptations.",
    referenceLicense: "Original design license not supplied or independently verified; the video is retained only for internal comparison.",
    codeSource: "Independent native DOM/SVG reconstruction from observed frames; no original author source or assets obtained.",
  },
  {
    slug: "soft-action-wheel", href: "/docs/animations/soft-action-wheel", name: "Soft Action Wheel", category: "Menu interaction",
    description: "Six monochrome actions spring inward with a short clockwise stagger, framed by fine grey rims, white highlights, and soft shadows; all scatter out together on close.",
    keywords: "柔光 浅色 环形 菜单 展开 细边 高光 阴影 模糊 弹簧 action wheel soft neumorphic radial menu",
    preview: "/assets/components/soft-action-wheel.png", sourceFile: "柔光环形菜单展开.html", canvasWidth: 960, canvasHeight: 960,
    instructions: "Click + to reveal the actions, or × to scatter them out. Keyboard and touch are supported; each action records a local choice without opening another application.",
    prompt: SOFT_ACTION_WHEEL_PROMPT, recreatedHtml: true,
    referenceUrl: "https://x.com/withAnimationUI/status/2110643020890849625/video/1", referenceAuthor: "withAnimation", referenceAuthorUrl: "https://x.com/withAnimationUI",
    referenceNotes: "Downloaded the original 960×960 video and decoded all 420 frames. Observed a 194px central button, 178px actions, 224px resting radius, approximately 15ms opening stagger and simultaneous outward dismissal. Spring and material values are local measured reconstructions.",
    referenceLicense: "Original design license not supplied or independently verified; the reference video is retained only for internal comparison.",
    codeSource: "Variant of the local native radial-menu core, with independently reconstructed SVGs and light-surface styling; no original author source obtained.",
  },
  {
    slug: "staggered-radial-menu", href: "/docs/animations/staggered-radial-menu", name: "Staggered Radial Menu", category: "Menu interaction",
    description: "Six coloured actions arrive from the outside in clockwise order, spring into a ring, then scatter outwards in reverse with soft blur.",
    keywords: "环形 菜单 交错 展开 圆形 按钮 加号 模糊 错峰 弹簧 stagger radial menu clockwise blur spring",
    preview: "/assets/components/staggered-radial-menu.png", sourceFile: "环形菜单交错展开.html", canvasWidth: 960, canvasHeight: 960,
    instructions: "Click + to open the actions and × to scatter them outwards. Touch and keyboard work too; choosing an action only updates this local demonstration.",
    prompt: STAGGERED_RADIAL_MENU_PROMPT, recreatedHtml: true,
    referenceUrl: "https://x.com/nitishkmrk/status/2110936271078281321/video/1", referenceAuthor: "Nitish Khagwal", referenceAuthorUrl: "https://x.com/nitishkmrk",
    referenceNotes: "Downloaded the original 960×960 video and decoded all 280 frames. Geometry, clockwise arrival, reverse dismissal, blur, and spring overshoot were measured from the footage.",
    referenceLicense: "Original design license not verified; attribution does not grant redistribution rights to original assets.",
    codeSource: "Independent DOM/CSS/SVG reconstruction; no original author source or vector files obtained.",
  },
  {
    slug: "elastic-panel-resize", href: "/docs/animations/elastic-panel-resize", name: "Elastic Panel Resize", category: "Drag & focus",
    description: "A resizable blank panel with a hidden handle, directional bending, and a short resisted stretch beyond its width limits.",
    keywords: "弹性 面板 缩放 调整 宽度 拖动 把手 弯曲 回弹 elastic panel resize spring handle drag",
    preview: "/assets/components/elastic-panel-resize.png", sourceFile: "弹性面板缩放.html", canvasWidth: 1000, canvasHeight: 1000,
    instructions: "Drag the left edge to resize. Use arrow keys, Home or End when focused; double-click or press Escape to reset.",
    prompt: ELASTIC_PANEL_RESIZE_PROMPT, recreatedHtml: true,
    referenceUrl: "https://x.com/alvish/status/2111084319716647114/video/1", referenceAuthor: "Alvish", referenceAuthorUrl: "https://x.com/alvish",
    referenceNotes: "Rechecked all 1,255 original 1992×1994 frames at 60fps: the handle starts hidden, reveals a 75×15 capsule, bends and translates in the drag direction, and stretches straight beyond width limits. Initial edge 38.65%, settled limits approximately 27.6–50%, resisted extension approximately 15px per 1000px scene. Animation coefficients are reconstructed estimates. Reference license not supplied or independently verified.",
    referenceLicense: "Reference design license not supplied or independently verified; the original video and source are not redistributed.",
    codeSource: "Independent DOM/SVG reconstruction under the repository license; no original author source supplied.",
  },
  {
    slug: "blue-fluted-glass", href: "/docs/animations/blue-fluted-glass", name: "Blue Fluted Glass Background", category: "Canvas interaction",
    description: "Slow blue fluid folds refract through vertical frosted-glass ribs behind a fixed white LeiBox logo.",
    keywords: "蓝色 棱纹 流动 背景 毛玻璃 竖纹 流体 渐变 品牌 标志 blue fluted ribbed frosted glass fluid gradient background logo LeiBox",
    preview: "/assets/components/blue-fluted-glass.png", sourceFile: "蓝色棱纹流动背景.html", canvasWidth: 1200, canvasHeight: 833,
    instructions: "Watch the blue folds flow behind the fixed LeiBox logo. Click, tap, or press Space or Enter to pause and resume. Reduced motion shows a still frame.",
    prompt: MOTION_PROMPTS["blue-fluted-glass"], recreatedHtml: true,
    referenceUrl: "https://x.com/sashabirukoff/status/2113002960892649916/video/1", referenceAuthor: "sasha birukoff", referenceAuthorUrl: "https://x.com/sashabirukoff",
    referenceNotes: "Observed a 1920×1332, 505-frame video at approximately 30fps: automatic blue/white fluid motion, fixed vertical refraction ribs, and a stationary centered Valence logo. LeiBox artwork replaces the logo. The 28-second procedural cycle and pause controls are local adaptations.",
    referenceLicense: "Original design/source license not supplied or verified; no original code or video is included in the component package.",
    codeSource: "Independent WebGL reconstruction from observed video frames; existing LeiBox vector artwork embedded locally.",
  },
  {
    slug: "reasoning-effort-slider", href: "/docs/animations/reasoning-effort-slider", name: "Reasoning Effort Slider", category: "Drag & focus",
    description: "A three-stop thinking slider with a flowing star field, velocity-driven jelly deformation, and soft snapping from Simple to Deep.",
    keywords: "模型 思考 强度 推理 滑块 深度 简单 中度 深度 星空 液态 拖拽 Deep Agent reasoning effort thinking slider jelly",
    preview: "/assets/components/reasoning-effort-slider.png", sourceFile: "模型思考强度滑块.html", canvasWidth: 520, canvasHeight: 420,
    instructions: "Drag the thumb, click a stop, or use the arrow keys and Home/End. Copy the standalone slider to connect its value to your own model settings.",
    prompt: EFFORT_SLIDER_PROMPT, responsive: true, recreatedHtml: true,
  },
  {
    slug: "deep-agent-composer", href: "/docs/animations/deep-agent-composer", name: "Deep Agent Composer", category: "Panel morphing",
    description: "The original Deep Agent Composer, including permission controls, context capacity, attachments, model selection, and the thinking-effort slider.",
    keywords: "Agent 对话 输入框 模型 思考 强度 推理 菜单 附件 计划 模式 Deep Agent composer chat model thinking reasoning effort slider",
    preview: "/assets/components/deep-agent-composer.png", sourceFile: "Agent对话输入框.html", canvasWidth: 900, canvasHeight: 600,
    instructions: "Open the original model pill to change thinking depth. Try the permission menu, context ring, attachments, or send action. The original React UI runs locally without a model connection.",
    prompt: DEEP_AGENT_COMPOSER_PROMPT, responsive: true, recreatedHtml: true,
  },
  {
    slug: "hammerhead-chart", href: "/docs/animations/hammerhead-chart", name: "ASCII Shark Price Paths", category: "Canvas interaction",
    description: "An ASCII hammerhead swims along three forecast price paths and tags each with its odds, volatility and dealer gamma; the pointer steers it to the nearest path, or lets it swim freely over the candle history.",
    keywords: "鲨鱼 锤头鲨 字符 ASCII 价格 路径 预测 K线 概率 金融 图表 终端 hammerhead shark price paths forecast candles chart terminal",
    preview: "/assets/components/hammerhead-chart.png", sourceFile: "字符鲨鱼追踪价格路径.html", canvasWidth: 1200, canvasHeight: 720,
    instructions: "Watch the shark tag each path in turn. Move the pointer over the forecast cone, hover or click a label, or use the arrow keys to choose a path. Prices are local demonstration data.",
    prompt: HAMMERHEAD_CHART_PROMPT, recreatedHtml: true,
    referenceUrl: "https://x.com/stackedlol/status/2113757384656974179/video/1", referenceAuthor: "stacked", referenceAuthorUrl: "https://x.com/stackedlol",
  },
  {
    slug: "glass-tab-menu", href: "/docs/animations/glass-tab-menu", name: "Glass Tab Menu", category: "Panel morphing",
    description: "A frosted four-tab bar expands into six creation actions, with a translucent sliding selection and a rotating plus button.",
    keywords: "玻璃 标签栏 菜单 展开 六宫格 加号 磨砂 滑动 glass tabs menu morph frosted toolbar creation",
    preview: "/assets/components/glass-tab-menu.png", sourceFile: "玻璃标签栏展开菜单.html", canvasWidth: 1080, canvasHeight: 1080,
    instructions: "Click a tab to move the selection, or press + to open the six-action menu. Keyboard and touch are supported; actions use local demonstration state.",
    prompt: GLASS_TAB_MENU_PROMPT, recreatedHtml: true,
    referenceUrl: "https://x.com/SolutionB2u/status/2113575003341881728/video/1", referenceAuthor: "solutionb", referenceAuthorUrl: "https://x.com/SolutionB2u",
  },
  {
    slug: "crumpled-paper", href: "/docs/animations/crumpled-paper", name: "Crumpled Paper Unfold", category: "Canvas interaction",
    description: "Three crumpled paper meshes unfold into a handwritten letter, a blue mountain photograph, and a printed note as you hover.",
    keywords: "揉皱 纸团 纸张 展开 信件 照片 折痕 网格 悬停 crumpled paper unfold mesh letter photograph webgl",
    preview: "/assets/components/crumpled-paper.png", sourceFile: "揉皱纸张展开.html", canvasWidth: 1200, canvasHeight: 800,
    instructions: "Hover or focus a paper to unfold it, and move away to crumple it again. Tap on touch screens; use arrow keys, Space, or Escape with a keyboard.",
    prompt: CRUMPLED_PAPER_PROMPT, recreatedHtml: true,
    referenceUrl: "https://x.com/insporadesign/status/2113586239110828465/video/1", referenceAuthor: "Matt", referenceAuthorUrl: "https://x.com/Matthias_Oel",
  },
  {
    slug: "sailing-toc", href: "/docs/animations/sailing-toc", name: "Sailing Scroll Contents", category: "Scroll navigation",
    description: "A sailing ship follows the current section along a bending dashed route, with scroll tracking and smooth contents navigation.",
    keywords: "帆船 滚动 目录 导航 航线 虚线 弹簧 船 阅读 sailing ship scroll contents navigation toc spring",
    preview: "/assets/components/sailing-toc.png", sourceFile: "帆船滚动目录.html", canvasWidth: 1200, canvasHeight: 918,
    instructions: "Scroll the article or choose a contents entry. The ship follows the active section and leans as it changes direction. The article uses independent demonstration copy.",
    prompt: SAILING_TOC_PROMPT, recreatedHtml: true,
    referenceUrl: "https://x.com/emirayaz/status/2113414926911881647/video/1", referenceAuthor: "Emir Ayaz", referenceAuthorUrl: "https://x.com/emirayaz",
  },
  {
    slug: "thinking-particles", href: "/docs/animations/thinking-particles", name: "Thinking Step Particle Morph", category: "Canvas interaction",
    description: "Particles morph through five thinking steps, then collapse into a streamed answer with replay and copy controls.",
    keywords: "思考 步骤 粒子 变形 放大镜 魔方 积木 机械臂 礼物 AI 推理 thinking reasoning particles morph agent",
    preview: "/assets/components/thinking-particles.png", sourceFile: "思考步骤粒子变形.html", canvasWidth: 1200, canvasHeight: 810,
    instructions: "Watch the five thinking steps, pause or resume with the black button, and expand Thought after completion. The answer and controls use local demo data.",
    prompt: THINKING_PARTICLES_PROMPT, recreatedHtml: true,
    referenceUrl: "https://x.com/shridharathi/status/2113255894423158914/video/1", referenceAuthor: "Shridhar", referenceAuthorUrl: "https://x.com/shridharathi",
  },
  {
    slug: "glass-folder", href: "/docs/animations/glass-folder", name: "Glass Folder Cards", category: "Panel morphing",
    description: "Frosted folders open into a fan of real files, with generated artwork, a drop-in add action, and keyboard menus.",
    keywords: "glass folder files frosted blur art marble add fan menu 玻璃 文件夹 文件 磨砂 扇出 添加 菜单 纹理",
    preview: "/assets/components/glass-folder.png", sourceFile: "玻璃文件夹卡片.html", canvasWidth: 1200, canvasHeight: 600,
    instructions: "Hover or focus to peek, click to open, and press + to add a file. The dark folder has a keyboard-accessible menu. All files are local demo state.",
    prompt: GLASS_FOLDER_PROMPT, responsive: true, suppliedSource: "/motion/glass-folder-original.tsx", recreatedHtml: true,
  },
  {
    slug: "cosmic-panels", href: "/docs/animations/cosmic-panels", name: "Orbit & Halftone Animation", category: "Canvas interaction",
    description: "Orbital loading, flowing halftone clouds, and floating isometric servers form a three-panel cosmic visual system.",
    keywords: "cosmic space orbit loading astronaut servers globe halftone canvas 宇宙 星云 轨道 点阵 半色调 地球 服务器",
    preview: "/assets/components/cosmic-panels.png", sourceFile: "宇宙视觉卡片.html", canvasWidth: 1200, canvasHeight: 675,
    instructions: "Watch the three panels animate together. Click a panel, or focus it and press Space, to pause or resume. The reference video shows automatic playback.",
    prompt: COSMIC_PANELS_PROMPT, responsive: true, recreatedHtml: true,
    referenceUrl: "https://x.com/acream_1/status/2113235166453964924/video/1", referenceAuthor: "Acream",
    referenceAuthorUrl: "https://x.com/acream_1",
  },
  {
    slug: "gradient-cover-wall", href: "/docs/animations/gradient-cover-wall", name: "Interactive Gradient Cards",
    category: "Canvas interaction", description: "Six grainy gradient covers with fine SVG patterns, drifting colours, and spring-driven pointer light.",
    keywords: "渐变 封面 卡片墙 颗粒 噪点 柔光 纹样 弹簧 gradient grain noise cover wall radial spring canvas",
    preview: "/assets/components/gradient-cover-wall.png", sourceFile: "颗粒渐变封面卡片墙.html", canvasWidth: 1200, canvasHeight: 750,
    instructions: "Move across a cover to shift the colours and light. Focus a card and use the arrow keys, or press Escape to reset. Reduced motion keeps the covers still.",
    prompt: GRADIENT_COVER_WALL_PROMPT, responsive: true, recreatedHtml: true,
  },
  {
    slug: "otp-verification",
    href: "/docs/components/otp-verification",
    name: "OTP Input Verification",
    category: "Panel morphing",
    description: "A six-digit code unfolds from a pill, contracts to verify, and responds with an error shake or a green confirmation.",
    keywords: "otp verification code input password authentication pill morph error success 验证码 验证 输入 密码 胶囊 动效 错误 成功",
    preview: "/assets/components/otp-verification.png",
    referenceUrl: "https://x.com/bestsaasdesigns/status/2111020282551132539/video/1", referenceAuthor: "sucodee", referenceAuthorUrl: "https://x.com/sucodeee",
  },
  {
    slug: "brand-line-cards", href: "/docs/animations/brand-line-cards", name: "Pointer Line Cards",
    category: "Canvas interaction", description: "Apple, Google, and Tesla emerge from flowing vertical lines, with spring motion and pointer-driven detection boxes.",
    keywords: "品牌 线条 卡片 竖线 苹果 谷歌 特斯拉 检测框 连线 识别 噪声 弹簧 logo brand apple google tesla canvas luminance detection spring",
    preview: "/assets/components/brand-line-cards.png", sourceFile: "品牌竖线卡片.html", canvasWidth: 1200, canvasHeight: 720,
    instructions: "Move across each card to scatter the lines and change detection boxes. Tap on touch screens, or focus a card with the keyboard. Reveal the source opens its SVG path.",
    prompt: MOTION_PROMPTS["brand-line-cards"],
    referenceUrl: "https://x.com/ianneo_ai/status/2112718197690691657/video/1", referenceAuthor: "Ian (伊恩)",
    referenceAuthorUrl: "https://x.com/ianneo_ai",
  },
  {
    slug: "share-invite",
    href: "/docs/components/share-invite",
    name: "Share Invite Panel",
    category: "Panel morphing",
    description: "An expandable sharing panel with email invitations, member roles, and a real copy-link action.",
    keywords: "motion animation share invite collaboration permissions email 动效 分享 邀请 协作 权限 邮箱 弹簧 面板 形变",
    preview: "/assets/components/share-invite.png",
    referenceUrl: "https://x.com/sucodeee/status/2111061993599713612/video/1", referenceAuthor: "sucodee", referenceAuthorUrl: "https://x.com/sucodeee",
  },
  {
    slug: "bouncy-access", href: "/docs/animations/bouncy-access", name: "Expandable Access Request",
    category: "Panel morphing", description: "A compact access request expands into an avatar list with staggered spring motion.",
    keywords: "动效 访问 权限 申请 弹性 展开 收起 头像 access request spring morph panel",
    preview: "/assets/components/bouncy-access.png", sourceFile: "弹性访问控制组件.html", canvasWidth: 500, canvasHeight: 460,
    instructions: "Click the request pill to expand, then use the chevron to collapse. Approval buttons are visual examples.",
    prompt: MOTION_PROMPTS["bouncy-access"],
  },
  {
    slug: "velocity-drag", href: "/docs/animations/velocity-drag", name: "Inertial Calendar Drag",
    category: "Drag & focus", description: "Calendar events turn into a floating focus card that stretches and follows drag velocity.",
    keywords: "动效 气动 对焦 拖拽 日历 日程 速度 惯性 形变 drag velocity focus calendar physics",
    preview: "/assets/components/velocity-drag.png", sourceFile: "气动对焦拖拽.html", canvasWidth: 1040, canvasHeight: 720,
    instructions: "Drag a calendar event to another day or time. Open the full preview for a larger calendar.",
    prompt: MOTION_PROMPTS["velocity-drag"],
  },
  {
    slug: "ai-generating", href: "/docs/animations/ai-generating", name: "Dot Grid Loader",
    category: "Loading feedback", description: "A restrained 20-by-20 dot field pulses around two moving focal points while an image is generating.",
    keywords: "动效 AI 生成 图片 加载 等待 反馈 点阵 光点 loading generating dots focus",
    preview: "/assets/components/ai-generating.png", sourceFile: "ai生成图片动画.html", canvasWidth: 520, canvasHeight: 560,
    instructions: "Watch the two moving focal points change the dot field. This is a loading animation, not an image-generation API.",
    prompt: MOTION_PROMPTS["ai-generating"],
  },
];
