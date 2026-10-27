// Artwork metadata verified against Apple Music / iTunes on 2026-10-26.
export const SPIDER_MUSIC_PLAYER_PROMPT = `创建“蜘蛛牵引切歌”组件：横向折叠双屏音乐播放器左侧列八首歌，右侧展示当前专辑封面。右屏蜘蛛跨屏拉左侧队列缩略图，左屏蜘蛛跨屏拉右侧大封面；下一首牵引缩略图到大封面位置，上一首包住当前大封面再缩小拉回原行。结网时封面抖动、落位时整台手机短促回震。必须连续移动同一个图片节点，不能用整体状态截图淡入代替。

完整视觉规格
- 设计坐标1416×1080，背景#d5d5d5。设备1228×868居中，10px金属渐变边框、78px外圆角；内侧8px黑边与68px圆角，左右白屏591×832、60px内圆角，中间10px黑色铰链。金属渐变由#fafafd经过#e3e3e7到#c3c3c9，阴影0 25px 38px #0002与0 45px 65px #0001。基准坐标左白屏(112,124)，右白屏(713,124)。容器变窄时整体等比缩放保留双栏；高度调整时再按min(1,height/1080)缩放设备，事件坐标和覆盖层必须做同一变换；读取设备实际clientLeft/clientTop，不能写死旧边框宽度。
- 左屏padding顶部44、左35、右32。右上9:41为16px粗体，42px点状圆边Wi-Fi图标，52px浅灰圆形返回按钮。标题两行“Tonight’s queue:”与“Late Night Drive”，Georgia / Times New Roman / serif，31px/37、字距-.75，微下移3px。正文Arial / Helvetica / sans-serif、18px/25、#4d4d4f：“Eight songs for the long way home. Tap any track, or press next and the little spider will fetch it for you.”
- UP NEXT为13px粗体；动态句子“当前歌手 is spinning now, with 下一位歌手 queued right after.”为18px/25、占58px高。表头SONG / ARTIST / TIME，11px灰字，列宽234、174、剩余空间。列表向左延伸12px；每行65px高、12px左右padding、14px圆角，行内三列221、176、剩余空间；图片38×38、7px圆角，与歌名相隔14px。标题16px，选中时600字重；歌手15px灰色、左padding16px，时长14px等宽、左padding14px。当前行第一列#e7e7ea，其余#f2f2f4，在行内x232–234与408–410处留2px白色竖分隔，并显示四条黑色跳动音量柱；下一首用黑底、#d1e97a字、9px的NEXT标记。列表高480px可滚动，底部31%渐隐。
- 左屏底部52px搜索栏，左右52px加号和话筒圆按钮，中间浅灰胶囊输入“Search or ask Siri”。匹配歌曲、歌手、专辑，空结果显示No matching tracks。话筒只聚焦文字搜索，不录音。加号打开本地Song、Artist必填表单，Add track创建本地条目，Cancel关闭，不上传。
- 右屏padding44px 31px 30px 34px；顶部10px大写字距1.65“NOW PLAYING — LATE NIGHT DRIVE”。标题Georgia / Times New Roman、49px粗体、54px行高、-3.5字距，下margin6px；歌手18px灰色、26px高、下margin18px。封面基准位置(747,298)、526×374、24px圆角；右侧覆盖54px宽磨砂黑色工具条，27px圆角，白色实心心形、描边聊天资料、播放设备、定位当前行四个图标。
- 封面下132px信息区，顶部padding29px，左列108px宽，16px/20四行展示流派、专辑、年份、Late night，1px灰竖线分隔；右列13px/17的独立队列说明，不写歌词或编造创作故事。真实图片来源由工具条的聊天资料图标链接打开，版权作为链接标题保留，不另加可见来源段落挤占版式。底部119px白色浮起播放条、32px圆角、细灰边、柔影：上部当前时间、128px宽的原生range与靠右剩余时间，三列164px/128px/剩余空间；下部shuffle、上一首、60px黑圆播放/暂停、下一首、repeat。内嵌SVG图标采用不同的实际形状：前后曲用实心三角加细竖杠，暂停用两条圆角白色实心竖条；shuffle与repeat为细线曲折箭头，心形初始实心、取消喜欢时描边，搜索圆与斜杠、话筒胶囊与底座，队列带三角。普通控制图标26px，播放图标28px，工具条图标21px。

真实音乐数据与图片
- 必须通过公开音乐图录按下列专辑、歌手、曲名逐一查找真实封面，核实匹配后保存图片并内嵌data URI，组件运行时不依赖网络；不使用AI生成图，不把封面版权宣称为自由授权。随交付记录真实图录页、原图片地址与版权；公开规格本身不依赖预先存在的文件。图片解码失败保留带专辑名的灰色槽，完整状态机仍可用。
- 队列依次：Come Down / Anderson .Paak / Malibu /2016/170秒/R&B/Soul；After Hours /The Weeknd /After Hours /2020/361秒/R&B/Soul；Redbone /Childish Gambino /Awaken, My Love! /2016/327秒/Hip-Hop/Rap；Pink + White /Frank Ocean /Blonde /2016/185秒/Pop；The Moment /Tame Impala /Currents /2015/255秒/Alternative；See You Again (feat. Kali Uchis) /Tyler, The Creator /Flower Boy /2017/180秒/Hip-Hop/Rap；Good Days /SZA /SOS /2022/278秒/R&B/Soul；EARFQUAKE /Tyler, The Creator /IGOR /2019/190秒/Hip-Hop/Rap。显示标题可省feat.，数据保留完整值。
- 识别图像：Malibu为蓝绿暖黄照片拼贴；After Hours为红黑人物；Awaken为蓝黑人像；Blonde为白底绿发人物；Currents为紫色流线与银球；Flower Boy为橙色花田人物；SOS为蓝色海面人物；IGOR为粉底黑白肖像。原图保持颜色，不混用歌手。默认Come Down从1:25开始，进度每秒推进；切歌归零。播放/暂停、进度拖动、随机、单曲循环和喜欢都有本地状态，不连接流媒体账户或播放未提供的音源。

蜘蛛、步态与蛛网绘制
- 蜘蛛必须属于手机屏幕内部。将两块白屏的实际DOM矩形与60px圆角转换为设备局部坐标，用两个闭合圆角路径组成同一个CSS clip-path:path，应用于蜘蛛、蛛丝和移动封面覆盖层；黑色边框与中铰链会遮住这些元素。蜘蛛即使SVG边界或阴影越过屏幕，也不能画到外壳、铰链或灰色页面上。不能只用整个设备外圆角裁切，也不能让蜘蛛浮在边框顶层。
- 用208×208内嵌SVG、viewBox为-104 -104 208 208，以头胸为坐标原点，半径8.1。腹部用水滴路径“M-4.5-5C-9.7-8.5-13.2-16-11.3-22.4-9.4-29-3.5-32.1 2.8-30.3 10.5-28.2 14-20.5 10.3-13.4 8-8.9 5.6-6 4.2-4.7Z”，黑灰径向渐变#292a2b→#151617→#050506；额外5.6×3.1的椭圆反光位于(-2.4,-23.5)，透明度不超过.46。头胸渐变#303132→#202122→#08090a，前方细尖口器延伸到y16，身体下1px/3px/2.2px浅投影。每个实例独立生成渐变ID。
- 两侧各四条腿，腿根、股节、胫节、膝部各自绘制，不能用等宽折线或放射星形替代。第i腿根(±3.6,3.2i-6.2)、髋点(±8.3,3.7i-8)，膝点绝对x[24,35,39,25]、y[-42,-18,11,28]，足尖绝对x[17,62,53,17]、y[-94,4,54,76]，左右x取负、正。用填充窄带让腿根宽3.1渐收至2.65，股节宽2.65渐收至1.9，膝部小圆半径1.25；胫节从宽1.8经过宽.9收为真正尖足。胫节使用二次曲线，中点沿法向偏移2.4，保留明显关节折角与轻微弧线。腿色#121314，膝与口器#111213，不画卡通眼睛，不用emoji或静态蜘蛛图。
- 用累计移动距离s计算交替步态phase=.13*s+(i%2)*PI+左右侧相位PI，lift=6*sin(phase)*stride，膝y加.65*lift、足尖y加lift、足尖x加3.5*cos(phase)*stride；stride向min(1,每帧移动距离/1.8)按.32收敛，静止后停止步态。反光相对身体角度反向旋转。右侧停靠头胸为(屏幕right-25,top+49)、角度34度，左侧为(left+26,top+49)、-34度；腹部和部分腿藏到圆角边框后。基准头胸位置分别约(1279,173)和(138,173)。
- 牵引方始终由封面所在屏幕决定，不能按切歌次数轮流换侧：从队列取图时必须是右屏蜘蛛朝左拉；把大图送回队列时必须是左屏蜘蛛朝右拉。下一首与上一首的方向独立于歌曲索引大小，末曲→首曲仍是右屏拉左图，首曲→末曲仍是左屏拉右图。连续两次下一首、连续两次上一首和快速混合请求均遵守此规则。
- 每次牵引先朝目标按最短角转向，并在.32秒power2.out内向屏幕内部爬73px、向下34px；搬运阶段再用.45秒power1.inOut退到距离原停靠点向内28px、向下12px。完成后用.32秒上爬至屏幕top-100、.83秒在遮挡区水平移动、.32秒从另一侧下降出现，两端power1缓动、水平匀速。离开屏幕时必须逐渐被边框遮住，中段整个蜘蛛不可见。新请求若要求另一屏牵引，先用.32秒上爬、.10秒在不可见区换侧、.32秒下降的预备过程到正确侧，再开始射丝；没有到正确侧之前蛛丝不可见。
- 蛛丝为.8px深灰二次曲线，起点是头胸朝目标一侧的局部(0,8)，随身体旋转；终点始终是搬运封面含抖动位移的中心；射出时用beam 0→1插值终点。中点下垂min(22,abs(dx)*.025)*(1-wrap*.6)，结网时叠加3*sin(12*PI*strain)*sin(PI*strain)，strain在结网期间0→1；不能固定线端。
- 网兜用6层椭圆折线与8根辐射线，中心跟随图片；rx=.61*宽+8，ry=.62*高+8。第r层第j点角度j/16*2PI、半径系数r/6*(1+.065*sin(2.4*j+.6*r))。wrap 0→1逐层画，每层16个采样点，线宽.75、深灰、无填充、不遮掉照片；大图小图都根据实际矩形计算。

状态机、震动与时间
- idle→可选position换侧→aim→wrap→carry→idle。以下时间均从aim开始计算，position需要时另加.74秒。每张封面有永久节点，在队列槽和主封面槽之间移动，当前队列行另显示小镜像。搬运时原行保留浅灰空槽。
- 封面在.20秒开始抖动，每1/30秒依次线性过渡以下[x,y,旋转角度]：[0,0,0]、[12,3.8,-.64]、[9.5,2.9,-.42]、[-4.8,-1.5,.69]、[-3.9,-1.6,.15]、[2.35,.87,.16]、[1.57,.67,-.13]、[.26,.08,-.02]、[0,0,0]。把大图拉回时x按原值，取队列图时x反号；x和y乘max(.35,当前图片宽/526)，角度不缩放。抖动叠加在基础位置与搬运旋转之上，并在真正搬运前归零；网兜与蛛丝端点实时跟随抖动后的图片中心。
- 下一首或点击后方歌曲：0–.32秒转向并爬入；.02–.18秒射丝；.18–.52秒结网；.54–1.08秒牵引。大小38×38→526×374、圆角7→24，中心二次贝塞尔B=(1-p)^2*起点+2(1-p)p*控制点+p^2*终点，控制点x=起点x+.57*dx、y=min(起点y,终点y)-100，p用power2.inOut。旋转7*sin(PI*p)度。旧大图在搬运后段.14秒淡出并回到队列。搬运开始.44秒后用.20秒收回丝线透明度。
- 上一首或点击前方歌曲：.18–.58秒给当前大图结网；.60–1.20秒缩回自己的行；旋转-9*sin(PI*p)，另一封面预置在其背后，从.87秒开始.34秒显现。封面连续保持同一节点身份。
- 封面落位前.035秒触发整台机身回震。以中心为transform-origin，在基础居中与等比缩放之后叠加水平位移和旋转；每1/60秒线性经过以下[x,角度]：[-.15,-.008]、[-1.48,-.11]、[-3.15,-.253]、[-2.53,-.297]、[.16,-.188]、[3.35,.038]、[3.49,.169]、[.75,.143]、[-1.62,.034]、[-2.28,-.047]、[-.97,-.06]、[.19,-.036]、[.57,-.006]、[.34,.011]、[.04,.002]、[0,0]。送回队列时x和角度反号，持续约.267秒，最后精确归零。整台设备连同屏幕、外壳、蜘蛛和覆盖层一起震动，不使灰色页面跟着晃动。减少动态效果时停止这两种震动。
- 机身转动时目标测量必须反向消除该变换，避免图片、蜘蛛和蛛丝漂移：取节点与设备旋转后包围盒中心之差，除以设备缩放，旋转-机身角度，再加设备未变换宽高的一半、减实际边框和节点offsetWidth/offsetHeight的一半。不要直接拿旋转后的包围盒左上角相减。窗口缩放清掉残留震动；页面隐藏暂停回震，重新显示继续；卸载立即终止。
- 完成时一起更新曲名、歌手、说明、NEXT、当前行、喜欢与进度；标签从下7px、模糊2px、透明用.28秒归位、错峰.035秒。快速重复请求只保留最后目标及其取图/送回方向，先完成当前搬运，再处理最后目标；不并行、不积累旧丝线。前后按钮相对最后请求索引计算，但方向由按钮的上一首/下一首意图保留，不能在循环后重新按索引大小判断。
- options.track为初始/更新的整数索引，options.playing控制计时，options.onTrackChange只在实际提交新曲后回调一次索引，初始化不调用。多实例的队列、计时和蜘蛛完全独立。

输入、适配与释放
- 队列用button，Enter/Space选择；场景聚焦时左右切歌、Home首曲、End末曲、Space暂停；input内不抢方向键，range保留原生操作。Escape关表单、清搜索。触屏点击和键盘都走同一搬运状态机。准确提供aria-label、aria-current、aria-pressed、polite状态区与可见焦点环。
- 搜索或滚动后重新读真实DOM矩形作为图片和蛛丝目标，不能固定行坐标。resize后稳定到最后请求状态再重新布局。网页隐藏暂停计时和活动时间线，显示后继续。
- 减少动态效果时直接归位、立即更新文字，停止步态、网和音量柱动画，保留所有操作。destroy立即kill GSAP时间线和对象补间，清计时器、监听器、观察器，异步图片解码后不得重启。
- 验证正反向搬运、结网、实时丝线端点、连续下一首两次、连续上一首两次、首尾循环、快速混合切换、播放暂停、range、喜欢、随机和循环、搜索空结果、添加必填/取消、键盘和触屏、减少动态效果、多实例、动画中卸载、重挂载；确认八张真实封面与歌手对应。逐帧检查结网时蜘蛛与目标分处两块屏幕；读取图片和机身真实计算变换，确认封面抖动与机身回震实际发生。对左右停靠与爬入牵引状态分别截帧，隐藏/显示蜘蛛作像素差分，确认屏幕圆角外、边框、铰链及页面背景均没有蜘蛛像素。`;
export const SPIDER_TRACKS = [
  {
    "id": "malibu",
    "title": "Come Down",
    "artist": "Anderson .Paak",
    "album": "Malibu",
    "duration": 170,
    "year": "2016",
    "genre": "R&B/Soul",
    "source": "https://music.apple.com/us/album/malibu/1065681363?uo=4",
    "artwork": "https://is1-ssl.mzstatic.com/image/thumb/Music69/v4/1b/b7/b1/1bb7b1a0-4ff7-5623-4992-3ef443cd6880/888915169681_cover.jpg/600x600bb.jpg",
    "copyright": "℗ 2016 OBE / Apeshit, Inc / EMPIRE",
    "file": "/assets/components/spider-music/malibu.webp"
  },
  {
    "id": "after-hours",
    "title": "After Hours",
    "artist": "The Weeknd",
    "album": "After Hours",
    "duration": 361,
    "year": "2020",
    "genre": "R&B/Soul",
    "source": "https://music.apple.com/us/album/after-hours/1499385848?uo=4",
    "artwork": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/2b/b9/fe/2bb9fef5-d7f3-8345-25a9-db0e79fde4e4/20UMGIM11048.rgb.jpg/600x600bb.jpg",
    "copyright": "℗ 2020 The Weeknd XO, Inc., marketed by Republic Records, a division of UMG Recordings, Inc.",
    "file": "/assets/components/spider-music/after-hours.webp"
  },
  {
    "id": "awaken",
    "title": "Redbone",
    "artist": "Childish Gambino",
    "album": "\"Awaken, My Love!\"",
    "duration": 327,
    "year": "2016",
    "genre": "Hip-Hop/Rap",
    "source": "https://music.apple.com/us/album/awaken-my-love/1771719334?uo=4",
    "artwork": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/f1/3c/d7/f13cd7ab-7319-028a-8807-5991d0b308d4/0044003187658_Cover.jpg/600x600bb.jpg",
    "copyright": "℗ 2016 McDJ Entertainment under exclusive license to Glassnote Entertainment Group LLC",
    "file": "/assets/components/spider-music/awaken.webp"
  },
  {
    "id": "blonde",
    "title": "Pink + White",
    "artist": "Frank Ocean",
    "album": "Blonde",
    "duration": 185,
    "year": "2016",
    "genre": "Pop",
    "source": "https://music.apple.com/us/album/blonde/1146195596?uo=4",
    "artwork": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bb/45/68/bb4568f3-68cd-619d-fbcb-4e179916545d/BlondCover-Final.jpg/600x600bb.jpg",
    "copyright": "℗ Boys Don't Cry",
    "file": "/assets/components/spider-music/blonde.webp"
  },
  {
    "id": "currents",
    "title": "The Moment",
    "artist": "Tame Impala",
    "album": "Currents",
    "duration": 255,
    "year": "2015",
    "genre": "Alternative",
    "source": "https://music.apple.com/us/album/currents/1440838039?uo=4",
    "artwork": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a8/2e/b4/a82eb490-f30a-a321-461a-0383c88fec95/15UMGIM23316.rgb.jpg/600x600bb.jpg",
    "copyright": "℗ 2015 Modular Recordings, under exclusive license to Universal Music Australia Pty Limited",
    "file": "/assets/components/spider-music/currents.webp"
  },
  {
    "id": "flower-boy",
    "title": "See You Again (feat. Kali Uchis)",
    "artist": "Tyler, The Creator",
    "album": "Flower Boy",
    "duration": 180,
    "year": "2017",
    "genre": "Hip-Hop/Rap",
    "source": "https://music.apple.com/us/album/flower-boy/1254572564?uo=4",
    "artwork": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/fd/fd/8c/fdfd8c26-b8f9-4768-41d3-b24773250c65/886446605814.jpg/600x600bb.jpg",
    "copyright": "℗ 2017 Columbia Records, a Division of Sony Music Entertainment, as exclusive licensee",
    "file": "/assets/components/spider-music/flower-boy.webp"
  },
  {
    "id": "sos",
    "title": "Good Days",
    "artist": "SZA",
    "album": "SOS",
    "duration": 278,
    "year": "2022",
    "genre": "R&B/Soul",
    "source": "https://music.apple.com/us/album/sos/1658650093?uo=4",
    "artwork": "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/62/93/13/6293132e-20ff-67ab-3d1f-96bb6797a6ba/196589564955.jpg/600x600bb.jpg",
    "copyright": "℗ 2022 Top Dawg Entertainment, under exclusive license to RCA Records",
    "file": "/assets/components/spider-music/sos.webp"
  },
  {
    "id": "igor",
    "title": "EARFQUAKE",
    "artist": "Tyler, The Creator",
    "album": "IGOR",
    "duration": 190,
    "year": "2019",
    "genre": "Hip-Hop/Rap",
    "source": "https://music.apple.com/us/album/igor/1463409338?uo=4",
    "artwork": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/0c/06/05/0c060581-6242-6a2a-a677-20170f2cf8da/886447710180.jpg/600x600bb.jpg",
    "copyright": "℗ 2019 Columbia Records, a Division of Sony Music Entertainment, as exclusive licensee",
    "file": "/assets/components/spider-music/igor.webp"
  }
];
