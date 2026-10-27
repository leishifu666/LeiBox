/** Task-oriented search metadata. Frameworks, packages and provenance come from the live collection. */
export type Discovery = {
  category: string;
  useCases: string[];
  searchTerms: string[];
  visualTags: string[];
  interactions: string[];
  caveat: string;
};

export const AI_DISCOVERY: Record<string, Discovery> = {
  "spider-music-player": {
    category: "media", useCases: ["专辑封面连续切换", "趣味音乐播放器", "animated album queue"],
    searchTerms: ["蜘蛛", "蛛丝", "结网", "音乐", "专辑", "封面", "切歌", "队列", "spider", "music", "album", "player", "queue"],
    visualTags: ["photography", "tactile", "spider"], interactions: ["click", "keyboard", "input"],
    caveat: "使用真实封面与本地播放计时；接入真实音源时替换媒体数据并核对封面权限。",
  },
  "ascii-object": {
    category: "hero", useCases: ["品牌模型展示", "首屏视觉", "3D model showcase"],
    searchTerms: ["字符", "ascii", "模型", "3d", "logo", "首屏", "hero"],
    visualTags: ["ascii", "3d"], interactions: ["pointer"],
    caveat: "需准备目标模型、SVG 或图片；渲染器要求见详情。",
  },
  asciify: {
    category: "cursor", useCases: ["鼠标探索效果", "网页局部字符化", "cursor lens"],
    searchTerms: ["字符", "ascii", "透镜", "鼠标", "光标", "cursor", "lens"],
    visualTags: ["ascii"], interactions: ["pointer"],
    caveat: "涉及实时 HTML 捕获，先查看详情中的浏览器要求与回退说明。",
  },
  frost: {
    category: "cursor", useCases: ["冰霜擦除互动", "节日活动首屏", "ice reveal"],
    searchTerms: ["冰霜", "冰冻", "融化", "擦除", "ice", "frost", "reveal"],
    visualTags: ["ice", "translucent"], interactions: ["pointer"],
    caveat: "涉及实时 HTML 捕获，先查看详情中的浏览器要求与回退说明。",
  },
  glass: {
    category: "cursor", useCases: ["鼠标放大镜", "首屏玻璃透镜", "magnifying cursor"],
    searchTerms: ["玻璃", "透镜", "放大镜", "折射", "鼠标", "glass", "lens", "magnifier"],
    visualTags: ["glass", "refraction"], interactions: ["pointer"],
    caveat: "涉及实时 HTML 捕获；玻璃文件管理卡片应选择 glass-folder。",
  },
  "glass-object": {
    category: "hero", useCases: ["玻璃品牌标志", "产品模型展示", "glass logo showcase"],
    searchTerms: ["玻璃", "液态", "折射", "模型", "logo", "glass", "3d", "hero"],
    visualTags: ["glass", "3d"], interactions: ["pointer"],
    caveat: "需准备目标模型、SVG 或图片；渲染器要求见详情。",
  },
  "glyph-rain": {
    category: "background", useCases: ["代码雨背景", "科技主题首屏", "matrix code rain"],
    searchTerms: ["代码雨", "字符雨", "黑客", "矩阵", "matrix", "rain", "background"],
    visualTags: ["ascii", "cyber"], interactions: ["pointer", "autoplay"],
    caveat: "涉及实时 HTML 捕获；保持正文可读，浏览器要求见详情。",
  },
  "particle-object": {
    category: "hero", useCases: ["粒子 Logo", "交互模型展示", "interactive particle logo"],
    searchTerms: ["粒子", "散开", "聚合", "模型", "logo", "particles", "3d", "hero"],
    visualTags: ["particles", "3d"], interactions: ["pointer"],
    caveat: "需准备目标模型、SVG 或图片；渲染器要求见详情。",
  },
  "particle-scroll": {
    category: "scroll", useCases: ["滚动叙事", "页面消散过渡", "scroll storytelling"],
    searchTerms: ["滚动", "消散", "细沙", "粒子", "scroll", "dissolve", "particles"],
    visualTags: ["particles"], interactions: ["scroll"],
    caveat: "涉及实时 HTML 捕获；适合局部叙事段落，浏览器要求见详情。",
  },
  "liquid-object": {
    category: "hero", useCases: ["液态品牌展示", "流体模型互动", "liquid model showcase"],
    searchTerms: ["液态", "流体", "模型", "logo", "liquid", "fluid", "3d", "hero"],
    visualTags: ["liquid", "3d"], interactions: ["pointer"],
    caveat: "需准备目标模型、SVG 或图片；渲染器要求见详情。",
  },
  "collection-layout-morph": {
    category: "layout", useCases: ["收藏列表切换", "卡片布局变换", "list grid layout switch"],
    searchTerms: ["列表", "卡片", "堆叠", "布局", "切换", "list", "grid", "layout", "stack"],
    visualTags: ["cards"], interactions: ["click", "keyboard"],
    caveat: "接入时替换演示图片和条目，保留共享元素的连续布局。",
  },
  "brand-poster-cards": {
    category: "cards", useCases: ["品牌海报展示", "人物作品集", "brand poster portfolio"],
    searchTerms: ["品牌", "海报", "人物", "作品集", "brand", "poster", "portrait", "portfolio"],
    visualTags: ["photography", "editorial"], interactions: ["hover", "click", "keyboard"],
    caveat: "替换演示人像、品牌标志和文案，并确认素材使用权限。",
  },
  "dot-matrix-trio": {
    category: "background", useCases: ["品牌点阵展示", "印刷风动效卡片", "dot matrix brand cards"],
    searchTerms: ["点阵", "波纹", "旋涡", "品牌", "dot", "matrix", "ripple", "spiral"],
    visualTags: ["dots", "print"], interactions: ["autoplay", "click", "keyboard"],
    caveat: "三联卡片视觉；等待反馈可优先比较 ai-generating。",
  },
  "selection-flower": {
    category: "text", useCases: ["文章趣味选区", "编辑型作品集", "playful text selection"],
    searchTerms: ["文字", "选区", "开花", "花朵", "文章", "text", "selection", "flowers"],
    visualTags: ["botanical", "illustration"], interactions: ["text-selection", "keyboard"],
    caveat: "装饰性文字互动；需要编辑文字颜色时选择 notes-text-color。",
  },
  "inline-text-morph": {
    category: "text", useCases: ["可切换标题", "品牌标语互动", "interactive headline"],
    searchTerms: ["文字", "标题", "词组", "变形", "标语", "text", "headline", "morph"],
    visualTags: ["typographic", "stickers"], interactions: ["click", "keyboard"],
    caveat: "接入时替换词组与贴纸，并检查目标语言的字形和排版。",
  },
  "galaxy-effort-slider": {
    category: "input", useCases: ["AI 思考强度选择", "模型参数调节", "AI reasoning effort"],
    searchTerms: ["思考", "推理", "强度", "滑块", "脑", "reasoning", "effort", "slider"],
    visualTags: ["particles", "cosmic"], interactions: ["drag", "keyboard"],
    caveat: "视觉强度选择器；实际模型参数需映射到目标项目的接口。",
  },
  "notes-text-color": {
    category: "text", useCases: ["笔记高亮", "文字颜色编辑", "note text highlighting"],
    searchTerms: ["文字", "选区", "颜色", "调色", "笔记", "高亮", "highlight", "color", "notes"],
    visualTags: ["glass", "minimal"], interactions: ["text-selection", "click"],
    caveat: "将颜色选择结果接入目标编辑器，核对选区与持久化行为。",
  },
  "bounding-box-resize": {
    category: "layout", useCases: ["画布选框缩放", "设计编辑器", "canvas resize handles"],
    searchTerms: ["选框", "缩放", "尺寸", "画布", "resize", "bounds", "editor"],
    visualTags: ["minimal", "editor"], interactions: ["drag", "input"],
    caveat: "缩放交互演示；尺寸结果需接入目标项目的画布状态。",
  },
  "soft-action-wheel": {
    category: "navigation", useCases: ["快捷操作菜单", "工具栏展开", "minimal radial actions"],
    searchTerms: ["菜单", "环形", "快捷", "工具栏", "简洁", "黑白", "menu", "radial", "actions", "toolbar"],
    visualTags: ["minimal", "monochrome"], interactions: ["click", "keyboard"],
    caveat: "替换演示操作，检查展开后按钮与页面边界的间距。",
  },
  "staggered-radial-menu": {
    category: "navigation", useCases: ["彩色快捷菜单", "创意工具入口", "colorful radial menu"],
    searchTerms: ["菜单", "环形", "彩色", "快捷", "menu", "radial", "colorful", "actions"],
    visualTags: ["colorful", "spring"], interactions: ["click", "keyboard"],
    caveat: "适合少量快捷操作，接入时替换演示动作。",
  },
  "elastic-panel-resize": {
    category: "layout", useCases: ["侧栏宽度调节", "可拖拽面板", "resizable sidebar panel"],
    searchTerms: ["面板", "侧栏", "缩放", "宽度", "拖拽", "panel", "sidebar", "resize", "drag"],
    visualTags: ["minimal", "elastic"], interactions: ["drag"],
    caveat: "将拖拽尺寸接入实际布局，并检查项目需要的最小宽度。",
  },
  "blue-fluted-glass": {
    category: "background", useCases: ["品牌首屏背景", "蓝色玻璃场景", "blue glass hero background"],
    searchTerms: ["背景", "首屏", "蓝色", "棱纹", "毛玻璃", "background", "hero", "blue", "fluted"],
    visualTags: ["blue", "glass", "liquid"], interactions: ["autoplay"],
    caveat: "替换演示 Logo；正文需要在流动背景上保持可读。",
  },
  "reasoning-effort-slider": {
    category: "input", useCases: ["AI 推理档位选择", "模型设置", "reasoning effort settings"],
    searchTerms: ["思考", "推理", "强度", "滑块", "模型", "简洁", "三档", "reasoning", "effort", "slider"],
    visualTags: ["cosmic", "elastic"], interactions: ["drag", "keyboard"],
    caveat: "三档选择界面；实际模型参数需映射到目标项目的接口。",
  },
  "deep-agent-composer": {
    category: "input", useCases: ["AI 聊天输入", "智能体对话", "AI chat composer"],
    searchTerms: ["聊天", "对话", "输入框", "附件", "模型", "chat", "agent", "composer", "prompt"],
    visualTags: ["product", "compact"], interactions: ["input", "click", "keyboard"],
    caveat: "业务接口、附件上传、权限和模型调用需由目标项目接入。",
  },
  "hammerhead-chart": {
    category: "data", useCases: ["创意图表叙事", "价格路径演示", "price path visualization"],
    searchTerms: ["图表", "价格", "路径", "鲨鱼", "chart", "price", "shark", "forecast"],
    visualTags: ["ascii", "chart"], interactions: ["pointer", "autoplay"],
    caveat: "价格路径是界面演示，使用前确认数据来源与业务含义。",
  },
  "glass-tab-menu": {
    category: "navigation", useCases: ["标签页导航", "可展开应用菜单", "expandable tab navigation"],
    searchTerms: ["导航", "标签", "菜单", "玻璃", "navigation", "tabs", "menu", "glass"],
    visualTags: ["glass", "minimal"], interactions: ["click", "keyboard"],
    caveat: "根据真实页面定义导航项与选中状态。",
  },
  "crumpled-paper": {
    category: "cards", useCases: ["信件展示", "照片便笺互动", "paper letter photo reveal"],
    searchTerms: ["纸张", "揉皱", "信件", "照片", "便笺", "paper", "letter", "photo", "unfold"],
    visualTags: ["paper", "tactile"], interactions: ["hover"],
    caveat: "替换示例信件和照片，并为触摸设备检查交互路径。",
  },
  "sailing-toc": {
    category: "navigation", useCases: ["长文章节目录", "文档阅读导航", "article table of contents"],
    searchTerms: ["目录", "章节", "长文", "阅读", "导航", "文章", "文档", "toc", "article", "documentation", "navigation"],
    visualTags: ["nautical", "minimal"], interactions: ["scroll", "click"],
    caveat: "章节 ID 与页面标题保持一致；帆船意象需符合页面风格。",
  },
  "thinking-particles": {
    category: "feedback", useCases: ["AI 思考等待反馈", "推理步骤展示", "AI thinking steps"],
    searchTerms: ["等待", "思考", "推理", "步骤", "加载", "thinking", "reasoning", "steps", "loading"],
    visualTags: ["particles"], interactions: ["autoplay", "click"],
    caveat: "把演示步骤绑定真实任务状态，不把动画进度当作真实推理进度。",
  },
  "glass-folder": {
    category: "files", useCases: ["文件管理", "作品集分组", "document file manager"],
    searchTerms: ["文件", "文件夹", "资料", "管理", "玻璃", "file", "files", "folder", "documents", "manager"],
    visualTags: ["glass", "cards"], interactions: ["hover", "click", "keyboard"],
    caveat: "文件卡片展示界面；存储、上传与真实文件权限需接入项目。",
  },
  "cosmic-panels": {
    category: "background", useCases: ["云服务品牌视觉", "宇宙主题展示", "cosmic infrastructure showcase"],
    searchTerms: ["轨道", "星云", "宇宙", "服务器", "cosmic", "orbit", "nebula", "server"],
    visualTags: ["cosmic", "dots"], interactions: ["autoplay"],
    caveat: "包含多个视觉模块，按页面需要选择，避免全部挤入小区域。",
  },
  "gradient-cover-wall": {
    category: "cards", useCases: ["封面画廊", "渐变作品展示", "gradient cover gallery"],
    searchTerms: ["渐变", "封面", "画廊", "作品集", "gradient", "cover", "gallery", "portfolio"],
    visualTags: ["gradient", "grain"], interactions: ["pointer", "autoplay"],
    caveat: "装饰性封面展示；业务列表的名称与链接需接入项目。",
  },
  "otp-verification": {
    category: "input", useCases: ["登录验证码", "身份验证反馈", "login verification code"],
    searchTerms: ["验证码", "登录", "验证", "短信", "otp", "verification", "login", "code"],
    visualTags: ["minimal", "capsule"], interactions: ["input", "keyboard"],
    caveat: "输入与结果反馈界面；验证码发送和校验需接入真实服务。",
  },
  "brand-line-cards": {
    category: "cards", useCases: ["交互品牌卡片", "线条 Logo 展示", "interactive line logo cards"],
    searchTerms: ["线条", "品牌", "标志", "鼠标", "line", "brand", "logo", "pointer"],
    visualTags: ["line-art", "monochrome"], interactions: ["pointer"],
    caveat: "演示含第三方品牌标志，接入时替换为项目自己的素材。",
  },
  "share-invite": {
    category: "collaboration", useCases: ["分享链接", "团队成员邀请", "team member sharing invite"],
    searchTerms: ["分享", "邀请", "成员", "团队", "权限", "share", "invite", "invitation", "members", "team"],
    visualTags: ["product", "compact"], interactions: ["input", "click", "keyboard"],
    caveat: "链接复制可接实际地址；邀请发送与权限变更需接入业务接口。",
  },
  "bouncy-access": {
    category: "collaboration", useCases: ["访问权限申请", "成员列表展开", "request access members"],
    searchTerms: ["访问", "申请", "权限", "成员", "access", "request", "permission", "members"],
    visualTags: ["capsule", "spring"], interactions: ["click"],
    caveat: "权限申请与成员状态需绑定项目业务数据。",
  },
  "velocity-drag": {
    category: "layout", useCases: ["日程卡片拖拽", "日历交互反馈", "calendar event drag"],
    searchTerms: ["日历", "日程", "拖拽", "惯性", "calendar", "schedule", "drag", "velocity"],
    visualTags: ["elastic", "cards"], interactions: ["drag"],
    caveat: "拖拽视觉反馈；实际排期、碰撞与保存逻辑需接入项目。",
  },
  "ai-generating": {
    category: "feedback", useCases: ["图片生成等待", "AI 加载反馈", "image generation loading"],
    searchTerms: ["等待", "生成", "加载", "点阵", "图片", "loading", "loader", "generating", "generation", "image"],
    visualTags: ["dots", "minimal"], interactions: ["autoplay"],
    caveat: "等待动画不表示真实完成百分比，需要绑定实际任务结束状态。",
  },
};
