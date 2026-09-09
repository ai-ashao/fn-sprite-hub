# FN Sprite Hub — V1.0 产品与开发设计文档

**项目仓库**：`ai-ashao/fn-sprite-hub`
**目标域名**：`fnspritehub.com`
**产品形态**：SEO-first 免费工具站 + Sprite 图鉴数据库 + Ads
**技术底座**：ShipLean（TanStack Start / React 19 / TypeScript / Tailwind / Cloudflare）
**文档版本**：v1.3（ShipLean 技术可执行性终审）
**日期**：2026-09-07
**状态**：技术终审后开发冻结稿（Implementation Source of Truth）

---

## 0. 文档目标

本文档用于在替换 ShipLean 默认 `Text Length Checker` 之前冻结 FN Sprite Hub 的产品边界、SEO 架构、Tracker UX、Sprite 数据模型、Collection 本地状态模型、图片资产、多语言、Ads-only 变现边界、视觉规范、技术约束、测试门禁与开发顺序。

**执行原则：先按本文档实施，不在开发过程中随意新增 SaaS / 社区型功能。**


## 0.3 v1.3 ShipLean 技术可执行性终审摘要

本轮不再改变产品方向，只检查 **FN Sprite Hub 设计与当前 ShipLean 代码、路由、SEO helper、i18n、测试、Cloudflare runtime、Legal Gate 是否真正兼容**。

发现并修正以下关键执行问题：

1. **SEO Title 会重复品牌**：ShipLean `pageHead()` 会自动追加 `· FN Sprite Hub`，因此页面配置的 `title` 不得再自行包含品牌。
2. **当前 Sitemap 只认识静态 `publicPageRoutes + toolRegistry`**：16 个 Sprite Detail 不会自动进入 sitemap，必须增加独立的 `spriteSeoRegistry / sitemapEntries` 数据源。
3. **当前 i18n 是 en + zh-CN 且 `/zh` 会进入 public route registry**：Phase A 必须先切成英文唯一 production locale；ES / PT-BR / DE / FR 等英文稳定后再逐步启用。
4. **当前 Header Link 类型只支持 `home/workflow/tools/guides/pricing`**：无法表达 Tracker / Checklist / Sprites / Rarity / Variants / Locations，必须做产品级 Navigation refactor。
5. **现有 Playwright 首页门禁强绑定 ShipLean Generic Tool Landing selectors**：不能为了过测试把 Sprite Tracker 硬塞成通用 ToolLanding；必须把 active-home browser contract 改成 FN Sprite Hub 的真实 UX contract。
6. **Legal Profile 必须声明真实的 Collection localStorage 与第三方服务**：`pnpm legal:check` 验证这些产品事实，不维护法律审阅状态机。
7. **Wrangler worker 名仍是 `shiplean`**：发布前必须改为 `fn-sprite-hub`。
8. **`VITE_SITE_URL` 缺失时会 fallback 到 `https://shiplean.dev`**：这是 Canonical 高风险项，必须增加 production hard-fail。
9. **当前 Canonical helper 只输出 canonical，不会自动把 `/checklist/` 重定向到 `/checklist`**：需要明确的 trailing-slash redirect 行为与测试。
10. **Root 已经全站输出 WebSite JSON-LD**：首页不能再重复输出第二份 WebSite；页面只补 WebApplication / FAQ 等页面级 Schema。
11. **当前 CSP 适合本地图片与 GA4 基础能力，但不允许完整 AdSense / CMP 资源**：广告开启时必须用受控 CSP 扩展，不提前放宽。
12. **现有 Tool SEO Brief pageType 只有 tool / guide / category**：Sprite entity/database 页面不要强行塞进错误类型；首轮 Brief 只登记核心 owner pages，或有意识扩展类型后再加入实体页。

---

## 0.2 v1.2 SEO-first 专项复审摘要

本轮只审查：**页面是否做多、搜索意图是否重叠、哪些页面值得首发 index、首页与 Checklist 是否互相蚕食、URL / Canonical / 参数状态是否足够严格。**

修订结论：

1. 首页与 `/checklist` 必须进一步拆分意图；首页 Title 不再同时强打 `checklist`。
2. `/locations` 与 `/guides/how-to-find-sprites` 搜索意图高度重叠，首发合并为一个 `/locations` 页面。
3. `Gold / Cheat Master / Loot Hacker` 暂不首发拆成独立 URL，先由 `/variants` 承接；GSC 出现独立 query 后再拆。
4. `/seasons` 与 Current Season 独立页不进入首发索引集；Past Season archive 等到有真实归档价值时再上线。
5. `sprite-chest-locations` 保持 P1 条件页，不进入首发 sitemap。
6. 首批英文页面从“目标 27 页”调整为 **最多约 25 个 indexable URL**，并由 Indexability Gate 决定实际数量。
7. 新增 Cannibalization Matrix、Title / Meta 模板、Canonical/Trailing Slash 规范、Filter/Share 参数索引规则、Internal Linking 规范。
8. 新增 `new-sprites` 的 Fresh Content 要求：它必须是 patch changelog / release log，不得与 `/sprites` 仅换标题。
9. `rarest-sprites` 必须标注 ranking methodology；不可把 datamined / estimated rate 当官方值。
10. 多语言继续延后到英文 URL 与 query 模型稳定后，不参与第一波收录规模扩张。

## 0.1 v1.1 复审修订摘要

本轮复审发现并修正以下关键问题：

1. **Collection / Mastery 粒度修正**：Owned 与 Mastered 应针对每个可收集 Entry（Base / Gold / Cheat Master / Loot Hacker 等），不能用 `masteredSpriteIds` 按 family 粗略记录。
2. **数据模型重构**：将 `SpriteRecord + variants` 改为 `SpriteFamily + SpriteEntry`，避免“Family、Variant、可收集条目”概念混淆。
3. **计数全部派生**：Current Season 的 family 数、released entry 数、Owned / Mastered denominator 均由数据计算，不在 UI 或 SEO 文案中硬编码。
4. **移除 P0 冲突**：`sprite-chest-locations` 不再同时出现在 P0 SEO 首发与 P1 功能列表；默认移至 P1，除非发布前 SERP 与游戏状态重新验证。
5. **增加 Indexability Gate**：Sprite Detail 与多语言页面没有足够独立价值时不得机械 index。
6. **增加数据来源层级与更新 SOP**：避免复制竞品文案，并明确 live-service 游戏的 patch 更新流程。
7. **增加 Ads Consent Gate**：AdSense 上线前必须完成 CMP / consent 方案；Collection localStorage 与广告追踪 storage 分离。
8. **后端表述修正**：V1 为“无状态型业务后端 / 无数据库”，但允许 ShipLean / TanStack Start 的 Cloudflare SSR/edge runtime。
9. **增加 Freshness SLA**：当前赛季数据需在重要 patch 后重新核验，并设置 stale-data release gate。


---

# 1. 项目定义

## 1.1 一句话定位

> **FN Sprite Hub 是一个免费、无需登录的 Fortnite Sprite Tracker 与 Checklist，帮助玩家查看当前赛季 Sprite、记录 Owned / Missing / Mastered 状态，并浏览 Sprite 图鉴、Variant、Rarity、Location 与相关攻略。**

## 1.2 商业模式

V1 明确采用：

> **Free Tool + SEO + Display Ads**

不做：

- 付费订阅
- 用户账户
- 云同步
- Trading Marketplace
- Reputation
- Chat / DM
- Friends
- Leaderboard
- 社区 Feed
- 用户上传内容
- 付费 API

V1 商业公式：

> **Search Demand × Ranking × Pageviews / Session × Ads RPM**

而不是 SaaS 指标。

---

# 2. 核心开发原则

## 2.1 SEO-first

优先级：

1. 选词与搜索意图
2. 可索引页面结构
3. 数据 freshness
4. 核心 Tracker UX
5. UI 完成度
6. 非核心产品功能

目标质量：

- SEO：90+
- Tracker UX：85+
- 核心视觉：80+
- 其他内容页：70–80

## 2.2 工具站而非产品化社区

任何新增功能进入开发前必须至少满足一项：

- 带来新的可索引搜索页面
- 提升 Pageviews
- 提升回访
- 提升分享传播
- 明显减少 Tracker 操作成本

否则默认不开发。

## 2.3 Current Season First

默认所有核心交互围绕 **Current Season**。历史赛季必须独立归档，不允许把 Current + Legacy 混成一个默认 completion denominator。

---

# 3. 当前仓库基线

当前 `main` 已完成 ShipLean 初始化：

