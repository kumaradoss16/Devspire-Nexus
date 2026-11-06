const { chromium } = require('playwright-core');
const path = require('path');

const EXE = path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1248/chrome-win64/chrome.exe');
const BASE = 'file:///H:/Devspirehub AI/';

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));

  for (const [file, grid, idAttr, btn] of [
    ['ai-tools.html', '#tool-grid', 'data-tool-id', '[data-details]'],
    ['models.html', '#model-grid', 'data-model-id', '[data-details]'],
    ['developer-resources.html', '#resource-grid', 'data-resource-id', '[data-details]']
  ]) {
    await page.goto(BASE + file, { waitUntil: 'load' });
    await page.waitForTimeout(900);
    const stats = await page.evaluate(({ grid, idAttr }) => {
      const cards = [...document.querySelectorAll(grid + ' [' + idAttr + ']')];
      return {
        cards: cards.length,
        withImg: cards.filter((c) => c.querySelector('img')).length,
        withFallback: cards.filter((c) => c.querySelector('.resource-icon-fallback')).length,
        noVisual: cards.filter((c) => !c.querySelector('img') && !c.querySelector('.resource-icon-fallback')).length
      };
    }, { grid, idAttr });
    const first = page.locator(grid + ' ' + btn).first();
    await first.click();
    await page.waitForTimeout(300);
    const detail = await page.evaluate(() => ({
      open: !document.getElementById('detail-modal').hidden,
      bookmark: Boolean(document.querySelector('#detail-content [data-bookmark]')),
      record: document.getElementById('detail-content').dataset.recordType
    }));
    console.log(file, JSON.stringify(stats), JSON.stringify(detail));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }
  console.log('errors', errors);
  await browser.close();
})();
