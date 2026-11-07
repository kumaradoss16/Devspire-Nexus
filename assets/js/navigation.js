(function () {
  'use strict';

  const DS = window.DS;
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuIconUse = menuToggle ? menuToggle.querySelector('use') : null;

  function isMenuOpen() {
    return mobileMenu && !mobileMenu.hidden;
  }

  function closeMenu() {
    if (!mobileMenu || !menuToggle) {
      return;
    }
    mobileMenu.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
    if (menuIconUse) {
      menuIconUse.setAttribute('href', '#icon-menu');
    }
  }

  function openMenu() {
    if (!mobileMenu || !menuToggle) {
      return;
    }
    mobileMenu.hidden = false;
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close menu');
    if (menuIconUse) {
      menuIconUse.setAttribute('href', '#icon-x');
    }
  }

  function closeDialog(dialog) {
    if (dialog && typeof dialog.close === 'function' && dialog.open) {
      dialog.close();
    }
  }

  function verifiedPill() {
    return '<span class="verified-pill" title="Illustrative sample verification status"><span class="dot"></span>Verified</span>';
  }

  function paramsMarkup(resource) {
    return '<div class="param-rail" role="group" aria-label="Technical parameters">' +
      resource.params.map(function (param) {
        return '<div>' +
          '<span class="param-label">' + DS.escape(param.label) + '</span>' +
          '<span class="param-value' + (param.accent ? ' is-accent' : '') + '">' + DS.escape(param.value) + '</span>' +
        '</div>';
      }).join('') +
    '</div>';
  }

  DS.ui = {
    closeMenu: closeMenu,

    openDetails: function (id) {
      const resource = DS.getById(id);
      const dialog = document.getElementById('details-dialog');
      const head = document.getElementById('details-head');
      const body = document.getElementById('details-body');

      if (!resource || !dialog || !head || !body) {
        return;
      }

      closeMenu();
      head.innerHTML = '<div class="detail-identity">' +
        '<span class="res-logo tone-' + DS.escape(resource.logoTone) + '" aria-hidden="true">' + DS.escape(resource.monogram) + '</span>' +
        '<div>' +
          '<h2 class="detail-title" id="details-title">' + DS.escape(resource.name) + '</h2>' +
          '<p class="detail-sub">' + DS.escape(resource.classification) + '</p>' +
        '</div>' +
      '</div>';

      const link = DS.isSafeUrl(resource.url)
        ? '<a class="btn btn-secondary btn-sm" href="' + DS.escape(resource.url) + '" target="_blank" rel="noopener noreferrer">' +
            '<span>' + DS.escape(resource.urlLabel) + '</span>' +
            DS.icon('arrow-up-right', 14) +
          '</a>'
        : '';

      body.innerHTML =
        '<div class="detail-meta-row">' +
          verifiedPill() +
          '<span class="license-chip ' + DS.escape(resource.licenseTone) + '">' + DS.escape(resource.license) + '</span>' +
        '</div>' +
        '<p class="detail-desc">' + DS.escape(resource.description) + '</p>' +
        paramsMarkup(resource) +
        '<ul class="tag-row" aria-label="Technical tags">' +
          resource.tags.map(function (tag, index) {
            return '<li class="tag-chip' + (index === 0 ? ' is-accent' : '') + '">' + DS.escape(tag) + '</li>';
          }).join('') +
        '</ul>' +
        '<p class="detail-note">Sample record from the bundled demo dataset. Verification status and timestamps are illustrative, not live data.</p>' +
        (link ? '<div class="detail-actions">' + link + '</div>' : '');

      dialog.showModal();
    },

    openSubmit: function () {
      const dialog = document.getElementById('submit-dialog');
      const form = document.getElementById('submit-form');
      const status = document.getElementById('submit-status');
      if (!dialog) {
        return;
      }

      closeMenu();
      if (status) {
        status.hidden = true;
        status.textContent = '';
      }
      if (form) {
        form.reset();
      }
      dialog.showModal();

      const firstField = document.getElementById('submit-name');
      if (firstField) {
        window.setTimeout(function () {
          firstField.focus();
        }, 0);
      }
    },

    openNotice: function (kind) {
      const dialog = document.getElementById('notice-dialog');
      const title = document.getElementById('notice-title');
      const body = document.getElementById('notice-body');
      if (!dialog || !title || !body) {
        return;
      }

      closeMenu();

      if (kind === 'openapi') {
        title.textContent = 'OpenAPI matrix unavailable';
        body.textContent = 'The OpenAPI matrix is not published in this frontend preview. No API specification or downloadable file is bundled, and no backend is connected. This control is retained to match the reference interface.';
      } else if (kind === 'methodology') {
        title.textContent = 'Verification methodology';
        body.textContent = 'This preview does not implement automated verification. All verification labels, statuses, and timestamps in the directory are illustrative sample values from the bundled demo dataset, not the output of an operational pipeline.';
      } else {
        title.textContent = 'Not available';
        body.textContent = 'This action is not connected in the frontend preview.';
      }

      dialog.showModal();
    },

    init: function () {
      if (menuToggle) {
        menuToggle.addEventListener('click', function () {
          if (isMenuOpen()) {
            closeMenu();
          } else {
            openMenu();
          }
        });
      }

      document.querySelectorAll('[data-quick-find]').forEach(function (button) {
        button.addEventListener('click', function () {
          closeMenu();
          DS.search.focus();
        });
      });

      document.querySelectorAll('[data-close-dialog]').forEach(function (button) {
        button.addEventListener('click', function () {
          closeDialog(button.closest('dialog'));
        });
      });

      document.querySelectorAll('dialog').forEach(function (dialog) {
        dialog.addEventListener('click', function (event) {
          if (event.target === dialog) {
            closeDialog(dialog);
          }
        });
      });

      const submitForm = document.getElementById('submit-form');
      if (submitForm) {
        submitForm.addEventListener('submit', function (event) {
          event.preventDefault();
          const status = document.getElementById('submit-status');
          if (!submitForm.checkValidity()) {
            submitForm.reportValidity();
            return;
          }
          if (status) {
            status.hidden = false;
            status.textContent = 'Preview only: this form is not connected to a submission backend, so nothing was submitted.';
          }
        });
      }

      document.addEventListener('keydown', function (event) {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          closeMenu();
          DS.search.focus();
        }
      });

      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && isMenuOpen()) {
          closeMenu();
          menuToggle.focus();
        }
      });

      document.addEventListener('click', function (event) {
        if (!isMenuOpen()) {
          return;
        }
        if (event.target.closest('#mobile-menu') || event.target.closest('#menu-toggle')) {
          return;
        }
        closeMenu();
      });

      mobileMenu.querySelectorAll('a, button').forEach(function (control) {
        control.addEventListener('click', function () {
          closeMenu();
        });
      });

      window.addEventListener('resize', function () {
        if (window.innerWidth >= 1024) {
          closeMenu();
        }
      });
    }
  };
})();
