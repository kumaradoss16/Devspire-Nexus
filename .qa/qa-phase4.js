const { chromium } = require('playwright-core');
const EXE = process.env.LOCALAPPDATA + '/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
const BASE = 'file:///H:/Devspirehub AI/';

const results = [];
const assert = (name, cond, extra) => {
  results.push({ name, pass: !!cond, extra: extra || '' });
  if (!cond) console.error('FAIL:', name, extra || '');
};

const NAV = [
  ['Discover', 'index.html'],
  ['AI Tools', 'ai-tools.html'],
  ['AI Models', 'models.html'],
  ['Developer Resources', 'developer-resources.html'],
  ['My Collections', 'collections.html'],
  ['About', 'about.html'],
  ['DevSpireHub', 'https://devspirehub.com/']
];
const NAV_HREFS = NAV.map(([, href]) => href);

const PAGES = [
  { key: 'directory', file: 'index.html', active: 'Discover' },
  { key: 'tools', file: 'tools.html', active: null },
  { key: 'ai-tools', file: 'ai-tools.html', active: 'AI Tools' },
  { key: 'models', file: 'models.html', active: 'AI Models' },
  { key: 'developer-resources', file: 'developer-resources.html', active: 'Developer Resources' }
];

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const consoleErrors = [];

  /* ---------- Landing responsive sweep ---------- */
  for (const width of [320, 375, 480, 768, 1024, 1280, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on('pageerror', (e) => consoleErrors.push(`directory@${width}: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`directory@${width}: ${m.text()}`); });
    await page.goto(BASE + 'index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const m = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
    assert(`landing no horizontal overflow @${width}`, m.scrollW <= m.vw + 1, `scrollW=${m.scrollW} vw=${m.vw}`);
    await page.fill('#resource-search', 'rag');
    await page.waitForTimeout(350);
    const s = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth, panel: Math.round(document.querySelector('#search-results .ui-card').getBoundingClientRect().width) }));
    assert(`landing search results fit @${width}`, s.scrollW <= s.vw + 1 && s.panel <= s.vw, `scrollW=${s.scrollW} vw=${s.vw} panel=${s.panel}`);
    await page.close();
  }
  assert('landing zero console/page errors across widths', consoleErrors.length === 0, consoleErrors.slice(0, 5).join(' | '));

  /* ---------- Shared nav + footer on every page ---------- */
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', (e) => consoleErrors.push('main: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push('main: ' + m.text()); });

  for (const p of PAGES) {
    await page.goto(BASE + p.file, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const info = await page.evaluate(() => ({
      nav: [...document.querySelectorAll('header nav[aria-label="Primary"] a')].map((a) => [a.textContent.trim(), a.getAttribute('href')]),
      current: [...document.querySelectorAll('header nav[aria-label="Primary"] a[aria-current="page"]')].map((a) => a.textContent.trim()),
      brand: document.querySelector('header a[href="index.html"] img') ? 'index.html' : null,
      dead: document.querySelectorAll('a[href="#"]').length,
      about: [...document.querySelectorAll('header a')].filter((a) => /^About$/.test(a.textContent.trim())).map((a) => a.getAttribute('href')),
      terminal: document.querySelectorAll('button[title="Terminal"], button[title="API code"]').length,
      submit: (() => {
        const a = [...document.querySelectorAll('header a')].find((x) => x.textContent.trim() === 'Submit Resource');
        return a ? { href: a.getAttribute('href'), disabled: a.getAttribute('aria-disabled') } : null;
      })(),
      wordmark: (() => {
        const w = document.querySelector('header a[href="index.html"] span span');
        return w ? getComputedStyle(w).display : null;
      })(),
      footer: [...document.querySelectorAll('footer a')].map((a) => a.getAttribute('href')),
      attribution: /product of DevSpireHub\.com/.test(document.querySelector('footer').textContent),
      sourceText: /ai-tools-models-developer-resources\.md/.test(document.querySelector('footer').textContent),
      deadSource: [...document.querySelectorAll('footer a')].some((a) => (a.getAttribute('href') || '').includes('ai-knowledge-base'))
    }));

    assert(`${p.key}: desktop nav canonical`, JSON.stringify(info.nav.map(([, href]) => href)) === JSON.stringify(NAV_HREFS), JSON.stringify(info.nav));
    assert(`${p.key}: correct active nav item`, p.active ? info.current.join(',') === p.active : info.current.length === 0, info.current.join(','));
    assert(`${p.key}: brand links to directory`, info.brand === 'index.html');
    assert(`${p.key}: no dead anchors`, info.dead === 0, 'dead=' + info.dead);
    assert(`${p.key}: About link resolves to about.html`, info.about.length > 0 && info.about.every((h) => h === 'about.html'), JSON.stringify(info.about));
    assert(`${p.key}: no terminal/code no-op buttons`, info.terminal === 0, 'found=' + info.terminal);
    assert(`${p.key}: Submit links to the submission page`, !!info.submit && info.submit.href === 'submit.html' && info.submit.disabled === null, JSON.stringify(info.submit));
    assert(`${p.key}: wordmark visible at desktop`, info.wordmark !== 'none', info.wordmark);
    assert(`${p.key}: footer starts with canonical nav`, info.footer.slice(0, 4).join(',') === 'index.html,ai-tools.html,models.html,developer-resources.html', info.footer.join(','));
    assert(`${p.key}: footer attribution`, info.attribution);
    assert(`${p.key}: footer names source file`, info.sourceText);
    assert(`${p.key}: no dead source-data link`, !info.deadSource);
    assert(`${p.key}: footer groups the parent site`, info.footer.slice(12, 15).join(',') === 'https://devspirehub.com/,https://devspirehub.com/Website/about/about.html,https://devspirehub.com/Resources/digital-resources/digital-resources-hub.html', info.footer.join(','));
    assert(`${p.key}: footer product links`, info.footer.slice(4, 10).join(',') === 'collections.html,about.html,contact.html,docs.html,api.html,submit.html', info.footer.join(','));
    assert(`${p.key}: footer ends with legal pages`, info.footer.length === 15 && info.footer.slice(10).join(',') === 'privacy.html,terms.html,https://devspirehub.com/,https://devspirehub.com/Website/about/about.html,https://devspirehub.com/Resources/digital-resources/digital-resources-hub.html', info.footer.join(','));

    /* Mobile pass */
    const mp = await browser.newPage({ viewport: { width: 375, height: 800 } });
    mp.on('pageerror', (e) => consoleErrors.push(`${p.key}@375: ${e.message}`));
    await mp.goto(BASE + p.file, { waitUntil: 'networkidle' });
    await mp.waitForTimeout(400);
    const mob = await mp.evaluate(() => ({
      nav: [...document.querySelectorAll('#mobile-menu a')].map((a) => [a.textContent.trim(), a.getAttribute('href')]),
      wordmark: (() => {
        const w = document.querySelector('header a[href="index.html"] span span');
        return w ? getComputedStyle(w).display : null;
      })(),
      overflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      submit: [...document.querySelectorAll('header a')].find((a) => a.textContent.trim() === 'Submit Resource')?.getAttribute('href')
    }));
    const mobHrefs = mob.nav.map(([, href]) => href);
    assert(`${p.key}: mobile nav canonical`, JSON.stringify(mobHrefs.slice(0, 6)) === JSON.stringify(NAV_HREFS.slice(0, 6)) && mobHrefs.includes('submit.html') && mobHrefs.includes('https://devspirehub.com/') && mobHrefs.includes('https://devspirehub.com/Website/about/about.html'), JSON.stringify(mob.nav));
    assert(`${p.key}: mobile wordmark hidden`, mob.wordmark === 'none', mob.wordmark);
    assert(`${p.key}: mobile no overflow`, mob.overflow);
    assert(`${p.key}: mobile Submit links to the submission page`, mob.submit === 'submit.html');
    await mp.click('#menu-toggle');
    await mp.waitForTimeout(150);
    assert(`${p.key}: mobile menu opens`, await mp.isVisible('#mobile-menu'));
    await mp.close();
  }

  /* ---------- Landing data accuracy ---------- */
  await page.goto(BASE + 'index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const data = await page.evaluate(() => ({
    counts: [window.AI_TOOLS.length, window.AI_MODELS.length, window.DEVELOPER_RESOURCES.length],
    summary: document.getElementById('catalog-summary-text').textContent.trim(),
    typeCards: {
      tools: document.getElementById('tools-count').textContent.trim(),
      models: document.getElementById('models-count').textContent.trim(),
      dev: document.getElementById('dev-count').textContent.trim()
    },
    coverage: {
      tools: [...document.querySelectorAll('#coverage-tools a')].map((a) => [a.textContent.trim(), a.getAttribute('href')]),
      models: [...document.querySelectorAll('#coverage-models a')].map((a) => [a.textContent.trim(), a.getAttribute('href')]),
      dev: [...document.querySelectorAll('#coverage-dev a')].map((a) => [a.textContent.trim(), a.getAttribute('href')])
    },
    coverageAll: ['coverage-tools-all', 'coverage-models-all', 'coverage-dev-all'].map((id) => document.getElementById(id).textContent.trim()),
    cards: document.querySelectorAll('#resource-grid .ui-card').length,
    cardLinks: [...document.querySelectorAll('#resource-grid a[href*="#"]')].map((a) => a.getAttribute('href')),
    rows: [...document.querySelectorAll('#resource-table-body tr')].map((tr) => tr.textContent.replace(/\s+/g, ' ').trim()),
    snapshot: [...document.querySelectorAll('#snapshot-grid > div')].map((d) => d.textContent.replace(/\s+/g, ' ').trim()),
    sectionG: (() => {
      const sections = [...document.querySelectorAll('main section')].filter((s) => s.getAttribute('aria-labelledby') !== 'devspirehub-banner-title');
      return [...(sections[sections.length - 1]?.querySelectorAll('a') || [])].map((a) => [a.textContent.trim(), a.getAttribute('href')]);
    })(),
    bodyText: document.body.textContent
  }));

  const catCounts = await page.evaluate(() => ({
    tools: [...new Set(window.AI_TOOLS.map((r) => r.category))].length,
    models: [...new Set(window.AI_MODELS.map((r) => r.category))].length,
    dev: [...new Set(window.DEVELOPER_RESOURCES.map((r) => r.category))].length
  }));
  const totalRecords = data.counts.reduce((s, n) => s + n, 0);
  const dates = await page.evaluate(() => ({
    tools: window.AI_TOOLS_META.last_verified,
    models: window.AI_MODELS_META.last_verified,
    dev: window.DEVELOPER_RESOURCES_META.last_verified
  }));
  assert('datasets expose all three registries', data.counts.every((n) => n > 0) && data.counts[0] === 403 && data.counts[1] === 300 && data.counts[2] === 300, data.counts.join(','));
  assert('landing summary computed from datasets', data.summary === `${totalRecords} verified records across 3 registries`, data.summary);
  assert('AI Tools card count computed', data.typeCards.tools === `${data.counts[0]} records · ${catCounts.tools} categories`, data.typeCards.tools);
  assert('AI Models card count computed', data.typeCards.models === `${data.counts[1]} records · ${catCounts.models} categories`, data.typeCards.models);
  assert('Developer Resources card count computed', data.typeCards.dev === `${data.counts[2]} records · ${catCounts.dev} categories`, data.typeCards.dev);
  assert('coverage shows 5 categories per registry', data.coverage.tools.length === 5 && data.coverage.models.length === 5 && data.coverage.dev.length === 5);
  assert('coverage links filter the owning registry', data.coverage.tools.every(([, h]) => /^ai-tools\.html\?category=/.test(h))
    && data.coverage.models.every(([, h]) => /^models\.html\?category=/.test(h))
    && data.coverage.dev.every(([, h]) => /^developer-resources\.html\?category=/.test(h)));
  assert('coverage "all categories" counts computed', data.coverageAll.join('|') === `All ${catCounts.tools} categories →|All ${catCounts.models} categories →|All ${catCounts.dev} categories →`, data.coverageAll.join('|'));
  assert('4 featured records rendered', data.cards === 4, 'got ' + data.cards);
  const linkSet = [...new Set(data.cardLinks)];
  assert('featured cards use real deep links', linkSet.join(',') === 'ai-tools.html#tool/cursor,models.html#model/deepseek-r1,developer-resources.html#resource/vllm,developer-resources.html#resource/qdrant', linkSet.join(','));
  assert('dense table has 4 honest rows', data.rows.length === 4, 'rows=' + data.rows.length);
  assert('snapshot has 4 tiles with computed counts', data.snapshot.length === 4 && data.snapshot[0].includes(String(data.counts[0])) && data.snapshot[1].includes(String(data.counts[1])) && data.snapshot[2].includes(String(data.counts[2])) && data.snapshot[3].includes(String(totalRecords)), data.snapshot.join(' | '));
  assert('snapshot shows source-reported dates', data.snapshot[0].includes(dates.tools) && data.snapshot[1].includes(dates.models), JSON.stringify(dates));
  assert('section G CTAs point to real registries', data.sectionG.some(([t, h]) => t.includes('Browse Developer Resources') && h === 'developer-resources.html') && data.sectionG.some(([t, h]) => t.includes('Browse AI Models') && h === 'models.html'));
  assert('no fabricated catalog claims remain', !/2,340|1,420|580\+|340\+|RFC-483|POLL INTERVAL|automated verification|2 hrs ago|4 hrs ago/.test(data.bodyText));

  /* ---------- Featured deep links open real detail views ---------- */
  await page.goto(BASE + 'ai-tools.html#tool/cursor', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  assert('featured tool deep link opens detail', await page.isVisible('#detail-modal'));
  assert('tool deep link shows Cursor', (await page.textContent('#detail-content')).includes('Cursor'));

  await page.goto(BASE + 'models.html#model/deepseek-r1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  assert('featured model deep link opens detail', await page.isVisible('#detail-modal'));
  assert('model deep link shows DeepSeek-R1', (await page.textContent('#detail-content')).includes('DeepSeek-R1'));

  await page.goto(BASE + 'developer-resources.html#resource/vllm', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  assert('featured resource deep link opens detail', await page.isVisible('#detail-modal'));
  assert('resource deep link shows vLLM', (await page.textContent('#detail-content')).includes('vLLM'));

  /* ---------- Landing search ---------- */
  await page.goto(BASE + 'index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  await page.fill('#resource-search', 'llama');
  await page.waitForTimeout(450);
  const search = await page.evaluate(() => ({
    visible: !document.getElementById('search-results').hidden,
    summary: document.getElementById('search-results-summary').textContent.trim(),
    hrefs: [...document.querySelectorAll('#search-results-list a')].map((a) => a.getAttribute('href')),
    links: [...document.querySelectorAll('#search-results-links a')].map((a) => [a.textContent.trim(), a.getAttribute('href')])
  }));
  assert('landing search "llama" returns matches', /^\d+ match(es)?/.test(search.summary), search.summary);
  assert('landing search results visible', search.visible);
  assert('landing search links to deep views', search.hrefs.some((h) => h.startsWith('models.html#model/')) || search.hrefs.some((h) => h.startsWith('ai-tools.html#tool/')), search.hrefs.join(','));
  assert('landing search offers per-registry search', search.links.some(([t, h]) => /^AI (Models|Tools) \(\d+\) →$/.test(t) && /\.html\?q=llama$/.test(h)), JSON.stringify(search.links));

  const firstHref = await page.getAttribute('#search-results-list a', 'href');
  await page.click('#search-results-list a');
  await page.waitForTimeout(600);
  assert('clicking a search result opens its detail view', (await page.url()).includes(firstHref.split('#')[1] || '') && await page.isVisible('#detail-modal'), firstHref + ' -> ' + (await page.url()));

  await page.goto(BASE + 'index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.fill('#resource-search', 'zzzznotreal');
  await page.waitForTimeout(450);
  const empty = await page.evaluate(() => ({
    summary: document.getElementById('search-results-summary').textContent.trim(),
    items: document.querySelectorAll('#search-results-list a').length,
    links: [...document.querySelectorAll('#search-results-links a')].map((a) => a.getAttribute('href'))
  }));
  assert('landing search empty state is honest', /No records match/.test(empty.summary) && empty.items === 0, empty.summary);
  assert('landing search empty state offers registry links', empty.links.includes('ai-tools.html') && empty.links.includes('models.html') && empty.links.includes('developer-resources.html'));

  await page.click('#search-results-close');
  await page.waitForTimeout(150);
  assert('search panel closes', await page.isHidden('#search-results'));

  await page.click('[data-preset="RAG"]');
  await page.waitForTimeout(400);
  const preset = await page.evaluate(() => ({
    value: document.getElementById('resource-search').value,
    summary: document.getElementById('search-results-summary').textContent.trim(),
    hrefs: [...document.querySelectorAll('#search-results-list a')].map((a) => a.getAttribute('href')),
    links: [...document.querySelectorAll('#search-results-links a')].map((a) => [a.textContent.trim(), a.getAttribute('href')])
  }));
  assert('preset fills search and runs it', preset.value === 'RAG' && /match/.test(preset.summary), JSON.stringify(preset));
  assert('RAG preset finds developer resources', preset.links.some(([t, h]) => t.startsWith('Developer Resources') && h === 'developer-resources.html?q=RAG'), JSON.stringify(preset.links));

  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  assert('Escape hides search results', await page.isHidden('#search-results'));

  await page.click('#quick-find-jump');
  await page.waitForTimeout(300);
  assert('header Quick Find focuses landing search', await page.evaluate(() => document.activeElement && document.activeElement.id === 'resource-search'));

  await page.keyboard.press('Escape');
  await page.click('#search-clear');
  await page.waitForTimeout(150);
  assert('clear button empties query and hides results', await page.evaluate(() => document.getElementById('resource-search').value === '' && document.getElementById('search-results').hidden));

  /* ---------- Landing view toggle ---------- */
  await page.click('[data-view="table"]');
  await page.waitForTimeout(200);
  assert('dense table toggle shows table', await page.isVisible('#resource-table-wrap') && await page.isHidden('#resource-grid'));
  await page.click('[data-view="grid"]');
  await page.waitForTimeout(200);
  assert('grid toggle restores cards', await page.isVisible('#resource-grid') && await page.isHidden('#resource-table-wrap'));

  /* ---------- Category deep links into registries ---------- */
  const catCases = [
    ['ai-tools.html?category=Coding%20%26%20Development', 'Coding & Development', 'AI_TOOLS'],
    ['models.html?category=Vision%20%26%20Multimodal', 'Vision & Multimodal', 'AI_MODELS'],
    ['developer-resources.html?category=Vector%20Databases%20%26%20RAG', 'Vector Databases & RAG', 'DEVELOPER_RESOURCES']
  ];
  for (const [url, pill, key] of catCases) {
    await page.goto(BASE + url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const state = await page.evaluate(([pill, key]) => ({
      count: document.getElementById('results-count').textContent.trim(),
      expected: window[key].filter((r) => r.category === pill).length,
      active: [...document.querySelectorAll('#category-pills button[aria-pressed="true"]')].map((b) => b.textContent.trim())
    }), [pill, key]);
    assert(`${pill}: category deep link filters registry`, state.count.includes('of ' + state.expected), state.count + ' expected ' + state.expected);
    assert(`${pill}: category pill active from URL`, state.active.length === 1 && state.active[0].startsWith(pill), state.active.join(','));
  }

  await page.goto(BASE + 'ai-tools.html?q=cursor', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const qState = await page.evaluate(() => ({
    count: document.getElementById('results-count').textContent.trim(),
    value: document.getElementById('tool-search').value,
    expected: window.AI_TOOLS.filter((r) => [r.name, r.org, r.description, r.category, r.source_category, r.pricing, r.license, r.platform, r.official_url, ...(r.tags || [])].join(' ').toLowerCase().includes('cursor')).length
  }));
  assert('query deep link filters registry', qState.count.includes('of ' + qState.expected), qState.count);
  assert('query deep link fills search box', qState.value === 'cursor', qState.value);

  /* ---------- Footer-only tool page honesty ---------- */
  await page.goto(BASE + 'tools.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const legacy = await page.evaluate(() => ({
    text: document.querySelector('footer').textContent,
    dead: document.querySelectorAll('a[href="#"]').length
  }));
  assert('legacy tools footer drops automated-verification claim', !/automated verification|© 2025/.test(legacy.text));
  assert('legacy tools page has no dead anchors', legacy.dead === 0);

  await browser.close();
  consoleErrors.forEach((e) => console.error('CONSOLE:', e));
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n=== ${passed}/${results.length} checks passed ===`);
  results.filter((r) => !r.pass).forEach((r) => console.log('FAILED:', r.name, r.extra));
  process.exit(results.every((r) => r.pass) ? 0 : 1);
})().catch((e) => { console.error('HARNESS FAIL', e); process.exit(1); });
