/* Collections store gate: versioned schema, validation, dedupe, corrupted
   payload backups, missing records, multiple memberships, import/export and
   the browser-only storage contract.
   Run: node .qa/qa-collections-core.js */
const { chromium } = require('playwright-core');

const EXE = process.env.LOCALAPPDATA + '/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
const URL = 'file:///H:/Devspirehub AI/collections.html';
const KEY = 'devspire-nexus:personal-collections:v1';

let results = [];
const assert = (name, cond, extra) => {
  results.push({ name, pass: !!cond, extra: extra || '' });
  if (!cond) console.error('FAIL:', name, extra || '');
};

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  const seed = (payload) => page.evaluate(([key, value]) => {
    window.localStorage.clear();
    window.localStorage.setItem(key, value);
  }, [KEY, typeof payload === 'string' ? payload : JSON.stringify(payload)]);
  const reload = async () => {
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
  };

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.localStorage.clear());
  await reload();

  /* ---------- Empty state ---------- */
  const empty = await page.evaluate(() => ({
    notice: /browser|device|localStorage/i.test(document.body.innerText),
    saved: (document.querySelector('#saved-list')?.textContent || '').trim(),
    savedCount: (document.querySelector('#saved-count')?.textContent || '').trim(),
    collections: (document.querySelector('#collections-list')?.textContent || '').trim(),
    summary: document.querySelector('#collections-summary')?.textContent.replace(/\s+/g, ' ').trim(),
    noindex: !!document.querySelector('meta[name="robots"][content="noindex, nofollow"]'),
    store: !!window.DevSpireCollections
  }));
  assert('collections page explains browser-only storage', empty.notice);
  assert('empty saved list has an honest message', /no saved|nothing saved|bookmark/i.test(empty.saved), empty.saved.slice(0, 80));
  assert('empty collections list has guidance', empty.collections.length > 10);
  assert('summary starts at zero', /0/.test(empty.summary), empty.summary);
  assert('collections page is noindex', empty.noindex);
  assert('store is exposed for tooling', empty.store);

  /* ---------- Schema sanitisation ---------- */
  await seed({
    version: 1,
    bookmarks: [
      { resourceType: 'tool', resourceId: 'cursor', savedAt: '2026-11-01T10:00:00.000Z' },
      { resourceType: 'tool', resourceId: 'cursor', savedAt: '2026-11-02T10:00:00.000Z' },
      { resourceType: 'model', resourceId: 'deepseek-r1', savedAt: 'nonsense' },
      { resourceType: 'bogus', resourceId: 'x', savedAt: '2026-11-01T10:00:00.000Z' },
      { resourceType: 'resource', resourceId: '', savedAt: '2026-11-01T10:00:00.000Z' },
      null
    ],
    collections: [
      { id: 'c1', name: 'Stack', createdAt: '2026-11-01T10:00:00.000Z', updatedAt: '2026-11-01T10:00:00.000Z', resourceRefs: [{ resourceType: 'tool', resourceId: 'cursor' }, { resourceType: 'tool', resourceId: 'cursor' }, { resourceType: 'nope', resourceId: 'x' }] },
      { id: 'c1', name: 'Duplicate id', resourceRefs: [] },
      { id: 'c2', name: '   ', resourceRefs: [] }
    ]
  });
  await reload();
  const cleaned = await page.evaluate((key) => ({
    state: window.DevSpireCollections.load(),
    backups: Object.keys(window.localStorage).filter((k) => k.startsWith(key + ':corrupt:')).length
  }), KEY);
  assert('duplicate bookmarks collapse to one', cleaned.state.bookmarks.length === 2, cleaned.state.bookmarks.length);
  assert('invalid bookmark types and ids are dropped', cleaned.state.bookmarks.every((b) => b.resourceType !== 'bogus' && b.resourceId), JSON.stringify(cleaned.state.bookmarks));
  assert('invalid savedAt is replaced with a real timestamp', cleaned.state.bookmarks.every((b) => !Number.isNaN(Date.parse(b.savedAt))));
  assert('duplicate collection refs are deduped', cleaned.state.collections[0].resourceRefs.length === 1, JSON.stringify(cleaned.state.collections[0].resourceRefs));
  assert('duplicate collection ids and blank names are dropped', cleaned.state.collections.length === 1 && cleaned.state.collections[0].name === 'Stack');
  assert('repaired payload is backed up', cleaned.backups === 1, 'backups=' + cleaned.backups);

  /* ---------- Unsupported version ---------- */
  await seed({ version: 99, bookmarks: [{ resourceType: 'tool', resourceId: 'cursor' }], collections: [] });
  await reload();
  const badVersion = await page.evaluate((key) => ({
    state: window.DevSpireCollections.load(),
    backups: Object.keys(window.localStorage).filter((k) => k.startsWith(key + ':corrupt:')).length,
    empty: /no saved|nothing saved/i.test(document.querySelector('#saved-list').textContent)
  }), KEY);
  assert('unsupported schema version falls back to empty state', badVersion.state.bookmarks.length === 0 && badVersion.state.collections.length === 0 && badVersion.empty);
  assert('unsupported payload is preserved as a backup', badVersion.backups === 1);

  /* ---------- Bookmarks + missing records ---------- */
  await seed({ version: 1, bookmarks: [
    { resourceType: 'tool', resourceId: 'cursor', savedAt: '2026-11-01T10:00:00.000Z' },
    { resourceType: 'model', resourceId: 'deepseek-r1', savedAt: '2026-11-01T10:00:00.000Z' },
    { resourceType: 'resource', resourceId: 'vllm', savedAt: '2026-11-01T10:00:00.000Z' },
    { resourceType: 'tool', resourceId: 'record-that-was-removed', savedAt: '2026-11-01T10:00:00.000Z' }
  ], collections: [] });
  await reload();
  const saved = await page.evaluate(() => ({
    rows: document.querySelectorAll('#saved-list > div[class*="bg-surface-secondary"]').length,
    count: document.querySelector('#saved-count')?.textContent.trim(),
    missing: document.querySelectorAll('#saved-list [data-missing-row]').length,
    missingText: document.querySelector('#saved-list [data-missing-row]')?.textContent.replace(/\s+/g, ' ').trim() || '',
    details: [...document.querySelectorAll('#saved-list a')].filter((a) => /Details/.test(a.textContent)).map((a) => a.getAttribute('href'))
  }));
  assert('saved rows render for resolved records', saved.rows === 3, 'rows=' + saved.rows);
  assert('saved count reflects bookmarks', saved.count === '4 saved', saved.count);
  assert('missing record is shown honestly', saved.missing === 1 && /no longer in the catalog/i.test(saved.missingText), saved.missingText);
  assert('saved rows link to registry details', saved.details.length === 3 && saved.details.every((h) => /^(ai-tools|models|developer-resources)\.html#(tool|model|resource)\//.test(h)), saved.details.join(','));

  /* Search filter */
  await page.fill('#collection-search', 'cursor');
  await page.waitForTimeout(350);
  const filtered = await page.evaluate(() => ({
    rows: document.querySelectorAll('#saved-list > div[class*="bg-surface-secondary"]').length,
    text: document.querySelector('#saved-list').textContent
  }));
  assert('collection search filters saved rows', filtered.rows === 1 && /cursor/i.test(filtered.text), 'rows=' + filtered.rows);
  await page.fill('#collection-search', '');
  await page.waitForTimeout(350);

  /* ---------- Collections: memberships, validation ---------- */
  const store = await page.evaluate(() => {
    const S = window.DevSpireCollections;
    const a = S.createCollection('Stack A');
    const b = S.createCollection('Stack B');
    const dup = S.createCollection('stack a');
    const long = S.createCollection('x'.repeat(61));
    const blank = S.createCollection('   ');
    S.addToCollection(a.collection.id, 'tool', 'cursor');
    S.addToCollection(b.collection.id, 'tool', 'cursor');
    S.addToCollection(a.collection.id, 'tool', 'cursor');
    const renameDup = S.renameCollection(b.collection.id, 'Stack A');
    const missingRename = S.renameCollection('nope', 'Whatever');
    return {
      dup: dup.ok, long: long.ok, blank: blank.ok,
      renameDup: renameDup.ok, missingRename: missingRename.ok,
      memberships: S.collectionsFor('tool', 'cursor').length,
      refs: S.load().collections.map((c) => c.resourceRefs.length),
      names: S.load().collections.map((c) => c.name)
    };
  });
  assert('duplicate collection names are rejected', !store.dup);
  assert('collection names are length-limited', !store.long);
  assert('blank collection names are rejected', !store.blank);
  assert('renaming onto an existing name is rejected', !store.renameDup);
  assert('renaming a missing collection is rejected', !store.missingRename);
  assert('a resource can belong to multiple collections', store.memberships === 2, 'memberships=' + store.memberships);
  assert('adding the same ref twice does not duplicate it', store.refs[0] === 1 && store.refs[1] === 1, JSON.stringify(store.refs));

  await reload();
  const rendered = await page.evaluate(() => ({
    cards: document.querySelectorAll('#collections-list [data-collection]').length,
    addForms: document.querySelectorAll('#collections-list [data-add]').length,
    text: document.querySelector('#collections-summary')?.textContent.replace(/\s+/g, ' ').trim()
  }));
  assert('custom collections render after reload', rendered.cards === 2, 'cards=' + rendered.cards);
  assert('collection summary counts entries', /2/.test(rendered.text), rendered.text);

  /* ---------- Export / import ---------- */
  const exp = await page.evaluate(() => {
    const parsed = JSON.parse(window.DevSpireCollections.exportJSON());
    return {
      version: parsed.version,
      bookmarks: parsed.bookmarks.length,
      collections: parsed.collections.length,
      refKeys: Object.keys(parsed.bookmarks[0] || {}).sort(),
      leaks: /"(description|official_url|icon|category|tags)"/.test(JSON.stringify(parsed))
    };
  });
  assert('export uses the versioned schema', exp.version === 1, exp.version);
  assert('export keeps stable references only', JSON.stringify(exp.refKeys) === JSON.stringify(['resourceId', 'resourceType', 'savedAt']), exp.refKeys.join(','));
  assert('export does not copy record payloads', !exp.leaks);

  const imported = await page.evaluate(() => {
    const S = window.DevSpireCollections;
    const good = S.exportJSON();
    S.clearAll();
    const invalid = S.importJSON('{not json');
    const wrongVersion = S.importJSON(JSON.stringify({ version: 2, bookmarks: [], collections: [] }));
    const restore = S.importJSON(good);
    const afterRestore = { bookmarks: S.load().bookmarks.length, collections: S.load().collections.length };
    const deduped = S.importJSON(JSON.stringify({
      version: 1,
      bookmarks: [
        { resourceType: 'tool', resourceId: 'cursor', savedAt: '2026-11-01T10:00:00.000Z' },
        { resourceType: 'tool', resourceId: 'cursor', savedAt: '2026-11-01T10:00:00.000Z' }
      ],
      collections: []
    }));
    return {
      invalid: invalid.ok, wrongVersion: wrongVersion.ok, restore: restore.ok,
      afterRestore, deduped: deduped.ok, dedupedBookmarks: S.load().bookmarks.length
    };
  });
  assert('invalid JSON is rejected', !imported.invalid);
  assert('wrong schema version is rejected', !imported.wrongVersion);
  assert('valid export re-imports completely', imported.restore && imported.afterRestore.bookmarks === 4 && imported.afterRestore.collections === 2, JSON.stringify(imported.afterRestore));
  assert('import dedupes repeated references', imported.deduped && imported.dedupedBookmarks === 1, imported.dedupedBookmarks);

  /* ---------- No external transmission ---------- */
  const external = [];
  const watch = (req) => {
    const url = req.url();
    if (/^https?:/.test(url) && !/fonts\.(googleapis|gstatic)\.com|cdn\.tailwindcss\.com/.test(url)) external.push(url);
  };
  page.on('request', watch);
  await page.evaluate(() => {
    const S = window.DevSpireCollections;
    S.toggleBookmark('model', 'llama-3-1');
    S.createCollection('Offline test');
    S.exportJSON();
  });
  await page.waitForTimeout(500);
  page.off('request', watch);
  assert('collections never transmit data off-device', external.length === 0, external.join(','));

  assert('no console or page errors', errors.length === 0, errors.slice(0, 5).join(' | '));

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
