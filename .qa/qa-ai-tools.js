const { chromium } = require('playwright-core');
const EXE = process.env.LOCALAPPDATA + '/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
const PAGE_URL = 'file:///H:/Devspirehub AI/ai-tools.html';

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
    await page.goto(PAGE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(350);
    const m = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
    assert('no horizontal overflow @' + width, m.scrollW <= m.vw + 1, `scrollW=${m.scrollW} vw=${m.vw}`);
    if (width === 375) {
      const noCollision = await page.evaluate(() => {
        const brand = document.querySelector('header a img').getBoundingClientRect();
        const btn = [...document.querySelectorAll('header a')].find((b) => b.textContent.includes('Submit')).getBoundingClientRect();
        return brand.right <= btn.left;
      });
      assert('mobile header: logo does not collide with Submit button', noCollision);

      await page.click('#menu-toggle');
      await page.waitForTimeout(150);
      assert('mobile menu opens with every destination', await page.evaluate(() =>
        !document.getElementById('mobile-menu').classList.contains('hidden') &&
        document.querySelectorAll('#mobile-menu a').length >= 9 &&
        [...document.querySelectorAll('#mobile-menu a')].some((a) => a.getAttribute('href') === 'collections.html') &&
        [...document.querySelectorAll('#mobile-menu a')].some((a) => a.getAttribute('href') === 'about.html') &&
        [...document.querySelectorAll('#mobile-menu a')].some((a) => a.getAttribute('href') === 'submit.html')));
      assert('mobile menu marks AI Tools current', await page.evaluate(() =>
        document.querySelector('#mobile-menu a[aria-current="page"]')?.textContent.trim() === 'AI Tools'));
      await page.click('#menu-toggle');

      await page.click('#facets-toggle');
      await page.waitForTimeout(150);
      assert('mobile facets panel opens', await page.isVisible('#facets-panel'));
      assert('mobile facets panel has rows', (await page.locator('#facets-panel .facet-row').count()) > 0);
      await page.click('#facets-toggle');
      assert('mobile facets panel closes', !(await page.isVisible('#facets-panel')));
    }
    await page.close();
  }

  /* ---------- Main functional pass ---------- */
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => consoleErrors.push('main: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push('main: ' + m.text()); });
  await page.goto(PAGE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const count = async () => (await page.textContent('#results-count')).trim();
  const n = async () => parseInt((await count()).match(/of (\d+)/)[1], 10);
  const resetAll = async () => {
    if (await page.isVisible('#reset-all-filters')) await page.click('#reset-all-filters');
    else if (await page.isVisible('#empty-reset')) await page.click('#empty-reset');
    await page.waitForTimeout(250);
  };
  const checkFacet = async (key, value) => {
    await page.locator(`input[data-facet="${key}"][data-value="${value}"]`).check();
    await page.waitForTimeout(250);
  };
  const uncheckFacet = async (key, value) => {
    await page.locator(`input[data-facet="${key}"][data-value="${value}"]`).uncheck();
    await page.waitForTimeout(250);
  };

  /* ---------- Dataset ---------- */
  const counts = await page.evaluate(() => ({
    tools: window.AI_TOOLS.length,
    meta: window.AI_TOOLS_META.count,
    categories: [...new Set(window.AI_TOOLS.map((r) => r.category))].length,
    sourceCategories: [...new Set(window.AI_TOOLS.map((r) => r.source_category))].length
  }));
  assert('dataset global matches meta count', await page.evaluate(() => window.AI_TOOLS.length === window.AI_TOOLS_META.count && window.AI_TOOLS.length > 0));
  assert('dataset meta count is the registry length', counts.meta === counts.tools, `${counts.meta} vs ${counts.tools}`);
  assert('dataset meta catalog = ai-tools', await page.evaluate(() => window.AI_TOOLS_META.catalog === 'ai-tools'));
  assert('dataset meta carries the source hash', await page.evaluate(() => /^[a-f0-9]{64}$/.test(window.AI_TOOLS_META.source_sha256 || '')));
  const integrity = await page.evaluate(() => {
    const T = window.AI_TOOLS;
    const ids = new Set();
    const required = ['id', 'name', 'description', 'category', 'source_category', 'resource_type', 'official_url', 'pricing', 'tags', 'verified', 'status', 'evidence'];
    const missing = [];
    let dupes = 0, badUrl = 0, badIcon = 0, unverified = 0, badEvidence = 0;
    const cats = new Set(T.map((r) => r.category));
    T.forEach((r) => {
      if (ids.has(r.id)) dupes++; else ids.add(r.id);
      required.forEach((f) => { if (r[f] === undefined || r[f] === null || r[f] === '' || (Array.isArray(r[f]) && !r[f].length)) missing.push(r.id + ':' + f); });
      if (!/^https:\/\//.test(r.official_url)) badUrl++;
      if (r.icon && !/^assets\/img\/icons\//.test(r.icon)) badIcon++;
      if (r.status !== 'verified' || !r.verified) unverified++;
      if (!r.evidence.some(([, u]) => u === r.official_url)) badEvidence++;
    });
    return { count: T.length, dupes, badUrl, badIcon, unverified, badEvidence, missing, categories: [...cats], monograms: T.filter((r) => !r.icon).length };
  });
  assert('all ids unique', integrity.dupes === 0, 'dupes=' + integrity.dupes);
  assert('all records complete', integrity.missing.length === 0, integrity.missing.join(', '));
  assert('all official urls https', integrity.badUrl === 0);
  assert('all icons local assets', integrity.badIcon === 0);
  assert('all records marked verified', integrity.unverified === 0);
  assert('all evidence links point to record url', integrity.badEvidence === 0, 'bad=' + integrity.badEvidence);
  assert('14 normalized categories', integrity.categories.length === counts.categories && counts.categories === 14, integrity.categories.join(', '));
  assert('raw source categories retained', counts.sourceCategories > counts.categories, 'source=' + counts.sourceCategories);
  assert('records without local icons use monograms', integrity.monograms > 0, 'monograms=' + integrity.monograms);

  /* ---------- Page identity ---------- */
  assert('title is AI Tools', (await page.title()).includes('AI Tools'));
  const chipExpected = await page.evaluate(() => `${window.AI_TOOLS.length} AI Tools Cataloged · ${window.AI_TOOLS.filter((r) => r.pricing === 'Freemium').length} Freemium · ${window.AI_TOOLS.filter((r) => r.status === 'verified').length} Verified`);
  assert('catalog chip computed from data', (await page.textContent('#catalog-chip')).trim() === chipExpected, await page.textContent('#catalog-chip'));
  assert('nav marks AI Tools current', await page.evaluate(() => document.querySelector('header nav a[aria-current="page"]')?.textContent.trim() === 'AI Tools'));
  assert('nav links every canonical destination', await page.evaluate(() => {
    const hrefs = [...document.querySelectorAll('header nav[aria-label="Primary"] a')].map((a) => a.getAttribute('href'));
    return hrefs.length === 7 && ['directory.html', 'ai-tools.html', 'models.html', 'developer-resources.html', 'collections.html', 'about.html', 'https://devspirehub.com/'].every((h) => hrefs.includes(h));
  }));
  assert('single h1', (await page.locator('h1').count()) === 1);
  assert('Submit Resource links to the submission page', await page.evaluate(() => {
    const a = [...document.querySelectorAll('header a')].find((x) => x.textContent.includes('Submit'));
    return a.getAttribute('href') === 'submit.html';
  }));
  assert('no dead "#" links', (await page.locator('a[href="#"]').count()) === 0);
  assert('no mockup metrics (584/412/98)', !(await page.content()).match(/\b(584|412)\b/));

  /* ---------- Pills ---------- */
  assert('one category pill per normalized category plus All', (await page.locator('#category-pills button').count()) === counts.categories + 1);
  const pillLabels = await page.evaluate(() => [...document.querySelectorAll('#category-pills button')].map((b) => b.textContent.trim().replace(/\s+\d+$/, '')));
  assert('pill labels match the registry category order', await page.evaluate(() => {
    const labels = [...document.querySelectorAll('#category-pills button')].slice(1).map((b) => b.dataset.category);
    const meta = window.AI_TOOLS_META.category_order || [];
    return meta.every((c) => labels.includes(c)) && labels.length === meta.length;
  }), pillLabels.join('|'));
  const pillSum = await page.evaluate(() => [...document.querySelectorAll('#category-pills button')].slice(1).reduce((s, b) => s + parseInt(b.textContent.match(/(\d+)\s*$/)[1], 10), 0));
  assert('pill counts sum to dataset size', pillSum === counts.tools, 'sum=' + pillSum);
  assert('All Tools active by default', await page.evaluate(() => document.querySelector('#category-pills button').getAttribute('aria-pressed') === 'true'));
  assert('initial results = registry total', (await n()) === counts.tools, await count());
  assert('initial grid shows 15 cards', (await page.locator('#tool-grid article').count()) === 15);
  const totalPages = Math.ceil(counts.tools / 15);
  assert(totalPages + ' pages of results', (await page.textContent('#page-indicator')).replace(/\s+/g, ' ').trim() === `Page 1 of ${totalPages}`);

  const catCounts = await page.evaluate(() => {
    const out = {};
    document.querySelectorAll('#category-pills button').forEach((b) => {
      const label = b.textContent.trim().replace(/\s+\d+$/, '');
      out[label] = parseInt(b.textContent.match(/(\d+)\s*$/)[1], 10);
    });
    return out;
  });
  let catLoopOk = true;
  for (const [label, expected] of Object.entries(catCounts).slice(1)) {
    await page.click(`[data-category="${label}"]`);
    await page.waitForTimeout(160);
    if ((await n()) !== expected) catLoopOk = false;
    await page.click('[data-category="All Tools"]');
    await page.waitForTimeout(120);
  }
  assert('every category pill filters to its stated count', catLoopOk);

  /* ---------- Facets ---------- */
  const facetGroups = await page.evaluate(() => [...document.querySelectorAll('[data-facet-group]')].map((g) => g.dataset.facetGroup));
  assert('5 facet groups in order', facetGroups.join(',') === 'type,pricing,deployment,platform,access', facetGroups.join(','));
  const facetText = await page.evaluate(() => {
    const out = {};
    document.querySelectorAll('[data-facet-group]').forEach((g) => {
      out[g.dataset.facetGroup] = [...g.querySelectorAll('.facet-row')].map((r) => r.textContent.trim().replace(/\s+/g, ' '));
    });
    return out;
  });
  const facetStats = await page.evaluate(() => {
    const T = window.AI_TOOLS;
    const group = (fn) => T.reduce((a, r) => { const k = fn(r); if (k) a[k] = (a[k] || 0) + 1; return a; }, {});
    const deploy = (r) => (r.local_execution === 'Partial' ? 'Partial Local' : r.self_hostable ? 'Self-Hostable' : 'Managed Cloud');
    return {
      pricing: group((r) => r.pricing),
      deployment: group(deploy),
      platform: group((r) => r.platform),
      signup: T.filter((r) => r.signup_required === false).length,
      firstSubtype: [...new Set(T.map((r) => r.source_category))].sort((a, b) => T.filter((r) => r.source_category === b).length - T.filter((r) => r.source_category === a).length || a.localeCompare(b))[0]
    };
  });
  assert('type facet lists every source subtype', facetText.type.length === counts.sourceCategories, `${facetText.type.length} vs ${counts.sourceCategories}`);
  const firstSubtypeCount = await page.evaluate((s) => window.AI_TOOLS.filter((r) => r.source_category === s).length, facetStats.firstSubtype);
  assert('facet count: ' + facetStats.firstSubtype, facetText.type.includes(facetStats.firstSubtype + ' ' + firstSubtypeCount), facetText.type.join(' | '));
  assert('facet count: Freemium', facetText.pricing.includes('Freemium ' + facetStats.pricing.Freemium), facetText.pricing.join(' | '));
  assert('facet count: Paid', facetText.pricing.includes('Paid ' + facetStats.pricing.Paid));
  assert('facet count: Managed Cloud', facetText.deployment.includes('Managed Cloud ' + facetStats.deployment['Managed Cloud']));
  assert('facet count: Self-Hostable', facetText.deployment.includes('Self-Hostable ' + facetStats.deployment['Self-Hostable']));
  assert('platform facet only lists stated platforms', facetText.platform.length === Object.keys(facetStats.platform).length, facetText.platform.join(' | '));
  assert('facet count: No signup required', facetText.access.includes('No signup required ' + facetStats.signup));
  assert('pricing facet sums to dataset', facetText.pricing.reduce((s, t) => s + parseInt(t.match(/(\d+)$/)[1], 10), 0) === counts.tools);
  assert('deployment facet sums to dataset', facetText.deployment.reduce((s, t) => s + parseInt(t.match(/(\d+)$/)[1], 10), 0) === counts.tools);

  /* ---------- Facet filtering ---------- */
  await checkFacet('pricing', 'Paid');
  assert('Paid filter -> ' + facetStats.pricing.Paid, (await n()) === facetStats.pricing.Paid, await count());
  assert('Paid chip appears', (await page.textContent('#active-chips')).includes('Paid'));
  await checkFacet('pricing', 'Freemium');
  const paidOrFreemium = facetStats.pricing.Paid + facetStats.pricing.Freemium;
  assert('Paid OR Freemium -> ' + paidOrFreemium, (await n()) === paidOrFreemium, await count());
  await uncheckFacet('pricing', 'Freemium');
  await uncheckFacet('pricing', 'Paid');
  assert('clearing pricing restores the registry', (await n()) === counts.tools);

  await checkFacet('deployment', 'Self-Hostable');
  assert('Self-Hostable -> ' + facetStats.deployment['Self-Hostable'], (await n()) === facetStats.deployment['Self-Hostable'], await count());
  await resetAll();

  await checkFacet('platform', 'Desktop');
  assert('Desktop platform -> ' + facetStats.platform.Desktop, (await n()) === facetStats.platform.Desktop, await count());
  await resetAll();

  await checkFacet('access', 'No signup required');
  assert('No signup required -> ' + facetStats.signup, (await n()) === facetStats.signup, await count());
  await resetAll();

  const subtypeCount = await page.evaluate((s) => window.AI_TOOLS.filter((r) => r.source_category === s).length, facetStats.firstSubtype);
  await checkFacet('type', facetStats.firstSubtype);
  assert('subtype facet ' + facetStats.firstSubtype + ' -> ' + subtypeCount, (await n()) === subtypeCount, await count());
  await resetAll();

  await checkFacet('pricing', 'Paid');
  const codingPaid = await page.evaluate(() => window.AI_TOOLS.filter((r) => r.category === 'Coding & Development' && r.pricing === 'Paid').length);
  await page.click('[data-category="Coding & Development"]');
  await page.waitForTimeout(250);
  assert('Coding + Paid -> ' + codingPaid, (await n()) === codingPaid, await count());
  if (codingPaid === 0) {
    assert('empty state shown for zero matches', await page.isVisible('#empty-state'));
    await page.click('#empty-reset');
    await page.waitForTimeout(250);
    assert('empty reset restores the registry', (await n()) === counts.tools);
  } else {
    await page.click('#reset-all-filters');
    await page.waitForTimeout(250);
    assert('reset restores the registry', (await n()) === counts.tools);
  }
  assert('reset clears category', await page.evaluate(() => document.querySelector('#category-pills button').getAttribute('aria-pressed') === 'true'));

  /* ---------- Search ---------- */
  const searchExpected = (q) => page.evaluate((q) => {
    const words = q.toLowerCase().split(/\s+/);
    return window.AI_TOOLS.filter((r) => {
      const hay = [r.name, r.org, r.description, r.category, r.source_category, r.pricing, r.license, r.platform, r.official_url, ...(r.tags || [])].join(' ').toLowerCase();
      return words.every((w) => hay.includes(w));
    }).length;
  }, q);
  const search = async (q) => {
    const expected = await searchExpected(q);
    await page.fill('#tool-search', q);
    await page.waitForTimeout(350);
    return { actual: await n(), expected };
  };
  for (const q of ['cursor', 'elevenlabs', 'openai', 'video', 'voice generation']) {
    const res = await search(q);
    assert(`search "${q}" -> ${res.expected}`, res.actual === res.expected, 'got ' + res.actual);
  }
  assert('search chip shows query', (await page.textContent('#active-chips')).includes('Search: "voice generation"'));
  await page.click('#search-clear');
  await page.waitForTimeout(250);
  assert('search clear restores the registry', (await n()) === counts.tools);
  assert('search input cleared', (await page.inputValue('#tool-search')) === '');

  await page.locator('h1').click();
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(120);
  assert('Ctrl+K focuses search', await page.evaluate(() => document.activeElement.id === 'tool-search'));

  if (await page.$('#quick-find')) {
    const runway = await searchExpected('runway');
    await page.fill('#quick-find', 'runway');
    await page.waitForTimeout(300);
    assert('header quick find filters results', (await n()) === runway && runway > 0);
    await page.fill('#quick-find', '');
    await page.waitForTimeout(300);
    assert('clearing quick find restores the registry', (await n()) === counts.tools);
  }

  /* ---------- Sort ---------- */
  const firstCard = async () => (await page.locator('#tool-grid article h2').first().textContent()).trim();
  const sortExpected = await page.evaluate(() => {
    const T = [...window.AI_TOOLS];
    const order = window.AI_TOOLS_META.category_order || [];
    const byName = [...T].sort((a, b) => a.name.localeCompare(b.name));
    const byCat = [...T].sort((a, b) => (order.indexOf(a.category) - order.indexOf(b.category)) || a.name.localeCompare(b.name));
    return {
      name: byName[0].name,
      nameDesc: byName[byName.length - 1].name,
      category: byCat[0].name,
      verified: [...T].sort((a, b) => String(b.verified).localeCompare(String(a.verified)) || a.name.localeCompare(b.name))[0].name
    };
  });
  await page.selectOption('#sort-select', 'name');
  await page.waitForTimeout(250);
  assert('sort A-Z starts ' + sortExpected.name, (await firstCard()) === sortExpected.name);
  await page.selectOption('#sort-select', 'name-desc');
  await page.waitForTimeout(250);
  assert('sort Z-A starts ' + sortExpected.nameDesc, (await firstCard()) === sortExpected.nameDesc);
  await page.selectOption('#sort-select', 'category');
  await page.waitForTimeout(250);
  assert('sort category starts ' + sortExpected.category, (await firstCard()) === sortExpected.category);
  await page.selectOption('#sort-select', 'verified');
  await page.waitForTimeout(250);
  assert('recently verified falls back to name order', (await firstCard()) === sortExpected.verified);

  /* ---------- Pagination ---------- */
  await page.click('#pagination-controls button:not(:disabled):last-child');
  await page.waitForTimeout(250);
  assert('pagination next -> page 2', (await page.textContent('#page-indicator')).includes(`Page 2 of ${totalPages}`));
  assert('page 2 shows 16–30', (await count()).includes('16–30'), await count());
  await page.click('#pagination-controls button:not(:disabled):last-child');
  await page.waitForTimeout(250);
  assert('pagination next -> page 3', (await page.textContent('#page-indicator')).includes(`Page 3 of ${totalPages}`));
  for (let i = 3; i < totalPages; i++) {
    await page.click('#pagination-controls button:not(:disabled):last-child');
    await page.waitForTimeout(120);
  }
  const lastPageCards = counts.tools - (totalPages - 1) * 15;
  assert('last page is page ' + totalPages, (await page.textContent('#page-indicator')).includes(`Page ${totalPages} of ${totalPages}`));
  assert('last page shows remaining ' + lastPageCards + ' cards', (await page.locator('#tool-grid article').count()) === lastPageCards);
  assert('next disabled on last page', await page.evaluate(() => {
    const btns = [...document.querySelectorAll('#pagination-controls button')];
    return btns[btns.length - 1].disabled;
  }));
  assert('prev enabled on last page', await page.evaluate(() => {
    const btns = [...document.querySelectorAll('#pagination-controls button')];
    return !btns[0].disabled;
  }));
  await page.click('#pagination-controls button:first-child');
  await page.waitForTimeout(250);
  assert('pagination prev -> page ' + (totalPages - 1), (await page.textContent('#page-indicator')).includes(`Page ${totalPages - 1} of ${totalPages}`));

  for (let i = totalPages - 2; i > 0; i--) {
    await page.click('#pagination-controls button:first-child');
  }
  await page.waitForTimeout(300);
  assert('pagination returns to page 1', (await page.textContent('#page-indicator')).includes(`Page 1 of ${totalPages}`));

  /* ---------- Grid / card integrity across all pages ---------- */
  const cardProblems = [];
  const iconProblems = [];
  for (let p = 1; p <= totalPages; p++) {
    const cards = await page.evaluate(() => [...document.querySelectorAll('#tool-grid article')].map((a) => ({
      id: a.dataset.toolId,
      name: a.querySelector('h2')?.textContent.trim(),
      iconSrc: a.querySelector('img.tool-favicon')?.getAttribute('src') || null,
      iconLoaded: a.querySelector('img.tool-favicon')?.naturalWidth > 0,
      glyph: a.querySelector('.resource-icon-fallback .material-symbols-outlined')?.textContent.trim() || null,
      domain: a.querySelector('a[title="Official website"]')?.getAttribute('href') || '',
      hasDetails: !!a.querySelector('[data-details]')
    })));
    cards.forEach((c) => {
      if (!c.id || !c.name || !c.hasDetails) cardProblems.push(c.id + ':' + c.name);
      if (!/^https:\/\//.test(c.domain)) cardProblems.push(c.id + ':bad-url');
      if (c.iconSrc) {
        if (!c.iconLoaded && !c.glyph) iconProblems.push(c.id + ':broken');
      } else if (!c.glyph) {
        iconProblems.push(c.id + ':no-icon');
      }
    });
    if (p < totalPages) {
      await page.click('#pagination-controls button:not(:disabled):last-child');
      await page.waitForTimeout(200);
    }
  }
  assert('every card has id, name, details button, https link', cardProblems.length === 0, cardProblems.join(', '));
  assert('every card icon or category glyph renders', iconProblems.length === 0, iconProblems.join(', '));
  assert('no external icon hotlinks', await page.evaluate(() => [...document.images].every((img) => !/^https?:/.test(img.getAttribute('src') || ''))));

  /* ---------- Quick-start cards ---------- */
  await page.goto(PAGE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const quickCounts = await page.evaluate(() => {
    const out = {};
    document.querySelectorAll('[data-quick-count]').forEach((el) => { out[el.dataset.quickCount] = parseInt(el.textContent, 10); });
    return out;
  });
  const quickExpected = await page.evaluate(() => ({
    coding: window.AI_TOOLS.filter((r) => r.category === 'Coding & Development').length,
    assistants: window.AI_TOOLS.filter((r) => r.category === 'Assistants & Chatbots').length,
    video: window.AI_TOOLS.filter((r) => r.category === 'Video').length
  }));
  assert('quick counts come from registry data', quickCounts.coding === quickExpected.coding && quickCounts.assistants === quickExpected.assistants && quickCounts.video === quickExpected.video, JSON.stringify(quickCounts) + ' vs ' + JSON.stringify(quickExpected));
  await page.click('[data-quick="coding"]');
  await page.waitForTimeout(300);
  assert('quick coding applies category filter', (await n()) === quickExpected.coding && (await page.textContent('#active-chips')).includes('Coding & Development'));
  await page.click('[data-quick="assistants"]');
  await page.waitForTimeout(300);
  assert('quick assistants applies category filter', (await n()) === quickExpected.assistants);
  await page.click('[data-quick="video"]');
  await page.waitForTimeout(300);
  assert('quick video applies category filter', (await n()) === quickExpected.video);
  await resetAll();
  assert('quick filters reset to the registry', (await n()) === counts.tools);

  /* ---------- Deep links & modal ---------- */
  const openByHash = async (id) => {
    await page.evaluate((i) => { location.hash = '#tool/' + i; }, id);
    await page.waitForTimeout(150);
  };
  const modalOpen = async () => page.evaluate(() => !document.getElementById('detail-modal').hidden);

  await openByHash('chatgpt');
  assert('deep link opens ChatGPT modal', await modalOpen());
  assert('modal shows correct tool', (await page.textContent('#detail-title')).includes('ChatGPT'));
  assert('modal shows vendor', (await page.textContent('#detail-content')).includes('OpenAI'));
  assert('modal shows evidence link', await page.locator('#detail-content a:has-text("Verified link")').count() === 1);
  assert('modal shows source category', (await page.textContent('#detail-content')).includes('General-purpose AI Assistants'));
  assert('modal shows pricing', (await page.textContent('#detail-content')).includes('Freemium'));
  assert('modal lists tags', (await page.locator('#detail-content .font-code-badge').count()) > 3);

  await page.click('#detail-close');
  await page.waitForTimeout(150);
  assert('close button hides modal', !(await modalOpen()));
  assert('close clears deep link hash', await page.evaluate(() => location.hash === ''));

  await openByHash('harvey');
  assert('monogram tool detail opens', (await page.textContent('#detail-title')).includes('Harvey'));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  assert('Escape closes modal', !(await modalOpen()));

  await openByHash('tabnine');
  await page.mouse.click(8, 8);
  await page.waitForTimeout(150);
  assert('overlay click closes modal', !(await modalOpen()));

  await page.evaluate(() => { location.hash = '#tool/not-a-real-tool'; });
  await page.waitForTimeout(250);
  assert('invalid deep link shows banner', await page.isVisible('#invalid-state'));
  assert('invalid banner names the identifier', (await page.textContent('#invalid-message')).includes('not-a-real-tool'));
  await page.click('#invalid-dismiss');
  await page.waitForTimeout(150);
  assert('invalid banner dismisses', !(await page.isVisible('#invalid-state')));

  const firstCardName = (await page.locator('#tool-grid article h2').first().textContent()).trim();
  const firstCardId = await page.locator('#tool-grid article').first().getAttribute('data-tool-id');
  await page.locator('#tool-grid [data-details]').first().click();
  await page.waitForTimeout(200);
  assert('View details opens modal', await modalOpen() && (await page.textContent('#detail-title')).includes(firstCardName), firstCardName);
  assert('View details writes deep link', await page.evaluate((i) => location.hash === '#tool/' + i, firstCardId));
  await page.keyboard.press('Escape');

  /* ---------- Every detail view ---------- */
  const failedDetails = await page.evaluate(async () => {
    const out = [];
    for (const r of window.AI_TOOLS.slice(0, 50)) {
      location.hash = '#tool/' + r.id;
      await new Promise((resolve) => setTimeout(resolve, 0));
      const state = {
        open: !document.getElementById('detail-modal').hidden,
        title: document.getElementById('detail-title')?.textContent.trim() || '',
        visit: document.querySelector('#detail-content a[href^="https://"]')?.getAttribute('href') || ''
      };
      if (!state.open || !state.title.includes(r.name) || !state.visit) out.push(r.id);
    }
    return out;
  });
  assert('all sampled detail views open with name + official link', failedDetails.length === 0, failedDetails.join(','));
  await page.keyboard.press('Escape');

  /* ---------- Footer ---------- */
  assert('footer has grouped working links', await page.evaluate(() => {
    const links = [...document.querySelectorAll('footer a')].map((a) => a.getAttribute('href'));
    return links.length === 15 && links.every((h) => h && h !== '#') && ['collections.html', 'about.html', 'contact.html', 'privacy.html', 'terms.html', 'docs.html', 'api.html', 'submit.html'].every((h) => links.includes(h));
  }));
  assert('footer keeps attribution', (await page.textContent('footer')).includes('DevSpire Nexus is a product of DevSpireHub.com.'));
  assert('footer names the source file', (await page.textContent('footer')).includes('ai-tools-models-developer-resources.md'));

  /* ---------- Console ---------- */
  assert('no console or page errors', consoleErrors.length === 0, consoleErrors.slice(0, 5).join(' | '));

  await page.close();
  await browser.close();

  const passed = results.filter((r) => r.pass).length;
  console.log(`\n=== ${passed}/${results.length} checks passed ===`);
  if (passed !== results.length) {
    console.log('Failures:');
    results.filter((r) => !r.pass).forEach((r) => console.log(' -', r.name, r.extra));
    process.exitCode = 1;
  }
})();
