(function () {
  'use strict';

  const DS = window.DS;
  const input = document.getElementById('resource-search');
  const clearButton = document.getElementById('search-clear');

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  function syncClearButton() {
    if (clearButton) {
      clearButton.hidden = !input.value;
    }
  }

  function syncPresetState() {
    document.querySelectorAll('[data-preset]').forEach(function (button) {
      button.classList.toggle('is-active', button.dataset.preset === DS.state.query);
    });
  }

  function update() {
    DS.render.update();
    syncClearButton();
    syncPresetState();
  }

  DS.search = {
    init: function () {
      if (!input) {
        return;
      }

      input.addEventListener('input', function () {
        DS.state.query = input.value.trim();
        update();
      });

      input.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && input.value) {
          event.preventDefault();
          DS.search.clearQuery();
        }
      });

      if (clearButton) {
        clearButton.addEventListener('click', DS.search.clearQuery);
      }

      document.querySelectorAll('[data-preset]').forEach(function (button) {
        button.addEventListener('click', function () {
          DS.state.query = button.dataset.preset;
          DS.state.type = 'all';
          DS.state.facet = 'all';
          input.value = button.dataset.preset;
          update();
          scrollToFeatured();
        });
      });

      update();
    },

    setQuery: function (value, shouldFocus) {
      if (!input) {
        return;
      }
      input.value = value;
      DS.state.query = value.trim();
      update();
      if (shouldFocus) {
        input.focus();
      }
    },

    applyType: function (type) {
      DS.state.type = type;
      DS.state.facet = 'all';
      update();
      scrollToFeatured();
    },

    applyFacet: function (facet) {
      DS.state.facet = facet;
      DS.state.type = 'all';
      update();
      scrollToFeatured();
    },

    clearKey: function (key) {
      if (key === 'query') {
        DS.state.query = '';
        input.value = '';
      } else if (key === 'type') {
        DS.state.type = 'all';
      } else if (key === 'facet') {
        DS.state.facet = 'all';
      }
      update();
    },

    clearQuery: function () {
      DS.state.query = '';
      input.value = '';
      update();
      input.focus();
    },

    clearAll: function () {
      DS.state.query = '';
      DS.state.type = 'all';
      DS.state.facet = 'all';
      if (input) {
        input.value = '';
      }
      update();
    },

    focus: function () {
      const hero = document.getElementById('discover');
      if (hero) {
        hero.scrollIntoView({
          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
          block: 'start'
        });
      }
      window.setTimeout(function () {
        input.focus();
        input.select();
      }, prefersReducedMotion() ? 0 : 240);
    }
  };
})();
