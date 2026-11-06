const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'tools.html'), 'utf8');

function sliceArray(src, name) {
  const start = src.indexOf(`const ${name} = [`);
  if (start === -1) throw new Error(`array ${name} not found`);
  let i = src.indexOf('[', start);
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
    if (c === '[') depth++;
    else if (c === ']') {
      depth--;
      if (depth === 0) return src.slice(i, j + 1);
    }
  }
  throw new Error(`unterminated array ${name}`);
}

function sliceObject(src, name) {
  const start = src.indexOf(`const ${name} = {`);
  if (start === -1) throw new Error(`object ${name} not found`);
  let i = src.indexOf('{', start);
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
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return src.slice(i, j + 1);
    }
  }
  throw new Error(`unterminated object ${name}`);
}

const dataSrc = sliceArray(html, 'TOOLS_DATA');
const iconSrc = sliceObject(html, 'TOOL_ICON_URLS');
const tools = vm.runInNewContext(`(${dataSrc})`);
const icons = vm.runInNewContext(`(${iconSrc})`);

const catCounts = {};
const pricingCounts = {};
const licenseCounts = {};
const platformCounts = {};
tools.forEach((t) => {
  catCounts[t.category] = (catCounts[t.category] || 0) + 1;
  pricingCounts[t.pricing] = (pricingCounts[t.pricing] || 0) + 1;
  licenseCounts[t.license] = (licenseCounts[t.license] || 0) + 1;
  platformCounts[t.platform || '(unstated)'] = (platformCounts[t.platform || '(unstated)'] || 0) + 1;
});

const missingIcons = tools.filter((t) => !icons[t.name]).map((t) => t.name);
const orphanIcons = Object.keys(icons).filter((n) => !tools.some((t) => t.name === n));
const missingFiles = Object.entries(icons)
  .filter(([n, p]) => tools.some((t) => t.name === n))
  .filter(([n, p]) => !fs.existsSync(path.join(root, p)))
  .map(([n, p]) => `${n} -> ${p}`);
const missingFields = [];
tools.forEach((t, idx) => {
  ['name', 'org', 'pricing', 'license', 'category', 'deployment', 'access', 'url', 'desc', 'tags'].forEach((f) => {
    if (t[f] === undefined || t[f] === null || t[f] === '') missingFields.push(`#${idx} ${t.name || '?'} missing ${f}`);
  });
  if (!Array.isArray(t.deployment) || !t.deployment.length) missingFields.push(`#${idx} ${t.name} deployment empty`);
});

fs.writeFileSync(path.join(__dirname, 'tool-records.json'), JSON.stringify({ tools, icons }, null, 2));

console.log('records:', tools.length);
console.log('categories:', JSON.stringify(catCounts, null, 2));
console.log('pricing:', JSON.stringify(pricingCounts));
console.log('license:', JSON.stringify(licenseCounts));
console.log('platform:', JSON.stringify(platformCounts));
console.log('icon map entries:', Object.keys(icons).length);
console.log('tools without icon:', missingIcons.length, missingIcons);
console.log('orphan icon keys:', orphanIcons);
console.log('missing icon files:', missingFiles);
console.log('missing fields:', missingFields);