- 产品模式切换为 `tool`
- 品牌改为 `FN Sprite Hub`
- 移除主要 SaaS 登录 / Dashboard / Pricing runtime
- 已加入 Sprite 图片清单
- 已加入安全下载脚本
- `public/images/sprites/` 已有 16 张本地 WebP
- Cloudflare-first、SEO metadata、sitemap、hreflang、legal 模板、测试底座仍保留

但仍有以下 **P0 占位内容必须替换**：

1. 首页仍是 `Text Length Checker`
2. `toolSeoBrief.primaryKeyword` 仍是 `text length checker`
3. 首页 Metadata 仍是 Text Length Checker
4. i18n 目前是 `en + zh-CN`
5. Sprite manifest 混入 Demo 用户状态（`owned/status`）
6. `showPreviewBanner` 仍需关闭
7. README / IMPLEMENTATION_PLAN 等仍残留 ShipLean 模板语义

---

# 4. 目标用户与核心任务

## 4.1 第一用户

Fortnite 当前赛季正在收集 Sprite 的玩家。

主要场景：

- Google 搜索 `fortnite sprite tracker`
- Google 搜索 `fortnite sprite checklist`
- 想查看当前赛季全部 Sprite
- 想知道自己还缺哪些 Variant
- 想确认某 Sprite 的 rarity / ability / location
- 想把收藏进度分享至 Discord / Reddit

## 4.2 核心任务流

### 新用户

```text
Google
→ 首页
→ 确认 Current Season / Patch / Updated
→ 浏览 Sprite Gallery
→ 勾选 Owned
→ 查看 Missing
→ localStorage 自动保存
```

### 回访用户

```text
Direct / Bookmark
→ 首页
→ Collection Progress
→ Missing
→ 更新进度
```

### SEO 长尾用户

```text
Google
→ /sprites/[slug]/
→ 查看 Sprite 信息
→ View in Tracker
→ 更新 Collection
→ 浏览 Related Sprites / Variants / Locations
```

---

# 5. V1 功能范围

## 5.1 P0 — 必须上线

### Tracker

- Current Season
- Search
- All / Missing / Owned / Mastered
- Rarity Filter
- Variant Filter
- Sort
- Collection Progress
- Mastery Progress
- Sprite Family Gallery
- Sprite Detail Drawer
- localStorage 自动保存
- Reset Collection
- Responsive Mobile UX

### Database / SEO

- All Sprites
- Sprite Detail
- Rarity
- Variants
- Locations
- New Sprites
- Rarest Sprites
- Checklist
- Current Season archive metadata
- FAQ
- Updated / Patch / Season freshness UI

### Technical

- Canonical
- hreflang
- sitemap
- robots
- structured data
- legal pages
- analytics hooks
- static WebP
- Cloudflare deployment

## 5.2 P1 — V1.1

- Gallery / Matrix 双视图
- Export Collection Image
- Copy for Discord
- Backup JSON
- Restore JSON
- Share Collection via encoded URL
- Past Seasons
- Printable Checklist
- Sprite Chest Locations（仅在发布前确认该机制仍符合当前游戏状态 / 搜索意图时上线）
- 更多 guide 页

## 5.3 P2 — 有流量后评估

- Short share links
- Push notifications
- PWA enhancements
- Public collection pages
- Discord Bot

---

# 6. 明确不做

V1 不实现：

```text
Auth
Google Login
Discord Login
Epic Login
Cloud Sync
Trading
Trader Matching
Reputation
Reviews
Scam Reports
Chat
DM
Friends
Leaderboard
Live Presence
Subscription
Stripe / Dodo / Creem
User-generated content
Backend account DB
```

原因：高产品复杂度 + 高运营负担 + 低 SEO 增益，不符合 Ads-only 工具站路线。

---

# 7. SEO 关键词架构

## 7.1 首页

**Primary Keyword**

> `fortnite sprite tracker`

**Secondary**

- fortnite sprites tracker
- sprite tracker fortnite
- fortnite sprite checklist
- fortnite sprite collection tracker
- fortnite sprites 2026

**SEO title input（传给 ShipLean `pageHead`）**

> `Fortnite Sprite Tracker 2026`

**最终浏览器 Title（由 ShipLean 自动追加品牌）**

> `Fortnite Sprite Tracker 2026 · FN Sprite Hub`

**H1**

> `Fortnite Sprite Tracker 2026`

**URL**

> `/`

年份只进入 Title / H1 / Copy，不进入 URL。

## 7.2 页面与主关键词映射（v1.2）

| URL | Primary Keyword | Search Intent | 首发 |
|---|---|---|---|
| `/` | fortnite sprite tracker | Interactive tracker | P0 |
| `/checklist` | fortnite sprite checklist | Fast marking / complete checklist | P0 |
| `/sprites` | all fortnite sprites | Browse complete Sprite database | P0 |
| `/sprites/[slug]` | [sprite name] sprite fortnite / how to get [sprite] | Entity + how-to | P0，逐页过 Gate |
| `/variants` | fortnite sprite variants | Variant definitions + current availability | P0 |
| `/rarity` | fortnite sprite rarity | Rarity tiers + mechanics | P0 |
| `/locations` | fortnite sprite locations / how to find sprites in fortnite | Current acquisition methods + location guidance | P0，需数据可验证 |
| `/rarest-sprites` | rarest sprite in fortnite | Current ranking / comparison | P0，需 methodology |
| `/new-sprites` | new fortnite sprites | Patch/release changelog | P0 |
| `/guides/how-to-master-sprites` | how to master sprites fortnite | Mastery mechanic | P0 |
| `/sprite-chest-locations` | fortnite sprite chest locations | Legacy / mechanic-specific | P1 条件页 |
| `/seasons` | fortnite sprite seasons | Archive navigation | P1 |
| `/seasons/[season]` | fortnite sprites [season] | Historical archive | P1 |

### 本轮合并 / 延后

- **删除首发** `/guides/how-to-find-sprites`：与 `/locations` 高度重叠，合并到 `/locations`。
- **删除首发** `/guides/how-to-get-gold-sprites`：先由 `/variants#gold` 承接。
- `Gold / Cheat Master / Loot Hacker` 不在 V1 首发机械拆页；只有出现独立 impressions / query 与足够内容后再建立 `/variants/[finish]`。
- Current Season 不单独再建 `/seasons/current`，避免与 `/`、`/sprites` 重复。
- `/sprites` 与 `sprite list` 保持同一 URL，不建立 `/sprite-list`。

## 7.2.1 Homepage vs Checklist 防蚕食规则

### `/` — Tracker

**SEO title input（传给 ShipLean `pageHead`）**

> `Fortnite Sprite Tracker 2026`

**最终浏览器 Title（由 ShipLean 自动追加品牌）**

> `Fortnite Sprite Tracker 2026 · FN Sprite Hub`

**H1**

> `Fortnite Sprite Tracker 2026`

页面主体：

- Collection progress
- Search / filter
- Visual Gallery
- Owned / Missing / Mastered
- Current Season freshness
- Tracker UX

可以在正文自然提到 “checklist”，但：

- Title 不以 Checklist 为并列主词
- H1 不出现 Checklist
- 不复制 `/checklist` 的完整说明段落

### `/checklist` — Checklist

**Title**

> `Fortnite Sprite Checklist 2026`（raw title；最终自动追加 `· FN Sprite Hub`）

**H1**

> `Fortnite Sprite Checklist 2026`

页面主体：

- Fast marking
- Compact / matrix layout
- Complete released entry list
- Printable / export（启用时）
- Checklist-specific FAQ

这样让 Google 明确理解：

> `/` = Tracker
> `/checklist` = Checklist

## 7.3 Indexability Gate

“能生成 URL”不等于“应该 index”。

### Sprite Detail 可 index 条件

一个 `/sprites/[slug]/` 至少应包含大部分以下独立价值：

- 唯一 Sprite name / rarity / ability
- Current / introduced season
- 实际 released entries
- 原创 How to Get
- Where to Find 或明确说明当前获取机制
- 独立图片 / artwork
- Related Sprites
- 真实 FAQ 或玩家常见问题

如果页面只有：

> 图片 + 名称 + rarity + 2 句模板文字

则默认：

- 暂不生成 indexable page，或
- `noindex`（当前 ShipLean helper 默认输出 `noindex,nofollow`）直到内容补齐；更推荐在内容未 ready 时根本不进入 sitemap / detail registry。

### Category / Locale 页面

同样必须通过：

- 独立搜索意图
- 非机械替换文案
- 有实际数据 / 工具价值
- Meta 与 H1 与 query 对齐

禁止为了 URL 数量批量制造 thin pages。

### Detail Page Minimum Evidence Gate

`/sprites/[slug]` 首发 index 至少满足 **4/6**：

