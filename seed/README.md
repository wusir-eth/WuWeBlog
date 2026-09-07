# 初始数据

来源：[WuClass](https://class.a1.ar/spanish?tag=%E9%98%BF%E6%A0%B9%E5%BB%B7) 西语课堂中
「阿根廷」标签下的 10 篇文章（`WuClass/seed/spanish/spanish.json`）。

标签统一为「阿根廷」，分类统一为「西语课堂」，原文其余标签（基础/语法/对话/文化/
教学/亲子/交流/足球）已丢弃。

## 文件

| 文件 | 用途 |
|------|------|
| `articles.json` | 10 篇文章，人类可读 |
| `categories.json` | 1 个分类 |
| `convert.py` | 从 WuClass 源重新生成上面两个文件 |
| `seedData-oneoff/` | 灌库用的一次性云函数（**默认不部署**） |

## ⚠️ 不要用控制台的「导入」

云开发控制台的数据库导入**无法产出日期类型**：

- 直接写 ISO 字符串 → `createTime` 落库为 `string`
- 写 MongoDB 扩展 JSON `{"$date": "..."}` → **导入直接失败**，报
  「导入数据格式不正确，请检查是否为JSON Lines格式」。原因是 CloudBase 的字段名
  不允许以 `$` 开头（实测于 2026-09-06）

这为什么要紧：`publish` 云函数写入的是真 `Date`。集合里一旦混了 `string` 和
`Date` 两种类型，`orderBy('createTime','desc')` 会先按 BSON 类型分组再排序 ——
表现是新发的文章和种子数据各排各的，列表顺序错乱。

## 正确的灌库方式

用 `seedData-oneoff/`，在云函数里 `new Date()` 转换，类型确定。

```bash
CLI=/Applications/wechatwebdevtools.app/Contents/MacOS/cli
PROJ=/Volumes/AirGapDev/dev/WuWeBlog
ENV=cloud1-d5gy6021b6ac347c2

# 1. 重新生成数据（会同时写出 seedData-oneoff/data.json）
python3 seed/convert.py

# 2. 临时放进 cloudfunctions/ 并部署
cp -r seed/seedData-oneoff cloudfunctions/seedData
$CLI cloud functions deploy --env $ENV --project $PROJ -r --names seedData
```

3. 云开发控制台 → 云函数 → `seedData` → 云端测试，参数填
   `{"confirm": "SEED-ARGENTINA"}` → 运行

   返回里的 `report.createTimeType` 会直接告诉你落库类型，应为 `Date ✓`。

4. **用完立刻删掉**：控制台删除 `seedData` 云函数（CLI 没有删除命令），
   并 `rm -rf cloudfunctions/seedData`。

函数是幂等的（`_id` 已存在则跳过），只插入不删除，不会碰 `admins`。

## 转换要点

- 原文是 Markdown，目标是小程序 `<rich-text>`
- `<rich-text>` **不继承页面 WXSS**，所以样式全部内联在标签的 `style` 属性上
- 只用 `rich-text` 支持的标签：`h2` / `p` / `ul` / `li` / `table` / `tr` / `th` /
  `td` / `blockquote` / `strong` / `br`
- 原文 10 篇的 `created_at` 有重复，按顺序错开 1 分钟以保证列表顺序稳定
