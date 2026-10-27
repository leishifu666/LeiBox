// Independent reading-example copy. This is not the website's privacy policy.
export const SAILING_TOC_SECTIONS = [
 {title:'Acceptance of These Terms of Service',paragraphs:[
  'Welcome to this reading example. The document demonstrates how a quiet table of contents can help people move through a long page. The same navigation can be used for a guide, a handbook, or a collection of product notes. Read any section in the order that works for you.',
  'Each heading has a matching entry in the contents. Scroll naturally to keep reading, or choose a heading to move directly to a subject. The small sailing ship marks your current place without covering the words. The route bends gently around the ship as it moves.',
  'THIS IS DEMONSTRATION CONTENT. The paragraphs describe an example interface and do not set the terms for an account, a purchase, or a real service. Replace this copy with the document appropriate to your own product.'
 ]},
 {title:'Access and Use of the Service',paragraphs:[
  'The reading surface works with a mouse, a trackpad, touch, or a keyboard. A wheel moves the article while the contents remains in place. Touch the article and swipe vertically to explore it. Focusing the reading area also makes ordinary keyboard scrolling available.',
  'Navigation stays inside this example. Choosing a heading changes the reading position and the highlighted entry. It does not open a new page, submit a form, or change any information outside the document.'
 ],items:['Keep the text readable at the size used by the host page.','Give each section a useful heading and a stable position in the contents.','Let a new scroll gesture interrupt an unfinished jump.','Preserve the reader’s place when the example is resized.']},
 {title:'Privacy Notice.',paragraphs:[
  'This demonstration keeps its reading position in memory for the current instance. It does not send the selected heading or the scroll position to a server. Two examples placed on the same page keep separate positions.',
  'The words in this panel are sample reading material. They are separate from the privacy policy of the website that contains the example. Use the host website’s own privacy information when you need to understand its actual practices.'
 ]},
 {title:'Who May Use the Services?',paragraphs:[
  'Use the example when you can manage the reading controls, understand the headings, and choose the parts of the document that are useful to you.'
 ]},
 {title:'Conditions of Access and Use',paragraphs:[
  'A long document should remain easy to explore without turning its navigation into a second task. The contents gives a steady overview, while the article provides enough space for continuous reading. The moving marker adds a small amount of character to an otherwise simple page.',
  'The following examples describe the behavior of this reading surface. They are interface notes for this local demonstration, and can be adapted to the needs of another document.'
 ],items:[
  'Scroll the article to move between sections without changing pages or opening another view.',
  'Choose a contents entry to travel to its matching heading. The current entry becomes darker and makes room for the ship.',
  'Let the ship move along the dashed route. The route bends around the marker instead of passing through its sails.',
  'Reverse the scroll direction at any time. The marker should slow, turn, and continue toward the new position.',
  'Use the keyboard to focus a heading in the contents. Press Enter or Space to activate the focused entry.',
  'Press the arrow keys while a contents entry is focused to move focus to another entry. Home and End reach the first and last items.',
  'Keep the current section visible to assistive technology by using a current-location attribute on its navigation control.',
  'Allow direct wheel, touch, or keyboard input to interrupt a smooth jump so that the document follows the reader’s latest action.',
  'Keep the two endpoint circles and the complete route visible. Changing the marker position should not shift the surrounding layout.',
  'When the reader requests reduced motion, move directly to the chosen heading and update the marker without spring travel.',
  'Use distinct labels for repeated sections. A contents entry should make sense without requiring the reader to inspect nearby paragraphs.',
  'Do not run an idle animation forever. When the marker settles, the example should wait for the next interaction.',
  'Support more than one reading example on a page. Moving one instance must not change the others.',
  'Remove scroll listeners, observers, and pending animation frames when the example is no longer shown.'
 ]},
 {title:'About the Services.',paragraphs:[
  'This example combines a document and its contents in one reading surface. The article contains paragraphs, numbered points, and headings of different lengths. Its navigation follows the current section and also lets the reader jump directly to a chosen subject.'
 ],items:[
  'Document layout. The contents stays to the left of the article, with a narrow dashed route beside the labels.',
  'Reading position. The active section is selected from the headings that have reached the upper part of the reading area.',
  'Marker movement. A spring carries the ship between labels. The amount and direction of its lean follow its vertical movement.',
  'Interruption. Choosing another heading replaces the current destination using the article’s actual position as the new starting point.',
  'Access is discretionary in this sample document. Its sentences exist to demonstrate line wrapping, paragraph rhythm, and a useful range of section lengths. They do not describe a financial, account, or subscription service.',
  'A reader can stop a jump with a direct scroll gesture. The example then returns to following the visible headings. The route and ship settle beside the new active label rather than continuing toward an outdated destination.'
 ]},
 {title:'Intellectual Property Rights',paragraphs:[
  'A component example should distinguish its own implementation from the design that inspired it. A source link can help readers identify the designer, while the interactive demonstration explains how the local implementation behaves.'
 ],items:[
  'Reading content. These paragraphs are independent sample copy written for this example. They provide a realistic amount of text for scrolling without reproducing another website’s complete document.',
  'Illustration. The ship is drawn with inline vector paths. Its hull, rigging, masts, and sails remain sharp when the reading surface is scaled.',
  'Page labels. The headings make up the visible contents. Each one has a corresponding article section and can be reached through the same local navigation.',
  'Customization. Replace the words and vector drawing when applying the component to a different product. Preserve the relationship between the active heading, the marker, and the article position.'
 ]},
 {title:'Third-Party Services',paragraphs:[
  'The reading demonstration does not need an external service to animate its marker. Its styles, vector drawing, and interaction code travel together with the component. The host application only needs to mount the example into an available element.',
  'If an application adds external links, keep their purpose clear and preserve normal browser behavior. A link to another page should remain distinct from a control that only changes the reading position inside this article.'
 ]},
 {title:'Termination.',paragraphs:[
  'Closing the example ends its current interaction. Any pending navigation and marker travel are cancelled, and the component releases the listeners and observers it created. A newly mounted instance begins with its own independent reading state.',
  'Removing an example must not remove content or controls owned by the page around it. The reading surface stays inside the element chosen by the host application.'
 ]},
 {title:'Indemnification',paragraphs:[
  'This heading is included to provide another position along a long document. The sample text is a layout fixture: its length gives the scroll interaction enough room to demonstrate changes in direction, interrupted jumps, and steady reading.',
  'Keep the distinction between a visual example and a real document clear when adapting the component. Use your own reviewed text for any page that describes actual responsibilities or obligations.'
 ]},
 {title:'Warranty Disclaimers',paragraphs:[
  'THIS IS AN INTERFACE DEMONSTRATION. THE TEXT IS SAMPLE COPY FOR A READING SURFACE, WITH PARAGRAPH LENGTHS CHOSEN TO SHOW SCROLLING AND NAVIGATION. IT DOES NOT CREATE A WARRANTY OR DESCRIBE AN ACTUAL PRODUCT AGREEMENT.',
  'A reader should be able to move through the document without losing the current place. The contents keeps a consistent position while the article moves. The ship follows the active section with a short settling motion rather than stopping abruptly at every change.',
  'When applying this interaction to a real page, test both quick navigation and slow continuous scrolling. Long headings should wrap naturally, selected labels should stay readable, and the marker should remain beside the route rather than crossing through the text.'
 ]},
 {title:'Limitation of Liability',paragraphs:[
  'THE PURPOSE OF THIS SECTION IS TO SHOW A LONG UPPERCASE TEXT BLOCK IN THE ARTICLE. ITS WORDS DESCRIBE A COMPONENT EXAMPLE AND ARE NOT A LIMITATION THAT APPLIES TO A REAL ACCOUNT, PURCHASE, OR SERVICE. REPLACE THE SAMPLE WITH THE DOCUMENT REQUIRED BY YOUR OWN APPLICATION.',
  'A long paragraph should still align with the surrounding text and keep a comfortable line height. Moving to another section must not change the size of the article or the width of the contents. Layout remains stable while the ship, active label, and reading position change.',
  'IF THE HOST APPLICATION CHANGES THE AVAILABLE SPACE, THE EXAMPLE RECOMPUTES ITS MEASUREMENTS. THE READER CAN THEN CONTINUE FROM THE CURRENT SECTION USING THE SAME INPUTS.'
 ]},
 {title:'Governing Law and Forum Choice.',paragraphs:[
  'These are local demonstration paragraphs for a scrolling document. They do not select a jurisdiction or a forum. The heading provides a longer wrapped label in the contents, showing how the marker aligns with entries that span more than one line.'
 ]},
 {title:'Dispute Resolution by Binding Arbitration',paragraphs:[
  'This section supplies a second long heading and a numbered list. It helps demonstrate a jump between distant parts of the article while keeping the surrounding navigation stationary.'
 ],items:[
  'Local navigation. Choosing this entry moves the article to the matching heading, updates the current-location state, and sends the ship toward the center of the wrapped label.',
  'Interruptions. A second selection begins from the actual reading position. It does not finish the old jump before responding to the new one.',
  'Keyboard access. Focus remains on the navigation control that was activated. Arrow keys move among entries, and Enter or Space starts a jump.',
  'Reduced motion. The article and marker update directly when reduced motion is requested. All headings remain reachable and the selected entry is still clearly identified.'
 ]},
 {title:'General',paragraphs:[
  'The example keeps one active heading and one moving marker. Its small number of visual parts makes the relationship between reading position and navigation easy to follow. The same interaction can accompany many kinds of long-form content.',
  'Change the section labels and paragraphs together so that the contents remains an accurate map of the article.'
 ]},
 {title:'Contact.',paragraphs:[
  'You have reached the last section of the local reading example. Choose another heading to travel back through the article, or scroll upward at your own pace. The ship will turn and follow the next active position.',
  'This sample does not send a message or collect contact information. Use the host website’s own contact controls when you want to reach its owner.'
 ]}
];

