const { chromium } = require('playwright-core');
const path = require('path');
const EXE = path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1248/chrome-win64/chrome.exe');
const BASE = 'file:///H:/Devspirehub AI/';

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const results = {};

  // 1. AI Tools
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE + 'ai-tools.html', { waitUntil: 'load' });
    await page.waitForTimeout(600);
    const count = await page.locator('#tool-grid article').count();
    const indicator = await page.textContent('#page-indicator');
    results['AI Tools'] = { initialCardCount: count, indicator: indicator.trim() };
    await page.close();
  }

  // 2. AI Models
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE + 'models.html', { waitUntil: 'load' });
    await page.waitForTimeout(600);
    const count = await page.locator('#model-grid article').count();
    const indicator = await page.textContent('#page-indicator');
    results['AI Models'] = { initialCardCount: count, indicator: indicator.trim() };
    await page.close();
  }

  // 3. Developer Resources
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE + 'developer-resources.html', { waitUntil: 'load' });
    await page.waitForTimeout(600);
    const count = await page.locator('#resource-grid article').count();
    const indicator = await page.textContent('#page-indicator');
    results['Developer Resources'] = { initialCardCount: count, indicator: indicator.trim() };
    await page.close();
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})();
