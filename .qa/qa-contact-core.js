/* Contact form gate: honest no-key state, field validation, spam traps,
   payload shape, success/rejection/timeout messaging and no fake success.
   Run: node .qa/qa-contact-core.js */
const { chromium } = require('playwright-core');

const EXE = process.env.LOCALAPPDATA + '/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
const URL = 'file:///H:/Devspirehub AI/contact.html';

let results = [];
const assert = (name, cond, extra) => {
  results.push({ name, pass: !!cond, extra: extra || '' });
  if (!cond) console.error('FAIL:', name, extra || '');
};

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  /* ---------- Honest unconfigured state ---------- */
  const initial = await page.evaluate(() => ({
    banner: !document.getElementById('contact-config').hidden,
    bannerText: document.getElementById('contact-config-text').textContent.replace(/\s+/g, ' ').trim(),
    disabled: document.getElementById('contact-submit').disabled,
    note: document.getElementById('contact-delivery-note').textContent.trim(),
    configured: window.ContactForm.isConfigured(),
    labels: [...document.querySelectorAll('#contact-form label[for]')].map((l) => l.getAttribute('for')),
    statusRole: document.getElementById('contact-status').getAttribute('role'),
    statusTab: document.getElementById('contact-status').getAttribute('tabindex'),
    honeypot: !!document.getElementById('contact-botcheck')
  }));
  assert('no-key banner is shown', initial.banner && /access key/i.test(initial.bannerText) && /cannot transmit/i.test(initial.bannerText), initial.bannerText.slice(0, 90));
  assert('submit is disabled without a key', initial.disabled && !initial.configured);
  assert('delivery note is honest', /not configured.*nothing is transmitted/i.test(initial.note), initial.note);
  assert('every field has a label', ['contact-name', 'contact-email', 'contact-topic', 'contact-message'].every((id) => initial.labels.includes(id)), initial.labels.join(','));
  assert('status region is announced', initial.statusRole === 'alert' && initial.statusTab === '-1', `${initial.statusRole}/${initial.statusTab}`);
  assert('spam honeypot exists', initial.honeypot);
  assert('form starts unsubmitted', await page.evaluate(() => document.getElementById('contact-status').hidden));

  /* ---------- Configure with a throwaway key (never a real one) ---------- */
  await page.evaluate(() => {
    window.DSH_SITE_CONFIG.web3formsAccessKey = 'test-access-key-not-real';
    window.ContactForm.refreshConfig();
    window.__sent = [];
    window.fetch = async (url, options) => {
      window.__sent.push({ url, body: JSON.parse(options.body) });
      return { ok: true, status: 200, json: async () => ({ success: true }) };
    };
  });
  await page.waitForTimeout(2200);

  const enabled = await page.evaluate(() => ({
    disabled: document.getElementById('contact-submit').disabled,
    banner: document.getElementById('contact-config').hidden,
    note: document.getElementById('contact-delivery-note').textContent.trim()
  }));
  assert('configured key enables the form', !enabled.disabled);
  assert('configured state hides the warning', enabled.banner);
  assert('configured note does not overpromise', /sent only when you submit/i.test(enabled.note), enabled.note);

  /* ---------- Validation ---------- */
  await page.evaluate(() => document.getElementById('contact-form').requestSubmit());
  await page.waitForTimeout(250);
  const empty = await page.evaluate(() => ({
    status: document.getElementById('contact-status').textContent.trim(),
    invalid: [...document.querySelectorAll('#contact-form [aria-invalid="true"]')].map((el) => el.id),
    focused: document.activeElement.id,
    sent: window.__sent.length
  }));
  assert('empty submit is blocked', empty.sent === 0 && empty.invalid.length === 4, JSON.stringify(empty.invalid));
  assert('empty submit explains the failures', /fix 4 fields/i.test(empty.status), empty.status);
  assert('first invalid field receives focus', empty.focused === 'contact-name', empty.focused);

  await page.fill('#contact-name', 'Test Visitor');
  await page.fill('#contact-email', 'not-an-email');
  await page.selectOption('#contact-topic', 'Catalog correction');
  await page.fill('#contact-message', 'Short');
  await page.evaluate(() => document.getElementById('contact-form').requestSubmit());
  await page.waitForTimeout(250);
  const invalid = await page.evaluate(() => ({
    invalid: [...document.querySelectorAll('#contact-form [aria-invalid="true"]')].map((el) => el.id),
    email: document.getElementById('contact-email-error').textContent.trim(),
    message: document.getElementById('contact-message-error').textContent.trim(),
    sent: window.__sent.length
  }));
  assert('invalid email and short message are rejected', invalid.sent === 0 && JSON.stringify(invalid.invalid) === JSON.stringify(['contact-email', 'contact-message']), JSON.stringify(invalid.invalid));
  assert('email error is specific', /valid email/i.test(invalid.email), invalid.email);
  assert('message length rule is stated', /20 characters/i.test(invalid.message), invalid.message);

  /* ---------- Honeypot ---------- */
  await page.fill('#contact-email', 'visitor@example.com');
  await page.fill('#contact-message', 'This message is long enough to pass local validation.');
  await page.evaluate(() => { document.getElementById('contact-botcheck').checked = true; });
  await page.evaluate(() => document.getElementById('contact-form').requestSubmit());
  await page.waitForTimeout(250);
  const honeypot = await page.evaluate(() => ({
    status: document.getElementById('contact-status').textContent.trim(),
    sent: window.__sent.length
  }));
  assert('honeypot submission is silently refused', honeypot.sent === 0 && /could not be processed/i.test(honeypot.status), honeypot.status);
  await page.evaluate(() => { document.getElementById('contact-botcheck').checked = false; });

  /* ---------- Successful delivery payload ---------- */
  await page.evaluate(() => document.getElementById('contact-form').requestSubmit());
  await page.waitForTimeout(400);
  const success = await page.evaluate(() => ({
    sent: window.__sent,
    status: document.getElementById('contact-status').textContent.trim(),
    statusClass: document.getElementById('contact-status').className,
    values: {
      name: document.getElementById('contact-name').value,
      email: document.getElementById('contact-email').value,
      topic: document.getElementById('contact-topic').value,
      message: document.getElementById('contact-message').value
    },
    busy: document.getElementById('contact-form').getAttribute('aria-busy'),
    label: document.getElementById('contact-submit-label').textContent.trim()
  }));
  const body = success.sent[0]?.body || {};
  assert('valid submission posts once to Web3Forms', success.sent.length === 1 && success.sent[0].url === 'https://api.web3forms.com/submit', JSON.stringify(success.sent.map((s) => s.url)));
  assert('payload carries key, subject, fields and botcheck', body.access_key === 'test-access-key-not-real' && body.subject === 'DevSpire Nexus contact message' && body.name === 'Test Visitor' && body.email === 'visitor@example.com' && body.topic === 'Catalog correction' && body.message.length >= 20 && body.botcheck === false, JSON.stringify(body));
  assert('success message is honest about guarantees', /delivered/i.test(success.status) && /not a guarantee/i.test(success.status), success.status);
  assert('success is styled as success', /text-tertiary/.test(success.statusClass), success.statusClass);
  assert('form resets after delivery', Object.values(success.values).every((v) => v === ''), JSON.stringify(success.values));
  assert('submit returns to idle state', success.busy === 'false' && success.label === 'Send message');

  /* ---------- Service rejection ---------- */
  await page.evaluate(() => {
    window.__sent = [];
    window.fetch = async (url, options) => {
      window.__sent.push({ url, body: JSON.parse(options.body) });
      return { ok: true, status: 200, json: async () => ({ success: false, message: 'Access key rejected.' }) };
    };
  });
  await page.fill('#contact-name', 'Test Visitor');
  await page.fill('#contact-email', 'visitor@example.com');
  await page.selectOption('#contact-topic', 'Other');
  await page.fill('#contact-message', 'A complete message that the service will reject.');
  await page.evaluate(() => document.getElementById('contact-form').requestSubmit());
  await page.waitForTimeout(400);
  const rejected = await page.evaluate(() => ({
    status: document.getElementById('contact-status').textContent.trim(),
    kept: document.getElementById('contact-message').value.length,
    label: document.getElementById('contact-submit-label').textContent.trim()
  }));
  assert('service rejection is surfaced, not masked', /not accepted: Access key rejected/i.test(rejected.status), rejected.status);
  assert('rejected message is preserved for retry', rejected.kept > 0);
  assert('rejected state re-enables submit', rejected.label === 'Send message');

  /* ---------- Network failure ---------- */
  await page.evaluate(() => { window.fetch = async () => { throw new TypeError('offline'); }; });
  await page.evaluate(() => document.getElementById('contact-form').requestSubmit());
  await page.waitForTimeout(400);
  assert('network failure is reported honestly', await page.evaluate(() => /could not reach Web3Forms/i.test(document.getElementById('contact-status').textContent)));
  assert('no fake success is ever shown', await page.evaluate(() => !/delivered/i.test(document.getElementById('contact-status').textContent)));

  assert('no console or page errors', errors.length === 0, errors.slice(0, 5).join(' | '));

  await page.close();
  await browser.close();

  const passed = results.filter((r) => r.pass).length;
  console.log(`\n=== ${passed}/${results.length} checks passed ===`);
  if (passed !== results.length) {
    console.log('Failures:');
    results.filter((r) => !r.pass).forEach((r) => console.log(' -', r.name, r.extra));
    process.exitCode = 1;
  }
})();
