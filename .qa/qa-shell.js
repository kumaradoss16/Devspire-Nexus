/* Phase 2/4/5/6/7/8 gate: canonical shell, hover/focus integrity, metadata,
   quick-query behaviour and the responsive sweep.
   Run: node .qa/qa-shell.js */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const EXE = process.env.LOCALAPPDATA + '/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
const ROOT = path.join(__dirname, '..');
const BASE = 'file:///H:/Devspirehub AI/';
const WIDTHS = [320, 375, 480, 768, 1024, 1280, 1440];

const PAGES = [
  'directory.html',
  'ai-tools.html',
  'models.html',
  'developer-resources.html',
  'submit.html',
  'terminal.html',
  'api.html',
  'docs.html',
  'tools.html',
  'about.html',
  'privacy.html',
  'contact.html',
  'terms.html',
  'collections.html'
];

const NAV = [
  'directory.html', 'ai-tools.html', 'models.html', 'developer-resources.html',
  'collections.html', 'about.html', 'https://devspirehub.com/'
];

const FOOTER = {
  explore: ['directory.html', 'ai-tools.html', 'models.html', 'developer-resources.html'],
  product: ['collections.html', 'about.html', 'contact.html', 'docs.html', 'api.html', 'submit.html'],
  legal: ['privacy.html', 'terms.html'],
  devspirehub: [
    'https://devspirehub.com/',
    'https://devspirehub.com/Website/about/about.html',
    'https://devspirehub.com/Resources/digital-resources/digital-resources-hub.html'
  ]
};

const ACTIVE = {
  'directory.html': 'directory.html',
  'ai-tools.html': 'ai-tools.html',
  'models.html': 'models.html',
  'developer-resources.html': 'developer-resources.html',
  'collections.html': 'collections.html',
  'about.html': 'about.html',
  'privacy.html': 'about.html',
  'contact.html': 'about.html',
  'terms.html': 'about.html'
};

