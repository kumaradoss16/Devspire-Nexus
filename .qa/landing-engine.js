(() => {
  'use strict';

  const T = Array.isArray(window.AI_TOOLS) ? window.AI_TOOLS : [];
  const M = Array.isArray(window.AI_MODELS) ? window.AI_MODELS : [];
  const D = Array.isArray(window.DEVELOPER_RESOURCES) ? window.DEVELOPER_RESOURCES : [];
  const total = T.length + M.length + D.length;

  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  const initials = (name) => String(name || '')
    .split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '—';

  const icon = (r, size) => (r.icon
    ? `<img src="${esc(r.icon)}" alt="" width="${size}" height="${size}" loading="lazy" class="object-contain rounded"/>`
    : `<span class="font-code-badge text-code-badge text-secondary">${esc(initials(r.name))}</span>`);

  const catCount = (arr) => new Set(arr.map((r) => r.category).filter(Boolean)).size;
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  /* ----- Catalog totals ----- */
  setText('catalog-summary-text', `${total} verified records across 3 registries`);
  setText('tools-count', `${T.length} records · ${catCount(T)} categories`);
  setText('models-count', `${M.length} records · ${catCount(M)} categories`);
  setText('dev-count', `${D.length} records · ${catCount(D)} categories`);

  /* ----- Category coverage ----- */
  const topCats = (arr, n) => {
    const map = new Map();
    arr.forEach((r) => { if (r.category) map.set(r.category, (map.get(r.category) || 0) + 1); });
    return [...map.entries()]
      .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
      .slice(0, n);
  };

  const renderCoverage = (id, arr, page) => {
    const ul = document.getElementById(id);
    if (!ul) return;
    ul.innerHTML = topCats(arr, 5).map(([name, count]) => `
      <li>
        <a class="flex items-center justify-between gap-2 rounded border border-border-subtle bg-surface-secondary px-2.5 py-1.5 hover:border-secondary transition-colors" href="${page}?category=${encodeURIComponent(name)}">
          <span class="font-body-compact text-body-compact text-text-primary truncate">${esc(name)}</span>
          <span class="font-code-badge text-code-badge px-1.5 py-0.5 bg-surface-card border border-border-subtle rounded text-text-muted shrink-0">${count}</span>
        </a>
      </li>`).join('');
  };
  renderCoverage('coverage-tools', T, 'ai-tools.html');
  renderCoverage('coverage-models', M, 'models.html');
  renderCoverage('coverage-dev', D, 'developer-resources.html');
  setText('coverage-tools-all', `All ${catCount(T)} categories →`);
  setText('coverage-models-all', `All ${catCount(M)} categories →`);
  setText('coverage-dev-all', `All ${catCount(D)} categories →`);
  setText('coverage-total', `${total} RECORDS · 3 REGISTRIES`);

  /* ----- Featured records ----- */
  const pick = (arr, id) => arr.find((r) => r.id === id) || arr[0] || null;
  const featured = [
    { r: pick(T, 'cursor'), page: 'ai-tools.html', prefix: 'tool', type: 'AI Tool' },
    { r: pick(M, 'deepseek-r1'), page: 'models.html', prefix: 'model', type: 'AI Model' },
    { r: pick(D, 'vllm'), page: 'developer-resources.html', prefix: 'resource', type: 'Developer Resource' },
    { r: pick(D, 'qdrant'), page: 'developer-resources.html', prefix: 'resource', type: 'Developer Resource' }
  ].filter((x) => x.r);

  const detailHref = (x) => `${x.page}#${x.prefix}/${encodeURIComponent(x.r.id)}`;
  const subtitle = (x) => `${x.type} / ${x.r.source_category || x.r.resource_subtype || x.r.category || '—'}`;

  const railFor = (x) => {
    const r = x.r;
    if (x.prefix === 'tool') {
      return [['PRICING', r.pricing || '—'], ['PLATFORM', r.platform || '—'], ['LICENSING', r.license || '—']];
    }
    if (x.prefix === 'model') {
      return [['PARAMS', r.params || '—'], ['CONTEXT', r.context_k ? `${r.context_k}K` : '—'], ['LICENSE', r.license || '—']];
    }
    return [['TYPE', r.resource_subtype || r.category || '—'], ['LICENSE', r.license || '—'], ['HOSTING', (r.hosting || []).join(', ') || '—']];
  };

  const cardHtml = (x) => {
    const r = x.r;
    const chips = (r.tags || []).slice(0, 3);
    return `<div class="ui-card rounded-xl p-space-md flex flex-col justify-between">
      <div>
        <div class="flex items-start justify-between gap-2 mb-2">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-8 h-8 rounded bg-surface-secondary border border-border-subtle flex items-center justify-center shrink-0 overflow-hidden">${icon(r, 22)}</div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <a class="font-title-card text-title-card text-text-primary hover:text-secondary transition-colors truncate" href="${detailHref(x)}">${esc(r.name)}</a>
                <span class="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-surface-secondary border border-border-subtle font-code-badge text-[11px] text-[#34D399] shrink-0"><span class="w-1.5 h-1.5 rounded-full bg-[#34D399]"></span> Verified</span>
              </div>
              <span class="block font-metadata-label text-metadata-label text-text-muted truncate">${esc(subtitle(x))}</span>
            </div>
          </div>
          <span class="font-code-badge text-code-badge px-2 py-0.5 bg-surface-secondary border border-border-subtle rounded text-text-primary shrink-0">${esc(r.license || r.pricing || '—')}</span>
        </div>
        <p class="font-body-compact text-body-compact text-text-muted line-clamp-2 mb-3">${esc(r.description)}</p>
        <div class="grid grid-cols-3 gap-2 py-2 px-2.5 bg-surface-secondary rounded border border-border-subtle mb-3 text-left">
          ${railFor(x).map(([label, value]) => `<div class="min-w-0"><span class="block font-metadata-label text-[11px] text-text-muted">${label}</span><span class="font-code-param text-code-param text-text-primary block truncate">${esc(value)}</span></div>`).join('')}
        </div>
        <div class="flex flex-wrap gap-1.5 mb-4">
          ${chips.map((t) => `<span class="font-code-badge text-code-badge bg-surface-secondary border border-border-subtle px-2 py-0.5 rounded text-text-muted">${esc(t)}</span>`).join('')}
        </div>
      </div>
      <div class="pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
        <span class="font-code-badge text-code-badge text-text-muted">LAST VERIFIED: ${esc(r.verified || '—')}</span>
        <a class="inline-flex items-center gap-1 px-3 py-1 rounded bg-surface-secondary border border-border-subtle hover:border-secondary hover:text-secondary text-text-primary font-body-compact text-body-compact transition-colors shrink-0" href="${detailHref(x)}"><span>View details</span><span class="material-symbols-outlined text-[14px]" data-icon="chevron_right">chevron_right</span></a>
      </div>
    </div>`;
  };

  const grid = document.getElementById('resource-grid');
  if (grid) grid.innerHTML = featured.map(cardHtml).join('');

  const paramText = (x) => {
    const r = x.r;
    if (x.prefix === 'tool') return `${r.pricing || '—'} · ${r.platform || '—'}`;
    if (x.prefix === 'model') return `${r.params || '—'} · ${r.context_k ? `${r.context_k}K` : '—'}`;
    return `${r.resource_subtype || r.category || '—'} · ${(r.hosting || []).join(', ') || '—'}`;
  };

  const tableBody = document.getElementById('resource-table-body');
  if (tableBody) {
    tableBody.innerHTML = featured.map((x) => {
      const r = x.r;
      return `<tr>
        <td><a class="font-code-param text-code-param text-text-primary font-semibold hover:text-secondary transition-colors" href="${detailHref(x)}">${esc(r.name)}</a></td>
        <td class="text-text-muted font-body-compact text-body-compact">${esc(x.type)} · ${esc(r.category || '—')}</td>
        <td class="font-code-badge text-code-badge text-text-primary">${esc(r.license || '—')}</td>
        <td class="font-code-badge text-code-badge text-secondary">${esc(paramText(x))}</td>
        <td class="font-code-badge text-code-badge text-text-muted">${esc(r.verified || '—')}</td>
        <td><a class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-surface-secondary border border-border-subtle text-text-primary font-code-badge text-code-badge hover:border-secondary hover:text-secondary transition-colors" href="${detailHref(x)}">Details</a></td>
      </tr>`;
    }).join('');
  }

  /* ----- Catalog snapshot ----- */
  const snapshot = [
    { name: 'AI Tools', count: T.length, meta: `${catCount(T)} categories · Last verified ${window.AI_TOOLS_META?.last_verified || '—'}`, href: 'ai-tools.html', action: 'Browse AI Tools' },
    { name: 'AI Models', count: M.length, meta: `${catCount(M)} categories · Last verified ${window.AI_MODELS_META?.last_verified || '—'}`, href: 'models.html', action: 'Browse AI Models' },
    { name: 'Developer Resources', count: D.length, meta: `${catCount(D)} categories · Last verified ${window.DEVELOPER_RESOURCES_META?.last_verified || '—'}`, href: 'developer-resources.html', action: 'Browse Developer Resources' },
    { name: 'Combined catalog', count: total, meta: '3 registries · one source file', href: '#coverage', action: 'View category coverage' }
  ];
  const snapshotGrid = document.getElementById('snapshot-grid');
  if (snapshotGrid) {
    snapshotGrid.innerHTML = snapshot.map((s) => `<div class="bg-surface-secondary border border-border-subtle rounded p-3 flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-1 gap-2">
          <span class="font-code-param text-code-param text-text-primary font-semibold truncate">${esc(s.name)}</span>
          <span class="font-code-badge text-code-badge text-text-muted shrink-0">CATALOGED</span>
        </div>
        <p class="font-title-card text-title-card text-text-primary mb-1">${s.count}</p>
        <p class="font-metadata-label text-metadata-label text-text-muted mb-2">${esc(s.meta)}</p>
      </div>
      <a class="font-code-badge text-code-badge text-secondary hover:underline inline-flex items-center gap-1" href="${s.href}">${esc(s.action)} <span class="material-symbols-outlined text-[13px]" data-icon="arrow_forward">arrow_forward</span></a>
    </div>`).join('');
  }

  /* ----- Cross-registry search ----- */
  const index = [
    ...T.map((r) => ({ r, page: 'ai-tools.html', prefix: 'tool', type: 'AI Tool', label: 'AI Tools' })),
    ...M.map((r) => ({ r, page: 'models.html', prefix: 'model', type: 'AI Model', label: 'AI Models' })),
    ...D.map((r) => ({ r, page: 'developer-resources.html', prefix: 'resource', type: 'Developer Resource', label: 'Developer Resources' }))
  ].map((x) => ({
    ...x,
    org: x.r.org || x.r.publisher || '',
    hay: [x.r.name, x.r.org, x.r.publisher, x.r.category, x.r.source_category, x.r.resource_subtype, x.r.description, (x.r.tags || []).join(' '), x.r.license, x.r.pricing]
      .filter(Boolean).join(' ').toLowerCase()
  }));

  const searchInput = document.getElementById('resource-search');
  const clearBtn = document.getElementById('search-clear');
  const results = document.getElementById('search-results');
  const resultsSummary = document.getElementById('search-results-summary');
  const resultsList = document.getElementById('search-results-list');
  const resultsLinks = document.getElementById('search-results-links');
  const resultsClose = document.getElementById('search-results-close');
  let lastMatches = [];

  const syncClearBtn = () => { if (clearBtn) clearBtn.style.visibility = searchInput.value ? 'visible' : 'hidden'; };
  const hideResults = () => { if (results) results.hidden = true; };

  const runSearch = (raw) => {
    const q = (raw == null ? searchInput.value : raw).trim();
    syncClearBtn();
    if (!q) { hideResults(); return; }
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    lastMatches = index.filter((it) => tokens.every((t) => it.hay.includes(t)));
    results.hidden = false;
    resultsSummary.textContent = lastMatches.length
      ? `${lastMatches.length} match${lastMatches.length === 1 ? '' : 'es'} for “${q}”`
      : `No records match “${q}”`;
    resultsList.innerHTML = lastMatches.slice(0, 8).map((it) => `
      <li>
        <a class="flex items-center gap-3 py-2 group" href="${it.page}#${it.prefix}/${encodeURIComponent(it.r.id)}">
          <span class="w-7 h-7 rounded bg-surface-secondary border border-border-subtle flex items-center justify-center shrink-0 overflow-hidden">${icon(it.r, 18)}</span>
          <span class="min-w-0 flex-1">
            <span class="block font-body-compact text-body-compact text-text-primary truncate group-hover:text-secondary">${esc(it.r.name)}</span>
            <span class="block font-metadata-label text-metadata-label text-text-muted truncate">${esc(it.type)} · ${esc(it.r.category || '')}${it.org ? ` · ${esc(it.org)}` : ''}</span>
          </span>
          <span class="font-code-badge text-code-badge text-text-muted shrink-0">${esc(it.r.verified || '')}</span>
        </a>
      </li>`).join('');
    const links = [
      ['AI Tools', 'ai-tools.html'],
      ['AI Models', 'models.html'],
      ['Developer Resources', 'developer-resources.html']
    ].map(([label, page]) => {
      const n = lastMatches.filter((m) => m.page === page).length;
      return n ? `<a class="font-code-badge text-code-badge text-secondary hover:underline" href="${page}?q=${encodeURIComponent(q)}">${label} (${n}) →</a>` : '';
    }).filter(Boolean);
    resultsLinks.innerHTML = links.length
      ? `<span class="font-metadata-label text-metadata-label text-text-muted">Open search in:</span>${links.join('')}`
      : `<span class="font-metadata-label text-metadata-label text-text-muted">Try a broader term, or browse <a class="text-secondary hover:underline" href="ai-tools.html">AI Tools</a>, <a class="text-secondary hover:underline" href="models.html">AI Models</a>, or <a class="text-secondary hover:underline" href="developer-resources.html">Developer Resources</a>.</span>`;
  };

  if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', () => {
      syncClearBtn();
      clearTimeout(debounce);
      debounce = setTimeout(() => runSearch(), 160);
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (lastMatches.length) {
          const first = lastMatches[0];
          location.href = `${first.page}#${first.prefix}/${encodeURIComponent(first.r.id)}`;
        } else {
          runSearch();
        }
      } else if (e.key === 'Escape') {
        hideResults();
      }
    });
    syncClearBtn();
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      syncClearBtn();
      hideResults();
      searchInput.focus();
    });
  }

  if (resultsClose) {
    resultsClose.addEventListener('click', () => {
      hideResults();
      searchInput.focus();
    });
  }

  document.querySelectorAll('.preset-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      searchInput.value = chip.dataset.preset || chip.textContent.trim();
      runSearch();
      searchInput.focus();
    });
  });

  const quickFindJump = document.getElementById('quick-find-jump');
  if (quickFindJump) {
    quickFindJump.addEventListener('click', () => {
      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      searchInput.focus();
      searchInput.select();
    });
  }

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });

  /* ----- Grid / dense table toggle ----- */
  const gridView = document.getElementById('resource-grid');
  const tableView = document.getElementById('resource-table-wrap');
  const viewButtons = document.querySelectorAll('.segmented [data-view]');
  viewButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const isGrid = btn.dataset.view === 'grid';
      gridView.hidden = !isGrid;
      tableView.hidden = isGrid;
      viewButtons.forEach((b) => {
        const pressed = b === btn;
        b.setAttribute('aria-pressed', String(pressed));
        b.classList.toggle('text-text-primary', pressed);
        b.classList.toggle('text-text-muted', !pressed);
        b.classList.toggle('border-border-subtle', pressed);
        b.classList.toggle('bg-surface-card', pressed);
      });
    });
  });

  /* ----- Mobile menu ----- */
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
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
})();
