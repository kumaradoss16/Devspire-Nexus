const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const file = path.join(root, 'index.html');
let src = fs.readFileSync(file, 'utf8');
const engine = fs.readFileSync(path.join(__dirname, 'landing-engine.js'), 'utf8').trim();

const replaceSection = (startMarker, endMarker, replacement) => {
  const start = src.indexOf(startMarker);
  const end = src.indexOf(endMarker, start + startMarker.length);
  if (start === -1 || end === -1) throw new Error(`markers not found: ${startMarker} / ${endMarker}`);
  src = src.slice(0, start) + replacement + src.slice(end);
};

/* Hero summary text */
const oldSummary = '<span>INDEX 2,340+ REPOSITORIES &amp; RUNTIMES ACCORDING TO RFC-483</span>';
if (!src.includes(oldSummary)) throw new Error('hero summary not found');
src = src.replace(oldSummary, '<span id="catalog-summary-text">Verified AI tools, models &amp; developer resources</span>');

/* Hero search input */
const inputMatch = src.match(/<input class="w-full bg-transparent[^>]*\/>/);
if (!inputMatch) throw new Error('hero search input not found');
src = src.replace(inputMatch[0], '<input class="w-full bg-transparent border-none py-3 text-text-primary font-body-compact text-body-compact placeholder:text-text-muted focus:ring-0 focus:outline-none" id="resource-search" placeholder="Search tools, models, and developer resources..." type="text" aria-label="Search the AI resource catalog" aria-controls="search-results" autocomplete="off" spellcheck="false"/>');

/* Preset chips */
const presetMatch = src.match(/<div class="flex flex-wrap items-center justify-center gap-2 mt-3\.5">[\s\S]*?<\/div>/);
if (!presetMatch) throw new Error('preset row not found');
const presets = `<!-- Interactive Query Pills -->
<div class="flex flex-wrap items-center justify-center gap-2 mt-3.5">
<span class="font-metadata-label text-metadata-label text-text-muted">Query presets:</span>
<button class="preset-chip font-code-badge text-code-badge bg-surface-secondary hover:border-secondary border border-border-subtle text-secondary px-2.5 py-1 rounded transition-colors duration-150" type="button" data-preset="Coding">Coding</button>
<button class="preset-chip font-code-badge text-code-badge bg-surface-secondary hover:border-secondary border border-border-subtle text-secondary px-2.5 py-1 rounded transition-colors duration-150" type="button" data-preset="Vision">Vision</button>
<button class="preset-chip font-code-badge text-code-badge bg-surface-secondary hover:border-secondary border border-border-subtle text-secondary px-2.5 py-1 rounded transition-colors duration-150" type="button" data-preset="RAG">RAG</button>
<button class="preset-chip font-code-badge text-code-badge bg-surface-secondary hover:border-secondary border border-border-subtle text-secondary px-2.5 py-1 rounded transition-colors duration-150" type="button" data-preset="Local runtimes">Local runtimes</button>
<button class="preset-chip font-code-badge text-code-badge bg-surface-secondary hover:border-secondary border border-border-subtle text-secondary px-2.5 py-1 rounded transition-colors duration-150" type="button" data-preset="Agent frameworks">Agent frameworks</button>
</div>`;
src = src.replace(presetMatch[0], presets);

/* Search results panel */
const panel = `<!-- Cross-registry search results -->
<div class="w-full max-w-2xl mx-auto mt-4 text-left" id="search-results" role="region" aria-live="polite" hidden>
<div class="ui-card rounded-xl p-space-md">
<div class="flex items-center justify-between gap-3 mb-2">
<span class="font-metadata-label text-metadata-label text-text-muted" id="search-results-summary"></span>
<button class="font-metadata-label text-metadata-label text-text-muted hover:text-text-primary transition-colors" id="search-results-close" type="button">Close</button>
</div>
<ul class="flex flex-col divide-y divide-border-subtle/60" id="search-results-list"></ul>
<div class="pt-3 mt-3 border-t border-border-subtle flex flex-wrap items-center gap-x-4 gap-y-1" id="search-results-links"></div>
</div>
</div>`;
const heroClose = '</div>\n</div>\n</section>\n<!-- ================= SECTION C';
if (!src.includes(heroClose)) throw new Error('hero close markers not found');
src = src.replace(heroClose, `</div>\n</div>\n${panel}\n</section>\n<!-- ================= SECTION C`);

/* SECTION C — resource type navigation */
replaceSection(
  '<!-- ================= SECTION C: RESOURCE TYPE NAVIGATION ================= -->',
  '<!-- ================= SECTION D: CATEGORY MATRIX ================= -->',
  `<!-- ================= SECTION C: RESOURCE TYPE NAVIGATION ================= -->
<section>
<div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
<!-- Card 1: AI Tools -->
<a class="ui-card group rounded-xl p-space-lg flex flex-col justify-between" href="ai-tools.html">
<div>
<div class="flex items-center justify-between mb-3">
<div class="w-10 h-10 rounded bg-surface-secondary border border-border-subtle flex items-center justify-center text-secondary">
<span class="material-symbols-outlined text-[20px]" data-icon="construction">construction</span>
</div>
<span class="font-code-badge text-code-badge px-2 py-0.5 rounded bg-surface-secondary border border-border-subtle text-text-muted">TYPE::01</span>
</div>
<h2 class="font-title-card text-title-card text-text-primary group-hover:text-secondary transition-colors mb-1">AI Tools</h2>
<p class="font-body-compact text-body-compact text-text-muted mb-4">
              Coding environments, assistants, research engines, media generation, productivity, and automation tools.
            </p>
</div>
<div class="pt-3 border-t border-border-subtle/60 flex items-center justify-between">
<span class="font-code-param text-code-param text-text-primary" id="tools-count">AI Tools registry</span>
<span class="material-symbols-outlined text-[16px] text-text-muted group-hover:translate-x-0.5 group-hover:text-secondary transition-all" data-icon="arrow_forward">arrow_forward</span>
</div>
</a>
<!-- Card 2: AI Models -->
<a class="ui-card group rounded-xl p-space-lg flex flex-col justify-between" href="models.html">
<div>
<div class="flex items-center justify-between mb-3">
<div class="w-10 h-10 rounded bg-surface-secondary border border-border-subtle flex items-center justify-center text-primary-container">
<span class="material-symbols-outlined text-[20px]" data-icon="psychology">psychology</span>
</div>
<span class="font-code-badge text-code-badge px-2 py-0.5 rounded bg-surface-secondary border border-border-subtle text-text-muted">TYPE::02</span>
</div>
<h2 class="font-title-card text-title-card text-text-primary group-hover:text-primary transition-colors mb-1">AI Models</h2>
<p class="font-body-compact text-body-compact text-text-muted mb-4">
              Frontier, reasoning, coding, multimodal, audio, video, and embedding models with stated weights and licensing.
            </p>
</div>
<div class="pt-3 border-t border-border-subtle/60 flex items-center justify-between">
<span class="font-code-param text-code-param text-text-primary" id="models-count">AI Models registry</span>
<span class="material-symbols-outlined text-[16px] text-text-muted group-hover:translate-x-0.5 group-hover:text-primary transition-all" data-icon="arrow_forward">arrow_forward</span>
</div>
</a>
<!-- Card 3: Developer Resources -->
<a class="ui-card group rounded-xl p-space-lg flex flex-col justify-between" href="developer-resources.html">
<div>
<div class="flex items-center justify-between mb-3">
<div class="w-10 h-10 rounded bg-surface-secondary border border-border-subtle flex items-center justify-center text-[#34D399]">
<span class="material-symbols-outlined text-[20px]" data-icon="terminal">terminal</span>
</div>
<span class="font-code-badge text-code-badge px-2 py-0.5 rounded bg-surface-secondary border border-border-subtle text-text-muted">TYPE::03</span>
</div>
<h2 class="font-title-card text-title-card text-text-primary group-hover:text-[#34D399] transition-colors mb-1">Developer Resources</h2>
<p class="font-body-compact text-body-compact text-text-muted mb-4">
              Serving engines, vector databases, agent frameworks, local runtimes, evaluation, and security resources.
            </p>
</div>
<div class="pt-3 border-t border-border-subtle/60 flex items-center justify-between">
<span class="font-code-param text-code-param text-text-primary" id="dev-count">Developer Resources registry</span>
<span class="material-symbols-outlined text-[16px] text-text-muted group-hover:translate-x-0.5 group-hover:text-[#34D399] transition-all" data-icon="arrow_forward">arrow_forward</span>
</div>
</a>
</div>
</section>
`
);

/* SECTION D — live category coverage */
replaceSection(
  '<!-- ================= SECTION D: CATEGORY MATRIX ================= -->',
  '<!-- ================= SECTION E: FEATURED RESOURCES CURATED GRID ================= -->',
  `<!-- ================= SECTION D: CATEGORY COVERAGE ================= -->
<section id="coverage">
<div class="flex items-center justify-between mb-4">
<div>
<h2 class="font-headline-section text-headline-section text-text-primary">Category Coverage</h2>
<p class="font-body-compact text-body-compact text-text-muted">The largest categories in each registry, computed from the catalog datasets.</p>
</div>
<div class="font-code-badge text-code-badge text-text-muted hidden sm:block" id="coverage-total">—</div>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
<div class="ui-card rounded-xl p-space-lg">
<div class="flex items-center justify-between gap-2 mb-3">
<h3 class="font-title-card text-title-card text-text-primary">AI Tools</h3>
<a class="font-code-badge text-code-badge text-secondary hover:underline shrink-0" href="ai-tools.html" id="coverage-tools-all">All categories →</a>
</div>
<ul class="flex flex-col gap-1.5" id="coverage-tools"></ul>
</div>
<div class="ui-card rounded-xl p-space-lg">
<div class="flex items-center justify-between gap-2 mb-3">
<h3 class="font-title-card text-title-card text-text-primary">AI Models</h3>
<a class="font-code-badge text-code-badge text-secondary hover:underline shrink-0" href="models.html" id="coverage-models-all">All categories →</a>
</div>
<ul class="flex flex-col gap-1.5" id="coverage-models"></ul>
</div>
<div class="ui-card rounded-xl p-space-lg">
<div class="flex items-center justify-between gap-2 mb-3">
<h3 class="font-title-card text-title-card text-text-primary">Developer Resources</h3>
<a class="font-code-badge text-code-badge text-secondary hover:underline shrink-0" href="developer-resources.html" id="coverage-dev-all">All categories →</a>
</div>
<ul class="flex flex-col gap-1.5" id="coverage-dev"></ul>
</div>
</div>
</section>
`
);

/* SECTION E — featured records rendered from data */
replaceSection(
  '<!-- ================= SECTION E: FEATURED RESOURCES CURATED GRID ================= -->',
  '<!-- ================= SECTION F: RECENTLY VERIFIED FEED ================= -->',
  `<!-- ================= SECTION E: FEATURED RESOURCES ================= -->
<section>
<div class="flex flex-wrap items-center justify-between mb-4 gap-3">
<div>
<h2 class="font-headline-section text-headline-section text-text-primary">Featured Technical Resources</h2>
<p class="font-body-compact text-body-compact text-text-muted">Selected records from the three registries, showing only fields the source states.</p>
</div>
<div class="flex items-center gap-2">
<span class="font-metadata-label text-metadata-label text-text-muted">VIEW:</span>
<div class="flex items-center bg-surface-secondary border border-border-subtle rounded p-0.5 segmented">
<button class="border border-transparent text-text-primary px-2 py-0.5 rounded font-code-badge text-code-badge flex items-center gap-1" type="button" data-view="grid" aria-pressed="true">
<span class="material-symbols-outlined text-[14px]" data-icon="grid_view">grid_view</span> Grid
            </button>
<button class="border border-transparent text-text-muted hover:text-text-primary px-2 py-0.5 font-code-badge text-code-badge flex items-center gap-1" type="button" data-view="table" aria-pressed="false">
<span class="material-symbols-outlined text-[14px]" data-icon="table_rows">table_rows</span> Dense Table
            </button>
</div>
</div>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-gutter" id="resource-grid"></div>
<div class="resource-table-wrap" id="resource-table-wrap" hidden>
<table class="resource-table">
<thead>
<tr>
<th scope="col">Resource</th>
<th scope="col">Category</th>
<th scope="col">License</th>
<th scope="col">Technical Parameters</th>
<th scope="col">Verified</th>
<th scope="col"><span class="visually-hidden">Actions</span></th>
</tr>
</thead>
<tbody id="resource-table-body"></tbody>
</table>
</div>
</section>
`
);

/* SECTION F — catalog snapshot */
replaceSection(
  '<!-- ================= SECTION F: RECENTLY VERIFIED FEED ================= -->',
  '<!-- ================= SECTION G: DEVELOPER INFRASTRUCTURE FOCUS ================= -->',
  `<!-- ================= SECTION F: CATALOG SNAPSHOT ================= -->
<section class="ui-card rounded-xl p-space-md" id="catalog-snapshot">
<div class="flex flex-wrap items-center justify-between pb-3 mb-3 border-b border-border-subtle gap-2">
<div class="flex items-center gap-2">
<span class="w-2 h-2 rounded-full bg-[#34D399]"></span>
<h3 class="font-title-card text-title-card text-text-primary">Catalog Snapshot</h3>
</div>
<span class="font-code-badge text-code-badge text-text-muted">SOURCE-REPORTED DATES · NO LIVE POLLING</span>
</div>
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" id="snapshot-grid"></div>
</section>
`
);

/* SECTION G — honest developer infrastructure CTA */
replaceSection(
  '<!-- ================= SECTION G: DEVELOPER INFRASTRUCTURE FOCUS ================= -->',
  '</main>',
  `<!-- ================= SECTION G: DEVELOPER INFRASTRUCTURE FOCUS ================= -->
<section class="ui-card rounded-xl p-space-lg relative overflow-hidden">
<div class="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
<div class="max-w-2xl">
<div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-secondary border border-border-subtle font-code-badge text-code-badge text-primary-container mb-3">
<span class="material-symbols-outlined text-[14px]" data-icon="database">database</span>
<span>DEVELOPER INFRASTRUCTURE</span>
</div>
<h2 class="font-headline-section text-headline-section text-text-primary mb-2">
            Build with cataloged AI developer infrastructure
          </h2>
<p class="font-body-compact text-body-compact text-text-muted mb-4">
            Browse serving engines, vector databases, local runtimes, and agent frameworks with licensing and deployment details taken from the source.
          </p>
<div class="flex flex-wrap gap-2">
<span class="tag-chip font-code-badge text-code-badge bg-surface-secondary px-2.5 py-1 rounded border border-border-subtle text-secondary cursor-default">Vector Databases &amp; RAG</span>
<span class="tag-chip font-code-badge text-code-badge bg-surface-secondary px-2.5 py-1 rounded border border-border-subtle text-text-primary cursor-default">Model Serving &amp; Inference</span>
<span class="tag-chip font-code-badge text-code-badge bg-surface-secondary px-2.5 py-1 rounded border border-border-subtle text-secondary cursor-default">Local Runtimes</span>
<span class="tag-chip font-code-badge text-code-badge bg-surface-secondary px-2.5 py-1 rounded border border-border-subtle text-text-primary cursor-default">Agent Frameworks</span>
</div>
</div>
<div class="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto shrink-0">
<a class="btn-amber inline-flex items-center justify-center gap-2 bg-primary-container text-bg-canvas font-body-compact text-body-compact font-semibold px-4 py-2 rounded transition-all duration-150 hover:brightness-110" href="developer-resources.html">
<span class="material-symbols-outlined text-[18px]" data-icon="terminal">terminal</span>
<span>Browse Developer Resources</span>
</a>
<a class="inline-flex items-center justify-center gap-2 bg-surface-secondary border border-border-subtle text-text-primary font-body-compact text-body-compact px-4 py-2 rounded hover:border-secondary hover:text-secondary transition-colors duration-150" href="models.html">
<span class="material-symbols-outlined text-[18px]" data-icon="psychology">psychology</span>
<span>Browse AI Models</span>
</a>
</div>
</div>
</section>
`
);

/* Replace the old micro-interaction script with data + landing engine */
const scriptStart = src.indexOf('<!-- Micro-interactions logic -->');
if (scriptStart === -1) throw new Error('script marker not found');
const scriptEnd = src.indexOf('</script>', scriptStart) + '</script>'.length;
src = src.slice(0, scriptStart) + `<!-- Landing interactions -->
<script src="data/ai-tools.js"></script>
<script src="data/ai-models.js"></script>
<script src="data/developer-resources.js"></script>
<script>
${engine}
</script>` + src.slice(scriptEnd);

fs.writeFileSync(file, src);
console.log('rewritten index.html:', src.length, 'bytes');
console.log('remaining href="#":', (src.match(/href="#"/g) || []).length);
