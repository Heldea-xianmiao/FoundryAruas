// 简易示例脚本：打印指定 agent 的 prompt 模板到控制台
const fs = require('fs');
const path = require('path');

const agentName = process.argv[2];
if (!agentName) {
  console.log('Usage: node run_agent_example.js <agent-file-name>');
  process.exit(1);
}

const filePath = path.join(__dirname, 'prompts', agentName);
if (!fs.existsSync(filePath)) {
  console.error('Agent prompt not found:', filePath);
  process.exit(2);
}

const content = fs.readFileSync(filePath, 'utf8');
console.log('--- Prompt: ' + agentName + ' ---\n');
console.log(content);

// 说明：本脚本仅用于本地查看 prompt 模板，并不调用任何 LLM。
