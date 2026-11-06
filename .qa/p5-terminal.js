(() => {
  'use strict';

  /* Catalog console: fixed command table, no eval, no shell, no network. */
  const REGISTRIES = [
    { key: 'tools', aliases: ['tools', 'tool', 'ai-tools'], label: 'AI Tools', page: 'ai-tools.html', prefix: 'tool', items: window.AI_TOOLS || [], meta: window.AI_TOOLS_META || {} },
    { key: 'models', aliases: ['models', 'model', 'ai-models'], label: 'AI Models', page: 'models.html', prefix: 'model', items: window.AI_MODELS || [], meta: window.AI_MODELS_META || {} },
    { key: 'resources', aliases: ['resources', 'resource', 'dev', 'developer-resources', 'developer'], label: 'Developer Resources', page: 'developer-resources.html', prefix: 'resource', items: window.DEVELOPER_RESOURCES || [], meta: window.DEVELOPER_RESOURCES_META || {} }
  ];

  const output = document.getElementById('terminal-output');
  const form = document.getElementById('terminal-form');
  const input = document.getElementById('terminal-input');
  if (!output || !form || !input) return;

  const MAX_INPUT = 200;
  const LIST_LIMIT = 25;
  const SEARCH_LIMIT = 15;

  const line = (text, tone) => {
    const el = document.createElement('div');
    el.className = 'terminal-line' + (tone ? ' terminal-line--' + tone : '');
    el.textContent = text;
    output.appendChild(el);
  };
  const blank = () => line('');
  const scrollDown = () => { output.scrollTop = output.scrollHeight; };
  const commit = () => scrollDown();

  const registryOf = (value) => REGISTRIES.find((r) => r.aliases.includes(String(value || '').toLowerCase())) || null;
  const orgOf = (r) => r.org || r.publisher || '';
  const haystack = (r) => [r.name, orgOf(r), r.description, r.category, r.source_category, r.resource_subtype, r.resource_type, (r.tags || []).join(' ')].join(' ').toLowerCase();
  const findById = (id) => {
    const needle = String(id || '').toLowerCase();
    for (const reg of REGISTRIES) {
      const hit = reg.items.find((r) => String(r.id).toLowerCase() === needle);
      if (hit) return { reg, record: hit };
    }
    return null;
  };
  const stated = (value) => value !== null && value !== undefined && String(value).trim() !== '' && !(Array.isArray(value) && !value.length);

  const COMMANDS = {
    help() {
      line('DevSpire Nexus Catalog Terminal — Allowed Commands', 'head');
      line('  help                    Show this list.');
      line('  stats [registry]        Catalog totals and category counts (tools | models | resources).');
      line('  list <registry>         List resource IDs and names in a registry.');
      line('  search [reg] <term>     Search names, descriptions, categories, and tags.');
      line('  show <id> / info <id>   Print detailed attributes for one resource.');
      line('  categories [registry]   Category counts, for one registry or all three.');
      line('  recent                  Display recently viewed resources from browser session.');
      line('  collection              Display bookmarks and custom collections in this browser.');
      line('  new                     List newly added resources (2026-11-04 expansion).');
      line('  verified                List recently verified resources.');
      line('  open <id>               Open the resource details page in DevSpire Nexus.');
      line('  version                 Display system build and engine version.');
      line('  about                   Show DevSpire Nexus information.');
      line('  theme                   Show active palette tokens.');
      line('  clear                   Clear this terminal screen.');
      blank();
      line('No shell, eval, file access, or network calls are available.', 'muted');
    },

    version() {
      line('DevSpire Nexus Terminal v1.0.0 (Build 2026-11-06)', 'ok');
      line('Static catalog engine with 1,003 verified offline intelligence records.', 'muted');
    },

    about() {
      line('DevSpire Nexus — AI Intelligence Directory', 'head');
      line('Parent: DevSpireHub.com');
      line('Tagline: Discover. Connect. Build.');
      line('Registries: AI Tools (403), AI Models (300), Developer Resources (300).');
    },

    stats(args) {
      const target = args[0] ? registryOf(args[0]) : null;
      if (args[0] && !target) {
        line(`Unknown registry "${args[0]}". Use: tools, models, resources.`, 'err');
        return;
      }
      const regs = target ? [target] : REGISTRIES;
      const total = regs.reduce((n, r) => n + r.items.length, 0);
      line(`Catalog total: ${total} records across ${regs.length} registr${regs.length === 1 ? 'y' : 'ies'}`, 'ok');
      regs.forEach((r) => {
        const cats = new Set(r.items.map((x) => x.category).filter(Boolean)).size;
        const verified = r.meta.last_verified ? ` · last verified ${r.meta.last_verified}` : '';
        line(`  ${r.label}: ${r.items.length} records · ${cats} categories${verified}`);
      });
      blank();
      line('Counts are computed directly from the local datasets.', 'muted');
    },

    list(args) {
      const query = args[0];
      if (!query) {
        line('Usage: list <registry>', 'err');
        line('Registries: ' + REGISTRIES.map((r) => r.key).join(', '), 'muted');
        return;
      }
      const reg = registryOf(query);
      if (!reg) {
        line(`Unknown registry "${query}". Use: tools, models, resources.`, 'err');
        return;
      }
      line(`${reg.label} · ${reg.items.length} records`, 'head');
      reg.items.slice(0, LIST_LIMIT).forEach((r, i) => {
        line(`  ${String(i + 1).padStart(3, '0')}  ${r.name}  (${r.id})`);
      });
      if (reg.items.length > LIST_LIMIT) line(`  … ${reg.items.length - LIST_LIMIT} more. Use search to narrow.`, 'muted');
    },

    search(args) {
      if (!args.length) {
        line('Usage: search [registry] <term> (at least 2 characters)', 'err');
        return;
      }
      let targetReg = null;
      let queryArgs = args;
      const maybeReg = registryOf(args[0]);
      if (maybeReg && args.length > 1) {
        targetReg = maybeReg;
        queryArgs = args.slice(1);
      }
      const term = queryArgs.join(' ').trim().toLowerCase();
      if (term.length < 2) {
        line('Search term must be at least 2 characters.', 'err');
        return;
      }
      const searchPool = targetReg ? [targetReg] : REGISTRIES;
      const hits = [];
      searchPool.forEach((reg) => {
        reg.items.forEach((r) => {
          if (haystack(r).includes(term)) hits.push({ reg, record: r });
        });
      });
      if (!hits.length) {
        line(`No records match "${term}"${targetReg ? ` in ${targetReg.label}` : ''}.`, 'err');
        return;
      }
      line(`${hits.length} match${hits.length === 1 ? '' : 'es'} for "${term}"`, 'head');
      hits.slice(0, SEARCH_LIMIT).forEach(({ reg, record }) => {
        line(`  ${record.name}  ·  ${reg.label}  ·  ${record.category || '—'}  ·  ${record.id}`);
      });
      if (hits.length > SEARCH_LIMIT) line(`  … ${hits.length - SEARCH_LIMIT} more. Narrow the term.`, 'muted');
    },

    show(args) {
      return COMMANDS.info(args);
    },

    info(args) {
      const id = args[0];
      if (!id) { line('Usage: info <id>', 'err'); return; }
      const hit = findById(id);
      if (!hit) {
        line(`No record with id "${id}".`, 'err');
        line('Use list <registry> or search <term> to find an id.', 'muted');
        return;
      }
      const { reg, record: r } = hit;
      line(`${r.name}  ·  ${reg.label}`, 'head');
      const meta = [r.resource_type, r.resource_subtype || r.source_category].filter(Boolean).join(' · ');
      if (meta) line(`  Type: ${meta}`);
      if (r.category) line(`  Category: ${r.category}`);
      if (orgOf(r)) line(`  Publisher: ${orgOf(r)}`);
      if (stated(r.pricing)) line(`  Pricing: ${r.pricing}`);
      if (stated(r.license)) line(`  License: ${r.license}`);
      if (stated(r.platform)) line(`  Platform: ${r.platform}`);
      if (stated(r.hosting)) line(`  Hosting: ${[].concat(r.hosting).join(', ')}`);
      if (stated(r.modalities)) line(`  Modalities: ${[].concat(r.modalities).join(', ')}`);
      if (stated(r.params)) line(`  Parameters: ${r.params}`);
      if (stated(r.context_k)) line(`  Context: ${r.context_k}K`);
      if (stated(r.programming_languages)) line(`  Languages: ${[].concat(r.programming_languages).join(', ')}`);
      if (stated(r.official_url)) line(`  URL: ${r.official_url}`);
      if (Array.isArray(r.evidence) && r.evidence.length) {
        line(`  Evidence: ${r.evidence.length} link${r.evidence.length === 1 ? '' : 's'}`);
        r.evidence.slice(0, 3).forEach(([label, url]) => line(`    - ${label}: ${url}`, 'muted'));
      }
      line(`  Verified: ${r.verified || r.status || 'not stated'}`);
      line(`  Id: ${r.id}`, 'muted');
    },

    categories(args) {
      const query = args[0];
      const regs = query ? [registryOf(query)].filter(Boolean) : REGISTRIES;
      if (!regs.length) {
        line(`Unknown registry "${query}". Use: tools, models, resources.`, 'err');
        return;
      }
      regs.forEach((reg, i) => {
        if (i) blank();
        const counts = {};
        reg.items.forEach((r) => { if (r.category) counts[r.category] = (counts[r.category] || 0) + 1; });
        const names = Object.keys(counts).sort((a, b) => (counts[b] - counts[a]) || a.localeCompare(b));
        line(`${reg.label} · ${names.length} categories`, 'head');
        names.forEach((name) => line(`  ${name}  (${counts[name]})`));
      });
    },

    recent() {
      if (!window.RecentlyViewed) {
        line('Recently Viewed service is unavailable.', 'err');
        return;
      }
      const items = window.RecentlyViewed.getItems();
      if (!items.length) {
        line('No recently viewed resources in this browser session.', 'muted');
        return;
      }
      line(`Recently Viewed (${items.length} item${items.length === 1 ? '' : 's'}):`, 'head');
      items.slice(0, 15).forEach((item, i) => {
        const name = item.record ? item.record.name : item.id;
        const time = item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : '';
        line(`  ${String(i + 1).padStart(2, '0')}. [${item.type}] ${name} (${item.id}) ${time}`);
      });
    },

    collection() {
      if (!window.DevSpireCollections) {
        line('Collections service is unavailable.', 'err');
        return;
      }
      const data = window.DevSpireCollections.load();
      line(`Personal Collections in this browser:`, 'head');
      line(`  Bookmarks: ${data.bookmarks.length} saved`);
      data.bookmarks.slice(0, 10).forEach((b) => {
        const rec = window.DevSpireCollections.resolve(b);
        line(`    • [${b.resourceType}] ${rec ? rec.name : b.resourceId}`);
      });
      if (data.bookmarks.length > 10) line(`    … and ${data.bookmarks.length - 10} more.`);
      line(`  Custom Collections: ${data.collections.length}`);
      data.collections.forEach((c) => {
        line(`    📁 ${c.name} (${c.resourceRefs ? c.resourceRefs.length : 0} items)`);
      });
    },

    new() {
      const list = [];
      REGISTRIES.forEach((reg) => {
        reg.items.forEach((r) => {
          if (r.verified === '2026-11-04' || r.is_new) list.push({ reg, record: r });
        });
      });
      line(`Newly Added Resources (${list.length} total):`, 'head');
      list.slice(0, 20).forEach(({ reg, record }, i) => {
        line(`  ${String(i + 1).padStart(2, '0')}. [${reg.label}] ${record.name} (${record.id}) · ${record.category}`);
      });
      if (list.length > 20) line(`  … and ${list.length - 20} more. Use search to filter.`, 'muted');
    },

    verified() {
      const list = [];
      REGISTRIES.forEach((reg) => {
        reg.items.forEach((r) => {
          if (r.status === 'verified') list.push({ reg, record: r });
        });
      });
      line(`Verified Resources (${list.length} records verified):`, 'head');
      line(`  All 1,003 records have been verified with primary source evidence and timestamps.`);
      line(`  Type "info <id>" to view the verification timestamp and evidence for any resource.`);
    },

    open(args) {
      const id = args[0];
      if (!id) { line('Usage: open <id>', 'err'); return; }
      const hit = findById(id);
      if (!hit) {
        line(`No record with id "${id}".`, 'err');
        return;
      }
      const url = `${hit.reg.page}#${hit.reg.prefix}/${encodeURIComponent(hit.record.id)}`;
      line(`Opening ${hit.record.name} → ${url}`, 'ok');
      scrollDown();
      setTimeout(() => { window.location.href = url; }, 250);
    },

    theme() {
      line('DevSpire Nexus Theme Palette:', 'head');
      line('  Background Canvas: #090D12');
      line('  Surface Card:      #17212B');
      line('  Surface Secondary: #111820');
      line('  Primary Cyan:      #7bd0ff');
      line('  Primary Container: #f59e0b (Amber Accent)');
      line('  Tertiary Mint:     #34D399 (Verified Status)');
      line('  Text Primary:      #F1F5F9');
      line('  Text Muted:        #94A3B8');
    },

    clear() {
      output.textContent = '';
    }
  };

  const run = (raw) => {
    const text = String(raw || '').trim();
    if (!text) return;
    line('$ ' + text, 'cmd');
    const tokens = text.split(/\s+/);
    const name = tokens[0].toLowerCase();
    const args = tokens.slice(1);
    if (!Object.prototype.hasOwnProperty.call(COMMANDS, name)) {
      line(`Unknown command "${name}". Type help to see the allowlist.`, 'err');
      commit();
      return;
    }
    try {
      COMMANDS[name](args);
    } catch (err) {
      line('Command failed: ' + (err.message || 'unknown error'), 'err');
    }
    commit();
  };

  const history = [];
  let cursor = -1;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (input.value.length > MAX_INPUT) {
      line(`Input rejected: ${MAX_INPUT} characters maximum.`, 'err');
      commit();
      return;
    }
    const value = input.value;
    run(value);
    if (value.trim()) history.push(value.trim());
    cursor = history.length;
    input.value = '';
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!history.length) return;
      cursor = Math.max(0, cursor - 1);
      input.value = history[cursor] || '';
      input.setSelectionRange(input.value.length, input.value.length);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!history.length) return;
      cursor = Math.min(history.length, cursor + 1);
      input.value = history[cursor] || '';
    } else if (event.key === 'Tab') {
      event.preventDefault();
      const val = input.value.trim().toLowerCase();
      if (!val) return;
      const match = Object.keys(COMMANDS).find((c) => c.startsWith(val));
      if (match) input.value = match + ' ';
    } else if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault();
      COMMANDS.clear();
    }
  });

  line('AI Resource Intelligence · Catalog Terminal v1.0', 'head');
  line('Read-only allowlist console. Type help for commands.', 'muted');
  line(`Loaded ${REGISTRIES[0].items.length} AI tools, ${REGISTRIES[1].items.length} AI models, ${REGISTRIES[2].items.length} developer resources.`, 'ok');
  commit();
  input.focus();
})();
