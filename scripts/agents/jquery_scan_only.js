const fs = require('fs');
const path = require('path');

function walk(dir, filelist=[]) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (file === 'node_modules' || file === '.git') continue;
      walk(full, filelist);
    } else {
      if (full.endsWith('.js')) filelist.push(full);
    }
  }
  return filelist;
}

const repoRoot = path.resolve(__dirname, '..', '..');
const files = walk(repoRoot);
const report = [];

const regex = /\$\(\s*(['\"])([^'\"]+)\1\s*\)/g;

for (const file of files) {
  if (file.includes(path.join('scripts','agents'))) continue; // skip agents
  const src = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = regex.exec(src)) !== null) {
    report.push({file, match: m[0], selector: m[2], index: m.index});
  }
}

const out = {
  timestamp: new Date().toISOString(),
  matches: report
};

const outPath = path.join(__dirname, 'jquery_scan_only_report.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
console.log('Scan complete. Matches:', report.length);
console.log('Report written to', outPath);
