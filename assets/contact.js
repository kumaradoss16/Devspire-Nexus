/* Contact form: local validation, honest configuration state, Web3Forms
   delivery when a public access key is configured, and spam traps. */
(() => {
  'use strict';

  const DEFAULTS = {
    endpoint: 'https://api.web3forms.com/submit',
    requestTimeoutMs: 15000,
    contactSubject: 'DevSpire Nexus contact message'
  };
  const TOPICS = new Set(['Catalog correction', 'Resource suggestion', 'Privacy question', 'Directory feedback', 'Other']);
  const LOADED_AT = Date.now();

  const $ = (id) => document.getElementById(id);
  const form = $('contact-form');
  if (!form) return;

  const banner = $('contact-config');
  const bannerText = $('contact-config-text');
  const status = $('contact-status');
  const submit = $('contact-submit');
  const submitLabel = $('contact-submit-label');
  const note = $('contact-delivery-note');
  const botcheck = $('contact-botcheck');
  const fields = {
    name: { el: $('contact-name'), error: $('contact-name-error') },
    email: { el: $('contact-email'), error: $('contact-email-error') },
    topic: { el: $('contact-topic'), error: $('contact-topic-error') },
    message: { el: $('contact-message'), error: $('contact-message-error') }
  };
  let busy = false;

  const config = () => Object.assign({}, DEFAULTS, window.DSH_SITE_CONFIG || {});
  const accessKey = () => String((window.DSH_SITE_CONFIG || {}).web3formsAccessKey || '').trim();
  const endpoint = () => {
    const value = String(config().endpoint || '');
    return /^https:\/\//i.test(value) ? value : DEFAULTS.endpoint;
  };
  const timeoutMs = () => {
    const value = Number(config().requestTimeoutMs);
    return value > 0 ? value : DEFAULTS.requestTimeoutMs;
  };

  function showStatus(message, kind) {
    status.hidden = false;
    status.textContent = message;
    status.classList.remove('text-status-error', 'text-tertiary', 'border-status-error/40', 'bg-status-error/10', 'border-tertiary/40', 'bg-tertiary/10');
    if (kind === 'success') status.classList.add('text-tertiary', 'border-tertiary/40', 'bg-tertiary/10');
    else status.classList.add('text-status-error', 'border-status-error/40', 'bg-status-error/10');
  }

  function clearStatus() {
    status.hidden = true;
    status.textContent = '';
  }

  function setError(name, message) {
    const field = fields[name];
    if (!field) return;
    field.error.textContent = message || '';
    field.error.hidden = !message;
    field.el.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function clearErrors() {
    Object.keys(fields).forEach((name) => setError(name, ''));
  }

  function validate() {
    const values = {
      name: fields.name.el.value.replace(/\s+/g, ' ').trim(),
      email: fields.email.el.value.trim(),
      topic: fields.topic.el.value,
      message: fields.message.el.value.trim()
    };
    let bad = 0;
    const fail = (name, message) => { setError(name, message); bad += 1; };

    if (values.name.length < 2) fail('name', 'Enter your name (at least 2 characters).');
    if (values.name.length > 80) fail('name', 'Keep your name under 80 characters.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email)) fail('email', 'Enter a valid email address.');
    else if (values.email.length > 120) fail('email', 'Keep the email address under 120 characters.');
    if (!TOPICS.has(values.topic)) fail('topic', 'Choose a topic.');
    if (values.message.length < 20) fail('message', 'Write at least 20 characters so the message is actionable.');
    if (values.message.length > 2000) fail('message', 'Keep the message under 2000 characters.');
    return { ok: bad === 0, values, bad };
  }

  function setBusy(value) {
    busy = value;
    form.setAttribute('aria-busy', String(value));
    submit.disabled = value || !accessKey();
    submitLabel.textContent = value ? 'Sending…' : 'Submit Form';
    note.textContent = value
      ? 'Contacting the delivery service…'
      : (accessKey() ? 'Delivery is configured. Messages are sent only when you submit.' : 'Delivery is not configured in this copy; nothing is transmitted.');
  }

  function refreshConfig() {
    const configured = Boolean(accessKey());
    banner.hidden = configured;
    if (!configured) {
      bannerText.innerHTML = 'No Web3Forms access key is present in <code class="font-code-badge">data/site-config.js</code>, so this form will validate your message but cannot transmit it. You can reach the parent brand through the <a class="text-secondary hover:underline" href="https://devspirehub.com/Website/contact/index.html" target="_blank" rel="noopener">DevSpireHub contact page</a>.';
    }
    submit.disabled = busy || !configured;
    note.textContent = configured
      ? 'Delivery is configured. Messages are sent only when you submit.'
      : 'Delivery is not configured in this copy; nothing is transmitted.';
    return configured;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;
    clearStatus();

    if (!refreshConfig()) {
      showStatus('This message was not sent. Form delivery is not configured in this copy of the directory.', 'error');
      banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (botcheck && botcheck.checked) {
      showStatus('This message could not be processed.', 'error');
      return;
    }

    const result = validate();
    if (!result.ok) {
      showStatus(`Message not sent. Please fix the ${result.bad} highlighted field${result.bad === 1 ? '' : 's'} below.`, 'error');
      const firstBad = form.querySelector('[aria-invalid="true"]');
      if (firstBad) firstBad.focus();
      return;
    }
    if (Date.now() - LOADED_AT < 2000) {
      showStatus('This message could not be processed. Please take a moment to review your message and try again.', 'error');
      return;
    }

    setBusy(true);
    const cfg = config();
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs());
    const payload = {
      access_key: accessKey(),
      subject: cfg.contactSubject || cfg.subject || DEFAULTS.contactSubject,
      from_name: result.values.name,
      name: result.values.name,
      email: result.values.email,
      topic: result.values.topic,
      message: result.values.message,
      botcheck: false
    };

    try {
      const response = await fetch(endpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      let data = null;
      try { data = await response.json(); } catch { data = null; }
      if (!response.ok || !data || data.success !== true) {
        const detail = data && data.message ? String(data.message) : `The service responded with HTTP ${response.status}.`;
        const failure = new Error(detail);
        failure.kind = 'rejected';
        throw failure;
      }
      showStatus('Message delivered to the maintainers through Web3Forms. Delivery is not a guarantee of a response or catalog change.', 'success');
      form.reset();
      clearErrors();
      status.focus?.();
    } catch (error) {
      const timedOut = controller.signal.aborted;
      if (timedOut) showStatus(`The message timed out after ${Math.round(timeoutMs() / 1000)} seconds. Nothing was confirmed. Check your connection and try again.`, 'error');
      else if (error && error.kind === 'rejected') showStatus(`The message was not accepted: ${error.message}`, 'error');
      else showStatus('The message could not reach Web3Forms. Check your connection and try again.', 'error');
    } finally {
      window.clearTimeout(timer);
      setBusy(false);
      refreshConfig();
    }
  });

  Object.values(fields).forEach(({ el }) => {
    el.addEventListener('input', () => {
      if (el.getAttribute('aria-invalid') === 'true') setError(el.id.replace('contact-', '').replace(/-error$/, ''), '');
      clearStatus();
    });
  });

  window.ContactForm = { refreshConfig, validate, isConfigured: () => Boolean(accessKey()) };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshConfig(); });
  refreshConfig();
})();
