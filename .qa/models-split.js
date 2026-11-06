const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'models.html'), 'utf8');

const adapterStart = src.indexOf('/* Presentation adapter');
const engineStart = src.indexOf('/* Inline SVG fallback');
if (adapterStart === -1 || engineStart === -1 || engineStart <= adapterStart) {
  throw new Error('split markers not found');
}

fs.writeFileSync(path.join(__dirname, 'models-part1.html'), src.slice(0, adapterStart));
fs.writeFileSync(path.join(__dirname, 'models-data.js'), src.slice(adapterStart, engineStart));
fs.writeFileSync(path.join(__dirname, 'models-part2.html'), src.slice(engineStart));

const rebuilt = ['models-part1.html', 'models-data.js', 'models-part2.html']
  .map((f) => fs.readFileSync(path.join(__dirname, f), 'utf8'))
  .join('');
console.log('parts written; reassembly matches:', rebuilt === src, '| bytes:', src.length);