1. verified ability
2. verified current acquisition / location information
3. released Entry / Finish table
4. unique mastery / leveling notes
5. unique image / visual reference
6. 2+ meaningful related entities / internal links

并且必须满足：

- 不少于 2 个独立事实来源或 1 个高权威一手来源
- 正文不是模板句批量替换 name / rarity
- `lastVerifiedAt` 可追溯

未满足时可先存在于 Tracker Drawer，不必生成 indexable Detail URL。



---

## 7.4 Cannibalization Matrix

| Query / Intent | Owner URL | 不应竞争的页面 |
|---|---|---|
| fortnite sprite tracker | `/` | `/checklist`, `/sprites` |
| fortnite sprite checklist | `/checklist` | `/` |
| all fortnite sprites / sprite list | `/sprites` | `/checklist` |
| sprite variants | `/variants` | `/sprites` |
| sprite rarity | `/rarity` | `/rarest-sprites` |
| rarest sprite | `/rarest-sprites` | `/rarity` |
| sprite locations / how to find sprites | `/locations` | individual guides |
| new sprites | `/new-sprites` | `/sprites` |
| how to master sprites | `/guides/how-to-master-sprites` | `/checklist` |
| [name] sprite / how to get [name] | `/sprites/[slug]` | `/locations` |

规则：

- 同一 exact-intent 不建立两个 indexable landing pages。
- supporting page 可以内部链接到 owner URL，但不要重复 Exact H1。
- 页面重构时优先 301 合并，不保留多个近似版本。
- 每次新增页面前先填写 `Primary Query → Owner URL`。

---

# 8. 英文首发 Index Set

## 8.1 P0 固定页：9 个

1. `/`
2. `/checklist`
3. `/sprites`
4. `/variants`
5. `/rarity`
6. `/locations`
7. `/rarest-sprites`
8. `/new-sprites`
9. `/guides/how-to-master-sprites`

## 8.2 Sprite Detail：最多 16 个

当前 Season Family 可生成 `/sprites/[slug]`，但必须逐页通过 Indexability Gate。

因此：

> **首发 indexable URL 上限约 25 个，不设“必须凑满”的 KPI。**

如果只有 10 个 Detail 页达到 Gate：

> 首发就是 19 个 indexable URL。

这是正确行为，不是缺页。

## 8.3 P1 不进入首发 sitemap

- `/sprite-chest-locations`
- `/seasons`
- `/seasons/[season]`
- `/variants/gold`
- `/variants/cheat-master`
- `/variants/loot-hacker`
- 其他 variant / rarity 子页

它们只在以下条件满足后上线：

- SERP / GSC 有明确独立 query
- 与 parent 页面内容不会高度重复
- 有足够独立数据或工具价值

---


## 8.4 Title / Meta 模板（与 ShipLean `pageHead` 对齐）

**重要：以下均为传给 `pageHead()` 的 raw title，不包含品牌。**

ShipLean 当前行为：

```ts
const title =
  input.title === site.name
    ? site.name
    : `${input.title} · ${site.name}`
```

所以禁止写：

```text
Fortnite Sprite Tracker 2026 | FN Sprite Hub
```

再传入 `pageHead`，否则会变成双品牌。

| Page | Raw title input | Final rendered title |
|---|---|---|
| Tracker | `Fortnite Sprite Tracker 2026` | `Fortnite Sprite Tracker 2026 · FN Sprite Hub` |
| Checklist | `Fortnite Sprite Checklist 2026` | `Fortnite Sprite Checklist 2026 · FN Sprite Hub` |
| Sprites | `All Fortnite Sprites 2026` | `All Fortnite Sprites 2026 · FN Sprite Hub` |
| Variants | `Fortnite Sprite Variants 2026` | `Fortnite Sprite Variants 2026 · FN Sprite Hub` |
| Rarity | `Fortnite Sprite Rarity 2026` | `Fortnite Sprite Rarity 2026 · FN Sprite Hub` |
| Locations | `Fortnite Sprite Locations 2026` | `Fortnite Sprite Locations 2026 · FN Sprite Hub` |
| Rarest | `Rarest Fortnite Sprites 2026` | `Rarest Fortnite Sprites 2026 · FN Sprite Hub` |
| New | `New Fortnite Sprites 2026` | `New Fortnite Sprites 2026 · FN Sprite Hub` |
| Mastery | `How to Master Sprites in Fortnite 2026` | `How to Master Sprites in Fortnite 2026 · FN Sprite Hub` |
| Detail | `[Sprite Name] Sprite in Fortnite – How to Get & Variants` | `... · FN Sprite Hub` |

### Meta Description 原则

- 145–165 字符只是建议，不做硬门禁。
- 第一段优先回答 query。
- 包含 Current Season / Updated 信号时必须是真实数据。
- 不在每个 Detail 页机械使用完全相同 description。
- 不堆 `free / online / no signup`；只在 Tracker / Checklist 合理出现。

---


# 9. Freshness 规范

## 9.1 三层 freshness

### Year
`2026`
每年统一更新 Title / H1 / Meta / copy，URL 不变。

### Season / Patch
例如 Chapter 7 Season 4 / v42.10，游戏版本更新时修改。

### Last Updated
例如 `Updated September 7, 2026`，只在真实数据更新时修改。

禁止使用 `new Date()` 每天自动伪造更新时间。

## 9.2 统一数据版本

```ts
export const spriteReleaseMeta = {
  year: 2026,
  chapter: 7,
  season: 4,
  seasonName: 'Override',
  patch: 'v42.10',
  lastVerifiedAt: '2026-09-07',
}
```

所有页面引用同一数据源。

## 9.3 Freshness SLA

FN Sprite Hub 属于 live-service game tracker，数据 freshness 是产品能力，不是装饰文案。

要求：

- Epic / Fortnite 发生 Sprite 相关 patch 后，优先在 **24 小时内**完成数据复核。
- 无大型更新期间，Current Season 至少 **每 7 天**人工或半自动复核一次。
- `lastVerifiedAt` 必须代表真实核验时间。
- 页面可输出 `dateModified = lastVerifiedAt`。
- 若 Current Season 数据超过内部 freshness SLA，发布流程标记为 `STALE`，不得把页面描述成 “latest / current verified”。
- UI、Meta、Schema、Sitemap 使用相同 release metadata，不允许各自维护日期。

### 2026-09-07 复审快照

公开 tracker 数据源当前仍显示 Chapter 7 Season 4 有 **16 个 Sprite families、47 个 released collectible entries**；部分 Loot Hacker entries 仍标记为 unreleased。该数字只作为复审快照，代码必须通过 `releasedEntries.length` 派生，发布当天再次核验。


---

## 9.4 URL / Canonical 规范

### ShipLean 当前实现差异

当前 `normalizePath()` 只用于 route registry 对比，**不会产生 HTTP redirect**。

因此 V1 必须增加：

```text
/checklist/  → 308 /checklist
/sprites/    → 308 /sprites
```

推荐在 `src/start.ts` request middleware 中只对 HTML page pathname 做 trailing-slash canonicalization；不要误伤：

- `/`
- `/api/*`
- 静态 assets
- 带文件扩展名的资源

HTTPS 与 `www → apex` 优先在 Cloudflare Zone / Redirect Rules 层处理。

不强制把任意用户输入 path 全局 lower-case redirect；生产路由与内部链接只生成 lower-case ASCII slug，大小写错误 URL 可直接 404，避免危险的路径改写。



ShipLean / TanStack 路由统一使用：

> **无尾斜杠 canonical（root `/` 除外）**

例如：

```text
https://fnspritehub.com/checklist
https://fnspritehub.com/sprites/sonic
```

不要同时让以下两者返回独立 200：

```text
/checklist
/checklist/
```

要求：

- 非 canonical 版本 301 到 canonical。
- HTTP → HTTPS 301。
- `www` 与 apex 只保留一个 canonical host。
- 大小写 URL 统一小写。
- slug 使用 ASCII kebab-case。
- locale prefix 与 canonical host 规则一致。

## 9.5 Filter / Sort / Share 参数索引规则

Tracker 的以下状态默认不产生 indexable SEO URL：

```text
?status=missing
?rarity=mythic
?variant=gold
?sort=rarity
?search=sonic
```

实现优先：

- 客户端 state
- 或 URLSearchParams 仅用于 UX

SEO 要求：

- Canonical 回 owner page。
- 不进入 sitemap。
- 组合筛选状态不生成静态 landing。
- 站内导航不要大规模输出可爬的 filter 参数链接。

P1 Share Collection 建议：

