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
├── miniprogram/            # 小程序前端
│   ├── pages/
│   │   ├── index/          # 首页文章列表
│   │   ├── detail/         # 文章详情
│   │   ├── mine/           # 我的（验证入口）
│   │   └── admin/          # 管理端（发布/编辑/分类）
│   ├── utils/
│   │   ├── auth.js         # 登录态管理
│   │   └── cloud.js        # 云函数调用封装
│   └── app.js
├── cloudfunctions/         # 云函数
│   ├── verifyAdmin/        # 访问码校验
│   ├── publish/            # 发布/更新文章
│   ├── listArticles/       # 文章列表查询
│   ├── removeArticle/      # 删除文章
│   ├── manageCategory/     # 分类 CRUD
│   └── incViews/           # 阅读数自增
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

# 3. 修改 cloudfunctions/verifyAdmin/index.js 中的默认访问码
#    const ADMIN_CODE = '123456';  ← 改成你自己的码
```

### 部署云函数

在微信开发者工具中，逐个右键 `cloudfunctions/` 下的每个云函数目录，选择**「上传并部署：云端安装依赖」**。

### 发布上线

1. 开发者工具点击「上传」
2. 登录 [mp.weixin.qq.com](https://mp.weixin.qq.com) 提交审核
3. 审核通过后发布

## 云开发环境

- **数据库**：文章 (`articles`)、分类 (`categories`) 两个集合
- **云存储**：封面图片存储在 `cover/` 路径下
- **云函数**：6 个函数处理业务逻辑，访问码在服务端校验

## License

MIT
