const task=await taskSpace(40); const page=task.page("p1");
const prompt="请用代码完成 LeiBox Logo，不要调用生图。\n附件是视觉参考：纯黑圆角等轴测盒子，右侧是白色 L。保留这个黑盒轮廓与右侧 L 的设计方向，L 的竖臂和向右上方斜出的横臂必须一样长、一样粗，看起来像一个均衡的折角箭头。不要画成长竖短横，不要另加三角箭头或箭杆。\n\n请直接输出一个完整、可离线运行的 index.html 代码块（HTML/CSS/原生 JS，零依赖、无外网请求），完成以下工作：\n1. 页面并排展示 6 个克制的 SVG 代码变体：均衡圆角、平切端头、厚实圆角、纤细圆角、尖角折箭、紧凑版。主设计始终相同，仅调整粗细、端头、转角与整体大小。6 款都必须满足两臂长度 1:1、宽度 1:1。\n2. 形状以一个 elbow 点和同一个 length 参数计算两个端点：一臂竖直向上，另一臂沿盒子右下边缘方向向右上方（约 -30°）。以最终屏幕坐标中的中心线欧氏距离为等长依据，不用透视为不等长开脱。统一 strokeWidth。两臂在一点连续连接，仍能读为透视 L，同时像 chevron/折角箭头。禁止长短不一。\n3. 黑色外壳的圆角六边形/盒子按少量顶点和共享半径构造，使用真实直线与圆弧，不嵌入参考 PNG，不描成大量碎节点；保持参考图饱满、圆润的黑色块面。六个方案共享外形。\n4. L 必须是透明镂空，可用 SVG mask 真实扣除；透明背景 SVG 在白色预览上显示为白 L。切换深色背景时镂空应透出深色，不是用白块遮盖。离线导出 SVG 仍正确。\n5. 每个方案提供“下载 SVG”按钮；页面有背景切换，以及 24 / 48 / 96 像素使用预览。中文简洁标注。\n6. 在 UI 中为每款显示实际计算的两臂长度和比值。JS 对六款几何作断言，并将所有参数和结果放在 window.logoGeometry，方便我们本地回收验证。几何 SVG 生成统一使用一个函数；不允许预览和导出使用不同几何。\n7. 页面保持简单清晰，响应式，375px 也可看，按钮可键盘操作。不要做动效、不要新增网站其他功能。\n8. 直接给出全部源码，放在一个 html 代码块。无需讲内部推理，不要只交计划或伪代码。我们会保存源码到现有项目的 design/logo-explorations/ 中运行、验证；本轮仅供用户挑 Logo，不替换正式站点标志。";
const state=await page.evaluate(()=>({draft:document.querySelector('textarea[aria-label="消息输入"]')?.value,files:[...document.querySelectorAll('input[type="file"]')].map(x=>[...x.files].map(f=>f.name)),images:[...document.querySelectorAll("img")].map(x=>({alt:x.alt,src:x.getAttribute("src")?.slice(0,90)})),text:document.body.innerText.slice(-1800)}));
console.log(state);
if(state.draft && state.draft!==prompt)throw new Error("Unexpected existing draft");
await page.fill('textarea[aria-label="消息输入"]',prompt);
const actual=await page.evaluate(()=>document.querySelector('textarea[aria-label="消息输入"]')?.value);
if(actual!==prompt)throw new Error("Prompt mismatch");
console.log({promptVerified:true,characters:actual.length});
console.log(await page.snapshot());

