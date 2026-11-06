# 一键发布到服务器

在项目原目录运行：

```powershell
npm run deploy:server
```

脚本发布 **main 当前已提交的 Git 版本**，未提交的修改不上传。它导出该提交到 `outputs/deploy-server/` 下的构建目录，复用本机依赖，构建并运行性能、Skill 和下载检查，再推送 GitHub、打包增量、通过 SSH 发布，最后核对公网页面和 AI 目录摘要。它不创建 worktree、不自动提交文件。

发布端先校验完整清单、路径及 SHA-256，再备份旧文件、优先更新静态资源，最后更新 HTML。服务端写入或校验失败时恢复本次已经替换的文件；`.env.local` 不在发布范围。公网检查失败时保留服务端回执并报错，供核对，不因临时网络错误自动更换线上版本。回执保存在本机该发布目录的 `receipt.json`，服务器备份位于 `/opt/Project/leibox/backups/<release>`。旧哈希资源保留以兼容仍打开的页面。

`public/motion-frameworks` 保留在本地用于生成文档与安装包，不再放入服务器发布清单；线上源码复制使用 `doc-assets`，AI/CLI 安装使用 `ai/packages`。预览方案页也不进入发布包。

2026-11-06 起网站演示使用 `/assets/motion/` 下的哈希资源。仅上传 `out/` 不会更新服务器正在运行的 `scripts/serve-local.mjs`。首次发布性能修复时，需通过管理员通道同步新版服务脚本并在宝塔重启 LeiBox 项目，或先安装 [Nginx 演示资源配置](../../docs/nginx/leibox-motion-static.conf)；完整操作和 CDN 规则见 [修复说明](../../docs/PERFORMANCE-FIX-20261106.md)。发布密钥继续只更新 `out/`。

## 过期资源和备份

新版清理器还识别 `assets/motion/` 中带 24 位内容哈希的 HTML、JS、CSS 和字体。须通过管理员通道更新服务器的 `leibox-release-cleanup.py` 后才会退休这些文件；同样保留 24 小时宽限、当前清单和两份可回滚备份。

`cleanup.py` 默认只预览；`--apply` 才删除。规则为：构建资源保留至少 24 小时，已识别的发布备份保留最近两次。当前清单和这两次备份恢复时需要的全部文件始终保留，不因文件年龄被删除。只清理 `_next/static` 中已识别的构建文件、`doc-assets` 中的哈希源码包、`assets/optimized` 中已退出清单的哈希 WebP，以及发布历史中已记录并退出清单的 `motion-frameworks` 文件；上传文件、环境配置、证书、管理配置备份和无法识别的文件不纳入清理。

本地 `assets:optimize` 会移除生成目录内过期的哈希图片，同时保留 Git 中尚未提交的修改与未跟踪输出。服务器上的旧图片和框架目录仍按上述回滚与宽限期规则退休，不在发布时强删。

24 小时从资源退出完整发布清单后计算，不直接用文件创建日期。首次安装从已有的完整发布记录核实退出时间，之后记录在 `.releases/retired-assets.json`；没有足够历史证据时从当前发布或首次观察开始计时。

清理前校验当前版本全部文件的 SHA-256；校验失败就停止。发布与清理使用同一个 `.releases/publish.lock`，避免清理到正在上传的资源。新发布备份同时记录 `previous-manifest.json`。旧备份必须用保存文件的摘要核实前一版清单，核实失败时保留资源与备份并报告原因。

管理员将本目录的 `receiver.py`、`cleanup.py` 安装为服务器 `scripts/leibox-deploy-receiver.py`、`scripts/leibox-release-cleanup.py`；现有发布密钥不能更新这些管理程序。将 `leibox-cleanup.service` 和 `leibox-cleanup.timer` 安装到 `/etc/systemd/system/`，检查后执行 `systemctl enable --now leibox-cleanup.timer`，每天自动清理一次。此过程不扩大 SSH 密钥的命令权限。

```sh
# 查看计划；不删除
python3 /opt/Project/leibox/scripts/leibox-release-cleanup.py
# 按同一规则立即清理
python3 /opt/Project/leibox/scripts/leibox-release-cleanup.py --apply
systemctl status leibox-cleanup.timer
```

可在 `.releases/cleanup-policy.json` 增加保留时间和份数，例如 `{"assetGraceHours":48,"keepBackups":3}`；不允许少于 24 小时或两份备份。最近一次执行清单和释放空间记录在 `.releases/cleanup-last.json`。调整规则后先查看预览，再执行清理。

## 当前机器

服务器已安装受限接收器；本机设置在被 Git 忽略的 `.deploy/server.json`。专用 SSH 密钥位于用户 `.ssh` 目录，没有写入仓库。主机公钥指纹通过已经登录的宝塔终端核对后固定；脚本始终开启严格主机校验。

专用密钥只允许 `manifest` 和 `deploy`，禁止普通 shell、端口转发、PTY 和 agent 转发。接收器只接收 `out` 内的常规文件，不接收脚本或环境文件。已有接收器若需升级，应通过管理员通道替换，不能用发布密钥修改自己。

## 换机器配置

复制 `scripts/deploy/server.example.json` 到 `.deploy/server.json`，设置专用私钥和可信主机记录路径。需要 Git、Node/npm、Python 3.12+、OpenSSH，以及当前项目的 `node_modules`。首次安装服务端接收器、固定主机公钥和授权专用密钥需要已有服务器管理员入口，不能跳过主机身份验证。

仅构建、校验和打包，不发布：

```powershell
npm run deploy:server -- --prepare-only
```

接收器回归测试：`python scripts/deploy/test_receiver.py`。测试覆盖正常发布、备份、环境保留、路径逃逸、摘要篡改、未列入清单的文件，以及写入失败后的恢复。Windows SSH 使用安全的 Curve25519 密钥交换，兼容本机 OpenSSH 的算法实现。

发布和清理的完整回归：`python -m unittest discover -s scripts/deploy -p 'test_*.py' -v`。额外覆盖只预览、保留当前版本及回滚资源、24 小时宽限、仅删除已识别备份、历史清单迁移、符号链接、异常清单和非法保留配置。