- 优先使用 URL fragment，例如 `#collection=...`，避免成为 crawler URL。
- 如采用 `/share/[id]`，默认 `noindex,nofollow`，除非以后有明确公开 profile 产品策略。

---

# 10. 信息架构

```text
FN Sprite Hub
│
├── Tracker /
├── Checklist /checklist/
├── Sprites /sprites/
│   └── Sprite Detail /sprites/[slug]/
├── Rarity /rarity/
├── Variants /variants/
├── Locations /locations/
├── New Sprites /new-sprites/
├── Rarest Sprites /rarest-sprites/
├── Guides /guides/
└── Mastery Guide /guides/how-to-master-sprites
```

Header 控制在 6–7 个主项：

```text
Tracker
Checklist
Sprites
Variants
Rarity
Locations
Language
```

---

## 10.1 TanStack File Route 实现映射

Phase A 英文路由建议：

```text
src/routes/index.tsx                        → /
src/routes/checklist.tsx                    → /checklist
src/routes/sprites.index.tsx                → /sprites
src/routes/sprites.$slug.tsx                → /sprites/$slug
src/routes/variants.tsx                     → /variants
src/routes/rarity.tsx                       → /rarity
src/routes/locations.tsx                    → /locations
src/routes/rarest-sprites.tsx               → /rarest-sprites
src/routes/new-sprites.tsx                  → /new-sprites
src/routes/guides.how-to-master-sprites.tsx → /guides/how-to-master-sprites
```

`/sprites/$slug`：

- loader 根据 `slug` 查 `SpriteFamily`
- 不存在直接 `notFound()`
- head 使用 loaderData 生成 unique metadata
- 是否 indexable 读取 `spriteSeoRegistry`
- 不要在 route 文件里维护第二份 Sprite 数据

## 10.2 Public Route Registry 重构

当前 `src/i18n/routes.ts` 的 `PublicPageId` / `publicPageRoutes` 是静态枚举模型，只适合 ShipLean Starter 小页面。

FN Sprite Hub 要增加两个层：

```ts
staticPublicPageRoutes
spriteSeoRegistry
```

推荐：

```ts
type SpriteSeoRoute = {
  familyId: string
  slug: string
  path: string
  indexable: boolean
  lastModified: string
  localizedPaths?: Partial<Record<Locale, string>>
}
```

然后统一提供：

```ts
sitemapEntries()
localeAlternatesForPath()
resolveSeoRoute()
```

**不要把 16 个 Sprite slug 手写进 `PublicPageId` union。**

## 10.3 Sitemap 重构

当前 sitemap 只输出：

```xml
<url><loc>...</loc></url>
```

V1 建议增加：

```ts
type SitemapEntry = {
  path: string
  lastModified?: string
}
```

组合来源：

```text
indexable static owner routes
+
indexable Sprite Detail routes
+
未来启用后的 localized equivalents
```

输出 Current / Fresh 页面真实 `lastmod`。

要求：

- noindex URL 不进 sitemap
- filter / search / share state 不进 sitemap
- Detail 只有通过 Indexability Gate 才进 sitemap
- sitemap 与 canonical 使用同一 `site.url`

---

# 11. 首页结构

最终首屏：

```text
HEADER

Chapter 7 Season 4 · Current

Fortnite Sprite Tracker 2026

Track every Fortnite Sprite and variant.
Mark what you own, find what's missing,
and save your collection locally.

Updated Sep 7, 2026 · Patch v42.10
{familyCount} Sprite families · {releasedEntryCount} released entries

Collection {ownedEntryCount}/{releasedEntryCount}
Mastery {masteredEntryCount}/{releasedEntryCount}

Search...
All | Missing | Owned | Mastered
Rarity | Variant | Sort

CURRENT SEASON
Sprite Gallery...
```

要求：

- 1440×900 必须露出 Sprite Gallery
- 1920×1080 必须至少露出第一排核心卡片
- 不放 Next Hunt 于首屏
- 不使用 SaaS Landing CTA
- 工具必须明显高于 SEO 文本

## 11.1 首屏 SEO / UX 平衡

首页不是传统长 Landing Page。

首屏优先：

1. H1 + freshness
2. Progress
3. Search / status / filters
4. Gallery first row

SEO supporting copy 放在核心工具之后。

首页 supporting content 建议包含：

- What is a Fortnite Sprite Tracker?
- How collection tracking works
- Current Season summary
- Tracker vs in-game Sprite Garden（如有事实依据）
- FAQ

禁止为了关键词密度在 Hero 前堆长段文字。

## 11.4 不强行套用 ShipLean Generic ToolLanding

当前 `ToolLandingPage` 与 Playwright active-home contract 强制存在：

```text
data-tool-title
data-tool-description
data-tool-primary-region
data-tool-constraints
data-tool-value-signals
data-tool-completion
data-tool-primary-action
```

FN Sprite Hub 的核心 UX 并不是“输入 → 点击主按钮 → 输出”的单动作工具。

因此：

> **不要为了保住 Starter test selector 而把 Sprite Tracker 扭曲成 Generic ToolLanding。**

正确做法：

- `ProductHome` 继续作为入口组件可以保留。
- `ToolStarterHome / TextLengthChecker` 替换为 `SpriteTrackerHome`。
- Homepage 使用独立 Sprite components。
- 改写 active homepage Playwright contract。
- 通用 `ToolLandingPage` 单元测试可作为 ShipLean foundation 保留，只是不再约束产品首页。

新的 active-home browser selectors 建议：

```text
data-sprite-tracker-home
data-sprite-hero
data-sprite-progress
data-sprite-search
data-sprite-status-filter
data-sprite-gallery
data-sprite-card
```

1440×900 / 390×844 browser gate 继续保留。



## 11.2 `/new-sprites` 必须是 Changelog Intent

`/new-sprites` 不得只是 `/sprites` 按发布日期排序后的副本。

它必须包含：

- latest patch
- exact release date
- newly released entries
- newly announced but unreleased entries（明确标注）
- change history
- links to affected Sprite Detail / Variant sections

这是一个持续更新的 Fresh URL。

## 11.3 `/rarest-sprites` Methodology

必须区分：

- officially confirmed facts
- game-file / live-data values
- estimates
- acquisition difficulty

“Rarest” 排名必须注明依据与更新时间。

禁止：

- 把 leak 当 confirmed
- 把 estimate 写成 Epic official rate
- 把 unreleased entry 排成“当前可获得的 rarest”而不做说明



---

# 12. UI 视觉语言

## 12.1 方向

冻结为：

> **Soft Fantasy / Collectible**

禁止回到 SaaS Dashboard / Glassmorphism / AI Tool 风。

关键词：

- Whimsical
- Elemental
- Collectible
- Soft
- Airy
- Magical
- Game encyclopedia

## 12.2 色彩

```css
--bg: #F6F4EC;
--paper: #FCFBF6;
--ink: #25251F;
--muted: #706F67;
--moss: #7E9B6A;
--sky: #7FB3C5;
--ember: #D99769;
--star: #9C8AC5;
--gold: #C9AB60;
```

## 12.3 Hero

真实 Sprite 三角构图：

- 主角色最大、居中
- 辅角色左下
- 辅角色右上
- 不同尺寸 / 轻微旋转
- 无硬边框
- 轻量 aura / leaf / star / wave
- 每赛季替换当季 3 个代表 Sprite

## 12.4 Sprite Card

一级对象必须是 Sprite Family，不是 Variant。

```text
┌─────────────────┐
│      IMAGE      │
│          RARE   │
├─────────────────┤
│ Bush Sprite 3/4 │
│ Ability...      │
│ ● ● ● ○         │
└─────────────────┘
```

Variant 是二级对象：

```text
Bush
├ Normal
├ Gold
├ Cheat Master
└ Loot Hacker
```

---

# 13. Responsive UX

## Desktop
- Gallery：4–5 columns
- Matrix 可显示完整
- Sticky toolbar
- Detail 使用 side drawer

## Tablet
- 3 columns
- Filters 可横向折叠

## Mobile
- 2-column compact family cards
- Expanded family 为 1-column
- Matrix 不作为默认视图
- Filter controls 不超过两行
- Touch target ≥ 40px
- Drawer 使用 bottom sheet / full-height panel


# 14. Sprite 数据模型

## 14.1 核心术语冻结

必须区分三个概念：

- **Sprite Family**：例如 Bush、Sonic、Klombo。
- **Finish / Variant Kind**：例如 Normal、Gold、Cheat Master、Loot Hacker。
- **Collectible Entry**：玩家实际可以分别 Owned / Mastered 的一个条目，例如 `Gold Bush`。

Tracker 的 Owned / Mastered 粒度是 **Entry**，不是 Family。

