# WuWeBlog 部署指南

## 状态

| 项 | 当前值 |
|----|--------|
| 云环境 | `cloud1-d5gy6021b6ac347c2` |
| 云函数 | 7 个，全部已部署 |
| 集合 | `articles` / `categories` / `admins` |
| 访问码 | **未配置** —— `config.local.json` 仍是占位值，管理端登录不可用 |
| 线上版本 | 见 mp.weixin.qq.com 版本管理 |

## 部署流程（Audit → Doc-sync → Log → Deploy → Push）

完整定义见 [CONTRIBUTING.md §5](./CONTRIBUTING.md)。**一步不能少**，
其中「部署」对小程序而言分两条独立的线：

| 改动位置 | 上线动作 | 是否需要审核 |
|----------|----------|--------------|
| `cloudfunctions/` | `cli cloud functions deploy` | 否，部署即生效 |
| `miniprogram/` | `cli upload` → 网页端提交审核 → 发布 | **是** |

> [!WARNING]
> **「上传」不等于「上线」。** `cli upload` 只产生后台的开发版本。
> 审核绑定的是**具体的代码版本快照** —— 之前通过的审核不覆盖新改的代码。

## 环境准备

```bash
brew install --cask wechatwebdevtools
```

装完首次启动需扫码登录，并在 **设置 → 安全设置 → 打开「服务端口」**。
不开这个开关，所有 CLI 调用都会报 `IDE service port disabled`，且该开关
**只能在 GUI 里点**（CLI 的自助开启在无 TTY 环境下不可用）。

验证：

```bash
/Applications/wechatwebdevtools.app/Contents/MacOS/cli islogin
# 期望：IDE server has started, listening on http://127.0.0.1:<port>
#       {"login":true}
```

## 配置访问码

二选一。两者都没配、或配置文件仍是占位值时，`verifyAdmin` 拒绝所有验证请求。

**A. 本地配置文件**（改完要重新部署 `verifyAdmin`）

```bash
cp cloudfunctions/verifyAdmin/config.example.json cloudfunctions/verifyAdmin/config.local.json
# 编辑 config.local.json，把 adminCode 改成你自己的码
```

该文件已被 `.gitignore` 排除，但**会随云函数上传**（部署后 `filesCount` 由 3 变 5
即为证据）。

**B. 云函数环境变量**（即时生效，无需重新部署）

云开发控制台 → 云函数 → `verifyAdmin` → 版本与配置 → 环境变量 → 新增 `ADMIN_CODE`。

环境变量优先级高于配置文件。

> [!IMPORTANT]
> 访问码是口令。**不要让 AI 助手代为设置、读取或转述**，由人自己填。

## 首次初始化

```bash
CLI=/Applications/wechatwebdevtools.app/Contents/MacOS/cli
PROJ=/Volumes/AirGapDev/dev/WuWeBlog
ENV=cloud1-d5gy6021b6ac347c2

# 1. 载入项目
$CLI open --project $PROJ

# 2. 部署全部云函数（-r = 云端安装依赖，本地 node_modules 不上传）
$CLI cloud functions deploy --env $ENV --project $PROJ -r \
  --names verifyAdmin publish listArticles removeArticle manageCategory getArticleDetail incViews
```

3. **在云开发控制台按 `security-rules.json` 逐集合配置安全规则。**
   这一步没有 CLI，必须手工。默认规则是"仅创建者可读写"，不配置的话读者
   看不到任何文章。
4. `articles` / `categories` 集合需手工创建；`admins` 由 `verifyAdmin` 首次
   验证成功时自动建（`db.createCollection`）。

## 日常部署

```bash
# 只部署改动过的函数
$CLI cloud functions deploy --env $ENV --project $PROJ -r --names publish listArticles

# 前端改动：出预览二维码，真机验证
$CLI preview --project $PROJ --qr-format image --qr-output /tmp/qr.png

# 验证通过后上传
$CLI upload --project $PROJ -v 1.0.1 -d "修复详情页真机加载"
```

上传后到 [mp.weixin.qq.com](https://mp.weixin.qq.com) → 版本管理 → 开发版本 →
提交审核；审核通过后在同页点发布（需管理员扫码确认）。

## 回滚

- **云函数**：云开发控制台 → 云函数 → 对应函数 → 版本管理，切回历史版本。
  或本地 `git checkout <旧提交> -- cloudfunctions/<fn>` 后重新 deploy。
- **小程序**：mp.weixin.qq.com → 版本管理 → 线上版本 → 「回退到上一版本」。
  只能回退到**曾经发布过**的版本。

## 排障

| 症状 | 原因 | 处理 |
|------|------|------|
| `IDE service port disabled` | 服务端口未开 | GUI 里开，见「环境准备」 |
| `缺失参数 'project / appid' (code 31)` | CLI 命令漏了 `--project` | 补上 |
| 管理端登录报「服务端未配置访问码」 | `ADMIN_CODE` 与 `config.local.json` 都没设，或仍是占位值 | 见「配置访问码」 |
| 登录后管理端操作全部「无权限」 | `admins` 里没有你的 openid | 重新在「我的」验证一次访问码 |
| 详情页真机报「文章不存在或已下架」 | `getArticleDetail` 未部署，或走了客户端直查 | 部署该函数；确认调用的是 `cloud.getArticleDetail` |
| 列表页空白但数据库有数据 | 安全规则未配置，或文章 `status` 不是 `published` | 按 `security-rules.json` 配规则 |
| 模拟器正常、真机异常 | 模拟器不受数据库安全规则约束 | 一切验证以真机为准 |
| 云函数改了没生效 | 只提交没部署 | `cloud functions deploy` |
