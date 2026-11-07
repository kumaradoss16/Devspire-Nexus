/* DevSpire Nexus: Terminal Command Engine (Requirement 7)
   Safe, sandboxed, allowlist-only command console querying real catalog datasets
   and browser-side user state (Collections & Recently Viewed). */
(() => {
  'use strict';

  function sanitize(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function getRegistries() {
    return [
      { key: 'tools', label: 'AI Tools', page: 'ai-tools.html', type: 'tool', items: window.AI_TOOLS || [] },
      { key: 'models', label: 'AI Models', page: 'models.html', type: 'model', items: window.AI_MODELS || [] },
      { key: 'developer', label: 'Developer Resources', page: 'developer-resources.html', type: 'resource', items: window.DEVELOPER_RESOURCES || [] }
    ];
  }

  function findById(id) {
    if (!id) return null;
    const cleanId = String(id).trim().toLowerCase();
    for (const reg of getRegistries()) {
      const match = reg.items.find((r) => String(r.id).toLowerCase() === cleanId);
      if (match) return { reg, record: match };
    }
    return null;
  }

  function createTerminal(options = {}) {
    const outputEl = options.outputElement;
    const inputEl = options.inputElement;
    const promptText = options.prompt || 'devspire@nexus:~$';

    const history = [];
    let historyIndex = -1;

    function line(text, type = 'normal', isHtml = false) {
      if (!outputEl) return;
      const div = document.createElement('div');
      div.className = `terminal-line terminal-${type} font-mono text-[13px] leading-relaxed my-0.5`;
      if (type === 'err') div.classList.add('text-status-error');
      else if (type === 'ok') div.classList.add('text-tertiary');
      else if (type === 'head') div.classList.add('text-primary', 'font-semibold', 'mt-2', 'mb-0.5');
      else if (type === 'muted') div.classList.add('text-text-muted', 'text-[12px]');
      else if (type === 'prompt') div.classList.add('text-secondary', 'font-semibold', 'mt-1.5');
      else div.classList.add('text-text-primary');

      if (isHtml) div.innerHTML = text;
      else div.textContent = text;
      outputEl.appendChild(div);
      outputEl.scrollTop = outputEl.scrollHeight;
    }

    function blank() {
      line('', 'normal');
    }

    const COMMAND_NAMES = [
      'help', 'clear', 'version', 'about', 'stats',
      'search', 'categories', 'info', 'quickstart', 'recent',
      'collection', 'new', 'verified', 'open', 'theme'
    ];

    const COMMANDS = {
      help() {
        line('DevSpire Nexus Catalog Terminal: Available Commands:', 'head');
        line('  help                          Show this command usage reference.');
        line('  clear                         Clear terminal output screen.');
        line('  version                       Display application version and catalog status.');
        line('  about                         About DevSpire Nexus intelligence directory.');
        line('  stats [tools|models|developer] Display resource counts and metrics.');
        line('  search [registry] <query>     Search catalog records by keyword.');
        line('  categories [registry]         List category coverage and record counts.');
        line('  info <resource-id>            Inspect detailed attributes for a resource.');
        line('  quickstart <resource-id>      Show installation, docs, and code example.');
        line('  recent                        Display your recently viewed resources.');
        line('  collection                    Display your saved personal collection.');
        line('  new                           List newly added resources.');
        line('  verified                      List recently verified resources.');
        line('  open <resource-id>            Navigate to the resource detail page.');
        line('  theme                         Show current design and theme tokens.');
        blank();
        line('Keyboard: [↑/↓] Command history · [Tab] Autocomplete · [Ctrl+L] Clear', 'muted');
        line('Read-only safe environment. Dynamic execution is disabled.', 'muted');
      },

      clear() {
        if (outputEl) outputEl.innerHTML = '';
      },

      version() {
        line('DevSpire Nexus v1.0.0 (Build 2026-11-06)', 'ok');
        line('Architecture: Pure client-side static intelligence directory with verified offline assets.');
      },

      about() {
        line('DevSpire Nexus | AI Intelligence Directory', 'head');
        line('Parent Brand: DevSpireHub.com');
        line('Tagline: Discover. Connect. Build.');
        line('Maintains three verified independent registries:');
        line('  1. AI Tools: End-user software and assistant applications.');
        line('  2. AI Models: Foundation models, LLMs, vision, and audio models.');
        line('  3. Developer Resources: Frameworks, vector databases, runtimes, and SDKs.');
      },

      stats(args) {
        const regs = getRegistries();
        const target = (args[0] || '').toLowerCase();
        if (target) {
          const match = regs.find((r) => r.key === target || r.key.startsWith(target));
          if (!match) {
            line(`Unknown registry "${args[0]}". Choose from: tools, models, developer.`, 'err');
            return;
          }
          line(`${match.label} Statistics:`, 'head');
          const cats = new Set(match.items.map((x) => x.category).filter(Boolean)).size;
          line(`  Total Records: ${match.items.length}`);
          line(`  Categories:    ${cats}`);
          return;
        }

        const total = regs.reduce((sum, r) => sum + r.items.length, 0);
        line('DevSpire Nexus Resource Statistics', 'head');
        regs.forEach((r) => {
          const cats = new Set(r.items.map((x) => x.category).filter(Boolean)).size;
          line(`  ${r.label}: ${r.items.length} records (${cats} categories)`);
        });
        line(`  Total Catalog Resources: ${total}`, 'ok');
      },

      search(args) {
        if (!args.length) {
          line('Usage: search [tools|models|developer] <query>', 'err');
          return;
        }

        let targetRegs = getRegistries();
        let queryArgs = args;

        const first = args[0].toLowerCase();
        const specificReg = targetRegs.find((r) => r.key === first || r.key.startsWith(first));
        if (specificReg) {
          targetRegs = [specificReg];
          queryArgs = args.slice(1);
        }

        const query = queryArgs.join(' ').trim().toLowerCase();
        if (query.length < 2) {
          line('Search query must be at least 2 characters long.', 'err');
          return;
        }

        const hits = [];
        targetRegs.forEach((reg) => {
          reg.items.forEach((item) => {
            const haystack = [
              item.name, item.category, item.description,
              (item.tags || []).join(' '), item.id
            ].join(' ').toLowerCase();

            if (haystack.includes(query)) {
              hits.push({ reg, item });
            }
          });
        });

        if (!hits.length) {
          line(`No records matched "${query}".`, 'err');
          return;
        }

        line(`Found ${hits.length} match${hits.length === 1 ? '' : 'es'} for "${query}":`, 'head');
        hits.slice(0, 15).forEach(({ reg, item }) => {
          const link = `<a class="text-secondary hover:underline" href="${reg.page}#${reg.type}/${encodeURIComponent(item.id)}">${sanitize(item.name)}</a>`;
          const cat = sanitize(item.category || 'General');
          const meta = `[${reg.label} · ${cat} · ID: ${item.id}]`;
          line(`  ${link} | ${meta}`, 'normal', true);
        });

        if (hits.length > 15) {
          line(`  ... and ${hits.length - 15} more. Narrow your search query to see specific results.`, 'muted');
        }
      },

      categories(args) {
        let regs = getRegistries();
        const target = (args[0] || '').toLowerCase();
        if (target) {
          const match = regs.find((r) => r.key === target || r.key.startsWith(target));
          if (!match) {
            line(`Unknown registry "${args[0]}". Choose from: tools, models, developer.`, 'err');
            return;
          }
          regs = [match];
        }

        regs.forEach((reg, idx) => {
          if (idx > 0) blank();
          const counts = {};
          reg.items.forEach((r) => {
            if (r.category) counts[r.category] = (counts[r.category] || 0) + 1;
          });
          const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
          line(`${reg.label} (${sorted.length} categories):`, 'head');
          sorted.forEach((cat) => {
            line(`  ${cat.padEnd(35, ' ')} ${counts[cat]} items`);
          });
        });
      },

      info(args) {
        const id = args[0];
        if (!id) {
          line('Usage: info <resource-id>', 'err');
          return;
        }
        const hit = findById(id);
        if (!hit) {
          line(`Resource with ID "${id}" was not found. Use 'search <term>' to look up IDs.`, 'err');
          return;
        }
        const { reg, record: r } = hit;
        line(`${r.name} (${reg.label})`, 'head');
        if (r.category) line(`  Category:    ${r.category}`);
        if (r.org || r.publisher) line(`  Publisher:   ${r.org || r.publisher}`);
        if (r.pricing) line(`  Pricing:     ${r.pricing}`);
        if (r.license) line(`  License:     ${r.license}`);
        if (r.official_url) line(`  Website:     ${r.official_url}`);
        if (r.description) line(`  Description: ${r.description}`);
        if (Array.isArray(r.tags) && r.tags.length) line(`  Tags:        ${r.tags.join(', ')}`);
        line(`  Status:      ${r.status || 'Verified'} (${r.verified || 'Recorded'})`);
        line(`  Deep Link:   ${reg.page}#${reg.type}/${encodeURIComponent(r.id)}`, 'muted');
      },
      quickstart(args) {
        const id = (args[0] || '').trim().toLowerCase();
        if (!id) {
          line('Usage: quickstart <resource-id>', 'err');
          line('Example: quickstart langchain', 'muted');
          return;
        }
        const devReg = getRegistries().find((r) => r.key === 'developer');
        const match = devReg ? devReg.items.find((r) => String(r.id).toLowerCase() === id) : null;
        if (!match) {
          const anyMatch = findById(id);
          if (anyMatch && anyMatch.reg.key !== 'developer') {
            line('"' + id + '" is in ' + anyMatch.reg.label + '. Quick Start applies to Developer Resources.', 'err');
            line("Type 'info " + id + "' to inspect attributes or 'open " + id + "' to view the page.", 'muted');
            return;
          }
          line('Resource "' + id + '" not found in Developer Resources catalog.', 'err');
          line("Type 'search developer <keyword>' to locate resources.", 'muted');
          return;
        }
        const qs = match.developer_quick_start;
        line('Developer Quick Start: ' + match.name + ' [' + match.category + ']', 'head');
        if (qs && qs.available) {
          line('Package: ' + (qs.package_name || match.name) + ' · Status: Verified', 'ok');
          blank();
          line('Installation Commands:', 'prompt');
          (qs.installation || []).forEach((inst) => {
            line('  $ ' + inst.command + '   (' + (inst.label || inst.pm) + ')');
          });
          blank();
          line('Official Documentation:', 'prompt');
          line('  ' + (qs.documentation ? qs.documentation.url : (match.documentation_url || match.official_url)));
          if (qs.github && qs.github.url) {
            line('GitHub Repository:', 'prompt');
            line('  ' + qs.github.url + ' (License: ' + (qs.github.license || match.license_short || 'Open Source') + ')');
          }
          blank();
          line('Supported Languages:', 'prompt');
          const langs = (qs.supported_languages || []).map((l) => l.language + ' [' + l.support_type.replace('_', ' ') + ']').join(', ');
          line('  ' + (langs || 'See documentation'));
          if ((qs.examples || []).length) {
            const ex = qs.examples[0];
            blank();
            line('Basic Usage Example [' + (ex.label || ex.language) + ']: ' + ex.title, 'prompt');
            if (ex.prerequisites && ex.prerequisites.length) {
              line('  # Prerequisites: ' + ex.prerequisites.join(' · '), 'muted');
            }
            if (ex.env_vars && ex.env_vars.length) {
              line('  # Required Env: ' + ex.env_vars.join(', '), 'muted');
            }
            blank();
            ex.code.split('\n').forEach((codeLine) => {
              line('  ' + codeLine);
            });
            if (ex.expected_output) {
              blank();
              line('Expected Output:', 'muted');
              ex.expected_output.split('\n').forEach((outLine) => {
                line('  ' + outLine, 'ok');
              });
            }
          }
          blank();
          line("Type 'open " + match.id + "' to view the full interactive reference.", 'muted');
        } else {
          line('Quick Start reference is awaiting verification for "' + match.name + '".', 'muted');
          if (match.official_url) line('  Website: ' + match.official_url);
          if (match.documentation_url) line('  Docs:    ' + match.documentation_url);
          if (match.repository_url) line('  Repo:    ' + match.repository_url);
          blank();
          line("Type 'open " + match.id + "' to view catalog details.", 'muted');
        }
      },


      show(args) {
        COMMANDS.info(args);
      },

      recent() {
        if (!window.RecentlyViewed) {
          line('Recently Viewed service not loaded.', 'err');
          return;
        }
        const resolved = window.RecentlyViewed.getResolved();
        if (!resolved.length) {
          line('No recently viewed resources yet. Open any resource card or detail view to track history.', 'muted');
          return;
        }
        line(`Recently Viewed Resources (${resolved.length} items):`, 'head');
        resolved.forEach(({ type, id, lastViewedAt, record }) => {
          const ago = window.RecentlyViewed.timeAgo(lastViewedAt);
          const page = type === 'tool' ? 'ai-tools.html' : type === 'model' ? 'models.html' : 'developer-resources.html';
          const link = `<a class="text-secondary hover:underline" href="${page}#${type}/${encodeURIComponent(id)}">${sanitize(record.name)}</a>`;
          line(`  ${link} · [${type}] · ${ago}`, 'normal', true);
        });
      },

      collection() {
        if (!window.DevSpireCollections) {
          line('Collections service not loaded.', 'err');
          return;
        }
        const state = window.DevSpireCollections.load();
        const bookmarks = state.bookmarks || [];
        if (!bookmarks.length) {
          line('Your saved collection is empty. Click the bookmark icon on any resource card to save it.', 'muted');
          return;
        }
        line(`My Collection (${bookmarks.length} saved resources):`, 'head');
        bookmarks.forEach((b) => {
          const rec = window.DevSpireCollections.resolve(b.resourceType, b.resourceId);
          const name = rec ? rec.name : b.resourceId;
          const page = b.resourceType === 'tool' ? 'ai-tools.html' : b.resourceType === 'model' ? 'models.html' : 'developer-resources.html';
          const link = `<a class="text-secondary hover:underline" href="${page}#${b.resourceType}/${encodeURIComponent(b.resourceId)}">${sanitize(name)}</a>`;
          line(`  ${link} · [${b.resourceType}]`, 'normal', true);
        });
      },

      new() {
        const regs = getRegistries();
        const newItems = [];
        regs.forEach((reg) => {
          reg.items.forEach((item) => {
            if (window.ResourceStatus && window.ResourceStatus.isNewlyAdded(item)) {
              newItems.push({ reg, item });
            }
          });
        });

        line(`Newly Added Resources (${newItems.length} items):`, 'head');
        newItems.slice(0, 15).forEach(({ reg, item }) => {
          const link = `<a class="text-secondary hover:underline" href="${reg.page}#${reg.type}/${encodeURIComponent(item.id)}">${sanitize(item.name)}</a>`;
          line(`  ✨ ${link} · ${reg.label} · ${sanitize(item.category || '')}`, 'normal', true);
        });
        if (newItems.length > 15) {
          line(`  ... and ${newItems.length - 15} more. Visit the directory pages to browse all.`, 'muted');
        }
      },

      verified() {
        const regs = getRegistries();
        const verifiedItems = [];
        regs.forEach((reg) => {
          reg.items.forEach((item) => {
            if (window.ResourceStatus && window.ResourceStatus.isRecentlyVerified(item)) {
              verifiedItems.push({ reg, item });
            }
          });
        });

        line(`Recently Verified Resources (${verifiedItems.length} items):`, 'head');
        verifiedItems.slice(0, 15).forEach(({ reg, item }) => {
          const link = `<a class="text-secondary hover:underline" href="${reg.page}#${reg.type}/${encodeURIComponent(item.id)}">${sanitize(item.name)}</a>`;
          line(`  ✓ ${link} · ${reg.label} · Verified ${item.verified || ''}`, 'normal', true);
        });
        if (verifiedItems.length > 15) {
          line(`  ... and ${verifiedItems.length - 15} more.`, 'muted');
        }
      },

      open(args) {
        const id = args[0];
        if (!id) {
          line('Usage: open <resource-id>', 'err');
          return;
        }
        const hit = findById(id);
        if (!hit) {
          line(`Resource "${id}" not found.`, 'err');
          return;
        }
        const targetUrl = `${hit.reg.page}#${hit.reg.type}/${encodeURIComponent(hit.record.id)}`;
        line(`Navigating to ${hit.record.name}...`, 'ok');
        window.location.href = targetUrl;
      },

      theme() {
        line('Theme Configuration: Dark Theme (Default)', 'head');
        line('  Background Canvas: #090D12');
        line('  Surface Card:      #17212B');
        line('  Primary Accent:    #f59e0b (Amber)');
        line('  Secondary Accent:  #7bd0ff (Cyan)');
        line('  Status OK:         #4de6aa (Emerald)');
        line('  Status Warning:    #FBBF24 (Gold)');
        line('  Status Error:      #F87171 (Coral)');
      }
    };

    function execute(rawCmd) {
      const trimmed = String(rawCmd || '').trim();
      if (!trimmed) return;

      line(`${promptText} ${trimmed}`, 'prompt');
      history.push(trimmed);
      historyIndex = history.length;

      const parts = trimmed.split(/\s+/);
      const cmdName = parts[0].toLowerCase();
      const args = parts.slice(1);

      if (Object.prototype.hasOwnProperty.call(COMMANDS, cmdName)) {
        try {
          COMMANDS[cmdName](args);
        } catch (err) {
          line(`Command execution error: ${err.message}`, 'err');
        }
      } else {
        line(`Unknown command "${cmdName}". Type 'help' for the list of available commands.`, 'err');
      }
      blank();
    }

    if (inputEl) {
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const val = inputEl.value;
          inputEl.value = '';
          execute(val);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (historyIndex > 0) {
            historyIndex--;
            inputEl.value = history[historyIndex];
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (historyIndex < history.length - 1) {
            historyIndex++;
            inputEl.value = history[historyIndex];
          } else {
            historyIndex = history.length;
            inputEl.value = '';
          }
        } else if (e.key === 'Tab') {
          e.preventDefault();
          const val = inputEl.value.trim().toLowerCase();
          if (!val) return;
          const match = COMMAND_NAMES.find((c) => c.startsWith(val));
          if (match) {
            inputEl.value = match + ' ';
          }
        } else if (e.key === 'l' && e.ctrlKey) {
          e.preventDefault();
          COMMANDS.clear();
        }
      });
    }

    return { execute, line, clear: COMMANDS.clear, COMMANDS };
  }

  window.NexusTerminalEngine = {
    create: createTerminal,
    getRegistries,
    findById
  };
})();
