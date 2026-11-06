const fs = require('fs');
const path = require('path');
const shell = require('./shell');

const root = path.join(__dirname, '..');
const models = fs.readFileSync(path.join(root, 'models.html'), 'utf8');
const headEnd = models.indexOf('<body');
const head = models.slice(0, headEnd)
  .replace(/<title>[\s\S]*?<\/title>/, '<title>Developer Resources | DevSpire Nexus</title>')
  .replace(/<meta name="description" content="[\s\S]*?"\/>/, '<meta name="description" content="Explore a verified catalog of developer resources — agent frameworks, RAG and vector databases, model serving, local runtimes, fine-tuning, evaluation, guardrails, APIs, and GPU infrastructure — in the DevSpire Nexus AI Intelligence Directory."/>');

const top = fs.readFileSync(path.join(__dirname, 'dev-body-top.html'), 'utf8');
const engine = fs.readFileSync(path.join(__dirname, 'dev-engine.js'), 'utf8');

const html = shell.apply(head + top + engine + '\n</script>\n</body>\n</html>\n', { active: 'dev', quickFind: 'input' });
fs.writeFileSync(path.join(root, 'developer-resources.html'), html);
console.log('written developer-resources.html:', html.length, 'bytes');
