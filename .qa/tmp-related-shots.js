const { chromium } = require('playwright-core');
const EXE = process.env.LOCALAPPDATA + '/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  for (const [file, tag] of [['ai-tools.html','tools'],['models.html','models'],['developer-resources.html','dev']]) {
    for (const [w, h, label] of [[1440, 1000, 'desk'], [375, 900, 'mob']]) {
      const p = await b.newPage({ viewport: { width: w, height: h } });
      await p.goto('file:///H:/Devspirehub AI/' + file, { waitUntil: 'networkidle' });
      await p.waitForTimeout(600);
      const el = p.locator('#related-page');
      await el.scrollIntoViewIfNeeded();
      await p.waitForTimeout(400);
      await el.screenshot({ path: `.qa/shot-related-${tag}-${label}.png` });
      await p.close();
    }
  }
  await b.close();
})();
