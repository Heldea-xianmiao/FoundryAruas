# Foundry Auras

[快速跳转: Cooldowns 使用说明](#cooldowns-使用与测试)

这是一个为 Foundry VTT 设计的模块，旨在模仿《魔兽世界》插件 WeakAuras (WA) 的功能和界面风格。即使在 Foundry VTT V13/V14 环境下，也能通过可视化的 IDE 管理界面，为角色和 Token 创建动态的视觉提示光环。

## 功能特性 (Features)

*   **可视化配置界面**: 采用经典的 WeakAuras 暗色主题，左侧列表、右侧编辑器，支持即时保存。
*   **低代码/无代码触发器**:
    *   **事件触发**: 监听 `updateActor` (数值变更) 或 `controlToken` (选中) 事件。
    *   **定时器触发**: 支持设置持续时间和循环播放。
    *   **状态触发**: 基于角色状态效果显示光环。
    *   **条件脚本**: 支持编写简单的 JavaScript 条件判断 (`return true/false`)。
    *   **简单条件构建器**: 无需编程，通过下拉菜单配置常见条件。
*   **丰富的视觉效果**:
    *   **动画系统**: 脉冲、旋转、闪烁、弹跳、震动、呼吸、发光、心跳等9种动画。
    *   **动画个性化**: 每种动画都提供专属速度控制。
    *   **视觉定制**: 大小、字体、颜色、不透明度、边框、阴影、旋转、缩放等全面控制。
    *   **进度条支持**: 内置进度条显示模式，支持自定义颜色和样式。
*   **音频支持**: 为光环添加音效触发。
*   **动画个性化**: 每种动画类型都提供专属选项，如闪烁速度调节、进度条方向控制等。
*   **完全汉化**: 内置完整的中文语言支持。
*   **深色模式 UI**: 专为长时间配置优化的护眼界面。
*   **新手引导**: 内置交互式教程，帮助新用户快速上手。
*   **实时预览**: 设置修改后即时反映，无需重启界面。

## 安装说明 (Installation)

1.  将 `FoundryAuras` 文件夹放入您的 Foundry VTT `Data/modules/` 目录下。
2.  启动 Foundry VTT，在 "Manage Modules" 中启用 "Foundry Auras"。
3.  在游戏设置 (Game Settings) -> "Foundry Auras" 中点击 "打开配置界面 (IDE)" 即可开始使用。

## 使用指南 (Quick Start / Tutorial)

**FoundryAuras 的逻辑类似于 WeakAuras：你不需要"选取"某个指示物来添加光环，你只需要创建一个"规则"。** 系统会自动检查屏幕上的所有指示物，如果它们满足你的规则，就会在它们头顶显示光环。

### 1. 基础流程 (Basic Usage)
1. 打开 **模块设置 -> FoundryAuras -> 打开配置 (IDE)**.
2. 点击 **新建 (New)**，或选择一个 **预设 (Preset)** (例如 "低血量警报").
3. 在 **触发器 (Trigger)** 选项卡中设置条件:
   - **事件**: 选择 `演员更新 (UpdateActor)` (用于血量变化) 或 `控制指示物 (ControlToken)` (用于选中时触发).
   - **条件脚本**: 编写一段 JS 返回 `true` 或 `false`。
4. 在 **显示 (Display)** 选项卡中设置样式:
   - **图标**: 选择图片。
   - **动画**: 选择呼吸、心跳等动画。
   - **文本**: 输入 `%hp` 可显示当前血量。
5. 点击 **保存光环 (Save Aura)**。

### 2. 将光环应用给特定 Token (Targeting)
你不需要手动应用。只要该 Token 满足 `条件 (Condition)`，光环就会自动出现。
*   **示例**: 想让光环只出现在名叫 "Hero" 的 Token 上？
    *   在条件脚本中写: `return token.name === "Hero" && actor.system.attributes.hp.value < 20;`

### 3. 新手引导 (Getting Started)
如果您是第一次使用 FoundryAuras，建议先完成内置的新手引导教程：
1. 打开配置界面后，系统会自动提示是否开始教程。
2. 教程将逐步引导您了解界面布局、预设使用和编辑器的基本操作。
3. 教程可以随时暂停和恢复，非常适合新手学习。

## 常见问题 (FAQ)
*   **预览模式 (Preview)**: 点击 IDE 中的预览按钮，只会临时在刚才选中的 Token 上显示效果，用于调整位置。关闭 IDE 后预览会消失。
*   **不显示?**: 检查控制台 (F12) 是否有报错。确保你的脚本逻辑返回了 `true`。

## 当前开发状态 (Status)
查看 `开发规范.md` 获取最新详细开发进度。
*   [x] 动画系统 (Animations)
*   [x] 复杂条件脚本 (Scripting)
*   [x] 预设模版 (Presets)
*   [x] 批量导入导出 (Batch Import/Export)
*   [x] 动画个性化选项 (Animation Options)
*   [x] 实时预览更新 (Live Preview)
*   [x] UI优化 (z-index层级、删除确认)

## 开发规范 (Development Standards)

本项目遵循以下开发规范，贡献代码时请务必遵守：

1.  **ES Modules Only**: 仅使用 `<script type="module">` 和 `import/export` 语法。
    *   禁止使用全局变量污染命名空间。
    *   禁止使用 CommonJS (`require`)。
2.  **No jQuery**: 禁止在 `scripts/manager.js` 或其他核心逻辑中使用 jQuery (如 `$` 或 `html.find`)。
    *   使用原生的 `querySelector`, `addEventListener` 等 API。
    *   *例外*: Foundry VTT 核心 API 返回的某些对象可能包含 jQuery 包装器，但我们也应尽量解包后使用原生方法。
3.  **Localization First**: 所有用户可见的文本必须通过 `game.i18n.localize` 获取。
    *   语言文件统一存放在 `languages/zh-cn.json` (并作为 `en` 的 fallback)。
4.  **注释规范**: 关键逻辑必须包含中文注释，解释 "为什么这么做" 而不仅仅是 "做了什么"。

## 版本历史

*   **0.1.0**: 初始版本，实现基础的 WA 风格编辑器 UI 和简单事件触发器。

## 许可证 (License)

MIT License

---

## GitHub 项目设置说明

已在仓库添加 CI 工作流：`.github/workflows/ci.yml`，该工作流会在 `push` 与 `pull_request` 到 `main/master` 时运行本地化 QA 与非破坏性 jQuery 扫描，并将生成的报告作为构件上传。请在 GitHub 仓库的 Actions 页面确认首次运行结果。

若要在仓库页面显示 Action 状态徽章，请将下列 Markdown 添加到 README 的顶部（替换为你的仓库路径）：

```
[![CI](https://github.com/Heldea-xianmiao/FoundryAruas/actions/workflows/ci.yml/badge.svg)](https://github.com/Heldea-xianmiao/FoundryAruas/actions)
```

我已将本地更改推送到 `https://github.com/Heldea-xianmiao/FoundryAruas` 的 `master` 分支。

## Cooldowns 使用与测试

模块提供了一个最小的冷却时间追踪 API，位于 `scripts/cooldowns.js`，以及演示脚本 `scripts/demo_cooldowns.js` 和手动测试脚本 `scripts/test_cooldowns_manual.js`。

快速试用步骤（在 Foundry 控制台中执行）：

1. 打开 Foundry 游戏并确保模块已启用，等待模块初始化完毕。
2. 在控制台输入或粘贴以下命令运行演示脚本：

```javascript
// 在模块目录或控制台中执行
await import('/modules/FoundryAuras/scripts/demo_cooldowns.js');
```

3. 手动测试（更彻底）：

```javascript
// 在模块目录或控制台中执行
await import('/modules/FoundryAuras/scripts/test_cooldowns_manual.js');
```

说明：这些脚本设计为在 Foundry 环境中运行，它们会尝试查找当前选中 token 的 actor 并执行设置/查询/清理冷却的操作。如果在非 Foundry 环境运行，会记录错误信息。

### 与 dnd5e 的可选集成

模块提供一个可选的集成脚本 `scripts/cooldowns_integration.js`，用于把物品/技能使用自动映射为冷却：

- 用法示例（在 Foundry 控制台执行）：

```javascript
// 定义映射（物品名 -> 冷却秒数）
const mapping = {
    '火球术': 60,
    '治疗术': 30
};
// 导入并注册集成（模块加载后手动调用）
await import('/modules/FoundryAuras/scripts/cooldowns_integration.js');
registerDnd5eIntegration(mapping);
```

该集成尝试从 chat message 的 flags 或 content 中解析出物品名称（对 `midi-qol` 等常见模块有基本支持），并为对应 actor 设置冷却。该集成为可选注册，不会自动生效，便于维护与调试。
