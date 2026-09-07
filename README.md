# WuWeBlog - 无为博客

基于**微信小程序 + 云开发**的极简个人博客，支持手机端写作发布与浏览。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 微信小程序原生框架 (WXML / WXSS / JS) |
| 后端 | 微信云开发 (云函数 + 云数据库 + 云存储) |
| 鉴权 | 访问码 + 服务端 Token 校验 |

## 功能

### 读者端
- 文章列表浏览（支持分类、标签筛选）
- 文章详情页阅读
- 阅读量统计

### 管理端（访问码保护）
- 分类管理（增删改）
- 文章编辑器（标题 / 封面 / 标签 / 正文）
- 草稿 / 发布状态切换
- 删除文章

## 项目结构

```
WuWeBlog/
├── miniprogram/                # 小程序前端
│   ├── pages/
│   │   ├── index/              # 首页文章列表
│   │   ├── categories/         # 分类总览
│   │   ├── category/           # 单分类下的文章
│   │   ├── detail/             # 文章详情
│   │   ├── mine/               # 我的（博主入口）
│   │   └── admin/              # 管理端（发布/编辑/分类）
│   ├── components/
│   │   ├── article-card/       # 文章卡片
│   │   ├── category-bar/       # 分类横条
│   │   └── tag-list/           # 标签列表
│   ├── utils/
│   │   ├── auth.js             # 访问码校验与本地登录标记
│   │   ├── cloud.js            # 云调用统一出口
│   │   └── format.js           # 日期等格式化
│   ├── style/theme.wxss        # 主题变量
│   ├── app.js / app.json / app.wxss
├── cloudfunctions/             # 云函数（各自独立部署）
│   ├── verifyAdmin/            # 访问码校验 + openid 登记
│   │   ├── config.example.json #   访问码配置模板
│   │   └── config.local.json   #   实际访问码（gitignore，不进仓库）
│   ├── publish/                # 发布/更新文章
│   ├── listArticles/           # 管理端文章列表（含草稿）
│   ├── getArticleDetail/       # 文章详情（绕过安全规则）
│   ├── removeArticle/          # 删除文章
│   ├── manageCategory/         # 分类 CRUD
│   └── incViews/               # 阅读数自增
├── logs/                       # 开发日报（YYYY-MM-DD.log）
├── .agent/                     # 协同开发角色说明（人类可读）
├── .claude/agents/             # 可调用的 subagent 定义
├── AGENTS.md                   # AI 助手须知与平台红线
├── CONTRIBUTING.md             # 开发标准与发布流程
├── ARCHITECTURE.md             # 设计取舍与数据模型
├── DEPLOYMENT.md               # 部署、回滚与排障
├── HANDBOOK.md                 # 照着做的操作清单
├── project.config.json
├── security-rules.json
└── sitemap.json
```

## 快速开始

### 前置条件
1. [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 已安装
2. 注册微信小程序并开通**云开发**环境
3. 将 `project.config.json` 中的 `appid` 替换为自己的 AppID

### 本地运行

```bash
# 1. 克隆仓库
git clone https://github.com/wusir-eth/WuWeBlog.git
cd WuWeBlog

# 2. 用微信开发者工具打开项目根目录

# 3. 设置访问码（见下方「设置访问码」一节，不写在代码里）
```

### 设置访问码

访问码**不进仓库**。两种配置方式，任选其一：

**方式 A：本地配置文件**（改一次要重新部署 `verifyAdmin`）

```bash
cp cloudfunctions/verifyAdmin/config.example.json cloudfunctions/verifyAdmin/config.local.json
# 编辑 config.local.json，把 adminCode 改成你自己的码
```

`config.local.json` 已被 `.gitignore` 排除，不会提交，但会随云函数一起部署到云端。

**方式 B：云函数环境变量**（改完即时生效，无需重新部署）

云开发控制台 → 云函数 → `verifyAdmin` → 版本与配置 → 环境变量，新增 `ADMIN_CODE`。

环境变量优先级高于配置文件。两者都没配、或配置文件仍是示例占位值时，
`verifyAdmin` 拒绝所有验证请求 —— 不存在弱默认值。

### 鉴权机制

验证通过后，云端把你的 openid 记入 `admins` 集合。`publish` / `listArticles` /
`manageCategory` / `removeArticle` 都直接校验调用者 openid，不依赖任何共享密钥或
token —— openid 由微信侧注入，前端伪造不了。想吊销某个登录态，在 `admins` 集合里
删掉对应记录即可。

### 部署云函数

在微信开发者工具中，逐个右键 `cloudfunctions/` 下的每个云函数目录，选择**「上传并部署：云端安装依赖」**。

### 发布上线

1. 开发者工具点击「上传」
2. 登录 [mp.weixin.qq.com](https://mp.weixin.qq.com) 提交审核
3. 审核通过后发布

## 云开发环境

- **数据库**：文章 (`articles`)、分类 (`categories`)、管理员白名单 (`admins`) 三个集合
- **云存储**：封面图片存储在 `cover/` 路径下
- **云函数**：7 个函数处理业务逻辑，访问码在服务端校验，管理操作按 openid 判权

## License

MIT
