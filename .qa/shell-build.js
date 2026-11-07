/* Applies the canonical shell to hand-maintained pages.
   Assembled pages (ai-tools, developer-resources) and generated pages
   (submit, terminal, api, docs) call shell.apply() from their own builders. */
const shell = require('./shell');

const files = ['index.html', 'models.html', 'tools.html', 'about.html', 'privacy.html', 'contact.html', 'terms.html', 'collections.html'];

for (const file of files) {
  const changed = shell.applyFile(file);
  console.log(`${file}: ${changed ? 'updated' : 'unchanged'}`);
}
