/* Related Resources gate: data-driven ranking, page + detail sections,
   cross-registry links, show-more, filters, deep links, responsive layout.
   Run: node .qa/qa-related.js */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const EXE = process.env.LOCALAPPDATA + '/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
const BASE = 'file:///H:/Devspirehub AI/';
const ROOT = path.join(__dirname, '..');

const loadLength = (file) => {
  const sandbox = { window: {} };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), sandbox);
  const w = sandbox.window;
  const key = Object.keys(w).find((k) => Array.isArray(w[k]));
  return w[key].length;
};

const PAGES = [
  { file: 'ai-tools.html', key: 'AI_TOOLS', type: 'tool', prefix: 'tool', attr: 'toolId', search: '#tool-search', grid: 'tool-grid' },
  { file: 'models.html', key: 'AI_MODELS', type: 'model', prefix: 'model', attr: 'modelId', search: '#model-search', grid: 'model-grid' },
  { file: 'developer-resources.html', key: 'DEVELOPER_RESOURCES', type: 'resource', prefix: 'resource', attr: 'resourceId', search: '#dev-search', grid: 'resource-grid' }
];
const TYPE_BY_PREFIX = { tool: 'AI Tool', model: 'AI Model', resource: 'Developer Resource' };
const PAGE_BY_TYPE = { tool: 'ai-tools.html', model: 'models.html', resource: 'developer-resources.html' };

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

  /* ---------- Index integrity ---------- */
  const indexPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  watch(indexPage, 'index');
  await indexPage.goto(BASE + 'ai-tools.html', { waitUntil: 'networkidle' });
  await indexPage.waitForTimeout(400);
  const indexInfo = await indexPage.evaluate(() => {
    const index = window.RELATED_INDEX || {};
    const indexRows = ['t', 'm', 'd'].reduce((n, k) => n + (index[k] || []).length, 0);
    const rows = ['t', 'm', 'd'].flatMap((k) => index[k] || []);
    const ids = rows.map((r) => r[0]);
    return {
      indexRows,
      engineCount: window.RelatedResources.count,
      idsUnique: new Set(ids).size === ids.length,
      allHaveNameCatUrl: rows.every((r) => r[1] && r[2] && r[8]),
      allRowsCompact: rows.every((r) => Array.isArray(r) && r.length === 9)
    };
  });
  const total = loadLength('data/ai-tools.js') + loadLength('data/ai-models.js') + loadLength('data/developer-resources.js');
  assert('related index covers every record', indexInfo.indexRows === total && indexInfo.engineCount === total, `index=${indexInfo.indexRows} engine=${indexInfo.engineCount} total=${total}`);
  assert('related index ids are unique', indexInfo.idsUnique);
  assert('related index rows carry name, category and url', indexInfo.allHaveNameCatUrl);
  assert('related index rows stay compact (9 columns)', indexInfo.allRowsCompact);
  await indexPage.close();

  for (const spec of PAGES) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    watch(page, spec.file);
    const remote = [];
    page.on('request', (r) => { if (/^https?:/.test(r.url())) remote.push(r.url()); });
    await page.goto(BASE + spec.file, { waitUntil: 'networkidle' });
    await page.locator('#related-page').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const state = await page.evaluate((spec) => {
      const reg = window[spec.key];
      const root = document.querySelector('#related-page [data-related-root]');
      const cards = [...document.querySelectorAll('#related-page [data-related-card]')];
      const source = root ? root.dataset.sourceId : null;
      const sourceRecord = reg.find((r) => r.id === source) || null;
      const related = source ? window.RelatedResources.related(spec.type, source) : null;
      const idsInIndex = new Set(['t', 'm', 'd'].flatMap((k) => (window.RELATED_INDEX[k] || []).map((r) => r[0])));
      return {
        source,
        sourceName: sourceRecord && sourceRecord.name,
        rootTotal: root ? +root.dataset.total : 0,
        visible: root ? +root.dataset.visible : 0,
        headingTag: root ? root.querySelector('.related-heading').tagName : null,
        cardHeadingTag: cards[0] ? cards[0].querySelector('.related-name').tagName : null,
        labelledby: root ? !!document.getElementById(root.getAttribute('aria-labelledby')) : false,
        copy: root ? root.textContent.replace(/\s+/g, ' ') : '',
        cards: cards.map((c) => ({
          key: c.dataset.relatedCard,
          name: c.querySelector('.related-name').textContent.trim(),
          type: c.querySelector('.related-type').textContent.trim(),
          cat: c.querySelector('.related-cat').textContent.trim(),
          desc: c.querySelector('.related-desc').textContent.trim(),
          tags: c.querySelectorAll('.related-tags span').length,
          href: c.querySelector('.related-link').getAttribute('href'),
          site: c.querySelector('.related-link-muted').getAttribute('href'),
          focusable: c.querySelectorAll('a[href]').length === 2
        })),
        selfInCards: cards.some((c) => c.dataset.relatedCard === spec.type + ':' + source),
        uniqueKeys: new Set(cards.map((c) => c.dataset.relatedCard)).size === cards.length,
        uniqueNames: new Set(cards.map((c) => c.querySelector('.related-name').textContent.trim())).size === cards.length,
        relatedIdsExist: cards.every((c) => idsInIndex.has(c.dataset.relatedCard.split(':')[1])),
        hasCrossRegistrySample: reg.slice(0, 40).some((r) => window.RelatedResources.related(spec.type, r.id).items.some((e) => e.row.type !== spec.type)),
        firstCardId: document.querySelector('#related-page [data-related-card] .related-link').getAttribute('href').split('#')[1],
        iconState: cards.map((c) => {
          const img = c.querySelector('.related-icon img');
          const fallback = c.querySelector('.related-mono, .resource-icon-fallback');
          return img ? { loaded: img.complete && img.naturalWidth > 0, local: !/^https?:/.test(img.getAttribute('src') || '') } : { mono: !!fallback && !fallback.hidden && fallback.textContent.trim().length >= 2 };
        })
      };
    }, spec);
    const regLength = await page.evaluate((k) => window[k].length, spec.key);

    assert(`${spec.file}: page-level section uses the first filtered record`, !!state.source, state.source);
    assert(`${spec.file}: section names the source record`, !!state.sourceName && state.copy.includes(state.sourceName), state.sourceName);
    assert(`${spec.file}: page heading is h2 and cards are h3`, state.headingTag === 'H2' && state.cardHeadingTag === 'H3', `${state.headingTag}/${state.cardHeadingTag}`);
    assert(`${spec.file}: section has 3 initial cards (or all when fewer)`, state.visible === Math.min(3, state.rootTotal) && state.cards.length === state.visible, `visible=${state.visible} cards=${state.cards.length} total=${state.rootTotal}`);
    assert(`${spec.file}: section is labelled by its heading`, state.labelledby);
    assert(`${spec.file}: current record is excluded`, !state.selfInCards);
    assert(`${spec.file}: cards are unique`, state.uniqueKeys && state.uniqueNames);
    assert(`${spec.file}: related ids exist in the index`, state.relatedIdsExist);
    assert(`${spec.file}: related items exist for sampled records`, regLength > 0 && state.hasCrossRegistrySample);
    assert(`${spec.file}: cards carry type, name, category, description`, state.cards.every((c) => c.name && c.cat && c.desc.length > 0 && TYPE_BY_PREFIX[c.key.split(':')[0]] === c.type), JSON.stringify(state.cards.map((c) => [c.name, c.type, c.cat])));
    assert(`${spec.file}: card links target their own registry detail views`, state.cards.every((c) => c.href === PAGE_BY_TYPE[c.key.split(':')[0]] + '#' + c.key.replace(':', '/')), state.cards.map((c) => c.href).join(','));
    assert(`${spec.file}: official links are https and labelled`, state.cards.every((c) => /^https:\/\//.test(c.site)) && state.cards.every((c) => c.focusable));
    assert(`${spec.file}: cards show at most three tags`, state.cards.every((c) => c.tags <= 3));
    assert(`${spec.file}: card icons render locally or fall back to a category glyph`, state.iconState.every((i) => (i.loaded && i.local) || i.mono), JSON.stringify(state.iconState));
    assert(`${spec.file}: no remote requests beyond the shared shell`, remote.every((u) => /^https:\/\/(cdn\.tailwindcss\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|devspirehub\.com)\//.test(u)), remote.slice(0, 4).join(','));

    /* Show more */
    const hasMore = state.rootTotal > state.visible;
    const moreButton = page.locator('#related-page [data-related-more]');
    assert(`${spec.file}: show-more appears only when more exist`, (await moreButton.count()) === (hasMore ? 1 : 0), `more=${hasMore}`);
    if (hasMore) {
      assert(`${spec.file}: show-more count is honest`, /\b(Show )?\d+ more related/.test(await moreButton.textContent()));
      await moreButton.click();
      await page.waitForTimeout(150);
      const after = await page.evaluate(() => {
        const root = document.querySelector('#related-page [data-related-root]');
        return {
          visible: root.querySelectorAll('[data-related-card]').length,
          total: +root.dataset.total,
          more: !!root.querySelector('[data-related-more]'),
          names: [...root.querySelectorAll('.related-name')].map((n) => n.textContent.trim())
        };
      });
      assert(`${spec.file}: show-more expands without exceeding the total`, after.visible === Math.min(state.visible + 6, after.total), JSON.stringify(after));
      assert(`${spec.file}: show-more never duplicates cards`, new Set(after.names).size === after.names.length);
      assert(`${spec.file}: show-more hides when everything is shown`, after.visible === after.total ? !after.more : after.more);
    }

    /* Filtered context */
    const firstName = await page.evaluate((k) => {
      const el = document.querySelector('#' + (k === 'AI_TOOLS' ? 'tool-grid' : k === 'AI_MODELS' ? 'model-grid' : 'resource-grid') + ' article h2');
      return el ? el.textContent.trim() : '';
    }, spec.key);
    await page.fill(spec.search, firstName);
    await page.waitForTimeout(450);
    const filtered = await page.evaluate(() => {
      const root = document.querySelector('#related-page [data-related-root]');
      const first = document.querySelector('[id$="-grid"] article');
      const idAttr = first ? [...first.attributes].find((a) => /^data-.*-id$/.test(a.name)) : null;
      const gridFirst = first ? first.querySelector('h2').textContent.trim() : '';
      return { sourceName: root ? root.textContent.includes(gridFirst) : false, source: root ? root.dataset.sourceId : null, idAttr: idAttr ? idAttr.value : null, gridFirst };
    });
    assert(`${spec.file}: related section follows the active filter`, filtered.sourceName && filtered.source === filtered.idAttr, JSON.stringify(filtered));

    await page.fill(spec.search, 'zzzznotreal');
    await page.waitForTimeout(450);
    assert(`${spec.file}: related section hides when nothing matches`, await page.evaluate(() => {
      const c = document.getElementById('related-page');
      return c.hidden && c.children.length === 0;
    }));

    await page.fill(spec.search, '');
    await page.waitForTimeout(450);

    /* Detail section + cross-registry navigation */
    const deep = await page.evaluate((spec) => {
      const reg = window[spec.key];
      for (const r of reg) {
        const result = window.RelatedResources.related(spec.type, r.id);
        if (result.total >= 9) {
          const cross = result.items.find((e) => e.row.type !== spec.type);
          return { id: r.id, name: r.name, total: result.total, cross: cross ? { key: cross.row.type + ':' + cross.row.id, name: cross.row.name } : null };
        }
      }
      return null;
    }, spec);
    assert(`${spec.file}: a record with changeable related set exists`, !!deep && deep.total >= 9, JSON.stringify(deep));

    if (deep) {
      await page.goto(BASE + spec.file + '#' + spec.prefix + '/' + deep.id, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      const detail = await page.evaluate(() => {
        const root = document.querySelector('#detail-content [data-related-detail] [data-related-root]');
        const cards = root ? [...root.querySelectorAll('[data-related-card]')] : [];
        return {
          root: !!root,
          total: root ? +root.dataset.total : 0,
          visible: cards.length,
          heading: root ? root.querySelector('.related-heading').tagName : null,
          cardHeading: cards[0] ? cards[0].querySelector('.related-name').tagName : null,
          self: root ? cards.some((c) => c.dataset.relatedCard === root.dataset.sourceType + ':' + root.dataset.sourceId) : true,
          names: cards.map((c) => c.querySelector('.related-name').textContent.trim()),
          crossHref: (() => {
            const c = cards.find((x) => x.dataset.relatedCard.split(':')[0] !== root.dataset.sourceType);
            return c ? { href: c.querySelector('.related-link').getAttribute('href'), name: c.querySelector('.related-name').textContent.trim() } : null;
          })()
        };
      });
      assert(`${spec.file}: detail view renders its related block`, detail.root && detail.visible === Math.min(6, detail.total), JSON.stringify(detail));
      assert(`${spec.file}: detail related block is h3 with h4 cards`, detail.heading === 'H3' && detail.cardHeading === 'H4', `${detail.heading}/${detail.cardHeading}`);
      assert(`${spec.file}: detail related block excludes the open record`, !detail.self);
      assert(`${spec.file}: detail related block is unique`, new Set(detail.names).size === detail.names.length);
      assert(`${spec.file}: related block spans registries where relevant`, !!detail.crossHref, JSON.stringify(detail.crossHref));

      if (detail.crossHref) {
        const [targetPage, hash] = detail.crossHref.href.split('#');
        const sourceUrl = await page.evaluate(() => location.pathname.split('/').pop() + location.hash);
        await page.click('#detail-content [data-related-detail] [data-related-card] a.related-link[href^="' + targetPage + '#"]');
        await page.waitForTimeout(700);
        const cross = await page.evaluate(() => ({
          url: location.pathname.split('/').pop() + location.hash,
          open: !document.getElementById('detail-modal').hidden,
          title: document.getElementById('detail-title').textContent.trim()
        }));
        assert(`${spec.file}: related link opens the target record directly`, cross.url === targetPage + '#' + hash && cross.open, JSON.stringify(cross));
        assert(`${spec.file}: target detail matches the related card`, cross.title.includes(detail.crossHref.name), `${cross.title} vs ${detail.crossHref.name}`);
        await page.goBack();
        await page.waitForTimeout(600);
        const back = await page.evaluate(() => ({
          url: location.pathname.split('/').pop() + location.hash,
          open: !document.getElementById('detail-modal').hidden
        }));
        assert(`${spec.file}: browser back restores the source deep link`, back.url === sourceUrl && back.open, `${back.url} vs ${sourceUrl}`);
      }
    }

    await page.close();
  }

  /* ---------- Responsive layout ---------- */
  for (const spec of PAGES) {
    for (const width of [320, 375, 480, 768, 1024, 1280, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      watch(page, `${spec.file}@${width}`);
      await page.goto(BASE + spec.file, { waitUntil: 'networkidle' });
      await page.waitForTimeout(450);
      const m = await page.evaluate(() => {
        const doc = document.documentElement;
        const root = document.querySelector('#related-page [data-related-root]');
        const cards = root ? [...root.querySelectorAll('[data-related-card]')] : [];
        const grid = root ? root.querySelector('[data-related-grid]') : null;
        return {
          scrollW: doc.scrollWidth,
          vw: doc.clientWidth,
          hidden: !root,
          cardOverflow: grid ? cards.filter((c) => {
            const g = grid.getBoundingClientRect();
            const b = c.getBoundingClientRect();
            return b.left < g.left - 1 || b.right > g.right + 1;
          }).length : 0,
          columns: grid ? new Set(cards.map((c) => Math.round(c.getBoundingClientRect().top))).size : 0
        };
      });
      assert(`${spec.file}: no page overflow @${width}`, m.scrollW <= m.vw + 1, `scrollW=${m.scrollW} vw=${m.vw}`);
      assert(`${spec.file}: related cards fit their grid @${width}`, m.hidden || m.cardOverflow === 0, `overflow=${m.cardOverflow}`);
      if (width >= 1024) assert(`${spec.file}: related grid is 3-up @${width}`, m.hidden || m.columns === 1, `rows=${m.columns}`);
      if (width === 320) assert(`${spec.file}: related grid stacks on small screens`, m.hidden || m.columns === 3, `rows=${m.columns}`);
      await page.close();
    }
  }

  /* ---------- Motion preference ---------- */
  const motion = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  watch(motion, 'reduced-motion');
  await motion.goto(BASE + 'ai-tools.html', { waitUntil: 'networkidle' });
  await motion.waitForTimeout(400);
  const reduced = await motion.evaluate(() => {
    const card = document.querySelector('.related-card');
    return {
      defined: [...document.styleSheets].some((sheet) => {
        try { return [...sheet.cssRules].some((rule) => rule.conditionText && /prefers-reduced-motion/.test(rule.conditionText)); } catch { return false; }
      }),
      transition: card ? getComputedStyle(card).transitionDuration : null
    };
  });
  assert('related styles include a reduced-motion rule', reduced.defined);
  assert('reduced motion removes card transitions', !reduced.transition || reduced.transition === '0s', reduced.transition);
  await motion.close();

  assert('zero console/page errors across related checks', consoleErrors.length === 0, consoleErrors.slice(0, 6).join(' | '));

  await browser.close();
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n=== ${passed}/${results.length} checks passed ===`);
  results.filter((r) => !r.pass).forEach((r) => console.log('FAILED:', r.name, '--', r.extra));
  process.exit(results.every((r) => r.pass) ? 0 : 1);
})().catch((e) => { console.error('HARNESS FAIL', e); process.exit(1); });
