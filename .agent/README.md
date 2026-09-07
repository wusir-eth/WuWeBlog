# 🤖 Agents Team - 协同编程团队

WuWeBlog 的多 Agent 协同开发配置。角色定义同时以两种形式存在：

- **可直接调用的 subagent**：`.claude/agents/*.md`（Claude Code 原生格式）
- **人类可读的职责说明**：本目录下的 [TEAM.md](./TEAM.md)

两者必须保持一致 —— 改了其一，另一个同步。

## 🚀 快速开始

在 Claude Code 里按名字唤起对应角色：

```
用 architect 设计一下文章置顶功能
用 reviewer 审一遍当前 diff
用 deployer 把改动的云函数部署上去
```

## 📋 团队角色

| 角色 | 职责 | 触发场景 |
|------|------|----------|
| **Architect** | 架构设计、云函数职责划分、数据模型 | 新功能设计、重构 |
| **Developer** | 功能实现 | 具体编码任务 |
| **Tester** | 语法自检 + 真机验证 | 代码完成后 |
| **Reviewer** | 规范、安全、文档同步核验 | 提交前 |
| **Deployer** | 云函数部署、上传、发布 | 验证通过后 |

## 🔄 标准工作流程

```
Architect 设计 → Developer 实现 → Tester 真机验证
       → Reviewer 审查 → Deployer 部署 → 提交推送
```

即 **Audit → Doc-sync → Log → Deploy → Push**，见
[CONTRIBUTING.md §5](../CONTRIBUTING.md)。

## 🛠️ 质量保障

本项目无自动化测试框架。质量靠三道关：

1. `node --check` / `json.load` 语法自检
2. **真机实跑** —— 模拟器不受数据库安全规则约束，过了不算
3. 提交前的密钥扫描与文档同步核验

## ⚠️ 本项目特有红线

完整列表见 [AGENTS.md](../AGENTS.md)。最容易踩的五条：

1. 组件 property **不能叫 `id`**（内置属性，真机恒为空）
2. 客户端**不能直查文章详情**，会被安全规则拦，必须走 `getArticleDetail`
3. 真机 `bindtap` 配 `hover-class` 会**触发两次**，需节流
4. 鉴权按 **openid**，绝不用共享 token
5. **仓库是 PUBLIC 的**，访问码等密钥绝不进 git

## 📝 日志规范

每次开发进展记入 `logs/YYYY-MM-DD.log`。**叙事体，不是动作清单** ——
"改了 X"没有价值，"X 为什么会错、错的表象是什么、为什么当时没发现"才有。
时间戳必须来自 `date '+%H:%M'` 的真实系统时间。

详见 [CONTRIBUTING.md §2](../CONTRIBUTING.md)。

## 🔗 相关资源

- [AGENTS.md](../AGENTS.md) — AI 助手须知与平台红线
- [CONTRIBUTING.md](../CONTRIBUTING.md) — 开发标准与发布流程
- [ARCHITECTURE.md](../ARCHITECTURE.md) — 设计取舍
- [DEPLOYMENT.md](../DEPLOYMENT.md) — 部署与排障
- [HANDBOOK.md](../HANDBOOK.md) — 照着做的操作清单
