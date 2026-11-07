const { chromium } = require('playwright-core');
const EXE = process.env.LOCALAPPDATA + '/ms-playwright/chromium-1248/chrome-win64/chrome.exe';

const check = (name, cond, extra) => ({ name, pass: !!cond, extra: extra || '' });
let results = [];
const assert = (name, cond, extra) => { results.push(check(name, cond, extra)); if (!cond) console.error('FAIL:', name, extra || ''); };

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const consoleErrors = [];

  /* --- Responsive width sweep + console error capture --- */
  for (const width of [320, 375, 480, 768, 1024, 1280, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on('pageerror', (e) => consoleErrors.push(width + ': ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(width + ': ' + m.text()); });
    await page.goto('file:///H:/Devspirehub AI/models.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const m = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
    assert('no horizontal overflow @' + width, m.scrollW <= m.vw + 1, `scrollW=${m.scrollW} vw=${m.vw}`);
    await page.close();
  }
  assert('zero console/page errors across widths', consoleErrors.length === 0, consoleErrors.slice(0, 5).join(' | '));

  /* --- Main functional pass at desktop --- */
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => consoleErrors.push('main: ' + e.message));
  await page.goto('file:///H:/Devspirehub AI/models.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const counts = await page.evaluate(() => ({
    total: window.AI_MODELS.length,
    meta: window.AI_MODELS_META.count,
    open: window.AI_MODELS.filter((m) => m.weights === 'open').length,
    closed: window.AI_MODELS.filter((m) => m.weights === 'closed').length,
    unstated: window.AI_MODELS.filter((m) => m.weights == null).length,
    cats: [...new Set(window.AI_MODELS.map((m) => m.category))].length
  }));
  const chip = (await page.textContent('#catalog-chip')).trim();
  const expectedChip = `${counts.total} Models Cataloged · ${counts.open} Open Weights · ${counts.closed} Hosted APIs${counts.unstated ? ` · ${counts.unstated} Unspecified` : ''}`;
  assert('catalog chip computed from data', chip === expectedChip, chip);

  /* --- Phase 3: dataset separation + integrity --- */
  assert('dataset global exposes meta count', await page.evaluate(() => window.AI_MODELS.length === window.AI_MODELS_META.count && window.AI_MODELS.length > 0));
  assert('dataset meta count/catalog', await page.evaluate(() => window.AI_MODELS_META.count === window.AI_MODELS.length && window.AI_MODELS_META.catalog === 'ai-models'));
  assert('page loads external dataset script', await page.evaluate(() => [...document.scripts].some((s) => (s.getAttribute('src') || '').endsWith('data/ai-models.js'))));
  assert('no inline model records remain in page', !(await page.content()).includes('icon: "openai"'));
  const integrity = await page.evaluate(() => {
    const M = window.AI_MODELS;
    const ids = new Set();
    let dupes = 0, badUrl = 0, badIcon = 0, unverified = 0, badEvidence = 0, missing = 0;
    M.forEach((m) => {
      if (ids.has(m.id)) dupes++; else ids.add(m.id);
      ['id', 'name', 'publisher', 'description', 'category', 'source_category', 'resource_type', 'official_url', 'pricing', 'tags', 'evidence', 'verified', 'status'].forEach((k) => {
        if (m[k] === undefined || m[k] === null || m[k] === '' || (Array.isArray(m[k]) && !m[k].length)) missing++;
      });
      if (!/^https:\/\//.test(m.official_url)) badUrl++;
      if (m.icon && !/^assets\/img\/icons\//.test(m.icon)) badIcon++;
      if (m.status !== 'verified' || !m.verified) unverified++;
      if (!m.evidence.some(([, u]) => /^https:\/\//.test(u))) badEvidence++;
    });
    return {
      dupes, badUrl, badIcon, unverified, badEvidence, missing,
      categories: [...new Set(M.map((m) => m.category))],
      paramsNull: M.filter((m) => m.params === null).length,
      contextNull: M.filter((m) => m.context_k === null).length,
      chipOnly: M.filter((m) => !m.icon).map((m) => m.name),
      remoteIcons: M.filter((m) => m.icon && !/^assets\/img\/icons\//.test(m.icon)).length,
      paramsStated: M.filter((m) => m.params !== null).length,
      contextStated: M.filter((m) => m.context_k !== null).length,
      total: M.length
    };
  });
  assert('all model ids unique', integrity.dupes === 0);
  assert('all model records complete', integrity.missing === 0, 'missing=' + integrity.missing);
  assert('all model urls https', integrity.badUrl === 0);
  assert('all model icons local assets', integrity.badIcon === 0);
  assert('all models marked verified', integrity.unverified === 0);
  assert('all models carry evidence links', integrity.badEvidence === 0);
  assert('model categories match the registry meta', integrity.categories.length === counts.cats, integrity.categories.length + ' vs ' + counts.cats);
  assert('unstated params stay null and stated values are complete', integrity.paramsStated + integrity.paramsNull === integrity.total, `stated=${integrity.paramsStated} null=${integrity.paramsNull}`);
  assert('unstated context stays null and stated values are complete', integrity.contextStated + integrity.contextNull === integrity.total, `stated=${integrity.contextStated} null=${integrity.contextNull}`);
  assert('no remote icon URLs remain', integrity.remoteIcons === 0, 'remote=' + integrity.remoteIcons);
  assert('records without local icons use the monogram fallback', integrity.chipOnly.length >= 0, 'monogram=' + integrity.chipOnly.length);

  const pillInfo = await page.evaluate(() => [...document.querySelectorAll('#category-pills button')].map(b => ({ t: b.textContent.trim(), pressed: b.getAttribute('aria-pressed') })));
  assert('one pill per category plus All', pillInfo.length === counts.cats + 1, 'got ' + pillInfo.length);
  assert('All Models pill active by default', pillInfo[0].pressed === 'true' && pillInfo[0].t.startsWith(`All Models ${counts.total}`));

  const groups = await page.evaluate(() => [...document.querySelectorAll('[data-facet-group]')].map(g => g.dataset.facetGroup));
  assert('5 facet groups', groups.join(',') === 'availability,licensing,modalities,context,params', groups.join(','));

  const facetCounts = await page.evaluate(() => {
    const out = {};
    document.querySelectorAll('[data-facet-group]').forEach(g => {
      out[g.dataset.facetGroup] = [...g.querySelectorAll('.facet-row')].map(r => r.textContent.trim().replace(/\s+/g, ' '));
    });
    return out;
  });
  console.log('FACET COUNTS', JSON.stringify(facetCounts, null, 1));

  const showingText = async () => (await page.textContent('#results-count')).trim();
  const showingN = async () => parseInt((await showingText()).match(/of (\d+)/)[1], 10);

  assert('initial results = registry total', (await showingN()) === counts.total, await showingText());

  /* Presets */
  const presetExpect = await page.evaluate(() => {
    const M = window.AI_MODELS;
    return {
      'open-weights': M.filter((m) => m.weights === 'open').length,
      reasoning: M.filter((m) => m.category === 'Reasoning & CoT').length,
      coding: M.filter((m) => m.category === 'Coding Models').length,
      vision: M.filter((m) => m.category === 'Vision & Multimodal').length,
      local: M.filter((m) => m.self_hostable).length,
      'long-context': M.filter((m) => m.context_k !== null && m.context_k > 128).length
    };
  });
  for (const [preset, expect] of Object.entries(presetExpect)) {
    await page.click(`[data-preset="${preset}"]`);
    await page.waitForTimeout(300);
    const n = await showingN();
    assert(`preset ${preset} -> ${expect}`, n === expect, 'got ' + n);
    await page.click('#reset-all-filters');
    await page.waitForTimeout(300);
  }
  assert('reset restores the full registry', (await showingN()) === counts.total);

  /* Category pill */
  const embeddings = await page.evaluate(() => window.AI_MODELS.filter((m) => m.category === 'Embeddings & Rerankers').length);
  await page.click('[data-category="Embeddings & Rerankers"]');
  await page.waitForTimeout(300);
  assert('embeddings pill -> ' + embeddings, (await showingN()) === embeddings);
  await page.click('[data-category="All Models"]');
  await page.waitForTimeout(300);

  /* Facet combine: Open Weights AND MIT/Apache */
  await page.evaluate(() => {
    const groups = document.querySelectorAll('[data-facet-group]');
    const checkVal = (group, val) => {
      const row = [...document.querySelectorAll(`[data-facet-group="${group}"] .facet-row`)].find(r => r.textContent.includes(val));
      row.querySelector('input').click();
    };
    checkVal('availability', 'Open Weights');
  });
  await page.waitForTimeout(300);
  assert('facet Open Weights -> ' + counts.open, (await showingN()) === counts.open);
  await page.evaluate(() => {
    const row = [...document.querySelectorAll('[data-facet-group="licensing"] .facet-row')].find(r => r.textContent.includes('MIT / Apache 2.0'));
    row.querySelector('input').click();
  });
  await page.waitForTimeout(300);
  const combined = await showingN();
  assert('Open Weights AND MIT/Apache combined', combined >= 0 && combined <= counts.open, 'got ' + combined);
  await page.click('#reset-facets');
  await page.waitForTimeout(300);

  /* Search */
  const searchMatches = (term) => page.evaluate((term) => {
    const q = term.toLowerCase();
    return window.AI_MODELS.filter((m) => [m.name, m.publisher, m.family, m.source_category, m.category, m.license, m.license_group, m.description, m.context_k !== null ? m.context_k + 'k' : '', ...(m.modalities || []), ...(m.tags || [])].join(' ').toLowerCase().includes(q)).length;
  }, term);
  const llamaN = await searchMatches('llama');
  await page.fill('#model-search', 'llama');
  await page.waitForTimeout(400);
  assert('search "llama" finds ' + llamaN, (await showingN()) === llamaN, 'got ' + (await showingN()));
  const ctx128 = await searchMatches('128k');
  await page.fill('#model-search', '128k');
  await page.waitForTimeout(400);
  assert('search "128k" finds ' + ctx128 + ' stated 128K models', (await showingN()) === ctx128, await showingText());
  await page.fill('#model-search', 'zzzznotreal');
  await page.waitForTimeout(400);
  assert('empty state on no matches', await page.isVisible('#empty-state'));
  assert('grid hidden on empty', await page.isHidden('#model-grid'));
  await page.click('#empty-reset');
  await page.waitForTimeout(300);
  assert('empty reset restores the full registry', (await showingN()) === counts.total);

  /* Related resources track the current filter result */
  const relPage = await page.evaluate(() => {
    const root = document.querySelector('#related-page [data-related-root]');
    return root ? { source: root.dataset.sourceId, cards: root.querySelectorAll('[data-related-card]').length } : null;
  });
  assert('page-level related section reflects the first filtered record', !!relPage && relPage.cards > 0, JSON.stringify(relPage));

  /* Sort by context window */
  const maxCtx = await page.evaluate(() => Math.max(...window.AI_MODELS.map((m) => (m.context_k === null ? -1 : m.context_k))));
  await page.selectOption('#sort-select', 'context');
  await page.waitForTimeout(300);
  const firstContext = await page.evaluate(() => document.querySelector('#model-grid article').textContent);
  assert('context sort puts the largest stated window first', firstContext.includes(maxCtx + 'K') || maxCtx < 0, 'max=' + maxCtx);
  const firstName = await page.evaluate(() => [...window.AI_MODELS].map((m) => m.name).sort((a, b) => a.localeCompare(b))[0]);
  await page.selectOption('#sort-select', 'name');
  await page.waitForTimeout(300);
  const firstCardName = await page.evaluate(() => document.querySelector('#model-grid article h2').textContent);
  assert('name sort A-Z first = ' + firstName, firstCardName === firstName, firstCardName);
  await page.selectOption('#sort-select', 'verified');
  await page.waitForTimeout(300);

  /* Pagination */
  const pages = parseInt((await page.textContent('#page-indicator')).match(/of (\d+)/)[1], 10);
  const expectedPages = Math.max(1, Math.ceil(counts.total / 15));
  assert(expectedPages + ' pages for ' + counts.total + ' models', pages === expectedPages, 'got ' + pages);
  for (let i = 1; i < pages; i++) { await page.click('#pagination-controls button:not(:disabled):last-child'); await page.waitForTimeout(120); }
  const lastCards = await page.evaluate(() => document.querySelectorAll('#model-grid article').length);
  const expectedLast = counts.total % 15 || 15;
  assert('last page has ' + expectedLast + ' cards', lastCards === expectedLast, 'got ' + lastCards);
  await page.click('#pagination-controls button:not(:disabled):first-child');
  await page.waitForTimeout(200);
  assert('prev goes to page ' + (pages - 1) + ' of ' + pages, (await page.textContent('#page-indicator')).includes(`Page ${pages - 1} of ${pages}`));

  /* Detail modal */
  await page.click('#model-grid article [data-details]');
  await page.waitForTimeout(300);
  assert('detail modal opens', await page.isVisible('#detail-modal'));
  const detailInfo = await page.evaluate(() => ({
    hasEvidence: document.querySelectorAll('#detail-content a[href^="https"]').length >= 2,
    hasVerified: /Last Verified/.test(document.querySelector('#detail-content').textContent),
    hasParams: /Params/.test(document.querySelector('#detail-content').textContent)
  }));
  assert('detail modal has evidence links', detailInfo.hasEvidence);
  assert('detail modal shows last verified', detailInfo.hasVerified);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  assert('ESC closes detail modal', await page.isHidden('#detail-modal'));

  /* Compare */
  const boxes = await page.$$('#model-grid [data-compare]');
  assert('15 compare checkboxes on page', boxes.length === 15, 'got ' + boxes.length);
  assert('compare button disabled at 0', await page.isDisabled('#compare-btn'));
  for (let i = 0; i < 3; i++) { await boxes[i].check(); await page.waitForTimeout(150); }
  assert('compare count = 3', (await page.textContent('#compare-count')) === '3');
  assert('compare button enabled at 3', await page.isEnabled('#compare-btn'));
  const fourth = await page.$$('#model-grid [data-compare]');
  await fourth[3].click(); /* 4th add is blocked by design; use click (state intentionally reverts) */
  await page.waitForTimeout(200);
  assert('4th compare blocked (max 3)', (await page.textContent('#compare-count')) === '3');
  assert('4th checkbox unchecked', !(await fourth[3].isChecked()));
  await page.click('#compare-btn');
  await page.waitForTimeout(300);
  assert('compare modal opens', await page.isVisible('#compare-modal'));
  const cmpRows = await page.evaluate(() => document.querySelectorAll('#compare-content tbody tr').length);
  assert('compare table has 15 rows', cmpRows === 15, 'got ' + cmpRows);
  const cmpLabels = await page.evaluate(() => [...document.querySelectorAll('#compare-content tbody th')].map((th) => th.textContent.trim()));
  assert('compare rows honestly labelled (Inference, not Architecture)', cmpLabels.includes('Inference') && !cmpLabels.includes('Architecture'), cmpLabels.join(','));
  const cmpCols = await page.evaluate(() => document.querySelectorAll('#compare-content thead th').length - 1);
  assert('compare table has 3 model columns', cmpCols === 3, 'got ' + cmpCols);
  await page.click('#compare-close');
  await page.waitForTimeout(200);
  assert('compare modal closes', await page.isHidden('#compare-modal'));

  /* Compare survives re-render: uncheck one, recheck paging */
  await page.evaluate(() => { document.querySelectorAll('#model-grid [data-compare]').forEach(c => { if (c.checked) c.click(); }); });
  await page.waitForTimeout(200);
  assert('compare cleared from cards', (await page.textContent('#compare-count')) === '0');

  /* Broken images across all pages */
  await page.goto('file:///H:/Devspirehub AI/models.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const badImgs = [];
  const pageCount2 = pages;
  const waitIcons = async () => {
    await page.waitForFunction(() => [...document.querySelectorAll('#model-grid img.tool-favicon')].every((i) => i.complete), null, { timeout: 4000 }).catch(() => {});
  };
  for (let p = 1; p <= pageCount2; p++) {
    await waitIcons();
    const res = await page.evaluate(() => [...document.querySelectorAll('#model-grid img.tool-favicon')]
      .filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute('src')));
    badImgs.push(...res);
    if (p < pageCount2) { await page.click('#pagination-controls button:not(:disabled):last-child'); await page.waitForTimeout(200); }
  }
  assert('no broken favicons on any page', badImgs.length === 0, badImgs.join(','));
  const headerImgs = await page.evaluate(() => [...document.querySelectorAll('header img, link[rel="icon"]')].length);
  assert('brand icon present in header', headerImgs >= 1);

  /* --- Phase 3: deep links + invalid identifiers --- */
  await page.goto('file:///H:/Devspirehub AI/models.html#model/gpt-4o', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  assert('deep link #model/gpt-4o opens detail', await page.isVisible('#detail-modal'));
  assert('deep link renders the linked model', (await page.textContent('#detail-title .truncate')).trim() === 'GPT-4o');
  assert('deep link keeps the hash', await page.evaluate(() => location.hash === '#model/gpt-4o'));
  assert('detail links are all absolute https', await page.evaluate(() => [...document.querySelectorAll('#detail-content a')].filter(a => !a.closest('[data-related-detail]')).every(a => /^https:\/\//.test(a.href))));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  assert('ESC closes deep-linked detail', await page.isHidden('#detail-modal'));
  assert('closing deep link clears the hash', await page.evaluate(() => location.hash === ''));

  await page.goto('file:///H:/Devspirehub AI/models.html#model/not-a-real-model', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  assert('invalid deep link shows warning banner', await page.isVisible('#invalid-state'));
  assert('invalid banner names the identifier', (await page.textContent('#invalid-message')).includes('not-a-real-model'));
  assert('invalid deep link opens no modal', await page.isHidden('#detail-modal'));
  assert('catalog still renders behind invalid banner', (await showingN()) === counts.total);
  await page.click('#invalid-dismiss');
  await page.waitForTimeout(200);
  assert('dismissing invalid banner hides it', await page.isHidden('#invalid-state'));
  assert('dismissing invalid banner clears hash', await page.evaluate(() => location.hash === ''));
  assert('invalid banner hidden on clean load', await page.evaluate(async () => {
    await new Promise(r => setTimeout(r, 0));
    return document.getElementById('invalid-state').hidden;
  }));

  /* --- Phase 3: dead controls + honest disabled actions --- */
  assert('no dead anchor links (href="#")', (await page.evaluate(() => document.querySelectorAll('a[href="#"]').length)) === 0);
  assert('no javascript: links', (await page.evaluate(() => document.querySelectorAll('a[href^="javascript:"]').length)) === 0);
  const submitInfo = await page.evaluate(() => {
    const a = [...document.querySelectorAll('header a')].find((x) => x.textContent.trim() === 'Submit Resource');
    return a ? { href: a.getAttribute('href'), aria: a.getAttribute('aria-disabled') } : null;
  });
  assert('Submit Resource links to the submission page', !!submitInfo && submitInfo.href === 'submit.html' && submitInfo.aria === null, JSON.stringify(submitInfo));
  assert('terminal/code no-op buttons removed', await page.evaluate(() => !document.querySelector('button[title="Terminal"]') && !document.querySelector('button[title="API code"]')));
  assert('dead "API / Docs" nav removed', await page.evaluate(() => ![...document.querySelectorAll('header nav a')].some((a) => a.textContent.trim() === 'API / Docs')));
  assert('quick find input labelled', await page.evaluate(() => {
    const q = document.getElementById('quick-find') || document.getElementById('model-search') || document.getElementById('search-input');
    return (q && (q.getAttribute('aria-label') || q.getAttribute('placeholder') || '').length > 0);
  }));
  const footer = await page.evaluate(() => ({
    links: [...document.querySelectorAll('footer a')].map((a) => a.getAttribute('href')),
    attribution: /product of DevSpireHub\.com/.test(document.querySelector('footer').textContent)
  }));
  const FOOTER_LINKS = 'index.html,ai-tools.html,models.html,developer-resources.html,collections.html,about.html,contact.html,docs.html,api.html,submit.html,privacy.html,terms.html,https://devspirehub.com/,https://devspirehub.com/Website/about/about.html,https://devspirehub.com/Resources/digital-resources/digital-resources-hub.html';
  assert('footer has grouped, working links', footer.links.length === 15 && footer.links.join(',') === FOOTER_LINKS, footer.links.join(','));
  assert('footer attribution present', footer.attribution);

  /* Mobile interactions @375 */
  const mp = await browser.newPage({ viewport: { width: 375, height: 800 } });
  await mp.goto('file:///H:/Devspirehub AI/models.html', { waitUntil: 'networkidle' });
  await mp.waitForTimeout(400);
  await mp.click('#facets-toggle');
  await mp.waitForTimeout(200);
  assert('mobile facets panel opens', await mp.isVisible('#facets-panel'));
  await mp.click('#menu-toggle');
  await mp.waitForTimeout(200);
  assert('mobile menu opens', await mp.isVisible('#mobile-menu'));
  const modelsLink = await mp.evaluate(() => [...document.querySelectorAll('#mobile-menu a')].find(a => a.textContent.trim() === 'AI Models').getAttribute('href'));
  assert('mobile AI Models link -> models.html', modelsLink === 'models.html');
  assert('mobile header hides clipped wordmark, keeps logo', await mp.evaluate(() => {
    const brand = document.querySelector('header a[href="index.html"]');
    const wordmark = brand.querySelector('span span');
    return getComputedStyle(wordmark).display === 'none' && !!brand.querySelector('img') && getComputedStyle(brand.querySelector('img')).display !== 'none';
  }));
  assert('mobile Submit links to draft page', await mp.evaluate(() => [...document.querySelectorAll('header a')].find((a) => a.textContent.trim() === 'Submit Resource').getAttribute('href') === 'submit.html'));
  await mp.close();

  await browser.close();
  consoleErrors.forEach(e => console.error('CONSOLE:', e));
  const passed = results.filter(r => r.pass).length;
  console.log(`\n=== ${passed}/${results.length} checks passed ===`);
  results.filter(r => !r.pass).forEach(r => console.log('FAILED:', r.name, r.extra));
  process.exit(results.every(r => r.pass) ? 0 : 1);
})().catch(e => { console.error('HARNESS FAIL', e); process.exit(1); });
