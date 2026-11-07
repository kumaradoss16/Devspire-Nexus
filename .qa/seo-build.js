/* Injects canonical links, then writes robots.txt and (when a deployment
   origin is known) sitemap.xml.

   Canonical links are emitted as document-relative URLs, which resolve to the
   page's own address on any host. Absolute URLs in the sitemap require a real
   origin, so the sitemap is only generated when one is supplied:

     node .qa/seo-build.js --origin https://example.com/directory/

   The origin can also be set once in site.config.json. Until then no sitemap
   is written, because inventing a host or path would misdirect crawlers.

   Run: node .qa/seo-build.js [--origin URL] */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONFIG = path.join(ROOT, 'site.config.json');

const INDEXABLE = [
  'index.html', 'ai-tools.html', 'models.html', 'developer-resources.html',
  'docs.html', 'api.html', 'terminal.html', 'submit.html',
  'about.html', 'privacy.html', 'contact.html', 'terms.html'
];
const NOINDEX = ['collections.html'];

const readOrigin = () => {
  const argIndex = process.argv.indexOf('--origin');
  if (argIndex !== -1 && process.argv[argIndex + 1]) return process.argv[argIndex + 1].trim();
  try {
    return String(JSON.parse(fs.readFileSync(CONFIG, 'utf8')).origin || '').trim();
  } catch {
    return '';
  }
};

const normalizeOrigin = (origin) => {
  if (!origin) return '';
  if (!/^https?:\/\//.test(origin)) throw new Error('origin must start with http:// or https://');
  return origin.replace(/\/?$/, '/');
};

const fileDate = (file) => new Date(fs.statSync(path.join(ROOT, file)).mtimeMs).toISOString().slice(0, 10);

const origin = normalizeOrigin(readOrigin());

/* ---------- canonical links ---------- */
let patched = 0;
for (const file of [...INDEXABLE, ...NOINDEX]) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) continue;
  let html = fs.readFileSync(full, 'utf8');
  const href = origin ? origin + file : file;
  const tag = `<link rel="canonical" href="${href}"/>`;
  const existing = /<link rel="canonical"[^>]*>/i;
  if (existing.test(html)) {
    const next = html.replace(existing, tag);
    if (next !== html) { fs.writeFileSync(full, next); patched++; }
  } else if (html.includes('</head>')) {
    html = html.replace('</head>', `${tag}\n</head>`);
    fs.writeFileSync(full, html);
    patched++;
  }
}

/* ---------- robots.txt ---------- */
const robots = [
  '# DevSpire Nexus robots policy',
  'User-agent: *',
  'Allow: /',
  '# Personal collections are rendered from localStorage and are never public.',
  'Disallow: /collections.html',
  ''
].concat(origin ? [`Sitemap: ${origin}sitemap.xml`, ''] : [
  '# Sitemap is generated once the deployment origin is configured:',
  '#   node .qa/seo-build.js --origin https://your-host/path/',
  ''
]).join('\n');
fs.writeFileSync(path.join(ROOT, 'robots.txt'), robots);

/* ---------- sitemap.xml ---------- */
if (origin) {
  const urls = INDEXABLE.map((file) => [
    '  <url>',
    `    <loc>${origin}${file}</loc>`,
    `    <lastmod>${fileDate(file)}</lastmod>`,
    '    <changefreq>weekly</changefreq>',
    `    <priority>${file === 'index.html' ? '1.0' : '0.8'}</priority>`,
    '  </url>'
  ].join('\n')).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
  console.log(`canonical links: ${patched} page(s) updated`);
  console.log(`robots.txt written; sitemap.xml written with ${INDEXABLE.length} URLs for ${origin}`);
} else {
  console.log(`canonical links: ${patched} page(s) updated (relative)`);
  console.log('robots.txt written; sitemap.xml skipped because no deployment origin is configured.');
}
