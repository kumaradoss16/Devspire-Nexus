/* Builds terminal.html, api.html, submit.html, and docs.html.
   Shared shell comes from models.html's head; page bodies live in .qa/p5-*.html. */
const fs = require('fs');
const path = require('path');
const shell = require('./shell');

const root = path.join(__dirname, '..');
const models = fs.readFileSync(path.join(root, 'models.html'), 'utf8');
const headEnd = models.indexOf('<body');
if (headEnd === -1) throw new Error('models.html <body> not found');
const baseHead = models.slice(0, headEnd);
const extraCss = fs.readFileSync(path.join(__dirname, 'p5-extra.css'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'api', 'catalog.json'), 'utf8'));

const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (ch) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[ch]));

const head = (title, description) => baseHead
  .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
  .replace(/<meta name="description" content="[\s\S]*?"\/>/, `<meta name="description" content="${description}"/>`)
  .replace('</head>', `<style>\n${extraCss}\n</style>\n</head>`);

const page = ({ file, title, description, bodyFile, engines, active = '', siteConfig = false }) => {
  const body = fs.readFileSync(path.join(__dirname, bodyFile), 'utf8');
  const scripts = engines.map((engine) => `\n<script>\n${fs.readFileSync(path.join(__dirname, engine), 'utf8')}\n</script>`).join('');
  const html = shell.apply(head(title, description) + '<body class="bg-bg-canvas text-text-primary min-h-screen flex flex-col font-body-default antialiased selection:bg-primary-container selection:text-bg-canvas">\n' +
    shell.header(active, null) + '\n' + body.trim() + '\n' + shell.footer() +
    '\n<script src="data/ai-tools.js"></script>\n<script src="data/ai-models.js"></script>\n<script src="data/developer-resources.js"></script>' +
    (siteConfig ? '\n<script src="data/site-config.js"></script>' : '') +
    '\n<script src="assets/resource-icons.js"></script>\n<script src="assets/collections.js"></script>\n<script src="assets/status-badges.js"></script>\n<script src="assets/recently-viewed.js"></script>\n<script src="assets/share.js"></script>' +
    scripts + '\n</body>\n</html>\n', { active });
  fs.writeFileSync(path.join(root, file), html, 'utf8');
  console.log(`${file}: ${html.length} bytes`);
};

const apiBody = () => {
  const order = ['tools', 'models', 'developer-resources'];
  const rows = [];
  const cards = [];
  const entry = ({ file, contents, count, sha, label }) => {
    rows.push(`<tr class="border-b border-border-subtle/50"><td class="px-4 py-2.5 font-code-param text-code-param text-secondary">${esc(file)}</td><td class="px-4 py-2.5 text-text-muted">${contents}</td><td class="px-4 py-2.5 font-code-param text-code-param text-text-primary">${count}</td><td class="px-4 py-2.5 font-code-param text-code-param text-text-muted"${sha ? ` title="${esc(sha)}"` : ''}>${sha ? `${esc(sha.slice(0, 12))}…` : '—'}</td><td class="px-4 py-2.5"><div class="flex flex-col xl:flex-row xl:items-center gap-1 xl:gap-2"><a class="text-secondary hover:underline font-metadata-label text-metadata-label" href="${esc(file)}" target="_blank" rel="noopener">Open</a><button class="text-left text-text-muted hover:text-text-primary font-metadata-label text-metadata-label" type="button" data-copy="${esc(file)}">Copy path</button></div></td></tr>`);
    cards.push(`<li class="p-4">
<div class="flex items-start justify-between gap-3">
<code class="font-code-param text-code-param text-secondary break-all">${esc(file)}</code>
<span class="font-code-param text-code-param text-text-primary shrink-0">${count}</span>
</div>
<p class="font-metadata-label text-metadata-label text-text-muted mt-1">${label}</p>
${sha ? `<p class="font-code-badge text-code-badge text-text-muted mt-1"><span class="text-text-muted">SHA-256</span> ${esc(sha.slice(0, 16))}…</p>` : ''}
<div class="flex flex-wrap items-center gap-3 mt-2">
<a class="text-secondary hover:underline font-metadata-label text-metadata-label" href="${esc(file)}" target="_blank" rel="noopener">Open</a>
<button class="text-left text-text-muted hover:text-text-primary font-metadata-label text-metadata-label" type="button" data-copy="${esc(file)}">Copy path</button>
</div>
</li>`);
  };
  entry({
    file: 'api/catalog.json',
    contents: 'Manifest: file paths, counts, generation date, SHA-256 checksums',
    count: `${manifest.total_records} total`,
    label: 'Manifest · catalog sizes and checksums',
    sha: null
  });
  order.forEach((key) => {
    const r = manifest.registries[key];
    entry({
      file: r.file,
      contents: `${esc(r.label)} records with a <code class="font-code-badge">_meta</code> envelope · last verified ${esc(r.last_verified || 'not recorded')}`,
      count: r.count,
      label: `${esc(r.label)} · last verified ${esc(r.last_verified || 'not recorded')}`,
      sha: r.sha256
    });
  });
  return fs.readFileSync(path.join(__dirname, 'p5-api-body.html'), 'utf8')
    .replace('{{FILE_ROWS}}', rows.join('\n'))
    .replace('{{FILE_CARDS}}', cards.join('\n'))
    .replace('{{MANIFEST_SAMPLE}}', esc(JSON.stringify(manifest, null, 2)))
    .replace(/\{\{TOTAL_RECORDS\}\}/g, String(manifest.total_records))
    .replace(/\{\{REGISTRY_COUNT\}\}/g, String(Object.keys(manifest.registries).length))
    .replace(/\{\{GENERATED_DATE\}\}/g, manifest.generated);
};

const writeApiPage = () => {
  const body = apiBody();
  const tmp = path.join(__dirname, '.p5-api-body.built.html');
  fs.writeFileSync(tmp, body, 'utf8');
  try {
    page({
      file: 'api.html',
      title: 'Static Catalog API | DevSpire Nexus',
      description: 'Static JSON files generated from the DevSpire Nexus catalog datasets, with counts and checksums. No hosted endpoint.',
      bodyFile: '.p5-api-body.built.html',
      engines: ['p5-api.js'],
      active: ''
    });
  } finally {
    fs.unlinkSync(tmp);
  }
};

page({
  file: 'terminal.html',
  title: 'Catalog Terminal | DevSpire Nexus',
  description: 'A read-only catalog console with a fixed command allowlist over the AI tools, models, and developer resources datasets. No shell, eval, file access, or network calls.',
  bodyFile: 'p5-terminal-body.html',
  engines: ['p5-terminal.js'],
  active: ''
});
writeApiPage();
page({
  file: 'submit.html',
  title: 'Submit a Resource | DevSpire Nexus',
  description: 'Submit an AI tool, model, or developer resource for review. Submissions are delivered to DevSpireHub through Web3Forms and enter manual moderation; nothing is published automatically.',
  bodyFile: 'p5-submit-body.html',
  engines: ['p5-submit.js'],
  active: 'submit',
  siteConfig: true
});
page({
  file: 'docs.html',
  title: 'Documentation | DevSpire Nexus',
  description: 'Architecture, datasets, build pipeline, catalog terminal, static API, submission policy, and quality checks for the DevSpire Nexus AI Intelligence Directory.',
  bodyFile: 'p5-docs-body.html',
  engines: ['p5-docs.js'],
  active: 'docs'
});
