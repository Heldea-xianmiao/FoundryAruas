const fs = require('fs');
const {execSync} = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const moduleJson = path.join(root, 'module.json');
const pkg = JSON.parse(fs.readFileSync(moduleJson,'utf8'));
const ver = pkg.version.split('.').map(n=>parseInt(n,10));
ver[2] = (ver[2]||0) + 1; // bump patch
const newVer = ver.join('.');
pkg.version = newVer;
fs.writeFileSync(moduleJson, JSON.stringify(pkg, null, 2), 'utf8');
console.log('Bumped version to', newVer);

try {
  execSync(`git add ${moduleJson}`);
  execSync(`git commit -m "chore(release): bump module version to ${newVer}"`);
  execSync(`git tag v${newVer}`);
  execSync(`git push origin master`);
  execSync(`git push origin v${newVer}`);
  console.log('Pushed commit and tag v' + newVer);
} catch (e) {
  console.error('Failed to push commit/tag:', e.message);
}
