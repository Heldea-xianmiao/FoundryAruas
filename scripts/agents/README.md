FoundryAuras Agents - 使用说明
================================

快速开始：

1. 本目录包含若干 agent prompt 模板（`prompts/`）和示例脚本 `run_agent_example.js`。
2. 若要在本地查看某个 agent 的 prompt：

```bash
node scripts/agents/run_agent_example.js foundry_api_agent.md
```

3. 约束：所有 agent 必须遵守项目 `开发规范.md`（中文输出、禁止 jQuery、所有 UI 文本必须写入 `languages/zh-cn.json` 并同步到 `languages/en.json`）。

Localization QA：
- 本仓库提供 `localization_qa.js` 检查 `languages/zh-cn.json` 和 `languages/en.json` 的键是否一致。

示例：运行本地化 QA

```bash
node scripts/agents/localization_qa.js
```

输出将列出在 `zh-cn.json` 中存在但 `en.json` 中缺失的键，反之亦然。此脚本用于在提交前保证语言键的一致性。

工作流建议：
- 变更任何 UI 文本前，先在 `prompts` 中准备 agent prompt，运行 `localization_qa.js` 检查差异，修复后提交。
