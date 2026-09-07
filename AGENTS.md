# Agents Guide

本文档为在 WuWeBlog 上工作的 AI 编码助手提供必要信息。本项目是**微信小程序 +
云开发**的个人博客，无自建服务器、无构建步骤、无 npm 依赖（小程序端）。

## 环境前提

- **微信开发者工具**（macOS：`brew install --cask wechatwebdevtools`）
- CLI 位于 `/Applications/wechatwebdevtools.app/Contents/MacOS/cli`
- **必须在工具里开启「服务端口」**（设置 → 安全设置），否则所有 CLI 调用都会以
  `IDE service port disabled` 失败。这个开关只能在 GUI 里点，CLI 自助开启那条
  路径在无 TTY 环境下不可用（管道与伪 TTY 都试过，提示未出现即报错退出）。

```bash
CLI=/Applications/wechatwebdevtools.app/Contents/MacOS/cli
$CLI islogin                      # 验证端口已开且已登录
```

## 命令

云函数依赖只在本地调试时需要；部署走 `-r`（云端安装依赖），本地 `node_modules`
不会上传。

```bash
PROJ=/Volumes/AirGapDev/dev/WuWeBlog
ENV=cloud1-d5gy6021b6ac347c2

$CLI open --project $PROJ                          # 载入 IDE
$CLI cloud env list --project $PROJ                # 列云环境（缺 --project 会报 code 31）
$CLI cloud functions deploy --env $ENV --project $PROJ -r --names <fn>...
$CLI preview --project $PROJ --qr-format image --qr-output /tmp/qr.png
$CLI upload --project $PROJ -v <版本号> -d <描述>   # 传成后台「开发版本」
```

### CLI 做不到的事

- **提交审核 / 发布**：只能在 mp.weixin.qq.com 网页端操作，发布还需管理员扫码。
  `cli upload` 只把代码传成「开发版本」，不等于上线。
- **真机调试**（带断点与真机 console）：无对应 CLI 命令，只能在 IDE 里点按钮。
  `cli preview` 出的二维码可以在真机跑，但不带调试器。

### 真机联调走网络，不走 USB

USB 连线对小程序调试**无任何作用**。预览与真机调试都靠二维码 + 同一 Wi-Fi。

## 规范与标准

编码标准、日志要求、发布流程定义在中央贡献指南中。**必须严格遵守。**

👉 **[CONTRIBUTING.md](./CONTRIBUTING.md)**

### 给 Agent 的要点

- **部署是强制的**：改完云函数必须 `cloud functions deploy`。只提交不部署会让
  线上跑旧逻辑 —— 用户会（正确地）报告"改了没用"。纯前端改动则需 `upload`
  并走审核才算上线。纯文档/日志变更除外（须明确说明"无可部署内容"）。
- **发布序列**：`Audit → Doc-sync → Log → Deploy → Push`，一步不能少。
- **无文档漂移**：鉴权模型、集合结构、云函数增删必须在同一提交内同步
  `README.md` 与 `security-rules.json`。
- **安全优先**：**本仓库是公开的**。访问码、token 一类绝不进 git。

---

## 本项目特有的红线

### 1. 自定义组件的 property 不能叫 `id`

`id` 是小程序组件的内置属性。`properties: { id: String }` 在模拟器上侥幸能取到
值，**真机上恒为空**，点进详情页会变成"文章不存在"。

```html
<!-- 正确 -->
<article-card article-id="{{item._id}}" />

<!-- 错误 —— 真机上 this.data.id 拿不到 -->
<article-card id="{{item._id}}" />
```

property 用 `articleId`，wxml 侧写 `article-id`（自动转驼峰）。同理避开
`class` / `style` / `hidden` 等内置名。

### 2. 客户端不能直查文章详情

`articles` 集合的安全规则是 `doc.status == 'published'`，客户端 `doc().get()`
在真机上会被规则挡下。详情页必须走 `getArticleDetail` 云函数（云函数以管理员
权限运行，不受安全规则限制）。

```javascript
// 正确 —— utils/cloud.js
const res = await cloud.getArticleDetail(id)

// 错误 —— 模拟器可能过，真机被安全规则拦
const res = await db.collection('articles').doc(id).get()
```

### 3. 真机上 bindtap 可能触发两次

配合 `hover-class` 时，真机会重复触发 `bindtap`，导致 `navigateTo` 叠两层页面。
组件内需自行节流（见 `components/article-card/article-card.js`）。

### 4. 鉴权按 openid，不用共享 token

曾经的做法是 `verifyAdmin` 返回一个硬编码常量 `ADMIN_TOKEN`，5 个云函数各存一份
做字符串比对。问题是：token 永不过期、无法吊销（除非改 5 处代码重新部署），而且
常量随代码进了**公开仓库**。

现在验证通过即把调用者 openid 写入 `admins` 集合，各云函数校验
`cloud.getWXContext().OPENID`。openid 由微信侧注入，前端伪造不了；吊销登录态只需
删掉 `admins` 里对应记录。

```javascript
// 正确 —— 每个需鉴权的云函数
async function isAdmin() {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return false
  const res = await db.collection('admins').where({ openid: OPENID }).count()
  return res.total > 0
}

// 错误 —— 客户端传什么就信什么
if (event.token !== ADMIN_TOKEN) return { ok: false, msg: '无权限' }
```

`utils/auth.js` 里的本地标记**仅用于控制界面显示**，伪造它拿不到任何权限。

### 5. 访问码不进仓库

来源优先级：云函数环境变量 `ADMIN_CODE` > `cloudfunctions/verifyAdmin/config.local.json`。
两者都缺、或配置文件仍是示例占位值时，`verifyAdmin` 拒绝所有请求 —— **不存在
弱默认值**。`config.local.json` 已被 `.gitignore` 排除，但会随云函数部署上传。

---

## 云开发环境

| 项 | 值 |
|----|----|
| AppID | `wx5ec74ce2cdd1b697` |
| 云环境 ID | `cloud1-d5gy6021b6ac347c2` |
| 集合 | `articles` / `categories` / `admins` |
| 云函数 | 7 个，见 `cloudfunctions/` |

安全规则见 [security-rules.json](./security-rules.json)，需在云开发控制台逐集合手工配置。

---

## Agents Team（协同开发）

5 个角色，定义在 [`.claude/agents/`](./.claude/agents/)，按名字唤起：

```
用 architect 设计一下文章置顶功能
用 reviewer 审一遍当前 diff
用 deployer 把改动的云函数部署上去
```

| 角色 | 职责 |
|------|------|
| **Architect** | 架构设计、云函数职责划分、数据模型 |
| **Developer** | 功能实现 |
| **Tester** | 语法自检 + 真机验证 |
| **Reviewer** | 规范、安全、文档同步核验 |
| **Deployer** | 云函数部署、上传、发布 |

👉 **详见：[.agent/TEAM.md](./.agent/TEAM.md)**

---

## 文档索引

| 文档 | 内容 |
|------|------|
| [README.md](./README.md) | 功能与项目结构 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 设计取舍、数据模型、已知限制 |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 开发标准与发布流程 |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | 部署、回滚、排障 |
| [HANDBOOK.md](./HANDBOOK.md) | 照着做的操作清单 |
| [.agent/](./.agent/) | 协同开发角色说明 |
