const { chromium } = require('playwright-core');
const EXE = process.env.LOCALAPPDATA + '/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto('file:///H:/Devspirehub AI/models.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: '.qa/shots/models-1440.png', fullPage: false });
  await page.evaluate(() => document.getElementById('model-grid').scrollIntoView());
  await page.waitForTimeout(300);
  await page.screenshot({ path: '.qa/shots/models-1440-grid.png' });
  // detail modal
  await page.click('#model-grid article [data-details]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: '.qa/shots/models-detail.png' });
  await page.keyboard.press('Escape');
  // compare modal
  const boxes = await page.$$('#model-grid [data-compare]');
  for (let i = 0; i < 3; i++) { await boxes[i].click(); await page.waitForTimeout(120); }
  await page.click('#compare-btn');
  await page.waitForTimeout(400);
  await page.screenshot({ path: '.qa/shots/models-compare.png' });
  await browser.close();
  const m = await browser.newPage ? null : null;
  const b2 = await chromium.launch({ executablePath: EXE });
  const mp = await b2.newPage({ viewport: { width: 375, height: 800 } });
  await mp.goto('file:///H:/Devspirehub AI/models.html', { waitUntil: 'networkidle' });
  await mp.waitForTimeout(600);
  await mp.screenshot({ path: '.qa/shots/models-375.png', fullPage: false });
  await b2.close();
  console.log('shots done');
})().catch(e => { console.error(e); process.exit(1); });
