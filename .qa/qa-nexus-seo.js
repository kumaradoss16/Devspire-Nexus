/* Nexus SEO/a11y gate: canonical + robots metadata, unique titles, featured
   rotation determinism, page branding and reduced-motion support.
   Run: node .qa/qa-nexus-seo.js */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const EXE = process.env.LOCALAPPDATA + '/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
const ROOT = path.join(__dirname, '..');
const BASE = 'file:///H:/Devspirehub AI/';

const PAGES = [
  'directory.html', 'ai-tools.html', 'models.html', 'developer-resources.html',
  'docs.html', 'api.html', 'terminal.html', 'submit.html',
  'about.html', 'privacy.html', 'contact.html', 'terms.html'
];
const NOINDEX = 'collections.html';

let results = [];
const assert = (name, cond, extra) => {
  results.push({ name, pass: !!cond, extra: extra || '' });
  if (!cond) console.error('FAIL:', name, extra || '');
};

/* ---------- Static head/metadata ---------- */
const heads = PAGES.map((file) => {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const pick = (re) => (html.match(re) || [])[1] || '';
  return {
    file,
    title: pick(/<title>([^<]*)<\/title>/),
    description: pick(/<meta name="description" content="([^"]*)"/),
    canonical: pick(/<link rel="canonical" href="([^"]*)"/),
    robots: pick(/<meta name="robots" content="([^"]*)"/),
    ogTitle: pick(/<meta property="og:title" content="([^"]*)"/),
    ogDescription: pick(/<meta property="og:description" content="([^"]*)"/),
    twitter: pick(/<meta name="twitter:card" content="([^"]*)"/),
    theme: pick(/<meta name="theme-color" content="([^"]*)"/),
    crumb: /aria-label="Breadcrumb"/.test(html),
    dead: (html.match(/href="#"/g) || []).length,
    js: (html.match(/href="javascript:/g) || []).length
  };
});

