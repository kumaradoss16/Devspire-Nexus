/* Featured Editorial Collection: category filtering and logo fallback.
   The section markup is static and crawlable; this script only enhances it. */
(() => {
  'use strict';

  const section = document.getElementById('featured-collection');
  if (!section) return;

  const buttons = Array.from(section.querySelectorAll('[data-collection-filter]'));
  const cards = Array.from(section.querySelectorAll('[data-collection-category]'));
  const status = document.getElementById('editorial-status');
  const empty = document.getElementById('editorial-empty');
  if (!buttons.length || !cards.length) return;

  const counts = new Map();
  cards.forEach((card) => {
    const key = card.dataset.collectionCategory;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const labelFor = (key) => {
    const button = buttons.find((b) => b.dataset.collectionFilter === key);
    return button ? button.dataset.collectionLabel || key : key;
  };

  const syncCounts = () => {
    buttons.forEach((button) => {
      const key = button.dataset.collectionFilter;
      const count = key === 'all' ? cards.length : counts.get(key) || 0;
      const badge = button.querySelector('.editorial-filter-count');
      if (badge) badge.textContent = String(count);
      button.hidden = key !== 'all' && count === 0;
    });
  };

  const apply = (key) => {
    let visible = 0;
    cards.forEach((card) => {
      const show = key === 'all' || card.dataset.collectionCategory === key;
      card.hidden = !show;
      if (show) visible += 1;
    });

    buttons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.collectionFilter === key));
    });

    if (status) {
      status.textContent = key === 'all'
        ? `Showing all ${visible} platforms`
        : `Showing ${visible} of ${cards.length} platforms in ${labelFor(key)}`;
    }
    if (empty) empty.hidden = visible !== 0;
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => apply(button.dataset.collectionFilter));
  });

  section.querySelectorAll('.editorial-logo img').forEach((img) => {
    img.addEventListener('error', () => {
      const fallback = img.parentElement && img.parentElement.querySelector('.editorial-logo-fallback');
      img.remove();
      if (fallback) fallback.hidden = false;
    }, { once: true });
  });

  syncCounts();
  apply('all');
})();
