FoundryAuras Skill Agents
=========================

本目录包含为 FoundryAuras 项目设计的 skill agent 模板与示例脚本。每个 agent 都是一个 prompt 模板，供 AI 代理在执行特定职责时使用。

使用说明：
- 将对应 agent 的内容复制到 LLM 的 system prompt 中，随后提供工作上下文（文件路径、修改要求、验收标准）。
- 所有 agent 必须遵守 `开发规范.md`（中文交流、禁止 jQuery、本地化优先等）。

核心 agent 列表：
- Foundry API Agent: Foundry Hook / Settings / Actor/Token 交互与兼容性检查。
- Aura Engine Agent: 光环匹配、条件解析、DOM 渲染与性能优化。
- Manager/UI Agent: 配置面板、Handlebars 渲染、submitOnChange 与 UI 交互。
- Presets Agent: 预设设计与本地化条目生成。
- Localization Agent: 语言键管理与 `zh-cn.json`/`en.json` 同步校验。

示例脚本：`run_agent_example.js` （仅用于本地模拟 prompt 展示）。
