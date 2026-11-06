(function () {
  'use strict';

  const DS = window.DS;

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function setActiveNav(name) {
    document.querySelectorAll('[data-nav]').forEach(function (link) {
      if (link.dataset.nav === name) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function scrollToFeatured() {
    const section = document.getElementById('featured');
    if (section) {
      section.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start'
      });
    }
  }

  function spotlightFacet(facetId) {
    const section = document.getElementById('taxonomy');
    const item = document.querySelector('[data-facet="' + facetId + '"]');

    if (section) {
      section.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start'
      });
    }

    if (!item) {
      return;
    }

    item.classList.add('is-spotlight');
    window.setTimeout(function () {
      item.focus({ preventScroll: true });
    }, prefersReducedMotion() ? 0 : 320);

    window.setTimeout(function () {
      item.classList.remove('is-spotlight');
    }, 2400);
  }

  function handleClick(event) {
    const target = event.target.closest('[data-details], [data-filter-type], [data-facet], [data-clear-filter], [data-clear-filters], [data-view], [data-highlight-facet], [data-open-submit], [data-open-notice], [data-nav]');

    if (!target) {
      return;
    }

    const detailsId = target.dataset.details;
    if (detailsId) {
      DS.ui.openDetails(detailsId);
      return;
    }

    const noticeKind = target.dataset.openNotice;
    if (noticeKind) {
      DS.ui.openNotice(noticeKind);
      return;
    }

    if (target.hasAttribute('data-open-submit')) {
      DS.ui.openSubmit();
      return;
    }

    const view = target.dataset.view;
    if (view) {
      DS.state.view = view;
      DS.render.update();
      return;
    }

    const removeKey = target.dataset.clearFilter;
    if (removeKey) {
      DS.search.clearKey(removeKey);
      setActiveNav('discover');
      return;
    }

    if (target.hasAttribute('data-clear-filters')) {
      DS.search.clearAll();
      setActiveNav('discover');
      return;
    }

    const filterType = target.dataset.filterType;
    if (filterType) {
      event.preventDefault();
      DS.search.applyType(filterType);
      setActiveNav(filterType);
      scrollToFeatured();
      return;
    }

    const facet = target.dataset.facet;
    if (facet) {
      DS.search.applyFacet(facet);
      return;
    }

    const highlight = target.dataset.highlightFacet;
    if (highlight) {
      event.preventDefault();
      spotlightFacet(highlight);
      return;
    }

    if (target.dataset.nav) {
      setActiveNav(target.dataset.nav);
    }
  }

  function init() {
    DS.render.all();
    DS.search.init();
    DS.ui.init();
    setActiveNav('discover');
    document.addEventListener('click', handleClick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
