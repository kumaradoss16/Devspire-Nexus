/* Nexus Spotlight filters. Progressive enhancement only: the full static
   list is already present when JavaScript is unavailable. */
(() => {
  'use strict';

  const section = document.getElementById('nexus-spotlight');
  if (!section) return;

  const buttons = Array.from(section.querySelectorAll('[data-spotlight-filter]'));
  const cards = Array.from(section.querySelectorAll('[data-spotlight-type]'));
  const status = document.getElementById('spotlight-status');
  const empty = document.getElementById('spotlight-empty');
  if (!buttons.length || !cards.length) return;

  const counts = new Map();
  cards.forEach((card) => {
    const key = card.dataset.spotlightType;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const labelFor = (key) => {
    const button = buttons.find((item) => item.dataset.spotlightFilter === key);
    return button ? button.dataset.spotlightLabel || key : key;
  };

  const discoveryCount = (count) => `${count} ${count === 1 ? 'discovery' : 'discoveries'}`;

  const syncCounts = () => {
    buttons.forEach((button) => {
      const key = button.dataset.spotlightFilter;
      const count = key === 'all' ? cards.length : counts.get(key) || 0;
      const badge = button.querySelector('.spotlight-filter-count');
      if (badge) badge.textContent = String(count);
      button.hidden = key !== 'all' && count === 0;
    });
  };

  const apply = (key) => {
    let visible = 0;
    cards.forEach((card) => {
      const show = key === 'all' || card.dataset.spotlightType === key;
      card.hidden = !show;
      if (show) visible += 1;
    });
    buttons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.spotlightFilter === key));
    });
    if (status) {
      status.textContent = key === 'all'
        ? `Showing all ${discoveryCount(visible)}`
        : `Showing ${visible} of ${cards.length} discoveries in ${labelFor(key)}`;
    }
    if (empty) empty.hidden = visible !== 0;
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => apply(button.dataset.spotlightFilter));
  });

  syncCounts();
  apply('all');
})();
