const { chromium } = require('playwright-core');
const path = require('path');
const EXE = process.env.LOCALAPPDATA + '/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
const out = (n) => path.join(__dirname, 'shots', n);
const BASE = 'file:///H:/Devspirehub AI/';

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });

  const term = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await term.goto(BASE + 'terminal.html', { waitUntil: 'networkidle' });
  await term.waitForTimeout(500);
  for (const cmd of ['help', 'stats', 'search embedding', 'show ' + await term.evaluate(() => window.AI_MODELS[0].id)]) {
    await term.fill('#terminal-input', cmd);
    await term.press('#terminal-input', 'Enter');
    await term.waitForTimeout(120);
  }
  await term.screenshot({ path: out('phase5-terminal-1440.png') });

  const termMobile = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await termMobile.goto(BASE + 'terminal.html', { waitUntil: 'networkidle' });
  await termMobile.waitForTimeout(450);
  await termMobile.fill('#terminal-input', 'stats');
  await termMobile.press('#terminal-input', 'Enter');
  await termMobile.waitForTimeout(150);
  await termMobile.screenshot({ path: out('phase5-terminal-375.png') });

  const api = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await api.goto(BASE + 'api.html', { waitUntil: 'networkidle' });
  await api.waitForTimeout(450);
  await api.screenshot({ path: out('phase5-api-1440.png') });

  const apiMobile = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await apiMobile.goto(BASE + 'api.html', { waitUntil: 'networkidle' });
  await apiMobile.waitForTimeout(450);
  await apiMobile.evaluate(() => document.querySelector('#file-list').scrollIntoView({ block: 'center' }));
  await apiMobile.waitForTimeout(250);
  await apiMobile.screenshot({ path: out('phase5-api-375.png') });

  const fill = async (p) => {
    await p.fill('#sub-name', 'Test Resource');
    await p.selectOption('#sub-type', 'AI Model');
    await p.fill('#sub-url', 'https://example.com/test-resource');
    await p.fill('#sub-category', 'Language Model');
    await p.fill('#sub-description', 'A test record used to verify that the local draft workflow produces review-ready JSON without transmitting anything.');
    await p.fill('#sub-evidence', 'https://example.com/docs/test-resource');
    await p.fill('#sub-tags', 'open-weights, test');
    await p.click('#submission-form button[type="submit"]');
    await p.waitForTimeout(400);
  };

  const submit = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  await submit.goto(BASE + 'submit.html', { waitUntil: 'networkidle' });
  await submit.waitForTimeout(450);
  await submit.screenshot({ path: out('phase5-submit-1440-empty.png') });
  await fill(submit);
  await submit.evaluate(() => document.getElementById('draft-section').scrollIntoView({ block: 'center' }));
  await submit.waitForTimeout(350);
  await submit.screenshot({ path: out('phase5-submit-1440-draft.png') });

  const submitMobile = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await submitMobile.goto(BASE + 'submit.html', { waitUntil: 'networkidle' });
  await submitMobile.waitForTimeout(450);
  await submitMobile.screenshot({ path: out('phase5-submit-375-top.png') });
  await fill(submitMobile);
  await submitMobile.evaluate(() => document.getElementById('draft-section').scrollIntoView({ block: 'start' }));
  await submitMobile.waitForTimeout(350);
  await submitMobile.screenshot({ path: out('phase5-submit-375-draft.png') });

  const docs = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await docs.goto(BASE + 'docs.html', { waitUntil: 'networkidle' });
  await docs.waitForTimeout(450);
  await docs.screenshot({ path: out('phase5-docs-1440.png') });

  const docsMobile = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await docsMobile.goto(BASE + 'docs.html', { waitUntil: 'networkidle' });
  await docsMobile.waitForTimeout(450);
  await docsMobile.screenshot({ path: out('phase5-docs-375.png') });

  await browser.close();
  console.log('shots written');
})();
