(() => {
  'use strict';

  const DATA = Array.isArray(window.DEVELOPER_RESOURCES) ? window.DEVELOPER_RESOURCES : [];
  const META = window.DEVELOPER_RESOURCES_META || {};
  const PAGE_SIZE = 9;
  const ALL = 'All Resources';
  const CATEGORY_ORDER = Array.isArray(META.category_order) && META.category_order.length
    ? META.category_order
    : [...new Set(DATA.map((r) => r.category))];
  const CATEGORIES = CATEGORY_ORDER.filter((c) => DATA.some((r) => r.category === c));

  const TYPE_ORDER = ['Framework', 'Framework / SDK / Library', 'SDK / Library', 'Inference Engine', 'Database / Index', 'Platform / Service', 'Desktop App / Runtime', 'Developer Resource'];
  const LANG_ORDER = ['Python', 'JavaScript', 'TypeScript', 'C++', '.NET', 'Rust', 'Go', 'Java', 'Kotlin', 'Swift', 'Elixir', 'Ruby', 'PHP', 'Scala', 'Julia', 'SQL'];
  const PRICING_ORDER = ['Open Source', 'Free', 'Free / Self-Hosted', 'Free Tier', 'Freemium', 'Usage-Based', 'Paid', 'Open Weights'];
  const LICENSE_GROUPS = ['Open Source', 'Proprietary / Managed', 'Not stated'];
  const countBy = (arr) => {
    const m = new Map();
    for (const v of arr) m.set(v, (m.get(v) || 0) + 1);
    return m;
  };
  const TYPE_COUNTS = countBy(DATA.map((r) => r.resource_type));
  const LANG_COUNTS = countBy(DATA.flatMap((r) => r.programming_languages || []));
  const FACETS = {
    type: { values: TYPE_ORDER.filter((v) => TYPE_COUNTS.has(v)) },
    language: { values: LANG_ORDER.filter((v) => LANG_COUNTS.has(v)) },
    deployment: { values: ['Self-Hostable', 'Partial Support', 'Managed Cloud'] },
    licensing: { values: LICENSE_GROUPS },
    pricing: { values: PRICING_ORDER.filter((p) => DATA.some((r) => r.pricing === p)) }
  };

  const state = {
    query: '',
    category: ALL,
    facets: {
      type: new Set(),
      language: new Set(),
      deployment: new Set(),
      licensing: new Set(),
      pricing: new Set()
    },
    sort: 'verified',
    page: 1
  };

  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  const domainOf = (url) => {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
  };

  const licenseGroup = (r) => {
    if (r.open_source) return 'Open Source';
    return r.license ? 'Proprietary / Managed' : 'Not stated';
  };
  const deployGroup = (r) => (r.local_execution === 'Partial' ? 'Partial Support' : r.self_hostable ? 'Self-Hostable' : 'Managed Cloud');

  const facetValueMatch = (r, key, value) => {
    if (key === 'type') return r.resource_type === value;
    if (key === 'language') return (r.programming_languages || []).includes(value);
    if (key === 'deployment') return deployGroup(r) === value;
    if (key === 'licensing') return licenseGroup(r) === value;
    if (key === 'pricing') return r.pricing === value;
    return false;
  };

  const searchHay = (r) => [
    r.name, r.description, r.category, r.resource_type, r.resource_subtype,
    r.license, r.pricing, r.official_url, domainOf(r.official_url),
    ...(r.programming_languages || []), ...(r.tags || [])
  ].join(' ').toLowerCase();

  const matchesQuery = (r) => {
    if (!state.query) return true;
    const hay = searchHay(r);
    return state.query.toLowerCase().split(/\s+/).every((word) => hay.includes(word));
  };
  const matchesCategory = (r) => state.category === ALL || r.category === state.category;
  const matchesFacets = (r) => {
    for (const [key, set] of Object.entries(state.facets)) {
      if (set.size === 0) continue;
      if (![...set].some((value) => facetValueMatch(r, key, value))) return false;
    }
    return true;
  };

  const catIndex = (r) => {
    const i = CATEGORY_ORDER.indexOf(r.category);
    return i === -1 ? CATEGORY_ORDER.length : i;
  };
  const sortList = (list) => {
    const arr = [...list];
    if (state.sort === 'name') arr.sort((a, b) => a.name.localeCompare(b.name));
    else if (state.sort === 'name-desc') arr.sort((a, b) => b.name.localeCompare(a.name));
    else if (state.sort === 'category') arr.sort((a, b) => (catIndex(a) - catIndex(b)) || a.name.localeCompare(b.name));
    else if (state.sort === 'new') arr.sort((a, b) => (b.verified === '2026-11-04' ? 1 : 0) - (a.verified === '2026-11-04' ? 1 : 0) || String(b.verified).localeCompare(String(a.verified)) || a.name.localeCompare(b.name));
    else arr.sort((a, b) => String(b.verified).localeCompare(String(a.verified)) || a.name.localeCompare(b.name));
    return arr;
  };

  const monogram = (r) => r.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || 'DR';

  const tileContent = (r) => {
    const mono = esc(monogram(r));
    if (!r.icon) {
      if (window.ResourceIcons) return window.ResourceIcons.html(r.category, 'resource', r.name);
      return `<span class="font-code-badge text-code-badge text-text-primary">${mono}</span>`;
    }
    return `<img class="tool-favicon" src="${esc(r.icon)}" alt="" width="22" height="22" loading="lazy" onerror="this.outerHTML='${mono}'"/>`;
  };

  const licenseChip = (r) => {
    if (r.license_short) {
      const tone = r.open_source ? 'text-tertiary border-tertiary/25' : 'text-status-warning border-status-warning/30';
      return `<span class="shrink-0 font-code-badge text-code-badge ${tone} bg-surface-secondary border px-2 py-0.5 rounded" title="${esc(r.license)}">${esc(r.license_short)}</span>`;
    }
    return `<span class="shrink-0 font-code-badge text-code-badge text-secondary bg-surface-secondary border border-border-subtle px-2 py-0.5 rounded">${esc(r.pricing)}</span>`;
  };

  const cardHTML = (r) => `
    <article class="ui-card rounded-xl p-space-md flex flex-col justify-between group" data-resource-id="${esc(r.id)}">
      <div>
        <div class="flex items-start justify-between gap-2 mb-space-sm">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-lg bg-surface-secondary border border-border-subtle flex items-center justify-center shrink-0">${tileContent(r)}</div>
            <div class="min-w-0">
              <span class="flex items-center gap-1.5 font-metadata-label text-metadata-label text-text-muted">
                <span class="w-1.5 h-1.5 rounded-full bg-tertiary shrink-0" title="Verified ${esc(r.verified)}"></span>
                <span class="truncate">${esc(r.category)}</span>
              </span>
              <div class="flex items-center gap-1.5">
                <h2 class="font-title-card text-title-card text-text-primary truncate">${esc(r.name)}</h2>
                <span class="material-symbols-outlined text-tertiary text-base shrink-0" title="Verified ${esc(r.verified)}">verified</span>
              </div>
            </div>
          </div>
          ${licenseChip(r)}
        </div>
        <div class="flex flex-wrap items-center gap-1.5 mb-2">
          ${window.ResourceStatus ? window.ResourceStatus.statusBadgesHTML(r) : ''}
        </div>
        <p class="font-body-compact text-body-compact text-text-muted mb-space-sm line-clamp-3">${esc(r.description)}</p>
        <div class="flex flex-wrap gap-1.5 mb-space-md">
          ${(r.tags || []).slice(0, 4).map((t) => `<span class="font-code-badge text-code-badge text-text-muted bg-surface-secondary border border-border-subtle px-2 py-0.5 rounded">${esc(t)}</span>`).join('')}
        </div>
      </div>
      <div class="pt-space-sm border-t border-border-subtle flex items-center justify-between gap-2">
        <div class="flex items-center gap-1">
          ${r.repository_url ? `<a class="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors" href="${esc(r.repository_url)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${esc(r.name)} repository" title="Repository"><span class="material-symbols-outlined text-[18px]" data-icon="code">code</span></a>` : ''}
          ${r.documentation_url ? `<a class="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors" href="${esc(r.documentation_url)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${esc(r.name)} documentation" title="Documentation"><span class="material-symbols-outlined text-[18px]" data-icon="description">description</span></a>` : ''}
          <a class="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors" href="${esc(r.official_url)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${esc(r.name)} official website" title="Official website"><span class="material-symbols-outlined text-[18px]" data-icon="open_in_new">open_in_new</span></a>
          <button type="button" class="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors" data-share="resource:${esc(r.id)}" aria-label="Share ${esc(r.name)}" title="Share Resource">
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">share</span>
          </button>
          ${window.DevSpireCollections ? window.DevSpireCollections.buttonHTML('resource', r.id, r.name, 'p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors') : ''}
        </div>
        <button class="text-body-compact font-body-compact text-primary hover:underline flex items-center gap-1 shrink-0" type="button" data-details="${esc(r.id)}">
          View details <span class="material-symbols-outlined text-sm" data-icon="chevron_right">chevron_right</span>
        </button>
      </div>
    </article>`;

  const $ = (id) => document.getElementById(id);
  const grid = $('resource-grid');
  const emptyState = $('empty-state');
  const noDataState = $('no-data-state');
  const invalidState = $('invalid-state');
  const invalidMessage = $('invalid-message');
  const paginationBar = $('pagination-bar');
  const paginationControls = $('pagination-controls');
  const pageIndicator = $('page-indicator');
  const resultsCount = $('results-count');
  const searchInput = $('dev-search');
  const clearBtn = $('search-clear');
  const pillsWrap = $('category-pills');
  const chipsWrap = $('active-chips');
  const noFiltersNote = $('no-filters-note');
  const resetAllBtn = $('reset-all-filters');
  const sortSelect = $('sort-select');
  const facetsPanel = $('facets-panel');
  const facetsToggle = $('facets-toggle');
  const facetsCount = $('facets-count');
  const detailModal = $('detail-modal');
  const detailContent = $('detail-content');

  /* ----- Category pills ----- */
  function renderPills() {
    pillsWrap.innerHTML = '';
    const mk = (label, count, value) => {
      const active = state.category === value;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `pill font-code-badge text-code-badge px-3 py-1.5 rounded shrink-0 border flex items-center gap-1.5 ${
        active ? 'border-primary-container' : 'bg-surface-secondary text-text-muted border-border-subtle hover:text-text-primary hover:border-secondary'
      }`;
      b.dataset.category = value;
      b.setAttribute('aria-pressed', String(active));
      b.innerHTML = `${esc(label)} <span class="text-[11px] px-1.5 py-0.5 rounded bg-surface-card border border-border-subtle ${active ? 'text-bg-canvas border-transparent bg-bg-canvas/20' : 'text-text-muted'}">${count}</span>`;
      pillsWrap.appendChild(b);
    };
    mk(ALL, DATA.length, ALL);
    CATEGORIES.forEach((c) => mk(c, DATA.filter((r) => r.category === c).length, c));
  }

  pillsWrap.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-category]');
    if (!btn) return;
    state.category = btn.dataset.category;
    state.page = 1;
    renderPills();
    apply();
  });

  /* ----- Quick-start cards ----- */
  function syncQuickCounts() {
    document.querySelectorAll('[data-quick-count]').forEach((el) => {
      const kind = el.dataset.quickCount;
      let n = 0;
      if (kind === 'local') n = DATA.filter((r) => r.category === 'Local Runtimes').length;
      else if (kind === 'serving') n = DATA.filter((r) => r.category === 'Model Serving & Inference').length;
      else if (kind === 'mcp') n = DATA.filter((r) => searchHay(r).includes('mcp')).length;
      el.textContent = n;
    });
  }

  document.querySelectorAll('[data-quick]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const kind = btn.dataset.quick;
      resetAll();
      if (kind === 'local') state.category = 'Local Runtimes';
      else if (kind === 'serving') state.category = 'Model Serving & Inference';
      else if (kind === 'mcp') {
        state.query = 'mcp';
        searchInput.value = 'mcp';
        syncClearBtn();
      }
      state.page = 1;
      renderPills();
      renderFacets();
      apply();
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ----- Facets ----- */
  function facetValueCount(key, value) {
    return DATA.filter((r) => facetValueMatch(r, key, value)).length;
  }

  function renderFacets() {
    Object.entries(FACETS).forEach(([key, facet]) => {
      const group = document.querySelector(`[data-facet-group="${key}"]`);
      if (!group) return;
      group.querySelectorAll('.facet-row').forEach((row) => row.remove());
      facet.values.forEach((value) => {
        const count = facetValueCount(key, value);
        if (count === 0) return;
        const checked = state.facets[key].has(value);
        const row = document.createElement('label');
        row.className = 'facet-row flex items-center justify-between gap-2 text-body-compact font-body-compact cursor-pointer select-none ' +
          (checked ? 'text-text-primary' : 'text-text-muted hover:text-text-primary');
        row.innerHTML = `
          <span class="flex items-center gap-2 min-w-0">
            <input type="checkbox" class="facet-input" data-facet="${key}" data-value="${esc(value)}" ${checked ? 'checked' : ''}/>
            <span class="truncate">${esc(value)}</span>
          </span>
          <span class="font-code-badge text-code-badge text-text-muted shrink-0">${count}</span>`;
        group.appendChild(row);
      });
    });
    facetsCount.textContent = Object.values(state.facets).reduce((n, s) => n + s.size, 0);
  }

  facetsPanel.addEventListener('change', (e) => {
    const input = e.target.closest('.facet-input');
    if (!input) return;
    const set = state.facets[input.dataset.facet];
    if (input.checked) set.add(input.dataset.value); else set.delete(input.dataset.value);
    state.page = 1;
    renderFacets();
    apply();
  });

  function resetFacets() {
    Object.values(state.facets).forEach((s) => s.clear());
    state.page = 1;
    renderFacets();
    apply();
  }
  $('reset-facets').addEventListener('click', resetFacets);

  /* ----- Active chips ----- */
  function renderChips() {
    chipsWrap.querySelectorAll('.chip').forEach((c) => c.remove());
    const chips = [];
    if (state.category !== ALL) chips.push({ kind: 'category', label: `Category: ${state.category}` });
    if (state.query) chips.push({ kind: 'query', label: `Search: "${state.query}"` });
    Object.entries(state.facets).forEach(([key, set]) => {
      set.forEach((v) => chips.push({ kind: 'facet', facet: key, value: v, label: v }));
    });

    noFiltersNote.hidden = chips.length > 0;
    resetAllBtn.hidden = chips.length === 0;

    chips.forEach((chip) => {
      const el = document.createElement('span');
      el.className = 'chip inline-flex items-center gap-1 bg-surface-card border border-border-subtle px-2 py-0.5 rounded text-code-badge font-code-badge text-text-primary';
      el.innerHTML = `${esc(chip.label)}<button class="text-text-muted hover:text-text-primary" type="button" aria-label="Remove filter ${esc(chip.label)}"><span class="material-symbols-outlined text-xs" data-icon="close">close</span></button>`;
      el.querySelector('button').addEventListener('click', () => {
        if (chip.kind === 'category') state.category = ALL;
        else if (chip.kind === 'query') { state.query = ''; searchInput.value = ''; syncClearBtn(); }
        else if (chip.kind === 'facet') state.facets[chip.facet].delete(chip.value);
        state.page = 1;
        renderPills(); renderFacets(); apply();
      });
      chipsWrap.insertBefore(el, resetAllBtn);
    });
  }

  /* ----- Pagination ----- */
  function renderPagination(totalPages) {
    const mkBtn = (label, page, opts = {}) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `page-btn flex items-center justify-center w-8 h-8 rounded font-code-badge text-code-badge border ${
        opts.active ? 'is-active border-primary-container' : 'bg-surface-secondary border-border-subtle text-text-muted'
      }`;
      b.innerHTML = label;
      if (opts.disabled) b.disabled = true;
      if (opts.active) b.setAttribute('aria-current', 'page');
      if (page !== null && !opts.disabled) {
        b.addEventListener('click', () => { state.page = page; apply(); });
      }
      return b;
    };

    paginationControls.innerHTML = '';
    paginationControls.appendChild(mkBtn('<span class="material-symbols-outlined text-sm">chevron_left</span>', state.page - 1, { disabled: state.page === 1 }));

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - state.page) <= 1) pages.push(i);
      else if (pages[pages.length - 1] !== '…') pages.push('…');
    }
    pages.forEach((p) => {
      if (p === '…') {
        const s = document.createElement('span');
        s.className = 'text-text-muted px-1 font-code-badge';
        s.textContent = '...';
        paginationControls.appendChild(s);
      } else {
        paginationControls.appendChild(mkBtn(String(p), p, { active: p === state.page }));
      }
    });

    paginationControls.appendChild(mkBtn('<span class="material-symbols-outlined text-sm">chevron_right</span>', state.page + 1, { disabled: state.page === totalPages }));
  }

  /* ----- Apply ----- */
  function apply() {
    if (DATA.length === 0) return;
    const filtered = sortList(DATA.filter((r) => matchesQuery(r) && matchesCategory(r) && matchesFacets(r)));
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    state.page = Math.min(Math.max(1, state.page), totalPages);
    const start = (state.page - 1) * PAGE_SIZE;
    const slice = filtered.slice(start, start + PAGE_SIZE);

    grid.hidden = filtered.length === 0;
    emptyState.hidden = filtered.length > 0;
    paginationBar.hidden = filtered.length === 0;
    grid.innerHTML = slice.map(cardHTML).join('');

    const from = filtered.length === 0 ? 0 : start + 1;
    const to = Math.min(start + PAGE_SIZE, filtered.length);
    resultsCount.innerHTML = `Showing <span class="text-text-primary font-medium">${from}–${to}</span> of <span class="text-text-primary font-medium">${filtered.length}</span> resources matching filters`;
    pageIndicator.innerHTML = `Page <span class="text-text-primary font-medium">${state.page}</span> of <span class="text-text-primary font-medium">${totalPages}</span>`;
    renderPagination(totalPages);
    renderChips();
    syncQuickCounts();
    if (window.RelatedResources) {
      window.RelatedResources.mountPage($('related-page'), 'resource', filtered.length ? filtered[0].id : null);
    }
  }

  function resetAll() {
    state.query = '';
    searchInput.value = '';
    syncClearBtn();
    state.category = ALL;
    state.page = 1;
    Object.values(state.facets).forEach((s) => s.clear());
    renderPills();
    renderFacets();
    apply();
  }
  resetAllBtn.addEventListener('click', resetAll);
  $('empty-reset').addEventListener('click', resetAll);

  /* ----- Search ----- */
  function syncClearBtn() {
    clearBtn.style.visibility = searchInput.value ? 'visible' : 'hidden';
  }
  let debounce;
  searchInput.addEventListener('input', () => {
    syncClearBtn();
    clearTimeout(debounce);
    debounce = setTimeout(() => { state.query = searchInput.value.trim(); state.page = 1; apply(); }, 180);
  });
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.query = '';
    syncClearBtn();
    state.page = 1;
    apply();
    searchInput.focus();
  });
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });
  const quickFind = $('quick-find');
  if (quickFind) {
    quickFind.addEventListener('input', (e) => {
      searchInput.value = e.target.value;
      state.query = e.target.value.trim();
      state.page = 1;
      syncClearBtn();
      apply();
    });
  }
  sortSelect.addEventListener('change', () => { state.sort = sortSelect.value; state.page = 1; apply(); });

  /* ----- Detail modal + deep links ----- */
  const field = (label, value) => `<div><dt class="font-metadata-label text-metadata-label text-text-muted uppercase tracking-wider">${esc(label)}</dt><dd class="font-body-compact text-body-compact text-text-primary break-words">${value}</dd></div>`;
  const linkOrDash = (url, text) => url
    ? `<a class="text-secondary hover:underline inline-flex items-center gap-1" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(text)}<span class="material-symbols-outlined text-sm" data-icon="open_in_new">open_in_new</span></a>`
    : '<span class="text-text-muted">Not listed in source</span>';

  function openDetail(id, options = {}) {
    const r = DATA.find((x) => x.id === id);
    if (!r) {
      showInvalid(id);
      return;
    }
    invalidState.hidden = true;
    const langs = (r.programming_languages || []).length ? r.programming_languages.map(esc).join(', ') : '<span class="text-text-muted">Not specified in source</span>';
    const tags = (r.tags || []).length
      ? `<div class="mb-space-md">
          <span class="font-metadata-label text-metadata-label text-text-muted uppercase tracking-wider block mb-1.5">Technical Tags</span>
          <div class="flex flex-wrap gap-1.5">${r.tags.map((x) => `<span class="bg-surface-secondary border border-border-subtle font-code-badge text-code-badge text-text-muted px-2 py-0.5 rounded">${esc(x)}</span>`).join('')}</div>
        </div>`
      : '';

    detailContent.innerHTML = `
      <div class="flex items-center gap-3 mb-space-sm pr-8">
        <div class="w-12 h-12 rounded-lg bg-surface-secondary border border-border-subtle flex items-center justify-center shrink-0">${tileContent(r)}</div>
        <div class="min-w-0">
          <span class="flex items-center gap-1.5 font-metadata-label text-metadata-label text-text-muted">
            <span class="w-1.5 h-1.5 rounded-full bg-tertiary shrink-0"></span>${esc(r.resource_type)}
          </span>
          <h2 class="font-headline-section text-headline-section text-text-primary tracking-tight flex items-center gap-1.5" id="detail-title">
            <span class="truncate">${esc(r.name)}</span>
            <span class="material-symbols-outlined text-tertiary text-lg shrink-0" title="Verified ${esc(r.verified)}">verified</span>
          </h2>
        </div>
      </div>
      <p class="font-body-compact text-body-compact text-text-muted mb-space-md">${esc(r.description)}</p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-1.5 mb-space-md">
        <div class="bg-surface-secondary border border-border-subtle rounded px-2 py-1 min-w-0"><span class="block font-metadata-label text-metadata-label text-text-muted">License</span><span class="block font-code-param text-code-param truncate text-text-primary" title="${esc(r.license || 'Not stated')}">${esc(r.license_short || '—')}</span></div>
        <div class="bg-surface-secondary border border-border-subtle rounded px-2 py-1 min-w-0"><span class="block font-metadata-label text-metadata-label text-text-muted">Pricing</span><span class="block font-code-param text-code-param truncate text-text-primary" title="${esc(r.pricing)}">${esc(r.pricing)}</span></div>
        <div class="bg-surface-secondary border border-border-subtle rounded px-2 py-1 min-w-0"><span class="block font-metadata-label text-metadata-label text-text-muted">Deployment</span><span class="block font-code-param text-code-param truncate text-text-primary">${esc(deployGroup(r))}</span></div>
        <div class="bg-surface-secondary border border-border-subtle rounded px-2 py-1 min-w-0"><span class="block font-metadata-label text-metadata-label text-text-muted">Signup</span><span class="block font-code-param text-code-param truncate text-text-primary">${r.signup_required ? 'Required' : 'Not required'}</span></div>
      </div>
      <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-space-md">
        ${field('Category', esc(r.category))}
        ${field('Resource Type', esc(r.resource_type))}
        ${field('Resource Subtype', esc(r.resource_subtype))}
        ${field('Official Website', linkOrDash(r.official_url, domainOf(r.official_url)))}
        ${field('Documentation', linkOrDash(r.documentation_url, r.documentation_url ? 'Open documentation' : ''))}
        ${field('Repository', linkOrDash(r.repository_url, r.repository_url ? 'Open repository' : ''))}
        ${field('Programming Languages', langs)}
        ${field('License', r.license ? esc(r.license) : '<span class="text-text-muted">Not stated in source</span>')}
        ${field('Pricing', esc(r.pricing))}
        ${field('Open Source', r.open_source ? 'Yes' : 'No')}
        ${field('Self-Hostable', r.self_hostable ? 'Yes' : 'No')}
        ${field('Signup Required', r.signup_required ? 'Yes' : 'No')}
        ${field('Last Verified', `<span class="font-code-param text-code-param">${esc(r.verified)}</span>`)}
      </dl>
      ${r.notes ? `<div class="mb-space-md"><span class="font-metadata-label text-metadata-label text-text-muted uppercase tracking-wider block mb-1.5">Notes</span><p class="font-body-compact text-body-compact text-text-muted">${esc(r.notes)}</p></div>` : ''}
      ${tags}
      <div class="mb-space-md">
        <span class="font-metadata-label text-metadata-label text-text-muted uppercase tracking-wider block mb-1.5">Evidence Sources</span>
        <ul class="flex flex-col gap-1">
          ${(r.evidence || []).map(([label, url]) => `<li><a class="font-body-compact text-body-compact text-secondary hover:underline inline-flex items-center gap-1" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}<span class="material-symbols-outlined text-sm" data-icon="open_in_new">open_in_new</span></a></li>`).join('')}
        </ul>
      </div>
      <div data-related-detail></div>
      <div class="flex flex-wrap items-center gap-2 pt-space-sm border-t border-border-subtle">
        <a class="inline-flex items-center gap-2 bg-primary-container text-bg-canvas font-body-compact text-body-compact font-semibold px-4 py-2 rounded btn-amber" href="${esc(r.official_url)}" target="_blank" rel="noopener noreferrer">Visit official site <span class="material-symbols-outlined text-base" data-icon="open_in_new">open_in_new</span></a>
        ${r.documentation_url ? `<a class="inline-flex items-center gap-2 bg-surface-secondary border border-border-subtle text-text-primary font-body-compact text-body-compact px-3 py-2 rounded transition-colors hover:border-secondary" href="${esc(r.documentation_url)}" target="_blank" rel="noopener noreferrer">Docs</a>` : ''}
        ${r.repository_url ? `<a class="inline-flex items-center gap-2 bg-surface-secondary border border-border-subtle text-text-primary font-body-compact text-body-compact px-3 py-2 rounded transition-colors hover:border-secondary" href="${esc(r.repository_url)}" target="_blank" rel="noopener noreferrer">Repository</a>` : ''}
        <button type="button" class="inline-flex items-center gap-1.5 bg-surface-secondary border border-border-subtle hover:border-secondary text-text-primary px-3 py-2 rounded font-body-compact text-body-compact" data-share="resource:${esc(r.id)}">
          <span class="material-symbols-outlined text-base" aria-hidden="true">share</span> Share
        </button>
        ${window.DevSpireCollections ? window.DevSpireCollections.buttonHTML('resource', r.id, r.name, 'inline-flex items-center gap-1.5 bg-surface-secondary border border-border-subtle hover:border-secondary text-text-primary px-3 py-2 rounded font-body-compact text-body-compact') : ''}
        <button class="ml-auto text-text-muted hover:text-text-primary font-body-compact text-body-compact px-2 py-2 transition-colors" type="button" data-detail-back>Back to all resources</button>
      </div>`;

    detailModal.hidden = false;
    detailContent.dataset.recordType = 'resource';
    detailContent.dataset.recordId = r.id;
    document.body.style.overflow = 'hidden';
    $('detail-close').focus();
    if (window.RecentlyViewed) {
      window.RecentlyViewed.track('resource', r.id);
    }
    if (window.RelatedResources) {
      window.RelatedResources.renderInto(detailContent.querySelector('[data-related-detail]'), 'resource', r.id, { limit: 6 });
    }
    if (window.DevSpireCollections) window.DevSpireCollections.decorate();
    if (!options.fromHash) {
      history.replaceState(null, '', '#resource/' + encodeURIComponent(r.id));
    }
  }

  function closeDetail() {
    detailModal.hidden = true;
    document.body.style.overflow = '';
    if (location.hash.indexOf('#resource/') === 0) {
      history.replaceState(null, '', location.pathname + location.search);
    }
  }

  function showInvalid(id) {
    invalidMessage.textContent = `Resource "${id}" was not found.`;
    invalidState.hidden = false;
    invalidState.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-details]');
    if (!btn) return;
    openDetail(btn.dataset.details);
  });
  detailContent.addEventListener('click', (e) => {
    if (e.target.closest('[data-detail-back]')) closeDetail();
  });
  $('detail-close').addEventListener('click', closeDetail);
  detailModal.addEventListener('click', (e) => { if (e.target === detailModal) closeDetail(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !detailModal.hidden) closeDetail(); });
  $('invalid-dismiss').addEventListener('click', () => {
    invalidState.hidden = true;
    history.replaceState(null, '', location.pathname + location.search);
  });

  function handleHash() {
    const m = location.hash.match(/^#resource\/(.+)$/);
    if (!m) return;
    const id = decodeURIComponent(m[1]);
    const found = DATA.some((r) => r.id === id);
    if (found) openDetail(id, { fromHash: true });
    else showInvalid(id);
  }
  window.addEventListener('hashchange', handleHash);

  /* ----- Mobile UI ----- */
  const menuToggle = $('menu-toggle');
  const mobileMenu = $('mobile-menu');
  menuToggle.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('hidden');
    menuToggle.setAttribute('aria-expanded', String(!open));
  });
  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });

  facetsToggle.addEventListener('click', () => {
    const hidden = facetsPanel.classList.toggle('hidden');
    facetsPanel.classList.toggle('lg:flex', hidden);
    facetsToggle.setAttribute('aria-expanded', String(!hidden));
  });

  /* ----- Deep links from the landing page (?category= / ?q=) ----- */
  const landingParams = new URLSearchParams(location.search);
  const landingCategory = landingParams.get('category');
  if (landingCategory && CATEGORIES.includes(landingCategory)) state.category = landingCategory;
  const landingQuery = landingParams.get('q');
  if (landingQuery) {
    state.query = landingQuery;
    searchInput.value = landingQuery;
    syncClearBtn();
  }

  /* ----- Init ----- */
  const chip = $('catalog-chip');
  if (DATA.length) {
    const selfHostable = DATA.filter((r) => r.self_hostable).length;
    const openSource = DATA.filter((r) => r.open_source).length;
    chip.textContent = `${DATA.length} Developer Resources Cataloged · ${selfHostable} Self-Hostable · ${openSource} Open Source`;
    renderPills();
    renderFacets();
    apply();
    handleHash();
  } else {
    chip.textContent = '0 Developer Resources Cataloged';
    noDataState.hidden = false;
    grid.hidden = true;
    paginationBar.hidden = true;
    emptyState.hidden = true;
  }
})();
