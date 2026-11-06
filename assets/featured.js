/* Resources of the Week renderer.
   Reads window.DSH_FEATURED, resolves each stable reference against the
   registries, and renders the homepage section. Rotation is deterministic:
   the same week always yields the same four resources, with no scheduler. */
(() => {
  'use strict';

  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const TYPES = {
    tool: { record: 'AI Tool', registry: 'AI Tools', page: 'ai-tools.html', chip: 'text-secondary' },
    model: { record: 'AI Model', registry: 'AI Models', page: 'models.html', chip: 'text-primary' },
    resource: { record: 'Developer Resource', registry: 'Developer Resources', page: 'developer-resources.html', chip: 'text-[#34D399]' }
  };

  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  const config = () => (window.DSH_FEATURED && typeof window.DSH_FEATURED === 'object' ? window.DSH_FEATURED : null);
  const perWeek = () => {
    const n = Number(config() && config().perWeek);
    return Number.isFinite(n) ? Math.min(5, Math.max(3, Math.round(n))) : 4;
  };

  const parseDay = (value) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!match) return null;
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  };

  const monday = (date) => {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return d;
  };

  const keyOf = (date) => date.toISOString().slice(0, 10);

  const weekInfo = (date = new Date()) => {
    const start = monday(date);
    const end = new Date(start.getTime() + 6 * 864e5);
    const s = { y: start.getUTCFullYear(), m: start.getUTCMonth(), d: start.getUTCDate() };
    const e = { y: end.getUTCFullYear(), m: end.getUTCMonth(), d: end.getUTCDate() };
    let label;
    if (s.y === e.y && s.m === e.m) label = `Week of ${MONTHS[s.m]} ${s.d} – ${e.d}, ${e.y}`;
    else if (s.y === e.y) label = `Week of ${MONTHS[s.m]} ${s.d} – ${MONTHS[e.m]} ${e.d}, ${e.y}`;
    else label = `Week of ${MONTHS[s.m]} ${s.d}, ${s.y} – ${MONTHS[e.m]} ${e.d}, ${e.y}`;
    return { key: keyOf(start), start, end, label };
  };

  const registry = (type) => {
    if (type === 'tool') return Array.isArray(window.AI_TOOLS) ? window.AI_TOOLS : null;
    if (type === 'model') return Array.isArray(window.AI_MODELS) ? window.AI_MODELS : null;
    if (type === 'resource') return Array.isArray(window.DEVELOPER_RESOURCES) ? window.DEVELOPER_RESOURCES : null;
    return null;
  };

  const cleanRef = (ref) => {
    if (!ref || !TYPES[ref.type] || typeof ref.id !== 'string' || !ref.id) return null;
    const source = registry(ref.type);
    if (!source || !source.some((r) => r.id === ref.id)) return null;
    return { type: ref.type, id: ref.id };
  };

  const validate = () => {
    const cfg = config();
    const errors = [];
    if (!cfg) errors.push('data/featured-resources.js is missing or invalid.');
    const pool = cfg && Array.isArray(cfg.pool) ? cfg.pool : [];
    if (cfg && !pool.length) errors.push('The curated pool is empty.');
    const seen = new Set();
    const valid = [];
    pool.forEach((ref, index) => {
      const clean = cleanRef(ref);
      if (!clean) {
        errors.push(`Pool entry ${index + 1} does not resolve to a catalog record.`);
        return;
      }
      const key = `${clean.type}:${clean.id}`;
      if (seen.has(key)) {
        errors.push(`Duplicate pool entry ${key}.`);
        return;
      }
      seen.add(key);
      valid.push(clean);
    });
    const overrides = cfg && cfg.overrides && typeof cfg.overrides === 'object' ? cfg.overrides : {};
    for (const [key, refs] of Object.entries(overrides)) {
      if (!Array.isArray(refs)) { errors.push(`Override ${key} must be an array.`); continue; }
      const local = new Set();
      for (const ref of refs) {
        const clean = cleanRef(ref);
        if (!clean) { errors.push(`Override ${key} contains an unresolved reference.`); continue; }
        const refKey = `${clean.type}:${clean.id}`;
        if (local.has(refKey)) errors.push(`Override ${key} repeats ${refKey}.`);
        local.add(refKey);
      }
    }
    if (errors.length) errors.forEach((message) => console.warn('[featured]', message));
    return { ok: errors.length === 0, errors, pool: valid, overrides };
  };

  const rotate = (pool, info, withOverrides) => {
    const cfg = config();
    const count = perWeek();
    const epoch = parseDay(cfg && cfg.epoch) || new Date(Date.UTC(2026, 0, 5));
    const base = monday(epoch);
    const weeks = Math.floor((info.start.getTime() - base.getTime()) / WEEK_MS);
    const offset = ((weeks * count) % pool.length + pool.length) % pool.length;
    const picks = [];
    const used = new Set();
    const push = (ref) => {
      const key = `${ref.type}:${ref.id}`;
      if (used.has(key) || picks.length >= count) return;
      used.add(key);
      picks.push(ref);
    };
    const pinned = withOverrides && cfg && cfg.overrides ? cfg.overrides[info.key] : null;
    if (Array.isArray(pinned)) pinned.forEach((ref) => { const clean = cleanRef(ref); if (clean) push(clean); });
    for (let i = 0; i < pool.length && picks.length < count; i += 1) push(pool[(offset + i) % pool.length]);
    return picks;
  };

  const iconHTML = (record, type) => {
    const fallback = window.ResourceIcons
      ? window.ResourceIcons.html(record.category, type, record.name)
      : '<span class="resource-icon-fallback" aria-hidden="true"><span class="material-symbols-outlined text-[20px]">widgets</span></span>';
    if (!record.icon) return fallback;
    return `<img src="${esc(record.icon)}" alt="" width="40" height="40" loading="lazy" decoding="async" class="featured-icon-img" data-featured-icon/>
      <span class="featured-icon-fallback" hidden>${fallback}</span>`;
  };

  const cardHTML = (ref) => {
    const source = registry(ref.type);
    const record = source.find((r) => r.id === ref.id);
    const meta = TYPES[ref.type];
    const href = `${meta.page}#${ref.type}/${encodeURIComponent(record.id)}`;
    const official = record.official_url || '';
    const tags = (record.tags || []).slice(0, 3);
    return `<article class="ui-card rounded-xl p-space-md flex flex-col justify-between" data-featured-ref="${ref.type}:${esc(record.id)}">
      <div>
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex items-center gap-3 min-w-0">
            <span class="featured-icon w-10 h-10 rounded bg-surface-secondary border border-border-subtle flex items-center justify-center shrink-0 overflow-hidden">${iconHTML(record, ref.type)}</span>
            <div class="min-w-0">
              <h3 class="font-title-card text-title-card text-text-primary truncate"><a class="featured-name hover:text-secondary transition-colors" href="${href}">${esc(record.name)}</a></h3>
              <span class="block font-metadata-label text-metadata-label text-text-muted truncate">${esc(meta.record)} · ${esc(record.category || 'Uncategorized')}</span>
            </div>
          </div>
          <span class="inline-flex items-center gap-1.5 font-code-badge text-code-badge px-2 py-0.5 rounded-full bg-surface-secondary border border-border-subtle shrink-0 ${meta.chip}"><span class="w-1.5 h-1.5 rounded-full bg-current"></span>${esc(meta.registry)}</span>
        </div>
        <p class="font-body-compact text-body-compact text-text-muted line-clamp-3 mb-3">${esc(record.description || 'No description in the source record.')}</p>
        ${tags.length ? `<div class="flex flex-wrap gap-1.5 mb-1">${tags.map((tag) => `<span class="font-code-badge text-code-badge bg-surface-secondary border border-border-subtle px-2 py-0.5 rounded text-text-muted">${esc(tag)}</span>`).join('')}</div>` : ''}
      </div>
      <div class="featured-foot pt-3 mt-3 border-t border-border-subtle flex items-center justify-between gap-2">
        ${official ? `<a class="inline-flex items-center gap-1 font-body-compact text-body-compact text-text-muted hover:text-secondary transition-colors min-w-0" href="${esc(official)}" target="_blank" rel="noopener noreferrer"><span class="truncate">Official site</span><span class="material-symbols-outlined text-[14px]" aria-hidden="true">open_in_new</span></a>` : '<span class="font-metadata-label text-metadata-label text-text-muted">Source record</span>'}
        <a class="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-secondary border border-border-subtle hover:border-secondary hover:text-secondary text-text-primary font-body-compact text-body-compact transition-colors shrink-0" href="${href}">Details<span class="material-symbols-outlined text-[14px]" aria-hidden="true">chevron_right</span></a>
      </div>
    </article>`;
  };

  const bindIcons = (root) => {
    root.querySelectorAll('img[data-featured-icon]').forEach((img) => {
      const swap = () => {
        img.hidden = true;
        const fallback = img.parentElement && img.parentElement.querySelector('.featured-icon-fallback');
        if (fallback) fallback.hidden = false;
      };
      if (img.complete && img.naturalWidth === 0) swap();
      else img.addEventListener('error', swap, { once: true });
    });
  };

  const render = (target) => {
    const host = typeof target === 'string' ? document.querySelector(target) : target;
    if (!host) return null;
    const info = weekInfo();
    document.querySelectorAll('[data-featured-week]').forEach((el) => { el.textContent = info.label; });
    const result = validate();
    if (!result.pool.length) {
      host.innerHTML = '<p class="font-body-compact text-body-compact text-text-muted">The weekly selection is unavailable because its configuration did not resolve. Browse the registries below.</p>';
      return { info, refs: [], errors: result.errors };
    }
    const refs = rotate(result.pool, info, true);
    host.innerHTML = refs.map(cardHTML).join('');
    bindIcons(host);
    return { info, refs, errors: result.errors };
  };

  window.FeaturedResources = { weekInfo, validate, select: (date) => {
    const result = validate();
    return result.pool.length ? rotate(result.pool, weekInfo(date), true) : [];
  }, render };
})();
