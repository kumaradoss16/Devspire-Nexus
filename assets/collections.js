/* DevSpire Nexus personal collections.
   Bookmarks and collections live only in this browser (localStorage). The
   store keeps stable type/id references, validates everything it reads, and
   keeps a backup of corrupted payloads instead of silently discarding them. */
(() => {
  'use strict';

  const KEY = 'devspire-nexus:personal-collections:v1';
  const VERSION = 1;
  const TYPES = { tool: 'AI Tool', model: 'AI Model', resource: 'Developer Resource' };
  const NAME_MAX = 60;
  const listeners = new Set();
  let memoryState = null;
  let storageAvailable = true;
  let toastTimer = null;

  const empty = () => ({ version: VERSION, bookmarks: [], collections: [] });
  const now = () => new Date().toISOString();
  const uid = () => 'col-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  const refKey = (type, id) => type + ':' + id;
  const splitRef = (value) => {
    const [type, ...rest] = String(value || '').split(':');
    const id = rest.join(':');
    return TYPES[type] && id ? { type, id } : null;
  };
  const validDate = (v) => typeof v === 'string' && !Number.isNaN(Date.parse(v));

  function readRaw() {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return { state: empty(), raw: null };
      return { state: sanitize(JSON.parse(raw)), raw };
    } catch (error) {
      storageAvailable = false;
      return { state: empty(), raw: null };
    }
  }

  function sanitize(value) {
    if (!value || typeof value !== 'object' || value.version !== VERSION) return empty();
    const bookmarks = [];
    const seenBookmarks = new Set();
    for (const entry of Array.isArray(value.bookmarks) ? value.bookmarks : []) {
      if (!entry || !TYPES[entry.resourceType] || typeof entry.resourceId !== 'string' || !entry.resourceId) continue;
      const key = refKey(entry.resourceType, entry.resourceId);
      if (seenBookmarks.has(key)) continue;
      seenBookmarks.add(key);
      bookmarks.push({ resourceId: entry.resourceId, resourceType: entry.resourceType, savedAt: validDate(entry.savedAt) ? entry.savedAt : now() });
    }
    const collections = [];
    const seenCollections = new Set();
    for (const entry of Array.isArray(value.collections) ? value.collections : []) {
      if (!entry || typeof entry.id !== 'string' || !entry.id || seenCollections.has(entry.id)) continue;
      const name = typeof entry.name === 'string' ? entry.name.trim().slice(0, NAME_MAX) : '';
      if (!name) continue;
      seenCollections.add(entry.id);
      const refs = [];
      const seenRefs = new Set();
      for (const ref of Array.isArray(entry.resourceRefs) ? entry.resourceRefs : []) {
        if (!ref || !TYPES[ref.resourceType] || typeof ref.resourceId !== 'string' || !ref.resourceId) continue;
        const key = refKey(ref.resourceType, ref.resourceId);
        if (seenRefs.has(key)) continue;
        seenRefs.add(key);
        refs.push({ resourceId: ref.resourceId, resourceType: ref.resourceType });
      }
      collections.push({
        id: entry.id,
        name,
        createdAt: validDate(entry.createdAt) ? entry.createdAt : now(),
        updatedAt: validDate(entry.updatedAt) ? entry.updatedAt : now(),
        resourceRefs: refs
      });
    }
    return { version: VERSION, bookmarks, collections };
  }

  function load() {
    if (memoryState) return memoryState;
    const { state, raw } = readRaw();
    memoryState = state;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || parsed.version !== VERSION || JSON.stringify(sanitize(parsed)) !== JSON.stringify(parsed)) {
          backup(raw);
        }
      } catch {
        backup(raw);
      }
    }
    return memoryState;
  }

  function backup(raw) {
    try {
      if (raw) window.localStorage.setItem(KEY + ':corrupt:' + Date.now(), raw);
    } catch { /* storage full or blocked: the in-memory state is still usable */ }
  }

  function persist() {
    if (!memoryState) return false;
    if (!storageAvailable) return false;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(memoryState));
      return true;
    } catch (error) {
      storageAvailable = false;
      emit('storage-unavailable');
      return false;
    }
  }

  function emit(reason) {
    for (const fn of listeners) {
      try { fn(memoryState, reason); } catch { /* listeners must not break the store */ }
    }
  }

  function commit(reason) {
    persist();
    emit(reason);
    refreshButtons();
    return memoryState;
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function isBookmarked(type, id) {
    return load().bookmarks.some((b) => b.resourceType === type && b.resourceId === id);
  }

  function toggleBookmark(type, id) {
    if (!TYPES[type] || !id) return { ok: false, error: 'Unknown resource type.' };
    const state = load();
    const index = state.bookmarks.findIndex((b) => b.resourceType === type && b.resourceId === id);
    if (index >= 0) {
      state.bookmarks.splice(index, 1);
      commit('bookmark-removed');
      return { ok: true, saved: false };
    }
    state.bookmarks.push({ resourceId: id, resourceType: type, savedAt: now() });
    commit('bookmark-added');
    return { ok: true, saved: true };
  }

  function createCollection(name) {
    const clean = String(name || '').replace(/\s+/g, ' ').trim();
    if (clean.length < 1 || clean.length > NAME_MAX) return { ok: false, error: `Name must be 1–${NAME_MAX} characters.` };
    const state = load();
    if (state.collections.some((c) => c.name.toLowerCase() === clean.toLowerCase())) return { ok: false, error: 'A collection with that name already exists.' };
    const entry = { id: uid(), name: clean, createdAt: now(), updatedAt: now(), resourceRefs: [] };
    state.collections.push(entry);
    commit('collection-created');
    return { ok: true, collection: entry };
  }

  function renameCollection(id, name) {
    const clean = String(name || '').replace(/\s+/g, ' ').trim();
    if (clean.length < 1 || clean.length > NAME_MAX) return { ok: false, error: `Name must be 1–${NAME_MAX} characters.` };
    const state = load();
    const entry = state.collections.find((c) => c.id === id);
    if (!entry) return { ok: false, error: 'Collection not found.' };
    if (state.collections.some((c) => c.id !== id && c.name.toLowerCase() === clean.toLowerCase())) return { ok: false, error: 'A collection with that name already exists.' };
    entry.name = clean;
    entry.updatedAt = now();
    commit('collection-renamed');
    return { ok: true, collection: entry };
  }

  function deleteCollection(id) {
    const state = load();
    const index = state.collections.findIndex((c) => c.id === id);
    if (index < 0) return { ok: false, error: 'Collection not found.' };
    state.collections.splice(index, 1);
    commit('collection-deleted');
    return { ok: true };
  }

  function addToCollection(id, type, resourceId) {
    if (!TYPES[type] || !resourceId) return { ok: false, error: 'Unknown resource.' };
    const state = load();
    const entry = state.collections.find((c) => c.id === id);
    if (!entry) return { ok: false, error: 'Collection not found.' };
    if (entry.resourceRefs.some((r) => r.resourceType === type && r.resourceId === resourceId)) return { ok: true, added: false };
    entry.resourceRefs.push({ resourceId, resourceType: type });
    entry.updatedAt = now();
    commit('collection-item-added');
    return { ok: true, added: true };
  }

  function removeFromCollection(id, type, resourceId) {
    const state = load();
    const entry = state.collections.find((c) => c.id === id);
    if (!entry) return { ok: false, error: 'Collection not found.' };
    const before = entry.resourceRefs.length;
    entry.resourceRefs = entry.resourceRefs.filter((r) => !(r.resourceType === type && r.resourceId === resourceId));
    entry.updatedAt = now();
    commit('collection-item-removed');
    return { ok: true, removed: before !== entry.resourceRefs.length };
  }

  function collectionsFor(type, id) {
    return load().collections.filter((c) => c.resourceRefs.some((r) => r.resourceType === type && r.resourceId === id));
  }

  function resolve(ref) {
    if (!ref || !TYPES[ref.resourceType]) return null;
    const source = ref.resourceType === 'tool' ? window.AI_TOOLS
      : ref.resourceType === 'model' ? window.AI_MODELS
        : window.DEVELOPER_RESOURCES;
    if (!Array.isArray(source)) return null;
    return source.find((r) => r.id === ref.resourceId) || null;
  }

  function exportJSON() {
    const state = load();
    return JSON.stringify({
      exportedAt: now(),
      version: state.version,
      bookmarks: state.bookmarks,
      collections: state.collections
    }, null, 2);
  }

  function importJSON(text) {
    let parsed;
    try { parsed = JSON.parse(text); } catch { return { ok: false, error: 'The file is not valid JSON.' }; }
    if (!parsed || parsed.version !== VERSION) return { ok: false, error: `Unsupported schema version. Expected version ${VERSION}.` };
    const next = sanitize(parsed);
    const sourceRefs = (Array.isArray(parsed.bookmarks) ? parsed.bookmarks.length : 0)
      + (Array.isArray(parsed.collections) ? parsed.collections.reduce((n, c) => n + (Array.isArray(c.resourceRefs) ? c.resourceRefs.length : 0), 0) : 0);
    if (sourceRefs > 0 && next.bookmarks.length + next.collections.reduce((n, c) => n + c.resourceRefs.length, 0) === 0) {
      return { ok: false, error: 'The file contains no usable bookmarks or collections.' };
    }
    memoryState = next;
    commit('imported');
    return { ok: true, bookmarks: next.bookmarks.length, collections: next.collections.length };
  }

  function clearAll() {
    memoryState = empty();
    commit('cleared');
    return { ok: true };
  }

  function toast(message) {
    let el = document.getElementById('collection-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'collection-toast';
      el.className = 'collection-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
  }

  const buttonHTML = (type, id, name, extraClass) => {
    const saved = isBookmarked(type, id);
    return `<button type="button" class="bookmark-btn ${extraClass || ''}" data-bookmark="${type}:${id}" aria-pressed="${saved}" aria-label="${saved ? 'Remove bookmark for' : 'Save'} ${escapeAttr(name)}" title="${saved ? 'Remove bookmark' : 'Save Resource'}"><span class="material-symbols-outlined" aria-hidden="true">${saved ? 'bookmark' : 'bookmark_border'}</span></button>`;
  };

  function escapeAttr(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function cards() {
    const out = [];
    document.querySelectorAll('[data-tool-id]').forEach((el) => out.push({ el, type: 'tool', id: el.dataset.toolId, name: text(el.querySelector('h2')) }));
    document.querySelectorAll('[data-model-id]').forEach((el) => out.push({ el, type: 'model', id: el.dataset.modelId, name: text(el.querySelector('h2')) }));
    document.querySelectorAll('[data-resource-id]').forEach((el) => out.push({ el, type: 'resource', id: el.dataset.resourceId, name: text(el.querySelector('h2')) }));
    document.querySelectorAll('[data-related-card]').forEach((el) => {
      const ref = splitRef(el.dataset.relatedCard);
      if (ref) out.push({ el, type: ref.type, id: ref.id, name: text(el.querySelector('.related-name')), related: true });
    });
    document.querySelectorAll('[data-featured-ref]').forEach((el) => {
      const ref = splitRef(el.dataset.featuredRef);
      if (ref) out.push({ el, type: ref.type, id: ref.id, name: text(el.querySelector('h2, h3, .featured-name')), featured: true });
    });
    return out;
  }

  function text(node) {
    return node ? node.textContent.replace(/\s+/g, ' ').trim() : 'Resource';
  }

  function decorateCard(entry) {
    if (!entry.id || entry.el.querySelector('[data-bookmark]')) return;
    const btn = buttonHTML(entry.type, entry.id, entry.name, entry.related ? 'related-bookmark' : entry.featured ? 'featured-bookmark' : 'bookmark-card-btn');
    if (entry.related) {
      entry.el.appendChild(holder(btn));
      return;
    }
    const foot = entry.el.querySelector('.pt-space-sm.border-t') || entry.el.querySelector('.featured-foot') || entry.el.lastElementChild;
    if (!foot) return;
    const wrapper = document.createElement('span');
    wrapper.innerHTML = btn;
    foot.appendChild(wrapper.firstElementChild);
  }

  function holder(html) {
    const wrapper = document.createElement('span');
    wrapper.innerHTML = html;
    return wrapper.firstElementChild;
  }

  function decorateDetail() {
    const modal = document.getElementById('detail-modal');
    const content = document.getElementById('detail-content');
    if (!modal || !content || modal.hidden) return;
    const type = content.dataset.recordType;
    const id = content.dataset.recordId;
    if (!TYPES[type] || !id || content.querySelector('[data-bookmark]')) return;
    const title = content.querySelector('#detail-title') || content.querySelector('h2');
    if (!title) return;
    const name = title.textContent.replace(/\s+/g, ' ').trim();
    const btn = holder(buttonHTML(type, id, name, 'detail-bookmark'));
    title.parentElement.insertBefore(btn, title.nextSibling);
  }

  function decorate() {
    for (const entry of cards()) decorateCard(entry);
    decorateDetail();
    refreshButtons();
  }

  function refreshButtons() {
    document.querySelectorAll('[data-bookmark]').forEach((btn) => {
      const ref = splitRef(btn.dataset.bookmark);
      if (!ref) return;
      const saved = isBookmarked(ref.type, ref.id);
      btn.setAttribute('aria-pressed', String(saved));
      const name = (btn.getAttribute('aria-label') || '').replace(/^(Save|Remove bookmark for)\s+/, '');
      btn.setAttribute('aria-label', `${saved ? 'Remove bookmark for' : 'Save'} ${name}`);
      btn.setAttribute('title', saved ? 'Remove bookmark' : 'Save Resource');
      const icon = btn.querySelector('.material-symbols-outlined');
      if (icon) icon.textContent = saved ? 'bookmark' : 'bookmark_border';
    });
  }

  document.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-bookmark]');
    if (!btn) return;
    event.preventDefault();
    const ref = splitRef(btn.dataset.bookmark);
    if (!ref) return;
    const result = toggleBookmark(ref.type, ref.id);
    if (!result.ok) return;
    toast(result.saved ? 'Saved to My Collections.' : 'Bookmark removed.');
  });

  let observer = null;
  function start() {
    load();
    refreshButtons();
    const root = document.getElementById('main-content') || document.body;
    observer = new MutationObserver(() => {
      window.requestAnimationFrame(decorate);
    });
    observer.observe(root, { childList: true, subtree: true });
    decorate();
  }

  window.DevSpireCollections = {
    KEY,
    VERSION,
    TYPES,
    load,
    subscribe,
    isBookmarked,
    toggleBookmark,
    createCollection,
    renameCollection,
    deleteCollection,
    addToCollection,
    removeFromCollection,
    collectionsFor,
    resolve,
    exportJSON,
    importJSON,
    clearAll,
    decorate,
    buttonHTML,
    refresh: refreshButtons,
    toast,
    get storageAvailable() { return storageAvailable; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
