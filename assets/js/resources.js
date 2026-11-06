(function () {
  'use strict';

  const DS = window.DS;
  const TYPE_LABELS = DS.typeLabels;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function icon(name, size) {
    return '<svg class="icon icon-' + (size || 16) + '" aria-hidden="true"><use href="#icon-' + name + '"/></svg>';
  }

  DS.escape = escapeHtml;
  DS.icon = icon;

  DS.getById = function (id) {
    return DS.data.resources.find(function (resource) {
      return resource.id === id;
    }) || null;
  };

  DS.isSafeUrl = function (value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:';
    } catch (error) {
      return false;
    }
  };

  DS.typeCounts = function () {
    const counts = { tools: 0, models: 0, developer: 0 };
    DS.data.resources.forEach(function (resource) {
      if (Object.prototype.hasOwnProperty.call(counts, resource.type)) {
        counts[resource.type] += 1;
      }
    });
    return counts;
  };

  DS.taxonomyCounts = function () {
    const counts = {};
    DS.data.taxonomy.forEach(function (item) {
      counts[item.id] = 0;
    });
    DS.data.resources.forEach(function (resource) {
      resource.facets.forEach(function (facet) {
        if (Object.prototype.hasOwnProperty.call(counts, facet)) {
          counts[facet] += 1;
        }
      });
    });
    return counts;
  };

  DS.getFiltered = function () {
    const query = DS.state.query.toLowerCase().trim();
    const terms = query ? query.split(/\s+/).filter(Boolean) : [];

    return DS.data.resources.filter(function (resource) {
      if (DS.state.type !== 'all' && resource.type !== DS.state.type) {
        return false;
      }
      if (DS.state.facet !== 'all' && resource.facets.indexOf(DS.state.facet) === -1) {
        return false;
      }
      if (!terms.length) {
        return true;
      }

      const haystack = [
        resource.name,
        resource.classification,
        resource.description,
        resource.license,
        resource.tags.join(' '),
        resource.params.map(function (param) {
          return param.label + ' ' + param.value;
        }).join(' '),
        (resource.keywords || []).join(' ')
      ].join(' ').toLowerCase();

      return terms.every(function (term) {
        return haystack.indexOf(term) !== -1;
      });
    });
  };

  function renderTypeCounts() {
    const counts = DS.typeCounts();
    document.querySelectorAll('[data-count]').forEach(function (node) {
      const count = counts[node.dataset.count] || 0;
      node.textContent = count + (count === 1 ? ' sample record in dataset' : ' sample records in dataset');
    });
  }

  function renderTaxonomy() {
    const grid = document.getElementById('taxonomy-grid');
    if (!grid) {
      return;
    }
    const counts = DS.taxonomyCounts();

    grid.innerHTML = DS.data.taxonomy.map(function (item) {
      const count = counts[item.id] || 0;
      const noun = count === 1 ? 'record' : 'records';
      return '<button class="taxonomy-item" type="button" data-facet="' + escapeHtml(item.id) + '" aria-label="Filter featured resources by ' + escapeHtml(item.label) + '. ' + count + ' sample ' + noun + '.">' +
        '<span class="taxonomy-label">' +
          '<span class="accent-' + escapeHtml(item.accent) + '">' + icon(item.icon, 17) + '</span>' +
          '<span>' + escapeHtml(item.label) + '</span>' +
        '</span>' +
        '<span class="taxonomy-count" title="Sample facet count">' + count + '</span>' +
      '</button>';
    }).join('');
  }

  function resourceCard(resource) {
    const titleId = 'resource-title-' + resource.id;

    return '<article class="resource-card" aria-labelledby="' + titleId + '">' +
      '<div>' +
        '<div class="resource-head">' +
          '<div class="resource-identity">' +
            '<span class="res-logo tone-' + escapeHtml(resource.logoTone) + '" aria-hidden="true">' + escapeHtml(resource.monogram) + '</span>' +
            '<div>' +
              '<div class="resource-title-row">' +
                '<h3 class="resource-title" id="' + titleId + '">' + escapeHtml(resource.name) + '</h3>' +
                '<span class="verified-pill" title="Illustrative sample verification status" aria-label="Verified, sample data"><span class="dot"></span>Verified</span>' +
              '</div>' +
              '<p class="resource-classification">' + escapeHtml(resource.classification) + '</p>' +
            '</div>' +
          '</div>' +
          '<span class="license-chip ' + escapeHtml(resource.licenseTone) + '">' + escapeHtml(resource.license) + '</span>' +
        '</div>' +
        '<p class="resource-desc">' + escapeHtml(resource.description) + '</p>' +
        '<div class="param-rail" role="group" aria-label="Technical parameters">' +
          resource.params.map(function (param) {
            return '<div>' +
              '<span class="param-label">' + escapeHtml(param.label) + '</span>' +
              '<span class="param-value' + (param.accent ? ' is-accent' : '') + '">' + escapeHtml(param.value) + '</span>' +
            '</div>';
          }).join('') +
        '</div>' +
        '<ul class="tag-row" aria-label="Technical tags">' +
          resource.tags.map(function (tag, index) {
            return '<li class="tag-chip' + (index === 0 ? ' is-accent' : '') + '">' + escapeHtml(tag) + '</li>';
          }).join('') +
        '</ul>' +
      '</div>' +
      '<div class="resource-foot">' +
        '<span class="verified-meta">Verified: ' + escapeHtml(resource.verified) + '</span>' +
        '<button class="btn btn-secondary btn-xs" type="button" data-details="' + escapeHtml(resource.id) + '" aria-label="View details for ' + escapeHtml(resource.name) + '">' +
          '<span>View details</span>' + icon('chevron-right', 14) +
        '</button>' +
      '</div>' +
    '</article>';
  }

  function tableRow(resource) {
    return '<tr>' +
      '<td>' +
        '<div class="table-res">' +
          '<span class="res-logo res-logo-sm tone-' + escapeHtml(resource.logoTone) + '" aria-hidden="true">' + escapeHtml(resource.monogram) + '</span>' +
          '<div>' +
            '<span class="table-name">' + escapeHtml(resource.name) + '</span>' +
            '<span class="table-sub">' + escapeHtml(resource.classification) + '</span>' +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td>' + escapeHtml(TYPE_LABELS[resource.type] || resource.type) + '</td>' +
      '<td><span class="license-chip ' + escapeHtml(resource.licenseTone) + '">' + escapeHtml(resource.license) + '</span></td>' +
      '<td class="table-params">' + escapeHtml(resource.params.map(function (param) { return param.value; }).join(' · ')) + '</td>' +
      '<td class="table-verified">' + escapeHtml(resource.verified) + '</td>' +
      '<td><button class="btn btn-secondary btn-xs" type="button" data-details="' + escapeHtml(resource.id) + '" aria-label="View details for ' + escapeHtml(resource.name) + '">Details</button></td>' +
    '</tr>';
  }

  function emptyState() {
    return '<div class="empty-state">' +
      '<span class="empty-icon">' + icon('search', 18) + '</span>' +
      '<p class="empty-title">No matching sample records</p>' +
      '<p class="empty-copy">The bundled demo dataset contains four illustrative resources. Adjust the query or clear the filters to see them all.</p>' +
      '<button class="btn btn-secondary btn-sm" type="button" data-clear-filters>Clear filters</button>' +
    '</div>';
  }

  function renderFilterBar() {
    const bar = document.getElementById('filter-bar');
    const chips = document.getElementById('filter-chips');
    if (!bar || !chips) {
      return;
    }

    const parts = [];
    if (DS.state.type !== 'all') {
      parts.push({ key: 'type', label: TYPE_LABELS[DS.state.type] });
    }
    if (DS.state.facet !== 'all') {
      const facet = DS.data.taxonomy.find(function (item) {
        return item.id === DS.state.facet;
      });
      if (facet) {
        parts.push({ key: 'facet', label: facet.label });
      }
    }
    if (DS.state.query.trim()) {
      parts.push({ key: 'query', label: '"' + DS.state.query.trim() + '"' });
    }

    if (!parts.length) {
      bar.hidden = true;
      chips.innerHTML = '';
      return;
    }

    bar.hidden = false;
    chips.innerHTML = parts.map(function (part) {
      return '<span class="filter-chip">' +
        '<span class="chip-key">' + escapeHtml(part.key.toUpperCase()) + '</span>' +
        '<span>' + escapeHtml(part.label) + '</span>' +
        '<button type="button" data-clear-filter="' + escapeHtml(part.key) + '" aria-label="Remove ' + escapeHtml(part.label) + ' filter">' +
          icon('x', 11) +
        '</button>' +
      '</span>';
    }).join('');
  }

  function renderResources() {
    const list = DS.getFiltered();
    const grid = document.getElementById('resource-grid');
    const tableWrap = document.getElementById('resource-table-wrap');
    const tableBody = document.getElementById('resource-table-body');
    const status = document.getElementById('results-status');

    if (!grid || !tableWrap || !tableBody) {
      return;
    }

    if (list.length) {
      grid.innerHTML = list.map(resourceCard).join('');
      tableBody.innerHTML = list.map(tableRow).join('');
    } else {
      grid.innerHTML = emptyState();
      tableBody.innerHTML = '<tr><td colspan="6" class="table-empty">No sample records match the current filters.</td></tr>';
    }

    grid.hidden = DS.state.view !== 'grid';
    tableWrap.hidden = DS.state.view !== 'table';

    document.querySelectorAll('[data-view]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.view === DS.state.view));
    });

    if (status) {
      const total = DS.data.resources.length;
      const noun = total === 1 ? 'record' : 'records';
      status.textContent = 'Showing ' + list.length + ' of ' + total + ' sample ' + noun;
    }

    renderFilterBar();
  }

  function renderFeed() {
    const feed = document.getElementById('activity-feed');
    if (!feed) {
      return;
    }

    feed.innerHTML = DS.data.activity.map(function (item) {
      return '<article class="feed-item">' +
        '<div>' +
          '<div class="feed-item-head">' +
            '<h3 class="feed-name">' + escapeHtml(item.name) + '</h3>' +
            '<span class="feed-status" title="Illustrative sample status">' + escapeHtml(item.status) + '</span>' +
          '</div>' +
          '<p class="feed-desc">' + escapeHtml(item.description) + '</p>' +
        '</div>' +
        '<div class="feed-foot">' +
          '<span>' + escapeHtml(item.category) + '</span>' +
          '<span>' + escapeHtml(item.verified) + '</span>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  DS.render = {
    all: function () {
      renderTypeCounts();
      renderTaxonomy();
      renderFeed();
      renderResources();
    },
    update: renderResources
  };
})();
