const { chromium } = require('playwright-core');
const EXE = process.env.LOCALAPPDATA + '/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto('file:///H:/Devspirehub AI/models.html', { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);
  await p.click('[data-preset="open-weights"]');
  await p.waitForTimeout(300);
  const info = await p.evaluate(() => {
    const b = document.getElementById('reset-all-filters');
    const r = b.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const el = document.elementFromPoint(cx, cy);
    return { rect: { x: r.x, y: r.y, w: r.width, h: r.height }, cx, cy, at: el && (el.id || el.className), scrollY, hidden: b.hidden };
  });
  console.log(info);
  try { await p.click('#reset-all-filters', { timeout: 5000 }); console.log('clicked'); } catch (e) { console.log('click failed:', e.message.split('\n')[0]); }
  await b.close();
})();
