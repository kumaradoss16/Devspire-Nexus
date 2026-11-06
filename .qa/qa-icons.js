const { chromium } = require('playwright-core');
const EXE = process.env.LOCALAPPDATA + '/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const out = { widths: {}, icons: {}, checks: {} };
  for (const width of [320, 375, 480, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto('file:///H:/Devspirehub AI/tools.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    out.widths[width] = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('file:///H:/Devspirehub AI/tools.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  out.checks.brokenImgs = await page.evaluate(() =>
    [...document.querySelectorAll('img')].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute('src')));
  await page.selectOption('#sort-select', 'name');
  await page.waitForTimeout(300);
  const pages = (await page.textContent('#page-indicator')).trim();
  out.checks.pages = pages;
  const pageCount = parseInt(pages.match(/of (\d+)/)[1], 10);
  const bad = [];
  const svgIcons = {};
  for (let p = 1; p <= pageCount; p++) {
    const res = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('#tool-grid article')];
      return cards.map(c => {
        const name = c.querySelector('h2').textContent;
        const img = c.querySelector('.tool-favicon');
        const svg = c.querySelector('.tool-icon');
        const broken = img && (!img.complete || img.naturalWidth === 0);
        return { name, hasImg: !!img, imgBroken: !!broken, hasSvg: !!svg };
      });
    });
    res.forEach(r => {
      if (r.hasSvg) svgIcons[r.name] = true;
      if (r.imgBroken || (!r.hasImg && !r.hasSvg)) bad.push(r);
    });
    if (p < pageCount) {
      await page.click('#pagination-controls button:not(:disabled):last-child');
      await page.waitForTimeout(250);
    }
  }
  out.icons.svgIconTools = Object.keys(svgIcons);
  out.icons.badCards = bad;
  await browser.close();
  console.log(JSON.stringify(out, null, 2));
})().catch(e => { console.error('FAIL', e); process.exit(1); });
