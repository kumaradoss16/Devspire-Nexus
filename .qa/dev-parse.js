const fs = require('fs');
const md = fs.readFileSync('.qa/dev-source.md', 'utf8');
const lines = md.split(/\r?\n/);
const recs = [];
let cur = null;

function flush() {
  if (!cur) return;
  const val = (label) => {
    const line = cur.lines.find((l) => l.startsWith('**' + label + ':**'));
    return line ? line.slice(('**' + label + ':** ').length).trim() : null;
  };
  const iconLine = cur.lines.find((l) => l.startsWith('**Icon:**'));
  const iconUrl = iconLine ? (iconLine.match(/\(([^)]+)\)/) || [])[1] : null;
  const verifiedLine = cur.lines.find((l) => l.startsWith('**Verified Link:**'));
  const vm = verifiedLine ? verifiedLine.match(/\[([^\]]+)\]\(([^)]+)\)/) : null;
  const clean = (s) => (s ? s.replace(/`/g, '') : s);
  const notesIdx = cur.lines.findIndex((l) => l.startsWith('**Notes:**'));
  let notes = null;
  if (notesIdx >= 0) notes = cur.lines.slice(notesIdx).join('\n').replace('**Notes:** ', '').trim();

  recs.push({
    name: cur.name,
    iconUrl,
    domain: clean(val('Official Domain')),
    category: val('Category'),
    subtype: val('Resource Subtype'),
    desc: val('Description'),
    pricingClass: clean(val('Pricing & Free Classification')),
    signup: /Yes/i.test(val('Signup Required') || ''),
    local: /Yes/i.test(val('Local Execution / Self-Hostable') || ''),
    tags: (val('Technical Tags') || '').split(',').map((s) => s.trim()).filter(Boolean),
    officialUrl: vm ? vm[2] : null,
    id: clean(val('Canonical ID')),
    status: clean(val('Verification Status')),
    evidence: [...cur.lines.join('\n').matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)].map((m) => [m[1], m[2]]),
    verified: clean(val('Last Verified')),
    notes
  });
}

for (const line of lines) {
  const m = line.match(/^## \d{3} · (.+)$/);
  if (m) { flush(); cur = { name: m[1].trim(), lines: [] }; continue; }
  if (cur) cur.lines.push(line);
}
flush();

fs.writeFileSync('.qa/dev-records.json', JSON.stringify(recs, null, 1));
console.log('records:', recs.length);
recs.forEach((r, i) => {
  console.log(`${String(i + 1).padStart(2, '0')}. ${r.name} | ${r.category} | ${r.subtype} | ${r.pricingClass} | signup:${r.signup ? 'Y' : 'N'} local:${r.local ? 'Y' : 'N'}`);
  console.log(`    url: ${r.officialUrl}`);
  console.log(`    ev: ${r.evidence.map((e) => e[0]).join(' || ')}`);
  console.log(`    tags: ${r.tags.join(', ')}`);
  console.log(`    notes: ${(r.notes || '').slice(0, 300)}`);
});
