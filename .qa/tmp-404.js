const { chromium } = require('playwright-core');
const EXE = process.env.LOCALAPPDATA + '/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  for (const f of ['ai-tools.html', 'models.html', 'developer-resources.html']) {
    const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
    const bad = [];
    p.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
    p.on('requestfailed', (r) => bad.push('FAILED ' + r.url()));
    await p.goto('file:///H:/Devspirehub AI/' + f, { waitUntil: 'networkidle' });
    await p.waitForTimeout(800);
    const grid = await p.evaluate(() => ({
      anchors: document.querySelectorAll('[id$="-grid"] a').length,
      articles: document.querySelectorAll('[id$="-grid"] article').length,
      gridHTML: (document.querySelector('[id$="-grid"]') || {}).innerHTML ? 'yes' : 'empty'
    }));
    console.log(f, JSON.stringify(grid), 'bad', bad.length);
    bad.slice(0, 12).forEach((x) => console.log('  ', x));
    await p.close();
  }
  await b.close();
})();