let results = [];
const assert = (name, cond, extra) => {
  results.push({ name, pass: !!cond, extra: extra || '' });
  if (!cond) console.error('FAIL:', name, extra || '');
};

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const consoleErrors = [];
  const watch = (page, tag) => {
    page.on('pageerror', (e) => consoleErrors.push(`${tag}: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`${tag}: ${m.text()}`); });
  };

  for (const file of PAGES) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    watch(page, file);
    await page.goto(BASE + file, { waitUntil: 'networkidle' });
    await page.waitForTimeout(350);

    const shell = await page.evaluate(() => {
      const get = (sel) => document.querySelector(sel);
      const footerGroups = [...document.querySelectorAll('footer nav[aria-labelledby^="footer-"]')].map((nav) => ({
        id: nav.getAttribute('aria-labelledby').replace('footer-', ''),
        links: [...nav.querySelectorAll('a')].map((a) => a.getAttribute('href'))
      }));
      const external = [...document.querySelectorAll('a[target="_blank"]')].map((a) => ({
        href: a.getAttribute('href'),
        rel: a.getAttribute('rel') || ''
      }));
      return {
        title: document.title,
        description: get('meta[name="description"]')?.getAttribute('content') || '',
        ogTitle: get('meta[property="og:title"]')?.getAttribute('content') || '',
        ogDescription: get('meta[property="og:description"]')?.getAttribute('content') || '',
        twitter: get('meta[name="twitter:card"]')?.getAttribute('content') || '',
        theme: get('meta[name="theme-color"]')?.getAttribute('content') || '',
        siteCss: !!document.querySelector('link[href="assets/site.css"]'),
        skip: get('a.skip-link')?.getAttribute('href'),
        skipFirst: document.body.firstElementChild?.classList.contains('skip-link'),
        mainId: get('main')?.id,
        nav: [...document.querySelectorAll('header nav[aria-label="Primary"] a')].map((a) => a.getAttribute('href')),
        active: [...document.querySelectorAll('header nav[aria-label="Primary"] a[aria-current="page"]')].map((a) => a.getAttribute('href')),
        mobile: [...document.querySelectorAll('#mobile-menu a')].map((a) => a.getAttribute('href')),
        footerGroups,
        attribution: /DevSpire Nexus is a product of DevSpireHub\.com\./.test(get('footer')?.textContent || ''),
        banner: document.querySelectorAll('#devspirehub-banner-title').length,
        h1: document.querySelectorAll('h1').length,
        dead: document.querySelectorAll('a[href="#"]').length,
        external,
        icons: [...document.querySelectorAll('a .material-symbols-outlined, button .material-symbols-outlined')]
          .filter((i) => i.getBoundingClientRect().width > 0)
          .map((i) => ({ hidden: i.getAttribute('aria-hidden'), shrink: getComputedStyle(i).flexShrink })),
        labelledIcons: [...document.querySelectorAll('.material-symbols-outlined')].length,
        hiddenIcons: [...document.querySelectorAll('.material-symbols-outlined[aria-hidden="true"]')].length
      };
    });

    assert(`${file}: title and description`, shell.title.length > 8 && shell.description.length > 40, shell.title);
    assert(`${file}: Open Graph mirrors the page`, shell.ogTitle === shell.title && shell.ogDescription === shell.description, `${shell.ogTitle} | ${shell.ogDescription}`);
    assert(`${file}: Twitter card and theme colour`, shell.twitter === 'summary' && /^#090D12$/i.test(shell.theme), `${shell.twitter}/${shell.theme}`);
    assert(`${file}: shared stylesheet linked`, shell.siteCss);
    assert(`${file}: skip link targets the main landmark`, shell.skip === '#main-content' && shell.skipFirst && shell.mainId === 'main-content', `${shell.skip}/${shell.mainId}`);
    assert(`${file}: exactly one page heading`, shell.h1 === 1, shell.h1);

    assert(`${file}: primary navigation is canonical`, JSON.stringify(shell.nav) === JSON.stringify(NAV), shell.nav.join(','));
    if (ACTIVE[file]) {
      assert(`${file}: current page marked once`, JSON.stringify(shell.active) === JSON.stringify([ACTIVE[file]]), shell.active.join(','));
    } else {
      assert(`${file}: no false nav current marker`, shell.active.length === 0, shell.active.join(','));
    }
    assert(`${file}: mobile menu offers all destinations`, JSON.stringify(shell.mobile.slice(0, 6)) === JSON.stringify(NAV.slice(0, 6)) && shell.mobile.includes('submit.html') && shell.mobile.includes('https://devspirehub.com/') && shell.mobile.includes('https://devspirehub.com/Website/about/about.html'), shell.mobile.join(','));

    const groups = Object.fromEntries(shell.footerGroups.map((g) => [g.id, g.links]));
    assert(`${file}: footer has four groups`, JSON.stringify(Object.keys(groups)) === JSON.stringify(Object.keys(FOOTER)), Object.keys(groups).join(','));
    for (const key of Object.keys(FOOTER)) {
      assert(`${file}: footer ${key} links`, JSON.stringify(groups[key]) === JSON.stringify(FOOTER[key]), (groups[key] || []).join(','));
    }
    assert(`${file}: footer attribution`, shell.attribution);
    assert(`${file}: no dead anchors`, shell.dead === 0, shell.dead);
    assert(`${file}: external links are noopener`, shell.external.every((l) => /noopener/.test(l.rel)), shell.external.filter((l) => !/noopener/.test(l.rel)).map((l) => l.href).join(','));
    assert(`${file}: decorative icons are hidden from AT`, shell.icons.length > 0 && shell.icons.every((i) => i.hidden === 'true'), JSON.stringify(shell.icons.slice(0, 3)));
    assert(`${file}: icons do not shrink`, shell.icons.every((i) => i.shrink === '0'), shell.icons.filter((i) => i.shrink !== '0').length);

    if (file === 'directory.html') {
      assert('directory: DevSpireHub banner appears exactly once', shell.banner === 1, shell.banner);
      assert('directory: banner links to the parent site', await page.evaluate(() => [...document.querySelectorAll('#devspirehub-banner-title')].every((h) => h.closest('section').querySelector('a[href="https://devspirehub.com/"]'))));
    } else {
      assert(`${file}: no repeated DevSpireHub banner`, shell.banner === 0, shell.banner);
    }

    /* Local file links must resolve. */
    const local = await page.evaluate(() => [...document.querySelectorAll('a[href]')]
      .map((a) => a.getAttribute('href'))
      .filter((h) => h && !/^(https?:|#|mailto:|tel:|javascript:)/i.test(h)));
    const missing = [...new Set(local)].filter((h) => !fs.existsSync(path.join(ROOT, h.split(/[?#]/)[0])));
    assert(`${file}: local links resolve`, missing.length === 0, missing.join(','));

    /* Category rows: hover must not clip vertically, and must scroll natively. */
    const scroller = await page.$('#category-pills');
    if (scroller) {
      const info = await scroller.evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth, oy: getComputedStyle(el).overflowY }));
      assert(`${file}: category row scrolls horizontally`, info.sw > info.cw && info.oy === 'hidden', JSON.stringify(info));
      await scroller.evaluate((el) => { el.scrollLeft = 0; });
      const pill = page.locator('#category-pills button').first();
      await pill.hover();
      await page.waitForTimeout(250);
      const clip = await page.evaluate(() => {
        const el = document.getElementById('category-pills');
        const b = el.querySelector('button');
        const sr = el.getBoundingClientRect();
        const pr = b.getBoundingClientRect();
        return { top: pr.top - sr.top, bottom: sr.bottom - pr.bottom, transform: getComputedStyle(b).transform };
      });
      assert(`${file}: category pill hover is not clipped`, clip.top >= -0.5 && clip.bottom >= -0.5, JSON.stringify(clip));
    }

    /* Focus ring reaches the skip link (some pages focus their search on load). */
    await page.focus('a.skip-link');
    await page.waitForTimeout(300);
    const focus = await page.evaluate(() => {
      const el = document.activeElement;
      return { cls: el.className, top: el.getBoundingClientRect().top, outline: getComputedStyle(el).outlineStyle };
    });
    assert(`${file}: skip link visible on focus`, /skip-link/.test(focus.cls) && focus.top >= 0 && focus.outline !== 'none', JSON.stringify(focus));

    await page.close();
  }

  /* ---------- Quick queries: every shortcut must change real results ---------- */
  const quick = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  watch(quick, 'quick');
  await quick.goto(BASE + 'ai-tools.html', { waitUntil: 'networkidle' });
  await quick.waitForTimeout(300);
  const quickKinds = await quick.evaluate(() => [...document.querySelectorAll('[data-quick]')].map((b) => ({
    kind: b.dataset.quick,
    count: Number(document.querySelector(`[data-quick-count="${b.dataset.quick}"]`).textContent)
  })));
  for (const item of quickKinds) {
    await quick.click(`[data-quick="${item.kind}"]`);
    await quick.waitForTimeout(250);
    const shown = await quick.evaluate(() => Number((document.getElementById('results-count').textContent.match(/of\s+(\d+)/) || [])[1]));
    assert(`quick query ${item.kind} returns its stated count`, shown === item.count && shown > 0, `shown=${shown} badge=${item.count}`);
  }
  await quick.evaluate(() => document.getElementById('reset-all-filters').click());
  await quick.waitForTimeout(250);
  const fullRegistry = await quick.evaluate(() => window.AI_TOOLS.length);
  assert('quick queries reset to the full registry', (await quick.evaluate(() => Number((document.getElementById('results-count').textContent.match(/of\s+(\d+)/) || [])[1]))) === fullRegistry, `expected ${fullRegistry}`);
  await quick.close();

  const modelQuick = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  watch(modelQuick, 'model-quick');
  await modelQuick.goto(BASE + 'models.html', { waitUntil: 'networkidle' });
  await modelQuick.waitForTimeout(300);
  const presetCount = await modelQuick.locator('.preset-btn').count();
  const modelTotal = await modelQuick.evaluate(() => window.AI_MODELS.length);
  for (let i = 0; i < presetCount; i++) {
    const btn = modelQuick.locator('.preset-btn').nth(i);
    const preset = await btn.getAttribute('data-preset');
    await btn.click();
    await modelQuick.waitForTimeout(220);
    const shown = await modelQuick.evaluate(() => Number((document.getElementById('results-count').textContent.match(/of\s+(\d+)/) || [])[1]));
    assert(`model preset ${preset} filters the registry`, shown > 0 && shown < modelTotal, `shown=${shown}/${modelTotal}`);
  }
  await modelQuick.close();

  const landingQuick = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  watch(landingQuick, 'landing-quick');
  await landingQuick.goto(BASE + 'directory.html', { waitUntil: 'networkidle' });
  await landingQuick.waitForTimeout(300);
  await landingQuick.click('.preset-chip[data-preset="Coding"]');
  await landingQuick.waitForTimeout(350);
  const landingResults = await landingQuick.evaluate(() => ({
    visible: !document.getElementById('search-results').hidden,
    items: document.querySelectorAll('#search-results-list li').length,
    value: document.getElementById('resource-search').value
  }));
  assert('landing preset runs a real cross-registry search', landingResults.visible && landingResults.items > 0 && /coding/i.test(landingResults.value), JSON.stringify(landingResults));
  await landingQuick.click('#search-results-close');
  await landingQuick.waitForTimeout(200);
  assert('landing preset results can be cleared', await landingQuick.isHidden('#search-results'));
  await landingQuick.close();

  /* ---------- Responsive sweep, all pages and widths ---------- */
  for (const file of PAGES) {
    for (const width of WIDTHS) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      watch(page, `${file}@${width}`);
      await page.goto(BASE + file, { waitUntil: 'networkidle' });
      await page.waitForTimeout(250);
      const metrics = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        vw: document.documentElement.clientWidth,
        header: document.querySelector('header .flex').getBoundingClientRect().width,
        headerVw: document.querySelector('header .flex').parentElement.getBoundingClientRect().width
      }));
      assert(`${file}: no horizontal overflow @${width}`, metrics.sw <= metrics.vw + 1, `scrollW=${metrics.sw} vw=${metrics.vw}`);
      await page.close();
    }
  }

  /* ---------- Reduced motion ---------- */
  const reduced = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  await reduced.goto(BASE + 'directory.html', { waitUntil: 'networkidle' });
  await reduced.waitForTimeout(300);
  const motion = await reduced.evaluate(() => ({
    grid: getComputedStyle(document.body, '::before').animationName,
    brand: getComputedStyle(document.querySelector('.brand-mark')).animationName
  }));
  assert('reduced motion disables ambient animation', motion.grid === 'none' && motion.brand === 'none', JSON.stringify(motion));
  await reduced.close();

  assert('zero console/page errors across the shell sweep', consoleErrors.length === 0, consoleErrors.slice(0, 6).join(' | '));

  await browser.close();
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n=== ${passed}/${results.length} checks passed ===`);
  results.filter((r) => !r.pass).forEach((r) => console.log('FAILED:', r.name, r.extra));
})();
