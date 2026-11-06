const { chromium } = require('playwright-core');

const EXE = process.env.LOCALAPPDATA + '/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
const URL = 'file:///H:/Devspirehub AI/tools.html';

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const results = { widths: {}, interactions: {} };
  const errors = [];

  for (const width of [390, 768, 1024, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on('pageerror', (e) => errors.push(`pageerror@${width}: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`console@${width}: ${m.text()}`); });
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    results.widths[width] = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const bad = [];
      document.querySelectorAll('body *').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && (r.right > vw + 1 || r.left < -1)) {
          const c = typeof el.className === 'string' ? el.className.split(' ').slice(0, 3).join('.') : '';
          bad.push(`${el.tagName}|${c}|L:${Math.round(r.left)} R:${Math.round(r.right)}`);
        }
      });
      return { vw, scrollW: document.documentElement.scrollWidth, overflowing: bad.slice(0, 20) };
    });
    const label = { 390: 'mobile', 768: 'tablet', 1024: 'laptop', 1440: 'desktop' }[width];
    await page.screenshot({ path: `H:/Devspirehub AI/.qa/shots/tools-${label}.png`, fullPage: true });
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const cardCount = () => page.locator('#tool-grid article').count();
  const countText = () => page.textContent('#results-count');

  // Initial render
  results.interactions.initialCards = await cardCount();
  results.interactions.catalogChip = (await page.textContent('#catalog-chip')).trim();

  // 1. Search filter
  await page.fill('#tool-search', 'terminal');
  await page.waitForTimeout(400);
  results.interactions.searchCards = await cardCount();
  results.interactions.searchCountText = (await countText()).trim();

  // 2. Clear search restores all
  await page.click('#search-clear');
  await page.waitForTimeout(400);
  results.interactions.afterClearCards = await cardCount();

  // 3. Multi-word search (AND semantics)
  await page.fill('#tool-search', 'local llm');
  await page.waitForTimeout(400);
  results.interactions.multiwordCards = await cardCount();
  await page.click('#search-clear');
  await page.waitForTimeout(300);

  // 4. Category pill filters
  await page.click('[data-category="AI Models"]');
  await page.waitForTimeout(300);
  results.interactions.pillCards = await cardCount();
  await page.click('[data-category="All Tools"]');
  await page.waitForTimeout(300);

  // 5. Facet checkbox filters + chip appears
  await page.click('.facet-input[data-facet="license"][data-value="Open Source"]');
  await page.waitForTimeout(300);
  results.interactions.facetCards = await cardCount();
  results.interactions.chipVisible = await page.isVisible('#active-chips .chip');

  // 6. Chip remove button restores
  await page.click('#active-chips .chip button');
  await page.waitForTimeout(300);
  results.interactions.afterChipRemove = await cardCount();

  // 7. Verified-only facet
  await page.click('.facet-input[data-facet="verified"][data-value="Verified Only"]');
  await page.waitForTimeout(300);
  results.interactions.verifiedCards = await cardCount();
  await page.click('#reset-facets');
  await page.waitForTimeout(300);

  // 8. Combination: pricing Paid + category Image Generation (Midjourney only)
  await page.click('.facet-input[data-facet="pricing"][data-value="Paid"]');
  await page.click('[data-category="Image Generation"]');
  await page.waitForTimeout(300);
  results.interactions.comboCards = await cardCount();
  await page.click('#reset-all-filters');
  await page.waitForTimeout(300);
  results.interactions.afterResetAll = await cardCount();

  // 9. Sort: Name A-Z
  await page.selectOption('#sort-select', 'name');
  await page.waitForTimeout(300);
  results.interactions.sortedFirstCard = await page.textContent('#tool-grid article:first-child h2');

  // 10. Table view toggle
  await page.click('#view-table-btn');
  results.interactions.tableVisible = await page.isVisible('#tool-table-wrap');
  results.interactions.gridHiddenInTable = await page.isHidden('#tool-grid');
  results.interactions.tableRows = await page.locator('#tool-table-body tr').count();
  await page.click('#view-grid-btn');
  results.interactions.gridBack = await page.isVisible('#tool-grid');

  // 11. Empty state
  await page.fill('#tool-search', 'zzz-no-such-tool');
  await page.waitForTimeout(400);
  results.interactions.emptyStateVisible = await page.isVisible('#empty-state');
  await page.click('#empty-reset');
  await page.waitForTimeout(300);
  results.interactions.emptyResetCards = await cardCount();

  // 12. Mobile: facets drawer + menu
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  results.interactions.facetsInitiallyHidden = await page.isHidden('#facets-panel');
  await page.click('#facets-toggle');
  results.interactions.facetsOpen = await page.isVisible('#facets-panel');
  await page.click('#menu-toggle');
  results.interactions.menuOpens = await page.isVisible('#mobile-menu');
  results.interactions.menuLinksCanonical = await page.evaluate(() =>
    [...document.querySelectorAll('#mobile-menu a')].every((a) => {
      const href = a.getAttribute('href') || '';
      return href && href !== '#';
    })
  );
  await page.click('#menu-toggle');
  results.interactions.menuCloses = await page.isHidden('#mobile-menu');

  // 13. Pagination renders
  results.interactions.pageIndicator = (await page.textContent('#page-indicator')).trim();

  results.jsErrors = errors;
  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})().catch((e) => { console.error('QA FAILED:', e); process.exit(1); });
