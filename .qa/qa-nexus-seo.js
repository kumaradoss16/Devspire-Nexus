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
  'index.html', 'ai-tools.html', 'models.html', 'developer-resources.html',
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
  assert(`${h.file}: canonical points at itself`, h.canonical === h.file || h.canonical === ('https://devspirehub.com/' + (h.file === 'index.html' ? '' : h.file)) || h.canonical === ('https://devspirehub.com/' + h.file), h.canonical);
  assert(`${h.file}: indexable`, h.robots === 'index, follow', h.robots);
  assert(`${h.file}: OG mirrors title and description`, h.ogTitle === h.title && h.ogDescription === h.description);
  assert(`${h.file}: Twitter card + theme`, (h.twitter === 'summary_large_image' || h.twitter === 'summary') && /^(#010D18|#090D12)$/i.test(h.theme), `${h.twitter}/${h.theme}`);
  assert(`${h.file}: breadcrumb except home`, h.file === 'index.html' ? true : h.crumb);
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
  await page.goto(BASE + 'index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  /* ---------- Branding ---------- */
  const brand = await page.evaluate(() => ({
    title: document.title,
    hero: document.querySelector('h1')?.textContent.replace(/\s+/g, ' ').trim(),
    kicker: /AI INTELLIGENCE DIRECTORY/i.test(document.body.innerText),
    header: document.querySelector('header a[href="index.html"]')?.textContent.replace(/\s+/g, ' ').trim(),
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

  /* ---------- Nexus Spotlight ---------- */
  const spotlight = await page.evaluate(() => {
    const data = window.DSH_NEXUS_SPOTLIGHT;
    const registries = { tool: window.AI_TOOLS, model: window.AI_MODELS, resource: window.DEVELOPER_RESOURCES };
    const cards = [...document.querySelectorAll('#spotlight-grid .spotlight-card')];
    const resolve = (type, id) => (registries[type] || []).some((record) => record.id === id);
    return {
      exists: Boolean(data && Array.isArray(data.items)),
      items: data ? data.items.length : 0,
      models: data ? data.items.filter((item) => item.type === 'model').length : 0,
      tools: data ? data.items.filter((item) => item.type === 'tool').length : 0,
      unique: data ? new Set(data.items.map((item) => item.type + ':' + item.id)).size : 0,
      resolved: data ? data.items.every((item) => resolve(item.type, item.id)) : false,
      unresolved: data ? data.items.filter((item) => !resolve(item.type, item.id)).map((item) => item.type + ':' + item.id) : [],
      heading: document.querySelector('#nexus-spotlight .spotlight-title')?.textContent.trim() || '',
      eyebrow: document.querySelector('#nexus-spotlight .spotlight-eyebrow')?.textContent.trim() || '',
      rendered: cards.length,
      renderedResolve: cards.every((card) => resolve(card.dataset.spotlightType, card.dataset.spotlightId)),
      detailLinks: cards.every((card) => /^(ai-tools|models|developer-resources)\.html#(tool|model|resource)\//.test(card.querySelector('.spotlight-link--record')?.getAttribute('href') || '')),
      officialLinks: cards.every((card) => {
        const link = card.querySelector('a[target="_blank"]');
        return link && /^https:\/\//.test(link.getAttribute('href') || '') && link.getAttribute('rel') === 'noopener noreferrer';
      }),
      descriptions: cards.every((card) => (card.querySelector('.spotlight-desc')?.textContent || '').trim().length > 30),
      weeklyBranding: /CURATED WEEKLY|Resources of the Week/i.test(document.body.innerText)
    };
  });

  assert('Nexus Spotlight data exists', spotlight.exists);
  assert('Nexus Spotlight has 22 discoveries', spotlight.items === 22, String(spotlight.items));
  assert('Nexus Spotlight splits 17 models / 5 tools', spotlight.models === 17 && spotlight.tools === 5, `${spotlight.models}/${spotlight.tools}`);
  assert('Nexus Spotlight references are unique', spotlight.unique === spotlight.items);
  assert('every Spotlight item resolves to a registry record', spotlight.resolved, spotlight.unresolved.join(','));
  assert('Spotlight heading copy', spotlight.heading === "Discover What's Worth Exploring", spotlight.heading);
  assert('Spotlight eyebrow copy', spotlight.eyebrow === 'NEXUS SPOTLIGHT', spotlight.eyebrow);
  assert('Spotlight renders 22 static cards', spotlight.rendered === 22, String(spotlight.rendered));
  assert('every rendered Spotlight card maps to a record', spotlight.renderedResolve);
  assert('Spotlight record links target registry detail views', spotlight.detailLinks);
  assert('Spotlight official links are safe external links', spotlight.officialLinks);
  assert('Spotlight cards carry descriptions', spotlight.descriptions);
  assert('weekly branding is gone from the homepage', !spotlight.weeklyBranding);

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
