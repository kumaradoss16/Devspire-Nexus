const { chromium } = require('playwright-core');
const EXE = process.env.LOCALAPPDATA + '/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const fails = [];
  p.on('requestfailed', r => fails.push([r.url(), r.failure() && r.failure().errorText]));
  p.on('response', r => { if (r.status() >= 400) fails.push([r.url(), r.status()]); });
  await p.goto('file:///H:/Devspirehub AI/models.html', { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  const info = await p.evaluate(() => [...document.querySelectorAll('#model-grid img.tool-favicon')].map(i => ({
    src: i.getAttribute('src'), complete: i.complete, nw: i.naturalWidth, loading: i.loading,
    rect: (r => [Math.round(r.top), Math.round(r.height)])(i.getBoundingClientRect())
  })));
  console.log(JSON.stringify(info.filter(x => !x.complete || !x.nw), null, 1));
  console.log('fails', JSON.stringify(fails.slice(0,10), null, 1));
  await b.close();
})();