## 14.2 静态游戏数据与用户状态彻底分离

禁止以下字段进入静态游戏数据：

```json
{
  "owned": 3,
  "status": "mastered"
}
```

这些属于用户本地 Collection。

## 14.3 推荐 schema

```ts
export type SpriteRarity =
  | 'Rare'
  | 'Epic'
  | 'Legendary'
  | 'Mythic'

export type SpriteFinishKind =
  | 'normal'
  | 'gold'
  | 'cheat-master'
  | 'loot-hacker'
  | 'galaxy'
  | 'gummy'
  | 'gem'
  | 'holofoil'
  | 'cube'
  | 'quack'

export type SpriteFamily = {
  id: string
  slug: string
  name: string
  rarity: SpriteRarity
  ability: string
  familyImage: string
  introducedSeasonId: string
  patchAdded: string
  locations?: string[]
  sourceRefs: string[]
  verifiedAt: string
}

export type SpriteEntry = {
  id: string
  familyId: string
  seasonId: string
  finish: SpriteFinishKind
  displayName: string
  image: string
  released: boolean
  releasedAt?: string
  patchAdded?: string
  rarityOverride?: SpriteRarity
  dropRate?: number
  verifiedAt: string
  sourceRefs: string[]
}
```

说明：

- `normal` 也视为一个 Collectible Entry。
- 是否属于 Current Season 通过 `entry.seasonId` 判断。
- Family 是否“当前可用”通过是否存在 current-season released entry 派生，不单独维护易过期的 `status: current`。
- `rarityOverride` 只在游戏数据确实需要时使用。
- Drop Rate 属于易变化数据；如果展示，应额外记录来源和更新时间，不能当永久常量。

## 14.4 Season

```ts
export type SpriteSeason = {
  id: string
  chapter: number
  season: number
  name?: string
  year: number
  current: boolean
  startedAt: string
  patch: string
  lastVerifiedAt: string
}
```

## 14.5 派生集合

```ts
const currentEntries = entries.filter(
  (entry) => entry.seasonId === currentSeason.id && entry.released,
)

const currentFamilyIds = new Set(currentEntries.map((entry) => entry.familyId))

const releasedEntryCount = currentEntries.length
const familyCount = currentFamilyIds.size
```

UI、SEO Copy、Progress denominator 必须从这些数据派生。

## 14.6 数据来源层级

按以下优先级维护事实：

1. **Epic / Fortnite 官方 patch notes、help、游戏内可验证信息**
2. **Fortnite.GG 等结构化 live data source 用于交叉核对**
3. 其他专业 tracker / 媒体只做 cross-check
4. Reddit / Discord / 社区信息只能作为线索，未经验证不得写成确定事实

内容要求：

- 不复制竞品 ability / guide 文案。
- 数据事实可以交叉验证，但最终说明文字必须原创撰写。
- `sourceRefs` 保存来源标识和核验依据，方便 patch 更新审计。

---


# 15. Collection 本地状态

## 15.1 localStorage key

```text
fn-sprite-hub:collection:v1
```

## 15.2 Schema

```ts
export type CollectionStateV1 = {
  schemaVersion: 1
  seasonId: string
  ownedEntryIds: string[]
  masteredEntryIds: string[]
  updatedAt: string
}
```

约束：

- `masteredEntryIds` 必须是 `ownedEntryIds` 的子集。
- Mastered 操作应自动确保该 Entry 同时为 Owned。
- 不持久化 `missing`、count、percentage 等派生状态。
- V1 不持久化服务器账户信息。

## 15.3 Migration

未来 schema 更新必须通过：

```ts
migrateCollectionState(raw)
```

允许 v1 → v2 迁移，不直接清空用户数据。

## 15.4 SSR / Hydration 安全

ShipLean / TanStack Start 可以存在 Cloudflare SSR/edge runtime，但服务器不知道浏览器 localStorage。

要求：

- SSR 不输出假 Demo Collection。
- Returning user 不先闪现 `0 / N` 再跳到真实进度。
- 使用固定尺寸 skeleton / neutral progress shell，mounted 后读取 localStorage。
- 首次访问 mounted 后初始化为空 Collection。
- Progress 区域必须固定最小尺寸以避免 CLS。

---


# 16. Tracker 状态计算

Derived selectors：

```ts
getCurrentReleasedEntries()
getCurrentFamilies()
getOwnedEntryIds()
getMasteredEntryIds()
getMissingEntryIds()
getOwnedCount()
getMasteredCount()
getCollectionPercentage()
getMasteryPercentage()
filterFamilies()
filterEntries()
sortFamilies()
```

Progress denominator：

```text
Collection = owned current released entries / current released entries
Mastery    = mastered current released entries / current released entries
```

不要把 Mastery denominator 固定为 `16 families`。

游戏内 Mastery 的事实定义：

> 一个可收集 Sprite Entry 在游戏中达到 Level 5 并完成提取后，才算 Mastered。

Tracker 只记录用户声明的状态，不声称通过 Epic 账户自动验证。

---


# 17. Gallery 与 Matrix

## Gallery

默认视图，适合：

- 新用户
- Mobile
- 图鉴浏览
- 视觉识别

## Matrix

P1，桌面高效模式：

| Sprite | Normal | Gold | Cheat Master | Loot Hacker |
|---|---|---|---|---|

要求：

- 共用数据
- 共用 Collection
- 切换不丢 Filter
- 切换不触发新 route
- Mobile 默认不展示 Matrix

---

# 18. Detail Drawer 与 SEO Detail Page

## Drawer

点击卡片：

- Image
- Name
- Rarity
- Ability
- Variants
- Owned state
- `View full Sprite details`

## Full Detail

`/sprites/[slug]/`

结构：

```text
Breadcrumb
Sprite Hero
Rarity / Patch / Season
Ability
Variants
How to Get
Where to Find
Collection state
Related Sprites
FAQ
```

SEO 使用独立 URL，UX 使用 Drawer，两者不冲突。

---

# 19. Checklist 页面

`/checklist/`

Primary：

> `fortnite sprite checklist`

Checklist 不做首页复制，重点：

- 极简矩阵
- Printable / Export
- Current Season
- 完整 Variant
- Completion %
- 快速勾选

意图区分：

```text
Tracker → visual collection management
Checklist → fast complete list / marking
```

---

## 19.1 Locations 页面边界

`/locations` 同时承接：

- `fortnite sprite locations`
- `how to find sprites in fortnite`

因此 V1 不再创建独立 `/guides/how-to-find-sprites`。

`/locations` 应围绕**当前赛季实际获取机制**组织，而不是假装每个 Sprite 都有固定坐标。

允许内容：

- 当前获取方式
- Cheat Code panel / chest / event / special condition 等已验证机制
- 某些 Sprite 的特定获取要求
- 动态位置说明
- 链接到 individual Sprite Detail

如果当前赛季不存在固定 Sprite Chest 地图，就不能沿用 Season 3 的固定 chest-location 文案。

---

# 20. 图片资产

## 20.1 当前状态

仓库已有 16 个 Current Season Sprite family 主图 WebP。

用途：

- Hero
- Gallery
- Detail

## 20.2 V1 目标

Current Season：

- 16 family images
- 已发布 Collectible Entry artwork（能合法取得时优先）
- released entries 按最新 patch 数据动态确认

若 Variant / Finish 独立 artwork 暂未通过素材许可 Gate：

- 不阻塞 V1 Tracker。
- 可使用 Family 主图 + Finish badge / label 表达 Entry。
- 等素材 cleared 后再逐步替换为独立 artwork。

因此 **数据完整性是 P0，所有 Variant 独立图片不是绝对 P0**。


**不要在代码中硬编码“永远 47”**，发布前按最新 patch 重新核验。

## 20.3 生产目录

推荐：

```text
public/images/sprites/
├── bush/
│   ├── normal.webp
│   ├── gold.webp
│   └── cheat-master.webp
├── sonic/
└── ...
```

## 20.4 格式

V1 统一 WebP。

建议：

- Family card：256–320px
- Detail：512px
- 若源文件本身足够小，可单个 512 WebP 复用

## 20.5 性能

- Hero 3 图可 preload
- 首屏第一排 eager / priority
- 其余 lazy
- 明确 width / height，避免 CLS
- 不 hotlink 第三方生产资源
- 不运行时调用第三方图片 API

## 20.6 Asset Source Gate

当前图片属于 prototype/testing source。

公开 Ads 发布前必须：

1. 审查 Epic Fan Content Policy
2. 审查图片具体来源许可
3. 确认广告支持 fan utility 是否符合条款
4. 替换未 cleared 的素材
5. Footer 使用适当 fan disclaimer