const titles = new Set(heads.map((h) => h.title));
const descriptions = new Set(heads.map((h) => h.description));
assert('indexable titles are unique', titles.size === PAGES.length, `${titles.size}/${PAGES.length}`);
assert('indexable descriptions are unique', descriptions.size === PAGES.length, `${descriptions.size}/${PAGES.length}`);
for (const h of heads) {
  assert(`${h.file}: descriptive title`, h.title.length >= 12 && /Nexus|AI Tools|AI Models|Developer Resources|Documentation|API|Terminal|Submit|About|Privacy|Contact|Terms/.test(h.title), h.title);
  assert(`${h.file}: meta description`, h.description.length >= 60, String(h.description.length));
  assert(`${h.file}: canonical points at itself`, h.canonical === h.file || h.canonical === ('https://devspirehub.com/' + (h.file === 'directory.html' ? '' : h.file)) || h.canonical === ('https://devspirehub.com/' + h.file), h.canonical);
  assert(`${h.file}: indexable`, h.robots === 'index, follow', h.robots);
  assert(`${h.file}: OG mirrors title and description`, h.ogTitle === h.title && h.ogDescription === h.description);
  assert(`${h.file}: Twitter card + theme`, (h.twitter === 'summary_large_image' || h.twitter === 'summary') && /^(#010D18|#090D12)$/i.test(h.theme), `${h.twitter}/${h.theme}`);
  assert(`${h.file}: breadcrumb except home`, h.file === 'directory.html' ? true : h.crumb);
  assert(`${h.file}: no dead or javascript links`, h.dead === 0 && h.js === 0, `dead=${h.dead} js=${h.js}`);
  assert(`${h.file}: no old brand phrase`, !/DevSpireHub AI Intelligence Directory/.test(fs.readFileSync(path.join(ROOT, h.file), 'utf8')));
}

const collectionsHtml = fs.readFileSync(path.join(ROOT, NOINDEX), 'utf8');
assert('collections is noindex, nofollow', /<meta name="robots" content="noindex, nofollow"/.test(collectionsHtml));
assert('collections canonical exists', /<link rel="canonical" href="(https:\/\/devspirehub\.com\/)?collections\.html"/.test(collectionsHtml));

/* ---------- robots / sitemap honesty ---------- */
const robotsTxt = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
assert('robots.txt allows crawl and blocks collections', /User-agent: \*/.test(robotsTxt) && /Allow: \//.test(robotsTxt) && /Disallow: \/collections\.html/.test(robotsTxt));
assert('robots.txt references sitemap when origin is set', /Sitemap:\s*https:\/\/devspirehub\.com\/sitemap\.xml/.test(robotsTxt));
assert('sitemap exists when origin is set', fs.existsSync(path.join(ROOT, 'sitemap.xml')));
assert('reduced motion is honoured', /prefers-reduced-motion/.test(fs.readFileSync(path.join(ROOT, 'assets/site.css'), 'utf8')));

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(BASE + 'directory.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  /* ---------- Branding ---------- */
  const brand = await page.evaluate(() => ({
    title: document.title,
    hero: document.querySelector('h1')?.textContent.replace(/\s+/g, ' ').trim(),
    kicker: /AI INTELLIGENCE DIRECTORY/i.test(document.body.innerText),
    header: document.querySelector('header a[href="directory.html"]')?.textContent.replace(/\s+/g, ' ').trim(),
    heroSection: (document.querySelector('h1')?.closest('section') || document.body).textContent.replace(/\s+/g, ' '),
    footer: document.querySelector('footer').textContent.replace(/\s+/g, ' '),
    oldBrand: /DevSpireHub AI Intelligence Directory/.test(document.body.innerText)
  }));
  assert('homepage title carries Nexus', /Nexus/.test(brand.title), brand.title);
  assert('hero names DevSpire Nexus', /DevSpire Nexus/.test(brand.hero), brand.hero);
  assert('hero tagline Discover. Connect. Build.', /Discover\. Connect\. Build\./.test(brand.heroSection), brand.heroSection.slice(0, 80));
  assert('kicker says AI Intelligence Directory', brand.kicker);
  assert('header brand is DevSpire Nexus', /DevSpire Nexus/.test(brand.header) && /AI Intelligence Directory/.test(brand.header), brand.header);
  assert('footer attribution', brand.footer.includes('DevSpire Nexus is a product of DevSpireHub.com.'));
  assert('old brand phrase is gone from the homepage', !brand.oldBrand);

  /* ---------- Featured system ---------- */
  const featured = await page.evaluate(() => {
    const FR = window.FeaturedResources;
    const sameWeek = (a, b) => FR.select(new Date(a)).map((r) => r.type + ':' + r.id).join(',') === FR.select(new Date(b)).map((r) => r.type + ':' + r.id).join(',');
    const thisWeek = FR.select(new Date('2026-11-04T12:00:00Z')).map((r) => r.type + ':' + r.id);
    const nextWeek = FR.select(new Date('2026-11-11T12:00:00Z')).map((r) => r.type + ':' + r.id);
    const cards = [...document.querySelectorAll('#featured-week-grid article[data-featured-ref]')];
    const registries = { tool: window.AI_TOOLS, model: window.AI_MODELS, resource: window.DEVELOPER_RESOURCES };
    return {
      validate: FR.validate(),
      info: FR.weekInfo(),
      sameWeek: sameWeek('2026-11-02T00:00:00Z', '2026-11-08T23:00:00Z'),
      acrossWeeksDiffer: thisWeek.join(',') !== nextWeek.join(','),
      thisWeek,
      rendered: cards.map((card) => {
        const [type, id] = card.dataset.featuredRef.split(':');
        const record = (registries[type] || []).find((r) => r.id === id);
        const nameLink = card.querySelector('h3 a.featured-name');
        return {
          ref: card.dataset.featuredRef,
          resolves: !!record,
          icon: !!card.querySelector('.featured-icon img, .featured-icon .resource-icon-fallback'),
          nameHref: nameLink?.getAttribute('href') || '',
          description: (card.querySelector('p')?.textContent || '').trim().length,
          category: /AI (Tool|Model)|Developer Resource/.test(card.textContent),
          registryChip: /AI Tools|AI Models|Developer Resources/.test(card.textContent),
          details: card.querySelectorAll('.featured-foot a').length >= 1,
          official: !!card.querySelector('.featured-foot a[href^="https://"]'),
          bookmark: !!card.querySelector('[data-bookmark]')
        };
      }),
      weekLabel: document.querySelector('[data-featured-week]')?.textContent || '',
      maxPerWeek: FR.validate().ok
    };
  });

  assert('featured config validates', featured.validate.ok, (featured.validate.errors || []).join(' | '));
  assert('curated pool covers all three registries', new Set(featured.validate.pool.map((r) => r.type)).size === 3, featured.validate.pool.map((r) => r.type).join(','));
  assert('pool has no duplicate references', new Set(featured.validate.pool.map((r) => r.type + ':' + r.id)).size === featured.validate.pool.length);
  assert('featured week is Monday-based', new Date(featured.info.key + 'T00:00:00Z').getUTCDay() === 1, featured.info.key);
  assert('same week yields the same selection', featured.sameWeek);
  assert('consecutive weeks rotate', featured.acrossWeeksDiffer);
  assert('featured shows 3–5 cards', featured.rendered.length >= 3 && featured.rendered.length <= 5, featured.rendered.length);
  assert('featured cards reference unique records', new Set(featured.rendered.map((c) => c.ref)).size === featured.rendered.length);
  assert('every featured ref resolves to a record', featured.rendered.every((c) => c.resolves), featured.rendered.filter((c) => !c.resolves).map((c) => c.ref).join(','));
  assert('every featured card has an icon', featured.rendered.every((c) => c.icon));
  assert('featured names link to registry detail views', featured.rendered.every((c) => /^(ai-tools|models|developer-resources)\.html#(tool|model|resource)\//.test(c.nameHref)), featured.rendered.map((c) => c.nameHref).join(','));
  assert('featured cards show description, type, registry and details', featured.rendered.every((c) => c.description > 20 && c.category && c.registryChip && c.details), JSON.stringify(featured.rendered[0]));
  assert('featured cards expose official sources', featured.rendered.every((c) => c.official));
  assert('featured cards are bookmarkable', featured.rendered.every((c) => c.bookmark));
  assert('week label names the date range', /^Week of \w{3} \d{1,2}.*\d{4}$/.test(featured.weekLabel), featured.weekLabel);
  assert('week label is rendered from the same calculation', featured.weekLabel === featured.info.label, `${featured.weekLabel} vs ${featured.info.label}`);

  assert('no console or page errors', errors.length === 0, errors.slice(0, 5).join(' | '));

  await page.close();
  await browser.close();

  const passed = results.filter((r) => r.pass).length;
  console.log(`\n=== ${passed}/${results.length} checks passed ===`);
  if (passed !== results.length) {
    console.log('Failures:');
    results.filter((r) => !r.pass).forEach((r) => console.log(' -', r.name, r.extra));
    process.exitCode = 1;
  }
})();
