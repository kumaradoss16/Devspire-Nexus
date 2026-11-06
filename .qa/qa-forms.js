/* Phase 1 gate: Web3Forms submission workflow, validation, duplicate and
   failure handling. Network calls are mocked at the browser layer; no real
   submission is made and no real access key is used.
   Run: node .qa/qa-forms.js */
const { chromium } = require('playwright-core');
const fs = require('fs');

const EXE = process.env.LOCALAPPDATA + '/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
const BASE = 'file:///H:/Devspirehub AI/';
const ENDPOINT = 'https://api.web3forms.com/submit';
const KEY = 'test-access-key-not-real';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type, accept',
  'access-control-max-age': '600'
};

let results = [];
const assert = (name, cond, extra) => {
  results.push({ name, pass: !!cond, extra: extra === undefined ? '' : String(extra) });
  if (!cond) console.error('FAIL:', name, extra === undefined ? '' : extra);
};

const VALID = {
  name: 'Test Resource',
  type: 'AI Model',
  url: 'https://example.com/test-resource',
  docs: 'https://example.com/docs/test-resource',
  repo: 'https://github.com/example/test-resource',
  category: 'Language Model',
  org: 'Example Org',
  pricing: 'Freemium',
  license: 'Apache 2.0',
  description: 'A test record used to verify that the Web3Forms submission workflow validates fields, reports results honestly and never publishes automatically.',
  evidence: 'https://example.com/evidence/test-resource',
  tags: 'open-weights, test',
  submitter: 'QA Tester',
  email: 'qa@example.com',
  notes: 'Submitted by the mocked QA suite.'
};

const context = (browser) => browser.newContext({ viewport: { width: 1280, height: 1000 } });

const fill = async (page, overrides = {}) => {
  const v = Object.assign({}, VALID, overrides);
  await page.fill('#sub-name', v.name);
  await page.selectOption('#sub-type', v.type);
  await page.fill('#sub-url', v.url);
  await page.fill('#sub-docs', v.docs);
  await page.fill('#sub-repo', v.repo);
  await page.fill('#sub-category', v.category);
  await page.fill('#sub-org', v.org);
  await page.selectOption('#sub-pricing', v.pricing);
  await page.fill('#sub-license', v.license);
  await page.fill('#sub-description', v.description);
  await page.fill('#sub-evidence', v.evidence);
  await page.fill('#sub-tags', v.tags);
  await page.fill('#sub-submitter', v.submitter);
  await page.fill('#sub-email', v.email);
  await page.fill('#sub-notes', v.notes);
};

const settle = async (page, selector) => {
  await page.waitForFunction((sel) => {
    const el = document.querySelector(sel);
    return el && !el.hidden && el.textContent.trim().length > 0;
  }, selector, { timeout: 10000 });
  await page.waitForFunction(() => !document.getElementById('submit-button').disabled, null, { timeout: 10000 });
};

const submit = async (page, expected = '#form-summary') => {
  await page.evaluate(() => {
    ['form-summary', 'form-success'].forEach((id) => {
      const el = document.getElementById(id);
      el.hidden = true;
      el.textContent = '';
    });
  });
  await page.click('#submit-button');
  await settle(page, expected);
};

