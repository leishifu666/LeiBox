# 一键发布到服务器

在项目原目录运行：

```powershell
npm run deploy:server
```

脚本发布 **main 当前已提交的 Git 版本**。开始时检查 GitHub 连接，并对比 SSH 发布目标和公网当前 AI 目录的 SHA-256；连接或摘要检查失败就停止，不进入构建。通过后，脚本导出该提交到 `outputs/deploy-server/`，构建并运行性能、Skill、下载与发布回归检查，再打包增量、推送 GitHub 及通过 SSH 上传。发布后核对组件列表、AI 目录和新增详情页的内容摘要，再检查下线详情页是否返回 404 或 410。

先快速检查 GitHub、SSH 与线上目录，不构建、不推送、不上传：

```powershell
npm run deploy:server:check
```

检查命令返回本地与服务器提交号；两者可以不同，这表示有新提交待发布。准备命令仅构建、校验和打包，仍需 SSH 与公网基线。脚本内部的 `--check` 与 `--prepare-only` 不可同时使用，未识别参数直接报错，完整用法见 `node scripts/deploy/server.mjs --help`。

检查和准备使用独立 npm 命令，避免本机 PowerShell / npm 启动入口丢失 `--` 后的参数，导致检查变成发布。直接诊断也可运行 `node scripts/deploy/server.mjs --check`。

检查和准备完成后自然退出，让网络与子进程句柄正常收尾；不在异步检查结束时强制 `process.exit()`，避免本机 Windows Node 出现 `UV_HANDLE_CLOSING` 退出断言。

发布端先校验完整清单、路径及 SHA-256，再备份旧文件、优先更新静态资源，最后更新 HTML。服务端写入或校验失败时恢复本次已经替换的文件；`.env.local` 不在发布范围。公网检查失败时保留服务端回执并报错，供核对，不因临时网络错误自动更换线上版本。回执保存在本机该发布目录的 `receipt.json`，服务器备份位于项目目录下的 `backups/<release>`。旧哈希资源保留以兼容仍打开的页面。

从组件目录下线的详情页、导航数据、独立演示和专用 AI 下载文件随发布移到该次备份。发布前逐个核对上一版的摘要，发现线上文件被单独修改时停止。首次接管已有站点且发布清单尚未建立时，通过源站当前 AI 目录识别已有组件。

`public/motion-frameworks` 保留在本地用于生成文档与安装包，不再放入服务器发布清单；线上源码复制使用 `doc-assets`，AI/CLI 安装使用 `ai/packages`。预览方案页也不进入发布包。

2026-11-06 起网站演示使用 `/assets/motion/` 下的哈希资源。仅上传 `out/` 不会更新服务器正在运行的 `scripts/serve-local.mjs`。首次发布性能修复时，需通过管理员通道同步新版服务脚本并在宝塔重启 LeiBox 项目，或先安装 [Nginx 演示资源配置](../../docs/nginx/leibox-motion-static.conf)；完整操作和 CDN 规则见 [修复说明](../../docs/PERFORMANCE-FIX-20261106.md)。发布密钥继续只更新 `out/`。

## 过期资源和备份

新版清理器还识别 `assets/motion/` 中带 24 位内容哈希的 HTML、JS、CSS 和字体。须通过管理员通道更新服务器的 `leibox-release-cleanup.py` 后才会退休这些文件；同样保留 24 小时宽限、当前清单和两份可回滚备份。

`cleanup.py` 默认只预览；`--apply` 才删除。规则为：构建资源保留至少 24 小时，已识别的发布备份保留最近两次。当前清单和这两次备份恢复时需要的全部文件始终保留，不因文件年龄被删除。只清理 `_next/static` 中已识别的构建文件、`doc-assets` 中的哈希源码包、`assets/optimized` 中已退出清单的哈希 WebP，以及发布历史中已记录并退出清单的 `motion-frameworks` 文件；上传文件、环境配置、证书、管理配置备份和无法识别的文件不纳入清理。

本地 `assets:optimize` 会移除生成目录内过期的哈希图片，同时保留 Git 中尚未提交的修改与未跟踪输出。服务器上的旧图片和框架目录仍按上述回滚与宽限期规则退休，不在发布时强删。

24 小时从资源退出完整发布清单后计算，不直接用文件创建日期。首次安装从已有的完整发布记录核实退出时间，之后记录在 `.releases/retired-assets.json`；没有足够历史证据时从当前发布或首次观察开始计时。

清理前校验当前版本全部文件的 SHA-256；校验失败就停止。发布与清理使用同一个 `.releases/publish.lock`，避免清理到正在上传的资源。新发布备份同时记录 `previous-manifest.json`。旧备份必须用保存文件的摘要核实前一版清单，核实失败时保留资源与备份并报告原因。

清理通过管理员通道执行，发布密钥的 `manifest` / `deploy` 权限保持不变。当前生产目录为 **`/opt/ProJect/leibox`**，大小写必须完全一致。新版清理器支持 `--root`，也读取接收器使用的 `LEIBOX_DEPLOY_ROOT`；显式参数优先。不指定时保留旧目录默认值 `/opt/Project/leibox`，当前服务器应始终显式指定 `--root`。

管理员同步本目录的 `cleanup.py` 为服务器 `scripts/leibox-release-cleanup.py` 后，在宝塔终端以 **root** 运行下面的命令。历史构建目录中仍有 root 所有的文件，以 `www` 清理会报 `PermissionError`；沿用管理员身份执行清理，无需递归修改站点权限。

