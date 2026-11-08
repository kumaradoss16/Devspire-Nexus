/* Canonical navigation, footer, metadata and accessibility shell.
   Every page is post-processed through apply() so generated pages cannot drift. */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const EXT = {
  home: 'https://devspirehub.com/',
  about: 'https://devspirehub.com/Website/about/about.html',
  contact: 'https://devspirehub.com/Website/contact/index.html',
  privacy: 'https://devspirehub.com/Website/privacy/index.html',
  learning: 'https://devspirehub.com/Resources/digital-resources/digital-resources-hub.html'
};

const NAV = [
  ['index.html', 'Discover', 'discover'],
  ['ai-tools.html', 'AI Tools', 'tools'],
  ['models.html', 'AI Models', 'models'],
  ['developer-resources.html', 'Developer Resources', 'dev'],
  ['collections.html', 'My Collections', 'collections'],
  ['about.html', 'About', 'about']
];

const MUTED = 'text-text-muted dark:text-text-muted font-body-compact text-body-compact hover:text-text-primary dark:hover:text-text-primary transition-colors whitespace-nowrap';
const CURRENT = 'text-primary dark:text-primary font-body-compact text-body-compact border-b-2 border-primary dark:border-primary pb-1 whitespace-nowrap';
const FOOT_LINK = 'text-text-muted dark:text-text-muted font-metadata-label text-metadata-label hover:text-text-primary dark:hover:text-text-primary transition-colors';

const esc = (value) => String(value == null ? '' : value);

const navLink = (href, label, isActive) => isActive
  ? `<a class="${CURRENT}" href="${href}" aria-current="page">${label}</a>`
  : `<a class="${MUTED}" href="${href}">${label}</a>`;

const header = (active, quickFind) => {
  const activeKey = NAV.find(([, , key]) => key === active) ? active : '';
  return `<header class="w-full border-b border-border-subtle dark:border-border-subtle sticky top-0 z-50 site-header">
<div class="flex justify-between items-center w-full px-4 sm:px-gutter-lg max-w-[1360px] mx-auto h-14">
<div class="flex items-center gap-2 sm:gap-space-lg min-w-0">
<a class="font-title-card text-text-primary dark:text-text-primary tracking-tight font-semibold flex items-center gap-2 sm:gap-space-sm whitespace-nowrap text-[15px] sm:text-title-card shrink-0" href="index.html">
<img src="assets/img/devspirehub-gears-128.png" alt="DevSpire Nexus logo" class="brand-mark w-7 h-7 rounded-lg object-cover shrink-0" width="28" height="28"/>
<span class="flex flex-col leading-tight min-w-0"><span class="hidden sm:inline">DevSpire Nexus</span><span class="hidden xl:inline font-metadata-label text-[10px] font-normal tracking-[0.14em] text-text-muted uppercase">AI Intelligence Directory</span></span>
</a>
<nav class="hidden lg:flex items-center gap-3 xl:gap-space-md ml-2 xl:ml-space-md" aria-label="Primary">
${NAV.map(([href, label, key]) => navLink(href, label, activeKey === key)).join('\n')}
<a class="${MUTED} inline-flex items-center gap-1" href="${EXT.home}" target="_blank" rel="noopener">DevSpireHub<span class="material-symbols-outlined text-[14px]" data-icon="arrow_outward" aria-hidden="true">arrow_outward</span></a>
</nav>
</div>
<div class="flex items-center gap-1.5 sm:gap-space-sm shrink-0">
<a class="hidden sm:inline-flex items-center gap-1.5 bg-surface-card border border-border-subtle rounded px-2.5 py-1.5 font-body-compact text-body-compact text-text-muted hover:border-secondary hover:text-secondary dark:hover:border-secondary dark:hover:text-secondary transition-colors duration-150" href="terminal.html" id="terminal-nav-btn" aria-label="Open Terminal" title="Open Terminal">
<span class="material-symbols-outlined text-[16px]" data-icon="terminal" aria-hidden="true">terminal</span>
<span class="text-xs">Terminal</span>
<kbd class="font-code-badge text-code-badge bg-surface-secondary px-1.5 py-0.5 rounded text-[11px] border border-border-subtle text-text-muted key-hint">&#96;</kbd>
</a>
<a class="inline-flex items-center justify-center gap-1.5 bg-primary-container text-bg-canvas font-body-compact font-semibold px-2.5 sm:px-3 py-1.5 rounded text-[13px] sm:text-body-compact hover:brightness-110 transition-all" href="submit.html"${active === 'submit' ? ' aria-current="page"' : ''}>
<span class="material-symbols-outlined text-[16px]" data-icon="add" aria-hidden="true">add</span>Submit Resource</a>
<button class="lg:hidden inline-flex items-center justify-center w-8 h-8 rounded bg-surface-card border border-border-subtle text-text-muted hover:text-text-primary transition-colors" id="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu">
<span class="material-symbols-outlined text-[18px]" data-icon="menu" aria-hidden="true">menu</span>
</button>
</div>
</div>
<div class="lg:hidden hidden border-t border-border-subtle bg-surface-secondary/95 backdrop-blur" id="mobile-menu">
<nav class="flex flex-col px-4 sm:px-gutter-lg py-3 gap-1" aria-label="Mobile">
${NAV.map(([href, label, key]) => activeKey === key
    ? `<a class="text-primary font-body-compact text-body-compact py-2 border-b border-border-subtle/50" href="${href}" aria-current="page">${label}</a>`
    : `<a class="text-text-muted hover:text-text-primary font-body-compact text-body-compact py-2 border-b border-border-subtle/50 transition-colors" href="${href}">${label}</a>`).join('\n')}
<a class="text-text-muted hover:text-text-primary font-body-compact text-body-compact py-2 border-b border-border-subtle/50 transition-colors inline-flex items-center gap-2" href="terminal.html"><span class="material-symbols-outlined text-[16px]" aria-hidden="true">terminal</span>Terminal</a>
<a class="text-text-muted hover:text-text-primary font-body-compact text-body-compact py-2 border-b border-border-subtle/50 transition-colors" href="submit.html">Submit Resource</a>
<a class="text-text-muted hover:text-text-primary font-body-compact text-body-compact py-2 border-b border-border-subtle/50 transition-colors inline-flex items-center gap-1" href="${EXT.home}" target="_blank" rel="noopener">DevSpireHub<span class="material-symbols-outlined text-[14px]" aria-hidden="true">arrow_outward</span></a>
<a class="text-text-muted hover:text-text-primary font-body-compact text-body-compact py-2 transition-colors inline-flex items-center gap-1" href="${EXT.about}" target="_blank" rel="noopener">About DevSpireHub<span class="material-symbols-outlined text-[14px]" aria-hidden="true">arrow_outward</span></a>
</nav>
</div>
</header>`;
};