const mock = (page, handler) => {
  const posts = [];
  page.route(ENDPOINT, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS, body: '' });
    posts.push({ headers: req.headers(), body: JSON.parse(req.postData() || '{}'), url: req.url() });
    return handler(route, posts);
  });
  return posts;
};

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const consoleErrors = [];
  const watch = (page, tag) => {
    page.on('pageerror', (e) => consoleErrors.push(`${tag}: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      const text = m.text();
      /* This suite deliberately fails requests; those browser-level notices are expected. */
      if (/status of 500|net::ERR_FAILED|net::ERR_ABORTED/.test(text)) return;
      consoleErrors.push(`${tag}: ${text}`);
    });
  };

  /* ---------- 1. No key configured: the form must not pretend to send ---------- */
  {
    const ctx = await context(browser);
    const page = await ctx.newPage();
    watch(page, 'no-key');
    const posts = mock(page, (route) => route.abort());
    await page.goto(BASE + 'submit.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);

    assert('no key: configuration warning is visible on load', await page.isVisible('#config-status'));
    assert('no key: warning names the config file', /site-config\.js/.test(await page.textContent('#config-status')));
    assert('no key: submit is still offered', await page.isVisible('#submit-button'));

    await submit(page);
    const summary = await page.textContent('#form-summary');
    assert('no key: submission is refused honestly', /not configured/i.test(summary), summary);
    assert('no key: nothing was posted', posts.length === 0, posts.length);
    assert('no key: receipt stays hidden', await page.isHidden('#draft-section'));
    await ctx.close();
  }

  /* ---------- 2. Validation with a key present ---------- */
  {
    const ctx = await context(browser);
    const page = await ctx.newPage();
    watch(page, 'validation');
    const posts = mock(page, (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: '{"success":true}' }));
    await page.goto(BASE + 'submit.html', { waitUntil: 'networkidle' });
    await page.evaluate((key) => { window.DSH_SITE_CONFIG.web3formsAccessKey = key; }, KEY);
    await page.waitForTimeout(150);

    await submit(page);
    assert('empty submit reports five missing fields', /fix 5 fields/i.test(await page.textContent('#form-summary')), await page.textContent('#form-summary'));
    assert('empty submit flags each required field', (await page.locator('#submission-form [aria-invalid="true"]').count()) === 5);
    assert('empty submit sends nothing', posts.length === 0, posts.length);

    await fill(page, {
      url: 'not-a-url',
      docs: 'ftp://example.com/docs',
      repo: 'not-a-repo',
      evidence: 'ftp://example.com/evidence',
      description: 'Short',
      email: 'not-an-email',
      submitter: 'x'.repeat(81),
      tags: 'a,b,c,d,e,f,g,h,i,j,k'
    });
    await submit(page);
    assert('invalid URL is rejected with guidance', /http:\/\/ or https:\/\//.test(await page.textContent('#err-url')));
    assert('invalid docs URL is rejected', /documentation URL/.test(await page.textContent('#err-docs')));
    assert('invalid repository URL is rejected', /repository URL/.test(await page.textContent('#err-repo')));
    assert('invalid evidence URL is rejected', /evidence URL/.test(await page.textContent('#err-evidence')));
    assert('description length is enforced', /40 to 600/.test(await page.textContent('#err-description')));
    assert('invalid email is rejected', /valid email/.test(await page.textContent('#err-email')));
    assert('submitter input caps its length', (await page.getAttribute('#sub-submitter', 'maxlength')) === '80');
    assert('tag count is capped', /at most 10 tags/.test(await page.textContent('#err-tags')));
    assert('invalid form sends nothing', posts.length === 0, posts.length);

    assert('description input caps its length', (await page.getAttribute('#sub-description', 'maxlength')) === '600');

    /* Live revalidation clears the message when the field becomes valid. */
    await page.fill('#sub-url', 'https://example.com/fixed');
    assert('correcting a field clears its error', await page.isHidden('#err-url'));
    assert('correcting a field clears aria-invalid', (await page.getAttribute('#sub-url', 'aria-invalid')) === 'false');
    await ctx.close();
  }

  /* ---------- 3. Honeypot ---------- */
  {
    const ctx = await context(browser);
    const page = await ctx.newPage();
    watch(page, 'honeypot');
    const posts = mock(page, (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: '{"success":true}' }));
    await page.goto(BASE + 'submit.html', { waitUntil: 'networkidle' });
    await page.evaluate((key) => { window.DSH_SITE_CONFIG.web3formsAccessKey = key; }, KEY);
    await fill(page);
    await page.evaluate(() => { document.getElementById('sub-botcheck').checked = true; });
    await submit(page);
    assert('honeypot rejects without explanation', /could not be processed/i.test(await page.textContent('#form-summary')), await page.textContent('#form-summary'));
    assert('honeypot sends nothing', posts.length === 0, posts.length);
    await ctx.close();
  }

  /* ---------- 4. Successful submission (mocked) ---------- */
  {
    const ctx = await context(browser);
    const page = await ctx.newPage();
    watch(page, 'success');
    const posts = mock(page, (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: CORS,
      body: JSON.stringify({ success: true, message: 'Email sent' })
    }));
    await page.goto(BASE + 'submit.html', { waitUntil: 'networkidle' });
    await page.evaluate((key) => { localStorage.clear(); window.DSH_SITE_CONFIG.web3formsAccessKey = key; }, KEY);
    await fill(page);
    await submit(page, '#form-success');

    const success = await page.textContent('#form-success');
    assert('success says the record is pending moderation', /pending moderation/i.test(success), success);
    assert('success says nothing was published', /not been published/i.test(success), success);
    assert('success hides the configuration warning', await page.isHidden('#config-status'));
    assert('success hides the failure summary', await page.isHidden('#form-summary'));
    assert('success sends exactly one request', posts.length === 1, posts.length);

    const sent = posts[0];
    assert('request targets the Web3Forms endpoint over https', sent.url === ENDPOINT, sent.url);
    assert('request is JSON', /application\/json/.test(sent.headers['content-type'] || ''), sent.headers['content-type']);
    assert('request carries the configured access key', sent.body.access_key === KEY);
    assert('request subject names the resource', /Test Resource/.test(sent.body.subject), sent.body.subject);
    assert('request carries the stated fields', sent.body.resource_name === VALID.name && sent.body.official_url === VALID.url && sent.body.category === VALID.category && sent.body.resource_type === VALID.type);
    assert('request carries optional facts verbatim', sent.body.documentation_url === VALID.docs && sent.body.repository_url === VALID.repo && sent.body.license === VALID.license && sent.body.pricing === VALID.pricing);
    assert('request carries tags and evidence', sent.body.tags === 'open-weights, test' && sent.body.evidence_url === VALID.evidence);
    assert('request carries the visible honeypot as false', sent.body.botcheck === false);
    assert('request includes the submitter email', sent.body.email === VALID.email);

    const receipt = JSON.parse(await page.textContent('#draft-json'));
    assert('receipt is marked pending review', receipt.status === 'pending-review' && receipt.review.published === false);
    assert('receipt never leaks the access key', !('access_key' in receipt.record) && !('botcheck' in receipt.record));
    assert('receipt states nothing was added automatically', /nothing was added/i.test(receipt.review.note), receipt.review.note);
    assert('receipt has an ISO timestamp', /^\d{4}-\d{2}-\d{2}T/.test(receipt.submitted_at), receipt.submitted_at);
    assert('receipt is visible after success', await page.isVisible('#draft-section'));
    assert('receipt status explains moderation', /pending moderation/i.test(await page.textContent('#draft-status')));
    assert('receipt actions are enabled', await page.evaluate(() => !document.getElementById('copy-draft').disabled && !document.getElementById('download-draft').disabled));

    assert('form is cleared after success', (await page.inputValue('#sub-name')) === '' && (await page.inputValue('#sub-url')) === '');
    assert('submit button is restored', await page.evaluate(() => {
      const b = document.getElementById('submit-button');
      return !b.disabled && b.getAttribute('aria-busy') === 'false' && document.getElementById('submit-label').textContent === 'Submit for review';
    }));
    assert('success keeps zero invalid markers', (await page.locator('#submission-form [aria-invalid="true"]').count()) === 0);

    await page.click('#copy-draft');
    await page.waitForTimeout(300);
    assert('copy receipt reports an honest result', /copied|Copy failed/i.test(await page.textContent('#draft-copy-status')), await page.textContent('#draft-copy-status'));

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 5000 }),
      page.click('#download-draft')
    ]);
    assert('receipt download filename is slugged', download.suggestedFilename() === 'test-resource-submission-receipt.json', download.suggestedFilename());
    const downloaded = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    assert('downloaded receipt matches the shown receipt', downloaded.status === 'pending-review' && downloaded.record.resource_name === VALID.name && !('access_key' in downloaded.record));

    /* Duplicate guard: same type + name + URL inside the window. */
    await fill(page);
    await submit(page);
    assert('duplicate submission is blocked', /submitted recently/i.test(await page.textContent('#form-summary')), await page.textContent('#form-summary'));
    assert('duplicate makes no second request', posts.length === 1, posts.length);
    assert('duplicate keeps the receipt visible', await page.isVisible('#draft-section'));
    await ctx.close();
  }

  /* ---------- 5. Rejection, HTTP error, network failure, timeout ---------- */
  {
    const ctx = await context(browser);
    const page = await ctx.newPage();
    watch(page, 'rejected');
    const posts = mock(page, (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: CORS,
      body: JSON.stringify({ success: false, message: 'Invalid access key' })
    }));
    await page.goto(BASE + 'submit.html', { waitUntil: 'networkidle' });
    await page.evaluate((key) => { localStorage.clear(); window.DSH_SITE_CONFIG.web3formsAccessKey = key; }, KEY);
    await fill(page);
    await submit(page);
    assert('service rejection surfaces the message', /not accepted: Invalid access key/.test(await page.textContent('#form-summary')), await page.textContent('#form-summary'));
    assert('rejection keeps the entries', (await page.inputValue('#sub-name')) === VALID.name);
    assert('rejection hides the receipt', await page.isHidden('#draft-section'));
    assert('rejection restores the submit button', await page.evaluate(() => !document.getElementById('submit-button').disabled && document.getElementById('submit-label').textContent === 'Submit for review'));
    await ctx.close();
  }

  {
    const ctx = await context(browser);
    const page = await ctx.newPage();
    watch(page, 'http-error');
    mock(page, (route) => route.fulfill({
      status: 500,
      contentType: 'application/json',
      headers: CORS,
      body: JSON.stringify({ success: false })
    }));
    await page.goto(BASE + 'submit.html', { waitUntil: 'networkidle' });
    await page.evaluate((key) => { localStorage.clear(); window.DSH_SITE_CONFIG.web3formsAccessKey = key; }, KEY);
    await fill(page);
    await submit(page);
    assert('HTTP 500 is reported as a failure', /HTTP 500/.test(await page.textContent('#form-summary')), await page.textContent('#form-summary'));
    assert('HTTP 500 keeps the entries', (await page.inputValue('#sub-url')) === VALID.url);
    await ctx.close();
  }

  {
    const ctx = await context(browser);
    const page = await ctx.newPage();
    watch(page, 'network');
    mock(page, (route) => route.abort('failed'));
    await page.goto(BASE + 'submit.html', { waitUntil: 'networkidle' });
    await page.evaluate((key) => { localStorage.clear(); window.DSH_SITE_CONFIG.web3formsAccessKey = key; }, KEY);
    await fill(page);
    await submit(page);
    assert('network failure is reported honestly', /could not reach Web3Forms/.test(await page.textContent('#form-summary')), await page.textContent('#form-summary'));
    assert('network failure keeps the entries', (await page.inputValue('#sub-email')) === VALID.email);
    assert('network failure leaves the receipt hidden', await page.isHidden('#draft-section'));
    await ctx.close();
  }

  {
    const ctx = await context(browser);
    const page = await ctx.newPage();
    watch(page, 'timeout');
    page.route(ENDPOINT, async (route) => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS, body: '' });
      await new Promise((resolve) => setTimeout(resolve, 2500));
      try {
        await route.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: '{"success":true}' });
      } catch {
        /* the page already aborted the request */
      }
    });
    await page.goto(BASE + 'submit.html', { waitUntil: 'networkidle' });
    await page.evaluate((key) => {
      localStorage.clear();
      window.DSH_SITE_CONFIG.web3formsAccessKey = key;
      window.DSH_SITE_CONFIG.requestTimeoutMs = 1200;
    }, KEY);
    await fill(page);
    await submit(page);
    const timed = await page.textContent('#form-summary');
    assert('timeout is reported with its duration', /timed out after 1 seconds/.test(timed), timed);
    assert('timeout keeps the entries', (await page.inputValue('#sub-name')) === VALID.name);
    assert('timeout restores the submit button', await page.evaluate(() => !document.getElementById('submit-button').disabled));
    await ctx.close();
  }

  /* ---------- 6. Endpoint hardening ---------- */
  {
    const ctx = await context(browser);
    const page = await ctx.newPage();
    watch(page, 'endpoint');
    let insecure = 0;
    const posts = mock(page, (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: '{"success":true}' }));
    page.on('request', (req) => { if (/insecure\.example/.test(req.url())) insecure += 1; });
    await page.goto(BASE + 'submit.html', { waitUntil: 'networkidle' });
    await page.evaluate((key) => {
      localStorage.clear();
      window.DSH_SITE_CONFIG.web3formsAccessKey = key;
      window.DSH_SITE_CONFIG.endpoint = 'http://insecure.example/submit';
    }, KEY);
    await fill(page);
    await submit(page, '#form-success');
    assert('non-https endpoints are ignored', insecure === 0, insecure);
    assert('fallback endpoint is the canonical https one', posts.length === 1 && posts[0].url === ENDPOINT, posts[0] && posts[0].url);
    await ctx.close();
  }

  /* ---------- 7. Mobile layout at 375px ---------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await ctx.newPage();
    watch(page, 'mobile');
    mock(page, (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: '{"success":true}' }));
    await page.goto(BASE + 'submit.html', { waitUntil: 'networkidle' });
    await page.evaluate((key) => { localStorage.clear(); window.DSH_SITE_CONFIG.web3formsAccessKey = key; }, KEY);
    await fill(page);
    const layout = await page.evaluate(() => {
      const r = document.getElementById('sub-name').getBoundingClientRect();
      const b = document.getElementById('submit-button').getBoundingClientRect();
      return {
        sw: document.documentElement.scrollWidth,
        vw: document.documentElement.clientWidth,
        fieldRight: r.right,
        btnTop: b.top,
        btnVisible: b.width > 0 && b.height > 0
      };
    });
    assert('mobile: no horizontal overflow', layout.sw <= layout.vw + 1, `${layout.sw}/${layout.vw}`);
    assert('mobile: fields stay inside the viewport', layout.fieldRight <= layout.vw + 1, layout.fieldRight);
    assert('mobile: submit button is visible', layout.btnVisible, JSON.stringify(layout));
    await submit(page, '#form-success');
    const after = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      vw: document.documentElement.clientWidth,
      receipt: !document.getElementById('draft-section').hidden
    }));
    assert('mobile: receipt does not break the layout', after.receipt && after.sw <= after.vw + 1, JSON.stringify(after));
    await ctx.close();
  }

  assert('zero console/page errors across the form suite', consoleErrors.length === 0, consoleErrors.slice(0, 6).join(' | '));

  await browser.close();
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n=== ${passed}/${results.length} checks passed ===`);
  results.filter((r) => !r.pass).forEach((r) => console.log('FAILED:', r.name, r.extra));
})();
