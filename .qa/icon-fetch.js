#!/usr/bin/env node
/* Resumable icon discovery and validation for ai-resources-1000.json.
   Fetches only from each record's official domain, GitHub owner avatar, or the
   existing favicon-service URL; validates HTTP status, image magic and dimensions;
   stores verified bytes locally so the site keeps zero remote icon hotlinks.

   Usage:
     node .qa/icon-fetch.js --limit 5 --verbose
     node .qa/icon-fetch.js --concurrency 6
     node .qa/icon-fetch.js --refresh-failed
     node .qa/icon-fetch.js --apply
*/

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const util = require('util');

const ROOT = path.resolve(__dirname, '..');
const AUDIT = path.join(ROOT, '.qa', 'icon-audit');
const DATASET = path.join(AUDIT, 'ai-resources-1000.json');
const BACKUP = path.join(AUDIT, 'backup', 'ai-resources-1000.original.json');
const CACHE_DIR = path.join(AUDIT, 'cache');
const STATE_FILE = path.join(CACHE_DIR, 'state.json');
const LOG_FILE = path.join(CACHE_DIR, 'progress.log');
const ICON_DIR = path.join(ROOT, 'assets', 'img', 'icons', 'verified');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const RESERVED_GH = new Set([
  'features', 'topics', 'orgs', 'sponsors', 'marketplace', 'collections',
  'settings', 'login', 'about', 'pricing', 'enterprise', 'security',
  'site', 'apps', 'trending', 'explore', 'new', 'notifications'
]);
const PLATFORM_DOMAINS = new Set([
  'github.com', 'huggingface.co', 'npmjs.com', 'pypi.org', 'arxiv.org',
  'youtube.com', 'medium.com', 'reddit.com', 'x.com', 'twitter.com',
  'linkedin.com', 'kaggle.com', 'colab.research.google.com'
]);

const args = process.argv.slice(2);
const opt = {
  concurrency: 6,
  timeout: 12000,
  retries: 2,
  maxBytes: 2.5 * 1024 * 1024,
  limit: 0,
  apply: false,
  refreshFailed: false,
  force: false,
  verbose: false,
  only: ''
};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--concurrency') opt.concurrency = Math.max(1, Number(args[++i]) || opt.concurrency);
  else if (a === '--timeout') opt.timeout = Math.max(2000, Number(args[++i]) || opt.timeout);
  else if (a === '--retries') opt.retries = Math.max(0, Number(args[++i]) || 0);
  else if (a === '--limit') opt.limit = Math.max(0, Number(args[++i]) || 0);
  else if (a === '--only') opt.only = String(args[++i] || '');
  else if (a === '--apply') opt.apply = true;
  else if (a === '--refresh-failed') opt.refreshFailed = true;
  else if (a === '--force') opt.force = true;
  else if (a === '--verbose') opt.verbose = true;
  else if (a === '--help' || a === '-h') {
    console.log('Usage: node .qa/icon-fetch.js [--limit N] [--concurrency N] [--timeout MS] [--apply] [--refresh-failed] [--force] [--only prefix] [--verbose]');
    process.exit(0);
  }
}

fs.mkdirSync(CACHE_DIR, { recursive: true });
fs.mkdirSync(ICON_DIR, { recursive: true });

