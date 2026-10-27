# LeiBox 字体

全站中文使用 MiSans VF；英文和数字沿用 Geist Sans，代码中的英文和数字沿用 Geist Mono。中文标题、正文、导航、表单及等宽区域中的中文通过同一字体系列渲染，不依赖访问者安装字体。

字体定义在 `src/app/fonts/misans.css`，排版令牌在 `src/app/globals.css`。MiSans 使用小米官方提供的 56 个原始 WOFF2 分块，共 4,523,768 字节，保留官方 Unicode 范围和可变字重。浏览器只请求当前内容需要的分块，文件随网站部署到 `/fonts/misans/`，不依赖第三方 CDN。

来源为 [MiSans 官网](https://hyperos.mi.com/font/zh/) 与[官方网页字体 CSS](https://cdn-font.hyperos.mi.com/font/css?family=MiSans_VF:VF:Chinese_Simplify,Latin&display=swap)。原始文件没有更改字形、裁剪或重新编码；各文件的下载地址与 SHA-256 记录在 `public/fonts/misans/sources.json`。

网站元数据注明使用 MiSans，随附使用声明和官方许可原文位于 `public/fonts/misans/NOTICE.txt`。[官方许可及下载页](https://hyperos.mi.com/font/zh/download/)，[使用说明](https://hyperos.mi.com/font/zh/faq/)。

性能优化保留上述原始字体文件。带哈希的自托管分片已配置一年 immutable 缓存，本地预览、Netlify 和静态资源 headers 保持一致；没有为减小体积而裁剪、修改或重新编码 MiSans。

验证覆盖项目源码中 1,217 个不同汉字。实际浏览器通过字体渲染信息确认中文来自自托管 MiSans，英文来自 Geist；首页、组件列表和安装文档完成 375 / 768 / 1440 宽度截图检查，另检查搜索输入、深色主题与中英文切换。未在实体苹果或安卓设备逐台验证。
