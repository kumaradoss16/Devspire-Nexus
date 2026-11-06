const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'models.html'), 'utf8');

function slice(src, marker) {
  const start = src.indexOf(marker);
  if (start === -1) throw new Error(marker + ' not found');
  const open = marker.includes('= [') ? '[' : '{';
  let i = src.indexOf(open, start);
  let depth = 0;
  let inStr = null;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (inStr) {
      if (c === '\\') { j++; continue; }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === open) depth++;
    else if (c === (open === '[' ? ']' : '}')) {
      depth--;
      if (depth === 0) return src.slice(i, j + 1);
    }
  }
  throw new Error('unterminated ' + marker);
}

const models = vm.runInNewContext(`(${slice(html, 'const MODELS_DATA = [')})`);
const icons = vm.runInNewContext(`(${slice(html, 'const MODEL_ICON_URLS = {')})`);

const catCounts = {};
const cats = {};
models.forEach((m) => {
  catCounts[m.cat] = (catCounts[m.cat] || 0) + 1;
  cats[m.sub] = (cats[m.sub] || 0) + 1;
});

const fields = ['id', 'name', 'publisher', 'icon', 'cat', 'sub', 'family', 'pricing', 'signup', 'local', 'weights', 'license', 'licenseGroup', 'params', 'contextK', 'moe', 'modalities', 'url', 'evidence', 'verified', 'desc', 'tags'];
const missing = [];
models.forEach((m, i) => fields.forEach((f) => {
  if (m[f] === undefined) missing.push(`#${i} ${m.id}: ${f}`);
}));

const missingIcons = models.filter((m) => !icons[m.icon]).map((m) => `${m.id} (${m.icon})`);
const orphanIcons = Object.keys(icons).filter((k) => !models.some((m) => m.icon === k));
const missingFiles = Object.entries(icons).filter(([, p]) => !fs.existsSync(path.join(root, p))).map(([k, p]) => `${k} -> ${p}`);

fs.writeFileSync(path.join(__dirname, 'model-records.json'), JSON.stringify({ models, icons }, null, 2));

console.log('records:', models.length);
console.log('categories:', JSON.stringify(catCounts, null, 2));
console.log('source categories:', Object.keys(cats).length);
console.log('pricing:', JSON.stringify(models.reduce((a, m) => (a[m.pricing] = (a[m.pricing] || 0) + 1, a), {})));
console.log('weights:', JSON.stringify(models.reduce((a, m) => (a[m.weights] = (a[m.weights] || 0) + 1, a), {})));
console.log('license groups:', JSON.stringify(models.reduce((a, m) => (a[m.licenseGroup] = (a[m.licenseGroup] || 0) + 1, a), {})));
console.log('verified dates:', [...new Set(models.map((m) => m.verified))]);
console.log('icon keys used:', new Set(models.map((m) => m.icon)).size, 'of map', Object.keys(icons).length);
console.log('models without icon mapping:', missingIcons);
console.log('orphan icons:', orphanIcons);
console.log('missing icon files:', missingFiles);
console.log('missing fields:', missing.length, missing.slice(0, 10));
