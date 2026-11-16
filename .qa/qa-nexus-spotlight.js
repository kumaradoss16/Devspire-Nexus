/* QA for the Nexus Spotlight section and the Week 46 registry ingestion.
   Run from the project root: node .qa/qa-nexus-spotlight.js */
const { chromium } = require('playwright-core');
const { pathToFileURL } = require('url');
const path = require('path');
const fs = require('fs');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const EXE = path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1248/chrome-win64/chrome.exe');
const HOME = pathToFileURL(path.join(ROOT, 'index.html')).href;
const BASE = pathToFileURL(ROOT).href + '/';
const VIEWPORTS = [1440, 1366, 1024, 768, 390, 320];

let passed = 0;
const failures = [];
const check = (name, condition, detail) => {
  if (condition) {
    passed += 1;
  } else {
    failures.push({ name, detail });
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
};

/* ---------- Data ---------- */
const context = { window: {} };
vm.createContext(context);
['data/ai-tools.js', 'data/ai-models.js', 'data/developer-resources.js', 'data/nexus-spotlight.js']
  .forEach((file) => vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file }));
const win = context.window;
const data = win.DSH_NEXUS_SPOTLIGHT;
const registries = { tool: win.AI_TOOLS, model: win.AI_MODELS, resource: win.DEVELOPER_RESOURCES };
const resolve = (type, id) => (registries[type] || []).find((record) => record.id === id);

check('Spotlight data module exists', Boolean(data && Array.isArray(data.items)));
check('22 Spotlight items', data.items.length === 22, String(data.items.length));
check('17 models and 5 tools', data.items.filter((i) => i.type === 'model').length === 17 && data.items.filter((i) => i.type === 'tool').length === 5);
check('Spotlight references are unique', new Set(data.items.map((i) => i.type + ':' + i.id)).size === data.items.length);
check('Spotlight lives in the tool/model registries only', data.items.every((i) => i.type === 'tool' || i.type === 'model'));
check('Every Spotlight item resolves to a registry record', data.items.every((i) => resolve(i.type, i.id)), data.items.filter((i) => !resolve(i.type, i.id)).map((i) => i.type + ':' + i.id).join(','));
check('Spotlight registry fields match the canonical record', data.items.every((i) => {
  const record = resolve(i.type, i.id);
  return record && record.name === i.name && record.category === i.category && record.official_url === i.officialUrl;
}));
check('Official URLs are https', data.items.every((i) => /^https:\/\/[^\s]+$/.test(i.officialUrl)));
check('Record links follow registry detail routes', data.items.every((i) => new RegExp(`^${i.type === 'tool' ? 'ai-tools.html#tool' : 'models.html#model'}/`).test(i.detailPath)));
check('Descriptions are substantive', data.items.every((i) => typeof i.description === 'string' && i.description.length > 40));
check('Badges are limited to the approved set', data.items.every((i) => ['NEW', 'PREVIEW', 'EARLY ACCESS'].includes(i.badge)), [...new Set(data.items.map((i) => i.badge))].join(','));
const parseRelease = (value) => Date.parse(value.length === 7 ? value + '-01' : value);
check('Release dates are real dates', data.items.every((i) => /^\d{4}-\d{2}(-\d{2})?$/.test(i.released) && !Number.isNaN(parseRelease(i.released))));
check('First-seen is not after review', data.items.every((i) => i.firstSeen <= data.lastReviewed));
check('All items reviewed today', data.items.every((i) => i.lastReviewed === data.lastReviewed));
check('Spotlight copy uses the approved eyebrow', data.eyebrow === 'NEXUS SPOTLIGHT', data.eyebrow);
check('Spotlight copy uses the approved title', data.title === "Discover What's Worth Exploring", data.title);

