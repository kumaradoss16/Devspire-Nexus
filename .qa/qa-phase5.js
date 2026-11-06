/* Phase 5 gate: catalog terminal, static API files, submission drafts, documentation.
   Run: node .qa/qa-phase5.js */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const EXE = process.env.LOCALAPPDATA + '/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
const ROOT = path.join(__dirname, '..');
const BASE = 'file:///H:/Devspirehub AI/';

let results = [];
const assert = (name, cond, extra) => {
  results.push({ name, pass: !!cond, extra: extra || '' });
  if (!cond) console.error('FAIL:', name, extra || '');
};

const loadRegistry = (file) => {
  const sandbox = { window: {} };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), sandbox);
  const w = sandbox.window;
  const key = Object.keys(w).find((k) => Array.isArray(w[k]));
  return { records: w[key], meta: w[key + '_META'] || {} };
};

const DATA = {
  tools: loadRegistry('data/ai-tools.js'),
  models: loadRegistry('data/ai-models.js'),
  'developer-resources': loadRegistry('data/developer-resources.js')
};
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'api', 'catalog.json'), 'utf8'));
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex');
const totalRecords = DATA.tools.records.length + DATA.models.records.length + DATA['developer-resources'].records.length;

/* ---------- Static data integrity ---------- */
assert('manifest is declared as static files', manifest.kind === 'static-files' && /no hosted api|no live endpoint/i.test(manifest.note), JSON.stringify(manifest.kind));
assert('manifest total = loaded datasets', manifest.total_records === totalRecords, `manifest=${manifest.total_records} data=${totalRecords}`);
assert('three registries in manifest', Object.keys(manifest.registries).join(',') === 'tools,models,developer-resources', Object.keys(manifest.registries).join(','));

for (const key of Object.keys(DATA)) {
  const { records } = DATA[key];
  const file = `api/${key}.json`;
  const doc = JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
  const reg = manifest.registries[key];
  assert(`${key}: api file count matches dataset`, doc.records.length === records.length && doc._meta.count === records.length, `${doc.records.length}/${doc._meta.count} vs ${records.length}`);
  assert(`${key}: ids unique in dataset and api`, new Set(records.map((r) => r.id)).size === records.length && new Set(doc.records.map((r) => r.id)).size === records.length);
  assert(`${key}: ids preserved in api file`, doc.records.every((r, i) => r.id === records[i].id));
  assert(`${key}: manifest count matches`, reg.count === records.length, `${reg.count} vs ${records.length}`);
  assert(`${key}: manifest sha matches file`, reg.sha256 === sha256(file), `${reg.sha256} vs ${sha256(file)}`);
  assert(`${key}: manifest bytes match file`, reg.bytes === fs.statSync(path.join(ROOT, file)).size, `${reg.bytes}`);
  assert(`${key}: api meta has categories summing to count`, doc._meta.categories.reduce((s, c) => s + c.count, 0) === records.length, JSON.stringify(doc._meta.categories));
}

