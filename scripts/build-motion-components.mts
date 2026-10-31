import fs from "node:fs/promises";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Share, X, Mail, ChevronsUpDown, Link, Send, LoaderCircle, Check, LockKeyhole } from "lucide-react";
import { INTERACTION_COMPONENTS } from "../src/data/interaction-components.ts";
import { SHARE_INVITE_PROMPT } from "../src/data/share-invite.ts";
import { OTP_PROMPT } from "../src/data/otp-verification.ts";
import { MOTION_FRAMEWORKS, type MotionPackage } from "../src/lib/motion-packages.ts";
import { buildDeepAgentSources } from "./build-deep-agent-source.mjs";
import { buildElasticPanelSource } from "./build-elastic-panel-source.mjs";
import { buildInlineTextMorphSource } from "./build-inline-text-morph-source.mjs";
import { buildRadialMenuSources } from "./build-staggered-radial-menu-source.mjs";
import { buildGalaxyEffortSliderSource } from "./build-galaxy-effort-slider-source.mjs";
import { buildNotesTextColorSource } from "./build-notes-text-color-source.mjs";
import { buildDotMatrixTrioSource } from "./build-dot-matrix-trio-source.mjs";
import { buildSelectionFlowerSource } from "./build-selection-flower-source.mjs";
import { buildBrandPosterCardsSource } from "./build-brand-poster-cards-source.mjs";
import { buildCollectionLayoutMorphSource } from "./build-collection-layout-morph-source.mjs";
import { buildSpiderMusicPlayerSource } from "./build-spider-music-player-source.mjs";
import { buildFluidTooltipSource } from "./build-fluid-tooltip-source.mjs";
import { buildFoldedEmojiScrollSource } from "./build-folded-emoji-scroll-source.mjs";
import { buildGradientRingCardsSource } from "./build-gradient-ring-cards-source.mjs";
import { buildInteractionPreviews } from "./build-interaction-previews.mts";

const aiBrandCoverEngine = await (await import("./build-ai-brand-cover-cards-source.mjs")).buildAiBrandCoverCardsSource();
const ROOT=process.cwd();
await buildInteractionPreviews(INTERACTION_COMPONENTS);
const OUT=path.join(ROOT,"public/motion-frameworks");
const PREVIEWS=path.join(ROOT,"src/lib/motion-core/site-previews");
const SITE_PREVIEWS=new Set(["glass-folder"]);
const read=(file:string)=>fs.readFile(path.join(ROOT,file),"utf8");
const icons=Object.fromEntries(Object.entries({share:Share,x:X,mail:Mail,chevrons:ChevronsUpDown,link:Link,send:Send,loader:LoaderCircle,check:Check,lock:LockKeyhole}).map(([key,icon])=>[key,renderToStaticMarkup(createElement(icon,{"aria-hidden":true,className:key==="mail"?"mail-icon":key==="chevrons"?"role-chevrons":key==="loader"?"otp-spinner":""}))]));
const names:Record<string,string>={"share-invite":"ShareInvite","otp-verification":"OtpVerification","brand-line-cards":"BrandLineCards","bouncy-access":"BouncyAccessRequest","velocity-drag":"VelocityFocusDrag","morphing-timer":"FissionTimeCapsule","ai-generating":"AiImageGeneration"};
const dependencies:Record<string,string[]>={react:["react","react-dom"],vue:["vue"],svelte:["svelte"],solid:["solid-js"],preact:["preact"],vanilla:[]};
const runtime=await read("src/lib/motion-core/motion-runtime.ts");
const iconLicense=await read("node_modules/lucide-react/LICENSE");
const deepAgentEngines = await buildDeepAgentSources();
await buildElasticPanelSource();
const inlineTextMorphEngine = await buildInlineTextMorphSource();
await buildRadialMenuSources();
await buildGalaxyEffortSliderSource();
const notesTextColorEngine = await buildNotesTextColorSource();
await buildDotMatrixTrioSource();
const selectionFlowerEngine = await buildSelectionFlowerSource();
const brandPosterCardsEngine = await buildBrandPosterCardsSource();
const collectionLayoutMorphEngine = await buildCollectionLayoutMorphSource();
const spiderMusicPlayerEngine = await buildSpiderMusicPlayerSource();
const fluidTooltipEngine = await buildFluidTooltipSource();
const foldedEmojiScrollEngine = await buildFoldedEmojiScrollSource();
const gradientRingCardsEngine = await buildGradientRingCardsSource();
await fs.mkdir(OUT,{recursive:true});
await fs.mkdir(PREVIEWS,{recursive:true});

