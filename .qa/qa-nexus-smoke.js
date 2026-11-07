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

  for (const file of ['index.html', 'about.html', 'privacy.html', 'terms.html', 'contact.html', 'collections.html']) {
    await page.goto(BASE + file, { waitUntil: 'load' });
    await page.waitForTimeout(700);
    const info = await page.evaluate(() => ({
      h1: (document.querySelector('h1') || {}).textContent,
      header: Boolean(document.querySelector('header.site-header')),
      footer: Boolean(document.querySelector('footer')),
      navLinks: [...document.querySelectorAll('header nav[aria-label="Primary"] a')].map((a) => a.textContent.trim()),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    }));
    console.log(file, JSON.stringify(info));
  }

  await page.goto(BASE + 'index.html', { waitUntil: 'load' });
  await page.waitForTimeout(900);
  const featured = await page.evaluate(() => ({
    week: (document.querySelector('[data-featured-week]') || {}).textContent,
    cards: [...document.querySelectorAll('[data-featured-ref]')].map((el) => ({
      name: (el.querySelector('.featured-name') || {}).textContent,
      ref: el.dataset.featuredRef,
      img: Boolean(el.querySelector('img')),
      fallback: Boolean(el.querySelector('.resource-icon-fallback')),
      official: Boolean(el.querySelector('a[target="_blank"]')),
      detail: (el.querySelector('a[href*="#"]') || {}).getAttribute ? el.querySelector('a[href*="#"]').getAttribute('href') : null,
      bookmark: Boolean(el.querySelector('[data-bookmark]')),
      text: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 120)
    }))
  }));
  console.log('FEATURED', JSON.stringify(featured, null, 1));
  console.log('ERRORS', errors);
  await browser.close();
})();
