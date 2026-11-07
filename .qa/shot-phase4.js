const { chromium } = require('playwright-core');
const path = require('path');
const EXE = process.env.LOCALAPPDATA + '/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
const out = (n) => path.join(__dirname, 'shots', n);
(async () => {
  const browser = await chromium.launch({ executablePath: EXE });

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await desktop.goto('file:///H:/Devspirehub AI/index.html', { waitUntil: 'networkidle' });
  await desktop.waitForTimeout(700);
  await desktop.screenshot({ path: out('phase4-landing-1440-top.png') });
  await desktop.fill('#resource-search', 'llama');
  await desktop.waitForTimeout(450);
  await desktop.screenshot({ path: out('phase4-landing-1440-search.png') });
  await desktop.evaluate(() => { document.getElementById('resource-search').value = ''; document.getElementById('resource-search').dispatchEvent(new Event('input', { bubbles: true })); });
  await desktop.waitForTimeout(350);
  await desktop.evaluate(() => document.getElementById('coverage').scrollIntoView());
  await desktop.waitForTimeout(400);
  await desktop.screenshot({ path: out('phase4-landing-1440-coverage.png') });

  const mobile = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await mobile.goto('file:///H:/Devspirehub AI/index.html', { waitUntil: 'networkidle' });
  await mobile.waitForTimeout(700);
  await mobile.screenshot({ path: out('phase4-landing-375-top.png') });
  await mobile.fill('#resource-search', 'rag');
  await mobile.waitForTimeout(450);
  await mobile.screenshot({ path: out('phase4-landing-375-search.png') });

  const models = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await models.goto('file:///H:/Devspirehub AI/models.html', { waitUntil: 'networkidle' });
  await models.waitForTimeout(700);
  await models.evaluate(() => document.querySelector('[aria-label="Model results"]').scrollIntoView());
  await models.waitForTimeout(300);
  await models.screenshot({ path: out('phase4-models-375-results.png') });

  await browser.close();
  console.log('shots written');
})();