function wrapper(name:string,slug:string,framework:string){
 const imports=`import { mount${name}, type ${name}Options } from "./${name}Engine.js";\nimport type { MotionController } from "./motion-runtime";`;
 if(framework==="react"||framework==="preact"){
  const preact=framework==="preact";
  return `${preact?'/** @jsxImportSource preact */':'"use client";'}\nimport { useEffect, useRef } from "${preact?'preact/hooks':'react'}";\n${imports}\n\nexport function ${name}({ options, className }: { options?: ${name}Options; className?: string }) {\n  const host = useRef<HTMLDivElement>(null);\n  const controller = useRef<MotionController | null>(null);\n  useEffect(() => {\n    const instance = mount${name}(host.current!, options);\n    controller.current = instance;\n    return () => { instance.destroy(); controller.current = null; };\n    // Options are updated below without remounting the state machine.\n    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, []);\n  useEffect(() => { controller.current?.update(options ?? {}); }, [options]);\n  return <div ref={host} className={className} data-motion-component="${slug}" />;\n}\n`;
 }
 if(framework==="vue")return `<script setup lang="ts">\nimport { ref, onMounted, onBeforeUnmount, watch } from "vue";\n${imports}\nconst props = defineProps<{ options?: ${name}Options }>();\nconst host = ref<HTMLDivElement | null>(null);\nlet controller: MotionController | undefined;\nonMounted(() => { controller = mount${name}(host.value!, props.options); });\nwatch(() => props.options, value => controller?.update(value ?? {}), { deep: true });\nonBeforeUnmount(() => controller?.destroy());\n</script>\n\n<template><div ref="host" data-motion-component="${slug}" /></template>\n`;
 if(framework==="svelte")return `<script lang="ts">\nimport { onMount } from "svelte";\n${imports}\nexport let options: ${name}Options = {};\nlet host: HTMLDivElement;\nlet controller: MotionController | undefined;\nonMount(() => {\n  const instance = mount${name}(host, options);\n  controller = instance;\n  return () => { instance.destroy(); controller = undefined; };\n});\n$: controller?.update(options);\n</script>\n\n<div bind:this={host} data-motion-component="${slug}"></div>\n`;
 if(framework==="solid")return `/** @jsxImportSource solid-js */\nimport { onMount, onCleanup, createEffect } from "solid-js";\n${imports}\n\nexport function ${name}(props: { options?: ${name}Options; class?: string }) {\n  let host!: HTMLDivElement;\n  let controller: MotionController | undefined;\n  onMount(() => { controller = mount${name}(host, props.options); });\n  createEffect(() => { const options = props.options; controller?.update(options ?? {}); });\n  onCleanup(() => controller?.destroy());\n  return <div ref={host} class={props.class} data-motion-component="${slug}" />;\n}\n`;
 const controller = slug === "ai-brand-cover-cards" || slug === "gradient-ring-cards" || slug === "reasoning-effort-slider" || slug === "deep-agent-composer" || slug === "brand-poster-cards" || slug === "collection-layout-morph" || slug === "spider-music-player" || slug === "fluid-tooltip" || slug === "folded-emoji-scroll" ? `ReturnType<typeof mount${name}>` : "MotionController";
 return `${imports}\n\n/** Mount into any DOM node. Call update() for options and destroy() on removal. */\nexport function mount(target: HTMLElement, options: ${name}Options = {}): ${controller} {\n  return mount${name}(target, options);\n}\nexport type { ${name}Options };\n`;
}
function usage(name:string,fileName:string,framework:string){
 const file=`./${fileName.replace(/\.tsx?$/,"")}`;
 if(framework==="vue")return `<script setup lang="ts">\nimport ${name} from "./${name}.vue";\n</script>\n<template><${name} /></template>`;
 if(framework==="svelte")return `<script lang="ts">\nimport ${name} from "./${name}.svelte";\n</script>\n<${name} />`;
 if(framework==="vanilla")return `import { mount } from "${file}";\nconst target = document.querySelector<HTMLElement>("#demo")!;\nconst component = mount(target);\n// When your page or route unmounts:\n// component.destroy();`;
 return `import { ${name} } from "${file}";\n\nexport default function App() {\n  return <${name} />;\n}`;
}
function language(file:string){return file.endsWith(".vue")?"vue":file.endsWith(".svelte")?"svelte":file.endsWith(".tsx")?"tsx":file.endsWith(".ts")?"ts":"js";}
const matrix=[];
for(const entry of INTERACTION_COMPONENTS){
 const name=names[entry.slug]??entry.slug.split("-").map(s=>s[0].toUpperCase()+s.slice(1)).join("");
 const deepAgent = entry.slug === "reasoning-effort-slider" || entry.slug === "deep-agent-composer";
 const native=entry.slug==="share-invite"||entry.slug==="otp-verification";
 let engine:string;
 if(entry.slug === "ai-brand-cover-cards"){
  engine=aiBrandCoverEngine;
 }else if(entry.slug === "folded-emoji-scroll"){
  engine=foldedEmojiScrollEngine;
 }else if(entry.slug === "gradient-ring-cards"){
  engine=gradientRingCardsEngine;
 }else if(entry.slug === "fluid-tooltip"){
  engine=fluidTooltipEngine;
 }else if(entry.slug === "spider-music-player"){
  engine=spiderMusicPlayerEngine;
 }else if(entry.slug === "collection-layout-morph"){
  engine=collectionLayoutMorphEngine;
 }else if(entry.slug === "brand-poster-cards"){
  engine=brandPosterCardsEngine;
 }else if(entry.slug === "selection-flower"){
  engine=selectionFlowerEngine;
 }else if(entry.slug === "inline-text-morph"){
  engine=inlineTextMorphEngine;
 }else if(entry.slug === "notes-text-color"){
  engine=notesTextColorEngine;
 }else if(deepAgent){
  engine=deepAgentEngines[entry.slug];
 }else if(native){
  const source=await read(`src/lib/motion-core/${entry.slug}.mjs`);
  const motionPath=entry.slug==="share-invite"?"ShareInvite/share-motion.ts":"OtpVerification/otp-motion.ts";
  let motion=await read(`src/lib/${motionPath}`);
  motion=motion.replace(/export /g,"").replace(/ as const/g,"").replace(/: readonly \[number, string\]\[\]/g,"");
  if(entry.slug==="share-invite")motion=motion.replace(/stiffness: number, damping: number, duration: number/g,"stiffness, damping, duration").replace(/progress: number/g,"progress");
  if(entry.slug==="otp-verification")motion=motion.replace("const OTP_MOTION", "const M"); else motion=motion.replace("const SHARE_MOTION","const M");
  const css=await read(`src/lib/${name}/${entry.slug}.css`);
  const translations=entry.slug==="share-invite"?(await read("src/lib/ShareInvite/ShareInvite.tsx")).match(/const COPY: Record<string, string> = ([\s\S]+);\s*$/)?.[1]:"{}";
  engine=`/* Lucide icon license:\n${iconLicense.replace(/\*\//g,"* /")}\n*/\n`+source.replace(/import \{[^\n]+\} from '\.\.\/[^']+';\n/,motion+"\n")+`\nconst CSS = ${JSON.stringify(css)};\nconst ICONS = ${JSON.stringify(icons)};\nconst TRANSLATIONS = ${translations??"{}"};\nexport function mount${name}(target, options = {}) { return create${name}(target, options, CSS, ICONS, TRANSLATIONS); }\n`;
 }else{
  if(!entry.sourceFile)throw new Error(`${entry.slug}: missing implementation`);
  const html=await read(`public/motion/${entry.slug}.html`);
  let css=[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m=>m[1]).join("\n");
  if(entry.slug==="bouncy-access") { const font=await read("src/lib/ShareInvite/share-invite.css"); const inline=css.replace(/@import\s+url\((?:[^()"']|"[^"]*"|'[^']*')*\)\s*;/g,""); if(inline.includes("@import"))throw new Error("Unparsed font import"); css=font.slice(0,font.indexOf(".leibox-share {")).replaceAll("ShareInviteInter","Inter")+inline; }
  const actions:string[]=[];
  const markup=html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1].replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"").replace(/\sonclick="([^"]+)"/g,(_,code)=>{actions.push(code);return ` data-motion-action="${actions.length-1}"`;});
  if(!markup)throw new Error(`${entry.slug}: no body`);
  const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).join("\n")
    .replace(/([\w.]+)\.getBoundingClientRect\(\)/g,"scope.rect($1)")
    .replace(/\b(e|event)\.clientX/g,"scope.point($1).x").replace(/\b(e|event)\.clientY/g,"scope.point($1).y");
  engine=`// Native DOM port of the preserved reference HTML. No iframe or runtime eval.\nimport { createSurface } from "./motion-runtime";\nexport function mount${name}(target, options = {}) {\nconst scope = createSurface(target, ${JSON.stringify({markup,css,width:entry.canvasWidth,height:entry.canvasHeight,responsive:entry.responsive??["brand-line-cards","gradient-cover-wall"].includes(entry.slug)})}, options);\nconst { document, window, requestAnimationFrame, cancelAnimationFrame, setTimeout, clearTimeout, setInterval, clearInterval, ResizeObserver, IntersectionObserver, matchMedia } = scope;\n${script}\n${actions.map((code,i)=>`scope.on(scope.root.querySelector('[data-motion-action="${i}"]'), 'click', event => { ${code}; });`).join("\n")}\nscope.ready();\nreturn scope.controller;\n}\n`;
 }
 // The guided homepage demo uses the exact downloadable DOM engine in the
 // current document, avoiding one isolated browser process per iframe preview.
 if(SITE_PREVIEWS.has(entry.slug)){
  const local=engine.replaceAll('from "./motion-runtime"','from "../motion-runtime"').replaceAll('from "./motion-runtime.ts"','from "../motion-runtime"');
  await fs.writeFile(path.join(PREVIEWS,`${entry.slug}.generated.js`),'// Generated by scripts/build-motion-components.mts; shared with the downloadable framework packages.\n'+local);
  await fs.writeFile(path.join(PREVIEWS,`${entry.slug}.generated.d.ts`),`import type { MotionOptions, MotionController } from "../motion-runtime";\nexport function mount${name}(target: HTMLElement, options?: MotionOptions): MotionController;\n`);
 }
 const packages:MotionPackage[]=[];
 for(const framework of MOTION_FRAMEWORKS){
  const extension=framework.id==="vue"?".vue":framework.id==="svelte"?".svelte":framework.id==="solid"?".solid.tsx":framework.id==="preact"?".preact.tsx":framework.id==="vanilla"?".ts":".tsx";
  const fileName=name+extension;
  const extra=deepAgent?' & { value?: "simple" | "medium" | "deep"; onValueChange?: (value: "simple" | "medium" | "deep") => void; disabled?: boolean; models?: string[]; selectedModel?: string; onModelChange?: (model: string) => void; busy?: boolean; stopping?: boolean; onStop?: () => void; onPermissionChange?: (permission: string) => void; onSubmit?: (message: { text: string; model: string; thinking: "simple" | "medium" | "deep"; attachments: { id: string; name: string; kind: string; status: string; dataUrl?: string; extractedText?: string }[]; skills: unknown[]; mentions: unknown[]; permission: string }) => void }':entry.slug==="otp-verification"?" & { autoPlay?: boolean; onReplayComplete?: () => void }":entry.slug==="share-invite"?' & { locale?: "en" | "zh" }':"";
  const optionsExtra=entry.slug==="folded-emoji-scroll"?' & { query?: string; value?: string; foldSize?: number; onSelect?: (emoji: string) => void }':entry.slug==="gradient-ring-cards"?' & { active?: number; autoRotate?: boolean; speed?: number; distortion?: number; onSelect?: (id: string) => void }':entry.slug==="fluid-tooltip"?' & { active?: "today" | "tasks" | "calendar" | "focus" | "settings" | "profile"; onSelect?: (id: string) => void; profileLabel?: string; logoSrc?: string }':entry.slug==="spider-music-player"?' & { track?: number; playing?: boolean; onTrackChange?: (index: number) => void }':(entry.slug==="brand-poster-cards"||entry.slug==="ai-brand-cover-cards")?' & { images?: (string | { src: string; alt?: string; position?: string })[]; description?: string; logoSrc?: string; symbolSrc?: string }':entry.slug==="collection-layout-morph"?' & { view?: "list" | "card" | "pack" }':extra;
  const files=[
   {id:fileName,label:fileName,fileName,source:wrapper(name,entry.slug,framework.id)},
   {id:`${name}Engine.js`,label:`${name}Engine.js`,fileName:`${name}Engine.js`,source:engine},
   {id:"motion-runtime.ts",label:"motion-runtime.ts",fileName:"motion-runtime.ts",source:runtime},
   {id:`${name}Engine.d.ts`,label:`${name}Engine.d.ts`,fileName:`${name}Engine.d.ts`,source:`import type { MotionOptions, MotionController } from "./motion-runtime";\nexport type ${name}Options = MotionOptions${optionsExtra};\nexport function mount${name}(target: HTMLElement, options?: ${name}Options): ${entry.slug==="folded-emoji-scroll"||entry.slug==="gradient-ring-cards"||deepAgent||(entry.slug==="brand-poster-cards"||entry.slug==="ai-brand-cover-cards")||entry.slug==="collection-layout-morph"||(entry.slug==="spider-music-player"||entry.slug==="fluid-tooltip")?`Omit<MotionController, "update"> & { update(options: ${name}Options): void }`:"MotionController"};\n`},
  ];
  const deps=[...new Set([...dependencies[framework.id],...(entry.slug==="gradient-ring-cards"?["three@0.185.1","gsap@3.12.7"]:deepAgent?["react","react-dom","gsap@3.12.7","deep-agent-base-ui@npm:@base-ui/react@1.8.0","deep-agent-lucide@npm:lucide-react@1.43.0","@fortawesome/fontawesome-svg-core@6.7.2","@fortawesome/free-solid-svg-icons@6.7.2","@fortawesome/react-fontawesome@0.2.6","@radix-ui/react-slider@1.4.7","react-circular-progressbar@2.2.0","clsx","tailwind-merge"]:native||entry.slug==="notes-text-color"||(entry.slug==="brand-poster-cards"||entry.slug==="ai-brand-cover-cards")||entry.slug==="collection-layout-morph"||(entry.slug==="spider-music-player"||entry.slug==="fluid-tooltip")?["gsap@3.12.7"]:[])])];
  const install=deps.length?`npm install ${deps.join(" ")}`:"No runtime dependencies. Use TypeScript or a bundler to compile the entry file.";
  const example=usage(name,fileName,framework.id);
  const originalPrompt=entry.slug==="share-invite"?SHARE_INVITE_PROMPT:entry.slug==="otp-verification"?OTP_PROMPT:entry.prompt!;
  let prompt=`${originalPrompt}\n\n独立实现与六框架交付\n- 仅凭本文从零生成可运行的实现。尺寸、颜色、文案、图形和运动算法均以上述文字为准；所有装饰用 CSS、内嵌 SVG 或 Canvas 绘制，不加载远程图片、字体、视频或素材。\n- 当前交付重点为 ${framework.label}，组件名称 ${name}。从零创建四个文件：${fileName}、${name}Engine.js、motion-runtime.ts、${name}Engine.d.ts；分别实现框架入口、完整交互核心、实例生命周期和类型声明。文件名是需要生成的产物，不假定接收者已经拥有任何文件。\n- 同时提供 React、Vue、Svelte、Solid、Preact、Vanilla 原生生命周期入口，共享框架无关核心。DOM 仅在挂载后访问，支持同页多实例；更新时保持状态，销毁时清理动画、计时器、观察器及监听器。不要用 iframe 代替组件实现。\n- 依赖安装说明：${install}。若使用依赖，只使用其公开API；组件的布局、样式、图形和算法必须在本次生成的文件中完整实现，不引用现成效果组件。\n- 实现 options.height 以调整场景高度，options.reducedMotion 覆盖系统偏好；减少动态效果仍保留完整交互状态。${entry.slug==="share-invite"?'options.locale 为 en 或 zh，默认 en。':entry.slug==="otp-verification"?'options.autoPlay 控制自动演示，options.onReplayComplete 在演示完成时回调。':''}\n- 给出每个文件的完整内容、安装和运行步骤、以下使用示例所需的全部实现。不得留省略号、待补素材或“自行补齐核心”的占位。\n- 验收：375 / 768 / 1440px 无横向溢出；鼠标、键盘及相关触屏状态可用；成功、错误、快速中断、复制成功与失败均有反馈；多实例互不干扰，卸载后停止所有任务。\n\n生成完成后的使用示例\n${example}`;
  if (deepAgent) prompt = prompt.replace("共享框架无关核心", "共享 Deep Agent 原版 React UI 核心");
  if (entry.slug === "spider-music-player") prompt = prompt.replace("所有装饰用 CSS、内嵌 SVG 或 Canvas 绘制，不加载远程图片、字体、视频或素材。", "蜘蛛、蛛网与图标用 CSS 和内嵌 SVG 完整绘制；按正文要求检索八张真实专辑封面并在本次产物内嵌，组件运行不加载远程素材。");
  if (/(?:https?:\/\/|www\.|codex:\/\/|[A-Z]:[\\/]|codex-clipboard-|参考(?:视频|截图|链接|文件)|原始?\s*HTML|用户提供|项目已嵌入|使用实现中实际|保留包内|ComponentDoc)/i.test(prompt)) {
    throw new Error(`${entry.slug}: recreation prompt must be self-contained`);
  }
  const bundle=[`# ${entry.name} — ${framework.label}`,"",entry.description,"",`Source: ${deepAgent?"Original Deep Agent desktop UI, with platform adapters":entry.referenceUrl??entry.codeSource??(entry.slug==="share-invite"?"https://x.com/sucodeee/status/2111061993599713612/video/1":entry.slug==="otp-verification"?"https://x.com/bestsaasdesigns/status/2111020282551132539/video/1":"User-provided original HTML")}`,"Preserve embedded font and third-party license notices.","","## Install","```sh",install,"```","","Keep all four files in one folder. The framework's normal build tool compiles TypeScript, Vue or Svelte.","",...files.flatMap(f=>[`## ${f.fileName}`,"```"+language(f.fileName),f.source.trimEnd(),"```",""]),"## Usage","```"+language(fileName),example,"```"].join("\n");
  const pack:MotionPackage={framework:framework.id,label:framework.label,component:name,slug:entry.slug,dependencies:deps,install,usage:example,prompt,bundle,files};
  packages.push(pack);
  const folder=path.join(OUT,entry.slug,framework.id);await fs.mkdir(folder,{recursive:true});
  await Promise.all(files.map(f=>fs.writeFile(path.join(folder,f.fileName),f.source)));
  const dependencyVersions=Object.fromEntries(await Promise.all(deps.map(async dependency=>{
   const alias=dependency.indexOf("@npm:");
   if(alias>0)return [dependency.slice(0,alias),dependency.slice(alias+1)];
   const separator=dependency.lastIndexOf("@"),pinned=separator>0?dependency.slice(separator+1):undefined;
   const packageName=separator>0?dependency.slice(0,separator):dependency;
   return [packageName,pinned??JSON.parse(await read(`node_modules/${packageName}/package.json`)).version];
  })));
  await fs.writeFile(path.join(folder,"package.json"),JSON.stringify({...pack,name:`@leibox/${entry.slug}-${framework.id}`,version:"0.0.0",private:true,type:"module",dependencies:dependencyVersions,files:files.map(({fileName})=>fileName),bundle:undefined,prompt:undefined},null,2));
  matrix.push({slug:entry.slug,framework:framework.id,entry:`/motion-frameworks/${entry.slug}/${framework.id}/${fileName}`,files:files.length});
 }
 await fs.mkdir(path.join(OUT,entry.slug),{recursive:true});
 await fs.writeFile(path.join(OUT,entry.slug,"packages.json"),JSON.stringify(packages));
 console.log(`${entry.slug}: ${packages.map(p=>p.label).join(', ')}`);
}
await fs.writeFile(path.join(OUT,"manifest.json"),JSON.stringify({schemaVersion:1,frameworks:MOTION_FRAMEWORKS,items:matrix},null,2));
console.log(`Built ${matrix.length} native framework packages. Original HTML and React demos were preserved.`);
