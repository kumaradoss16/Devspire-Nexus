const { chromium } = require('playwright-core');

const EXE = process.env.LOCALAPPDATA + '/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
const URL = 'file:///H:/Devspirehub AI/directory.html';

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const results = { widths: {}, interactions: {} };

  for (const width of [390, 768, 1024, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    results.widths[width] = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const bad = [];
      document.querySelectorAll('body *').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && (r.right > vw + 1 || r.left < -1)) {
          const c = typeof el.className === 'string' ? el.className.split(' ').slice(0, 3).join('.') : '';
          bad.push(`${el.tagName}|${c}|L:${Math.round(r.left)} R:${Math.round(r.right)}`);
        }
      });
      return { vw, scrollW: document.documentElement.scrollWidth, overflowing: bad.slice(0, 20) };
    });
    if (width === 390) await page.screenshot({ path: 'H:/Devspirehub AI/.qa/shots/directory-mobile.png', fullPage: true });
    if (width === 768) await page.screenshot({ path: 'H:/Devspirehub AI/.qa/shots/directory-tablet.png', fullPage: true });
    if (width === 1024) await page.screenshot({ path: 'H:/Devspirehub AI/.qa/shots/directory-laptop.png', fullPage: true });
    if (width === 1440) await page.screenshot({ path: 'H:/Devspirehub AI/.qa/shots/directory-desktop.png', fullPage: true });
    await page.close();
  }

  // Interaction tests at desktop width
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // 1. Preset pill fills the search input
  await page.click('.preset-chip[data-preset="Coding"]');
  results.interactions.presetFill = await page.inputValue('#resource-search');

  // 2. Clear button empties the input
  await page.click('#search-clear');
  results.interactions.afterClear = await page.inputValue('#resource-search');

  // 3. Cmd+K focuses search
  await page.keyboard.press('Control+k');
  results.interactions.cmdKFocused = await page.evaluate(() => document.activeElement === document.getElementById('resource-search'));

  // 4. Dense table toggle
  await page.click('[data-view="table"]');
  results.interactions.tableVisible = await page.isVisible('#resource-table-wrap');
  results.interactions.gridHidden = await page.isHidden('#resource-grid');
  results.interactions.tableAriaPressed = await page.getAttribute('[data-view="table"]', 'aria-pressed');

  // 5. Back to grid
  await page.click('[data-view="grid"]');
  results.interactions.gridBackVisible = await page.isVisible('#resource-grid');

  // 6. Mobile menu toggle at 390
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  results.interactions.menuInitiallyHidden = await page.isHidden('#mobile-menu');
  await page.click('#menu-toggle');
  results.interactions.menuOpens = await page.isVisible('#mobile-menu');
  await page.click('#mobile-menu a');
  results.interactions.menuClosesOnLink = await page.isHidden('#mobile-menu');

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})().catch((e) => { console.error('QA FAILED:', e); process.exit(1); });
