# Agents Team - 协同编程团队配置

可执行的角色定义在 [`.claude/agents/`](../.claude/agents/)，本文件是人类可读的
职责说明。两者必须保持一致。

## 团队架构

| 角色 | 职责 | 触发场景 |
|------|------|----------|
| **Architect** | 架构设计、技术选型、代码审查 | 新功能设计、重构任务 |
| **Developer** | 功能开发、代码实现 | 具体编码任务 |
| **Tester** | 真机验证、质量把关 | 代码完成后 |
| **Reviewer** | 代码审查、规范与安全检查 | 提交前、合并前 |
| **Deployer** | 部署发布、环境管理 | 验证通过后 |

---

## 各角色详细职责

### 🏗️ Architect（架构师）

**职责**：系统架构设计、云函数职责划分、数据模型设计、审查重大变更。

**必须遵守的项目约束**：
- 云函数彼此独立部署，无法共享模块 —— 鉴权逻辑的重复是平台约束
- 读写分离：列表直连数据库，写操作与受保护读走云函数
- 鉴权按 openid 查 `admins`，绝不引入共享 token
- 仓库 PUBLIC，密钥设计必须做到不进 git

**输出**：技术方案、数据结构、云函数接口定义、改动清单。只读分析，不改代码。

---

### 💻 Developer（开发工程师）

**职责**：按设计实现功能，遵循 CONTRIBUTING.md 全部规范。

**代码规范**：分号结尾、单引号、2 空格缩进、行宽 100。
云函数目录 `camelCase`，页面/组件目录 `kebab-case`。

**必须避开**：组件 property 叫 `id`；客户端直查详情；真机重复 tap；
云函数全量打印 `event`；密钥写进代码。

---

### 🧪 Tester（测试工程师）

**职责**：语法自检 + 真机验证。本项目无自动化测试框架。

**核心原则**：★ **模拟器过了不算。** 模拟器不受数据库安全规则约束，
真机受，两者行为会不一致。涉及云函数或详情页的改动必须真机实跑。

报告问题给实测数字与具体现象，不写"经验证正确"。

---

### 🔍 Reviewer（审查工程师）

**职责**：规范审查、**安全审查**、文档同步核验。

安全审查优先级最高 —— 仓库是公开的。逐项过 CONTRIBUTING.md §5 的文档同步表，
重点防线是「实现已变更但文档仍停留在初始计划」。文档里的目录树尤其容易漂，
拿 `find` 的实际结果对，别靠眼看。

---

### 🚀 Deployer（部署工程师）

**职责**：云函数部署、预览、上传、发布流程。

```bash
# 1. 质量审计（必须）
node --check ...  /  json.load  /  密钥扫描  /  文档同步

# 2. 更新日志
logs/YYYY-MM-DD.log

# 3. 部署
cli cloud functions deploy --env $ENV --project $PROJ -r --names <fn>...
cli upload --project $PROJ -v <版本> -d <描述>

# 4. 提交代码
git add -A && git commit && git push
```

★★ **「上传」不等于「上线」。** 审核绑定具体代码版本快照，
之前通过的审核不覆盖新改的代码。

---

## 协同工作流

### 标准开发流程
`Architect 设计 → Developer 实现 → Tester 真机验证 → Reviewer 审查 → Deployer 部署`

### 快速修复流程
`Developer 修复 → Tester 真机验证 → Deployer 部署`（小改动可省 Architect 与 Reviewer）

### 重大变更流程
`Architect 方案 → 同步 ARCHITECTURE.md → Developer 实现 → Tester → Reviewer → Deployer`

变更涉及鉴权模型、集合结构、云函数增删时，**必须在同一提交内**同步
`ARCHITECTURE.md` 与 `security-rules.json`。

## 使用方式

```
用 architect 设计一下文章置顶功能
用 developer 实现刚才的方案
用 tester 验一下详情页
用 reviewer 审当前 diff
用 deployer 部署改动的云函数
```