/* ---------- Static markup ---------- */
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
check('Static section is present', /id="nexus-spotlight"/.test(html));
check('22 static Spotlight cards', (html.match(/class="spotlight-card"/g) || []).length === 22, String((html.match(/class="spotlight-card"/g) || []).length));
check('Three static filters', (html.match(/data-spotlight-filter=/g) || []).length === 3);
check('Weekly branding is gone', !/CURATED WEEKLY|Resources of the Week|resources-of-the-week|featured-week-grid/i.test(html));
check('Spotlight sits before the featured collection', html.indexOf('id="nexus-spotlight"') < html.indexOf('id="featured-collection"'));

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const consoleErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push('console: ' + message.text()); });
  page.on('pageerror', (error) => consoleErrors.push('pageerror: ' + error.message));

  await page.goto(HOME, { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  /* ---------- Section contract ---------- */
  const section = await page.evaluate(() => {
    const s = document.getElementById('nexus-spotlight');
    const cards = [...s.querySelectorAll('.spotlight-card')];
    const filters = [...s.querySelectorAll('[data-spotlight-filter]')];
    const sourceLinks = [...s.querySelectorAll('a[target="_blank"]')];
    const recordLinks = [...s.querySelectorAll('.spotlight-link--record')];
    return {
      eyebrow: s.querySelector('.spotlight-eyebrow')?.textContent.trim() || '',
      title: s.querySelector('.spotlight-title')?.textContent.trim() || '',
      lede: s.querySelector('.spotlight-lede')?.textContent.trim() || '',
      support: s.querySelector('.spotlight-support')?.textContent.trim() || '',
      labelledby: s.getAttribute('aria-labelledby'),
      h2: s.querySelectorAll('h2').length,
      h3: cards.filter((card) => card.querySelector('h3.spotlight-name')).length,
      meta: [...s.querySelectorAll('.spotlight-meta-value')].map((el) => el.textContent.trim()),
      cards: cards.length,
      filters: filters.map((button) => ({
        key: button.dataset.spotlightFilter,
        label: button.dataset.spotlightLabel,
        pressed: button.getAttribute('aria-pressed'),
        type: button.getAttribute('type'),
        count: button.querySelector('.spotlight-filter-count')?.textContent
      })),
      sourceOk: sourceLinks.length === 22 && sourceLinks.every((a) => /^https:\/\//.test(a.href) && a.rel === 'noopener noreferrer'),
      recordOk: recordLinks.length === 22 && recordLinks.every((a) => /^(ai-tools|models)\.html#(tool|model)\//.test(a.getAttribute('href')) && a.getAttribute('aria-label')),
      descriptions: cards.every((card) => (card.querySelector('.spotlight-desc')?.textContent || '').length > 40),
      sectionOrder: ['coverage', 'nexus-spotlight', 'featured-collection']
        .map((id) => document.getElementById(id)?.getBoundingClientRect().top)
    };
  });

  check('Section renders', section.cards === 22, String(section.cards));
  check('Eyebrow copy', section.eyebrow === 'NEXUS SPOTLIGHT', section.eyebrow);
  check('Heading copy', section.title === "Discover What's Worth Exploring", section.title);
  check('Description copy', section.lede === 'Explore noteworthy AI tools, models, and developer resources selected for their relevance, practical value, and potential impact on modern technology workflows.', section.lede);
  check('Supporting copy', section.support === 'From newly released AI models to useful developer platforms, Nexus Spotlight brings noteworthy discoveries together and connects them to the broader DevSpire Nexus resource ecosystem.', section.support);
  check('Section labelled by heading', section.labelledby === 'nexus-spotlight-title', section.labelledby);
  check('One section h2 and 22 card h3s', section.h2 === 1 && section.h3 === 22, `${section.h2}/${section.h3}`);
  check('Scope meta shows 22 / 17 / 5', section.meta.join(',') === '22,17,5', section.meta.join(','));
  check('Three filter buttons', section.filters.length === 3 && section.filters.every((f) => f.type === 'button'));
  check('Filter counts are correct', section.filters.map((f) => f.key + ':' + f.count).join(',') === 'all:22,model:17,tool:5', section.filters.map((f) => f.key + ':' + f.count).join(','));
  check('Exactly one pressed filter', section.filters.filter((f) => f.pressed === 'true').length === 1);
  check('22 safe official source links', section.sourceOk);
  check('22 registry record links with labels', section.recordOk);
  check('Cards carry descriptions', section.descriptions);
  check('Order coverage → Spotlight → featured collection', section.sectionOrder.every((top, i, all) => i === 0 || (top != null && top > all[i - 1])), section.sectionOrder.join(','));

  /* ---------- Filtering ---------- */
  const filterState = async () => page.evaluate(() => ({
    visible: [...document.querySelectorAll('#spotlight-grid .spotlight-card')].filter((card) => !card.hidden).length,
    hiddenDisplay: [...document.querySelectorAll('#spotlight-grid .spotlight-card')].filter((card) => card.hidden).every((card) => getComputedStyle(card).display === 'none'),
    pressed: [...document.querySelectorAll('[data-spotlight-filter][aria-pressed="true"]')].map((button) => button.dataset.spotlightFilter),
    status: document.getElementById('spotlight-status').textContent,
    emptyHidden: document.getElementById('spotlight-empty').hidden
  }));

  await page.click('[data-spotlight-filter="model"]');
  await page.waitForTimeout(80);
  const modelsOnly = await filterState();
  check('Models filter shows 17', modelsOnly.visible === 17, String(modelsOnly.visible));
  check('Models filter hides the rest', modelsOnly.hiddenDisplay);
  check('Models filter status', modelsOnly.pressed.join(',') === 'model' && modelsOnly.status === 'Showing 17 of 22 discoveries in Models', `${modelsOnly.pressed}/${modelsOnly.status}`);
  check('Empty state stays hidden', modelsOnly.emptyHidden);

  await page.click('[data-spotlight-filter="tool"]');
  await page.waitForTimeout(80);
  const toolsOnly = await filterState();
  check('Tools filter shows 5', toolsOnly.visible === 5, String(toolsOnly.visible));
  check('Tools filter status', toolsOnly.status === 'Showing 5 of 22 discoveries in Tools', toolsOnly.status);

  await page.evaluate(() => document.querySelector('[data-spotlight-filter="model"]').focus());
  await page.keyboard.press('Enter');
  await page.waitForTimeout(80);
  check('Keyboard Enter activates a filter', (await filterState()).pressed.join(',') === 'model');

  await page.click('[data-spotlight-filter="all"]');
  await page.waitForTimeout(80);
  const restored = await filterState();
  check('All restores 22', restored.visible === 22 && restored.status === 'Showing all 22 discoveries', `${restored.visible}/${restored.status}`);

  /* ---------- Registry integration ---------- */
  await page.goto(BASE + 'ai-tools.html#tool/elevenai', { waitUntil: 'load' });
  await page.waitForTimeout(700);
  const toolDetail = await page.evaluate(() => ({
    open: !document.getElementById('detail-modal').hidden,
    title: (document.getElementById('detail-title') || {}).textContent?.trim(),
    record: document.getElementById('detail-content')?.dataset.recordId,
    toolCount: window.AI_TOOLS.length,
    hasRecord: window.AI_TOOLS.some((record) => record.id === 'elevenai'),
    uniqueIds: new Set(window.AI_TOOLS.map((record) => record.id)).size === window.AI_TOOLS.length
  }));
  check('Tool detail route opens the new record', toolDetail.open && toolDetail.title.replace(/\s+/g, ' ').trim().startsWith('ElevenAI') && toolDetail.record === 'elevenai', JSON.stringify(toolDetail));
  check('AI Tools registry now has 408 unique records', toolDetail.toolCount === 408 && toolDetail.uniqueIds && toolDetail.hasRecord, `${toolDetail.toolCount}/${toolDetail.uniqueIds}`);

  await page.fill('#tool-search', 'ElevenAI');
  await page.waitForTimeout(400);
  check('New tool is searchable', /of 1\b|of [1-9]/.test(await page.textContent('#results-count')) && (await page.locator('#tool-grid article').count()) >= 1, (await page.textContent('#results-count')).trim());

  await page.goto(BASE + 'models.html#model/gemini-4-hydrogen', { waitUntil: 'load' });
  await page.waitForTimeout(700);
  const modelDetail = await page.evaluate(() => ({
    open: !document.getElementById('detail-modal').hidden,
    title: (document.getElementById('detail-title') || {}).textContent?.trim(),
    record: document.getElementById('detail-content')?.dataset.recordId,
    modelCount: window.AI_MODELS.length,
    hasRecord: window.AI_MODELS.some((record) => record.id === 'gemini-4-hydrogen'),
    uniqueIds: new Set(window.AI_MODELS.map((record) => record.id)).size === window.AI_MODELS.length
  }));
  check('Model detail route opens the new record', modelDetail.open && modelDetail.title.replace(/\s+/g, ' ').trim().startsWith('Gemini 4 Hydrogen') && modelDetail.record === 'gemini-4-hydrogen', JSON.stringify(modelDetail));
  check('AI Models registry now has 317 unique records', modelDetail.modelCount === 317 && modelDetail.uniqueIds && modelDetail.hasRecord, `${modelDetail.modelCount}/${modelDetail.uniqueIds}`);

  await page.fill('#model-search', 'Hydrogen');
  await page.waitForTimeout(400);
  check('New model is searchable', (await page.locator('#model-grid article').count()) >= 1, (await page.textContent('#results-count')).trim());

  await page.goto(HOME, { waitUntil: 'load' });
  await page.waitForTimeout(800);

  /* ---------- Responsive ---------- */
  for (const width of VIEWPORTS) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(220);
    const metrics = await page.evaluate(() => {
      const s = document.getElementById('nexus-spotlight');
      const cards = [...s.querySelectorAll('.spotlight-card')];
      const grid = s.querySelector('.spotlight-grid');
      const rect = s.getBoundingClientRect();
      return {
        pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        sectionFits: rect.left >= -1 && rect.right <= window.innerWidth + 1,
        clipped: cards.filter((card) => {
          const box = card.getBoundingClientRect();
          return box.left < -1 || box.right > window.innerWidth + 1;
        }).length,
        overflowingCards: cards.filter((card) => card.scrollWidth > card.clientWidth + 1).length,
        cardMinWidth: Math.min(...cards.map((card) => Math.round(card.getBoundingClientRect().width))),
        columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
        metaFits: (() => {
          const box = s.querySelector('.spotlight-meta').getBoundingClientRect();
          return box.left >= -1 && box.right <= window.innerWidth + 1;
        })(),
        filtersFit: (() => {
          const box = s.querySelector('.spotlight-filters').getBoundingClientRect();
          return box.left >= -1 && box.right <= window.innerWidth + 1;
        })()
      };
    });
    check(`${width}px: no horizontal page overflow`, metrics.pageOverflow <= 1, String(metrics.pageOverflow));
    check(`${width}px: Spotlight stays inside the viewport`, metrics.sectionFits);
    check(`${width}px: no clipped Spotlight cards`, metrics.clipped === 0, String(metrics.clipped));
    check(`${width}px: no card content overflow`, metrics.overflowingCards === 0, String(metrics.overflowingCards));
    check(`${width}px: usable card width`, metrics.cardMinWidth >= 240, `${metrics.cardMinWidth}px`);
    check(`${width}px: meta rail fits`, metrics.metaFits);
    check(`${width}px: filters fit`, metrics.filtersFit);
    console.log(`VIEWPORT ${width}: ${metrics.columns} columns, min card ${metrics.cardMinWidth}px, page overflow ${metrics.pageOverflow}`);
  }

  check('No console or page errors', consoleErrors.length === 0, consoleErrors.join(' | '));

  await browser.close();

  console.log(`\n${passed} checks passed, ${failures.length} failed.`);
  if (failures.length) {
    console.log('FAILURES');
    failures.forEach((failure) => console.log(`- ${failure.name}${failure.detail ? `: ${failure.detail}` : ''}`));
    process.exit(1);
  }
})().catch((error) => {
  console.error('QA RUN CRASHED', error);
  process.exit(1);
});
