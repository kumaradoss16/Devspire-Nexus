/* UI defect audit: hover clipping, focus clipping, icon alignment, overflow.
   Run: node .qa/audit-ui.js */
const { chromium } = require('playwright-core');
const EXE = process.env.LOCALAPPDATA + '/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
const BASE = 'file:///H:/Devspirehub AI/';
const PAGES = ['index.html', 'ai-tools.html', 'models.html', 'developer-resources.html', 'tools.html', 'terminal.html', 'api.html', 'submit.html', 'docs.html'];

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const report = {};

  for (const file of PAGES) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(BASE + file, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const desktop = await page.evaluate(() => {
      const clipAncestors = (el) => {
        const out = [];
        let p = el.parentElement;
        while (p && p !== document.documentElement) {
          const s = getComputedStyle(p);
          if (/(hidden|clip|auto|scroll)/.test(s.overflowX + s.overflowY)) {
            out.push({ el: p, ox: s.overflowX, oy: s.overflowY });
          }
          p = p.parentElement;
        }
        return out;
      };
      const offenders = [];
      const targets = [...document.querySelectorAll('header a, header button, main a, main button, footer a, footer button')];
      targets.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        for (const a of clipAncestors(el)) {
          const ar = a.el.getBoundingClientRect();
          const clipped = r.left < ar.left - 0.5 || r.right > ar.right + 0.5 || r.top < ar.top - 0.5 || r.bottom > ar.bottom + 0.5;
          if (clipped) {
            offenders.push({
              text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40),
              tag: el.tagName,
              ancestor: a.el.className.toString().slice(0, 60),
              overflow: a.ox + '/' + a.oy,
              delta: {
                l: +(ar.left - r.left).toFixed(1), r: +(r.right - ar.right).toFixed(1),
                t: +(ar.top - r.top).toFixed(1), b: +(r.bottom - ar.bottom).toFixed(1)
              }
            });
          }
        }
      });
      return offenders;
    });

    /* hover sweep: move pointer over every button/link and re-measure */
    const hoverOffenders = [];
    const count = await page.locator('main a, main button, header a, header button, footer a').count();
    for (let i = 0; i < Math.min(count, 80); i++) {
      const loc = page.locator('main a, main button, header a, header button, footer a').nth(i);
      try {
        if (!(await loc.isVisible())) continue;
        await loc.hover({ timeout: 1200 });
        await page.waitForTimeout(220);
        const bad = await loc.evaluate((el) => {
          const r = el.getBoundingClientRect();
          let p = el.parentElement;
          while (p && p !== document.body) {
            const s = getComputedStyle(p);
            if (/(hidden|clip|auto|scroll)/.test(s.overflowX + s.overflowY)) {
              const ar = p.getBoundingClientRect();
              if (r.left < ar.left - 0.5 || r.right > ar.right + 0.5 || r.top < ar.top - 0.5 || r.bottom > ar.bottom + 0.5) {
                return { text: (el.textContent || '').trim().slice(0, 40), anc: p.className.toString().slice(0, 60) };
              }
            }
            p = p.parentElement;
          }
          return null;
        });
        if (bad) hoverOffenders.push(bad);
      } catch { /* hidden or covered element */ }
    }

    /* icon alignment inside flex buttons/links */
    const iconAudit = await page.evaluate(() => {
      const bad = [];
      document.querySelectorAll('a, button').forEach((el) => {
        const icon = el.querySelector('.material-symbols-outlined, img');
        if (!icon) return;
        const s = getComputedStyle(el);
        const isFlex = /flex/.test(s.display);
        const ir = icon.getBoundingClientRect();
        if (!ir.width || !ir.height) {
          bad.push({ text: (el.textContent || '').trim().slice(0, 30), issue: 'zero-size icon' });
          return;
        }
        if (isFlex && s.alignItems !== 'center' && s.alignItems !== 'baseline') {
          bad.push({ text: (el.textContent || '').trim().slice(0, 30), issue: 'flex button not centered', align: s.alignItems });
        }
        if (icon.scrollWidth > icon.clientWidth + 1 || icon.scrollHeight > icon.clientHeight + 1) {
          bad.push({ text: (el.textContent || '').trim().slice(0, 30), issue: 'icon content overflow' });
        }
      });
      return bad;
    });

    const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
    report[file] = {
      initialClip: desktop.slice(0, 12),
      hoverClip: hoverOffenders.slice(0, 12),
      iconIssues: iconAudit.slice(0, 12),
      overflow: m.sw > m.vw + 1 ? m : null
    };
    await page.close();
  }

  await browser.close();
  console.log(JSON.stringify(report, null, 2));
})();
