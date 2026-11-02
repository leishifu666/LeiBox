# LeiBox 中文字体对比

这是选型预览，正式网站的字体尚未改动。用同一组标题、正文、导航与组件文案比较四个候选；正文为 400 字重，标题为 500 字重，英文与数字沿用项目已有 Geist。

| 标记 | 字体 | 官方来源 | 本地资源 |
| --- | --- | --- | --- |
| A | MiSans VF | https://hyperos.mi.com/font/zh/ | 使用官方 `cdn-font.hyperos.mi.com` CSS 提供的原始 WOFF2 字符分片，400/500 为真实可变字重 |
| B | HarmonyOS Sans SC | https://developer.huawei.com/consumer/cn/design/resource/ | 原始字体包 https://developer.huawei.com/images/download/general/HarmonyOS-Sans.zip 中的 Regular / Medium，保留 TTF 与授权说明 |
| C | 阿里巴巴普惠体 3.0 | https://www.alibabafonts.com/ | 官方 fonts.alibabadesign.com 提供的 55 Regular / 65 Medium 原始 WOFF2 |
| D | Noto Sans SC（思源黑体系） | https://github.com/notofonts/noto-cjk | 本机已有 NotoSansSC-VF.ttf，可变字重 |

预览文件为 `index.html`，本机预览地址为 http://127.0.0.1:4177/ 。提供浅色、深色对比图与页面字体切换。选择后的正式接入会覆盖中文标题、正文、导航与表单，继续保留原有英文字体和代码等宽字体。

已经验证实际字体载入、主题切换与字体切换；375 / 768 / 1440 宽度无水平溢出，截图已复核。原浏览器截图受窗口最小化和可见区域裁切影响，最终 PNG 由隔离的本地页面渲染进程导出，未读取用户浏览器资料。

Netlify 右下角标识已通过本项目的 `built_with_badge_enabled=false` 关闭，生产组件页已检查无标识 iframe。官方设置说明：https://docs.netlify.com/manage/projects/powered-by-netlify-badge/ 。