/* ---------- Static source scans ---------- */
const pageSource = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const inlineScripts = (html) => [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const forbidden = [/\beval\s*\(/, /\bnew\s+Function\s*\(/, /\bfetch\s*\(/, /XMLHttpRequest/, /WebSocket/, /\blocalStorage\b/, /\bsessionStorage\b/, /document\.write\s*\(/];

const terminalSrc = pageSource('terminal.html');
const terminalInline = inlineScripts(terminalSrc).join('\n');
assert('terminal: no eval/Function/fetch/XHR/sockets/storage', forbidden.every((re) => !re.test(terminalInline)), forbidden.filter((re) => re.test(terminalInline)).join(','));
assert('terminal: no innerHTML rendering of user input', !/innerHTML/.test(terminalInline));
assert('terminal: declares no shell execution', /This is not a system shell\./.test(terminalSrc));
const submitInline = inlineScripts(pageSource('submit.html')).join('\n');
assert('submit: no eval/Function/XHR/WebSocket', !/\beval\s*\(|\bnew\s+Function\s*\(|XMLHttpRequest|WebSocket/.test(submitInline));
assert('submit: transmits only to the Web3Forms endpoint', /api\.web3forms\.com\/submit/.test(submitInline) && /fetch\(endpoint/.test(submitInline));
assert('submit: access key comes from configuration, not source', /web3formsAccessKey/.test(submitInline) && !/access_key\s*:\s*['"][A-Za-z0-9-]{12,}/.test(submitInline));
const siteConfigSrc = fs.readFileSync(path.join(ROOT, 'data/site-config.js'), 'utf8');
assert('config: no real access key is committed', /web3formsAccessKey:\s*''/.test(siteConfigSrc), siteConfigSrc.split('\n')[1]);
const apiSrc = pageSource('api.html');
assert('api: no hosted endpoint claim', /There is no API server in this build\./.test(apiSrc) && !/https?:\/\/api\./.test(apiSrc));
assert('api: no API key or auth claim', !/API key|bearer token|authentication required/i.test(apiSrc));

/* ---------- Browser pass ---------- */
(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const consoleErrors = [];
  const watch = (page, tag) => {
    page.on('pageerror', (e) => consoleErrors.push(`${tag}: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`${tag}: ${m.text()}`); });
  };

  /* Responsive sweep for the four new pages */
  for (const file of ['terminal.html', 'api.html', 'submit.html', 'docs.html']) {
    for (const width of [320, 375, 480, 768, 1024, 1280, 1440]) {
      const p = await browser.newPage({ viewport: { width, height: 900 } });
      watch(p, `${file}@${width}`);
      await p.goto(BASE + file, { waitUntil: 'networkidle' });
      await p.waitForTimeout(350);
      const m = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
      assert(`${file}: no overflow @${width}`, m.sw <= m.vw + 1, `scrollW=${m.sw} vw=${m.vw}`);
      await p.close();
    }
  }

  /* ---------- Terminal ---------- */
  const tp = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  watch(tp, 'terminal');
  const requests = [];
  tp.on('request', (r) => { if (/^https?:/.test(r.url())) requests.push(r.url()); });
  await tp.goto(BASE + 'terminal.html', { waitUntil: 'networkidle' });
  await tp.waitForTimeout(400);
  requests.length = 0;

  const out = async () => (await tp.textContent('#terminal-output')) || '';
  const run = async (cmd) => {
    await tp.fill('#terminal-input', cmd);
    await tp.press('#terminal-input', 'Enter');
    await tp.waitForTimeout(80);
  };

  assert('terminal title', (await tp.title()).includes('Catalog Terminal'));
  assert('terminal read-only chip', (await tp.textContent('main')).includes('READ-ONLY · ALLOWLIST'));
  assert('terminal banner counts', (await out()).includes(`Loaded ${DATA.tools.records.length} AI tools, ${DATA.models.records.length} AI models, ${DATA['developer-resources'].records.length} developer resources.`), await out());
  assert('terminal styles applied', await tp.evaluate(() => getComputedStyle(document.getElementById('terminal-output')).backgroundColor === 'rgb(11, 17, 23)'));

  await run('help');
  const helpText = await out();
  assert('help lists all eight commands', ['help', 'stats', 'list', 'search', 'show', 'categories', 'open', 'clear'].every((c) => helpText.includes(c)));
  assert('help states no shell/eval/network', /No shell, eval, file access, or network calls are available\./.test(helpText));

  await run('stats');
  const statsText = await out();
  assert(`stats total = ${totalRecords} across 3 registries`, statsText.includes(`Catalog total: ${totalRecords} records across 3 registries`), statsText.split('\n').slice(-4).join(' | '));
  assert('stats lists each registry count', statsText.includes(`AI Tools: ${DATA.tools.records.length} records`) && statsText.includes(`AI Models: ${DATA.models.records.length} records`) && statsText.includes(`Developer Resources: ${DATA['developer-resources'].records.length} records`));

  const before = (await out()).length;
  await run('sudo rm -rf /');
  const rejected = (await out()).slice(before);
  assert('unknown command rejected without evaluation', rejected.includes('Unknown command "sudo"'), rejected);

  const beforeInjection = (await out()).length;
  await run('<img src=x onerror="window.__pwn=1">');
  await tp.waitForTimeout(200);
  const injText = (await out()).slice(beforeInjection);
  assert('injection echoed as literal text', injText.includes('<img src=x onerror="window.__pwn=1">'), injText);
  assert('injection did not execute', await tp.evaluate(() => window.__pwn === undefined));
  assert('injection created no DOM nodes', (await tp.locator('#terminal-output img').count()) === 0);
  await run('`whoami`');
  assert('backtick command not evaluated', /Unknown command "`whoami`"/.test(await out()) && await tp.evaluate(() => window.__pwn === undefined));

  await run('list models');
  const listText = await out();
  assert('list models caps at 25 and reports the rest', new RegExp(`AI Models · ${DATA.models.records.length} records`).test(listText) && new RegExp(`… ${DATA.models.records.length - 25} more\\. Use search to narrow\\.`).test(listText), listText.slice(-200));
  await run('list nonsense');
  assert('list rejects unknown registry', /Unknown registry "nonsense"/.test(await out()));
  await run('list');
  assert('list requires a registry argument', /Usage: list <registry>/.test(await out()));

  const sampleName = await tp.evaluate(() => window.AI_MODELS[0].name);
  const term = sampleName.split(/\s+/).find((w) => w.length >= 4) || sampleName.slice(0, 4);
  await run('search ' + term.toLowerCase());
  assert('search finds dataset records', new RegExp(`match(es)? for "${term.toLowerCase()}"`).test(await out()), await out());
  await run('search a');
  assert('search requires two characters', /at least 2 characters/.test(await out()));
  await run('search zzzzzqqqq');
  assert('search reports no matches honestly', /No records match/.test(await out()));

  const toolId = await tp.evaluate(() => window.AI_TOOLS[0].id);
  await run('show ' + toolId);
  const showText = await out();
  assert('show prints stated fields and id', showText.includes(`Id: ${toolId}`), showText.slice(-300));
  assert('show omits unstated fields explicitly', showText.includes('Fields the source does not state are omitted, never filled in.'));
  await run('show does-not-exist');
  assert('show rejects unknown id', /No record with id "does-not-exist"/.test(await out()));

  await run('categories models');
  const catText = await out();
  const catSum = [...catText.matchAll(/\((\d+)\)/g)].reduce((s, m) => s + parseInt(m[1], 10), 0);
  assert('categories models sums to the registry', catSum === DATA.models.records.length, `sum=${catSum}`);

  await run('clear');
  assert('clear empties the output', (await out()).trim() === '', await out());

  await run('stats');
  await tp.fill('#terminal-input', '');
  await tp.press('#terminal-input', 'ArrowUp');
  assert('arrow-up recalls command history', (await tp.inputValue('#terminal-input')) === 'stats', await tp.inputValue('#terminal-input'));
  await tp.press('#terminal-input', 'ArrowDown');
  assert('arrow-down returns to a blank prompt', (await tp.inputValue('#terminal-input')) === '', await tp.inputValue('#terminal-input'));

  await tp.evaluate(() => {
    const input = document.getElementById('terminal-input');
    input.value = 'x'.repeat(201);
    document.getElementById('terminal-form').dispatchEvent(new Event('submit', { cancelable: true }));
  });
  await tp.waitForTimeout(80);
  assert('oversized input rejected at 200 chars', /Input rejected: 200 characters maximum\./.test(await out()));
  assert('terminal made zero network requests', requests.length === 0, requests.join(','));
  await tp.close();

  const op = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  watch(op, 'terminal-open');
  await op.goto(BASE + 'terminal.html', { waitUntil: 'networkidle' });
  await op.waitForTimeout(300);
  await op.fill('#terminal-input', 'open ' + toolId);
  await op.press('#terminal-input', 'Enter');
  await op.waitForURL(/ai-tools\.html#tool\//, { timeout: 5000 });
  await op.waitForTimeout(500);
  const deep = await op.evaluate(() => ({
    hash: decodeURIComponent(location.hash),
    modal: !document.getElementById('detail-modal').hidden,
    title: document.getElementById('detail-title').textContent.trim()
  }));
  assert('open deep-links to the record page', deep.hash === `#tool/${toolId}` && deep.modal, JSON.stringify(deep));
  assert('open shows the record name in the modal', deep.title.length > 0, deep.title);
  await op.close();

  /* ---------- API page ---------- */
  const ap = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  watch(ap, 'api');
  await ap.goto(BASE + 'api.html', { waitUntil: 'networkidle' });
  await ap.waitForTimeout(300);

  assert('api title', (await ap.title()).includes('Static Catalog API'));
  assert('api banner names the missing server', (await ap.textContent('main')).includes('There is no API server in this build.'));
  assert('api static chip', (await ap.textContent('main')).includes('STATIC FILES · NO HOSTED ENDPOINT'));
  assert('api headline counts records and registries', new RegExp(`${totalRecords} records across 3 registries`).test(await ap.textContent('main')));

  const apiRows = await ap.evaluate(() => {
    const table = document.querySelectorAll('table.p5-table')[0];
    if (!table) return [];
    return [...table.querySelectorAll('tbody tr')].map((tr) => [...tr.cells].map((td) => td.textContent.trim()));
  });
  assert('api file table has 4 entries', apiRows.length === 4, JSON.stringify(apiRows));
  assert('api table counts match datasets', apiRows[1][2] === String(DATA.tools.records.length) && apiRows[2][2] === String(DATA.models.records.length) && apiRows[3][2] === String(DATA['developer-resources'].records.length), JSON.stringify(apiRows.map((r) => r[2])));
  assert('api table sha prefixes match manifest', apiRows[1][3].startsWith(manifest.registries.tools.sha256.slice(0, 12)) && apiRows[3][3].startsWith(manifest.registries['developer-resources'].sha256.slice(0, 12)), apiRows.map((r) => r[3]).join(' | '));

  const sampleText = (await ap.textContent('#manifest-sample')).trim();
  const sourceManifest = fs.readFileSync(path.join(ROOT, 'api', 'catalog.json'), 'utf8').trim();
  assert('manifest sample equals api/catalog.json', sampleText === sourceManifest, `len ${sampleText.length} vs ${sourceManifest.length}`);
  assert('api fetch example names a real file', (await ap.textContent('main')).includes("fetch('api/tools.json')"));

  await ap.click('button[data-copy="api/tools.json"]');
  await ap.waitForTimeout(200);
  assert('copy path reports feedback', /Copied path: api\/tools\.json|Copy failed/.test(await ap.textContent('#copy-status')), await ap.textContent('#copy-status'));
  await ap.click('button[data-copy-target="manifest-sample"]');
  await ap.waitForTimeout(250);
  assert('copy manifest reports feedback', /Manifest JSON copied|Copy failed/.test(await ap.textContent('#copy-status')), await ap.textContent('#copy-status'));

  await ap.setViewportSize({ width: 375, height: 900 });
  await ap.waitForTimeout(300);
  const mobileApi = await ap.evaluate(() => ({
    cards: [...document.querySelectorAll('#file-list li')].length,
    cardsVisible: getComputedStyle(document.getElementById('file-list')).display !== 'none',
    tableHidden: getComputedStyle(document.querySelector('table.p5-table').parentElement).display === 'none',
    sw: document.documentElement.scrollWidth,
    vw: document.documentElement.clientWidth
  }));
  assert('api mobile cards replace the wide table', mobileApi.cards === 4 && mobileApi.cardsVisible && mobileApi.tableHidden, JSON.stringify(mobileApi));
  assert('api mobile fits the viewport', mobileApi.sw <= mobileApi.vw + 1, `${mobileApi.sw}/${mobileApi.vw}`);
  await ap.close();

  /* ---------- Submit page: honest configuration and validation ---------- */
  const sp = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  watch(sp, 'submit');
  const submitPosts = [];
  sp.on('request', (r) => { if (r.method() === 'POST' && /^https?:/.test(r.url())) submitPosts.push(r.url()); });
  await sp.goto(BASE + 'submit.html', { waitUntil: 'networkidle' });
  await sp.waitForTimeout(300);

  assert('submit title', (await sp.title()).includes('Submit a Resource'));
  assert('submit page names its delivery service', /Web3Forms/.test(await sp.textContent('main')));
  assert('submit page states pending moderation', /pending moderation|not published automatically/i.test(await sp.textContent('main')));
  assert('unconfigured copy warns before submitting', await sp.isVisible('#config-status'));
  assert('form fields use the dark surface, not the plugin default', await sp.evaluate(() => {
    const s = getComputedStyle(document.getElementById('sub-name'));
    return s.backgroundColor === 'rgb(17, 24, 32)' && s.color === 'rgb(241, 245, 249)';
  }), await sp.evaluate(() => getComputedStyle(document.getElementById('sub-name')).backgroundColor));

  await sp.click('#submission-form button[type="submit"]');
  await sp.waitForTimeout(250);
  assert('unconfigured submit is refused honestly', /not configured/i.test(await sp.textContent('#form-summary')), await sp.textContent('#form-summary'));
  assert('unconfigured submit keeps the receipt hidden', await sp.isHidden('#draft-section'));
  assert('unconfigured submit makes no network request', submitPosts.length === 0, submitPosts.join(','));

  await sp.evaluate(() => { window.DSH_SITE_CONFIG.web3formsAccessKey = 'qa-only-not-real'; });
  await sp.click('#submission-form button[type="submit"]');
  await sp.waitForTimeout(250);
  assert('empty submit blocked with five required fields', /fix 5 fields/i.test(await sp.textContent('#form-summary')), await sp.textContent('#form-summary'));
  assert('empty submit does not produce a receipt', await sp.isHidden('#draft-section'));
  assert('required fields flagged invalid', (await sp.locator('#submission-form [aria-invalid="true"]').count()) === 5);

  await sp.fill('#sub-name', 'Test Resource');
  await sp.selectOption('#sub-type', 'AI Model');
  const modelCats = await sp.evaluate(() => window.AI_MODELS.map((r) => r.category));
  const options = await sp.evaluate(() => [...document.querySelectorAll('#category-options option')].map((o) => o.value));
  assert('category suggestions follow the selected type', options.length > 0 && options.every((v) => modelCats.includes(v)), `${options.length} options`);

  await sp.fill('#sub-url', 'not-a-url');
  await sp.fill('#sub-category', 'Language Model');
  await sp.fill('#sub-description', 'Short');
  await sp.fill('#sub-evidence', 'ftp://example.com/evidence');
  await sp.click('#submission-form button[type="submit"]');
  await sp.waitForTimeout(250);
  assert('URL validation rejects non-http urls', (await sp.textContent('#err-url')).includes('http:// or https://'), await sp.textContent('#err-url'));
  assert('description length enforced', (await sp.textContent('#err-description')).includes('40 to 600'), await sp.textContent('#err-description'));
  assert('evidence URL validated', (await sp.textContent('#err-evidence')).includes('http:// or https://'), await sp.textContent('#err-evidence'));
  assert('validation failure keeps the entries', (await sp.inputValue('#sub-name')) === 'Test Resource');
  assert('validation failure makes no network request', submitPosts.length === 0, submitPosts.join(','));

  await sp.fill('#sub-evidence', 'https://example.com/docs/test-resource');
  assert('correcting a field clears its error', await sp.isHidden('#err-evidence'));

  await sp.click('#clear-form');
  await sp.waitForTimeout(250);
  assert('clear resets the form', (await sp.inputValue('#sub-name')) === '' && (await sp.inputValue('#sub-type')) === '');
  assert('clear hides the receipt', await sp.isHidden('#draft-section'));
  assert('clear withdraws alerts', await sp.isHidden('#form-summary'));
  await sp.close();

  /* ---------- Docs ---------- */
  const dp = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  watch(dp, 'docs');
  await dp.goto(BASE + 'docs.html', { waitUntil: 'networkidle' });
  await dp.waitForTimeout(300);

  assert('docs title', (await dp.title()).includes('Documentation'));
  assert('docs counts computed', await dp.evaluate((counts) => {
    return document.getElementById('doc-tools-count').textContent === counts.tools &&
      document.getElementById('doc-models-count').textContent === counts.models &&
      document.getElementById('doc-resources-count').textContent === counts.dev;
  }, {
    tools: String(DATA.tools.records.length),
    models: String(DATA.models.records.length),
    dev: String(DATA['developer-resources'].records.length)
  }));
  assert('docs verified dates computed', /Last verified \d{4}-\d{2}-\d{2}/.test(await dp.textContent('#doc-tools-verified')), await dp.textContent('#doc-tools-verified'));
  const docCounts = await dp.evaluate(() => [...document.querySelectorAll('[data-doc-count]')].map((el) => el.textContent));
  assert('docs inline counts populated', docCounts.length > 0 && docCounts.every((v) => /^\d+$/.test(v)), docCounts.join(','));

  const sections = await dp.evaluate(() => [...document.querySelectorAll('main section[id]')].map((s) => s.id));
  assert('docs sections present', ['overview', 'datasets', 'pipeline', 'terminal', 'api', 'submissions', 'qa', 'limits'].every((id) => sections.includes(id)), sections.join(','));
  assert('docs jump links resolve', await dp.evaluate(() => [...document.querySelectorAll('.docs-jump')].every((a) => document.getElementById(a.getAttribute('href').slice(1)))));

  const localLinks = await dp.evaluate(() => [...document.querySelectorAll('main a[href], footer a[href]')].map((a) => a.getAttribute('href')).filter((h) => h && !/^(https?:|#|mailto:)/.test(h)));
  const missing = [...new Set(localLinks)].filter((h) => !fs.existsSync(path.join(ROOT, h.split(/[?#]/)[0])));
  assert('docs local links point at files that exist', missing.length === 0, missing.join(','));
  assert('docs describes Web3Forms delivery', /Web3Forms/.test(await dp.textContent('#submissions')));
  assert('docs states submissions are moderated, not published', /moderation|review/i.test(await dp.textContent('#submissions')) && /not.*publish|never.*automatically/i.test(await dp.textContent('#submissions')));
  assert('docs states terminal limits', /no shell|allowlist/i.test(await dp.textContent('#terminal')));
  assert('docs states static API limits', /not a hosted service|no base URL/i.test(await dp.textContent('#api')));
  await dp.close();

  /* ---------- Shared shell on the Phase 5 pages ---------- */
  const navExpect = ['directory.html', 'ai-tools.html', 'models.html', 'developer-resources.html', 'collections.html', 'about.html', 'https://devspirehub.com/'];
  const footerExpect = ['directory.html', 'ai-tools.html', 'models.html', 'developer-resources.html', 'collections.html', 'about.html', 'contact.html', 'docs.html', 'api.html', 'submit.html', 'privacy.html', 'terms.html', 'https://devspirehub.com/', 'https://devspirehub.com/Website/about/about.html', 'https://devspirehub.com/Resources/digital-resources/digital-resources-hub.html'];
  for (const file of ['terminal.html', 'api.html', 'submit.html', 'docs.html']) {
    const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    watch(p, `${file}:shell`);
    await p.goto(BASE + file, { waitUntil: 'networkidle' });
    await p.waitForTimeout(250);
    const shell = await p.evaluate(() => ({
      cssLeak: document.body.innerText.includes('Phase 5 utility pages'),
      first: document.body.firstElementChild.tagName,
      skipFirst: document.body.firstElementChild.classList.contains('skip-link'),
      nav: [...document.querySelectorAll('header nav[aria-label="Primary"] a')].map((a) => a.getAttribute('href')),
      submit: [...document.querySelectorAll('header a')].find((a) => a.textContent.trim() === 'Submit Resource')?.getAttribute('href'),
      footer: [...document.querySelectorAll('footer a')].map((a) => a.getAttribute('href')),
      footerGroups: [...document.querySelectorAll('footer nav[aria-labelledby^="footer-"]')].map((n) => n.getAttribute('aria-labelledby').replace('footer-', '')),
      dead: document.querySelectorAll('a[href="#"]').length,
      mobileNav: [...document.querySelectorAll('#mobile-menu a')].map((a) => a.getAttribute('href'))
    }));
    assert(`${file}: stylesheet is not rendered as body text`, !shell.cssLeak && shell.skipFirst && shell.first === 'A', `leak=${shell.cssLeak} first=${shell.first}`);
    assert(`${file}: desktop nav canonical`, JSON.stringify(shell.nav) === JSON.stringify(navExpect), shell.nav.join(','));
    assert(`${file}: submit links to submit.html`, shell.submit === 'submit.html', shell.submit);
    assert(`${file}: footer is grouped`, JSON.stringify(shell.footerGroups) === JSON.stringify(['explore', 'product', 'legal', 'devspirehub']), shell.footerGroups.join(','));
    assert(`${file}: footer links are canonical`, JSON.stringify(shell.footer) === JSON.stringify(footerExpect), shell.footer.join(','));
    assert(`${file}: data access is reachable from the footer`, shell.footer.includes('api.html'));
    assert(`${file}: no dead anchors`, shell.dead === 0, shell.dead);
    assert(`${file}: mobile nav canonical`, JSON.stringify(shell.mobileNav.slice(0, 6)) === JSON.stringify(navExpect.slice(0, 6)) && shell.mobileNav.includes('submit.html') && shell.mobileNav.includes('https://devspirehub.com/'), shell.mobileNav.join(','));
    await p.close();
  }

  assert('zero console/page errors across Phase 5 pages', consoleErrors.length === 0, consoleErrors.slice(0, 6).join(' | '));

  await browser.close();
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n=== ${passed}/${results.length} checks passed ===`);
  results.filter((r) => !r.pass).forEach((r) => console.log('FAILED:', r.name, r.extra));
  process.exit(results.every((r) => r.pass) ? 0 : 1);
})().catch((e) => { console.error('HARNESS FAIL', e); process.exit(1); });
