const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'models.html');
let src = fs.readFileSync(file, 'utf8');

const adapter = `/* Presentation adapter: maps the shared registry schema from
   data/ai-models.js into the field names this page's engine renders.
   Records live in the data file; none are embedded here. */
const MODELS_DATA = (Array.isArray(window.AI_MODELS) ? window.AI_MODELS : []).map((m) => ({
  id: m.id,
  name: m.name,
  publisher: m.publisher,
  icon: m.icon,
  cat: m.category,
  sub: m.source_category,
  family: m.family,
  pricing: m.pricing,
  signup: m.signup_required,
  local: m.self_hostable,
  weights: m.weights,
  license: m.license,
  licenseGroup: m.license_group,
  params: m.params,
  contextK: m.context_k,
  moe: m.moe,
  modalities: m.modalities,
  url: m.official_url,
  evidence: m.evidence,
  verified: m.verified,
  desc: m.description,
  tags: m.tags
}));`;

/* 1. Replace the inline record array with the adapter */
const dataStart = src.indexOf('const MODELS_DATA = [');
if (dataStart === -1) throw new Error('MODELS_DATA array not found');
const dataEnd = src.indexOf('\n];', dataStart);
if (dataEnd === -1) throw new Error('MODELS_DATA array end not found');
src = src.slice(0, dataStart) + adapter + src.slice(dataEnd + 3);

/* 2. Remove the page-local icon map */
const iconComment = src.indexOf('/* Brand icons per publisher');
const iconStart = src.indexOf('const MODEL_ICON_URLS = {', iconComment);
if (iconStart === -1) throw new Error('MODEL_ICON_URLS not found');
const iconEnd = src.indexOf('\n};', iconStart);
if (iconEnd === -1) throw new Error('MODEL_ICON_URLS end not found');
src = src.slice(0, iconComment) + src.slice(iconEnd + 3);

/* 3. Load the external dataset before the inline engine */
if (!src.includes('src="data/ai-models.js"')) {
  const adapterPos = src.indexOf('/* Presentation adapter');
  const scriptTag = src.lastIndexOf('\n<script>', adapterPos);
  if (adapterPos === -1 || scriptTag === -1) throw new Error('inline script opening not found');
  src = src.slice(0, scriptTag) + '\n<script src="data/ai-models.js"></script>' + src.slice(scriptTag);
}

fs.writeFileSync(file, src);
console.log('models.html rewritten:', src.length, 'bytes');
console.log('inline records left:', (src.match(/icon: "openai"/g) || []).length);
console.log('external data tag:', src.includes('src="data/ai-models.js"'));
