(() => {
  'use strict';

  const form = document.getElementById('submission-form');
  if (!form) return;

  const summary = document.getElementById('form-summary');
  const success = document.getElementById('form-success');
  const configStatus = document.getElementById('config-status');
  const section = document.getElementById('draft-section');
  const draftEl = document.getElementById('draft-json');
  const draftStatus = document.getElementById('draft-status');
  const copyStatus = document.getElementById('draft-copy-status');
  const copyBtn = document.getElementById('copy-draft');
  const downloadBtn = document.getElementById('download-draft');
  const clearBtn = document.getElementById('clear-form');
  const submitBtn = document.getElementById('submit-button');
  const submitLabel = document.getElementById('submit-label');
  const typeSelect = document.getElementById('sub-type');
  const options = document.getElementById('category-options');
  const botcheck = document.getElementById('sub-botcheck');

  const DEFAULTS = {
    endpoint: 'https://api.web3forms.com/submit',
    requestTimeoutMs: 15000,
    subject: 'AI Intelligence Directory resource submission',
    duplicateWindowMs: 6 * 60 * 60 * 1000
  };

  const config = () => Object.assign({}, DEFAULTS, window.DSH_SITE_CONFIG || {});
  const accessKey = () => String((window.DSH_SITE_CONFIG || {}).web3formsAccessKey || '').trim();

  const TYPES = ['AI Tool', 'AI Model', 'Developer Resource'];
  const FIELDS = ['name', 'type', 'url', 'docs', 'repo', 'category', 'description', 'evidence', 'tags', 'submitter', 'email'];
  const REQUIRED = ['name', 'type', 'url', 'category', 'description'];
  const ids = {
    name: 'sub-name',
    type: 'sub-type',
    url: 'sub-url',
    docs: 'sub-docs',
    repo: 'sub-repo',
    category: 'sub-category',
    description: 'sub-description',
    evidence: 'sub-evidence',
    tags: 'sub-tags',
    submitter: 'sub-submitter',
    email: 'sub-email'
  };

  let busy = false;
  let lastReceipt = null;
  let lastFingerprint = '';

  const categoriesByType = () => {
    const pick = (arr) => [...new Set((arr || []).map((r) => r.category).filter(Boolean))].sort();
    return {
      'AI Tool': pick(window.AI_TOOLS),
      'AI Model': pick(window.AI_MODELS),
      'Developer Resource': pick(window.DEVELOPER_RESOURCES)
    };
  };
  const cats = categoriesByType();

  const fillCategories = () => {
    const list = cats[typeSelect.value] || [...new Set(Object.values(cats).flat())].sort();
    options.textContent = '';
    list.forEach((name) => {
      const opt = document.createElement('option');
      opt.value = name;
      options.appendChild(opt);
    });
  };
  fillCategories();
  typeSelect.addEventListener('change', fillCategories);

  const isUrl = (value) => {
    try {
      const u = new URL(value);
      return (u.protocol === 'http:' || u.protocol === 'https:') && Boolean(u.hostname);
    } catch {
      return false;
    }
  };
  const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

  const setError = (key, message) => {
    const input = document.getElementById(ids[key]);
    const err = document.getElementById('err-' + key);
    if (err) {
      err.textContent = message;
      err.hidden = !message;
    }
    if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
    return !message;
  };

  const tagList = () => {
    const raw = document.getElementById('sub-tags').value.trim();
    return raw ? raw.split(',').map((t) => t.trim()).filter(Boolean) : [];
  };

  const validateField = (key) => {
    const input = document.getElementById(ids[key]);
    if (!input) return true;
    const value = String(input.value || '').trim();
    let message = '';

    if (key === 'name' && (value.length < 2 || value.length > 120)) message = 'Enter a name between 2 and 120 characters.';
    if (key === 'type' && !TYPES.includes(value)) message = 'Choose the kind of resource this is.';
    if (key === 'url' && !isUrl(value)) message = 'Enter a full http:// or https:// official website URL.';
    if (key === 'category' && (value.length < 2 || value.length > 60)) message = 'Enter a category between 2 and 60 characters.';
    if (key === 'description' && (value.length < 40 || value.length > 600)) message = 'Use 40 to 600 characters.';
    if (key === 'docs' && value && !isUrl(value)) message = 'Enter a full http:// or https:// documentation URL, or leave it blank.';
    if (key === 'repo' && value && !isUrl(value)) message = 'Enter a full http:// or https:// repository URL, or leave it blank.';
    if (key === 'evidence' && value && !isUrl(value)) message = 'Enter a full http:// or https:// evidence URL, or leave it blank.';
    if (key === 'submitter' && value.length > 80) message = 'Use 80 characters or fewer.';
    if (key === 'email' && value && !isEmail(value)) message = 'Enter a valid email address, or leave it blank.';
    if (key === 'tags') {
      const list = tagList();
      if (list.length > 10) message = 'Use at most 10 tags.';
      else if (list.some((tag) => tag.length > 30)) message = 'Keep each tag to 30 characters or fewer.';
    }
    return setError(key, message);
  };

  const validateAll = () => {
    const results = FIELDS.map((key) => validateField(key));
    const bad = results.filter((ok) => !ok).length;
    return { ok: bad === 0, bad };
  };

  const hideAlerts = () => {
    summary.hidden = true;
    summary.textContent = '';
    success.hidden = true;
    success.textContent = '';
  };

  const showFailure = (message) => {
    success.hidden = true;
    summary.textContent = message;
    summary.hidden = false;
  };

  const showSuccess = (message) => {
    summary.hidden = true;
    success.textContent = message;
    success.hidden = false;
  };

  const setBusy = (on) => {
    busy = on;
    submitBtn.disabled = on;
    submitBtn.setAttribute('aria-busy', on ? 'true' : 'false');
    submitLabel.textContent = on ? 'Sending…' : 'Submit for review';
    clearBtn.disabled = on;
  };

  const clearErrors = () => {
    FIELDS.forEach((key) => setError(key, ''));
  };

  const resetReceipt = () => {
    section.hidden = true;
    draftEl.textContent = '';
    copyBtn.disabled = true;
    downloadBtn.disabled = true;
    copyStatus.textContent = '';
    lastReceipt = null;
  };

  const copyText = async (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      /* fall through to the textarea fallback */
    }
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch {
      return false;
    }
  };

  const slug = (value) => String(value || 'resource').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'resource';

  const normalizeUrl = (value) => String(value || '').toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '');

  const fingerprint = (record) => [
    record.type,
    record.name.toLowerCase().replace(/\s+/g, ' ').trim(),
    normalizeUrl(record.url)
  ].join('|');

  const storageKey = (fp) => 'dsh-submission:' + fp;

  const recentlySubmitted = (fp) => {
    if (fp && fp === lastFingerprint) return true;
    try {
      const at = Number(window.localStorage.getItem(storageKey(fp)));
      return Boolean(at) && Date.now() - at < config().duplicateWindowMs;
    } catch {
      return false;
    }
  };

  const rememberSubmission = (fp) => {
    lastFingerprint = fp;
    try {
      window.localStorage.setItem(storageKey(fp), String(Date.now()));
    } catch {
      /* storage can be unavailable in private or file contexts; memory still guards this session */
    }
  };

  const readRecord = () => {
    const value = (id) => document.getElementById(id).value.trim();
    return {
      name: value('sub-name'),
      type: value('sub-type'),
      url: value('sub-url'),
      category: value('sub-category'),
      description: value('sub-description'),
      docs: value('sub-docs'),
      repo: value('sub-repo'),
      pricing: value('sub-pricing'),
      license: value('sub-license'),
      org: value('sub-org'),
      evidence: value('sub-evidence'),
      tags: tagList(),
      submitter: value('sub-submitter'),
      email: value('sub-email'),
      notes: value('sub-notes')
    };
  };

  const buildPayload = (record, key) => {
    const payload = {
      access_key: key,
      subject: `${config().subject} — ${record.name}`,
      from_name: 'AI Intelligence Directory',
      resource_name: record.name,
      official_url: record.url,
      resource_type: record.type,
      category: record.category,
      description: record.description,
      documentation_url: record.docs || 'Not provided',
      repository_url: record.repo || 'Not provided',
      pricing: record.pricing || 'Not stated',
      license: record.license || 'Not provided',
      organization: record.org || 'Not provided',
      evidence_url: record.evidence || 'Not provided',
      tags: record.tags.length ? record.tags.join(', ') : 'None',
      submitter_name: record.submitter || 'Not provided',
      additional_information: record.notes || 'Not provided',
      botcheck: false
    };
    if (record.email) payload.email = record.email;
    return payload;
  };

  const receiptFor = (payload) => {
    const copy = Object.assign({}, payload);
    delete copy.access_key;
    delete copy.botcheck;
    return {
      status: 'pending-review',
      submitted_at: new Date().toISOString(),
      delivery: 'Web3Forms accepted the request for delivery to the maintainers.',
      record: copy,
      review: {
        published: false,
        note: 'Pending manual moderation. Nothing was added to the catalog automatically.'
      }
    };
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;

    const key = accessKey();
    if (!key) {
      configStatus.hidden = false;
      showFailure('Submission is not configured in this copy of the directory. Add a Web3Forms access key to data/site-config.js, then try again. Your entries have been kept.');
      configStatus.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    configStatus.hidden = true;

    if (botcheck && botcheck.checked) {
      showFailure('This submission could not be processed. Your entries have been kept.');
      return;
    }

    const { ok, bad } = validateAll();
    if (!ok) {
      resetReceipt();
      showFailure(`Submission not sent — fix ${bad} field${bad === 1 ? '' : 's'} below. Your entries have been kept.`);
      const firstBad = document.querySelector('[aria-invalid="true"]');
      if (firstBad) firstBad.focus();
      return;
    }

    const record = readRecord();
    const fp = fingerprint(record);
    if (recentlySubmitted(fp)) {
      showFailure('This exact resource was submitted recently. Duplicate submissions are blocked for a short period; edit the record if something has changed.');
      return;
    }

    hideAlerts();
    setBusy(true);

    const cfg = config();
    const endpoint = /^https:\/\//i.test(cfg.endpoint) ? cfg.endpoint : DEFAULTS.endpoint;
    const timeoutMs = Number(cfg.requestTimeoutMs) > 0 ? Number(cfg.requestTimeoutMs) : DEFAULTS.requestTimeoutMs;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    const payload = buildPayload(record, key);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }
      if (!response.ok || !data || data.success !== true) {
        const detail = data && data.message ? String(data.message) : `The service responded with HTTP ${response.status}.`;
        const failure = new Error(detail);
        failure.kind = 'rejected';
        throw failure;
      }

      rememberSubmission(fp);
      lastReceipt = receiptFor(payload);
      draftEl.textContent = JSON.stringify(lastReceipt, null, 2);
      draftStatus.textContent = 'Submission accepted by Web3Forms. Pending moderation.';
      copyBtn.disabled = false;
      downloadBtn.disabled = false;
      copyStatus.textContent = '';
      section.hidden = false;
      showSuccess('Submission received. Your record is pending moderation and has not been published.');
      form.reset();
      fillCategories();
      clearErrors();
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      const timedOut = controller.signal.aborted;
      let message;
      if (timedOut) {
        message = `The submission timed out after ${Math.round(timeoutMs / 1000)} seconds. Nothing was confirmed. Check your connection and try again. Your entries have been kept.`;
      } else if (error && error.kind === 'rejected') {
        message = `The submission was not accepted: ${error.message} Your entries have been kept.`;
      } else {
        message = 'The submission could not reach Web3Forms. Check your connection and try again. Your entries have been kept.';
      }
      showFailure(message);
    } finally {
      window.clearTimeout(timer);
      setBusy(false);
    }
  });

  FIELDS.forEach((key) => {
    const input = document.getElementById(ids[key]);
    if (!input) return;
    const revalidate = () => {
      if (input.getAttribute('aria-invalid') === 'true' || summary.hidden === false) validateField(key);
    };
    input.addEventListener('input', revalidate);
    input.addEventListener('change', revalidate);
  });

  copyBtn.addEventListener('click', async () => {
    if (!lastReceipt) return;
    const ok = await copyText(draftEl.textContent);
    copyStatus.textContent = ok
      ? 'Receipt JSON copied to the clipboard.'
      : 'Copy failed — select the JSON and copy it manually.';
  });

  downloadBtn.addEventListener('click', () => {
    if (!lastReceipt) return;
    const blob = new Blob([draftEl.textContent + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug(lastReceipt.record.resource_name)}-submission-receipt.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    copyStatus.textContent = 'Receipt downloaded. It is not a publication confirmation.';
  });

  clearBtn.addEventListener('click', () => {
    form.reset();
    fillCategories();
    clearErrors();
    hideAlerts();
    resetReceipt();
  });

  if (!accessKey()) {
    configStatus.hidden = false;
  }
})();