这是 **Release Hard Gate**。

---

# 21. 多语言

## 21.1 优先语言

商业优先：

1. EN
2. PT-BR
3. ES
4. DE
5. FR

第二阶段：

- JA
- IT

不优先：

- zh-CN
- hi

## 21.2 URL

```text
/               EN
/es/            Spanish
/pt-br/         Brazilian Portuguese
/de/            German
/fr/            French
```

## 21.3 当前仓库迁移：先英文唯一 Production Locale

当前 ShipLean：

```text
en
zh-CN
```

而且 `/zh` 当前属于真实 public route，并会被现有 sitemap registry 识别。

### Phase A 必须先处理

生产 `supportedLocales` 只保留：

```ts
en
```

同时：

- 删除或禁用 `/zh` public route
- `/zh` 不进 sitemap
- 不输出 zh-CN hreflang
- 清理 Text Length Checker 中文 SEO copy
- 更新 i18n route tests

### Phase B 再逐个增加

目标：

```ts
en
es
pt-BR
de
fr
```

不要在英文第一版直接一次加入 5 个 locale，否则现有 `shellMessages` / route wrapper / hreflang / sitemap shape tests 都需要同时完成，且会把开发范围放大。

## 21.4 Rollout

### Phase A
英文完整上线。

并满足：

- 首页 / checklist / sprites 三个核心 URL 已被 Google 正常抓取
- 至少获得一轮真实 GSC query
- 英文 title / intent owner 没有明显 cannibalization
- 数据维护流程稳定

之后才进入 Phase B。多语言不是首发收录数量 KPI。


### Phase B
每个 locale 首发 8 个核心页面：

- home
- checklist
- sprites
- rarity
- variants
- locations
- rarest
- new

然后根据 GSC impressions 再扩 Sprite Detail / Guides。

### Locale Launch Gate

每个新 locale 上线前至少完成：

- 对应语言 SERP 手工验证
- Primary keyword 的自然本地表达，而非逐字翻译
- Title / H1 / FAQ 的本地化 QA
- Fortnite 术语与当地玩家常用说法核对
- hreflang 双向完整
- 页面本体有与英文同等工具价值

未通过 Gate 的 locale 不进入 sitemap。


## 21.5 数据只维护一份

禁止：

```text
sprites-en.json
sprites-es.json
sprites-de.json
```

核心字段统一：

- id
- rarity
- variants
- images
- season
- patch

翻译层只处理：

- ability
- location copy
- UI
- FAQ
- meta
- article content

---

## 21.6 Internal Linking 规范

### Homepage

链接到：

- Checklist
- All Sprites
- Variants
- Rarity
- Locations
- New
- Rarest

### `/sprites`

每个 Family 链到：

- Detail（仅 indexable / ready）
- Tracker 对应过滤状态通过客户端 action，不制造 crawl URL

### Detail

必须链接：

- Tracker
- All Sprites
- Variants parent
- Rarity parent
- 2–4 个 related Sprites

### `/variants`

每个 finish 先使用 section anchor：

```text
/variants#gold
/variants#cheat-master
/variants#loot-hacker
```

只有出现独立 query 后才拆子 URL。

### Breadcrumb

除首页外的 indexable 内容页均输出真实可见 Breadcrumb + `BreadcrumbList`。

---

# 22. Structured Data

## Root ownership

当前 `__root.tsx` 已经为全站输出一份：

> `WebSite`

继续保留，**首页不要再重复输出第二份 WebSite**。

## Homepage

页面级建议：

- `WebApplication`
- FAQPage（仅真实可见 FAQ；不把其视为排名或 Rich Result 保证）

## Sprite Detail

- `WebPage`
- BreadcrumbList
- FAQPage（如有真实 FAQ）

## 其他内容页

- `WebPage`
- BreadcrumbList

不要滥用：

- Product
- AggregateRating
- Review

Schema 中的：

- `dateModified`
- season / version 描述
- URL

必须来自页面同一 release metadata / canonical source。

---


# 23. Ads 策略

V1 预留广告位，但不要求首日开启。

## 工具页

广告克制：

```text
Hero / Tracker
↓
Primary interaction
↓
Ad Slot
↓
Gallery continuation
```

禁止每几张 Sprite 卡插一个广告。

## 内容页

可布置：

- Hero 后
- 主内容中段
- Related content 前

页面职责：

> Tracker 留人 / 回访
> Database + Guide 提供 SEO Pageviews 与 Ads Inventory

## 23.1 AdSlot 技术要求

所有预留广告位使用统一 `AdSlot` 组件：

- 无广告时不制造巨大空白。
- 有广告时使用稳定的 reserved size，降低 CLS。
- Core Tracker controls 与 Sprite cards 之间不得插入干扰点击的 sticky / overlay ads。
- Ads 脚本不得阻塞核心 Tracker 首次交互。

## 23.2 Consent / CMP Gate

Collection localStorage 属于产品功能状态，与广告 / analytics storage 分离。

在启用 Google AdSense / GA4 前：

- 明确哪些 storage 属于 strictly necessary product state。
- 广告与非必要 analytics 根据适用地区等待 consent。
- 面向 EEA、UK、Switzerland 的 AdSense personalized ads 必须使用 **Google-certified CMP / TCF-compatible consent flow**。
- Privacy Policy、Cookie/Consent controls、Ads script 加载逻辑必须一致。
- 不得因为用户拒绝 Ads consent 而破坏 Tracker 的本地 Collection 功能。

CMP / Consent 未完成时，可以上线无广告版本，但不得把 Ads 视为 production-ready。

## 23.3 CSP 兼容性

当前 `src/start.ts` CSP 主要允许：

- self assets
- Google Tag Manager script
- Google Analytics connect

这对当前本地 Sprite 图片是合适的，也会主动阻止第三方 hotlink 图片。

启用 AdSense / CMP 时不得直接删除 CSP。

应该：

1. 建立可测试的 CSP source 列表。
2. 只加入实际使用的 Google Ads / CMP 域。
3. ads-disabled 环境继续保持紧 CSP。
4. 增加 browser smoke test，确认 CSP 无 console violation 且广告拒绝 consent 时 Tracker 不受影响。




---

# 24. Analytics

建议事件：

```text
tracker_filter_status
tracker_filter_rarity
tracker_filter_variant
sprite_search
sprite_mark_owned
sprite_mark_mastered
sprite_open_drawer
sprite_view_detail
view_matrix
export_collection
copy_discord
backup_collection
restore_collection
language_switch
```

不把用户具体 Collection 内容上传至 analytics。

---

# 25. 性能预算

目标：

- LCP ≤ 2.5s p75
- CLS ≤ 0.1
- INP ≤ 200ms p75

首屏建议：

- HTML + critical CSS + JS：≤ 300–400 KB compressed
- Hero images：尽量 ≤ 150 KB × 3
- First-row Sprite：≤ 300 KB total
- 首屏总传输尽量 `< 1 MB`

JS：

- Tracker filter 不引入重型状态库
- 优先 React state + small utilities
- 无必要不加 Zustand / Redux

---

# 26. Accessibility

必须：

- 所有 Sprite image 有有效 alt
- Filter keyboard accessible
- Drawer 可 ESC 关闭
- Drawer focus trap
- 状态不能只靠颜色
- Owned / Missing 有文字或 icon
- Mobile Button ≥ 40px
- Progress 有 accessible label
- `prefers-reduced-motion` 降低浮动动画

---

# 27. 推荐代码结构

```text
src/
├── components/
│   ├── sprites/
│   │   ├── sprite-card.tsx
│   │   ├── sprite-gallery.tsx
│   │   ├── sprite-matrix.tsx
│   │   ├── sprite-filters.tsx
│   │   ├── sprite-drawer.tsx
│   │   ├── collection-progress.tsx
│   │   ├── hero-sprite-cluster.tsx
│   │   └── variant-dots.tsx
│   └── ...
│
├── data/
│   ├── sprites.ts
│   ├── seasons.ts
│   ├── variants.ts
│   └── sprite-image-manifest.json
│
├── lib/
│   └── sprites/
│       ├── collection-storage.ts
│       ├── collection-migrations.ts
│       ├── selectors.ts
│       ├── filters.ts
│       ├── sort.ts
│       └── share.ts
│
├── modules/
│   └── sprite-seo-brief.ts
│
├── routes/
│   ├── index.tsx
│   ├── checklist.tsx
│   ├── sprites.index.tsx
│   ├── sprites.$slug.tsx
│   ├── rarity.tsx
│   ├── variants.tsx
│   ├── locations.tsx
│   ├── rarest-sprites.tsx
│   ├── new-sprites.tsx
│   └── guides.*
│
└── i18n/
```