```sh
# 查看包含候选路径、空间和保留备份的完整 JSON；不删除
python3 /opt/ProJect/leibox/scripts/leibox-release-cleanup.py --root /opt/ProJect/leibox --list
# 核对后执行同一规则；执行时重新校验当前版本并取得发布锁
python3 /opt/ProJect/leibox/scripts/leibox-release-cleanup.py --root /opt/ProJect/leibox --apply
```

可在 `.releases/cleanup-policy.json` 增加保留时间和份数，例如 `{"assetGraceHours":48,"keepBackups":3}`；不允许少于 24 小时或两份备份。最近一次执行清单和释放空间记录在 `.releases/cleanup-last.json`。调整规则后先查看预览，再执行清理。

定时清理模板 `leibox-cleanup.service` 已使用当前目录，并以管理员身份运行；迁移服务器时同步修改 `WorkingDirectory`、`ExecStart` 中的脚本路径和 `--root`、`ReadWritePaths`。需要启用每日清理时，再安装该服务与 `leibox-cleanup.timer`，运行 `systemctl daemon-reload`、`systemctl enable --now leibox-cleanup.timer`，并检查 `systemctl status leibox-cleanup.timer`。修改模板文件不会自动安装或启用定时器。

## 当前机器

本机设置在被 Git 忽略的 `.deploy/server.json`。更换生产源站后，在管理员终端核对新服务器的 SSH 主机公钥指纹，更新本机可信主机记录和发布目标。GitHub 直连可用而本机 Git 代理失效时，设置 `"directGitHub": true`，对本次发布的 GitHub 查询和推送禁用 Git 代理并使用 HTTP/1.1。

Windows 默认对 GitHub 命令使用 `http.sslBackend=schannel`，也可在机器配置中显式设置 `"gitSslBackend": "schannel"`；其他系统默认沿用 Git 自身的 TLS 后端，可显式选择 `openssl`。这些设置只通过本次 Git 命令的 `-c` 参数生效，不修改系统代理、全局 Git 配置或关闭证书校验。2026-11-23 实测系统代理为 7897，而 GitHub 的旧 Git 代理为失效的 7890；绕过旧代理并使用 Schannel 后查询和推送恢复。

直连也超时时，可将 `"gitProxy": "http://127.0.0.1:7897"` 写入本机配置，并设置 `"directGitHub": false`。显式 `gitProxy` 优先于 `directGitHub`，只覆盖本次 GitHub 查询和推送的代理；端口应与本机实际代理一致。2026-11-23 维护脚本时再次实测直连超时，通过 7897 和 Schannel 查询成功，因此本机已切到这个组合。GitHub 查询设置 15 秒低速中止和 20 秒操作超时，失败直接报告，不自动改系统代理或盲目重建网站。

专用密钥只允许 `manifest` 和 `deploy`，禁止普通 shell、端口转发、PTY 和 agent 转发。接收器只接收 `out` 内的常规文件，不接收脚本或环境文件。已有接收器若需升级，应通过管理员通道替换，不能用发布密钥修改自己。

新源站通过 SSH 强制命令中的 `LEIBOX_DEPLOY_ROOT` 指定站点根目录，Linux 路径区分大小写。接收器和同目录的 `retirement.py` 安装在管理员专用目录。设置 `LEIBOX_DEPLOY_RUN_AS_WEB_USER=1` 后，接收器以 `www` 账户读写站点导出、发布清单和备份。

宝塔管理入口与站点发布分开保存：本机 `.deploy/admin.json` 记录当前完整安全入口和站点目录，不存密码、不进入 Git。未登录时直接访问 `/xterm` 可能返回 404，应先访问完整安全入口；2026-11-23 绕过系统代理直连 `/xterm` 仍返回 404，经完整入口登录后终端正常。通过 Ego 操作终端时使用键盘输入命令，避免剪贴板权限弹窗及粘贴旧剪贴板内容。

## 换机器配置

复制 `scripts/deploy/server.example.json` 到 `.deploy/server.json`，设置专用私钥和可信主机记录路径；示例的 `gitSslBackend` 适用于 Windows，其他系统可删除此字段或改成 `openssl`。需要 Git、Node/npm、Python 3.12+、OpenSSH，以及当前项目的 `node_modules`。首次安装服务端接收器、固定主机公钥和授权专用密钥需要已有服务器管理员入口，不能跳过主机身份验证。管理员安装 `receiver.py` 和 `retirement.py` 时将它们放在同一管理员专用目录，再设置受限 SSH 强制命令；接收器位置和站点目录可以不同。

仅构建、校验和打包，不发布：

```powershell
npm run deploy:server:prepare
```

接收器回归测试：`python scripts/deploy/test_receiver.py`。测试覆盖正常发布、备份、环境保留、路径逃逸、摘要篡改、未列入清单的文件，以及写入失败后的恢复。Windows SSH 使用安全的 Curve25519 密钥交换，兼容本机 OpenSSH 的算法实现。

Git 参数与发布模式回归：`node --test scripts/deploy/test_server.mjs`。发布和清理的完整 Python 回归：`python -m unittest discover -s scripts/deploy -p 'test_*.py' -v`。覆盖只预览、指定目录及环境变量优先级、保留当前版本及回滚资源、24 小时宽限、仅删除已识别备份、历史清单迁移、符号链接、异常清单和非法保留配置。

性能检查失败时根据报错修复资源交付，再重新运行发布。网页演示的 HTML 壳必须小于 16 KB gzip，图片与字体数据不能留在初始 HTML 中；离线原件保持完整，网站版本由 `build-site-motion.mjs` 拆为哈希资源。不能为通过发布而跳过检查或放宽预算。
