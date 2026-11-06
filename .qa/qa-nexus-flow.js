const { chromium } = require('playwright-core');
const path = require('path');

const EXE = path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1248/chrome-win64/chrome.exe');
const BASE = 'file:///H:/Devspirehub AI/';

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

  // Bookmark a tool card, then use the collections page.
  await page.goto(BASE + 'ai-tools.html', { waitUntil: 'load' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(600);
  const first = page.locator('#tool-grid [data-tool-id]').first();
  const firstName = (await first.locator('h2').textContent()).trim();
  await first.locator('[data-bookmark]').click();
  const pressed = await first.locator('[data-bookmark]').getAttribute('aria-pressed');
  console.log('bookmarked:', firstName, pressed);

  await page.goto(BASE + 'collections.html', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  console.log('saved rows:', await page.locator('#saved-list [data-remove-saved]').count());
  console.log('summary:', (await page.locator('#collections-summary').textContent()).replace(/\s+/g, ' ').trim());

  await page.click('#new-collection-btn');
  await page.fill('#new-collection-name', 'QA Stack');
  await page.click('#new-collection-form button[type="submit"]');
  await page.waitForTimeout(300);
  console.log('collection created:', await page.locator('[data-collection]').count());
  const addSelect = page.locator('[data-collection] select').first();
  console.log('add options:', await addSelect.locator('option').count());
  await addSelect.selectOption({ index: 0 });
  await page.locator('[data-add]').first().click();
  await page.waitForTimeout(300);
  console.log('collection rows:', await page.locator('[data-collection] [data-remove-collection]').count());

  await page.locator('[data-rename]').first().click();
  await page.locator('[data-rename-form] input').fill('QA Stack Renamed');
  await page.locator('[data-rename-form] button[type="submit"]').click();
  await page.waitForTimeout(300);
  console.log('renamed:', (await page.locator('[data-collection] h3').first().textContent()).trim());

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#export-btn')
  ]);
  console.log('download:', download.suggestedFilename());

  await page.locator('[data-remove-collection]').first().click();
  await page.waitForTimeout(300);
  console.log('rows after remove:', await page.locator('[data-collection] [data-remove-collection]').count());

  // Contact page states
  await page.goto(BASE + 'contact.html', { waitUntil: 'load' });
  await page.waitForTimeout(300);
  console.log('no key: banner', await page.locator('#contact-config').isVisible(), 'submit disabled', await page.locator('#contact-submit').isDisabled());
  await page.evaluate(() => { window.DSH_SITE_CONFIG.web3formsAccessKey = 'qa-only-not-real'; window.ContactForm.refreshConfig(); });
  console.log('with key: submit disabled', await page.locator('#contact-submit').isDisabled());
  await page.click('#contact-submit');
  await page.waitForTimeout(200);
  console.log('invalid status:', (await page.locator('#contact-status').textContent()).trim());
  console.log('name error:', (await page.locator('#contact-name-error').textContent()).trim());

  await page.fill('#contact-name', 'QA Reviewer');
  await page.fill('#contact-email', 'qa@example.com');
  await page.selectOption('#contact-topic', 'Catalog correction');
  await page.fill('#contact-message', 'The Cursor record needs a corrected last-verified date and an evidence link.');
  await page.route('https://api.web3forms.com/submit', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) }));
  await page.waitForTimeout(2200);
  await page.click('#contact-submit');
  await page.waitForTimeout(600);
  console.log('success status:', (await page.locator('#contact-status').textContent()).trim());
  console.log('form reset:', await page.inputValue('#contact-name'));

  console.log('ERRORS', errors);
  await browser.close();
})();
