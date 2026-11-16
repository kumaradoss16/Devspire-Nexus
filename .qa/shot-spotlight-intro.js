const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const EXE = path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1248/chrome-win64/chrome.exe');
const URL = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const OUT = path.join(__dirname, 'shots-spotlight');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const errors = [];
  for (const width of [1440, 1366, 1024, 768, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on('pageerror', (e) => errors.push(`${width}: ${e.message}`));
    await page.goto(URL, { waitUntil: 'load' });
    await page.waitForTimeout(500);
    const m = await page.evaluate(() => {
      const r = (sel) => { const el = document.querySelector(sel); if (!el) return null; const b = el.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height), x: Math.round(b.left) }; };
      const head = document.querySelector('#featured-collection .editorial-head-grid');
      const kids = head ? [...head.children].map((c) => { const b = c.getBoundingClientRect(); return { top: Math.round(b.top), left: Math.round(b.left), w: Math.round(b.width) }; }) : [];
      return {
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        spotlight: r('#nexus-spotlight'),
        intro: r('#featured-collection .editorial-head'),
        headCols: kids.length > 1 && kids[0].top === kids[1].top ? 2 : 1,
        headKids: kids
      };
    });
    console.log(width, JSON.stringify(m));
    await page.locator('#nexus-spotlight').screenshot({ path: path.join(OUT, `spotlight-${width}.png`) });
    const intro = page.locator('#featured-collection .editorial-head');
    if (await intro.count()) await intro.screenshot({ path: path.join(OUT, `editorial-intro-${width}.png`) });
    await page.close();
  }
  console.log('ERRORS', errors);
  await browser.close();
})();
