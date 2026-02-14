#!/usr/bin/env node
// Localization QA: compare keys between zh-cn.json and en.json
const fs = require('fs');
const path = require('path');

const zhPath = path.join(__dirname, '..', '..', 'languages', 'zh-CN.json');
const enPath = path.join(__dirname, '..', '..', 'languages', 'en.json');

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.error('Failed to read', p, e.message);
    process.exit(2);
  }
}

function flatten(obj, prefix = '') {
  const keys = [];
  for (const k of Object.keys(obj || {})) {
    const v = obj[k];
    const nk = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flatten(v, nk));
    } else {
      keys.push(nk);
    }
  }
  return keys;
}

const zh = readJson(zhPath);
const en = readJson(enPath);

const zhKeys = new Set(flatten(zh));
const enKeys = new Set(flatten(en));

const inZhNotEn = [...zhKeys].filter(k => !enKeys.has(k));
const inEnNotZh = [...enKeys].filter(k => !zhKeys.has(k));

if (!inZhNotEn.length && !inEnNotZh.length) {
  console.log('OK: language key sets match.');
  process.exit(0);
}

if (inZhNotEn.length) {
  console.log('Keys present in zh-CN.json but missing in en.json:');
  inZhNotEn.forEach(k => console.log('  +', k));
}

if (inEnNotZh.length) {
  console.log('Keys present in en.json but missing in zh-CN.json:');
  inEnNotZh.forEach(k => console.log('  -', k));
}

console.log(`Summary: zh-only=${inZhNotEn.length}, en-only=${inEnNotZh.length}`);
process.exit(1);
