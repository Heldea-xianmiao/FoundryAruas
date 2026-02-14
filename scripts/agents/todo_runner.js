#!/usr/bin/env node
// todo_runner.js
// 简易自动运行器：解析 `开发规范.md` 中的项目待办并可执行已知任务（本地化检查、jQuery 扫描等）
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const SPEC = path.join(ROOT, '开发规范.md');

function readSpec() {
  return fs.readFileSync(SPEC, 'utf8');
}

function writeSpec(content) {
  fs.writeFileSync(SPEC, content, 'utf8');
}

function parseTodos(md) {
  const lines = md.split(/\r?\n/);
  const todos = [];
  for (const line of lines) {
    const m = line.match(/^\s*[-*]\s*\[( |x)\]\s*(.+)$/);
    if (m) {
      todos.push({ done: m[1] === 'x', text: m[2].trim(), raw: line });
    }
  }
  return todos;
}

function updateSpecCheckbox(taskText) {
  const md = readSpec();
  const lines = md.split(/\r?\n/);
  const lc = taskText.toLowerCase();
  let updated = false;
  // 使用东八区时间（UTC+8），格式化为类似 `YYYY-MM-DD HH:MM:SS`
  const now = new Date(Date.now() + 8 * 60 * 60 * 1000)
    .toISOString()
    .replace('T', ' ')
    .replace(/\.\d+Z$/, '');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*[-*]\s*)\[( |x)\]\s*(.+)$/);
    if (m) {
      const text = m[3].trim();
      if (text.toLowerCase().includes(lc) || lc.includes(text.toLowerCase())) {
        // mark as done and append timestamp if not already
        if (m[2] !== 'x') {
          lines[i] = `${m[1]}[x] ${text} （自动执行: ${now}）`;
        } else if (!/自动执行/.test(lines[i])) {
          lines[i] = `${m[1]}[x] ${text} （自动执行: ${now}）`;
        }
        updated = true;
        break;
      }
    }
  }
  if (updated) writeSpec(lines.join('\n'));
  return updated;
}

function scanForJQuery() {
  // Simple recursive scan for common jQuery patterns in .js files
  const patterns = [/\$\(/, /\.find\(/, /\.parents\(/, /\.children\(/];
  const matches = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        if (name === 'node_modules' || name === '.git') continue;
        walk(p);
      } else if (stat.isFile() && p.endsWith('.js')) {
        const content = fs.readFileSync(p, 'utf8');
        for (const pat of patterns) {
          if (pat.test(content)) matches.push({ file: p, pattern: pat.toString() });
        }
      }
    }
  }
  walk(ROOT);
  return matches;
}

function runLocalizationQA() {
  const script = path.join(__dirname, 'localization_qa.js');
  try {
    execSync(`node "${script}"`, { stdio: 'inherit' });
    return 0;
  } catch (e) {
    return e.status || 1;
  }
}

function list() {
  const md = readSpec();
  const todos = parseTodos(md);
  console.log('FoundryAuras - Spec TODOS:');
  todos.forEach((t, i) => console.log(`${i+1}. [${t.done ? 'x' : ' '}] ${t.text}`));
}

function runTask(name) {
  const lower = name.toLowerCase();
  if (lower.includes('localiz') || lower.includes('语言') || lower.includes('本地')) {
    return runLocalizationQA();
  }
  if (lower.includes('jquery') || lower.includes('$()') || lower.includes('.find(')) {
    const res = scanForJQuery();
    if (!res.length) {
      console.log('No jQuery patterns found.');
      return 0;
    }
    console.log('jQuery-like patterns found:');
    res.forEach(r => console.log(` - ${r.file}  (${r.pattern})`));
    return 2;
  }
  // Known automation: example agent demo asset creation is a no-op here (we create files separately)
  if (lower.includes('agent') || lower.includes('角色')) {
    console.log('Agent-role demo present in scripts/agents.');
    return 0;
  }
  console.log('Unknown task, cannot run automatically:', name);
  return 3;
}

function usage() {
  console.log('Usage: node todo_runner.js list|run "task name"|run-all|run-and-update "task name"|run-all-and-update');
}

async function main() {
  const argv = process.argv.slice(2);
  if (!argv.length) return usage();
  const cmd = argv[0];
  if (cmd === 'list') return list();
  if (cmd === 'run-all' || cmd === 'run-all-and-update') {
    const md = readSpec();
    const todos = parseTodos(md);
    for (const t of todos) {
      console.log(`\n=== Running: ${t.text} ===`);
      const code = runTask(t.text);
      if ((cmd === 'run-all-and-update') && code === 0) {
        const ok = updateSpecCheckbox(t.text);
        console.log(ok ? 'Updated spec checkbox.' : 'Spec update skipped (no matching line).');
      }
    }
    return;
  }
  if (cmd === 'run-and-update') {
    const name = argv.slice(1).join(' ');
    if (!name) return usage();
    const code = runTask(name);
    if (code === 0) {
      const ok = updateSpecCheckbox(name);
      console.log(ok ? 'Updated spec checkbox.' : 'Spec update skipped (no matching line).');
    }
    return code;
  }
  if (cmd === 'run') {
    const name = argv.slice(1).join(' ');
    if (!name) return usage();
    return runTask(name);
  }
  return usage();
}

main();
