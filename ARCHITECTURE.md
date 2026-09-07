# WuWeBlog 架构设计文档

本文档记录**设计取舍与当前实现**。照着做的操作清单见 [HANDBOOK.md](./HANDBOOK.md)，
规范见 [CONTRIBUTING.md](./CONTRIBUTING.md)，部署见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 项目定位

手机上能写、能发、能读的个人博客。约束是**不维护服务器**：没有 VPS、没有域名备案、
没有 CI。因此选微信小程序 + 云开发 —— 云函数、云数据库、云存储都由平台托管，
代码库里没有任何运维脚本。

代价是完全绑定微信生态：不能在浏览器打开，不能被搜索引擎收录（除非配 sitemap 且
被微信索引），发版要过审核。这些都是接受的。

## 整体架构

```
    ┌──────────────────────────────────────────────┐
    │            小程序前端 miniprogram/            │
    │                                              │
    │   pages/          交互与 setData             │
    │      ↓                                       │
    │   utils/cloud.js  所有云调用的唯一出口        │
    └───────┬──────────────────────┬───────────────┘
            │                      │
    读路径（直连 DB）        写路径 + 受保护读（云函数）
            │                      │
            ↓                      ↓
    ┌───────────────┐    ┌─────────────────────────┐
    │  云数据库      │←───│      云函数 (7)          │
    │  安全规则拦截  │    │  管理员权限，不受规则限制  │
    └───────────────┘    └─────────────────────────┘
```

**两条路径的分工**是本项目最核心的设计决定：

- **列表页直连数据库**。`articles` 的读规则是 `doc.status == 'published'`，
  客户端 `where({status:'published'})` 天然满足，省一次云函数冷启动。
  列表用 `.field({content:false})` 不取正文，减小传输体积。
- **详情页必须走云函数**。同一条规则会让客户端 `doc(id).get()` 在真机上失败
  （见「已知限制」）。所以有了 `getArticleDetail`。
- **一切写操作走云函数**。两个集合的 `write` 规则恒为 `false`，客户端无法绕过。

## 运行环境

| 项 | 值 |
|----|----|
| AppID | `wx5ec74ce2cdd1b697` |
| 云环境 ID | `cloud1-d5gy6021b6ac347c2`（账号下唯一） |
| 基础库 | `project.config.json` 声明 3.0.0，本地调试用 3.17.0 |
| 前端依赖 | 无（`nodeModules: false`，不走 build-npm） |
| 云函数依赖 | 仅 `wx-server-sdk ~2.6.3`，部署时云端安装 |

## 数据模型

### `articles`

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string | 标题，必填 |
| `content` | string | 正文，富文本 HTML |
| `summary` | string | 摘要，为空时由 `publish` 从正文截前 60 字生成 |
| `categoryId` | string | 关联 `categories._id`，可空 |
| `tags` | string[] | 标签数组；查询时单值匹配即"包含" |
| `coverImage` | string | 云存储 fileID |
| `status` | string | `published` / `draft` |
| `views` | number | 阅读量，由 `incViews` 原子自增 |
| `createTime` / `updateTime` | Date | 服务端时间 |

### `categories`

`name`（string）、`order`（number，升序排列）。

### `admins`

`openid`（string）、`createTime`（Date）。由 `verifyAdmin` 写入，是管理端的唯一
权限来源。**客户端读写规则均为 `false`。**

## 云函数全表

| 函数 | 鉴权 | 职责 |
|------|------|------|
| `verifyAdmin` | 访问码 | 校验访问码，通过则登记调用者 openid |
| `publish` | openid | 新增 / 更新文章，自动生成摘要 |
| `listArticles` | openid | 管理端列表，含草稿，上限 100 条 |
| `removeArticle` | openid | 删除文章 |
| `manageCategory` | openid | 分类 list / add / update / delete |
| `getArticleDetail` | 无 | 读单篇文章，绕过安全规则 |
| `incViews` | 无 | 阅读量原子自增（`_.inc(1)`，防并发覆盖） |

后两个不鉴权是有意的：详情和阅读量本就对所有读者开放。`getArticleDetail`
目前**不过滤 `status`** —— 见「已知限制」。

## 鉴权设计

