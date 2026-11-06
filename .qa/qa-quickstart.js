'use strict';

const { chromium } = require('playwright-core');
const fs = require('fs');
const vm = require('vm');

const EXE = process.env.LOCALAPPDATA + '/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
const DEV_URL = 'file:///H:/Devspirehub AI/developer-resources.html';
const TERM_URL = 'file:///H:/Devspirehub AI/terminal.html';

let results = [];
const assert = (name, cond, extra) => {
  results.push({ name, pass: !!cond, extra: extra || '' });
  if (!cond) console.error('FAIL:', name, extra || '');
  else console.log('PASS:', name);
};

(async () => {
  console.log('--- Phase 1: Data Integrity & Schema Validation ---');
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync('data/developer-resources.js', 'utf8'), ctx);
  const data = ctx.window.DEVELOPER_RESOURCES;

  assert('total developer resources = 300', data.length === 300, 'count=' + data.length);

  const qsAvailable = data.filter((r) => r.developer_quick_start && r.developer_quick_start.available);
  assert('32 verified quickstart records', qsAvailable.length === 32, 'count=' + qsAvailable.length);

  const qsUnavailable = data.filter((r) => r.developer_quick_start && !r.developer_quick_start.available);
  assert('268 honest unverified/unavailable records', qsUnavailable.length === 268, 'count=' + qsUnavailable.length);

  for (const r of qsAvailable) {
    const qs = r.developer_quick_start;
    assert(`[${r.id}] has package_name`, typeof qs.package_name === 'string' && qs.package_name.length > 0);
    assert(`[${r.id}] has verified installation commands`, Array.isArray(qs.installation) && qs.installation.length > 0);
    for (const inst of qs.installation) {
      assert(`[${r.id}] install command valid: ${inst.pm}`, inst.command && inst.command.length > 3);
    }
    assert(`[${r.id}] has official documentation`, qs.documentation && qs.documentation.url && qs.documentation.url.startsWith('http'));
    assert(`[${r.id}] has supported languages`, Array.isArray(qs.supported_languages) && qs.supported_languages.length > 0);
    assert(`[${r.id}] has verified usage examples`, Array.isArray(qs.examples) && qs.examples.length > 0);
    for (const ex of qs.examples) {
      assert(`[${r.id}] example has code`, ex.code && ex.code.length > 10);
      assert(`[${r.id}] example has title`, ex.title && ex.title.length > 3);
    }
  }

  console.log('\n--- Phase 2: In-Browser Quick Start UI Interactions ---');
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push('page: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push('console: ' + m.text()); });

  await page.goto(DEV_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // 1. Verify Quick Start filter button
  const qsFilterBtn = await page.$('#quickstart-filter-btn');
  assert('quickstart filter button exists', !!qsFilterBtn);
  const qsBadgeCount = await page.textContent('#quickstart-count');
  assert('quickstart badge shows 32', qsBadgeCount.trim() === '32', 'got ' + qsBadgeCount);

  // 2. Search "langchain" to locate card
  await page.selectOption('#sort-select', 'name');
  await page.fill('#dev-search', 'langchain');
  await page.waitForTimeout(400);

  const lcCard = await page.$('article[data-resource-id="langchain"]');
  assert('langchain card found via search', !!lcCard);
  const lcQsBtn = await lcCard.$('[data-quickstart="langchain"]');
  assert('langchain card has Quick Start button', !!lcQsBtn);
  await lcQsBtn.click();
  await page.waitForTimeout(400);

  // 3. Verify detail modal content
  assert('modal is visible', await page.isVisible('#detail-modal'));
  const modalTitle = await page.textContent('#detail-title');
  assert('modal opened for LangChain', modalTitle.includes('LangChain'));
  assert('hash set to #resource/langchain/quickstart', (await page.evaluate(() => location.hash)) === '#resource/langchain/quickstart');

  const qsSection = await page.$('#developer-quickstart-section');
  assert('quickstart section rendered', !!qsSection);

  // 4. Verify package manager tab switching
  const initialCommand = await page.textContent('#qs-install-code code');
  assert('initial install command is pip', initialCommand.includes('pip install langchain'));

  const npmTab = await page.$('.qs-pm-tab[data-pm-idx="2"]');
  assert('npm tab exists', !!npmTab);
  await npmTab.click();
  await page.waitForTimeout(200);
  const npmCommand = await page.textContent('#qs-install-code code');
  assert('install command switched to npm', npmCommand.includes('npm install langchain'));

  // 5. Verify copy button interaction
  const copyBtn = await page.$('#developer-quickstart-section .qs-copy-btn');
  assert('copy button exists', !!copyBtn);
  await copyBtn.click();
  await page.waitForTimeout(100);
  const copyLabel = await page.textContent('#developer-quickstart-section .qs-copy-btn .qs-copy-label');
  assert('copy button shows "Copied!" feedback', copyLabel === 'Copied!', 'got ' + copyLabel);

  // 6. Verify language example tab switching
  const jsExTab = await page.$('.qs-lang-tab[data-example-idx="1"]');
  assert('JS example tab exists', !!jsExTab);
  await jsExTab.click();
  await page.waitForTimeout(200);
  const exCode = await page.textContent('#qs-example-code code');
  assert('code example switched to JavaScript / TypeScript', exCode.includes('import { ChatOpenAI } from "@langchain/openai";'));

  // Close modal
  await page.click('#detail-close');
  await page.waitForTimeout(300);
  assert('modal closed', await page.isHidden('#detail-modal'));

  // Clear search
  await page.click('#search-clear');
  await page.waitForTimeout(300);

  // 7. Test Quick Start filter toggle
  await page.click('#quickstart-filter-btn');
  await page.waitForTimeout(350);
  const countText = await page.textContent('#results-count');
  assert('quickstart filter yields 32 results', countText.includes('of 32'), 'got ' + countText);

  const visibleCards = await page.$$eval('#resource-grid article', (cards) => cards.length);
  assert('grid displays cards matching quickstart filter', visibleCards > 0);

  const allVisibleHaveQs = await page.$$eval('#resource-grid article', (cards) =>
    cards.every((c) => c.querySelector('[data-quickstart]'))
  );
  assert('all filtered cards carry Quick Start badge', allVisibleHaveQs);

  // Toggle filter off
  await page.click('#quickstart-filter-btn');
  await page.waitForTimeout(300);
  const resetCountText = await page.textContent('#results-count');
  assert('filter toggle resets back to 300 total', resetCountText.includes('of 300'), 'got ' + resetCountText);

  // 8. Test Direct Deep Link with /quickstart anchor
  await page.goto(DEV_URL + '#resource/ollama/quickstart', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  assert('deep link opens Ollama modal', (await page.textContent('#detail-title')).includes('Ollama'));
  assert('ollama quickstart section rendered', await page.isVisible('#developer-quickstart-section'));
  const ollamaCmd = await page.textContent('#qs-install-code code');
  assert('ollama install command is curl install script', ollamaCmd.includes('curl -fsSL https://ollama.com/install.sh'));

  await page.click('#detail-close');
  await page.waitForTimeout(200);

  // 9. Test unverified resource fallback in modal
  await page.goto(DEV_URL + '#resource/accelerate-fsdp', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const fallbackText = await page.textContent('#developer-quickstart-section');
  assert('honest fallback rendered for unverified resource', fallbackText.includes('awaiting official review'), fallbackText);
  await page.click('#detail-close');
  await page.waitForTimeout(200);

  console.log('\n--- Phase 3: Terminal quickstart Command Execution ---');
  await page.goto(TERM_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const sendCommand = async (cmd) => {
    await page.fill('#terminal-input', cmd);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(250);
  };

  // Run quickstart langchain
  await sendCommand('quickstart langchain');
  let termOutput = await page.textContent('#terminal-output');
  assert('terminal output contains LangChain Quick Start', termOutput.includes('Developer Quick Start: LangChain'));
  assert('terminal shows installation command', termOutput.includes('pip install langchain'));
  assert('terminal shows documentation link', termOutput.includes('https://python.langchain.com/'));
  assert('terminal shows usage example', termOutput.includes('ChatPromptTemplate'));

  // Run quickstart for unverified resource
  await sendCommand('quickstart accelerate-fsdp');
  termOutput = await page.textContent('#terminal-output');
  assert('terminal shows honest awaiting verification message', termOutput.includes('awaiting verification for "Accelerate FSDP"'));

  // Run quickstart for cross-registry resource (chatgpt is in tools)
  await sendCommand('quickstart chatgpt');
  termOutput = await page.textContent('#terminal-output');
  assert('terminal explains cross-registry resource', termOutput.includes('Quick Start applies to Developer Resources'));

  // Run quickstart for nonexistent resource
  await sendCommand('quickstart non-existent-abc');
  termOutput = await page.textContent('#terminal-output');
  assert('terminal handles missing resource cleanly', termOutput.includes('not found in Developer Resources catalog'));

  assert('zero console/page errors throughout test', consoleErrors.length === 0, consoleErrors.join(' | '));

  await browser.close();

  const passed = results.filter((r) => r.pass).length;
  console.log(`\n========================================`);
  console.log(`=== ${passed}/${results.length} Quick Start Checks Passed ===`);
  console.log(`========================================\n`);

  if (passed !== results.length) {
    process.exit(1);
  }
})().catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});
