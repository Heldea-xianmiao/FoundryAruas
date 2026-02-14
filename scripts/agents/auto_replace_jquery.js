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

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const files = walk(repoRoot);
const changed = [];
const candidates = [];

const forbiddenSuffixRegex = /\.(on|find|closest|parents|parent|before|after|append|prepend|remove|empty)\s*\(|\)\s*\[\s*0\s*\]/; // basic

for (const file of files) {
  if (file.includes(path.join('scripts','agents'))) continue; // skip agent tools
  let src = fs.readFileSync(file, 'utf8');
  const regex = /\$\(\s*(['\"])([^'\"]+)\1\s*\)/g;
  let replaced = false;
  const newSrc = src.replace(regex, (match, quote, selector, offset) => {
    const after = src.slice(offset + match.length, offset + match.length + 40);
    if (forbiddenSuffixRegex.test(after)) {
      candidates.push({file, match, selector, contextAfter: after.slice(0,40)});
      return match;
    }
    if (selector.startsWith('#') && /^[A-Za-z0-9_\-]+$/.test(selector.slice(1))) {
      replaced = true;
      return `document.getElementById(${quote}${selector.slice(1)}${quote})`;
    }
    // safe-ish: replace with querySelectorAll for simple selectors
    replaced = true;
    return `document.querySelectorAll(${quote}${selector}${quote})`;
  });

  if (replaced && newSrc !== src) {
    // backup
    try {
      fs.writeFileSync(file + '.bak', src, 'utf8');
      fs.writeFileSync(file, newSrc, 'utf8');
      changed.push(file);
    } catch (e) {
      console.error('Failed to write', file, e);
    }
  }
}

const out = {
  timestamp: new Date().toISOString(),
  changedFiles: changed,
  candidates: candidates
};

const outPath = path.join(__dirname, 'jquery_auto_replacements.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
console.log('Auto-replace complete. Changed files:', changed.length);
if (changed.length) changed.forEach(f=>console.log('  ', f));
console.log('Candidates (need manual review):', candidates.length);
if (candidates.length) candidates.slice(0,50).forEach(c=>console.log('  ', c.file, '->', c.match));
console.log('Report written to', outPath);
