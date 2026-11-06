/* Phase 5 wiring for existing pages: Submit link, footer additions, helper CSS. */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const files = ['directory.html', 'tools.html', 'models.html', '.qa/tools-body-top.html', '.qa/dev-body-top.html'];

const LINK_CLASS = 'text-text-muted dark:text-text-muted font-metadata-label text-metadata-label hover:text-text-primary dark:hover:text-text-primary transition-colors';
const extraLinks = [
  ['api.html', 'API'],
  ['terminal.html', 'Terminal'],
  ['docs.html', 'Docs']
].map(([href, label]) => `<a class="${LINK_CLASS}" href="${href}">${label}</a>`).join('\n');

const submitRe = /<button class="([^"]*?)opacity-60 cursor-not-allowed" type="button" disabled aria-disabled="true" title="Resource submissions are not open yet">Submit Resource<\/button>/g;
const footerRe = /(<a[^>]*href="developer-resources\.html"[^>]*>Developer Resources<\/a>\n)([ \t]*<a[^>]*href="data\/[^"]+">Dataset<\/a>\n)?<\/div>/;

const srCss = `
/* Screen-reader-only helper (used by table action headers) */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
`;

for (const file of files) {
  const full = path.join(root, file);
  let html = fs.readFileSync(full, 'utf8');
  let changed = [];

  const submits = html.match(submitRe);
  if (submits) {
    html = html.replace(submitRe, (m, cls) => `<a class="${cls}hover:brightness-110 transition-all" href="submit.html">Submit Resource</a>`);
    changed.push(`submit→link(${submits.length})`);
  }

  if (!html.includes('href="api.html">API</a>')) {
    if (!footerRe.test(html)) throw new Error(`footer pattern not found in ${file}`);
    html = html.replace(footerRe, (m, dev, dataset) => {
      const ds = dataset || `  <a class="${LINK_CLASS}" href="api/catalog.json">Dataset</a>\n`;
      return dev + extraLinks + '\n' + ds + '</div>';
    });
    changed.push('footer+api/terminal/docs');
  }

  if (!html.includes('Screen-reader-only helper')) {
    html = html.replace('</style>', srCss + '</style>');
    changed.push('visually-hidden css');
  }

  if (changed.length) {
    fs.writeFileSync(full, html, 'utf8');
    console.log(file, '→', changed.join(', '));
  } else {
    console.log(file, '→ already wired');
  }
}