const group = (id, title, links) => `<nav aria-labelledby="footer-${id}">
<h2 class="font-metadata-label text-metadata-label uppercase tracking-[0.16em] text-text-primary mb-2" id="footer-${id}">${title}</h2>
<ul class="flex flex-col gap-1.5">
${links.map(([href, label, external]) => `<li><a class="${FOOT_LINK}" href="${href}"${external ? ' target="_blank" rel="noopener"' : ''}>${label}${external ? '<span class="material-symbols-outlined text-[13px] align-middle ml-0.5" aria-hidden="true">arrow_outward</span>' : ''}</a></li>`).join('\n')}
</ul>
</nav>`;

const footer = () => `<footer class="w-full bg-bg-canvas dark:bg-bg-canvas border-t border-border-subtle dark:border-border-subtle mt-space-xl">
<div class="w-full max-w-[1360px] mx-auto px-4 sm:px-gutter-lg py-space-lg">
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))] gap-x-space-lg gap-y-space-md">
<div class="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
<span class="font-title-card text-title-card text-text-primary font-semibold">DevSpire Nexus</span>
<p class="font-metadata-label text-metadata-label text-primary">Discover. Connect. Build.</p>
<p class="font-metadata-label text-metadata-label text-text-muted max-w-xs">AI Intelligence Directory</p>
<p class="font-metadata-label text-metadata-label text-text-muted max-w-xs">DevSpire Nexus is a product of DevSpireHub.com.</p>
<p class="font-metadata-label text-metadata-label text-text-muted max-w-xs">Source: DevSpireHub AI knowledge base · ai-tools-models-developer-resources.md</p>
</div>
${group('explore', 'Explore', [
    ['index.html', 'Directory'],
    ['ai-tools.html', 'AI Tools'],
    ['models.html', 'AI Models'],
    ['developer-resources.html', 'Developer Resources']
  ])}
${group('product', 'Product', [
    ['collections.html', 'My Collections'],
    ['about.html', 'About'],
    ['contact.html', 'Contact'],
    ['docs.html', 'Documentation'],
    ['api.html', 'API and Data Access'],
    ['submit.html', 'Submit Resource']
  ])}
${group('legal', 'Legal &amp; Information', [
    ['privacy.html', 'Privacy Policy'],
    ['terms.html', 'Terms of Service']
  ])}
${group('devspirehub', 'DevSpireHub', [
    [EXT.home, 'Main Website', true],
    [EXT.about, 'About DevSpireHub', true],
    [EXT.learning, 'Learning Resources', true]
  ])}
</div>
<div class="mt-space-lg pt-space-md border-t border-border-subtle/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
<p class="font-metadata-label text-metadata-label text-text-muted">© 2026 DevSpireHub.com · DevSpire Nexus</p>
<p class="font-metadata-label text-metadata-label text-text-muted">Static catalog · collections stay in your browser · privacy-conscious analytics</p>
</div>
</div>
</footer>`;

