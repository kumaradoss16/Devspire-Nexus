/* Renders the Featured Editorial Collection into index.html.
   The data module is the source of truth; the committed HTML stays static and
   crawlable, and this script fails if any URL, registry reference or logo is
   invalid. Run from the project root: node .qa/build-featured-collection.js */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');
const START = '<!-- FEATURED-COLLECTION:START';
const END = '<!-- FEATURED-COLLECTION:END -->';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const fail = (message) => {
  console.error('FEATURED COLLECTION BUILD FAILED');
  console.error(message);
  process.exit(1);
};

const loadGlobals = (files) => {
  const context = { window: {} };
  vm.createContext(context);
  files.forEach((file) => vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file }));
  return context.window;
};

const win = loadGlobals([
  'data/ai-tools.js',
  'data/ai-models.js',
  'data/developer-resources.js',
  'data/featured-collection.js'
]);

const collection = win.DSH_EDITORIAL_COLLECTION;
if (!collection || !Array.isArray(collection.platforms) || !Array.isArray(collection.categories)) {
  fail('data/featured-collection.js does not expose DSH_EDITORIAL_COLLECTION with categories and platforms.');
}

const registries = { tool: win.AI_TOOLS || [], model: win.AI_MODELS || [], resource: win.DEVELOPER_RESOURCES || [] };
const categoryIds = new Set(collection.categories.map((c) => c.id));
const ids = new Set();
const names = new Set();

if (collection.platforms.length !== 21) {
  fail(`Expected exactly 21 platforms, found ${collection.platforms.length}.`);
}

collection.platforms.forEach((platform) => {
  if (!platform.id || ids.has(platform.id)) fail(`Duplicate or missing platform id: ${platform.id}`);
  ids.add(platform.id);
  if (!platform.name || names.has(platform.name)) fail(`Duplicate or missing platform name: ${platform.name}`);
  names.add(platform.name);
  if (!categoryIds.has(platform.category)) fail(`${platform.name} references unknown category "${platform.category}".`);
  if (!/^https:\/\/[^\s]+$/.test(platform.officialUrl || '')) fail(`${platform.name} has an invalid official URL.`);
  if (platform.registry) {
    const records = registries[platform.registry.type];
    if (!records || !records.some((r) => r.id === platform.registry.id)) {
      fail(`${platform.name} references missing registry record ${platform.registry.type}:${platform.registry.id}.`);
    }
  }
  if (platform.logo && !fs.existsSync(path.join(ROOT, platform.logo))) {
    fail(`${platform.name} logo not found: ${platform.logo}`);
  }
});

const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[ch]));

const initials = (name) => String(name || '')
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((word) => word[0])
  .join('')
  .toUpperCase() || '—';

const categoryLabel = (id) => {
  const category = collection.categories.find((c) => c.id === id);
  return category ? category.label : id;
};

const registryHref = (platform) => {
  if (!platform.registry) return null;
  const page = platform.registry.type === 'resource' ? 'developer-resources.html' : 'ai-tools.html';
  const prefix = platform.registry.type === 'resource' ? 'resource' : 'tool';
  return `${page}#${prefix}/${encodeURIComponent(platform.registry.id)}`;
};

const reviewLabel = () => {
  const [year, month, day] = String(collection.lastReviewed).split('-').map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
};

const logoHtml = (platform) => {
  if (!platform.logo) {
    return `<span class="editorial-logo"><span class="editorial-logo-fallback" aria-hidden="true">${esc(initials(platform.name))}</span></span>`;
  }
  return `<span class="editorial-logo"><img src="${esc(platform.logo)}" alt="${esc(platform.name)} logo" width="26" height="26" loading="lazy" decoding="async"/><span class="editorial-logo-fallback" aria-hidden="true" hidden>${esc(initials(platform.name))}</span></span>`;
};

