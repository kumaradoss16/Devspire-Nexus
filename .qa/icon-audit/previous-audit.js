#!/usr/bin/env node
/* Validate the original favicon URLs so the verification report can distinguish
   existing-valid from broken icons. Resumable; writes previous-icon-audit.json. */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const AUDIT = path.join(ROOT, '.qa', 'icon-audit');
const BACKUP = path.join(AUDIT, 'backup', 'ai-resources-1000.original.json');
const CACHE = path.join(AUDIT, 'cache', 'previous-state.json');
const OUT = path.join(AUDIT, 'previous-icon-audit.json');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const CONCURRENCY = 8;
const TIMEOUT = 8000;

const records = JSON.parse(fs.readFileSync(BACKUP, 'utf8'));
const urls = [...new Set(records.map(r => r.icon).filter(u => typeof u === 'string' && /^https?:\/\//.test(u)))];
let state = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function sniff(buf) {
  if (buf.length >= 24 && buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { ext: 'png', width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: 'jpg', width: 0, height: 0 };
  if (buf.slice(0, 6).toString('ascii') === 'GIF87a' || buf.slice(0, 6).toString('ascii') === 'GIF89a') {
    return { ext: 'gif', width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  }
  if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return { ext: 'webp', width: 0, height: 0 };
  if (buf[0] === 0 && buf[1] === 0 && buf[2] === 1 && buf[3] === 0) {
    return { ext: 'ico', width: buf.length >= 8 ? (buf[6] || 256) : 0, height: buf.length >= 8 ? (buf[7] || 256) : 0 };
  }
  if (/<svg[\s>]/i.test(buf.slice(0, 2048).toString('utf8'))) return { ext: 'svg', width: 0, height: 0 };
  return null;
}
async function check(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: controller.signal, headers: { 'user-agent': UA, accept: 'image/*,*/*;q=0.5' } });
    const buf = Buffer.from(await res.arrayBuffer());
    const img = res.ok ? sniff(buf) : null;
    const valid = res.ok && !!img && buf.length > 0 && !/text\/html/i.test(res.headers.get('content-type') || '');
    return {
      url,
      status: res.status,
      content_type: res.headers.get('content-type') || '',
      bytes: buf.length,
      image_valid: valid,
      width: img ? img.width : null,
      height: img ? img.height : null,
      sha256: buf.length ? sha256(buf) : null,
      error: valid ? null : (res.ok ? 'not an image' : 'HTTP ' + res.status),
      checked_at: new Date().toISOString()
    };
  } catch (err) {
    return { url, status: 0, content_type: '', bytes: 0, image_valid: false, width: null, height: null, sha256: null, error: err.name === 'AbortError' ? 'timeout' : err.message, checked_at: new Date().toISOString() };
  } finally {
    clearTimeout(timer);
  }
}

let active = 0;
const queue = [];
function pump() {
  while (active < CONCURRENCY && queue.length) {
    const job = queue.shift();
    active++;
    job.fn().then(job.resolve, job.reject).finally(() => { active--; setTimeout(pump, 50); });
  }
}
function limit(fn) { return new Promise((resolve, reject) => { queue.push({ fn, resolve, reject }); pump(); }); }

(async () => {
  const pending = urls.filter(u => !state[u]);
  console.log(`previous icons: unique=${urls.length} cached=${urls.length - pending.length} pending=${pending.length}`);
  let done = 0;
  await Promise.all(pending.map(url => limit(async () => {
    state[url] = await check(url);
    done++;
    if (done % 25 === 0) {
      fs.writeFileSync(CACHE, JSON.stringify(state, null, 2));
      console.log(`progress ${done}/${pending.length}`);
    }
  })));
  fs.writeFileSync(CACHE, JSON.stringify(state, null, 2));
  const results = urls.map(u => state[u]);
  const valid = results.filter(r => r.image_valid);
  const broken = results.filter(r => !r.image_valid);
  const report = {
    generated_at: new Date().toISOString(),
    unique_urls: urls.length,
    valid: valid.length,
    broken: broken.length,
    status_counts: results.reduce((a, r) => { const k = String(r.status || 'error'); a[k] = (a[k] || 0) + 1; return a; }, {}),
    broken_urls: broken.map(r => ({ url: r.url, status: r.status, error: r.error })),
    results
  };
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log(`done valid=${valid.length} broken=${broken.length}`);
})().catch(err => { console.error(err); process.exit(1); });
