/* Generated from outputs/gemini-home-panels-redesign/gemini-final.html by build.cjs. */
/* eslint-disable */
import { gsap } from "gsap";

/* ==========================================================================
   LeiBoxPanels API
   ========================================================================== */
const api = (function() {
  "use strict";

  var DATA = {"brand":{"name":"LeiBox","mark":"/leibox-mark.svg","logo":"/leibox-logo.svg"},"components":[{"slug":"glass-folder","name":"玻璃文件夹","en":"Glass Folder Cards","width":1200,"height":600,"poster":"/assets/components/glass-folder.png","demo":"/motion/glass-folder.html","href":"/docs/animations/glass-folder"},{"slug":"brand-poster-cards","name":"品牌海报三联卡片","en":"Brand Poster Cards","width":1200,"height":675,"poster":"/assets/components/brand-poster-cards.png","demo":"/motion/brand-poster-cards.html","href":"/docs/animations/brand-poster-cards"},{"slug":"dot-matrix-trio","name":"点阵波纹与旋涡","en":"Dot Matrix Ripple and Spiral","width":960,"height":540,"poster":"/assets/components/dot-matrix-trio.png","demo":"/motion/dot-matrix-trio.html","href":"/docs/animations/dot-matrix-trio"},{"slug":"soft-action-wheel","name":"柔光环形菜单","en":"Soft Action Wheel","width":960,"height":960,"poster":"/assets/components/soft-action-wheel.png","demo":"/motion/soft-action-wheel.html","href":"/docs/animations/soft-action-wheel"},{"slug":"inline-text-morph","name":"内联词组变形","en":"Inline Phrase Morph","width":1044,"height":684,"poster":"/assets/components/inline-text-morph.png","demo":"/motion/inline-text-morph.html","href":"/docs/animations/inline-text-morph"},{"slug":"blue-fluted-glass","name":"蓝色棱纹流动背景","en":"Blue Fluted Glass Background","width":1200,"height":675,"poster":"/assets/components/blue-fluted-glass.png","demo":"/motion/blue-fluted-glass.html","href":"/docs/animations/blue-fluted-glass"}],"selected":{"slug":"glass-folder","name":"GlassFolder","description":"磨砂玻璃文件夹，点击展开真实文件卡片，支持添加文件和键盘菜单。","source":"用户提供的 React 源码，已在本项目适配","license":"以条目中的来源与许可说明为准","integrationPrompt":"将 LeiBox 的 GlassFolder 玻璃文件夹组件集成到这个项目中。"},"frameworks":[{"id":"react","label":"React","component":"GlassFolder","usage":"import { GlassFolder } from \"./GlassFolder\";\n\nexport default function App() {\n  return <GlassFolder />;\n}","install":"npm install react react-dom","files":[{"name":"GlassFolder.tsx","lines":18},{"name":"GlassFolderEngine.js","lines":445},{"name":"motion-runtime.ts","lines":169},{"name":"GlassFolderEngine.d.ts","lines":3}],"bundleLines":673},{"id":"vue","label":"Vue","component":"GlassFolder","usage":"<script setup lang=\"ts\">\nimport GlassFolder from \"./GlassFolder.vue\";\n<\/script>\n<template><GlassFolder /></template>","install":"npm install vue","files":[{"name":"GlassFolder.vue","lines":13},{"name":"GlassFolderEngine.js","lines":445},{"name":"motion-runtime.ts","lines":169},{"name":"GlassFolderEngine.d.ts","lines":3}],"bundleLines":667},{"id":"svelte","label":"Svelte","component":"GlassFolder","usage":"<script lang=\"ts\">\nimport GlassFolder from \"./GlassFolder.svelte\";\n<\/script>\n<GlassFolder />","install":"npm install svelte","files":[{"name":"GlassFolder.svelte","lines":16},{"name":"GlassFolderEngine.js","lines":445},{"name":"motion-runtime.ts","lines":169},{"name":"GlassFolderEngine.d.ts","lines":3}],"bundleLines":670},{"id":"solid","label":"Solid","component":"GlassFolder","usage":"import { GlassFolder } from \"./GlassFolder.solid\";\n\nexport default function App() {\n  return <GlassFolder />;\n}","install":"npm install solid-js","files":[{"name":"GlassFolder.solid.tsx","lines":13},{"name":"GlassFolderEngine.js","lines":445},{"name":"motion-runtime.ts","lines":169},{"name":"GlassFolderEngine.d.ts","lines":3}],"bundleLines":668},{"id":"preact","label":"Preact","component":"GlassFolder","usage":"import { GlassFolder } from \"./GlassFolder.preact\";\n\nexport default function App() {\n  return <GlassFolder />;\n}","install":"npm install preact","files":[{"name":"GlassFolder.preact.tsx","lines":18},{"name":"GlassFolderEngine.js","lines":445},{"name":"motion-runtime.ts","lines":169},{"name":"GlassFolderEngine.d.ts","lines":3}],"bundleLines":673},{"id":"vanilla","label":"Vanilla","component":"GlassFolder","usage":"import { mount } from \"./GlassFolder\";\nconst target = document.querySelector<HTMLElement>(\"#demo\")!;\nconst component = mount(target);\n// When your page or route unmounts:\n// component.destroy();","install":"No runtime dependencies. Use TypeScript or a bundler to compile the entry file.","files":[{"name":"GlassFolder.ts","lines":8},{"name":"GlassFolderEngine.js","lines":445},{"name":"motion-runtime.ts","lines":169},{"name":"GlassFolderEngine.d.ts","lines":3}],"bundleLines":663}],"icons":{"FolderOpen":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-folder-open\" aria-hidden=\"true\"><path d=\"m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2\"></path></svg>","Search":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-search\" aria-hidden=\"true\"><path d=\"m21 21-4.34-4.34\"></path><circle cx=\"11\" cy=\"11\" r=\"8\"></circle></svg>","Check":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-check\" aria-hidden=\"true\"><path d=\"M20 6 9 17l-5-5\"></path></svg>","Code2":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-code-xml\" aria-hidden=\"true\"><path d=\"m18 16 4-4-4-4\"></path><path d=\"m6 8-4 4 4 4\"></path><path d=\"m14.5 4-5 16\"></path></svg>","Copy":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-copy\" aria-hidden=\"true\"><rect width=\"14\" height=\"14\" x=\"8\" y=\"8\" rx=\"2\" ry=\"2\"></rect><path d=\"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2\"></path></svg>","Terminal":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-terminal\" aria-hidden=\"true\"><path d=\"M12 19h8\"></path><path d=\"m4 17 6-6-6-6\"></path></svg>","FileCode2":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-file-code-corner\" aria-hidden=\"true\"><path d=\"M4 12.15V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2h-3.35\"></path><path d=\"M14 2v5a1 1 0 0 0 1 1h5\"></path><path d=\"m5 16-3 3 3 3\"></path><path d=\"m9 22 3-3-3-3\"></path></svg>","ArrowUpRight":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-arrow-up-right\" aria-hidden=\"true\"><path d=\"M7 7h10v10\"></path><path d=\"M7 17 17 7\"></path></svg>","Play":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-play\" aria-hidden=\"true\"><path d=\"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z\"></path></svg>","Pause":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-pause\" aria-hidden=\"true\"><rect x=\"14\" y=\"3\" width=\"5\" height=\"18\" rx=\"1\"></rect><rect x=\"5\" y=\"3\" width=\"5\" height=\"18\" rx=\"1\"></rect></svg>","RotateCcw":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-rotate-ccw\" aria-hidden=\"true\"><path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\"></path><path d=\"M3 3v5h5\"></path></svg>","ChevronDown":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-chevron-down\" aria-hidden=\"true\"><path d=\"m6 9 6 6 6-6\"></path></svg>","Sparkles":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-sparkles\" aria-hidden=\"true\"><path d=\"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z\"></path><path d=\"M20 2v4\"></path><path d=\"M22 4h-4\"></path><circle cx=\"4\" cy=\"20\" r=\"2\"></circle></svg>","ExternalLink":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-external-link\" aria-hidden=\"true\"><path d=\"M15 3h6v6\"></path><path d=\"M10 14 21 3\"></path><path d=\"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6\"></path></svg>","CheckCircle2":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-circle-check\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"10\"></circle><path d=\"m9 12 2 2 4-4\"></path></svg>"}};

  var DICT = {
    "zh-CN": {
      "common.copied": "已复制",
      "common.copyFailed": "复制失败",
      "d.s1Title": "组件收藏", "d.s1Desc": "搜索组件、动效与交互",
      "d.s2Title": "来源与许可", "d.s2Desc": "追溯原始设计与源码构成",
      "d.s3Title": "应用预览", "d.s3Desc": "真实运行演示",
      "d.openDemo": "独立演示",
      "d.desc": DATA.selected.description,
      "d.source": "来源", "d.sourceVal": DATA.selected.source,
      "d.license": "许可", "d.licenseVal": DATA.selected.license,
      "d.files": "源码", "d.filesVal": "React 版 {n} 个文件 · {lines} 行",
      "f.title": "组件源码", "f.copy": "复制代码",
      "f.filesCount": "{n} 个文件", "f.linesCount": "{lines} 行",
      "a.s1": "读取组件源码", "a.s1desc": "{n} 个文件 · {lines} 行",
      "a.s2": "确认框架",
      "a.s3": "添加到项目", "a.s3desc": "提供用法示例",
      "a.doneMeta": "演示完成 · 仅供示意",
      "a.copyPrompt": "复制提示词"
    },
    "en": {
      "common.copied": "Copied",
      "common.copyFailed": "Failed",
      "d.s1Title": "Collection", "d.s1Desc": "Search components & interactions",
      "d.s2Title": "Source & License", "d.s2Desc": "Trace origins and structure",
      "d.s3Title": "Preview", "d.s3Desc": "Live demo running",
      "d.openDemo": "Open demo",
      "d.desc": "Frosted glass folders that open into real file cards, with add-file support and a keyboard menu.",
      "d.source": "Source", "d.sourceVal": "User provided React source, adapted",
      "d.license": "License", "d.licenseVal": "See entry notes",
      "d.files": "Files", "d.filesVal": "React: {n} files · {lines} lines",
      "f.title": "Source Code", "f.copy": "Copy code",
      "f.filesCount": "{n} files", "f.linesCount": "{lines} lines",
      "a.s1": "Read source", "a.s1desc": "{n} files · {lines} lines",
      "a.s2": "Confirm stack",
      "a.s3": "Add to project", "a.s3desc": "Usage snippet provided",
      "a.doneMeta": "Demo complete · Illustrative",
      "a.copyPrompt": "Copy prompt"
    }
  };
  DATA.components.forEach(function(c) {
    DICT["zh-CN"]["c."+c.slug] = c.name;
    DICT["en"]["c."+c.slug] = c.en;
  });

  Object.assign(DICT.en, {"common.copied":"Copied","common.copyFailed":"Failed","d.s1Title":"Collection","d.s1Desc":"Explore components and interactions","d.s2Title":"Source & License","d.s2Desc":"Trace origins and structure","d.s3Title":"Preview","d.s3Desc":"Live demo running","d.openDemo":"Open demo","d.desc":"Frosted glass folders that open into real file cards, with add-file support and a keyboard menu.","d.source":"Source","d.sourceVal":"User provided React source, adapted","d.license":"License","d.licenseVal":"See entry notes","d.files":"Files","d.filesVal":"React: {n} files · {lines} lines","f.title":"Source Code","f.copy":"Copy code","f.filesCount":"{n} files","f.linesCount":"{lines} lines","a.s1":"Read source","a.s1desc":"{n} files · {lines} lines","a.s2":"Confirm stack","a.s3":"Add to project","a.s3desc":"Usage snippet provided","a.doneMeta":"Demo complete · Illustrative","a.copyPrompt":"Copy prompt","c.glass-folder":"Glass Folder Cards","c.brand-poster-cards":"Brand Poster Cards","c.dot-matrix-trio":"Dot Matrix Ripple and Spiral","c.soft-action-wheel":"Soft Action Wheel","c.inline-text-morph":"Inline Phrase Morph","c.blue-fluted-glass":"Blue Fluted Glass Background","a.prompt":"Integrate GlassFolder from LeiBox into this project.","common.pause":"Pause demo","common.play":"Play demo","common.replay":"Replay demo","common.docs":"View documentation"});
  Object.assign(DICT['zh-CN'], {"common.copied":"已复制","common.copyFailed":"复制失败","d.s1Title":"组件收藏","d.s1Desc":"浏览精选组件与交互动效","d.s2Title":"来源与许可","d.s2Desc":"追溯原始设计与源码构成","d.s3Title":"应用预览","d.s3Desc":"真实运行演示","d.openDemo":"独立演示","d.desc":"磨砂玻璃文件夹，点击展开真实文件卡片，支持添加文件和键盘菜单。","d.source":"来源","d.sourceVal":"用户提供的 React 源码，已在本项目适配","d.license":"许可","d.licenseVal":"以条目中的来源与许可说明为准","d.files":"源码","d.filesVal":"React 版 {n} 个文件 · {lines} 行","f.title":"组件源码","f.copy":"复制代码","f.filesCount":"{n} 个文件","f.linesCount":"{lines} 行","a.s1":"读取组件源码","a.s1desc":"{n} 个文件 · {lines} 行","a.s2":"确认框架","a.s3":"添加到项目","a.s3desc":"提供用法示例","a.doneMeta":"演示完成 · 仅供示意","a.copyPrompt":"复制提示词","c.glass-folder":"玻璃文件夹","c.brand-poster-cards":"品牌海报三联卡片","c.dot-matrix-trio":"点阵波纹与旋涡","c.soft-action-wheel":"柔光环形菜单","c.inline-text-morph":"内联词组变形","c.blue-fluted-glass":"蓝色棱纹流动背景","a.prompt":"将 LeiBox 的 GlassFolder 玻璃文件夹组件集成到这个项目中。","common.pause":"暂停演示","common.play":"播放演示","common.replay":"重新演示","common.docs":"查看文档"});

  // Utils
  function fmt(str, vars) { return String(str).replace(/\{(\w+)\}/g, function(_, k) { return vars && vars[k] != null ? String(vars[k]) : _; }); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function toArr(list) { return Array.prototype.slice.call(list || []); }
  function hasGSAP() { return typeof window !== 'undefined' && !!gsap; }

  var KW = { "import": 1, "from": 1, "export": 1, "default": 1, "function": 1, "return": 1, "const": 1 };
  var TOKEN_RE = /(\/\/[^\n]*)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(<\/?[A-Za-z][\w.]*|\/?>)|\b([A-Za-z_$][\w$]*)\b/g;
  function hlLine(line) {
    var out = "", last = 0, m;
    TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(line))) {
      out += esc(line.slice(last, m.index));
      if (m[1]) out += '<span class="tk-c">' + esc(m[1]) + "</span>";
      else if (m[2]) out += '<span class="tk-s">' + esc(m[2]) + "</span>";
      else if (m[3]) out += '<span class="tk-t">' + esc(m[3]) + "</span>";
      else if (m[4]) out += KW[m[4]] ? '<span class="tk-k">' + esc(m[4]) + "</span>" : esc(m[4]);
      last = TOKEN_RE.lastIndex;
    }
    return out + esc(line.slice(last));
  }
  function renderCode(src) { return src.split("\n").map(function(l) { return hlLine(l) || " "; }).join("\n"); }
  
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function(res, rej) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.cssText = "position:fixed;opacity:0;";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy") ? res() : rej(); } catch(e) { rej(); }
      document.body.removeChild(ta);
    });
  }

  // Timer robust enough for page visibility
  function Timer(onDone) {
    this.onDone = onDone; this.dur = 0; this.elap = 0; this.start = 0; this.tid = null; this.run = false;
  }
  Timer.prototype.pending = function() { return this.dur > 0 && this.elap < this.dur; };
  Timer.prototype.startAt = function(ms) { this.stop(); this.dur = ms; this.elap = 0; this.resume(); };
  Timer.prototype.resume = function() {
    if (this.run || !this.pending()) return;
    this.run = true; this.start = performance.now();
    var self = this;
    this.tid = setTimeout(function() { self.run = false; self.dur = 0; self.elap = 0; self.onDone(); }, this.dur - this.elap);
  };
  Timer.prototype.pause = function() {
    if (!this.run) return;
    this.run = false; clearTimeout(this.tid); this.elap += performance.now() - this.start;
  };
  Timer.prototype.stop = function() { this.run = false; clearTimeout(this.tid); this.dur = 0; this.elap = 0; };

  // Base Controller
  function createBase(el, opts) {
    var b = { timeouts: new Set(), el: el, opts: opts || {}, uid: "lb" + Math.random().toString(36).substr(2, 6), cleans: [], tls: [] };
    b.state = { loc: b.opts.locale === 'en' ? 'en' : 'zh-CN', thm: b.opts.theme === 'dark' ? 'dark' : 'light', act: b.opts.active !== false, view: typeof IntersectionObserver === "undefined", doc: !document.hidden, red: false };
    
    var mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    if(mq) { b.state.red = mq.matches; b.cleans.push(function(){ mq.onchange = null; }); mq.onchange = function() { b.state.red = mq.matches; b.update(); }; }
    
    b.on = function(tgt, typ, fn, opt) { tgt.addEventListener(typ, fn, opt); b.cleans.push(function() { tgt.removeEventListener(typ, fn, opt); }); };
    b.t = function(k, v) { if(b.opts.translate) return b.opts.translate(k,v); var d = DICT[b.state.loc] || DICT["zh-CN"]; var str = d[k] != null ? d[k] : (DICT["zh-CN"][k] || k); return fmt(str, v); };
    b.translate = function() {
      toArr(el.querySelectorAll("[data-i18n]")).forEach(function(n) {
        var v = n.getAttribute("data-i18n-vars");
        n.textContent = b.t(n.getAttribute("data-i18n"), v ? JSON.parse(v) : null);
      });
      el.setAttribute("lang", b.state.loc);
      var replay=el.querySelector('[data-lb-action="replay"]'); if(replay) replay.setAttribute("aria-label",b.t("common.replay"));
      var docs=el.querySelector(".lb-agent-result a"); if(docs) docs.setAttribute("aria-label",b.t("common.docs"));
      var play=el.querySelector('[data-lb-action="toggle-play"]'); if(play) play.setAttribute("aria-label",b.t(play.getAttribute("data-playing")==="false"?"common.play":"common.pause"));
    };
    b.fillIcons = function(sc) {
      toArr((sc || el).querySelectorAll("[data-lb-icon]")).forEach(function(n) {
        if (!n.firstElementChild) n.innerHTML = DATA.icons[n.getAttribute("data-lb-icon")] || "";
      });
    };
    b.flash = function(btn, ok) {
      btn.setAttribute("data-copied", ok ? "true" : "error");
      var l = btn.querySelector("[data-lb-label]");
      if(l) l.textContent = b.t(ok ? "common.copied" : "common.copyFailed");
      var timeout = setTimeout(function() { b.timeouts.delete(timeout); btn.removeAttribute("data-copied"); if(l) l.textContent = b.t(l.getAttribute("data-i18n")); }, 1600); b.timeouts.add(timeout);
    };
    b.canAnim = function() { return hasGSAP() && !b.state.red; };
    b.running = function() { return b.state.act && b.state.view && b.state.doc && !b.state.red; };
    
    b.ctx = hasGSAP() && gsap.context ? gsap.context(function(){}, el) : null;
    b.tl = function(v) { var t; if(b.ctx) b.ctx.add(function(){ t = gsap.timeline(v||{}); }); else t = gsap.timeline(v||{}); b.tls.push(t); return t; };
    b.kill = function(t) { if(t) t.kill(); if(b.ctx) b.ctx.kill(false); b.tls.length = 0; return null; };
    b.clear = function(n) { n = gsap.utils.toArray(n); if(hasGSAP() && n.length) gsap.set(n, {clearProps: "all"}); else n.forEach(function(x){ x.removeAttribute('style'); }); };
    
    b.update = function() { if(!b.running()) b.tls.forEach(function(t){ t.pause(); }); b.sync(); };
    
    if (typeof IntersectionObserver !== "undefined") {
      var io = new IntersectionObserver(function(e) { e.forEach(function(x) { b.state.view = x.isIntersecting && x.intersectionRatio >= 0.2; }); b.update(); }, { threshold: [0, 0.2, 0.5] });
      io.observe(el); b.cleans.push(function(){ io.disconnect(); });
    }
    b.on(document, "visibilitychange", function() { b.state.doc = !document.hidden; b.update(); });
    
    b.emit = function(i, s) { if(b.opts.onStepChange) { try { b.opts.onStepChange(i, {panel: el.getAttribute('data-leibox-panel'), source: s}); } catch(e){} } };
    b.destroy = function() { b.timeouts.forEach(clearTimeout); b.tls.forEach(function(t){ t.kill(); }); b.cleans.forEach(function(f){ f(); }); if(b.ctx) b.ctx.revert({suppressEvents:true}); };
    
    el.setAttribute("data-lb-theme", b.state.thm);
    b.fillIcons(); b.translate();
    return b;
  }

  // --- 1. Discovery ---
  function initDiscovery(b) {
    var el = b.el, layers = toArr(el.querySelectorAll(".lb-layer")), dots = toArr(el.querySelectorAll(".lb-mini-step"));
    var target = el.querySelector('.lb-card[data-slug="glass-folder"]'), cursor = el.querySelector(".lb-cursor-img"), iframe = el.querySelector(".lb-preview-frame");
    var playBtn = el.querySelector('.lb-play-ctrl'), animEls = [cursor].concat(layers, el.querySelectorAll('.lb-card, .lb-card__check, .lb-source-hero, .lb-meta-grid > span, .lb-preview-container'));
    
    var step = 0, userPaused = false, tl = null, intro = false;
    function syncPreview() {
      if(step === 2 && b.running()) { if(!iframe.hasAttribute("src")) iframe.src = iframe.getAttribute("data-src"); }
      else if(iframe.hasAttribute("src")) { iframe.removeAttribute("src"); iframe.classList.remove("is-loaded"); }
    }
    function fitPreview() { var host=iframe.parentElement,w=host.clientWidth,h=host.clientHeight,s=Math.min(w/1200,h/600); iframe.style.transform="translate("+((w-1200*s)/2)+"px,"+((h-600*s)/2)+"px) scale("+s+")"; }
    var previewResize = new ResizeObserver(fitPreview); previewResize.observe(iframe.parentElement); b.cleans.push(function(){previewResize.disconnect();});
    b.on(iframe,"load",function(){if(iframe.hasAttribute("src")) iframe.classList.add("is-loaded");fitPreview();});
    var timer = new Timer(function() { go((step + 1) % 3, "auto"); });

    b.el.querySelector('[data-lb-files-info]').setAttribute('data-i18n','d.filesVal');
    b.el.querySelector('[data-lb-files-info]').setAttribute('data-i18n-vars', JSON.stringify({n: DATA.frameworks[0].files.length, lines: DATA.frameworks[0].bundleLines}));
    b.translate();

    function setBar() {
      playBtn.setAttribute("data-playing", !userPaused ? "true" : "false"); playBtn.setAttribute("aria-label",b.t(userPaused?"common.play":"common.pause"));
      dots.forEach(function(d, i) { d.classList.toggle("is-active", i === step); });
    }
    
    function build0(t) {
      if(cursor) {
        var rootR = layers[0].getBoundingClientRect(), tgR = target.getBoundingClientRect();
        var tx = tgR.left - rootR.left + tgR.width / 2 - 17.5, ty = tgR.top - rootR.top + tgR.height / 2 - 12.25;
        t.fromTo(cursor, {x: rootR.width * 0.8, y: rootR.height * 0.8, autoAlpha: 0, scale: 1}, {autoAlpha: 1, duration: 0.2}, 0.2);
        var startX=rootR.width*0.8,startY=rootR.height*0.8;
        var path={p:0};
        t.to(path,{p:1,duration:0.7,ease:"power2.inOut",onUpdate:function(){var p=path.p;gsap.set(cursor,{x:startX+(tx-startX)*p,y:startY+(ty-startY)*p-Math.sin(Math.PI*p)*18});}},">");
        t.to(cursor, {scale: 0.9, duration: 0.1, yoyo: true, repeat: 1});
        t.call(function() { target.classList.add("is-selected"); });
        t.to(cursor, {autoAlpha: 0, duration: 0.2}, "+=0.4");
      } else { t.call(function() { target.classList.add("is-selected"); }, null, 1.2); }
    }
    
    function animateTo(from, to) {
      if(!b.canAnim()) { tl = b.kill(tl); b.clear(animEls); layers.forEach(function(l, i){ l.classList.toggle("is-active", i === to); }); target.classList.add("is-selected"); syncPreview(); return; }
      tl = b.kill(tl); b.clear(animEls);
      layers.forEach(function(l, i){ l.classList.toggle("is-active", i === to); });
      if(to !== 0) target.classList.add("is-selected"); else target.classList.remove("is-selected");
      
      b.ctx.add(function(){ gsap.set(layers[to], {autoAlpha: 0}); if(from !== to) gsap.set(layers[from], {autoAlpha: 1}); });
      tl = b.tl({onComplete: function() { b.clear(animEls); }});
      if(from !== to) tl.to(layers[from], {autoAlpha: 0, duration: 0.25}, 0);
      tl.to(layers[to], {autoAlpha: 1, duration: 0.3}, from !== to ? 0.15 : 0);
      
      var at = from !== to ? 0.15 : 0;
      if(to === 0) build0(tl);
      else if(to === 1) {
        tl.fromTo(el.querySelector(".lb-source-hero"), {scale: 0.95, autoAlpha: 0}, {scale: 1, autoAlpha: 1, duration: 0.35, ease: "power2.out"}, at + 0.1);
        tl.fromTo(el.querySelectorAll(".lb-meta-grid > span"), {y: 6, autoAlpha: 0}, {y: 0, autoAlpha: 1, stagger: 0.04, duration: 0.25}, at + 0.2);
      } else if(to === 2) {
        syncPreview();
        tl.fromTo(el.querySelector(".lb-preview-container"), {y: 10, autoAlpha: 0}, {y: 0, autoAlpha: 1, duration: 0.35}, at + 0.1);
      }
      if(!b.running()) tl.pause();
    }

    function sched() { timer.stop(); if(b.running() && !userPaused) timer.startAt(step === 0 ? 3200 : 3600); }
    function go(i, src) {
      if(src === "user" || src === "api") userPaused = true;
      var from = step; step = i;
      setBar();
      if(intro && b.canAnim()) animateTo(from, i); else animateTo(i, i);
      syncPreview(); b.emit(i, src); sched();
    }

    b.on(playBtn, "click", function() { userPaused = !userPaused; setBar(); if(userPaused) timer.stop(); else if(!intro && b.running()) b.sync(); else sched(); });
    
    b.sync = function() {
      var r = b.running(); syncPreview();
      if(r && !intro) { intro = true; animateTo(step, step); sched(); return; }
      if(r) { b.tls.forEach(function(t){ if(t.progress()<1) t.resume(); }); if(!userPaused) { if(timer.pending()) timer.resume(); else sched(); } }
      else { timer.pause(); if(b.state.red || !intro && !b.state.act) animateTo(step, step); }
    };
    
    setBar(); animateTo(step, step);
    return { setStep: function(i){ go(i|0, "api"); }, onLoc: function(){}, dest: function(){ timer.stop(); } };
  }

  // --- 2. Frameworks ---
  function initFrameworks(b) {
    var el = b.el, tabs = toArr(el.querySelectorAll(".lb-fw-tab")), ink = el.querySelector(".lb-fw-ink");
    var codeEl = el.querySelector("[data-lb-code]"), instEl = el.querySelector("[data-lb-install]");
    var fCount = el.querySelector("[data-lb-files-count]"), lCount = el.querySelector("[data-lb-lines-count]");
    var copyBtn = el.querySelector('[data-lb-action="copy-code"]');
    var idx = 0, tl = null;

    function moveInk(t, anim) {
      if(!t) return;
      if(hasGSAP() && anim && b.canAnim()) {
        tl = b.kill(tl); tl = b.tl();
        tl.to(ink, {x: t.offsetLeft, width: t.offsetWidth, duration: 0.25, ease: "power2.out"});
      } else { ink.style.transform = "translateX(" + t.offsetLeft + "px)"; ink.style.width = t.offsetWidth + "px"; }
      var wrap = el.querySelector(".lb-fw-tabs");
      var l = t.offsetLeft - 24, r = t.offsetLeft + t.offsetWidth + 24;
      if(l < wrap.scrollLeft) wrap.scrollLeft = Math.max(0, l); else if(r > wrap.scrollLeft + wrap.clientWidth) wrap.scrollLeft = r - wrap.clientWidth;
    }

    function render(i, anim) {
      idx = i; var fw = DATA.frameworks[i];
      tabs.forEach(function(t, k) { t.setAttribute("aria-selected", k === i ? "true" : "false"); t.tabIndex = k === i ? 0 : -1; });
      moveInk(tabs[i], anim);
      codeEl.innerHTML = renderCode(fw.usage); instEl.textContent = fw.install;
      b.el.querySelector('[data-lb-files-count]').setAttribute('data-i18n-vars', JSON.stringify({n: fw.files.length}));
      b.el.querySelector('[data-lb-lines-count]').setAttribute('data-i18n-vars', JSON.stringify({lines: fw.bundleLines}));
      b.translate();
    }

    tabs.forEach(function(t, i) {
      b.on(t, "click", function() { render(i, true); b.emit(i, "user"); });
      b.on(t, "keydown", function(e) {
        var n = null; if(e.key==="ArrowRight") n = (i+1)%6; else if(e.key==="ArrowLeft") n = (i-1+6)%6;
        if(n!==null) { e.preventDefault(); render(n, true); tabs[n].focus(); b.emit(n, "user"); }
      });
    });
    b.on(copyBtn, "click", function() { copyText(DATA.frameworks[idx].usage).then(function(){ b.flash(copyBtn, true); }, function(){ b.flash(copyBtn, false); }); });
    
    b.sync = function() {}; // No auto-play here
    var resize = new ResizeObserver(function(){ moveInk(tabs[idx], false); }); resize.observe(el); b.cleans.push(function(){ resize.disconnect(); });
    render(idx, false);
    
    return { setStep: function(i){ render(i%6|0, true); b.emit(i%6|0, "api"); }, onLoc: function(){ moveInk(tabs[idx], false); }, dest: function(){ if(tl) tl.kill(); } };
  }

  // --- 3. Agent ---
  function initAgent(b) {
    var el = b.el, flow = el.querySelector(".lb-flow"), items = toArr(el.querySelectorAll(".lb-flow-item")), res = el.querySelector(".lb-agent-result");
    var icons = items.map(function(it) { return it.querySelector(".lb-flow-icon"); });
    var checks = icons.map(function(icon) { return icon.querySelector("svg"); });
    var contents = items.map(function(it) { return it.querySelector(".lb-flow-content"); });
    var descriptions = items.map(function(it) { return it.querySelector(".lb-flow-desc"); });
    var animated = [flow, res].concat(items, icons, checks, contents, descriptions);
    var btnReplay = el.querySelector('[data-lb-action="replay"]'), btnPrompt = el.querySelector('[data-lb-action="copy-prompt"]');
    var tl = null, intro = false, stage = 3;
    var timer = new Timer(function() { if(b.running()) play("auto"); });

    var react = DATA.frameworks[0];
    el.querySelector("[data-lb-prompt]").setAttribute("data-i18n", "a.prompt");
    el.querySelector('[data-i18n="a.s1desc"]').setAttribute('data-i18n-vars', JSON.stringify({n: react.files.length, lines: react.bundleLines}));
    b.translate();

    function setStat(k) {
      stage = k;
      items.forEach(function(it, i) { it.setAttribute("data-state", i < k ? "done" : i === k ? "active" : "pending"); });
      res.style.opacity = k >= 3 ? 1 : 0;
      res.style.visibility = k >= 3 ? "visible" : "hidden";
    }

    function settle(k) {
      timer.stop();
      tl = b.kill(tl);
      b.clear(animated);
      setStat(k);
    }

    function play(src) {
      timer.stop();
      if(!b.canAnim()) { settle(3); b.emit(3, src); return; }
      tl = b.kill(tl);
      tl = b.tl({ onComplete: function() {
        b.clear(animated);
        setStat(3);
        b.emit(3, src);
        if(b.running()) timer.startAt(6000);
      } });

      // Fade the old pass before resetting, keeping every row and circle in place.
      tl.to([flow, res], {autoAlpha: 0, duration: 0.18, ease: "sine.out"}, 0);
      tl.call(function() {
        items.forEach(function(it) { it.setAttribute("data-state", "pending"); });
        stage = -1;
      }, null, 0.18);
      tl.set(items, {"--lb-link-progress": 0}, 0.18);
      tl.set(icons, {autoAlpha: 0, scale: 0.88, "--lb-done": 0}, 0.18);
      tl.set(checks, {autoAlpha: 0, scale: 0.8, transformOrigin: "center"}, 0.18);
      tl.set(contents, {autoAlpha: 0, y: 4}, 0.18);
      tl.set(descriptions, {autoAlpha: 0, y: 3}, 0.18);
      tl.set(res, {autoAlpha: 0, y: 5}, 0.18);
      tl.set(flow, {autoAlpha: 1}, 0.18);

      var arrival = 0.3;
      items.forEach(function(it, i) {
        var enter = arrival - 0.1, done = arrival + 0.48;
        tl.to(icons[i], {autoAlpha: 1, scale: 1, duration: 0.32, ease: "power2.out"}, enter);
        tl.to(contents[i], {autoAlpha: 1, y: 0, duration: 0.42, ease: "power2.out"}, enter);
        tl.call(function() { it.setAttribute("data-state", "active"); stage = i; b.emit(i, src); }, null, arrival + 0.06);
        tl.call(function() { it.setAttribute("data-state", "done"); }, null, done);
        tl.to(icons[i], {"--lb-done": 1, duration: 0.32, ease: "sine.inOut"}, done);
        tl.to(checks[i], {autoAlpha: 1, scale: 1, duration: 0.28, ease: "power2.out"}, done + 0.06);
        tl.to(descriptions[i], {autoAlpha: 1, y: 0, duration: 0.36, ease: "power2.out"}, done + 0.06);
        if(i < items.length - 1) {
          // Each segment spans exactly two circle centers; the next circle fades in as it arrives.
          tl.to(it, {"--lb-link-progress": 1, duration: 0.52, ease: "sine.inOut"}, done + 0.12);
          arrival = done + 0.64;
        } else {
          tl.to(res, {autoAlpha: 1, y: 0, duration: 0.48, ease: "power2.out"}, done + 0.18);
        }
      });
      if(!b.running()) tl.pause();
    }

    b.on(btnReplay, "click", function() { intro = true; play("user"); });
    b.on(btnPrompt, "click", function() { timer.stop(); copyText(b.t("a.prompt")).then(function(){ b.flash(btnPrompt, true); }, function(){ b.flash(btnPrompt, false); }); });
    b.sync = function() {
      var r = b.running();
      if(r && !intro) { intro = true; play("auto"); return; }
      if(r) {
        if(tl && tl.progress() < 1) tl.resume();
        if(timer.pending()) timer.resume(); else if(stage >= 3 && (!tl || tl.progress() === 1)) timer.startAt(6000);
      } else {
        timer.pause();
        if(b.state.red) settle(3);
        else if(!intro && !b.state.act) setStat(3);
      }
    };
    setStat(3);
    return { setStep: function(i){ intro = true; settle(Math.max(0, Math.min(3, i|0))); b.emit(stage, "api"); }, onLoc: function(){}, dest: function(){ timer.stop(); } };
  }

  var FACTORIES = { "discovery": initDiscovery, "frameworks": initFrameworks, "agent": initAgent };

  function initPanel(el, opts) {
    if(el._lbApi) el._lbApi.destroy();
    var kind = el.getAttribute("data-leibox-panel");
    if(!FACTORIES[kind]) return null;
    
    var b = createBase(el, opts);
    var p = FACTORIES[kind](b);
    b.update();
    
    var api = {
      panel: kind,
      setStep: p.setStep,
      setLocale: function(l) { b.state.loc = l === 'en' ? 'en' : 'zh-CN'; b.translate(); p.onLoc(); },
      setTheme: function(t) { b.state.thm = t === 'dark' ? 'dark' : 'light'; el.setAttribute("data-lb-theme", b.state.thm); },
      setActive: function(a) { b.state.act = !!a; b.update(); },
      destroy: function() { p.dest(); b.destroy(); delete el._lbApi; }
    };
    el._lbApi = api;
    return api;
  }

  return {
    dictionary: DICT,
    data: DATA,
    init: function(root, opts) {
      if(!root) return null;
      var els = root.hasAttribute("data-leibox-panel") ? [root] : toArr(root.querySelectorAll("[data-leibox-panel]"));
      var insts = els.map(function(el) { return initPanel(el, opts); }).filter(Boolean);
      return {
        panels: insts,
        setStep: function(i) { insts.forEach(function(p){ p.setStep(i); }); },
        setLocale: function(l) { insts.forEach(function(p){ p.setLocale(l); }); },
        setTheme: function(t) { insts.forEach(function(p){ p.setTheme(t); }); },
        setActive: function(a) { insts.forEach(function(p){ p.setActive(a); }); },
        destroy: function() { insts.forEach(function(p){ p.destroy(); }); }
      };
    }
  };
})();

export const claudeDictionary = api.dictionary;
export function mountClaudePanel(root, options) { return api.init(root, options); }