const cardHtml = (platform, index) => {
  const href = registryHref(platform);
  const registryLink = href
    ? `<a class="editorial-link editorial-link--internal" href="${esc(href)}" aria-label="Explore ${esc(platform.name)} in the DevSpire Nexus registry">Explore in Nexus<span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span></a>`
    : '';
  return `    <article class="editorial-card ui-card" data-collection-id="${esc(platform.id)}" data-collection-category="${esc(platform.category)}">
      <span class="editorial-card-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
      <div class="editorial-card-head">
        ${logoHtml(platform)}
        <div class="editorial-card-ident">
          <h3 class="editorial-card-title">${esc(platform.name)}</h3>
          <span class="editorial-card-category">${esc(categoryLabel(platform.category))}</span>
        </div>
      </div>
      <p class="editorial-card-desc">${esc(platform.description)}</p>
      <p class="editorial-best"><span>Best for</span>${esc(platform.bestFor)}</p>
      <div class="editorial-links">
        <a class="editorial-link editorial-link--external" href="${esc(platform.officialUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Visit the official ${esc(platform.name)} website (opens in a new tab)">Visit Official Website<span class="material-symbols-outlined" aria-hidden="true">arrow_outward</span></a>
        ${registryLink}
      </div>
    </article>`;
};

const filterHtml = (key, label, count, pressed) => `      <button class="editorial-filter" type="button" data-collection-filter="${esc(key)}" data-collection-label="${esc(label)}" aria-pressed="${pressed}">${esc(label)}<span class="editorial-filter-count">${count}</span></button>`;

const categoryCount = (key) => collection.platforms.filter((p) => p.category === key).length;

const sectionHtml = `${START} (generated by .qa/build-featured-collection.js) -->
<section class="editorial-collection" id="featured-collection" aria-labelledby="featured-collection-title">
  <header class="editorial-head">
    <div class="editorial-masthead">
      <p class="editorial-eyebrow"><span class="material-symbols-outlined" aria-hidden="true">auto_awesome</span>${esc(collection.eyebrow)}</p>
      <div class="editorial-meta" aria-label="Collection scope">
        <span class="editorial-meta-item"><strong>${collection.platforms.length}</strong> Platforms</span>
        <span class="editorial-meta-item"><strong>${collection.categories.length}</strong> Categories</span>
      </div>
    </div>
    <h2 class="editorial-title" id="featured-collection-title">${esc(collection.title)}</h2>
    <div class="editorial-head-grid">
      <div class="editorial-head-copy">
        <p class="editorial-lede">${esc(collection.description)}</p>
        <div class="editorial-intro">
${collection.intro.map((paragraph) => `          <p>${esc(paragraph)}</p>`).join('\n')}
        </div>
      </div>
      <figure class="editorial-quote">
        <blockquote>
          <p>${esc(collection.quote)}</p>
        </blockquote>
        <figcaption>${esc(collection.quoteAttribution)}</figcaption>
      </figure>
    </div>
  </header>
  <div class="editorial-filters" role="group" aria-label="Filter platforms by editorial category">
${filterHtml('all', 'All Platforms', collection.platforms.length, 'true')}
${collection.categories.map((category) => filterHtml(category.id, category.label, categoryCount(category.id), 'false')).join('\n')}
  </div>
  <div class="editorial-status-row">
    <p class="editorial-status" id="editorial-status" role="status">Showing all ${collection.platforms.length} platforms</p>
  </div>
  <div class="editorial-grid" id="editorial-grid">
${collection.platforms.map(cardHtml).join('\n')}
  </div>
  <p class="editorial-empty" id="editorial-empty" hidden>No platforms are assigned to this category.</p>
  <div class="editorial-foot">
    <p class="editorial-disclaimer">${esc(collection.disclaimer)}</p>
    <div class="editorial-foot-actions">
      <p class="editorial-reviewed">Last reviewed <time datetime="${esc(collection.lastReviewed)}">${esc(reviewLabel())}</time></p>
      <a class="editorial-cta" href="ai-tools.html">Explore All AI Tools<span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span></a>
    </div>
  </div>
</section>
${END}`;

const html = fs.readFileSync(INDEX, 'utf8');
const start = html.indexOf(START);
const end = html.indexOf(END);
if (start === -1 || end === -1 || end < start) {
  fail('index.html is missing the FEATURED-COLLECTION markers.');
}

fs.writeFileSync(INDEX, html.slice(0, start) + sectionHtml + html.slice(end + END.length), 'utf8');

const unmatched = collection.platforms.filter((p) => !p.registry).map((p) => p.name);
console.log(`Rendered ${collection.platforms.length} platforms in ${collection.categories.length} categories.`);
collection.categories.forEach((category) => {
  console.log(`  ${category.label}: ${categoryCount(category.id)}`);
});
console.log(`Registry links: ${collection.platforms.length - unmatched.length} matched, ${unmatched.length} unmatched${unmatched.length ? ` (${unmatched.join(', ')})` : ''}.`);
console.log(`Last reviewed: ${collection.lastReviewed}`);
