# Agents Team 工作流程图

## 完整开发流程

```
                        ┌─────────────┐
                        │   需求提出   │
                        └──────┬──────┘
                               ↓
                     ┌──────────────────┐
                     │   🏗️ Architect   │
                     │  方案 / 数据模型  │
                     │  云函数职责划分   │
                     └────────┬─────────┘
                              ↓
                     ┌──────────────────┐
                     │   💻 Developer   │
                     │   实现 + 自检     │
                     │  node --check    │
                     └────────┬─────────┘
                              ↓
                     ┌──────────────────┐
                     │    🧪 Tester     │
                     │  cli preview     │
                     │  ★ 真机实跑      │
                     └────────┬─────────┘
                              ↓
                       ┌──────┴──────┐
                    通过 │             │ 不通过
                        ↓             └──────→ 回 Developer
                     ┌──────────────────┐
                     │   🔍 Reviewer    │
                     │  规范 / 安全      │
                     │  文档同步核验     │
                     └────────┬─────────┘
                              ↓
                       ┌──────┴──────┐
                    通过 │             │ 不通过
                        ↓             └──────→ 回 Developer
                     ┌──────────────────┐
                     │   🚀 Deployer    │
                     │  Audit→Doc→Log   │
                     │  →Deploy→Push    │
                     └────────┬─────────┘
                              ↓
              ┌───────────────┴───────────────┐
              ↓                               ↓
      云函数改动                        小程序端改动
   deploy 即生效 ✅              upload → 提交审核 → 发布
                                （审核通过前不算上线）
```

## 质量审计流程

```
   ┌──────────────────────────────────────────┐
   │ 1. 语法                                   │
   │    node --check 全部 .js                  │
   │    json.load 全部 .json                   │
   ├──────────────────────────────────────────┤
   │ 2. 安全（仓库 PUBLIC，优先级最高）          │
   │    git diff --cached 新增行无密钥          │
   │    git check-ignore config.local.json ✓   │
   │    鉴权走 OPENID，非客户端传入字段          │
   │    云函数无全量 event 日志                 │
   ├──────────────────────────────────────────┤
   │ 3. 规范                                   │
   │    组件 property 非内置名                  │
   │    云调用走 utils/cloud.js                │
   │    云函数返回 { ok, ... }                 │
   ├──────────────────────────────────────────┤
   │ 4. 文档同步（对照 CONTRIBUTING §5 的表）    │
   │    ★ 目录树用 find 实测对齐，别靠眼看       │
   └──────────────────┬───────────────────────┘
                      ↓
              任一不符 = 审计未通过
              先修，再继续
```

## 命令速查表

```bash
CLI=/Applications/wechatwebdevtools.app/Contents/MacOS/cli
PROJ=/Volumes/AirGapDev/dev/WuWeBlog
ENV=cloud1-d5gy6021b6ac347c2
```

| 阶段 | 命令 |
|------|------|
| 前置检查 | `$CLI islogin` |
| 载入项目 | `$CLI open --project $PROJ` |
| 语法自检 | `node --check <file>` |
| 真机验证 | `$CLI preview --project $PROJ --qr-format image --qr-output /tmp/qr.png` |
| 部署云函数 | `$CLI cloud functions deploy --env $ENV --project $PROJ -r --names <fn>...` |
| 上传版本 | `$CLI upload --project $PROJ -v <版本> -d <描述>` |
| 提交审核 / 发布 | ❌ 无 CLI，只能 mp.weixin.qq.com |
| 真机调试（断点） | ❌ 无 CLI，只能 IDE 点按钮 |
| 开启服务端口 | ❌ 无 CLI，只能 GUI 设置 |