---

# 28. ShipLean 迁移策略

## 保留

- TanStack Start
- Router
- SEO metadata helpers
- Canonical
- hreflang
- sitemap
- robots
- structured data foundation
- legal templates
- Cloudflare deployment
- Vitest
- Playwright
- Biome
- quality gates

## 替换

```text
TextLengthChecker
→ SpriteTrackerHome

toolSeoBrief
→ FN Sprite keyword brief

product-home-messages
→ Sprite locale copy

Starter UI
→ Soft Fantasy theme
```

## 基础设施必须同步改造

- `wrangler.jsonc.name`: `shiplean` → `fn-sprite-hub`
- `productConfig.starter.showPreviewBanner`: `false`
- Production `VITE_SITE_URL`: `https://fnspritehub.com`
- Production canonical fallback 禁止指向 `shiplean.dev`
- `src/start.ts`: trailing-slash redirect + 后续可控 CSP
- `src/i18n/routes.ts`: 支持 data-driven Sprite SEO registry
- `src/routes/sitemap[.]xml.ts`: 支持 `lastmod` 与 Sprite detail entries
- `src/lib/site-navigation.ts`: 改造成产品级导航
- `tests/browser-viewport.spec.ts`: active homepage 改成 Sprite Tracker contract
- i18n / SEO / navigation tests 与新 registry 同步

### Production Site URL Hard Fail

当前环境 parser 缺少 `VITE_SITE_URL` 时会 fallback 到：

```text
https://shiplean.dev
```

开发环境可以保留 fallback，但 production verify / deploy 必须断言：

```text
site.url === https://fnspritehub.com
```

或者至少：

- 非 localhost
- 非 `shiplean.dev`
- 非 `starter.invalid`
- HTTPS

否则 **fail build / fail release**，避免全站 Canonical 指向错误域名。


## 删除 / 归档

- Text Length Checker copy
- Starter-only docs
- unused SaaS copy
- stale reference routes（如果 release 不需要）
- zh-CN public SEO route


## 28.1 Site Navigation Compatibility

当前 ShipLean `HeaderLinkId` 只支持：

```text
home
workflow
tools
guides
pricing
```

而 `validateToolSiteNavigation()` 默认还要求 Header 必须包含 `tools`。

这与 FN Sprite Hub 目标 Header 不兼容。

### V1 推荐 refactor

将产品 Header link id 扩展为：

```ts
type HeaderLinkId =
  | 'tracker'
  | 'checklist'
  | 'sprites'
  | 'variants'
  | 'rarity'
  | 'locations'
```

Phase B 再加：

```text
guides
language switch
```

或者将导航系统重构为 data-driven custom links。

要求：

- 不保留 `/#tool` 这种 Starter anchor。
- `Tracker` 指向 `/`。
- Header 不出现 Pricing / Login / Dashboard CTA。
- 更新 `resolveHeaderLink` 与 `validateToolSiteNavigation`。
- 更新 site-navigation tests，不绕过 validator。

V1 Header：

```text
Tracker
Checklist
Sprites
Variants
Rarity
Locations
```

Language switch 只有 Phase B 有真实 alternate 时显示。

## 28.2 Tool SEO Brief Compatibility

当前 `ToolSeoPageType` 只有：

```text
tool
guide
category
```

所以 v1.3 规定：

- `toolSeoBrief.firstBatchPages` 先登记 **核心 owner pages**，不要求塞入所有 Sprite Detail。
- Tracker / Checklist → `tool`
- Sprites / Variants / Rarity → `category`
- Locations / Rarest / New / Mastery → `guide` 或 `category`，按实际内容选择
- Sprite Detail 的 Indexability 由 `spriteSeoRegistry` 管理

如果后续希望 Tool SEO Brief 覆盖 entity 页，再明确扩展：

```ts
ToolSeoPageType += 'entity' | 'database' | 'content'
```

不要用类型断言绕过现有 contract。

## 28.3 Legal Profile Compatibility

当前 `legalProfile`：

```text
templateKind: free-local-tool
browserStorage: collection state and analytics consent preference
```

Privacy 与 Terms 是普通、真实的静态页面。`legal-release.test.ts` 只检查法律配置中的必填产品事实与数据处理描述。

发布前必须：

- 更新 effective / lastUpdated
- 确认 operator / support email
- `browserStorage` 增加：
  - Sprite Collection localStorage
  - UI preference（如后续有）
  - consent preference
- Analytics / Ads 只在实际启用时进入 legal profile
- Privacy copy 明确 Collection 数据只保存在用户浏览器，不上传到服务器
- Epic fan disclaimer 不要只写在 Footer，也要在 About / Terms 适当位置保持一致

`pnpm deploy` 前必须通过现有 production legal gate，不允许删掉这个测试来“通过发布”。

# 29. Data Update / Maintenance SOP

这是 live-service 游戏工具，发布后维护流程属于产品的一部分。

每次 Fortnite Sprite 相关更新：

```text
Official patch / game change
→ Source review
→ Update season / family / entry data
→ Mark released / unreleased
→ Update images if cleared
→ Update patch + lastVerifiedAt
→ Run data validation
→ Run SEO / browser tests
→ Deploy
→ Spot-check GSC-indexable pages
```

必须检查：

- Current Season
- released entry count
- new / removed / unreleased entries
- rarity
- abilities
- acquisition / locations
- mastery rule changes
- variant / finish additions
- image paths
- internal links
- `dateModified`
- homepage freshness copy

数据变更和内容文案变更尽量在同一个 release 中完成，避免“UI 已显示新 patch，但详情仍是旧机制”。

---

# 30. 开发阶段

## Phase 0 — 文档与底座校准

- [ ] 本文档写入仓库
- [ ] README 改为 FN Sprite Hub
- [ ] DESIGN.md 改为 Soft Fantasy spec
- [ ] 关闭 preview banner
- [ ] 清理 starter SEO
- [ ] 清理 demo i18n
- [ ] asset license gate 文档化
- [ ] `wrangler.name` 改为 `fn-sprite-hub`
- [ ] English-only production locale
- [ ] Navigation contract 改成 Sprite Hub links
- [ ] `pageHead` raw-title 规则写测试，禁止 double brand
- [ ] production site URL hard-fail
- [ ] trailing slash redirect contract

- [ ] `VITE_SITE_URL=https://fnspritehub.com` 的 release 配置方案冻结

**Exit Gate**：仓库无 Text Length Checker 可索引语义。

## Phase 1 — Data Foundation

- [ ] `SpriteRecord`
- [ ] `SpriteVariant`
- [ ] `SpriteSeason`
- [ ] 移除 owned/status demo 字段
- [ ] Current Season Family + Entry 数据
- [ ] version / patch / verifiedAt
- [ ] image path localize
- [ ] data validation tests
- [ ] family / entry ID、slug、source、image path 唯一性与完整性检查

**Exit Gate**：静态游戏数据不含用户状态。

## Phase 2 — Collection Engine

- [ ] localStorage schema
- [ ] storage adapter
- [ ] SSR-safe hydration
- [ ] selectors
- [ ] reset
- [ ] migration
- [ ] unit tests

**Exit Gate**：刷新后 Collection 保留，首次访问为 0。

## Phase 3 — Homepage UI

- [ ] V5 Hero 三精灵构图
- [ ] Freshness
- [ ] Progress
- [ ] Search
- [ ] status filter
- [ ] rarity filter
- [ ] variant filter
- [ ] sort
- [ ] Gallery
- [ ] Detail Drawer
- [ ] mobile 2-column

**Exit Gate**：1440×900 首屏可看到实际 Sprite Gallery。

## Phase 4 — Tracker Interactions

- [ ] Mark Owned
- [ ] Mark Mastered
- [ ] Missing derived state
- [ ] card state
- [ ] drawer state
- [ ] progress live update
- [ ] keyboard interaction
- [ ] reduced motion

## Phase 5 — SEO Pages

- [ ] Checklist
- [ ] All Sprites
- [ ] Detail pages（逐页通过 Indexability Gate）
- [ ] Rarity
- [ ] Variants
- [ ] Locations
- [ ] Rarest
- [ ] New
- [ ] Guides
- [ ] internal links
- [ ] spriteSeoRegistry
- [ ] dynamic sitemap entries + lastmod
- [ ] dynamic detail head / canonical

## Phase 6 — P1 Sharing

- [ ] Gallery / Matrix
- [ ] Export image
- [ ] Copy Discord
- [ ] Backup
- [ ] Restore
- [ ] optional encoded share URL

## Phase 7 — i18n

