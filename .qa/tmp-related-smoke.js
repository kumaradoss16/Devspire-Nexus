const { chromium } = require('playwright-core');
const EXE = process.env.LOCALAPPDATA + '/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
const BASE = 'file:///H:/Devspirehub AI/';
const pages = [
  { file: 'ai-tools.html', key: 'AI_TOOLS', type: 'tool', prefix: 'tool', grid: 'tool-grid' },
  { file: 'models.html', key: 'AI_MODELS', type: 'model', prefix: 'model', grid: 'model-grid' },
  { file: 'developer-resources.html', key: 'DEVELOPER_RESOURCES', type: 'resource', prefix: 'resource', grid: 'resource-grid' }
];
(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const errs = [];
  for (const spec of pages) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on('pageerror', (e) => errs.push(spec.file + ': ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(spec.file + ': ' + m.text()); });
    await page.goto(BASE + spec.file, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const info = await page.evaluate((spec) => {
      const reg = window[spec.key] || [];
      const meta = window[spec.key + '_META'] || {};
      const rel = window.RelatedResources;
      const grid = document.getElementById(spec.grid);
      const cards = grid ? grid.querySelectorAll('a[href*="#"]').length : 0;
      const related = document.getElementById('related-page');
      const relCards = related ? related.querySelectorAll('[data-related-card]').length : 0;
      const src = related ? related.querySelector('[data-related-root]') : null;
      const ids = [...related ? related.querySelectorAll('[data-related-card]') : []].map((c) => c.dataset.relatedCard);
      const hasSelf = src ? ids.includes(src.dataset.sourceType + ':' + src.dataset.sourceId) : false;
      const more = related ? related.querySelector('[data-related-more]') : null;
      return {
        count: reg.length, metaCount: meta.count, indexCount: rel ? rel.count : -1,
        cards, relCards, source: src ? src.dataset.sourceId : null, hasSelf,
        moreText: more ? more.textContent : null,
        firstId: reg[0] && reg[0].id,
        cats: [...new Set(reg.map((r) => r.category))].length,
        pills: document.querySelectorAll('#category-pills button, #category-pills a').length
      };
    }, spec);
    console.log(spec.file, JSON.stringify(info));
    if (info.count !== info.metaCount) console.log('  !! count/meta mismatch');
    if (info.indexCount !== 1003) console.log('  !! related index count', info.indexCount);
    if (info.relCards < 1) console.log('  !! no related cards');
    if (info.hasSelf) console.log('  !! current resource in related');
    if (info.moreText) {
      await page.click('[data-related-more]');
      const after = await page.evaluate(() => {
        const r = document.querySelector('[data-related-root]');
        return { visible: r.querySelectorAll('[data-related-card]').length, total: +r.dataset.total, more: !!r.querySelector('[data-related-more]') };
      });
      console.log('  more ->', JSON.stringify(after));
    }
    // deep link into detail of first related card
    const href = await page.getAttribute('#related-page [data-related-card] .related-link', 'href');
    await page.goto(BASE + href, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const detail = await page.evaluate(() => {
      const modal = document.getElementById('detail-modal');
      const block = document.querySelector('[data-related-detail] [data-related-root]');
      return {
        open: modal && !modal.hidden,
        hash: location.hash,
        detailRelated: block ? block.dataset.total : null,
        detailSelf: block ? [...block.querySelectorAll('[data-related-card]')].some((c) => c.dataset.relatedCard === block.dataset.sourceType + ':' + block.dataset.sourceId) : null
      };
    });
    console.log('  detail', JSON.stringify(detail));
    await page.close();
  }
  console.log('errors:', errs.length, errs.slice(0, 8));
  await browser.close();
})();
