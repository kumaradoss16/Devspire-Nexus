/* Builds the static Nexus Spotlight section from data/nexus-spotlight.js and
   the canonical registries. Idempotent replacement between markers. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const pagePath = path.join(root, 'index.html');
const dataPath = path.join(root, 'data', 'nexus-spotlight.js');

const load = (file, key) => {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: path.basename(file) });
  return sandbox.window[key];
};

const data = load(dataPath, 'DSH_NEXUS_SPOTLIGHT');
const models = load(path.join(root, 'data', 'ai-models.js'), 'AI_MODELS');
const tools = load(path.join(root, 'data', 'ai-tools.js'), 'AI_TOOLS');

const fail = (message) => { throw new Error('[nexus-spotlight] ' + message); };
const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[ch]));

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const humanDate = (value) => {
  const full = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (full) {
    const month = Number(full[2]) - 1;
    if (month < 0 || month > 11) fail('invalid month in ' + value);
    return `${Number(full[3])} ${MONTHS[month]} ${full[1]}`;
  }
  const month = /^(\d{4})-(\d{2})$/.exec(value);
  if (month) {
    const index = Number(month[2]) - 1;
    if (index < 0 || index > 11) fail('invalid month in ' + value);
    return `${MONTHS_LONG[index]} ${month[1]}`;
  }
  fail('unsupported release date: ' + value);
  return '';
};

if (!data || !Array.isArray(data.items) || !data.items.length) fail('no spotlight items');
if (data.eyebrow !== 'NEXUS SPOTLIGHT') fail('unexpected eyebrow');
if (data.title !== "Discover What's Worth Exploring") fail('unexpected title');

const allowedBadges = new Set(['NEW', 'FEATURED', 'PREVIEW', 'EARLY ACCESS']);
const seen = new Set();
const typeCounts = {};
const modelIndex = new Map(models.map((record) => [record.id, record]));
const toolIndex = new Map(tools.map((record) => [record.id, record]));

const items = data.items.map((item, index) => {
  if (!['model', 'tool'].includes(item.type)) fail(`item ${index + 1} has unsupported type ${item.type}`);
  if (!allowedBadges.has(item.badge)) fail(`item ${index + 1} has unsupported badge ${item.badge}`);
  const key = `${item.type}:${item.id}`;
  if (seen.has(key)) fail('duplicate spotlight item ' + key);
  seen.add(key);
  const record = item.type === 'model' ? modelIndex.get(item.id) : toolIndex.get(item.id);
  if (!record) fail('unresolved spotlight item ' + key);
  if (!/^https:\/\//.test(record.official_url)) fail('non-https official URL for ' + key);
  if (!record.category) fail('missing category for ' + key);
  const expectedDetail = item.type === 'model'
    ? `models.html#model/${encodeURIComponent(record.id)}`
    : `ai-tools.html#tool/${encodeURIComponent(record.id)}`;
  if (item.name !== record.name) fail(`name drift for ${key}: ${item.name} vs ${record.name}`);
  if (item.category !== record.category) fail(`category drift for ${key}`);
  if (item.officialUrl !== record.official_url) fail(`official URL drift for ${key}`);
  if (item.detailPath !== expectedDetail) fail(`detail path drift for ${key}`);
  typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
  return { ...item, dateLabel: humanDate(item.released) };
});

const badgeClass = (badge) => ({
  NEW: 'spotlight-badge--new',
  PREVIEW: 'spotlight-badge--preview',
  'EARLY ACCESS': 'spotlight-badge--early',
  FEATURED: 'spotlight-badge--new'
}[badge]);

const filterLabel = (type) => (type === 'model' ? 'Models' : 'Tools');
const filterTypes = ['model', 'tool'].filter((type) => typeCounts[type]);

const cardHTML = (item) => `
    <article class="spotlight-card" data-spotlight-type="${esc(item.type)}" data-spotlight-id="${esc(item.id)}" data-spotlight-registry="${esc(item.registry)}">
      <div class="spotlight-card-top">
        <span class="spotlight-type">${esc(item.typeLabel)}</span>
        <span class="spotlight-badge ${badgeClass(item.badge)}">${esc(item.badge)}</span>
      </div>
      <h3 class="spotlight-name">${esc(item.name)}</h3>
      <p class="spotlight-category">${esc(item.registry)} &middot; ${esc(item.category)}</p>
      <p class="spotlight-desc">${esc(item.description)}</p>
      <div class="spotlight-foot">
        <span class="spotlight-date"><time datetime="${esc(item.released)}">${esc(item.dateLabel)}</time></span>
        <div class="spotlight-links">
          <a class="spotlight-link" href="${esc(item.officialUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Open the official ${esc(item.name)} source (opens in a new tab)">Source<span class="material-symbols-outlined" aria-hidden="true">open_in_new</span></a>
          <a class="spotlight-link spotlight-link--record" href="${esc(item.detailPath)}" aria-label="Open the ${esc(item.name)} registry record">Record<span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span></a>
        </div>
      </div>
    </article>`;

const filterButtons = [
  `<button class="spotlight-filter" type="button" data-spotlight-filter="all" data-spotlight-label="All discoveries" aria-pressed="true">All<span class="spotlight-filter-count">${items.length}</span></button>`,
  ...filterTypes.map((type) => `<button class="spotlight-filter" type="button" data-spotlight-filter="${type}" data-spotlight-label="${filterLabel(type)}" aria-pressed="false">${filterLabel(type)}<span class="spotlight-filter-count">${typeCounts[type]}</span></button>`)
].join('\n        ');

const metaRows = [
  ['Discoveries', items.length],
  ['Models', typeCounts.model || 0],
  ['Tools', typeCounts.tool || 0],
  ['Developer resources', typeCounts.resource || 0]
].filter(([, count]) => count > 0)
  .map(([label, count]) => `
        <div class="spotlight-meta-row"><span class="spotlight-meta-label">${label}</span><span class="spotlight-meta-value">${count}</span></div>`)
  .join('');

const section = `<!-- NEXUS-SPOTLIGHT:START (generated by .qa/build-nexus-spotlight.js) -->
<section class="nexus-spotlight" id="nexus-spotlight" aria-labelledby="nexus-spotlight-title">
  <div class="spotlight-head">
    <div>
      <p class="spotlight-eyebrow">${esc(data.eyebrow)}</p>
      <h2 class="spotlight-title" id="nexus-spotlight-title">${esc(data.title)}</h2>
      <p class="spotlight-lede">${esc(data.description)}</p>
      <p class="spotlight-support">${esc(data.supporting)}</p>
    </div>
    <div class="spotlight-meta" aria-label="Spotlight scope">${metaRows}
    </div>
  </div>
  <div class="spotlight-toolbar">
    <div class="spotlight-filters" role="group" aria-label="Filter Spotlight by resource type">${filterButtons}</div>
    <p class="spotlight-status" id="spotlight-status" role="status">Showing all ${items.length} discoveries</p>
  </div>
  <div class="spotlight-grid" id="spotlight-grid">${items.map(cardHTML).join('')}
  </div>
  <p class="spotlight-empty" id="spotlight-empty" hidden>No discoveries are available for this filter.</p>
  <div class="spotlight-foot-note">
    <p>Spotlight is an editorial selection, not a ranking. Every entry links to its canonical registry record; inclusion does not imply endorsement.</p>
    <div class="spotlight-foot-actions">
      <span>Last reviewed <time datetime="${esc(data.lastReviewed)}">${esc(humanDate(data.lastReviewed))}</time></span>
      <a href="models.html">Browse AI Models<span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span></a>
    </div>
  </div>
</section>
<!-- NEXUS-SPOTLIGHT:END -->`;

const page = fs.readFileSync(pagePath, 'utf8');
const startMarker = '<!-- NEXUS-SPOTLIGHT:START';
const endMarker = '<!-- NEXUS-SPOTLIGHT:END -->';
const start = page.indexOf(startMarker);
const end = page.indexOf(endMarker);

let output;
if (start !== -1 && end !== -1 && end > start) {
  output = page.slice(0, start) + section + page.slice(end + endMarker.length);
} else {
  const anchor = '<!-- FEATURED-COLLECTION:START';
  const at = page.indexOf(anchor);
  if (at === -1) fail('could not find insertion anchor');
  output = page.slice(0, at) + section + '\n' + page.slice(at);
}

if (!output.includes('assets/nexus-spotlight.css')) {
  output = output.replace('<link rel="stylesheet" href="assets/site.css"/>', '<link rel="stylesheet" href="assets/site.css"/>\n  <link rel="stylesheet" href="assets/nexus-spotlight.css"/>');
}
if (!output.includes('data/nexus-spotlight.js')) {
  output = output.replace('<script src="assets/nexus-spotlight.js"></script>', '<script src="data/nexus-spotlight.js"></script>\n<script src="assets/nexus-spotlight.js"></script>');
}
if (!output.includes('assets/nexus-spotlight.js')) {
  output = output.replace('<script src="assets/featured-collection.js"></script>', '<script src="assets/nexus-spotlight.js"></script>\n<script src="assets/featured-collection.js"></script>');
}

fs.writeFileSync(pagePath, output, 'utf8');
console.log(`Nexus Spotlight: ${items.length} items (${Object.entries(typeCounts).map(([k, v]) => `${k}:${v}`).join(', ')})`);
console.log('badges:', items.reduce((acc, item) => { acc[item.badge] = (acc[item.badge] || 0) + 1; return acc; }, {}));
