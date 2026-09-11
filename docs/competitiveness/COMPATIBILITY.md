# 数据兼容、应用与回退

## 补丁性质

这是基于 `ee5e88c51e7be61334d7dab7c06a550ae3f6e574` 的增量包，不是完整仓库。

保留既有依赖及锁文件，不更换框架。不包含第三方字体、用户备份、素材副本、密钥、`.git`、`node_modules` 或生产构建。应用器只更改清单中的文件；所有原文件先做 Git blob SHA 校验，全部预检成功才开始写入。遇到不同 HEAD、未提交改动或原文件哈希变化时拒绝覆盖。重复执行会安全拒绝，而不是重复追加 CSS。

## 收藏格式

保留 `fn-sprite-hub:collection:v1` 与旧 schemaVersion 1。旧备份仍可读取，Entry ID 与当前赛季保持原样。新保存附带可选的 `revision` 和 `entryVersions`；它们只用于协调本地更新与撤销，不是账户、服务器版本或分析标识，不上传。

新增本地键：

- `fn-sprite-hub:collection:v1:previous`：最近一次全量替换前的原始磁盘内容，逐字节保留。只保留最近一次，不是永久历史。
- `fn-sprite-hub:collection:v1:unsaved-before-replace`：全量替换前的未保存内存状态，若存在。与磁盘原始值分开保护。
- `fn-sprite-hub:tracker-context:v1`：sessionStorage 中的筛选、视图和返回位置，不在收藏备份 schema 中；12 小时后失效。

损坏 JSON、异季数据、未知 schema、未知 Entry 或新字段不会因打开页面而被空对象覆盖。只允许明确确认的 Restore／Reset 保护原始内容后替换。保存失败后状态留在内存，显示导出提示，并设置离页提醒；离页提醒取决于浏览器，不能当作备份保证。

## 多标签页边界

支持 Web Locks 的安全上下文中，读—修改—写使用同源统一锁；同页共享 store，其他标签页通过 storage/focus/visibility 重新读取当前值，不把事件中的旧快照写回。最近一次撤销只改一个 Entry，并核对其修订号，避免覆盖别的 Entry 或同 Entry 后来的修改。

不支持 Web Locks 的浏览器仍可读取收藏与进行临时操作、导出，但不进行无法协调的持久写入或全量替换。界面明确提示。这是刻意的保守降级，需要在目标浏览器上验证。

旧代码不使用这把锁。因此应用后验证时应关闭或刷新所有旧版本标签页。不能声称能协调旧客户端、跨设备或任何外部脚本直接写入。模拟互斥锁测试通过不等于原生浏览器并发测试通过；后者在当前环境被管理员策略阻止。

## 推荐本地应用

先确保目标仓库处于清洁状态及指定基线；创建自己的工作分支。把增量包放在仓库之外。

```bash
# 在你的 fn-sprite-hub 仓库中
cd /你的路径/fn-sprite-hub
git status --short
git rev-parse HEAD
git switch -c feat/competitiveness-phase-a

# 使用解压后的真实路径；先预检，再写入
node /你的路径/fn-sprite-hub-update/scripts/apply-competitiveness.mjs "$PWD" --check
node /你的路径/fn-sprite-hub-update/scripts/apply-competitiveness.mjs "$PWD"

pnpm install --frozen-lockfile
pnpm check:fix
pnpm exec playwright test --list
pnpm verify
git diff --check
git diff --stat
```

`check:fix` 用项目原有 Biome 格式化并整理导入；目标仓库集成时已执行并检查自动修复后的 diff。如最新 HEAD 已变化，请先合并差异，不删除应用器的检查强行覆盖。

## 回退

应用器不提交 Git；检查完成前保留自己的分支。代码回退使用你本地的基线，不运行全域 `localStorage.clear()`。旧客户端会忽略新增协调字段，但它原有的损坏／异季数据写回风险仍存在。

回退代码之前先下载当前收藏、previous 快照与受保护的未保存工作，并关闭新旧混合标签页。不要使用未检查内容的备份覆盖当前收藏。恢复最近快照仍应经过预览和确认。

目标仓库的完整构建与 Chromium 自动化回归已经通过；人工设备验收、生产回读和部署仍未由此自动完成。所有收录开关、GSC 与部署仍由站长另行决定。