export const SAILING_SHIP_PATHS = [
 'M7 65C29 75 66 73 93 57L92 64C72 83 32 88 14 73Z',
 'M8 65C32 72 65 69 93 57M14 73C36 80 70 76 92 64',
 'M29 13V71M56 3V69M79 12V64',
 'M29 17C19 14 14 19 18 28L29 32Z',
 'M29 34C16 28 11 38 18 47L29 51Z',
 'M29 53C19 47 15 56 23 66L29 70Z',
 'M56 8C46 3 39 9 42 20L56 25Z',
 'M56 29C40 22 35 32 43 44L56 49Z',
 'M56 51C41 44 37 54 46 65L56 69Z',
 'M80 16Q92 30 95 48L80 56Z',
 'M1 61L29 48M8 65L29 58M29 69L56 38M56 68L79 42M29 13L34 12V16H29M56 3H62V7H56'
];

export const SAILING_TOC_PROMPT = `从零实现“帆船滚动目录”组件：白色长文阅读区左侧为固定目录与虚线航线，正文滚动或点击目录时，线描帆船沿航线移动；航线在帆船处向右弯曲，当前条目向右让位。完整规格如下，不依赖外部网页、视频、图片、字体文件或现成效果组件。

视觉与布局
- 桌面设计坐标1200×918，背景#fff；字体Inter, Arial, Helvetica, sans-serif。组件拥有独立纵向滚动容器，横向不溢出，滚动条隐藏，正文能用滚轮、触控及键盘滚动。
- 左栏固定，Contents位于(276,48)，16px/24px、常规字重、#222。目录从(276,114)开始，按钮宽254px、16px/23px、灰色#949494，条目之间14.5px；长标题自然换行。当前项为#222，并用320ms cubic-bezier(.22,1,.36,1)向右平移28px。其余文字不跟着位移。焦点轮廓1px深灰，不加hover上浮。
- 右栏从x684开始、宽480px，标题32px/40px、字距-1px、500字重；正文20px/31px、#424242；段落间24px，段间距72px，编号列表缩进30px。初始显示第4节标题在y92，其后第5节接续向下。
- 虚线在全局x228，顶端y58、底端y813，线宽1.1px、#aaa，dasharray=3 3；两端有半径3.5px的空心圆与半径1px的中心点。帆船中心约x250。航线SVG位于x206，局部基线x22，当前船心y=c：M22 58 L22 (c-54) C22 (c-30) 48 (c-30) 48 c C48 (c+30) 22 (c+30) 22 (c+54) L22 813。c限制在112～759，曲线随真实移动的船心更新。
- 帆船使用64×64px内嵌SVG，viewBox=0 0 100 88，白色填充、#454545描边、stroke-width=1.1、圆头圆角。路径按顺序绘制，第二、三和最后一项只描边，其余白填充。完整路径：
${SAILING_SHIP_PATHS.map((p,i)=>`${i+1}. ${p}`).join('\n')}

状态与动效
- 目录与正文一一对应，共16节；等待字体布局就绪和连续两帧绘制后，设置初始第4项与正文位置，再标记首帧可见，防止嵌入式预览尚未布局时把正文留在第1节。每项使用button，当前项aria-current=location，目录nav有英文可访问名称，船与虚线aria-hidden。
- 手动滚动时，以滚动容器顶部约180px为阅读锚点，选择最后一个经过该锚点的标题；滚到最底部选择最后一项。当前项变更后，船移到该目录按钮的纵向中心。
- 点击目录立即高亮目标项，正文从实际scrollTop出发，以cubic easeInOut平滑滚到目标标题距顶92px，时长clamp(0.65+距离/4200,0.65,1.45)秒。跳转期间锁定目标高亮，结束后恢复滚动检测。再次点击立即替换目标，不排队。滚轮、触摸或阅读区键盘输入能中断跳转。
- 船位置使用弹簧积分：加速度=180*(targetY-y)-24*velocity，dt最多0.032秒；用半隐式Euler先更新velocity再更新y。误差<0.1且速度<0.2时直接吸附并停止RAF。
- 船必须在同一长章节内滚动时也转向，不能只监听当前章节编号变更。每帧计算真实滚动速度speed=clamp((scrollTop-previousScrollTop)/dt,-16000,16000)，用1-exp(-dt*10)平滑为scrollSpeed；每帧更新previousScrollTop。滚动反向时船也平滑反向，不整张图突然镜像。
- 设置仅在可见时推进的相位phase，单位秒。船的倾斜目标为clamp(velocity*0.035+scrollSpeed*0.012,-20,20)+sin(phase*1.8)*1.4度；透视rotateY目标为clamp(velocity*0.05+scrollSpeed*0.06,-48,48)+sin(phase*0.9)*3度；用1-exp(-dt*12)插值平滑。阅读停下后保留轻柔摇摆，船心c=clamp(y+sin(phase*2.2)*0.85,112,759)，transform=translateY(c-32px) perspective(300px) rotateY(yaw) rotateZ(roll)。虚线弯曲与真实船心一致。
- 船下增加两圈很淡的扩散水波：在同一个100×88的SVG坐标系内，ellipse中心(51,79)，无填充，描边#9b9b9b、宽0.65。第i圈的进度p=(phase/2.4+i/2)%1，rx=24+42p、ry=6+13p、opacity=sin(p*PI)^2*0.24。水波置于船体后方，持续扩散淡出，不能挡住船轮廓或目录文字。
- 目录ArrowUp/ArrowDown移动焦点，Home/End聚焦首尾，Enter/Space激活；阅读容器可聚焦并保留浏览器正常的PageUp/PageDown、方向键、Home/End和触控滚动。跳转后保留激活按钮的焦点。
- reducedMotion或prefers-reduced-motion时正文直接跳转，船与航线直接更新到目标，倾斜、转向、起伏归零，隐藏水波并停止动画帧；所有导航仍可用。运行中修改减少动效选项立即响应，关闭减少动效后恢复轻柔水面运动。
- 可见且允许动效时持续运行轻柔摇摆和水波；导航结束与整船动画停止是不同状态。离屏、页面隐藏时暂停所有动画，恢复时重置上一帧时间和滚动位置，不补算离开期间的时间或产生突然转向。卸载释放RAF、ResizeObserver、IntersectionObserver、媒体查询和所有监听。多实例独立，不修改宿主body或全局URL。
- 窄容器可将1200px设计等比缩放并同步占位高度；较矮的height选项等比缩小左栏以保留完整目录。正文保持独立滚动，不能以整页长图或视频代替真实交互。

完整目录与独立演示正文
以下是本组件自带的阅读演示文案，单独用于展示滚动，不作为宿主网站的隐私政策或真实服务条款。每个编号生成一个section与同名目录项，paragraphs按段落生成，items按有序列表生成：
${JSON.stringify(SAILING_TOC_SECTIONS,null,2)}

交付及验证
- 提供所选框架可实际编译运行的入口、完整样式、SVG与交互核心、类型及使用示例；六框架共享框架无关核心，分别使用React、Vue、Svelte、Solid、Preact、Vanilla原生挂载和销毁生命周期，不能仅套iframe。
- 验证可见船身静止阅读时持续轻微起伏、水波扩散、同一长章节内真实滚轮能触发转向、反向滚轮能反转倾斜，以及滚动跟随、点击远距离跳转、快速反向点击、滚轮中断、键盘首尾和激活、当前项语义、减少动效静止、离屏暂停恢复、实例高度更新、多实例隔离、卸载后无残留动画及375/768/1440无横向溢出。不能仅检查章节编号或状态属性来判断船在动。`;