```
输入访问码 → verifyAdmin
                ├─ 环境变量 ADMIN_CODE，缺则读 config.local.json
                ├─ 两者都无 / 仍是占位值 → 拒绝（无弱默认值）
                └─ 匹配 → 把 getWXContext().OPENID 写入 admins
                             ↓
其余管理云函数 → 查 admins 是否含调用者 openid
```

**为什么不用 token。** 初版的做法是 `verifyAdmin` 返回硬编码常量
`ADMIN_TOKEN`，5 个云函数各存一份做字符串比对。三个问题：token 永不过期、
无法单独吊销（改 5 处代码重新部署才行）、而且常量随代码进了**公开仓库**。

openid 由微信侧在云函数上下文中注入，前端伪造不了；吊销登录态只需删 `admins`
里一行。代价是每个受保护函数多一次数据库查询，个人博客的量级下无所谓。

`utils/auth.js` 里的 `wwb_admin_logged` 标记**仅控制界面显示**。伪造它能看到
管理端界面，但所有云函数调用都会返回「无权限」—— 失败是关闭的。

## 安全设计

| 面 | 措施 |
|----|------|
| 数据库写 | `articles` / `categories` 的 `write` 规则恒 `false`，只有云函数能写 |
| 数据库读 | `articles` 限 `status == 'published'`；`admins` 完全禁止客户端访问 |
| 管理鉴权 | openid 白名单，不信任任何客户端传入的凭据字段 |
| 访问码 | 不进仓库；环境变量优先，其次 gitignore 的本地配置；无弱默认值 |
| 仓库公开 | 本仓库 PUBLIC，任何新增密钥必须同步 `.gitignore` |

## 已知限制

1. **`getArticleDetail` 不校验 `status`**。知道 `_id` 就能读到草稿。当前靠
   "草稿 ID 不外泄"兜底，不是真正的隔离。要收紧就在函数里加
   `if (res.data.status !== 'published') return { ok:false }`，但这会让管理端
   预览草稿也失效，需要同时加一条 openid 例外。
2. **`cloud.js` 仍导出 `getArticleById`**。这是客户端直连 `doc().get()` 的旧写法，
   真机上会被安全规则挡下。目前无任何调用方，属于遗留的陷阱函数。
3. **`verifyAdmin` 无失败次数限制**。访问码可以无限次尝试。个人博客量级下
   暂时接受，但这意味着访问码的强度就是唯一防线 —— 别用短数字。
4. **列表上限**。首页每页 10 条、管理端 `listArticles` 硬上限 100 条，
   都没有做游标翻页。文章数上百后需要改。
5. **`admins` 无角色区分**。集合里的任何 openid 都是完全管理员。
6. **隐私授权未主动处理，靠平台当前不强制兜着**。已在后台声明「采集用户隐私 →
   摄像头/相册」（因 `admin.js` 的 `wx.chooseMedia`），但 `app.json` 没有
   `__usePrivacyCheck__`，代码里也没有 `wx.requirePrivacyAuthorize` 流程。
   2026-09-06 真机实测：不弹授权框、选图正常，即当前基础库未强制检查。
   ★ 微信这套强制是分批推的，策略一旦收紧，封面上传会在**没有任何代码改动**
   的情况下开始失败，且不易联想到是平台变更。应主动开启 `__usePrivacyCheck__`
   并实现授权流程，把弹框时机变成自己可控的确定行为。
7. **控制台的数据库导入无法产出日期类型**。ISO 字符串会落成 `string`，
   MongoDB 扩展 JSON `{"$date": ...}` 则直接被拒（字段名不能以 `$` 开头）。
   而 `publish` 写入的是真 `Date` —— 混合类型会让 `orderBy('createTime','desc')`
   按 BSON 类型分组排序。所以批量灌库必须走云函数，见 `seed/README.md`。

## 历史

初版把访问码 `123456` 与 token `wwb-admin-token-2026` 硬编码在云函数里，
随 commit `3c395e8` 推到了公开仓库。2026-09-06 重构为 openid 鉴权后，这两个值
不再被任何代码接受，故未改写 git 历史（强推会打乱所有 clone，收益不抵代价）。
详见 `logs/2026-09-06.log`。
