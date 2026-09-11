# FN Sprite Hub：资料核查与证据边界

核查日期：2026-09-11。源码基线：`ee5e88c51e7be61334d7dab7c06a550ae3f6e574`。

## 本轮采用的官方资料

| 编号 | 来源 | 用途与范围 |
|---|---|---|
| E1 | [Epic v42.00 更新说明](https://communities.epicgames.com/thread/v42-00-fortnite-override-battle-royale-update-notes/L5R3/) | “A Whole New Generation of Sprites”“Cheat Codes”；Crown、Klombo 的能力和不同升级动作，通用 Cheat Code 机制。 |
| E2 | [Epic v42.10 更新说明](https://communities.epicgames.com/thread/v42-10-fortnite-override-battle-royale-update-notes/y3Ub/) | “New Sprites & Quality-Of-Life Improvements”“Gameplay, Environment, UI”；重复提取与收藏 XP、最大等级后的提取，以及 Crown 的 Cheat Master 解锁修复。 |
| E3 | [WHATWG Web Storage](https://html.spec.whatwg.org/multipage/webstorage.html) | 不假定 localStorage 本身提供跨窗口原子锁；访问与写入均可失败。 |
| E4 | [MDN Web Locks](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API) | 同源、协作客户端使用同一个锁名协调读改写；不是云同步。 |

E1 描述 Crown 通过获胜升级，Klombo 通过使用提供生命或护盾的消耗品升级。E2 补充重复提取可为收藏中的副本增加 XP；达到最大等级后仍需入局完成提取，并确认修复了 Crown 精通后未发放 Cheat Master 的问题。本轮没有把具体胜场数、消耗品数量或普遍适用的“Level 5”写成新规则。

页面将 E1 的对局规则与 E2 的收藏进度更新分开标注。资料之间的补丁范围不同，不能用 E1 证明所有后续版本或模式。代码中规则段与来源说明复用 `src/data/sprite-guidance.ts`，目录与素材继续复用既有数据源。

## 声明核查台账

| 声明类别 | 结论 | 本轮动作 |
|---|---|---|
| Crown 能力与特殊升级方式 | E1 支持核心描述 | 修正能力概述；详情增加具体规则与引用。 |
| Klombo 能力与特殊升级方式 | E1 支持核心描述 | 详情增加具体规则与引用。 |
| Crown Cheat Master 精通解锁 | E2 明确说明已修复发放问题 | 加入限定变体的获取说明，不扩大到所有其他变体。 |
| 重复提取／收藏 XP／最终提取 | E2 支持 | Mastery 指南不再只写三个空泛步骤。 |
| Cheat Codes 可释放 Sprite | E1 支持通用机制 | 明确为通用来源，不宣称必出某一家族。 |
| Crown／Klombo 固定位置与保底 Base／Gold 获取 | 两份来源不足以确认 | 两篇样板不保留泛泛“高地刷点”作为已核实结论；明确没有固定位置证据。 |
| 所有 Family 的高地／山区／夜晚出现提示 | 来源不足，仍需逐条核查 | 留在待核查清单；除两篇样板外未全面重写，正式发布前不可视为已复核。 |
| 16 家族／47 Entries 的完整发布状态 | 沿用 2026-09-08 目录快照，不属于本轮全量复核结论 | 不擅自增删条目；改为显式清单，新家族不能自动获得 Gold／CM。 |
| Mega Man 是否仍只有 Base | 需要明确当季逐 Entry 证据；E2 的泛化新变体措辞不足以单独确定清单 | 保持原目录，不把“没有列出”当成可靠的尚未发布证明。 |
| 其他 Family 的具体数值、升级缩放与刷新条件 | 两份官方说明不能覆盖所有细节 | 没有补写数字、概率或地图。 |
| 当前活动时间／Ranked 等模式可用性 | 历史说明不等于此刻排期与状态 | 本轮不新增实时活动或“所有模式适用”声明。 |

## 内容编辑状态

Crown／Klombo：已加入两篇样板，获取信息仍是部分支持，不宣称完整获取攻略。Mastery：已按 E1／E2 补强，相关页面与交互已通过 Chromium 自动化；人工阅读与设备验收仍是独立步骤。其余详情与辅助页面：保留现有结构，深度扩写与精确核验排入后续，不因已有两个来源 URL 就自动算作就绪。

`guidanceCheckedAt = 2026-09-11` 只表示本轮规则文档查阅日期。目录的 `currentDataVerifiedAt` 保持 2026-09-08；未自动刷新全站资料日期，未批量打开 `seoReady`。

Semrush 的关键词量、KD、竞争强弱、最佳页面分配均未填入估计值。样板选择是内容验证选择，不是搜索量排名。
