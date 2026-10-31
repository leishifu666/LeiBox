import {AI_BRAND_VECTOR_SPEC} from "./ai-brand-vectors.mjs";
export const AI_BRAND_CARDS=[
 {id:'claude',name:'Claude',image:'claude-04.webp',symbol:'claude-symbol.svg',logo:'claude-lockup.svg',description:'用日常的话把想法说清楚，它帮你拆问题、理思路、改文字，适合动手前先把方向聊明白。'},
 {id:'codex',name:'Codex',image:'codex-01.webp',symbol:'codex-symbol.svg',logo:'codex-lockup.svg',description:'从修一个报错到补一段功能，说清目标和范围，它在代码库里动手执行，再交回改动供你检查。'},
 {id:'cursor',name:'Cursor',image:'cursor-04.webp',symbol:'cursor-symbol.svg',logo:'cursor-lockup.svg',description:'在熟悉的编辑器里写代码，选中一段就能提问、补全或修改，思路不必在窗口之间来回切换。'},
];
export const AI_BRAND_COVER_PROMPT=`制作一组三张 AI 品牌封面卡片，依次 Claude、Codex、Cursor。真实 DOM 图片、SVG 品牌标志、中文正文分层叠加，不把整张卡片烘焙成含文字的图片。

场景1200×800，白色背景，中央水平排列三张300×500竖卡，3:5比例，间距30，整组宽960高500，直角无边框。缩小容器时整场景等比缩放，不改变三卡相对排版。每张图片object-fit:cover，居中裁切，角标、字标、正文位置固定。
背景分别为：Claude深蓝近黑底，中央橙红光晕中一朵银白色颗粒星花，细长触须状花瓣围绕密集花心向外旋转；Codex近黑与深蓝底，蓝紫色多层莲花状星云，透亮花瓣上布满细小光点；Cursor黑底，倾斜展开的银白颗粒星尘花，花瓣如薄纱向右上飘散，背景细密竖向扫描纹。准备符合此描述的三张无文字背景，并允许调用方传入images数组替换。不要用纯色占位符当成最终图片。
卡内遮罩从顶部黑色8%、25%处6%、52%处32%、68%处8%、82%处62%过渡到底部74%，保证白字清晰。左上角独立白色小标，距上左各14px，约18×18。完整品牌字标宽83%，绝对居中在卡片高度51%，白色，轻微0 2px 6px黑色33%投影。Codex字标由左侧白色终端花结图标和右侧Codex文字并排组成，比例19%与76%，间距5%；Claude是左侧十二束星花与衬线Claude；Cursor是左侧立体几何光标方块与无衬线Cursor。图标使用可替换的SVG素材接口，品牌资产遵守各自使用规则。
正文左右各6%，距底4.2%，白色、12px、行高1.55、400字重，字体Arial,'Microsoft YaHei','PingFang SC',sans-serif。正文逐字保留：
Claude：用日常的话把想法说清楚，它帮你拆问题、理思路、改文字，适合动手前先把方向聊明白。
Codex：从修一个报错到补一段功能，说清目标和范围，它在代码库里动手执行，再交回改动供你检查。
Cursor：在熟悉的编辑器里写代码，选中一段就能提问、补全或修改，思路不必在窗口之间来回切换。
只对背景图片提供轻微缩放反馈：指针或键盘焦点进入时650ms、power2.out缩放到1.035，离开550ms回1；Logo和文字始终固定。点击切换当前卡片选中态，Enter/空格同样触发，左右箭头循环移动焦点，Home/End首尾，Escape清空选择并退出焦点。减少动态效果时立即更新并保持图片比例1。不要让按钮上浮，不增加复杂光效或整卡倾斜。
图片解码完成再揭示预览；多实例独立，支持images、description、logoSrc、symbolSrc和height更新。图片错误时保留布局，卸载时杀掉所有GSAP动画、监听器与观察器，不留下RAF或计时器。提供当前框架原生入口、完整样式、默认三张图与品牌矢量、依赖和使用示例，不能以iframe包装代替原生组件。
${AI_BRAND_VECTOR_SPEC}`;
