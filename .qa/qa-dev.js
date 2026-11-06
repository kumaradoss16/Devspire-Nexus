const { chromium } = require('playwright-core');
const EXE = process.env.LOCALAPPDATA + '/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
const URL = 'file:///H:/Devspirehub AI/developer-resources.html';

let results = [];
const assert = (name, cond, extra) => {
  results.push({ name, pass: !!cond, extra: extra || '' });
  if (!cond) console.error('FAIL:', name, extra || '');
};

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const consoleErrors = [];

  /* ---------- Responsive sweep ---------- */
  for (const width of [320, 375, 480, 768, 1024, 1280, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on('pageerror', (e) => consoleErrors.push(width + ': ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(width + ': ' + m.text()); });
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const m = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
    assert('no horizontal overflow @' + width, m.scrollW <= m.vw + 1, `scrollW=${m.scrollW} vw=${m.vw}`);
    if (width === 375) {
      const overlap = await page.evaluate(() => {
        const brand = document.querySelector('header a img').getBoundingClientRect();
        const btn = [...document.querySelectorAll('header a')].find((b) => b.textContent.includes('Submit')).getBoundingClientRect();
        return brand.right <= btn.left;
      });
      assert('mobile header: logo does not collide with Submit button', overlap);
    }
    await page.close();
  }

  /* ---------- Main functional pass ---------- */
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => consoleErrors.push('main: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push('main: ' + m.text()); });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const $count = async () => (await page.textContent('#results-count')).trim();
  const n = async () => parseInt((await $count()).match(/of (\d+)/)[1], 10);
  const resetAll = async () => { await page.click('#reset-all-filters'); await page.waitForTimeout(250); };

  const counts = await page.evaluate(() => ({
    total: window.DEVELOPER_RESOURCES.length,
    meta: window.DEVELOPER_RESOURCES_META.count,
    categories: [...new Set(window.DEVELOPER_RESOURCES.map((r) => r.category))].length,
    selfHostable: window.DEVELOPER_RESOURCES.filter((r) => r.self_hostable).length,
    openSource: window.DEVELOPER_RESOURCES.filter((r) => r.open_source).length
  }));
  assert('dataset global matches meta count', await page.evaluate(() => window.DEVELOPER_RESOURCES.length === window.DEVELOPER_RESOURCES_META.count && window.DEVELOPER_RESOURCES.length > 0));
  assert('dataset meta count is the registry length', counts.meta === counts.total, `${counts.meta} vs ${counts.total}`);
  assert('title is Developer Resources', (await page.title()).includes('Developer Resources'));
  assert('catalog chip computed', (await page.textContent('#catalog-chip')).trim() === `${counts.total} Developer Resources Cataloged · ${counts.selfHostable} Self-Hostable · ${counts.openSource} Open Source`, await page.textContent('#catalog-chip'));

  assert('one category pill per normalized category plus All', (await page.locator('#category-pills button').count()) === counts.categories + 1);
  const pillSum = await page.evaluate(() => [...document.querySelectorAll('#category-pills button')].slice(1).reduce((s, b) => s + parseInt(b.textContent.match(/(\d+)\s*$/)[1], 10), 0));
  assert('pill counts sum to dataset size', pillSum === counts.total, 'sum=' + pillSum);
  assert('All Resources active by default', await page.evaluate(() => document.querySelector('#category-pills button').getAttribute('aria-pressed') === 'true'));

  assert('initial results = registry total', (await n()) === counts.total, await $count());
  assert('initial grid shows 9 cards', (await page.locator('#resource-grid article').count()) === 9);
  const totalPages = Math.ceil(counts.total / 9);

  const facetGroups = await page.evaluate(() => [...document.querySelectorAll('[data-facet-group]')].map((g) => g.dataset.facetGroup));
  assert('5 facet groups', facetGroups.join(',') === 'type,language,deployment,licensing,pricing', facetGroups.join(','));
  const facetText = await page.evaluate(() => {
    const out = {};
    document.querySelectorAll('[data-facet-group]').forEach((g) => {
      out[g.dataset.facetGroup] = [...g.querySelectorAll('.facet-row')].map((r) => r.textContent.trim().replace(/\s+/g, ' '));
    });
    return out;
  });
  const facetStats = await page.evaluate(() => {
    const D = window.DEVELOPER_RESOURCES;
    const group = (fn) => D.reduce((a, r) => { const k = fn(r); if (k) a[k] = (a[k] || 0) + 1; return a; }, {});
    const deploy = (r) => (r.local_execution === 'Partial' ? 'Partial Support' : r.self_hostable ? 'Self-Hostable' : 'Managed Cloud');
    const license = (r) => (r.open_source ? 'Open Source' : r.license ? 'Proprietary / Managed' : 'Not stated');
    return {
      type: group((r) => r.resource_type),
      language: group((r) => (r.programming_languages || [])[0]),
      deployment: group(deploy),
      licensing: group(license),
      pricing: group((r) => r.pricing)
    };
  });
  const langCount = (lang) => page.evaluate((lang) => window.DEVELOPER_RESOURCES.filter((r) => (r.programming_languages || []).includes(lang)).length, lang);
  const pythonCount = await langCount('Python');
  assert('facet count: Python ' + pythonCount, facetText.language.some((t) => t === 'Python ' + pythonCount), facetText.language.join(' | '));
  assert('facet count: Open Source ' + facetStats.licensing['Open Source'], facetText.licensing.some((t) => t === 'Open Source ' + facetStats.licensing['Open Source']));
  assert('facet count: Self-Hostable ' + facetStats.deployment['Self-Hostable'], facetText.deployment.some((t) => t === 'Self-Hostable ' + facetStats.deployment['Self-Hostable']));
  assert('facet count: first pricing bucket', facetText.pricing.length === Object.keys(facetStats.pricing).length, facetText.pricing.join(' | '));
  assert('deployment facet sums to dataset', facetText.deployment.reduce((s, t) => s + parseInt(t.match(/(\d+)$/)[1], 10), 0) === counts.total);

  /* Category filter */
  const localCount = await page.evaluate(() => window.DEVELOPER_RESOURCES.filter((r) => r.category === 'Local Runtimes').length);
  await page.click('[data-category="Local Runtimes"]');
  await page.waitForTimeout(250);
  assert('Local Runtimes -> ' + localCount, (await n()) === localCount, await $count());
  assert('category chip appears', (await page.textContent('#active-chips')).includes('Category: Local Runtimes'));
  await resetAll();
  assert('reset restores the registry', (await n()) === counts.total);

  /* Facet combination */
  const clickFacet = async (group, value) => {
    await page.evaluate(([g, v]) => {
      const row = [...document.querySelectorAll(`[data-facet-group="${g}"] .facet-row`)].find((r) => r.querySelector('.truncate')?.textContent.trim() === v);
      row.querySelector('input').click();
    }, [group, value]);
    await page.waitForTimeout(220);
  };
  const dbCount = facetStats.type['Database / Index'];
  await clickFacet('type', 'Database / Index');
  assert('facet Database / Index -> ' + dbCount, (await n()) === dbCount, await $count());
  const dbPython = await page.evaluate(() => window.DEVELOPER_RESOURCES.filter((r) => r.resource_type === 'Database / Index' && (r.programming_languages || []).includes('Python')).length);
  await clickFacet('language', 'Python');
  assert('Database + Python -> ' + dbPython, (await n()) === dbPython, await $count());
  assert('facet badge shows 2', (await page.textContent('#facets-count')).trim() === '2');
  await page.click('#reset-facets');
  await page.waitForTimeout(250);
  assert('reset facets restores the registry', (await n()) === counts.total);

  /* Search */
  const searchExpected = (q) => page.evaluate((q) => {
    const words = q.toLowerCase().split(/\s+/);
    return window.DEVELOPER_RESOURCES.filter((r) => {
      const hay = [r.name, r.description, r.category, r.resource_type, r.resource_subtype, r.license, r.pricing, r.official_url, ...(r.programming_languages || []), ...(r.tags || [])].join(' ').toLowerCase();
      return words.every((w) => hay.includes(w));
    }).length;
  }, q);
  for (const q of ['mcp', 'vector database', 'qdrant']) {
    const expected = await searchExpected(q);
    await page.fill('#dev-search', q);
    await page.waitForTimeout(350);
    assert(`search "${q}" -> ${expected}`, (await n()) === expected, await $count());
  }
  assert('clear button visible with query', await page.evaluate(() => getComputedStyle(document.getElementById('search-clear')).visibility === 'visible'));
  await page.click('#search-clear');
  await page.waitForTimeout(250);
  assert('clear search restores the registry', (await n()) === counts.total);

  /* Sorting */
  const firstCardName = async () => (await page.textContent('#resource-grid article:first-child h2')).trim();
  const sortExpected = await page.evaluate(() => {
    const D = [...window.DEVELOPER_RESOURCES];
    const order = window.DEVELOPER_RESOURCES_META.category_order || [];
    const byName = [...D].sort((a, b) => a.name.localeCompare(b.name));
    return {
      name: byName[0].name,
      nameDesc: byName[byName.length - 1].name,
      category: [...D].sort((a, b) => (order.indexOf(a.category) - order.indexOf(b.category)) || a.name.localeCompare(b.name))[0].name,
      verified: [...D].sort((a, b) => String(b.verified).localeCompare(String(a.verified)) || a.name.localeCompare(b.name))[0].name
    };
  });
  await page.selectOption('#sort-select', 'name');
  await page.waitForTimeout(250);
  assert('sort A-Z first = ' + sortExpected.name, (await firstCardName()) === sortExpected.name, await firstCardName());
  await page.selectOption('#sort-select', 'name-desc');
  await page.waitForTimeout(250);
  assert('sort Z-A first = ' + sortExpected.nameDesc, (await firstCardName()) === sortExpected.nameDesc, await firstCardName());
  await page.selectOption('#sort-select', 'category');
  await page.waitForTimeout(250);
  assert('sort category first = ' + sortExpected.category, (await firstCardName()) === sortExpected.category, await firstCardName());
  await page.selectOption('#sort-select', 'verified');
  await page.waitForTimeout(250);
  const sortOptions = await page.evaluate(() => [...document.querySelectorAll('#sort-select option')].map((o) => o.textContent.trim()));
  assert('sort options are data-backed only', sortOptions.join('|') === 'Recently Verified|Name A-Z|Name Z-A|Category', sortOptions.join('|'));

  /* Pagination */
  assert(`page indicator 1 of ${totalPages}`, (await page.textContent('#page-indicator')).replace(/\s+/g, ' ').trim() === `Page 1 of ${totalPages}`);
  assert('prev disabled on page 1', await page.evaluate(() => document.querySelector('#pagination-controls button:first-child').disabled));
  await page.click('#pagination-controls button:not(:disabled):last-child');
  await page.waitForTimeout(250);
  assert('next -> page 2', (await page.textContent('#page-indicator')).includes(`Page 2 of ${totalPages}`));
  await page.click('#pagination-controls button:first-child');
  await page.waitForTimeout(250);
  assert('prev -> page 1', (await page.textContent('#page-indicator')).includes(`Page 1 of ${totalPages}`));
  for (let i = 1; i < totalPages; i++) { await page.click('#pagination-controls button:not(:disabled):last-child'); await page.waitForTimeout(100); }
  const lastPageCards = counts.total - (totalPages - 1) * 9;
  assert('last page has ' + lastPageCards + ' cards', (await page.locator('#resource-grid article').count()) === lastPageCards, String(await page.locator('#resource-grid article').count()));
  await page.click('#pagination-controls button:first-child');
  await page.waitForTimeout(200);

  /* Quick-start cards */
  const servingCount = await page.evaluate(() => window.DEVELOPER_RESOURCES.filter((r) => r.category === 'Model Serving & Inference').length);
  const mcpCount = await searchExpected('mcp');
  await page.click('[data-quick="local"]');
  await page.waitForTimeout(300);
  assert('quick local -> ' + localCount, (await n()) === localCount);
  await page.click('[data-category="All Resources"]');
  await page.waitForTimeout(200);
  await page.click('[data-quick="serving"]');
  await page.waitForTimeout(300);
  assert('quick serving -> ' + servingCount, (await n()) === servingCount);
  await page.click('[data-category="All Resources"]');
  await page.waitForTimeout(200);
  await page.click('[data-quick="mcp"]');
  await page.waitForTimeout(400);
  assert('quick mcp -> ' + mcpCount, (await n()) === mcpCount);
  assert('quick mcp seeds search box', (await page.inputValue('#dev-search')) === 'mcp');
  await resetAll();

  /* Detail modal */
  const firstRecord = await page.evaluate(() => {
    const D = window.DEVELOPER_RESOURCES;
    const sorted = [...D].sort((a, b) => String(b.verified).localeCompare(String(a.verified)) || a.name.localeCompare(b.name));
    return sorted[0];
  });
  await page.click('#resource-grid article [data-details]');
  await page.waitForTimeout(350);
  const detailName = (await page.textContent('#detail-title span.truncate')).trim();
  assert('detail modal opens with card name', detailName === firstRecord.name, detailName);
  assert('detail hash deep link set', (await page.evaluate(() => location.hash)) === '#resource/' + firstRecord.id);
  const detailText = await page.textContent('#detail-content');
  assert('detail shows category', detailText.includes(firstRecord.category));
  if (firstRecord.notes) assert('detail shows source notes', detailText.includes(firstRecord.notes.slice(0, 24)));
  else assert('detail shows the official link', detailText.includes(firstRecord.official_url));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
  assert('Escape closes detail', await page.evaluate(() => document.getElementById('detail-modal').hidden));
  assert('closing clears hash', (await page.evaluate(() => location.hash)) === '');

  /* Deep link + invalid id */
  await page.goto(URL + '#resource/langchain', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  assert('valid deep link opens LangChain', (await page.textContent('#detail-title span.truncate')).trim() === 'LangChain');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  await page.goto(URL + '#resource/not-a-real-resource', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  assert('invalid deep link shows warning', await page.isVisible('#invalid-state'));
  assert('invalid message names the id', (await page.textContent('#invalid-message')).includes('not-a-real-resource'));
  await page.click('#invalid-dismiss');
  await page.waitForTimeout(200);
  assert('dismiss invalid state', await page.evaluate(() => document.getElementById('invalid-state').hidden));
  assert('dismiss clears hash', (await page.evaluate(() => location.hash)) === '');

  /* Empty state */
  await page.fill('#dev-search', 'zzzznotfound');
  await page.waitForTimeout(400);
  assert('empty state visible when no matches', await page.isVisible('#empty-state'));
  assert('grid hidden when no matches', await page.evaluate(() => document.getElementById('resource-grid').hidden));
  assert('pagination hidden when no matches', await page.evaluate(() => document.getElementById('pagination-bar').hidden));
  await page.click('#empty-reset');
  await page.waitForTimeout(300);
  assert('empty-state reset restores the registry', (await n()) === counts.total);

  /* Links, icons and page integrity */
  const hrefs = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')));
  assert('no dead "#" links on page', !hrefs.some((h) => h === '#'), hrefs.filter((h) => h === '#').length + ' dead links');
  assert('all external links are https', hrefs.filter((h) => h.startsWith('http')).every((h) => h.startsWith('https://')));
  assert('footer attribution present', (await page.textContent('footer')).includes('DevSpire Nexus is a product of DevSpireHub.com.'));
  assert('single h1', (await page.locator('h1').count()) === 1);
  assert('Developer Resources nav marked current', await page.evaluate(() => !!document.querySelector('nav a[aria-current="page"][href="developer-resources.html"]')));
  assert('Submit Resource links to the draft page', await page.evaluate(() => {
    const a = [...document.querySelectorAll('header a')].find((x) => x.textContent.includes('Submit Resource'));
    return a && a.getAttribute('href') === 'submit.html';
  }));
  const bodyText = await page.textContent('body');
  assert('no fabricated mockup counts (584/412/98)', !/584|412|\b98\b/.test(bodyText));
  assert('no fabricated sort/facet concepts', !/GitHub Stars|Ecosystem Adoption|Hardware Target/.test(bodyText));
  assert('no s2 favicon hotlinks in DOM', await page.evaluate(() => [...document.querySelectorAll('img')].every((i) => !i.src.includes('google.com'))));

  /* Icons load on every page */
  let brokenIcons = [];
  for (let p = 0; p < totalPages; p++) {
    const bad = await page.evaluate(() => [...document.querySelectorAll('#resource-grid img')]
      .filter((i) => !i.complete || i.naturalWidth === 0)
      .map((i) => i.getAttribute('src')));
    brokenIcons.push(...bad);
    if (p < totalPages - 1) { await page.click('#pagination-controls button:not(:disabled):last-child'); await page.waitForTimeout(120); }
  }
  assert('all card icons load across ' + totalPages + ' pages', brokenIcons.length === 0, brokenIcons.join(','));
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  /* Every resource opens a details view */
  const detailSweep = await page.evaluate(() => {
    const grid = document.getElementById('resource-grid');
    const pageCount = Math.max(1, Number((document.getElementById('page-indicator').textContent.match(/of\s+(\d+)/) || [])[1]) || 1);
    const seen = new Set();
    const mismatches = [];
    let opened = 0;
    for (let p = 0; p < pageCount; p++) {
      const cards = [...grid.querySelectorAll('article')];
      for (const card of cards) {
        const nameEl = card.querySelector('h2');
        const btn = card.querySelector('[data-details]');
        if (!nameEl || !btn) { mismatches.push('card missing name/details'); continue; }
        const cardName = nameEl.textContent.trim();
        btn.click();
        const modal = !document.getElementById('detail-modal').hidden;
        const titleEl = document.getElementById('detail-title').querySelector('span.truncate');
        const modalName = titleEl ? titleEl.textContent.trim() : '';
        if (!modal || !modalName) mismatches.push(cardName + ':modal');
        if (modalName !== cardName) mismatches.push(cardName + '!=' + modalName);
        seen.add(modalName);
        opened++;
        document.getElementById('detail-close').click();
      }
      if (p < pageCount - 1) {
        const next = document.querySelector('#pagination-controls button:not(:disabled):last-child');
        if (next) next.click();
      }
    }
    return { opened, unique: seen.size, mismatches };
  });
  const openedDetails = detailSweep.opened;
  const mismatches = detailSweep.mismatches;
  const seen = { size: detailSweep.unique };
  assert('details view works for all ' + counts.total + ' resources', openedDetails === counts.total, 'opened ' + openedDetails + ' unique names ' + seen.size);
  assert('details titles match card names', mismatches.length === 0, mismatches.slice(0, 3).join(', '));

  /* Mobile interactions */
  const mobile = await browser.newPage({ viewport: { width: 375, height: 800 } });
  mobile.on('pageerror', (e) => consoleErrors.push('mobile: ' + e.message));
  await mobile.goto(URL, { waitUntil: 'networkidle' });
  await mobile.waitForTimeout(400);
  assert('mobile menu closed initially', await mobile.evaluate(() => document.getElementById('mobile-menu').classList.contains('hidden')));
  await mobile.click('#menu-toggle');
  assert('mobile menu opens', await mobile.evaluate(() => !document.getElementById('mobile-menu').classList.contains('hidden')));
  await mobile.click('#menu-toggle');
  assert('mobile facets hidden initially', await mobile.evaluate(() => document.getElementById('facets-panel').classList.contains('hidden')));
  await mobile.click('#facets-toggle');
  assert('mobile facets drawer opens', await mobile.evaluate(() => !document.getElementById('facets-panel').classList.contains('hidden')));
  await mobile.click('#facets-toggle');
  await mobile.keyboard.press('Control+k');
  assert('Ctrl+K focuses search', await mobile.evaluate(() => document.activeElement.id === 'dev-search'));
  await mobile.close();

  assert('zero console/page errors', consoleErrors.length === 0, consoleErrors.slice(0, 6).join(' | '));

  await browser.close();

  const passed = results.filter((r) => r.pass).length;
  console.log(`\n=== ${passed}/${results.length} checks passed ===`);
  results.filter((r) => !r.pass).forEach((r) => console.log('FAILED:', r.name, '--', r.extra));
  if (passed !== results.length) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
