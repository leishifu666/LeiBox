# 一键发布到服务器

在项目原目录运行：

```powershell
npm run deploy:server
```

脚本发布 **main 当前已提交的 Git 版本**，未提交的修改不上传。它导出该提交到 `outputs/deploy-server/` 下的构建目录，复用本机依赖，构建并运行性能、Skill 和下载检查，再推送 GitHub、打包增量、通过 SSH 发布，最后核对公网页面和 AI 目录摘要。它不创建 worktree、不自动提交文件。

发布端先校验完整清单、路径及 SHA-256，再备份旧文件、优先更新静态资源，最后更新 HTML。服务端写入或校验失败时恢复本次已经替换的文件；`.env.local` 不在发布范围。公网检查失败时保留服务端回执并报错，供核对，不因临时网络错误自动更换线上版本。回执保存在本机该发布目录的 `receipt.json`，服务器备份位于 `/opt/Project/leibox/backups/<release>`。旧哈希资源保留以兼容仍打开的页面。

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
