const { chromium } = require('playwright-core');
const EXE = process.env.LOCALAPPDATA + '/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
const PAGE_URL = 'file:///H:/Devspirehub AI/ai-tools.html';

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const errors = [];

  const wide = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  wide.on('pageerror', (e) => errors.push(e.message));
  await wide.goto(PAGE_URL, { waitUntil: 'networkidle' });
  await wide.waitForTimeout(800);
  await wide.screenshot({ path: 'shots/ai-tools-1440.png' });
  await wide.screenshot({ path: 'shots/ai-tools-1440-grid.png', fullPage: true });

  await wide.goto(PAGE_URL + '#tool/chatgpt', { waitUntil: 'networkidle' });
  await wide.waitForTimeout(500);
  await wide.screenshot({ path: 'shots/ai-tools-detail.png' });

  const mobile = await browser.newPage({ viewport: { width: 375, height: 812 } });
  mobile.on('pageerror', (e) => errors.push(e.message));
  await mobile.goto(PAGE_URL, { waitUntil: 'networkidle' });
  await mobile.waitForTimeout(700);
  await mobile.screenshot({ path: 'shots/ai-tools-375.png' });
  await mobile.screenshot({ path: 'shots/ai-tools-375-full.png', fullPage: true });

  console.log('errors:', errors);
  await browser.close();
})();