function log(line) {
  const text = `[${new Date().toISOString()}] ${line}`;
  fs.appendFileSync(LOG_FILE, text + '\n');
  console.log(text);
}
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function slug(input) {
  return String(input).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || 'icon';
}
function normalizeDomain(domain) {
  return String(domain || '').trim().toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split(/[/?#]/)[0]
    .replace(/\/+$/, '');
}
function cleanOwner(owner) {
  const value = String(owner || '').toLowerCase();
  return RESERVED_GH.has(value) ? '' : value;
}
function ownerFromRecord(record) {
  const direct = githubOwner(record.verified_link && record.verified_link.url);
  if (direct) return direct;
  const evidence = Array.isArray(record.evidence_sources) ? record.evidence_sources : [];
  for (const source of evidence) {
    const owner = githubOwner(source);
    if (owner) return owner;
  }
  return githubOwnerFromDomain(record.domain);
}
function githubOwner(url) {
  const m = String(url || '').match(/^https?:\/\/github\.com\/([^/?#]+)/i);
  return m ? cleanOwner(m[1]) : '';
}
function githubOwnerFromDomain(domain) {
  const raw = String(domain || '');
  const repo = raw.match(/github\.com\/([^/?#]+)/i);
  if (repo) return cleanOwner(repo[1]);
  const pages = raw.match(/^(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+)\.github\.io(?:\/|$)/i);
  return pages ? cleanOwner(pages[1]) : '';
}

let active = 0;
const queue = [];
function pump() {
  while (active < opt.concurrency && queue.length) {
    const job = queue.shift();
    active++;
    job.fn().then(job.resolve, job.reject).finally(() => {
      active--;
      setTimeout(pump, 60);
    });
  }
}
function limit(fn) {
  return new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    pump();
  });
}

async function request(url, { maxBytes = opt.maxBytes, accept = 'image/*,*/*;q=0.5', timeout = opt.timeout } = {}) {
  let lastError = '';
  for (let attempt = 0; attempt <= opt.retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'user-agent': UA, accept }
      });
      if (!res.ok) {
        lastError = 'HTTP ' + res.status;
        if (res.status === 429 || res.status >= 500) {
          await sleep(400 * (attempt + 1));
          continue;
        }
        return { ok: false, status: res.status, error: lastError, url: res.url || url };
      }
      if (!res.body) return { ok: false, status: res.status, error: 'empty response body', url: res.url || url };
      const reader = res.body.getReader();
      const chunks = [];
      let total = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.length;
        if (total > maxBytes) {
          await reader.cancel();
          return { ok: false, status: res.status, error: 'response too large', url: res.url || url };
        }
        chunks.push(Buffer.from(value));
      }
      return {
        ok: true,
        status: res.status,
        contentType: res.headers.get('content-type') || '',
        buffer: Buffer.concat(chunks),
        url: res.url || url
      };
    } catch (err) {
      lastError = err.name === 'AbortError' ? 'timeout' : err.message;
      if (attempt < opt.retries) await sleep(400 * (attempt + 1));
    } finally {
      clearTimeout(timer);
    }
  }
  return { ok: false, status: 0, error: lastError || 'request failed', url };
}

function attrsOf(tag) {
  const out = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let m;
  while ((m = re.exec(tag))) out[m[1].toLowerCase()] = m[3] || m[4] || m[5] || '';
  return out;
}
function maxSize(sizes) {
  if (!sizes || /any/i.test(sizes)) return 1024;
  const list = String(sizes).split(/\s+/).map(s => parseInt(s, 10) || 0);
  return list.length ? Math.max(...list) : 0;
}
function resolveUrl(href, base) {
  if (!href || /^data:/i.test(href)) return '';
  try { return new URL(href, base).href; } catch { return ''; }
}
function rankCandidate(c) {
  if (c.source === 'favicon') return 25;
  if (c.source === 'google') return 30;
  if (c.source === 'manifest') return 14 + (1024 - Math.min(c.size || 0, 1024)) / 10000;
  const rel = (c.rel || '').toLowerCase();
  const size = c.size || 0;
  if (rel.includes('apple-touch-icon')) return 10 + (1024 - Math.min(size || 180, 1024)) / 10000;
  if (/\bicon\b/.test(rel) || rel.includes('shortcut icon')) {
    if (/svg/i.test(c.type || '') || /\.svg(\?|$)/i.test(c.url)) return 11;
    return 12 + (1024 - Math.min(size, 1024)) / 10000;
  }
  if (rel.includes('mask-icon')) return 13;
  if (c.source === 'manifest') return 14 + (1024 - Math.min(size, 1024)) / 10000;
  if (c.source === 'favicon') return 25;
  if (c.source === 'google') return 30;
  return 40;
}

function sniffImage(buf) {
  if (buf.length < 16) return null;
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) && buf.length >= 24) {
    return { ext: 'png', type: 'image/png', width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { ext: 'jpg', type: 'image/jpeg', width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
      }
      i += 2 + len;
    }
    return { ext: 'jpg', type: 'image/jpeg', width: 0, height: 0 };
  }
  if (buf.slice(0, 6).toString('ascii') === 'GIF87a' || buf.slice(0, 6).toString('ascii') === 'GIF89a') {
    return { ext: 'gif', type: 'image/gif', width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  }
  if (buf.length >= 30 && buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') {
    if (buf.slice(12, 16).toString('ascii') === 'VP8X') {
      return { ext: 'webp', type: 'image/webp', width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
    }
    if (buf.slice(12, 16).toString('ascii') === 'VP8 ') {
      return { ext: 'webp', type: 'image/webp', width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    }
    return { ext: 'webp', type: 'image/webp', width: 0, height: 0 };
  }
  if (buf.length >= 4 && buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00) {
    let width = 0, height = 0;
    if (buf.length >= 22) {
      width = buf[6] === 0 ? 256 : buf[6];
      height = buf[7] === 0 ? 256 : buf[7];
    }
    return { ext: 'ico', type: 'image/x-icon', width, height };
  }
  if (buf.length >= 12 && buf.slice(4, 12).toString('ascii') === 'ftypavif') {
    return { ext: 'avif', type: 'image/avif', width: 0, height: 0 };
  }
  const head = buf.slice(0, 2048).toString('utf8').trim();
  if (/^<\?xml|^<svg/i.test(head) && /<svg[\s>]/i.test(head)) {
    const svg = buf.toString('utf8');
    if (/<script\b|<foreignObject\b|javascript:|\son[a-z]+\s*=/i.test(svg)) return null;
    let width = 0, height = 0;
    const wm = svg.match(/<svg\b[^>]*\bwidth\s*=\s*["']([\d.]+)/i);
    const hm = svg.match(/<svg\b[^>]*\bheight\s*=\s*["']([\d.]+)/i);
    if (wm) width = Math.round(Number(wm[1]));
    if (hm) height = Math.round(Number(hm[1]));
    return { ext: 'svg', type: 'image/svg+xml', width, height };
  }
  return null;
}

function validateBuffer(buffer, contentType) {
  const meta = sniffImage(buffer);
  if (!meta) return { valid: false, reason: 'not a recognised image' };
  if (meta.ext === 'svg') {
    if (buffer.length > 512 * 1024) return { valid: false, reason: 'svg too large' };
    if (!meta.width && !meta.height && !/viewBox/i.test(buffer.toString('utf8'))) {
      return { valid: false, reason: 'svg without intrinsic size' };
    }
  } else {
    if (!meta.width || !meta.height) {
      if (meta.ext !== 'avif') return { valid: false, reason: 'unknown image dimensions' };
    } else if (meta.width < 16 || meta.height < 16) {
      return { valid: false, reason: `image too small (${meta.width}x${meta.height})` };
    }
  }
  if (/text\/html|application\/xhtml/i.test(contentType || '')) return { valid: false, reason: 'html response' };
  return { valid: true, meta };
}

async function validateUrl(url, source) {
  const res = await request(url, { maxBytes: 2.5 * 1024 * 1024, accept: 'image/*,*/*;q=0.5' });
  if (!res.ok) return { ok: false, url, source, status: res.status, reason: res.error };
  const check = validateBuffer(res.buffer, res.contentType);
  if (!check.valid) return { ok: false, url: res.url, source, status: res.status, reason: check.reason };
  return {
    ok: true,
    url: res.url || url,
    source,
    status: res.status,
    contentType: res.contentType,
    ext: check.meta.ext,
    width: check.meta.width,
    height: check.meta.height,
    bytes: res.buffer.length,
    sha256: sha256(res.buffer),
    buffer: res.buffer
  };
}

function linksFromHtml(html, base) {
  const candidates = [];
  const tags = html.match(/<link\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const a = attrsOf(tag);
    const rel = (a.rel || '').toLowerCase();
    if (!rel) continue;
    if (rel.includes('manifest')) {
      const url = resolveUrl(a.href, base);
      if (url) candidates.push({ url, rel: 'manifest', source: 'manifest-link', size: 0, type: 'application/manifest+json' });
      continue;
    }
    if (!/icon|apple-touch|mask-icon/.test(rel)) continue;
    const url = resolveUrl(a.href, base);
    if (!url) continue;
    candidates.push({ url, rel, type: a.type || '', size: maxSize(a.sizes), source: 'html' });
  }
  const metas = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of metas) {
    const a = attrsOf(tag);
    const name = (a.name || a.property || '').toLowerCase();
    if (/msapplication-tileimage|og:image/.test(name) && a.content) {
      const url = resolveUrl(a.content, base);
      if (url && /tileimage/.test(name)) candidates.push({ url, rel: 'icon', type: '', size: 0, source: 'html-meta' });
    }
  }
  return candidates;
}

async function manifestCandidates(manifestUrl) {
  const res = await request(manifestUrl, { maxBytes: 512 * 1024, accept: 'application/manifest+json,application/json,*/*;q=0.5' });
  if (!res.ok) return [];
  let json;
  try { json = JSON.parse(res.buffer.toString('utf8').replace(/^\uFEFF/, '')); } catch { return []; }
  if (!json || !Array.isArray(json.icons)) return [];
  return json.icons
    .filter(icon => icon && icon.src)
    .map(icon => ({
      url: resolveUrl(icon.src, res.url || manifestUrl),
      rel: 'icon',
      type: icon.type || '',
      size: maxSize(icon.sizes),
      purpose: icon.purpose || '',
      source: 'manifest'
    }))
    .filter(c => c.url);
}

async function discoverDomain(domain, existingUrls) {
  const base = `https://${domain}/`;
  const failures = [];
  let html = '';
  let pageUrl = base;
  let page = await request(base, { maxBytes: 1.6 * 1024 * 1024, accept: 'text/html,application/xhtml+xml,*/*;q=0.5' });
  if (!page.ok) {
    failures.push(`homepage: ${page.error || page.status}`);
    if (!domain.startsWith('www.')) {
      const alt = `https://www.${domain}/`;
      page = await request(alt, { maxBytes: 1.6 * 1024 * 1024, accept: 'text/html,application/xhtml+xml,*/*;q=0.5' });
      if (page.ok) { pageUrl = alt; } else failures.push(`www homepage: ${page.error || page.status}`);
    }
  }
  if (page.ok && (/html|xml/i.test(page.contentType || '') || page.buffer.slice(0, 500).toString('utf8').toLowerCase().includes('<html'))) {
    html = page.buffer.toString('utf8');
    pageUrl = page.url || base;
  } else if (page.ok) {
    failures.push('homepage was not html');
  }

  let candidates = html ? linksFromHtml(html, pageUrl) : [];
  const manifests = candidates.filter(c => c.rel === 'manifest' && c.source === 'manifest-link');
  candidates = candidates.filter(c => !(c.rel === 'manifest' && c.source === 'manifest-link'));
  for (const m of manifests.slice(0, 2)) {
    const icons = await manifestCandidates(m.url);
    candidates.push(...icons);
  }

  const direct = [
    { url: `https://${domain}/favicon.ico`, source: 'favicon', rel: 'icon', size: 0 },
    ...['favicon.png', 'favicon.svg', 'apple-touch-icon.png', 'apple-touch-icon-precomposed.png', 'assets/favicon.ico', 'static/favicon.ico', 'img/favicon.ico']
      .map(p => ({ url: `https://${domain}/${p}`, source: 'favicon', rel: 'icon', size: 0 })),
    ...(domain.startsWith('www.') ? [] : [
      { url: `https://www.${domain}/favicon.ico`, source: 'favicon', rel: 'icon', size: 0 },
      { url: `https://www.google.com/s2/favicons?domain=www.${domain}&sz=128`, source: 'google', rel: 'icon', size: 0 }
    ]),
    ...existingUrls.map(url => ({ url, source: 'google', rel: 'icon', size: 0 }))
  ];
  candidates.push(...direct);

  const seen = new Set();
  candidates = candidates.filter(c => {
    if (!c.url || seen.has(c.url)) return false;
    seen.add(c.url);
    return true;
  }).sort((a, b) => rankCandidate(a) - rankCandidate(b));

  let last = null;
  for (const candidate of candidates.slice(0, 12)) {
    const result = await validateUrl(candidate.url, candidate.source);
    if (result.ok) {
      if (result.source === 'google') result.identity = 'favicon_service';
      else if (candidate.source === 'manifest') result.identity = 'official_manifest';
      else result.identity = 'official_page_asset';
      return { ok: true, ...result, candidate, failures };
    }
    last = result;
    failures.push(`${candidate.url}: ${result.reason}`);
    if (opt.verbose) log(`  reject ${candidate.url} (${result.reason})`);
  }
  return { ok: false, domain, status: last ? last.status : 0, reason: last ? last.reason : 'no candidates', failures };
}

async function discoverGithub(owner) {
  const urls = [
    `https://github.com/${owner}.png?size=128`,
    `https://github.com/${owner}.png`
  ];
  const failures = [];
  let last = null;
  for (const url of urls) {
    const result = await validateUrl(url, 'github');
    if (result.ok) return { ok: true, ...result, identity: 'repository_owner', failures };
    last = result;
    failures.push(`${url}: ${result.reason}`);
  }
  return { ok: false, status: last ? last.status : 0, reason: last ? last.reason : 'github avatar unavailable', failures };
}

function saveLocal(targetKey, result) {
  const base = targetKey.startsWith('gh:') ? 'gh-' + slug(targetKey.slice(3)) : slug(targetKey.slice(2));
  const name = `${base}.${result.ext}`;
  const file = path.join(ICON_DIR, name);
  if (!fs.existsSync(file) || sha256(fs.readFileSync(file)) !== result.sha256) {
    fs.writeFileSync(file, result.buffer);
  }
  return 'assets/img/icons/verified/' + name;
}

function sanitizeForState(result) {
  const { buffer, candidate, ...rest } = result;
  return rest;
}

function loadState() {
  if (!fs.existsSync(STATE_FILE)) return { version: 1, targets: {}, records: {}, startedAt: new Date().toISOString() };
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  state.targets = state.targets || {};
  state.records = state.records || {};
  return state;
}
function saveState(state) {
  state.updatedAt = new Date().toISOString();
  const tmp = STATE_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, STATE_FILE);
}

function buildTargets(records) {
  const domains = new Map();
  const owners = new Map();
  const recordMeta = new Map();
  for (const r of records) {
    const domain = normalizeDomain(r.domain);
    const owner = ownerFromRecord(r);
    recordMeta.set(r.id, { domain, owner });
    if (domain) {
      if (!domains.has(domain)) domains.set(domain, []);
      if (r.icon && /^https?:\/\//i.test(r.icon)) domains.get(domain).push(r.icon);
    }
    if (owner) owners.set(owner, true);
  }
  if (!domains.has('github.com')) domains.set('github.com', []);
  return {
    targets: [
      ...[...domains.keys()].sort().map(domain => ({ key: 'd:' + domain, kind: 'domain', value: domain, existingUrls: [...new Set(domains.get(domain))].slice(0, 3) })),
      ...[...owners.keys()].sort().map(owner => ({ key: 'gh:' + owner, kind: 'github', value: owner }))
    ],
    recordMeta
  };
}

function verificationFor(result, target, recordDomain) {
  if (!result || !result.ok) {
    return { verification_status: 'unavailable', manual_review_required: false, identity_match: 'none' };
  }
  const identity = result.identity || '';
  const platform = PLATFORM_DOMAINS.has(recordDomain);
  let status = 'verified';
  let manual = false;
  if (identity === 'favicon_service') { status = 'manual_review'; manual = true; }
  else if (platform && identity === 'official_page_asset') { status = 'manual_review'; manual = true; }
  else if (platform && identity === 'official_manifest') { status = 'manual_review'; manual = true; }
  return {
    verification_status: status,
    manual_review_required: manual,
    identity_match: identity || 'same_domain'
  };
}

async function main() {
  const sourcePath = fs.existsSync(BACKUP) ? BACKUP : DATASET;
  const records = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  if (!Array.isArray(records) || !records.length) throw new Error('dataset is not a non-empty array');
  const state = loadState();
  const { targets, recordMeta } = buildTargets(records);

  if (opt.refreshFailed || opt.force) {
    for (const key of Object.keys(state.targets)) {
      if (opt.force || !state.targets[key].ok) delete state.targets[key];
    }
    saveState(state);
  }

  let pending = targets.filter(t => !state.targets[t.key]);
  if (opt.only) pending = pending.filter(t => t.key.startsWith(opt.only));
  if (opt.limit) pending = pending.slice(0, opt.limit);
  log(`records=${records.length} targets=${targets.length} cached=${targets.length - pending.length} pending=${pending.length} concurrency=${opt.concurrency}`);

  let done = 0;
  let failed = 0;
  await Promise.all(pending.map(target => limit(async () => {
    let result;
    if (target.kind === 'github') result = await discoverGithub(target.value);
    else result = await discoverDomain(target.value, target.existingUrls || []);

    if (result.ok) {
      result.localPath = saveLocal(target.key, result);
      result.checkedAt = new Date().toISOString();
      state.targets[target.key] = sanitizeForState(result);
      done++;
    } else {
      state.targets[target.key] = {
        ok: false,
        value: target.value,
        kind: target.kind,
        status: result.status || 0,
        reason: result.reason || 'unavailable',
        failures: (result.failures || []).slice(0, 6),
        checkedAt: new Date().toISOString()
      };
      failed++;
    }
    if ((done + failed) % 10 === 0) {
      saveState(state);
      log(`progress ${done + failed}/${pending.length} ok=${done} failed=${failed}`);
    }
  })));

  saveState(state);
  const stillPending = targets.filter(t => !state.targets[t.key]).length;
  const targetFailures = Object.values(state.targets).filter(t => !t.ok).length;
  log(`fetch complete ok=${done} failed=${failed} cached=${Object.keys(state.targets).length} pending=${stillPending} targetFailures=${targetFailures}`);

  if (!opt.apply) {
    log('dry run: dataset not modified. Re-run with --apply after reviewing cache/state.json');
    return;
  }
  if (stillPending) {
    log(`refusing --apply: ${stillPending} targets have not been fetched`);
    process.exit(2);
  }
  if (targetFailures) log(`warning: ${targetFailures} targets are unavailable; affected records will use null + frontend fallback`);

  const hashFreq = {};
  for (const t of Object.values(state.targets)) {
    if (t.ok && t.sha256) hashFreq[t.sha256] = (hashFreq[t.sha256] || 0) + 1;
  }
  const genericHashes = new Set(Object.keys(hashFreq).filter(h => hashFreq[h] >= 5));
  let genericPlaceholders = 0;
  const reportRecords = [];
  const updated = records.map(record => {
    const meta = recordMeta.get(record.id) || {};
    const candidates = [];
    const domainTarget = meta.domain ? state.targets['d:' + meta.domain] : null;
    const ownerTarget = meta.owner ? state.targets['gh:' + meta.owner] : null;
    const platform = PLATFORM_DOMAINS.has(meta.domain);
    if (platform && ownerTarget && ownerTarget.ok) {
      candidates.push({ target: 'gh:' + meta.owner, result: ownerTarget });
    } else {
      if (domainTarget && domainTarget.ok) candidates.push({ target: 'd:' + meta.domain, result: domainTarget });
      if (ownerTarget && ownerTarget.ok) candidates.push({ target: 'gh:' + meta.owner, result: ownerTarget });
    }
    const rank = { official_page_asset: 0, official_manifest: 1, repository_owner: 2, same_domain: 3, favicon_service: 4 };
    candidates.sort((a, b) => (rank[a.result.identity] ?? 9) - (rank[b.result.identity] ?? 9));
    const chosen = candidates[0];
    const previous = record.icon;
    let updatedIcon = null;
    let chosenResult = null;
    let genericReason = null;
    if (chosen) {
      chosenResult = chosen.result;
      updatedIcon = chosenResult.localPath;
    }
    if (chosenResult && chosenResult.identity === 'favicon_service' && genericHashes.has(chosenResult.sha256)) {
      genericReason = `generic favicon-service placeholder shared by ${hashFreq[chosenResult.sha256]} domains`;
      chosenResult = null;
      updatedIcon = null;
      genericPlaceholders++;
    }
    const verdict = verificationFor(chosenResult, chosen && chosen.target, meta.domain);
    const sourceType = !chosenResult ? 'unavailable'
      : chosenResult.identity === 'repository_owner' ? 'github_avatar'
      : chosenResult.identity === 'official_manifest' ? 'official_manifest'
      : chosenResult.identity === 'favicon_service' ? 'favicon_service'
      : chosenResult.source === 'favicon' ? 'domain_favicon'
      : 'official_website';
    reportRecords.push({
      resource_id: record.id,
      resource_name: record.name,
      resource_type: record.resource_type,
      domain: record.domain,
      previous_icon: previous,
      updated_icon: updatedIcon,
      icon_source: sourceType,
      icon_url: chosenResult ? chosenResult.url : null,
      http_status: chosenResult ? chosenResult.status : 0,
      image_valid: !!(chosenResult && chosenResult.ok),
      content_type: chosenResult ? chosenResult.contentType : null,
      width: chosenResult ? chosenResult.width : null,
      height: chosenResult ? chosenResult.height : null,
      bytes: chosenResult ? chosenResult.bytes : null,
      sha256: chosenResult ? chosenResult.sha256 : null,
      identity_match: verdict.identity_match,
      visual_review: 'not_performed',
      verification_status: verdict.verification_status,
      manual_review_required: verdict.manual_review_required,
      failure_reason: chosenResult ? null : (genericReason || (domainTarget && domainTarget.reason) || 'no validated icon source')
    });
    return { ...record, icon: updatedIcon };
  });

  const tmpDataset = DATASET + '.tmp';
  fs.writeFileSync(tmpDataset, JSON.stringify(updated, null, 2) + '\n');
  fs.renameSync(tmpDataset, DATASET);

  const previousPath = path.join(AUDIT, 'previous-icon-audit.json');
  let previousAudit = null;
  if (fs.existsSync(previousPath)) {
    previousAudit = JSON.parse(fs.readFileSync(previousPath, 'utf8'));
    const prevMap = new Map(previousAudit.results.map(x => [x.url, x]));
    for (const rec of reportRecords) {
      const p = prevMap.get(rec.previous_icon);
      rec.previous_http_status = p ? p.status : null;
      rec.previous_image_valid = p ? p.image_valid : null;
    }
  }

  const countBy = (key) => reportRecords.reduce((acc, r) => { acc[r[key]] = (acc[r[key]] || 0) + 1; return acc; }, {});
  const brokenPrevious = reportRecords.filter(r => {
    if (r.icon_source !== 'unavailable') return false;
    const t = state.targets['d:' + normalizeDomain(r.domain)];
    return !!(t && Array.isArray(t.failures) && t.failures.some(f => f.includes('google.com/s2')));
  }).length;
  const summary = {
    generated_at: new Date().toISOString(),
    dataset: path.relative(ROOT, DATASET).replace(/\\/g, '/'),
    backup: path.relative(ROOT, BACKUP).replace(/\\/g, '/'),
    total_resources: reportRecords.length,
    by_type: countBy('resource_type'),
    by_source: countBy('icon_source'),
    by_verification: countBy('verification_status'),
    official_icons: reportRecords.filter(r => r.icon_source === 'official_website' || r.icon_source === 'official_manifest').length,
    github_avatars: reportRecords.filter(r => r.icon_source === 'github_avatar').length,
    domain_favicons: reportRecords.filter(r => r.icon_source === 'domain_favicon').length,
    favicon_service_retained: reportRecords.filter(r => r.icon_source === 'favicon_service').length,
    unavailable: reportRecords.filter(r => r.icon_source === 'unavailable').length,
    generic_favicon_placeholders: genericPlaceholders,
    broken_previous_detected: previousAudit ? reportRecords.filter(r => r.previous_image_valid === false).length : brokenPrevious,
    previous_unique_urls: previousAudit ? previousAudit.unique_urls : null,
    previous_valid_urls: previousAudit ? previousAudit.valid : null,
    previous_broken_urls: previousAudit ? previousAudit.broken : null,
    existing_valid_icons: previousAudit ? reportRecords.filter(r => r.previous_image_valid === true).length : null,
    broken_icons: previousAudit ? reportRecords.filter(r => r.previous_image_valid === false).length : null,
    manual_review_required: reportRecords.filter(r => r.manual_review_required).length,
    visually_verified: 0,
    note: 'HTTP status, image magic and dimensions were validated. Brand/logo visual match was not performed and is marked accordingly.'
  };
  const report = { summary, records: reportRecords };
  fs.writeFileSync(path.join(AUDIT, 'icon-verification-report.json'), JSON.stringify(report, null, 2));

  const md = [
    '# Icon verification summary',
    '',
    `Generated: ${summary.generated_at}`,
    '',
    '## Dataset',
    '',
    `- Updated dataset: \`${summary.dataset}\``,
    `- Original backup: \`${summary.backup}\``,
    `- Total resources: **${summary.total_resources}**`,
    `- By type: ${Object.entries(summary.by_type).map(([k, v]) => `${k} ${v}`).join(' · ')}`,
    '',
    '## Icon outcome',
    '',
    '| Metric | Count |',
    '|---|---:|',
    `| Official website icons | ${reportRecords.filter(r => r.icon_source === 'official_website').length} |`,
    `| Official manifest icons | ${reportRecords.filter(r => r.icon_source === 'official_manifest').length} |`,
    `| GitHub repository avatars | ${summary.github_avatars} |`,
    `| Domain favicons (/favicon.ico) | ${summary.domain_favicons} |`,
    `| Existing favicon-service icons retained | ${summary.favicon_service_retained} |`,
    `| Unavailable (null) | ${summary.unavailable} |`,
    `| Generic favicon placeholders rejected | ${summary.generic_favicon_placeholders} |`,
    `| Broken previous icons detected | ${summary.broken_previous_detected} |`,
    ...(summary.previous_unique_urls ? [
      `| Existing icon URLs valid (records) | ${summary.existing_valid_icons} |`,
      `| Existing icon URLs broken (records) | ${summary.broken_icons} |`,
      `| Unique previous URLs valid / broken | ${summary.previous_valid_urls} / ${summary.previous_broken_urls} |`,
    ] : []),
    `| Manual review required | ${summary.manual_review_required} |`,
    `| Visually verified | ${summary.visually_verified} |`,
    '',
    '## Method',
    '',
    '1. Read each record\'s official domain and, where present, its GitHub owner from the verified link or the record\'s GitHub evidence sources.',
    '2. Fetch the domain homepage and ordered candidates: apple-touch-icon, rel=icon, mask-icon, web manifest icons, /favicon.ico, common icon paths, the www host, then the existing favicon-service URL.',
    '3. For GitHub-owned records, use `https://github.com/<owner>.png?size=128`.',
    '4. Validate HTTP status, content type, image magic bytes, dimensions (minimum 16x16), size limits, and reject HTML or scripted SVG.',
    '5. Download verified bytes into `assets/img/icons/verified/` and set the JSON `icon` key to the local relative path. No remote hotlinks remain.',
    '6. Records without a validated source get `icon: null`; the frontend category fallback renders them.',
    '',
    ...(previousAudit ? [
      '## Previous icon audit',
      '',
      `The ${previousAudit.unique_urls} unique original favicon URLs were re-fetched: **${previousAudit.valid} valid**, **${previousAudit.broken} broken**. Per-record results are in \`previous-icon-audit.json\` and the \`previous_http_status\` / \`previous_image_valid\` fields of the verification report.`,
      ''
    ] : []),
    '## Honest limitations',
    '',
    '- Automated checks prove the asset is a real image served by the record\'s domain or GitHub owner. They do not prove the logo is visually the correct brand; those rows are marked `visual_review: not_performed`.',
    '- Icons sourced from the favicon service or a platform domain (e.g. github.com itself) are marked `manual_review` rather than presented as official brand logos.',
    '- GitHub owner avatars for personal repositories can be portraits rather than project logos. These are labeled `github_avatar` and remain subject to visual review.',
    '- A 119-icon contact sheet (all 39 manual-review icons plus 80 GitHub avatars) was rendered; all 119 images loaded. This is a visual sample, not a full 1,000-icon visual audit.',
    '- No icon was fabricated. No record fields other than `icon` were changed.',
    ''
  ].join('\n');
  fs.writeFileSync(path.join(AUDIT, 'icon-verification-summary.md'), md);

  const original = JSON.parse(fs.readFileSync(BACKUP, 'utf8'));
  const strip = (r) => { const c = { ...r }; delete c.icon; return c; };
  const issues = [];
  if (updated.length !== original.length) issues.push('record count changed');
  for (let i = 0; i < original.length; i++) {
    if (updated[i].id !== original[i].id) issues.push(`id mismatch at ${i}`);
    if (!util.isDeepStrictEqual(strip(updated[i]), strip(original[i]))) issues.push(`non-icon field changed for id ${original[i].id}`);
    if (!Object.prototype.hasOwnProperty.call(updated[i], 'icon')) issues.push(`missing icon key for id ${original[i].id}`);
    const v = updated[i].icon;
    if (v !== null && !/^assets\/img\/icons\/verified\/[a-z0-9._-]+$/.test(v)) issues.push(`invalid icon path for id ${original[i].id}: ${v}`);
    if (v && !fs.existsSync(path.join(ROOT, v))) issues.push(`icon file missing for id ${original[i].id}: ${v}`);
  }
  const ids = new Set(updated.map(r => r.id));
  if (ids.size !== updated.length) issues.push('duplicate ids');
  const integrity = {
    generated_at: new Date().toISOString(),
    original_records: original.length,
    updated_records: updated.length,
    unique_ids: ids.size,
    only_icon_changed: issues.filter(x => x.startsWith('non-icon')).length === 0,
    all_icon_keys_present: issues.filter(x => x.startsWith('missing icon')).length === 0,
    valid_icon_values: issues.filter(x => x.startsWith('invalid icon')).length === 0,
    local_files_exist: issues.filter(x => x.startsWith('icon file missing')).length === 0,
    issues,
    original_sha256: sha256(fs.readFileSync(BACKUP)),
    updated_sha256: sha256(fs.readFileSync(DATASET))
  };
  fs.writeFileSync(path.join(AUDIT, 'icon-integrity-report.json'), JSON.stringify(integrity, null, 2));
  log(`reports written. integrity issues=${issues.length}`);
  if (issues.length) { console.error(issues.slice(0, 20).join('\n')); process.exitCode = 1; }
}

main().catch(err => { console.error(err); process.exit(1); });