- [ ] locale config
- [ ] ES
- [ ] PT-BR
- [ ] DE
- [ ] FR
- [ ] localized metadata
- [ ] hreflang
- [ ] sitemap
- [ ] no machine-translated thin pages

## Phase 8 — Release

- [ ] Production domain
- [ ] Analytics
- [ ] legal copy
- [ ] Epic disclaimer
- [ ] asset clearance
- [ ] Ads slots reserved
- [ ] GSC
- [ ] Bing
- [ ] sitemap submit
- [ ] CWV baseline
- [ ] production legal gate
- [ ] production site URL gate
- [ ] wrangler worker name / custom domain check
- [ ] trailing-slash redirect smoke

---

# 31. 测试策略

## Unit

- collection selectors
- filter
- sort
- migration
- percent calculation
- current / legacy separation
- locale paths
- SEO brief
- duplicate family / entry IDs
- released entries must reference valid family / season
- masteredEntryIds ⊆ ownedEntryIds
- no external production image URL
- freshness metadata consistency
- rendered SEO title does not double-append brand
- production site URL rejects shiplean.dev / localhost
- sitemap includes only gated Sprite detail routes
- sitemap lastmod matches verified data
- trailing slash page routes redirect

## Component

- SpriteCard
- Filters
- Drawer
- CollectionProgress

## Browser / Playwright

### Desktop 1440×900

- `[data-sprite-tracker-home]` visible
- Hero visible
- first Sprite Gallery row visible
- Search / status filter visible and usable
- localStorage persists
- drawer works
- no horizontal overflow
- no Starter Generic Tool selectors required

### Mobile 390×844

- 2-column cards
- no clipped name / filter
- touch actions
- drawer / bottom sheet
- scroll restoration

## SEO Acceptance

每个 indexable URL：

- unique title
- unique description
- self canonical
- correct hreflang
- one H1
- valid status 200
- sitemap present
- no starter copy
- no accidental noindex
- no duplicate canonical

- no competing exact-intent H1 across owner URLs
- no filter/search/share state in sitemap
- no trailing-slash duplicate 200
- all Detail pages in sitemap pass Indexability Gate
- all `new-sprites` metadata uses current patch data


---

# 32. Hard Gates

任何一项失败，不发布。

## G1 — Starter Contamination

公开页面不得出现：

- ShipLean starter marketing copy
- Text Length Checker
- Starter Product
- SaaS placeholder

## G2 — Data Integrity

Current Season / Patch / Sprite count 必须在发布当天重新核验。

## G3 — User State

首次访问不得出现 Demo collection。

## G4 — Asset / IP

未完成生产素材许可审查，不开启 Ads 正式发布。

## G5 — SEO

全量 sitemap URL：

> P0 / P1 SEO issues = 0

## G6 — Performance

核心页无严重 CLS / hydration error / JS crash。

## G7 — Mobile

390×844 可完整操作 Tracker。

## G8 — Ads Consent

如启用 AdSense / GA4，CMP、Privacy、consent-gated script loading 必须完成；否则以无广告模式发布。

## G9 — Indexability

所有 indexable Sprite Detail / locale pages 必须通过 Indexability Gate；thin pages 不得进入 sitemap。

## G10 — Freshness

当前赛季页面不得在数据已经超出内部 freshness SLA 时继续展示 “verified current / latest”。


---



## G11 — Cannibalization

发布前检查核心 owner query：

```text
tracker   → /
checklist → /checklist
all list  → /sprites
variants  → /variants
rarity    → /rarity
locations → /locations
```

Title / H1 / intro 不得让两个 URL 同时以同一 exact query 为主目标。

---


## G12 — ShipLean Runtime Compatibility

必须同时满足：

- `pnpm verify` 通过
- Production `VITE_SITE_URL` / Worker / Legal gates 通过
- Sprite Detail sitemap 由 registry 动态生成
- Active homepage Playwright contract 已改为真实 Tracker UX
- active-home browser test 已改成 Sprite Tracker contract
- 不是通过保留假 `data-tool-*` DOM 来骗过旧测试
- Navigation validator 已与真实 Header 对齐
- dynamic Sprite sitemap 已纳入测试

## G13 — Production Identity

发布构建中：

- worker name ≠ `shiplean`
- canonical host = `fnspritehub.com`
- 不存在 `shiplean.dev` canonical / OG URL
- preview banner 关闭
- `/zh` 不作为 Phase A indexable production route

## G14 — Legal Release

现有 production legal gate 必须真实通过；不得删除、skip 或 mock 掉 `legal-release.test.ts`。

# 33. Release Definition of Done

V1 完成必须同时满足：

- 首页承接 `fortnite sprite tracker`
- Title / H1 含 2026
- Current Season freshness 明确
- 真实 Sprite 图
- Collection localStorage（Entry-level Owned / Mastered）
- Owned / Missing / Mastered
- Search / Rarity / Variant
- Sprite Gallery
- Current-season family database（数量由数据派生）
- Current released collectible entry data
- Checklist
- Sprite details
- Rarity / Variants / Locations intent pages
- Rarest / New
- English SEO owner set + only Detail pages that pass Indexability Gate
- sitemap / canonical / URL normalization / hreflang 正确
- mobile QA
- legal / asset / consent gates
- `pnpm verify` 通过
- Production `VITE_SITE_URL` / Worker / Legal gates 通过
- Sprite Detail sitemap 由 registry 动态生成
- Active homepage Playwright contract 已改为真实 Tracker UX

---

# 34. 上线后 30 天策略

不立刻继续堆功能。

观察：

- GSC query
- impressions
- CTR
- page ranking
- country
- locale
- top landing pages
- filter usage
- return visits
- pageviews / session

优先扩：

> 已有 impressions 且排名 8–30 的 query。

优先拆页条件：

> parent URL 已拿到某个子 intent 的稳定 impressions，且该子 intent 能形成独立页面价值。

例如：

```text
/variants
  ↓ GSC 出现 fortnite gold sprites
  ↓ SERP 与 cheat master 明显不同
  ↓ 内容可独立
/variants/gold
```

不能因为导航看起来完整就提前批量拆 taxonomy。


而不是凭感觉新增社区功能。

---

# 35. 后端扩展判断

只有满足以下条件之一，才考虑后端：

- 月流量稳定 > 30K
- 用户明显要求跨设备同步
- 分享链接成为高频入口
- Trading 需求被真实数据验证
- Ads 收入足以覆盖开发 / 运维复杂度

否则继续纯客户端。

---

# 36. 最终冻结决策摘要

| 项目 | 冻结决策 |
|---|---|
| Brand | FN Sprite Hub |
| Domain | fnspritehub.com |
| Homepage Primary Keyword | fortnite sprite tracker |
| H1 | Fortnite Sprite Tracker 2026 |
| Raw homepage title | Fortnite Sprite Tracker 2026 |
| Rendered title | Fortnite Sprite Tracker 2026 · FN Sprite Hub |
| English initial index set | 9 fixed owner pages + up to 16 gated Sprite Details |
| Business | Free + Ads |
| Backend | 无状态型业务后端 / 无 DB；允许 ShipLean Cloudflare SSR/edge runtime |
| State | localStorage |
| Images | 本地 WebP / Cloudflare static assets |
| UI | Soft Fantasy / Collectible |
| Default UX | Current Season + Gallery |
| Secondary View | Matrix |
| Phase A locale | EN only |
| Phase B locales | PT-BR / ES / DE / FR |
| 明确不做 | Auth / Trading / Community / Subscription |

---

# 37. Codex 执行规则

开发时建议把下面内容直接作为 coding agent 的首要约束：

> Implement FN Sprite Hub according to this document. Treat it as the product source of truth. Keep ShipLean's SEO, routing, legal, test, and Cloudflare foundations, but replace the starter tool and starter SEO entirely. Do not add authentication, SaaS pricing, trading, community, database persistence, or account-state backend services. Keep user collection state browser-local; ShipLean SSR/edge rendering is allowed. Current-season freshness and one-query-one-owner SEO architecture take priority over feature breadth. Do not create new indexable URLs for filters, taxonomies, locales, or Sprite details unless they pass the documented Indexability and cannibalization gates. The visual language is Soft Fantasy / Collectible, not generic SaaS or glassmorphism. Every implementation phase must end with relevant tests and repository verification. Do not preserve obsolete ShipLean homepage selectors, navigation assumptions, zh-CN routes, or starter metadata merely to satisfy old tests; update those tests/contracts to match the real product. Use ShipLean pageHead with raw titles that exclude the brand, and add Sprite detail SEO routes through a data-driven registry rather than hard-coding slugs into PublicPageId.

---

**End of FN Sprite Hub V1.3 ShipLean-Reviewed Product & Development Design**
