/* Builds the static JSON catalog under api/ from the data/*.js registries.
   These are plain files — there is no server, database, or hosted endpoint. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const apiDir = path.join(root, 'api');
fs.mkdirSync(apiDir, { recursive: true });

const load = (file) => {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'data', file), 'utf8'), sandbox, { filename: file });
  return sandbox.window;
};

const today = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const registries = [
  { key: 'tools', file: 'tools.json', dataFile: 'ai-tools.js', array: 'AI_TOOLS', meta: 'AI_TOOLS_META', label: 'AI Tools' },
  { key: 'models', file: 'models.json', dataFile: 'ai-models.js', array: 'AI_MODELS', meta: 'AI_MODELS_META', label: 'AI Models' },
  { key: 'developer-resources', file: 'developer-resources.json', dataFile: 'developer-resources.js', array: 'DEVELOPER_RESOURCES', meta: 'DEVELOPER_RESOURCES_META', label: 'Developer Resources' }
];

const generated = today();
const manifest = {
  name: 'AI Resource Intelligence static catalog',
  api_version: '1.0',
  generated,
  kind: 'static-files',
  note: 'Static JSON files shipped with the site. No hosted API, no authentication, no live endpoint.',
  total_records: 0,
  registries: {}
};

for (const r of registries) {
  const win = load(r.dataFile);
  const records = win[r.array];
  const meta = win[r.meta] || {};
  if (!Array.isArray(records)) throw new Error(`missing ${r.array} in ${r.dataFile}`);
  const categoryCounts = {};
  records.forEach((rec) => {
    if (rec.category) categoryCounts[rec.category] = (categoryCounts[rec.category] || 0) + 1;
  });
  const categories = Array.isArray(meta.categories) && meta.categories.length
    ? meta.categories
    : Object.keys(categoryCounts).sort().map((name) => ({ name, count: categoryCounts[name] }));
  const payload = {
    _meta: {
      registry: r.key,
      label: r.label,
      api_version: '1.0',
      generated,
      count: records.length,
      catalog: meta.catalog || r.key,
      last_verified: meta.last_verified || null,
      source: meta.source || null,
      categories
    },
    records
  };
  const text = JSON.stringify(payload, null, 2) + '\n';
  const target = path.join(apiDir, r.file);
  fs.writeFileSync(target, text, 'utf8');
  const bytes = Buffer.byteLength(text, 'utf8');
  manifest.total_records += records.length;
  manifest.registries[r.key] = {
    label: r.label,
    file: `api/${r.file}`,
    count: records.length,
    category_count: categories.length,
    last_verified: meta.last_verified || null,
    bytes,
    sha256: crypto.createHash('sha256').update(text, 'utf8').digest('hex')
  };
  console.log(`${r.file}: ${records.length} records, ${bytes} bytes`);
}

fs.writeFileSync(path.join(apiDir, 'catalog.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`catalog.json: ${manifest.total_records} records across ${Object.keys(manifest.registries).length} registries`);
