/* Rebuilds only the dynamic <main> block of api.html from api/catalog.json,
   preserving the page head and shell around it. Mirrors .qa/p5-build.js. */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'api', 'catalog.json'), 'utf8'));
const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (ch) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[ch]));

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
['tools', 'models', 'developer-resources'].forEach((key) => {
  const r = manifest.registries[key];
  entry({
    file: r.file,
    contents: `${esc(r.label)} records with a <code class="font-code-badge">_meta</code> envelope · last verified ${esc(r.last_verified || 'not recorded')}`,
    count: r.count,
    label: `${esc(r.label)} · last verified ${esc(r.last_verified || 'not recorded')}`,
    sha: r.sha256
  });
});

const body = fs.readFileSync(path.join(__dirname, 'p5-api-body.html'), 'utf8')
  .replace('{{FILE_ROWS}}', rows.join('\n'))
  .replace('{{FILE_CARDS}}', cards.join('\n'))
  .replace('{{MANIFEST_SAMPLE}}', esc(JSON.stringify(manifest, null, 2)))
  .replace(/\{\{TOTAL_RECORDS\}\}/g, String(manifest.total_records))
  .replace(/\{\{REGISTRY_COUNT\}\}/g, String(Object.keys(manifest.registries).length))
  .replace(/\{\{GENERATED_DATE\}\}/g, manifest.generated);

const pageFile = path.join(root, 'api.html');
const html = fs.readFileSync(pageFile, 'utf8');
const mainRe = /<main id="main-content"[\s\S]*?<\/main>/;
if (!mainRe.test(html)) throw new Error('api.html main#main-content not found');
const nextBody = body.replace(/^<main\b[^>]*>/, (tag) => tag.replace('<main', '<main id="main-content"'));
fs.writeFileSync(pageFile, html.replace(mainRe, nextBody.trim()), 'utf8');
console.log(`api.html refreshed: ${manifest.total_records} records across ${Object.keys(manifest.registries).length} registries`);
