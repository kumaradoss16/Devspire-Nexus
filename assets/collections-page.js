/* My Collections page: renders browser-only bookmarks and custom collections,
   supports create/rename/delete, add/remove, local search, and JSON backup. */
(() => {
  'use strict';

  const store = window.DevSpireCollections;
  if (!store) return;

  const TYPES = {
    tool: { record: 'AI Tool', page: 'ai-tools.html' },
    model: { record: 'AI Model', page: 'models.html' },
    resource: { record: 'Developer Resource', page: 'developer-resources.html' }
  };
  const $ = (id) => document.getElementById(id);
  const state = { query: '', renaming: null, newOpen: false };

  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  const data = () => {
    const loaded = store.load();
    return {
      bookmarks: loaded.bookmarks.slice(),
      collections: loaded.collections.slice()
    };
  };

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const detailHref = (type, id) => `${TYPES[type].page}#${type}/${encodeURIComponent(id)}`;

  const tokens = () => state.query.toLowerCase().split(/\s+/).filter(Boolean);

  const matches = (record) => {
    const query = tokens();
    if (!query.length) return true;
    if (!record) return false;
    const hay = [record.name, record.category, record.org, record.publisher, record.resource_subtype, record.license, (record.tags || []).join(' ')]
      .filter(Boolean).join(' ').toLowerCase();
    return query.every((token) => hay.includes(token));
  };

  const iconHTML = (record, type) => {
    const fallback = window.ResourceIcons
      ? window.ResourceIcons.html(record ? record.category : '', type, record ? record.name : '')
      : '';
    if (!record || !record.icon) return fallback;
    return `<img src="${esc(record.icon)}" alt="" width="32" height="32" loading="lazy" decoding="async" class="w-full h-full object-contain p-0.5" data-row-icon/>
      <span class="w-full h-full items-center justify-center" data-row-fallback hidden>${fallback}</span>`;
  };

  const bindIcons = (root) => {
    root.querySelectorAll('img[data-row-icon]').forEach((img) => {
      const swap = () => {
        img.hidden = true;
        const fallback = img.parentElement && img.parentElement.querySelector('[data-row-fallback]');
        if (fallback) fallback.hidden = false;
      };
      if (img.complete && img.naturalWidth === 0) swap();
      else img.addEventListener('error', swap, { once: true });
    });
  };

  function announce(message, kind) {
    const el = $('collections-status');
    if (!el) return;
    el.textContent = message || '';
    el.className = 'font-metadata-label text-metadata-label mt-3 ' + (kind === 'error' ? 'text-status-error' : kind === 'success' ? 'text-tertiary' : 'text-text-muted');
  }

  const rowHTML = (ref, source) => {
    const record = store.resolve(ref);
    const type = ref.resourceType;
    if (!record) {
      return `<div class="rounded border border-status-warning/40 bg-status-warning/5 p-3 flex flex-wrap items-center gap-3" data-missing-row>
        <span class="w-8 h-8 rounded bg-surface-card border border-border-subtle flex items-center justify-center text-status-warning shrink-0"><span class="material-symbols-outlined text-[17px]" aria-hidden="true">link_off</span></span>
        <div class="min-w-0 flex-1">
          <p class="font-body-compact text-body-compact text-text-primary">Record no longer in the catalog</p>
          <p class="font-metadata-label text-metadata-label text-text-muted">${esc(TYPES[type].record)} · ${esc(ref.resourceId)}</p>
        </div>
        <button class="inline-flex items-center gap-1 bg-surface-secondary border border-border-subtle text-text-muted font-metadata-label text-metadata-label px-2.5 py-1.5 rounded hover:border-status-error hover:text-status-error transition-colors" type="button" ${source === 'saved' ? `data-remove-saved="${type}:${esc(ref.resourceId)}"` : `data-remove-collection="${esc(ref.collectionId)}" data-type="${type}" data-id="${esc(ref.resourceId)}"`}>Remove</button>
      </div>`;
    }
    const meta = TYPES[type];
    const subtitle = [meta.record, record.category, record.org || record.publisher].filter(Boolean).join(' · ');
    const saved = store.isBookmarked(type, record.id);
    return `<div class="nexus-resource-row group p-3" data-${type}-id="${esc(record.id)}">
      <div class="resource-row-main">
        <div class="resource-row-icon">
          ${iconHTML(record, type)}
        </div>
        <div class="resource-row-content">
          <div class="resource-row-header">
            <span class="inline-flex items-center gap-1.5 font-metadata-label text-metadata-label text-text-muted">
              <span class="w-1.5 h-1.5 rounded-full bg-tertiary shrink-0"></span>
              <span class="truncate">${esc(subtitle)}</span>
            </span>
            <h2 class="resource-row-title">
              <a href="${detailHref(type, record.id)}" class="hover:underline text-text-primary font-semibold">${esc(record.name)}</a>
            </h2>
            ${window.ResourceStatus ? window.ResourceStatus.statusBadgesHTML(record) : ''}
          </div>
          <p class="resource-row-desc mb-1">${esc(record.description || '')}</p>
        </div>
      </div>
      <div class="resource-row-actions">
        ${record.official_url ? `<a class="resource-action-btn" href="${esc(record.official_url)}" target="_blank" rel="noopener noreferrer" aria-label="Official site for ${esc(record.name)}" title="Official site"><span class="material-symbols-outlined text-[16px]" aria-hidden="true">open_in_new</span></a>` : ''}
        <button type="button" class="resource-action-btn" data-share="${type}:${esc(record.id)}" aria-label="Share ${esc(record.name)}" title="Share Resource">
          <span class="material-symbols-outlined text-[16px]" aria-hidden="true">share</span>
        </button>
        <a class="resource-action-btn" href="${detailHref(type, record.id)}" aria-label="View details" title="View details">
          <span class="material-symbols-outlined text-[16px]" aria-hidden="true">visibility</span>
        </a>
        <button class="inline-flex items-center gap-1 bg-surface-secondary border border-border-subtle text-text-muted font-metadata-label text-metadata-label px-2.5 py-1.5 rounded hover:border-status-error hover:text-status-error transition-colors" type="button" ${source === 'saved' ? `data-remove-saved="${type}:${esc(record.id)}"` : `data-remove-collection="${esc(ref.collectionId)}" data-type="${type}" data-id="${esc(record.id)}" aria-label="Remove from collection"`}>Remove</button>
      </div>
    </div>`;
  };

  const emptySavedHTML = () => `<div class="rounded border border-dashed border-border-subtle bg-surface-secondary/40 p-6 text-center">
    <span class="material-symbols-outlined text-[28px] text-text-muted" aria-hidden="true">bookmark_border</span>
    <p class="font-title-card text-title-card text-text-primary mt-2">No saved resources yet</p>
    <p class="font-body-compact text-body-compact text-text-muted mt-1 mb-3">Use the bookmark button on any record, related card, or detail page.</p>
    <div class="flex flex-wrap items-center justify-center gap-2 font-body-compact text-body-compact">
      <a class="text-secondary hover:underline" href="ai-tools.html">Browse AI Tools</a>
      <span class="text-border-subtle" aria-hidden="true">·</span>
      <a class="text-secondary hover:underline" href="models.html">Browse AI Models</a>
      <span class="text-border-subtle" aria-hidden="true">·</span>
      <a class="text-secondary hover:underline" href="developer-resources.html">Browse Developer Resources</a>
    </div>
  </div>`;

  const renderSummary = (bookmarks, collections) => {
    const host = $('collections-summary');
    if (!host) return;
    const entries = collections.reduce((n, c) => n + c.resourceRefs.length, 0);
    const cards = [
      ['Saved resources', String(bookmarks.length), 'bookmark'],
      ['Collections', String(collections.length), 'folder_open'],
      ['Collection entries', String(entries), 'inventory_2'],
      ['Storage', store.storageAvailable ? 'This browser' : 'Session only', 'devices']
    ];
    host.innerHTML = cards.map(([label, value, icon]) => `<div class="ui-card rounded-xl p-space-md">
      <span class="material-symbols-outlined text-[18px] text-secondary" aria-hidden="true">${icon}</span>
      <p class="font-code-param text-code-param text-text-muted mt-2">${esc(label)}</p>
      <p class="font-headline-section text-headline-section text-text-primary">${esc(value)}</p>
    </div>`).join('');
  };

  const renderSaved = (bookmarks) => {
    const list = $('saved-list');
    const count = $('saved-count');
    if (!list) return;
    if (count) count.textContent = `${bookmarks.length} saved`;
    if (!bookmarks.length) { list.innerHTML = emptySavedHTML(); return; }
    const visible = bookmarks.filter((b) => matches(store.resolve(b)));
    if (!visible.length) {
      list.innerHTML = `<p class="font-body-compact text-body-compact text-text-muted p-2">No saved resources match “${esc(state.query)}”.</p>`;
      return;
    }
    list.innerHTML = visible.map((bookmark) => rowHTML({
      resourceType: bookmark.resourceType,
      resourceId: bookmark.resourceId,
      collectionId: ''
    }, 'saved')).join('');
    bindIcons(list);
  };

  const renderCollections = (bookmarks, collections) => {
    const list = $('collections-list');
    if (!list) return;
    if (!collections.length) {
      list.innerHTML = `<div class="rounded border border-dashed border-border-subtle bg-surface-secondary/40 p-6 text-center">
        <span class="material-symbols-outlined text-[28px] text-text-muted" aria-hidden="true">create_new_folder</span>
        <p class="font-title-card text-title-card text-text-primary mt-2">No custom collections yet</p>
        <p class="font-body-compact text-body-compact text-text-muted mt-1 mb-3">Create one, then add resources you have already saved.</p>
        <button class="inline-flex items-center gap-2 bg-surface-secondary border border-border-subtle text-text-primary font-body-compact text-body-compact px-3 py-2 rounded hover:border-secondary transition-colors" type="button" data-new-collection><span class="material-symbols-outlined text-[16px]" aria-hidden="true">add</span>New collection</button>
      </div>`;
      return;
    }
    list.innerHTML = collections.map((collection) => {
      const visible = collection.resourceRefs.filter((ref) => matches(store.resolve(ref)));
      const candidates = bookmarks.filter((b) => !collection.resourceRefs.some((r) => r.resourceType === b.resourceType && r.resourceId === b.resourceId));
      const rows = visible.map((ref) => rowHTML({ ...ref, collectionId: collection.id }, 'collection')).join('');
      const filteredNote = state.query && !visible.length
        ? `<p class="font-body-compact text-body-compact text-text-muted p-2">No resources in this collection match “${esc(state.query)}”.</p>`
        : '';
      const empty = !collection.resourceRefs.length
        ? `<p class="font-body-compact text-body-compact text-text-muted p-2">This collection is empty. Add a saved resource below, or bookmark records from the registries.</p>`
        : '';
      const rename = state.renaming === collection.id
        ? `<form class="flex flex-col sm:flex-row sm:items-end gap-2 mt-3 pt-3 border-t border-border-subtle" data-rename-form="${esc(collection.id)}">
            <div class="flex flex-col gap-1 flex-1 min-w-0">
              <label class="font-metadata-label text-metadata-label text-text-muted" for="rename-${esc(collection.id)}">New name</label>
              <input class="nexus-input text-[#0A2540]" id="rename-${esc(collection.id)}" name="name" type="text" maxlength="60" value="${esc(collection.name)}" required style="color: #0A2540; background-color: #FFFFFF;"/>
            </div>
            <div class="flex items-center gap-2">
              <button class="bg-primary-container text-bg-canvas font-metadata-label text-metadata-label font-semibold px-3 py-2 rounded hover:brightness-110 transition-all" type="submit">Save</button>
              <button class="bg-surface-secondary border border-border-subtle text-text-primary font-metadata-label text-metadata-label px-3 py-2 rounded hover:border-secondary transition-colors" type="button" data-cancel-rename="${esc(collection.id)}">Cancel</button>
            </div>
            <p class="nexus-error" data-rename-error hidden></p>
          </form>`
        : '';
      const addControl = candidates.length
        ? `<div class="flex flex-col sm:flex-row sm:items-center gap-2 mt-3 pt-3 border-t border-border-subtle">
            <label class="font-metadata-label text-metadata-label text-text-muted" for="add-${esc(collection.id)}">Add a saved resource</label>
            <select class="nexus-input sm:max-w-xs" id="add-${esc(collection.id)}">
              ${candidates.map((b) => { const r = store.resolve(b); return `<option value="${esc(b.resourceType)}:${esc(b.resourceId)}">${esc(r ? r.name : b.resourceId)} (${esc(TYPES[b.resourceType].record)})</option>`; }).join('')}
            </select>
            <button class="inline-flex items-center justify-center gap-1.5 bg-surface-secondary border border-border-subtle text-text-primary font-metadata-label text-metadata-label px-3 py-2 rounded hover:border-secondary hover:text-secondary transition-colors" type="button" data-add="${esc(collection.id)}"><span class="material-symbols-outlined text-[15px]" aria-hidden="true">add</span>Add</button>
          </div>`
        : `<p class="font-metadata-label text-metadata-label text-text-muted mt-3 pt-3 border-t border-border-subtle">No other saved resources to add. Bookmark more records from the registries first.</p>`;
      return `<article class="ui-card rounded-xl p-space-md" data-collection="${esc(collection.id)}">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="font-title-card text-title-card text-text-primary">${esc(collection.name)}</h3>
            <p class="font-metadata-label text-metadata-label text-text-muted">${collection.resourceRefs.length} resource${collection.resourceRefs.length === 1 ? '' : 's'} · created ${formatDate(collection.createdAt)} · updated ${formatDate(collection.updatedAt)}</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button class="font-metadata-label text-metadata-label text-text-muted border border-border-subtle px-2.5 py-1 rounded hover:border-secondary hover:text-secondary transition-colors" type="button" data-rename="${esc(collection.id)}">Rename</button>
            <button class="font-metadata-label text-metadata-label text-text-muted border border-border-subtle px-2.5 py-1 rounded hover:border-status-error hover:text-status-error transition-colors" type="button" data-delete="${esc(collection.id)}">Delete</button>
          </div>
        </div>
        ${rename}
        <div class="flex flex-col gap-2 mt-3">${rows}${empty}${filteredNote}</div>
        ${addControl}
      </article>`;
    }).join('');
    bindIcons(list);
  };

  function render() {
    const { bookmarks, collections } = data();
    renderSummary(bookmarks, collections);
    renderSaved(bookmarks);
    renderCollections(bookmarks, collections);
    const notice = $('storage-status');
    if (notice) notice.hidden = store.storageAvailable;
    const newForm = $('new-collection-form');
    if (newForm) newForm.hidden = !state.newOpen;
    const exportBtn = $('export-btn');
    if (exportBtn) exportBtn.disabled = !bookmarks.length && !collections.length;
  }

  const openNew = () => {
    state.newOpen = true;
    render();
    const input = $('new-collection-name');
    if (input) input.focus();
  };

  document.addEventListener('click', (event) => {
    const newBtn = event.target.closest('[data-new-collection], #new-collection-btn');
    if (newBtn) { openNew(); return; }

    const cancelNew = event.target.closest('#cancel-new-collection');
    if (cancelNew) {
      state.newOpen = false;
      const form = $('new-collection-form');
      const error = $('new-collection-error');
      if (form) form.reset();
      if (error) error.hidden = true;
      render();
      $('new-collection-btn')?.focus();
      return;
    }

    const removeSaved = event.target.closest('[data-remove-saved]');
    if (removeSaved) {
      const [type, ...rest] = removeSaved.dataset.removeSaved.split(':');
      store.toggleBookmark(type, rest.join(':'));
      announce('Bookmark removed. The record is unchanged in the registry.');
      return;
    }

    const removeCollection = event.target.closest('[data-remove-collection]');
    if (removeCollection) {
      store.removeFromCollection(removeCollection.dataset.removeCollection, removeCollection.dataset.type, removeCollection.dataset.id);
      announce('Resource removed from the collection. It remains bookmarked if you saved it separately.');
      return;
    }

    const renameBtn = event.target.closest('[data-rename]');
    if (renameBtn) {
      state.renaming = renameBtn.dataset.rename;
      render();
      const input = document.querySelector(`[data-rename-form="${CSS.escape(state.renaming)}"] input`);
      if (input) { input.focus(); input.select(); }
      return;
    }

    const cancelRename = event.target.closest('[data-cancel-rename]');
    if (cancelRename) {
      state.renaming = null;
      render();
      return;
    }

    const deleteBtn = event.target.closest('[data-delete]');
    if (deleteBtn) {
      const id = deleteBtn.dataset.delete;
      const found = data().collections.find((c) => c.id === id);
      if (!found) return;
      if (!window.confirm(`Delete the collection “${found.name}”? Bookmarked resources stay saved.`)) return;
      store.deleteCollection(id);
      announce(`Collection “${found.name}” deleted. Bookmarks were not removed.`);
      return;
    }

    const addBtn = event.target.closest('[data-add]');
    if (addBtn) {
      const collectionId = addBtn.dataset.add;
      const select = document.getElementById(`add-${CSS.escape(collectionId)}`);
      if (!select || !select.value) return;
      const [type, ...rest] = select.value.split(':');
      const result = store.addToCollection(collectionId, type, rest.join(':'));
      announce(result.ok ? 'Resource added to the collection.' : (result.error || 'Could not add the resource.'), result.ok ? 'success' : 'error');
      return;
    }
  });

  document.addEventListener('submit', (event) => {
    const newForm = event.target.closest('#new-collection-form');
    if (newForm) {
      event.preventDefault();
      const input = $('new-collection-name');
      const error = $('new-collection-error');
      const result = store.createCollection(input.value);
      if (!result.ok) {
        error.textContent = result.error;
        error.hidden = false;
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        return;
      }
      input.value = '';
      input.removeAttribute('aria-invalid');
      error.hidden = true;
      state.newOpen = false;
      render();
      announce(`Collection “${result.collection.name}” created. Add saved resources from its card.`, 'success');
      return;
    }

    const renameForm = event.target.closest('[data-rename-form]');
    if (renameForm) {
      event.preventDefault();
      const id = renameForm.dataset.renameForm;
      const input = renameForm.querySelector('input');
      const error = renameForm.querySelector('[data-rename-error]');
      const result = store.renameCollection(id, input.value);
      if (!result.ok) {
        error.textContent = result.error;
        error.hidden = false;
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        return;
      }
      state.renaming = null;
      render();
      announce(`Collection renamed to “${result.collection.name}”.`, 'success');
    }
  });

  const search = $('collection-search');
  if (search) {
    let timer;
    search.addEventListener('input', () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        state.query = search.value.trim();
        render();
      }, 120);
    });
  }

  const exportBtn = $('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const { bookmarks, collections } = data();
      const blob = new Blob([store.exportJSON()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `devspire-nexus-collections-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      announce(`Exported ${bookmarks.length} bookmarks and ${collections.length} collections.`, 'success');
    });
  }

  const importInput = $('import-input');
  if (importInput) {
    importInput.addEventListener('change', async () => {
      const file = importInput.files && importInput.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        if (!window.confirm('Importing replaces the bookmarks and collections currently stored in this browser. Continue?')) {
          announce('Import cancelled.');
          return;
        }
        const result = store.importJSON(text);
        if (!result.ok) {
          announce(result.error, 'error');
          return;
        }
        announce(`Imported ${result.bookmarks} bookmarks and ${result.collections} collections.`, 'success');
      } catch {
        announce('The selected file could not be read.', 'error');
      } finally {
        importInput.value = '';
      }
    });
  }

  const clearBtn = $('clear-all-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const { bookmarks, collections } = data();
      if (!bookmarks.length && !collections.length) {
        announce('There is nothing to clear.');
        return;
      }
      if (!window.confirm(`Remove ${bookmarks.length} saved bookmark(s) and ${collections.length} collection(s) from this browser? This cannot be undone unless you exported a backup.`)) return;
      store.clearAll();
      announce('All bookmarks and collections were removed from this browser.', 'success');
    });
  }

  function renderRecentlyViewed() {
    const sec = $('recently-viewed-section');
    const listEl = $('recently-viewed-list');
    const countEl = $('recently-viewed-count');
    if (!sec || !listEl || !window.RecentlyViewed) return;
    const items = window.RecentlyViewed.getItems();
    if (!items || items.length === 0) {
      sec.hidden = true;
      return;
    }
    sec.hidden = false;
    if (countEl) countEl.textContent = `${items.length} item${items.length === 1 ? '' : 's'}`;
    listEl.innerHTML = items.slice(0, 10).map((item) => {
      const record = item.record;
      if (!record) return '';
      const type = item.type;
      const meta = TYPES[type];
      const subtitle = [meta.record, record.category, record.org || record.publisher].filter(Boolean).join(' · ');
      return `<div class="nexus-resource-row group p-3" data-${type}-id="${esc(record.id)}">
        <div class="resource-row-main">
          <div class="resource-row-icon">
            ${iconHTML(record, type)}
          </div>
          <div class="resource-row-content">
            <div class="resource-row-header">
              <span class="inline-flex items-center gap-1.5 font-metadata-label text-metadata-label text-text-muted">
                <span class="w-1.5 h-1.5 rounded-full bg-tertiary shrink-0"></span>
                <span class="truncate">${esc(subtitle)}</span>
              </span>
              <h2 class="resource-row-title">
                <a href="${detailHref(type, record.id)}" class="hover:underline text-text-primary font-semibold">${esc(record.name)}</a>
              </h2>
              ${window.ResourceStatus ? window.ResourceStatus.statusBadgesHTML(record) : ''}
            </div>
            <p class="resource-row-desc mb-1">${esc(record.description || '')}</p>
          </div>
        </div>
        <div class="resource-row-actions">
          <button type="button" class="resource-action-btn" data-share="${type}:${esc(record.id)}" aria-label="Share ${esc(record.name)}" title="Share Resource">
            <span class="material-symbols-outlined text-[16px]" aria-hidden="true">share</span>
          </button>
          ${store.buttonHTML(type, record.id, record.name, 'resource-action-btn')}
          <a class="resource-action-btn" href="${detailHref(type, record.id)}" aria-label="View details" title="View details">
            <span class="material-symbols-outlined text-[16px]" aria-hidden="true">visibility</span>
          </a>
        </div>
      </div>`;
    }).join('');
    bindIcons(listEl);
  }

  if (window.RecentlyViewed) {
    window.RecentlyViewed.subscribe(renderRecentlyViewed);
    renderRecentlyViewed();
    const clearRecentBtn = $('clear-recent-btn');
    if (clearRecentBtn) {
      clearRecentBtn.addEventListener('click', () => {
        window.RecentlyViewed.clear();
        renderRecentlyViewed();
      });
    }
  }

  store.subscribe(() => render());
  render();
})();
