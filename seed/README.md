# 初始数据

来源：[WuClass](https://class.a1.ar/spanish?tag=%E9%98%BF%E6%A0%B9%E5%BB%B7) 西语课堂中
「阿根廷」标签下的 10 篇文章（`WuClass/seed/spanish/spanish.json`）。

## 文件

| 文件 | 用途 |
|------|------|
| `articles.json` | 文章，人类可读（缩进 JSON），改动以此为准 |
| `categories.json` | 分类，同上 |
| `articles.import.jsonl` | 云开发控制台导入用（JSON Lines，一行一条） |
| `categories.import.jsonl` | 同上 |

`.import.jsonl` 由 `articles.json` / `categories.json` 生成，**不要手工改**。

## 转换要点

- 原文是 Markdown，目标是小程序 `<rich-text>`
- `<rich-text>` **不继承页面 WXSS**，所以全部样式内联在标签的 `style` 属性上
- 只用了 `rich-text` 支持的标签：`h2` / `p` / `ul` / `li` / `table` / `tr` / `th` /
  `td` / `blockquote` / `strong` / `br`
- `createTime` / `updateTime` 用 `{"$date": "ISO8601"}` —— 必须导入成**日期类型**，
  不能是字符串。`publish` 云函数写入的是真 `Date`，混合类型会让
  `orderBy('createTime','desc')` 把两类分组排序，新发的文章顺序会乱

## 导入步骤

云开发控制台 → 数据库：

1. `categories` 集合 → 先「清空」→ 导入 `categories.import.jsonl`，冲突模式 `insert`
2. `articles` 集合 → 先「清空」→ 导入 `articles.import.jsonl`，冲突模式 `insert`
3. 导入后**抽查一条**：`createTime` 的类型应显示为 `date` 而非 `string`

`admins` 集合不要动 —— 那是管理端的登录白名单。