const BANNER = `<section class="mt-12" aria-labelledby="devspirehub-banner-title">
<div class="devspirehub-banner-card ui-card rounded-xl p-space-lg md:p-space-xl pb-10 md:pb-12 overflow-hidden">
<div class="flex flex-col md:flex-row md:items-center justify-between gap-space-lg">
<div class="flex items-start gap-4 min-w-0">
<img src="assets/img/devspirehub-icon-128.png" alt="DevSpireHub official logo" width="48" height="48" class="w-12 h-12 rounded-lg object-contain shrink-0" loading="lazy"/>
<div class="min-w-0">
<p class="font-metadata-label text-metadata-label text-primary-container uppercase tracking-[0.18em] mb-1">The parent network</p>
<h2 class="font-headline-section text-headline-section text-text-primary" id="devspirehub-banner-title">Explore More at DevSpireHub</h2>
<p class="font-body-compact text-body-compact text-text-muted max-w-2xl mt-1">Discover practical programming tutorials, networking guides, cloud technologies, cybersecurity resources, and hands-on development projects at DevSpireHub.</p>
</div>
</div>
<a class="inline-flex items-center justify-center gap-2 bg-primary-container text-bg-canvas font-body-compact text-body-compact font-semibold px-4 py-2.5 rounded shrink-0 self-start md:self-auto hover:brightness-110 transition-all" href="${EXT.home}" target="_blank" rel="noopener">Visit DevSpireHub<span class="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_outward</span></a>
</div>
</div>
</section>`;

const SKIP = '<a class="skip-link" href="#main-content">Skip to main content</a>';

const metaTags = (title, description, robots) => `<meta name="theme-color" content="#090D12"/>
<meta name="robots" content="${robots || 'index, follow'}"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="DevSpire Nexus"/>
<meta property="og:title" content="${title}"/>
<meta property="og:description" content="${description}"/>
<meta name="twitter:card" content="summary"/>
<meta name="twitter:title" content="${title}"/>
<meta name="twitter:description" content="${description}"/>`;

const stripMeta = (html) => html
  .replace(/\n?<meta name="theme-color"[^>]*>/g, '')
  .replace(/\n?<meta name="robots"[^>]*>/g, '')
  .replace(/\n?<meta property="og:[^"]+"[^>]*>/g, '')
  .replace(/\n?<meta name="twitter:[^"]+"[^>]*>/g, '');

const apply = (html, options = {}) => {
  const active = options.active || '';
  const quickFind = options.quickFind || null;

  let out = html;

  const title = (out.match(/<title>([\s\S]*?)<\/title>/) || [,''])[1];
  const description = (out.match(/<meta name="description" content="([\s\S]*?)"\/>/) || [,''])[1];
  const robots = options.robots || 'index, follow';
  if (title) {
    out = stripMeta(out).replace('</head>', metaTags(title, description, robots) + '\n</head>');
  }

  if (!out.includes('href="assets/site.css"')) {
    out = out.replace('</head>', '<link rel="stylesheet" href="assets/site.css"/>\n</head>');
  }

  out = out.replace(/<a class="skip-link"[\s\S]*?<\/a>\s*/g, '');
  out = out.replace(/(<body[^>]*>)\s*/, `$1\n${SKIP}\n`);

  out = out.replace(/<header[\s\S]*?<\/header>/, header(active, quickFind));
  out = out.replace(/<footer[\s\S]*?<\/footer>/, footer());

  out = out.replace(/<main(?![^>]*\bid=")/, '<main id="main-content"');

  if (options.banner && !out.includes('id="devspirehub-banner-title"')) {
    out = out.replace(/<\/main>/, BANNER + '\n</main>');
  }
  if (!options.banner) {
    out = out.replace(/\n?<section class="mt-12" aria-labelledby="devspirehub-banner-title">[\s\S]*?<\/section>\n?/, '\n');
  }

  out = out.replace(/<span class="([^"]*material-symbols-outlined[^"]*)"(?![^>]*aria-hidden)/g, '<span class="$1" aria-hidden="true"');

  return out;
};

const pageOptions = {
  'index.html': { active: 'discover', quickFind: 'jump', banner: true },
  'models.html': { active: 'models', quickFind: 'input' },
  'ai-tools.html': { active: 'tools', quickFind: 'input' },
  'developer-resources.html': { active: 'dev', quickFind: 'input' },
  'tools.html': { active: '', quickFind: 'input' },
  'submit.html': { active: 'submit' },
  'terminal.html': { active: '' },
  'api.html': { active: '' },
  'docs.html': { active: 'docs' },
  'collections.html': { active: 'collections', robots: 'noindex, nofollow' },
  'about.html': { active: 'about' },
  'privacy.html': { active: '' },
  'terms.html': { active: '' },
  'contact.html': { active: '' }
};

const applyFile = (file) => {
  const target = path.join(ROOT, file);
  const before = fs.readFileSync(target, 'utf8');
  const after = apply(before, pageOptions[file] || {});
  if (after !== before) fs.writeFileSync(target, after, 'utf8');
  return after !== before;
};

module.exports = { header, footer, apply, applyFile, pageOptions, EXT };
