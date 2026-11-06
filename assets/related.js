/* Shared cross-registry Related Resources engine.
   Reads the compact data/related-index.js file (one row per resource) and
   scores matches from source-provided metadata only: canonical category,
   source category/subtype, provider domain and technical tags.
   No relationship is fabricated when no signal is present. */
(() => {
  'use strict';

  const INDEX = window.RELATED_INDEX || {};
  const TYPE_ORDER = ['tool', 'model', 'resource'];
  const TYPES = {
    tool: { key: 't', label: 'AI Tool', page: 'ai-tools.html', prefix: 'tool' },
    model: { key: 'm', label: 'AI Model', page: 'models.html', prefix: 'model' },
    resource: { key: 'd', label: 'Developer Resource', page: 'developer-resources.html', prefix: 'resource' }
  };

  const rows = [];
  for (const type of TYPE_ORDER) {
    const config = TYPES[type];
    for (const r of INDEX[config.key] || []) {
      rows.push({
        type,
        id: String(r[0]),
        name: r[1] || '',
        cat: r[2] || '',
        sub: r[3] || '',
        provider: r[4] || '',
        icon: r[5] || null,
        desc: r[6] || '',
        tags: Array.isArray(r[7]) ? r[7] : [],
        url: r[8] || ''
      });
    }
  }

  const byKey = new Map(rows.map((r) => [r.type + ':' + r.id, r]));
  const tagFrequency = new Map();
  for (const r of rows) {
    for (const tag of new Set(r.tags)) tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
  }

  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
  const initials = (name) => String(name || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || 'AI';
  const detailHref = (r) => `${TYPES[r.type].page}#${TYPES[r.type].prefix}/${encodeURIComponent(r.id)}`;

  const MATCH_THRESHOLD = 3;
  const candidateCache = new Map();

  /* Specific tags count for more than ubiquitous ones ("LLM", "API"). The
     weight is capped so a single shared tag can never outweigh a category or
     provider match. */
  function tagWeight(tag) {
    const freq = tagFrequency.get(tag) || 1;
    return Math.min(3, Math.log2((rows.length + 1) / (freq + 1)) + 0.6);
  }

  function scoreFor(a, b) {
    if (a.type === b.type && a.id === b.id) return -1;
    let score = 0;
    if (a.cat && a.cat === b.cat) score += 4;
    if (a.sub && a.sub === b.sub) score += 2;
    if (a.provider && a.provider === b.provider) score += 3;
    const bTags = new Set(b.tags);
    let tagScore = 0;
    const shared = [];
    for (const tag of a.tags) {
      if (!bTags.has(tag)) continue;
      shared.push(tag);
      tagScore += tagWeight(tag);
    }
    score += Math.min(tagScore, 6);
    return { score, shared };
  }

  function related(type, id) {
    const key = type + ':' + id;
    if (candidateCache.has(key)) return candidateCache.get(key);
    const source = byKey.get(key);
    if (!source) return { items: [], total: 0 };
    const ranked = [];
    for (const candidate of rows) {
      const result = scoreFor(source, candidate);
      if (result === -1) continue;
      if (result.score < MATCH_THRESHOLD) continue;
      ranked.push({ row: candidate, score: result.score, shared: result.shared });
    }
    ranked.sort((a, b) => (b.score - a.score) || a.row.name.localeCompare(b.row.name));

    /* Diversity: seed one result from each other registry first so the
       section is genuinely cross-registry whenever relevant matches exist. */
    const selected = [];
    const selectedKeys = new Set();
    const perType = { tool: 0, model: 0, resource: 0 };
    const nameSeen = new Set();
    const take = (entry) => {
      const k = entry.row.type + ':' + entry.row.id;
      if (selectedKeys.has(k)) return false;
      const nameKey = entry.row.type + ':' + entry.row.name.toLowerCase();
      if (nameSeen.has(nameKey)) return false;
      selectedKeys.add(k);
      nameSeen.add(nameKey);
      perType[entry.row.type]++;
      selected.push(entry);
      return true;
    };
    for (const otherType of TYPE_ORDER.filter((t) => t !== type)) {
      const best = ranked.find((e) => e.row.type === otherType);
      if (best) take(best);
    }
    for (const entry of ranked) {
      if (selected.length >= 12) break;
      const cap = entry.row.type === type ? 3 : 5;
      if (perType[entry.row.type] >= cap) continue;
      take(entry);
    }
    const result = { items: selected, total: selected.length };
    candidateCache.set(key, result);
    return result;
  }

  function cardHTML(entry, headingLevel) {
    const r = entry.row;
    const meta = TYPES[r.type];
    const tags = r.tags.slice(0, 3);
    const nameTag = headingLevel === 'h2' ? 'h3' : 'h4';
    return `<article class="related-card ui-card rounded-xl" data-related-card="${esc(r.type)}:${esc(r.id)}">
      <div class="related-card-main">
        <div class="related-card-head">
          <div class="related-icon" aria-hidden="true">
            ${r.icon ? `<img src="${esc(r.icon)}" alt="" width="26" height="26" loading="lazy" onerror="this.remove();this.parentElement.querySelector('.related-mono').hidden=false"/>` : ''}
            ${r.icon ? `<span class="related-mono" hidden>${esc(initials(r.name))}</span>` : (window.ResourceIcons ? window.ResourceIcons.html(r.cat, r.type, r.name, { size: 'text-[18px]', initials: false }) : `<span class="related-mono">${esc(initials(r.name))}</span>`)}
          </div>
          <div class="related-identity">
            <span class="related-type related-type--${esc(r.type)}">${esc(meta.label)}</span>
            <${nameTag} class="related-name" title="${esc(r.name)}">${esc(r.name)}</${nameTag}>
            <span class="related-cat" title="${esc(r.cat)}">${esc(r.cat || 'Uncategorized')}</span>
          </div>
        </div>
        <p class="related-desc">${esc(r.desc)}</p>
        ${tags.length ? `<div class="related-tags">${tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
      </div>
      <div class="related-foot">
        <a class="related-link-muted" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${esc(r.name)} official website">Official site <span class="material-symbols-outlined" aria-hidden="true">open_in_new</span></a>
        <a class="related-link" href="${esc(detailHref(r))}">View details <span class="material-symbols-outlined" aria-hidden="true">chevron_right</span></a>
      </div>
    </article>`;
  }

  function gridHTML(items, headingLevel) {
    return items.map((entry) => cardHTML(entry, headingLevel)).join('');
  }

  function panelHTML(type, id, options = {}) {
    const result = related(type, id);
    if (!result.items.length) return '';
    const source = byKey.get(type + ':' + id);
    const limit = Math.min(options.limit || 6, result.items.length);
    const visible = result.items.slice(0, limit);
    const headingLevel = options.headingLevel === 2 ? 'h2' : 'h3';
    const titleId = `related-title-${type}-${String(id).replace(/[^a-z0-9-]/gi, '-')}-${options.variant || 'detail'}`;
    const remaining = result.total - visible.length;
    return `<section class="related-block related-block--${options.variant || 'detail'}" data-related-root data-source-type="${esc(type)}" data-source-id="${esc(id)}" data-visible="${visible.length}" data-total="${result.total}" aria-labelledby="${esc(titleId)}">
      <div class="related-head">
        <div>
          <${headingLevel} class="related-heading" id="${esc(titleId)}">Related Resources</${headingLevel}>
          <p class="related-sub">${source ? `Cross-registry matches for <strong>${esc(source.name)}</strong>` : 'Cross-registry matches'} · ranked by category, provider and shared tags</p>
        </div>
        <span class="related-count">${result.total} matched</span>
      </div>
      <div class="related-grid" data-related-grid>${gridHTML(visible, headingLevel)}</div>
      ${remaining > 0 ? `<div class="related-more-wrap"><button type="button" class="related-more" data-related-more>Show ${Math.min(remaining, 6)} more related resources</button></div>` : ''}
    </section>`;
  }

  function renderInto(container, type, id, options = {}) {
    if (!container) return;
    container.innerHTML = panelHTML(type, id, options);
    container.hidden = !container.innerHTML;
  }

  /* Page-level context section: related to the first resource in the current
     filter result, so it always reflects what the visitor is looking at. */
  function mountPage(container, type, id) {
    if (!container) return;
    if (!id) { container.hidden = true; container.innerHTML = ''; return; }
    renderInto(container, type, id, { limit: 3, headingLevel: 2, variant: 'page' });
  }

  /* "Show more" expands in place, then removes itself once everything is out. */
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-related-more]');
    if (!button) return;
    const root = button.closest('[data-related-root]');
    if (!root) return;
    const type = root.dataset.sourceType;
    const id = root.dataset.sourceId;
    const result = related(type, id);
    const grid = root.querySelector('[data-related-grid]');
    if (!grid) return;
    const step = 6;
    const current = parseInt(root.dataset.visible || '0', 10);
    const next = Math.min(current + step, result.total);
    grid.innerHTML = gridHTML(result.items.slice(0, next), root.querySelector('.related-heading').tagName.toLowerCase());
    root.dataset.visible = String(next);
    if (next >= result.total) button.closest('.related-more-wrap').remove();
    else button.textContent = `Show ${Math.min(step, result.total - next)} more related resources`;
  });

  window.RelatedResources = { related, panelHTML, renderInto, mountPage, count: rows.length };
})();
