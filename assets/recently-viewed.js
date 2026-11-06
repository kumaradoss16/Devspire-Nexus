/* DevSpire Nexus — Recently Viewed Resources Service (Requirement 4)
   Tracks user viewing history in localStorage (up to 50 unique items), resolves
   stable references against catalog datasets, and provides UI rendering. */
(() => {
  'use strict';

  const STORAGE_KEY = 'devspire_nexus_recently_viewed_v1';
  const VERSION = 1;
  const DEFAULT_LIMIT = 50;
  const listeners = new Set();

  function emptyState() {
    return { version: VERSION, items: [] };
  }

  function read() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyState();
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== VERSION || !Array.isArray(parsed.items)) {
        return emptyState();
      }
      return parsed;
    } catch (e) {
      return emptyState();
    }
  }

  function write(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      notify();
    } catch (e) {
      // localStorage disabled / quota exceeded
    }
  }

  function notify() {
    for (const fn of listeners) {
      try { fn(); } catch (err) { console.error(err); }
    }
  }

  function resolveRecord(type, id) {
    if (window.DevSpireCollections && typeof window.DevSpireCollections.resolve === 'function') {
      const r = window.DevSpireCollections.resolve(type, id);
      if (r) return r;
    }
    const list = type === 'tool' ? window.AI_TOOLS : type === 'model' ? window.AI_MODELS : window.DEVELOPER_RESOURCES;
    if (Array.isArray(list)) {
      return list.find((x) => x.id === id) || null;
    }
    return null;
  }

  function track(type, id) {
    if (!type || !id || typeof id !== 'string') return;
    const state = read();
    const existingIndex = state.items.findIndex((item) => item.type === type && item.id === id);
    if (existingIndex > -1) {
      state.items.splice(existingIndex, 1);
    }
    state.items.unshift({
      type,
      id,
      lastViewedAt: new Date().toISOString()
    });
    if (state.items.length > DEFAULT_LIMIT) {
      state.items = state.items.slice(0, DEFAULT_LIMIT);
    }
    write(state);
  }

  function getItems() {
    return read().items;
  }

  function getResolved() {
    const items = getItems();
    const resolved = [];
    for (const it of items) {
      const rec = resolveRecord(it.type, it.id);
      if (rec) {
        resolved.push({ ...it, record: rec });
      }
    }
    return resolved;
  }

  function clear() {
    write(emptyState());
  }

  function timeAgo(dateString) {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '';
    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  }

  // Automatic tracking of hash changes for resource views (#tool/id, #model/id, #resource/id)
  function checkHash() {
    const hash = window.location.hash;
    if (!hash || !hash.includes('/')) return;
    const m = hash.match(/^#(tool|model|resource)\/(.+)$/);
    if (m) {
      track(m[1], decodeURIComponent(m[2]));
    }
  }

  // Delegate listener for resource card clicks
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-details]');
    if (!btn) return;
    const card = btn.closest('[data-tool-id], [data-model-id], [data-resource-id]');
    if (!card) return;
    const type = card.hasAttribute('data-tool-id') ? 'tool' : card.hasAttribute('data-model-id') ? 'model' : 'resource';
    const id = card.getAttribute('data-tool-id') || card.getAttribute('data-model-id') || card.getAttribute('data-resource-id');
    if (type && id) track(type, id);
  });

  window.addEventListener('hashchange', checkHash);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkHash);
  } else {
    checkHash();
  }

  window.RecentlyViewed = {
    STORAGE_KEY,
    VERSION,
    track,
    getItems,
    getResolved,
    clear,
    timeAgo,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    }
  };
})();
