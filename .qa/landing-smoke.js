const { chromium } = require('playwright-core');
const EXE = process.env.LOCALAPPDATA + '/ms-playwright/chromium-1248/chrome-win64/chrome.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file:///H:/Devspirehub AI/directory.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const info = await page.evaluate(() => ({
    summary: document.getElementById('catalog-summary-text').textContent,
    tools: document.getElementById('tools-count').textContent,
    models: document.getElementById('models-count').textContent,
    dev: document.getElementById('dev-count').textContent,
    coverage: {
      tools: document.querySelectorAll('#coverage-tools li').length,
      models: document.querySelectorAll('#coverage-models li').length,
      dev: document.querySelectorAll('#coverage-dev li').length
    },
    cards: document.querySelectorAll('#resource-grid .ui-card').length,
    cardLinks: [...document.querySelectorAll('#resource-grid a[href*="#"]')].map((a) => a.getAttribute('href')),
    rows: document.querySelectorAll('#resource-table-body tr').length,
    snapshot: document.querySelectorAll('#snapshot-grid > div').length,
    dead: document.querySelectorAll('a[href="#"]').length,
    nav: [...document.querySelectorAll('header nav[aria-label="Primary"] a')].map((a) => [a.textContent.trim(), a.getAttribute('href'), a.getAttribute('aria-current')])
  }));
  console.log(JSON.stringify(info, null, 1));

  await page.fill('#resource-search', 'llama');
  await page.waitForTimeout(400);
  const res = await page.evaluate(() => ({
    visible: !document.getElementById('search-results').hidden,
    summary: document.getElementById('search-results-summary').textContent,
    items: [...document.querySelectorAll('#search-results-list a')].map((a) => [a.textContent.trim().replace(/\s+/g, ' '), a.getAttribute('href')]),
    links: [...document.querySelectorAll('#search-results-links a')].map((a) => [a.textContent.trim(), a.getAttribute('href')])
  }));
  console.log(JSON.stringify(res, null, 1));

  await page.fill('#resource-search', 'zzzznotreal');
  await page.waitForTimeout(400);
  console.log('empty:', await page.textContent('#search-results-summary'));

  console.log('errors:', errors);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
