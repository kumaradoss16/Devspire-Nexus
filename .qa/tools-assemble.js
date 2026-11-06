const fs = require('fs');
const path = require('path');
const shell = require('./shell');

const root = path.join(__dirname, '..');
const models = fs.readFileSync(path.join(root, 'models.html'), 'utf8');
const headEnd = models.indexOf('<body');
if (headEnd === -1) throw new Error('models.html <body> not found');
const head = models.slice(0, headEnd)
  .replace(/<title>[\s\S]*?<\/title>/, '<title>AI Tools | DevSpire Nexus</title>')
  .replace(/<meta name="description" content="[\s\S]*?"\/>/, '<meta name="description" content="Browse a verified catalog of AI tools — assistants, coding platforms, research engines, writing tools, image and video generators, audio tools, automation, and presentation builders — in the DevSpire Nexus AI Intelligence Directory."/>');

const top = fs.readFileSync(path.join(__dirname, 'tools-body-top.html'), 'utf8');
const engine = fs.readFileSync(path.join(__dirname, 'tools-engine.js'), 'utf8');

const html = shell.apply(head + top + engine + '\n</script>\n</body>\n</html>\n', { active: 'tools', quickFind: 'input' });
fs.writeFileSync(path.join(root, 'ai-tools.html'), html);
console.log('written ai-tools.html:', html.length, 'bytes');
