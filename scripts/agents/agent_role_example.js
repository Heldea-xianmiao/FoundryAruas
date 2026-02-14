// agent_role_example.js
// 简单示例：打印用于以 agent 身份发起请求的系统提示与用户提示
const sysPrompt = `你现在是 FoundryAuras 项目的 Agent，身份: Localization Agent。` +
  ` 使用中文回复。目标：比较 languages/zh-CN.json 与 languages/en.json 的键，` +
  `并输出差异的 JSON 列表，附带建议。`;

const userPrompt = `比较 zh-CN.json 与 en.json，返回: {missingInEn: [], missingInZh: []}`;

console.log('---SYSTEM PROMPT---');
console.log(sysPrompt);
console.log('\n---USER PROMPT---');
console.log(userPrompt);

// 说明：在真实场景中，将这两个提示发送给模型（例如通过 OpenAI/本地 LLM 接口）
// 并解析模型的 JSON 输出。此脚本只是演示提示模板。
