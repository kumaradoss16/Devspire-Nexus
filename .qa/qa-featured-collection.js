/* QA for the Featured Editorial Collection.
   Run from the project root: node .qa/qa-featured-collection.js */
const { chromium } = require('playwright-core');
const { pathToFileURL } = require('url');
const path = require('path');
const fs = require('fs');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const EXE = path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1248/chrome-win64/chrome.exe');
const PAGE = pathToFileURL(path.join(ROOT, 'index.html')).href;
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

const loadData = () => {
  const context = { window: {} };
  vm.createContext(context);
  ['data/ai-tools.js', 'data/ai-models.js', 'data/developer-resources.js', 'data/featured-collection.js']
    .forEach((file) => vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file }));
  return context.window;
};

const win = loadData();
const collection = win.DSH_EDITORIAL_COLLECTION;
const today = new Date().toISOString().slice(0, 10);

/* ---------- Content and data ---------- */
check('Editorial data module exists', Boolean(collection && collection.platforms), 'window.DSH_EDITORIAL_COLLECTION missing');
check('Exactly 21 platform entries', collection.platforms.length === 21, `found ${collection.platforms.length}`);
check('Six editorial categories', collection.categories.length === 6, `found ${collection.categories.length}`);
check('Unique platform ids', new Set(collection.platforms.map((p) => p.id)).size === 21);
check('Unique platform names', new Set(collection.platforms.map((p) => p.name)).size === 21);
check('Unique official URLs', new Set(collection.platforms.map((p) => p.officialUrl)).size === 21);
check('Collection lastReviewed is today', collection.lastReviewed === today, `expected ${today}, found ${collection.lastReviewed}`);
check('Title is not a ranking claim', !/\btop\b/i.test(collection.title), collection.title);

const categoryIds = new Set(collection.categories.map((c) => c.id));
collection.platforms.forEach((platform) => {
  check(`${platform.name}: category resolves`, categoryIds.has(platform.category), platform.category);
  check(`${platform.name}: https official URL`, /^https:\/\/[^\s]+$/.test(platform.officialUrl), platform.officialUrl);
  check(`${platform.name}: description present`, typeof platform.description === 'string' && platform.description.length > 20);
  check(`${platform.name}: bestFor present`, typeof platform.bestFor === 'string' && platform.bestFor.length > 10);
  check(`${platform.name}: no placeholder copy`, !/\b(TBD|TODO|Lorem|placeholder)\b/i.test(`${platform.description} ${platform.bestFor}`));
  if (platform.registry) {
    const records = win[{ tool: 'AI_TOOLS', model: 'AI_MODELS', resource: 'DEVELOPER_RESOURCES' }[platform.registry.type]] || [];
    check(`${platform.name}: registry ${platform.registry.type}:${platform.registry.id} exists`,
      records.some((r) => r.id === platform.registry.id), 'missing registry record');
  }
  if (platform.logo) {
    check(`${platform.name}: logo file exists`, fs.existsSync(path.join(ROOT, platform.logo)), platform.logo);
  }
});

