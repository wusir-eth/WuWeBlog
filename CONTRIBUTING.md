# Contributing to WuWeBlog

本文档定义人类贡献者与 AI 助手共同遵守的开发标准与工作流。规范体例继承自
[WuAWSMail](https://github.com/wusir-eth/WuAWSMail)，差异之处均为
Node.js 服务端 → 微信小程序云开发带来的必要调整。

## 1. 开发标准

### 代码风格

- 分号结尾（与现有代码一致）
- 单引号
- 2 空格缩进
- 行宽 100

### 命名约定

- 变量/函数：`camelCase`
- 常量：`UPPER_SNAKE_CASE`
- 页面/组件目录与文件同名，`kebab-case`（`article-card/article-card.js`）
- 云函数目录名 = 函数名，`camelCase`（`getArticleDetail`），与 `cli deploy --names`
  传入的名字必须一致
- 组件 property 用 `camelCase`，wxml 侧写 `kebab-case`；**不得使用内置属性名**
  （`id` / `class` / `style` / `hidden`），见 AGENTS.md §1

### 项目结构

- `miniprogram/` 前端，`cloudfunctions/` 云函数，两者由 `project.config.json` 的
  `miniprogramRoot` / `cloudfunctionRoot` 指定
- 云函数彼此独立部署，**无法共享模块** —— 鉴权这类逻辑只能在各函数内重复一小段，
  这是平台约束，不是可以消除的重复
- 小程序端不引入 npm 依赖（`nodeModules: false`），避免 `build-npm` 环节

## 2. 日志规范

所有开发进展必须记入日报文件。

- **路径**：`logs/YYYY-MM-DD.log`
- **时间戳**：`[HH:MM]` 必须来自执行操作时的**系统真实时间**（`date '+%H:%M'`），
  禁止估算或伪造
- **头部**：

  ```text
  ================================================================================
  日期: YYYY-MM-DD
  项目: WuWeBlog
  ================================================================================
  [HH:MM] 这次做了什么（一句话就够，长的写在下面）
  ```

- **正文写成叙事，不要写成动作清单。** 一条"改了 X"没有价值；"X 为什么会错、
  错的表象是什么、为什么当时没发现"才有。写法：

  - 分节用 `── 小标题 ─────`，重点用 `★` 标
  - **实测数字要留在日志里**（"包体 46.4 KB"、"7 个函数 success: true"），
    别写"经验证正确"
  - 每次事故末尾写一句**教训**
  - 结尾留 `── 验收 ──`：具体验过哪几条路径

## 3. 架构模式

### 分层

- **页面**（`miniprogram/pages/`）：只做交互与 setData，不直接碰 `wx.cloud`
- **封装层**（`miniprogram/utils/cloud.js`）：所有云调用的唯一出口
- **云函数**（`cloudfunctions/`）：鉴权 → 校验入参 → 操作数据库 → 返回
  `{ ok, ... }`。**统一返回结构**，不抛异常给前端

### 安全规则（强制）

- **本仓库是公开的**。访问码、token、密钥绝不进 git；新增密钥必须同步
  `.gitignore` 与 `config.example.json`
- 管理端鉴权**必须**校验 `cloud.getWXContext().OPENID`，**绝不**信任客户端传来的
  凭据字段
- 客户端**禁止**直接写数据库；`articles` / `categories` 的 `write` 规则恒为 `false`
- 云函数**不得**把 `event` 全量打进日志（曾经 `getArticleDetail` 这么做过），
  调试完必须清理
- 新增集合必须同步 `security-rules.json` 并在控制台配置规则；默认拒绝优于默认放行

## 4. 测试

本项目无自动化测试框架。**验证靠真机**：

- `cli preview` 出二维码，手机微信扫码实跑
- 改动涉及云函数时，必须在真机上走完对应路径，不能只看模拟器 ——
  模拟器不受数据库安全规则约束，真机受，两者行为会不一致（AGENTS.md §2）
- 至少跑一遍 `node --check` 做语法校验：

  ```bash
  for f in cloudfunctions/*/index.js miniprogram/**/*.js; do node --check "$f"; done
  ```

## 5. 部署与发布流程

每次推送 `master`（及随后的部署）**必须**遵循以下序列：

1. **质量审计**
   - 语法检查：全部 `.js` 过 `node --check`，全部 `.json` 过 `json.load`
   - 结构检查：文件路径、命名、分层
   - 安全检查：`git diff --cached` 里不得出现新增的访问码/token；
     核验 `git check-ignore cloudfunctions/*/config.local.json` 命中
   - **文档检查（强制）**：下表逐项复核，"同步"的定义是描述**当前实现**而非最初计划

     | 文档 | 必须同步的触发条件 |
     |------|-------------------|
     | `README.md` | 功能清单、目录结构、云函数数量、集合清单、访问码配置方式 |
     | `AGENTS.md` | CLI 命令、平台红线、云环境 ID / AppID、鉴权模型 |
     | `ARCHITECTURE.md` | 数据模型、鉴权模型、云函数职责、已知限制 |
     | `DEPLOYMENT.md` | 部署命令、环境值、回滚方式、排障项 |
     | `HANDBOOK.md` | 速查命令、环境事实、真机验证清单 |
     | `CONTRIBUTING.md` | 本流程、日志规范、安全规则 |
     | `.agent/TEAM.md` 与 `.claude/agents/` | 角色职责或约束变更时**双向**同步 |
     | `security-rules.json` | **任一集合的增删或读写规则变更** |
     | `config.example.json` | `verifyAdmin` 读取的任一配置项增删 |

     任一文档与实现不符即视为 audit 未通过，必须先修文档再继续。
     重点防线：**实现已变更但文档仍停留在初始计划**。

2. **更新日报**：审计通过后更新 `logs/YYYY-MM-DD.log`。

3. **部署（强制，不可跳过）**
   - 云函数改动 → `cli cloud functions deploy --env $ENV --project $PROJ -r --names ...`
   - 小程序端改动 → `cli upload`，随后在 mp.weixin.qq.com 提交审核
   - **只提交不部署会让线上跑旧代码。** 唯一例外是纯文档/日志变更，
     跳过时必须明确说明"无可部署内容"

4. **同步**：暂存全部变更（含日志），提交，推送。

> [!IMPORTANT]
> **Audit → Doc-sync → Log → Deploy → Push** 必须走完。
> "已提交未部署"是缺陷，不是停止点。

> [!WARNING]
> 小程序的「上传」不等于「上线」。`cli upload` 只产生后台的开发版本；
> 必须在 mp.weixin.qq.com 提交审核、等通过、再点发布。**审核绑定的是具体的
> 代码版本快照** —— 之前通过的审核不覆盖新改的代码。

## 6. 密钥处理的边界

访问码属于口令。**AI 助手不得代为设置、读取或转述**：需要填值时，由人类自己编辑
`cloudfunctions/verifyAdmin/config.local.json`，或在云开发控制台配置环境变量。
助手可以创建带占位值的文件、可以部署，但不经手真实值。
