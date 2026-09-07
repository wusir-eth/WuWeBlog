# WuWeBlog 操作手册

> 这份文档是**照着做就能完成**的操作清单，不解释"为什么"——设计取舍在
> [ARCHITECTURE.md](./ARCHITECTURE.md)，规范在 [CONTRIBUTING.md](./CONTRIBUTING.md)，
> 部署细节在 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 0. 速查

先设两个变量，下面所有命令都用它们：

```bash
CLI=/Applications/wechatwebdevtools.app/Contents/MacOS/cli
PROJ=/Volumes/AirGapDev/dev/WuWeBlog
ENV=cloud1-d5gy6021b6ac347c2
```

| 我要… | 命令 |
|-------|------|
| 确认工具可用 | `$CLI islogin` |
| 载入项目 | `$CLI open --project $PROJ` |
| 部署某个云函数 | `$CLI cloud functions deploy --env $ENV --project $PROJ -r --names <fn>` |
| 出真机二维码 | `$CLI preview --project $PROJ --qr-format image --qr-output /tmp/qr.png` |
| 上传版本 | `$CLI upload --project $PROJ -v <版本> -d <描述>` |
| 语法自检 | 见 §3 |

**环境事实**（不是猜的，是配置文件里的真值）

| 项 | 值 |
|----|----|
| AppID | `wx5ec74ce2cdd1b697` |
| 云环境 ID | `cloud1-d5gy6021b6ac347c2` |
| 仓库位置 | `/Volumes/AirGapDev/dev/WuWeBlog`（**外置卷**，未挂载时一切命令都会失败） |
| 仓库可见性 | **PUBLIC** —— 密钥绝不能提交 |
| 开发者工具 | `/Applications/wechatwebdevtools.app`（`brew install --cask wechatwebdevtools`） |

---

## 1. ⚠️ 先开服务端口：不开的话所有 CLI 命令都失败

启动开发者工具 → **设置 → 安全设置 → 打开「服务端口」**。

这个开关**只能在 GUI 里点**。CLI 提示里说的"输 y 确认开启"在无 TTY 环境下不会
出现（管道和 `script` 伪 TTY 都试过，提示未出现就报错退出），别在这上面耗时间。

验证：

```bash
$CLI islogin
# 期望看到 {"login":true}
```

---

## 2. 真机联调（不用 USB）

★ **USB 线对小程序调试没有任何作用。** 预览和真机调试都走网络。

```bash
$CLI preview --project $PROJ --qr-format image --qr-output /tmp/qr.png
open /tmp/qr.png
```

手机微信「扫一扫」扫码即可运行。要求 Mac 与手机在**同一 Wi-Fi**。
预览码约 25 分钟失效，过期重新生成即可。

带断点和真机 console 的「真机调试」**没有 CLI 命令**，只能在 IDE 工具栏点按钮。

---

## 3. 提交前必过

```bash
cd $PROJ

# 语法
for f in cloudfunctions/*/index.js miniprogram/app.js miniprogram/utils/*.js \
         miniprogram/pages/*/*.js miniprogram/components/*/*.js; do
  node --check "$f" || echo "FAIL $f"
done
for f in *.json miniprogram/app.json cloudfunctions/verifyAdmin/config.example.json; do
  python3 -c "import json;json.load(open('$f'))" || echo "FAIL $f"
done

# 密钥没混进暂存区（注意：逐串 grep，别用 grep 不支持的前瞻语法）
git add -A
for pat in "123456" "wwb-admin-token" "adminCode"; do
  echo "$pat: $(git diff --cached | grep '^+' | grep -c -- "$pat")"
done
git check-ignore cloudfunctions/verifyAdmin/config.local.json   # 必须命中
```

然后按 [CONTRIBUTING.md §5](./CONTRIBUTING.md) 过文档同步表，写
`logs/YYYY-MM-DD.log`，再部署、再提交。

---

## 4. 在真机上验证（含踩过的坑）

改完这些地方，必须在真机上实跑，**模拟器过了不算**：

| 改了什么 | 真机上验什么 | 为什么模拟器不算 |
|----------|--------------|------------------|
| 详情页 / `getArticleDetail` | 列表点进任一文章能正常显示 | 模拟器不受数据库安全规则约束 |
| 自定义组件的 property | 点击后能拿到正确的 id | `id` 是内置属性，真机上恒为空 |
| 列表项点击 | 只跳一层页面，不叠两层 | 真机 `bindtap` 配 `hover-class` 会触发两次 |
| 管理端任一操作 | 登录后能发文、删文、改分类 | openid 只在真机的真实上下文里 |

---

## 5. 出问题时

| 症状 | 先看这里 |
|------|----------|
| CLI 报 `IDE service port disabled` | §1 |
| CLI 报 `缺失参数 'project / appid' (code 31)` | 命令漏了 `--project` |
| 登录报「服务端未配置访问码」 | [DEPLOYMENT.md](./DEPLOYMENT.md)「配置访问码」 |
| 登录成功但操作全「无权限」 | `admins` 集合里没你的 openid，重新验证一次 |
| 详情页「文章不存在或已下架」 | `getArticleDetail` 没部署 |
| 列表页空白 | 安全规则没配，见 `security-rules.json` |
| 改了云函数没生效 | 忘了 deploy |

云函数日志：云开发控制台 → 云函数 → 对应函数 → 日志。

---

## 6. 写文章

底部 tabBar 「我的」→「博主入口」→ 输入访问码 → 验证 →「进入管理端」。

验证通过后登录态存在本地，下次直接进。管理端可以新建/编辑/删除文章、
存草稿、管理分类、上传封面（存到云存储 `cover/` 路径）。