const expectedCounts = Object.fromEntries(collection.categories.map((category) => [
  category.id,
  collection.platforms.filter((platform) => platform.category === category.id).length
]));
const expectedRegistryLinks = collection.platforms.filter((platform) => platform.registry).length;
const expectedFallbacks = collection.platforms.filter((platform) => !platform.logo).length;

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const consoleErrors = [];
  const intentionalErrors = [];
  let intentionalLogoFailure = false;
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const entry = `console: ${message.text()}`;
    (intentionalLogoFailure ? intentionalErrors : consoleErrors).push(entry);
  });
  page.on('pageerror', (error) => {
    const entry = `pageerror: ${error.message}`;
    (intentionalLogoFailure ? intentionalErrors : consoleErrors).push(entry);
  });

  await page.goto(PAGE, { waitUntil: 'load' });
  await page.waitForTimeout(1200);

  /* ---------- Static document checks ---------- */
  const doc = await page.evaluate(() => ({
    title: document.title,
    canonical: (document.querySelector('link[rel="canonical"]') || {}).href,
    h1: (document.querySelector('h1') || {}).textContent,
    uniqueIds: (() => {
      const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
      return ids.length === new Set(ids).size;
    })(),
    grids: {
      spotlight: document.querySelectorAll('#spotlight-grid > .spotlight-card').length,
      resources: document.querySelectorAll('#resource-grid > *').length,
      snapshots: document.querySelectorAll('#snapshot-grid > *').length,
      tableRows: document.querySelectorAll('#resource-table-body tr').length,
      coverage: document.querySelectorAll('#coverage-tools li').length
    },
    navLinks: document.querySelectorAll('header nav[aria-label="Primary"] a').length,
    footerNavs: document.querySelectorAll('footer nav').length,
    footerAttribution: (document.querySelector('footer') || {}).textContent || '',
    search: Boolean(document.getElementById('resource-search'))
  }));
  check('Homepage title preserved', doc.title === 'DevSpire Nexus | AI Intelligence Directory', doc.title);
  check('Homepage canonical preserved', doc.canonical === 'https://devspirehub.com/', doc.canonical);
  check('Homepage h1 preserved', (doc.h1 || '').trim() === 'DevSpire Nexus', doc.h1);
  check('No duplicate element ids', doc.uniqueIds);
  check('Nexus Spotlight renders 22 cards', doc.grids.spotlight === 22, String(doc.grids.spotlight));
  check('Featured resources still render 4 cards', doc.grids.resources === 4, String(doc.grids.resources));
  check('Catalog snapshot still renders 4 cards', doc.grids.snapshots === 4, String(doc.grids.snapshots));
  check('Featured table still renders 4 rows', doc.grids.tableRows === 4, String(doc.grids.tableRows));
  check('Category coverage still renders', doc.grids.coverage > 0, String(doc.grids.coverage));
  check('Primary navigation preserved', doc.navLinks === 7, String(doc.navLinks));
  check('Footer navigation preserved', doc.footerNavs === 4, String(doc.footerNavs));
  check('Site footer attribution preserved', doc.footerAttribution.includes('DevSpire Nexus is a product of DevSpireHub.com.'));
  check('Search input preserved', doc.search);

  /* ---------- Section content ---------- */
  const section = await page.evaluate(() => {
    const s = document.getElementById('featured-collection');
    if (!s) return { missing: true };
    const cards = [...s.querySelectorAll('.editorial-card')];
    const filters = [...s.querySelectorAll('[data-collection-filter]')];
    const external = [...s.querySelectorAll('.editorial-link--external')];
    const internal = [...s.querySelectorAll('.editorial-link--internal')];
    const imgs = [...s.querySelectorAll('.editorial-logo img')];
    const regOk = internal.every((a) => {
      const match = (a.getAttribute('href') || '').match(/^(ai-tools|developer-resources)\.html#(tool|resource)\/(.+)$/);
      if (!match) return false;
      const list = match[1] === 'ai-tools' ? window.AI_TOOLS : window.DEVELOPER_RESOURCES;
      return Array.isArray(list) && list.some((record) => record.id === decodeURIComponent(match[3]));
    });
    return {
      missing: false,
      eyebrow: (s.querySelector('.editorial-eyebrow') || {}).textContent.trim(),
      heading: (s.querySelector('h2') || {}).textContent.trim(),
      lede: (s.querySelector('.editorial-lede') || {}).textContent.trim(),
      introParagraphs: s.querySelectorAll('.editorial-intro p').length,
      quote: (s.querySelector('.editorial-quote blockquote p') || {}).textContent.trim(),
      quoteInHtml: Boolean(s.querySelector('blockquote')),
      disclaimer: (s.querySelector('.editorial-disclaimer') || {}).textContent.trim(),
      lastReviewed: s.querySelector('.editorial-reviewed time')?.getAttribute('datetime'),
      lastReviewedText: (s.querySelector('.editorial-reviewed') || {}).textContent.trim(),
      cta: {
        href: s.querySelector('.editorial-cta')?.getAttribute('href'),
        text: (s.querySelector('.editorial-cta') || {}).textContent.trim()
      },
      cards: cards.length,
      cardsVisible: cards.filter((card) => !card.hidden).length,
      cardIds: cards.map((card) => card.dataset.collectionId),
      cardCategories: [...new Set(cards.map((card) => card.dataset.collectionCategory))].sort(),
      h3Count: s.querySelectorAll('h3').length,
      h2Count: s.querySelectorAll('h2').length,
      filters: filters.map((button) => ({
        key: button.dataset.collectionFilter,
        label: button.dataset.collectionLabel,
        pressed: button.getAttribute('aria-pressed'),
        type: button.getAttribute('type'),
        count: button.querySelector('.editorial-filter-count')?.textContent,
        height: Math.round(button.getBoundingClientRect().height)
      })),
      pressedCount: filters.filter((button) => button.getAttribute('aria-pressed') === 'true').length,
      external: external.map((a) => ({
        href: a.getAttribute('href'),
        target: a.getAttribute('target'),
        rel: a.getAttribute('rel'),
        label: a.getAttribute('aria-label')
      })),
      internalCount: internal.length,
      registryLinksResolve: regOk,
      imgs: imgs.map((img) => ({
        alt: img.getAttribute('alt'),
        width: img.getAttribute('width'),
        height: img.getAttribute('height'),
        loading: img.getAttribute('loading')
      })),
      fallbacksVisible: s.querySelectorAll('.editorial-logo-fallback:not([hidden])').length,
      sectionLabel: s.getAttribute('aria-labelledby'),
      meta: [...s.querySelectorAll('.editorial-meta-item')].map((el) => el.textContent.trim())
    };
  });

  check('Section renders on homepage', !section.missing);
  check('Eyebrow copy', section.eyebrow.includes('FEATURED EDITORIAL COLLECTION'), section.eyebrow);
  check('Section heading', section.heading === '21 AI Platforms Worth Knowing', section.heading);
  check('Supporting description present', section.lede.startsWith('Discover a curated selection'));
  check('Editorial introduction has two paragraphs', section.introParagraphs === 2, String(section.introParagraphs));
  check('Quote is actual HTML text', section.quoteInHtml && section.quote.length > 120, String(section.quote.length));
  check('Disclaimer present', section.disclaimer.includes('not an objective ranking'));
  check('Last reviewed date is actual', section.lastReviewed === today, section.lastReviewed);
  check('Last reviewed date is readable', section.lastReviewedText.includes('14 November 2026'), section.lastReviewedText);
  check('Registry CTA points to AI Tools', section.cta.href === 'ai-tools.html' && section.cta.text.includes('Explore All AI Tools'), JSON.stringify(section.cta));
  check('21 cards rendered', section.cards === 21, String(section.cards));
  check('All 21 cards visible by default', section.cardsVisible === 21, String(section.cardsVisible));
  check('21 unique card ids', new Set(section.cardIds).size === 21);
  check('Cards cover all six categories', section.cardCategories.length === 6, section.cardCategories.join(', '));
  check('One section h2, 21 card h3s', section.h2Count === 1 && section.h3Count === 21, `${section.h2Count}/${section.h3Count}`);
  check('Section labelled by its heading', section.sectionLabel === 'featured-collection-title', section.sectionLabel);
  check('Seven filter buttons', section.filters.length === 7, String(section.filters.length));
  check('Filter counts match data', section.filters.every((filter) => {
    const expected = filter.key === 'all' ? 21 : expectedCounts[filter.key];
    return Number(filter.count) === expected;
  }), JSON.stringify(section.filters.map((f) => [f.key, f.count])));
  check('Filters are real buttons', section.filters.every((filter) => filter.type === 'button'));
  check('Exactly one pressed filter', section.pressedCount === 1, String(section.pressedCount));
  check('Filter touch targets >= 40px', section.filters.every((filter) => filter.height >= 40), JSON.stringify(section.filters.map((f) => f.height)));
  check('21 official website links', section.external.length === 21, String(section.external.length));
  check('Official links are https', section.external.every((link) => /^https:\/\//.test(link.href)));
  check('Official links open in new tab with rel noopener noreferrer', section.external.every((link) => link.target === '_blank' && link.rel === 'noopener noreferrer'));
  check('Official links have accessible labels', section.external.every((link) => link.label && link.label.includes('opens in a new tab')));
  check('Registry links only match real records', section.registryLinksResolve);
  check(`Exactly ${expectedRegistryLinks} registry links`, section.internalCount === expectedRegistryLinks, String(section.internalCount));
  check('Logos reserve dimensions and lazy-load', section.imgs.length > 0 && section.imgs.every((img) => img.width && img.height && img.loading === 'lazy'));
  check('Every logo has alternative text', section.imgs.every((img) => img.alt && img.alt.endsWith('logo')));
  check(`Fallback initials for ${expectedFallbacks} platforms`, section.fallbacksVisible === expectedFallbacks, String(section.fallbacksVisible));
  check('Collection metadata', section.meta.some((m) => m.includes('21') && m.includes('Platforms')) && section.meta.some((m) => m.includes('6') && m.includes('Categories')), section.meta.join(' | '));

  /* ---------- Filtering behaviour ---------- */
  for (const category of collection.categories) {
    await page.click(`[data-collection-filter="${category.id}"]`);
    await page.waitForTimeout(80);
    const state = await page.evaluate(() => ({
      visible: [...document.querySelectorAll('.editorial-card')].filter((card) => !card.hidden).length,
      hiddenDisplay: [...document.querySelectorAll('.editorial-card')].filter((card) => card.hidden).every((card) => getComputedStyle(card).display === 'none'),
      pressed: [...document.querySelectorAll('.editorial-filter[aria-pressed="true"]')].map((button) => button.dataset.collectionFilter),
      status: document.getElementById('editorial-status').textContent,
      emptyHidden: document.getElementById('editorial-empty').hidden
    }));
    check(`Filter ${category.label} shows ${expectedCounts[category.id]}`, state.visible === expectedCounts[category.id], String(state.visible));
    check(`Filter ${category.label} hides other cards`, state.hiddenDisplay);
    check(`Filter ${category.label} has one pressed state`, state.pressed.length === 1 && state.pressed[0] === category.id, state.pressed.join(','));
    check(`Filter ${category.label} status text`, state.status.includes(String(expectedCounts[category.id])) && state.status.includes(category.label), state.status);
    check('Empty state stays hidden with data', state.emptyHidden);
  }

  await page.click('[data-collection-filter="automation-workflows"]');
  const firstRun = await page.evaluate(() => [...document.querySelectorAll('.editorial-card')].filter((card) => !card.hidden).map((card) => card.dataset.collectionId).join(','));
  await page.click('[data-collection-filter="automation-workflows"]');
  const secondRun = await page.evaluate(() => [...document.querySelectorAll('.editorial-card')].filter((card) => !card.hidden).map((card) => card.dataset.collectionId).join(','));
  check('Filtering is deterministic on repeat', firstRun === secondRun && firstRun === 'zapier,n8n', `${firstRun} / ${secondRun}`);

  await page.evaluate(() => document.querySelector('[data-collection-filter="marketing-content"]').focus());
  await page.keyboard.press('Enter');
  await page.waitForTimeout(80);
  const enterState = await page.evaluate(() => ({
    pressed: document.querySelector('.editorial-filter[aria-pressed="true"]').dataset.collectionFilter,
    visible: [...document.querySelectorAll('.editorial-card')].filter((card) => !card.hidden).length
  }));
  check('Keyboard Enter activates a filter', enterState.pressed === 'marketing-content' && enterState.visible === 3, JSON.stringify(enterState));

  await page.click('[data-collection-filter="all"]');
  const restored = await page.evaluate(() => ({
    visible: [...document.querySelectorAll('.editorial-card')].filter((card) => !card.hidden).length,
    status: document.getElementById('editorial-status').textContent
  }));
  check('All Platforms restores 21 cards', restored.visible === 21 && restored.status.includes('21'), JSON.stringify(restored));

  /* ---------- Keyboard focus visibility ---------- */
  await page.evaluate(() => document.querySelector('[data-collection-filter="ai-assistants-research"]').scrollIntoView({ block: 'center' }));
  let focusVisible = false;
  for (let i = 0; i < 90; i += 1) {
    await page.keyboard.press('Tab');
    const state = await page.evaluate(() => {
      const active = document.activeElement;
      if (!active || !active.hasAttribute('data-collection-filter')) return null;
      const style = getComputedStyle(active);
      return { outlineWidth: parseFloat(style.outlineWidth), outlineStyle: style.outlineStyle };
    });
    if (state) {
      focusVisible = state.outlineWidth >= 2 && state.outlineStyle !== 'none';
      break;
    }
  }
  check('Keyboard focus ring is visible on filters', focusVisible);

  /* ---------- Responsive validation ---------- */
  for (const width of VIEWPORTS) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(200);
    const metrics = await page.evaluate(() => {
      const s = document.getElementById('featured-collection');
      const cards = [...s.querySelectorAll('.editorial-card')];
      const grid = s.querySelector('.editorial-grid');
      const filters = s.querySelector('.editorial-filters');
      const cardOverflow = cards.filter((card) => card.scrollWidth > card.clientWidth + 1).map((card) => card.dataset.collectionId);
      const clipped = cards.filter((card) => {
        const rect = card.getBoundingClientRect();
        return rect.left < -1 || rect.right > window.innerWidth + 1;
      }).map((card) => card.dataset.collectionId);
      const quote = s.querySelector('.editorial-quote').getBoundingClientRect();
      return {
        pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
        cardOverflow,
        clipped,
        filterScrolls: filters.scrollWidth > filters.clientWidth,
        filterScrollWidth: filters.scrollWidth,
        filterClientWidth: filters.clientWidth,
        quoteFits: quote.left >= -1 && quote.right <= window.innerWidth + 1,
        cardMinWidth: Math.min(...cards.map((card) => Math.round(card.getBoundingClientRect().width)))
      };
    });
    check(`${width}px: no horizontal page overflow`, metrics.pageOverflow <= 1, `overflow ${metrics.pageOverflow}`);
    check(`${width}px: no card overflow`, metrics.cardOverflow.length === 0, metrics.cardOverflow.join(','));
    check(`${width}px: no clipped cards`, metrics.clipped.length === 0, metrics.clipped.join(','));
    check(`${width}px: quote fits viewport`, metrics.quoteFits);
    check(`${width}px: cards keep usable width`, metrics.cardMinWidth >= 260, `${metrics.cardMinWidth}px`);
    check(`${width}px: grid uses ${metrics.columns} column(s)`, metrics.columns >= 1);
    if (width <= 640) {
      check(`${width}px: filter row scrolls instead of wrapping`, metrics.filterScrolls || metrics.filterScrollWidth <= metrics.filterClientWidth, `${metrics.filterScrollWidth}/${metrics.filterClientWidth}`);
    }
    console.log(`VIEWPORT ${width}: ${metrics.columns} columns, min card ${metrics.cardMinWidth}px, page overflow ${metrics.pageOverflow}, filter scroll ${metrics.filterScrolls}`);
  }

  /* ---------- Logo failure fallback ---------- */
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.waitForTimeout(150);
  const fallbackBefore = await page.evaluate(() => document.querySelectorAll('.editorial-logo-fallback:not([hidden])').length);
  intentionalLogoFailure = true;
  await page.evaluate(() => {
    const img = document.querySelector('.editorial-card[data-collection-id="chatgpt"] .editorial-logo img');
    if (img) img.src = 'assets/img/icons/__missing-logo__.png';
  });
  await page.waitForTimeout(500);
  const fallbackAfter = await page.evaluate(() => {
    const card = document.querySelector('.editorial-card[data-collection-id="chatgpt"]');
    const img = card.querySelector('.editorial-logo img');
    const fallback = card.querySelector('.editorial-logo-fallback');
    return {
      imgRemoved: !img,
      fallbackVisible: fallback ? !fallback.hidden && fallback.offsetParent !== null : false,
      visible: [...document.querySelectorAll('.editorial-logo-fallback:not([hidden])')].length
    };
  });
  check('Missing logo falls back to initials', fallbackAfter.imgRemoved && fallbackAfter.fallbackVisible && fallbackAfter.visible === fallbackBefore + 1, JSON.stringify(fallbackAfter));
  intentionalLogoFailure = false;

  /* ---------- Existing homepage interactions ---------- */
  await page.fill('#resource-search', 'cursor');
  await page.waitForTimeout(400);
  const search = await page.evaluate(() => ({
    hidden: document.getElementById('search-results').hidden,
    summary: document.getElementById('search-results-summary').textContent,
    results: document.querySelectorAll('#search-results-list li').length
  }));
  check('Cross-registry search still works', !search.hidden && search.results > 0 && /match/i.test(search.summary), JSON.stringify(search));
  await page.click('#search-results-close');

  const positions = await page.evaluate(() => {
    const ids = ['coverage', 'nexus-spotlight', 'featured-collection'];
    const rects = ids.map((id) => document.getElementById(id).getBoundingClientRect());
    return rects[0].bottom <= rects[1].top && rects[1].bottom <= rects[2].top;
  });
  check('Section order does not disrupt homepage flow', positions);

  await page.click('[data-view="table"]');
  await page.waitForTimeout(120);
  const tableToggle = await page.evaluate(() => ({
    tableVisible: !document.getElementById('resource-table-wrap').hidden,
    gridHidden: document.getElementById('resource-grid').hidden,
    pressed: document.querySelector('[data-view="table"]').getAttribute('aria-pressed')
  }));
  check('Existing grid/table toggle still works', tableToggle.tableVisible && tableToggle.gridHidden && tableToggle.pressed === 'true', JSON.stringify(tableToggle));
  await page.click('[data-view="grid"]');

  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(150);
  await page.click('#menu-toggle');
  const menuOpen = await page.evaluate(() => ({
    visible: !document.getElementById('mobile-menu').hidden,
    expanded: document.getElementById('menu-toggle').getAttribute('aria-expanded')
  }));
  check('Existing mobile menu still opens', menuOpen.visible && menuOpen.expanded === 'true', JSON.stringify(menuOpen));
  await page.click('#menu-toggle');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.waitForTimeout(150);

  check('No console errors or page errors', consoleErrors.length === 0, consoleErrors.join(' | '));

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
