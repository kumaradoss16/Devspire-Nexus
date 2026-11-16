# Nexus Spotlight — Implementation Report

Date: 2026-11-16
Status: **CONDITIONAL PASS.** All Spotlight, editorial, registry, SEO and page suites pass. Three older suites still fail on checks that predate this work; see "Known failures not introduced by this work".
Nothing has been committed, pushed or deployed.

Related documents:
- `NEXUS_SPOTLIGHT_BASELINE.md` (pre-change state)
- `NEXUS_SPOTLIGHT_RESOURCE_INGESTION_AUDIT.md` (22-candidate audit)

## What changed

### 1. "Resources of the Week" became "Nexus Spotlight"
- New section `#nexus-spotlight` on `index.html`, placed directly above `#featured-collection` ("21 AI Platforms Worth Knowing"). Homepage order is now coverage, nexus-spotlight, featured-collection, recently-viewed-section, catalog-snapshot.
- Copy uses the required eyebrow "NEXUS SPOTLIGHT", heading "Discover What's Worth Exploring", description and supporting text. The page contains no weekly wording (checked by `qa-nexus-seo`, `qa-nexus-smoke` and `qa-nexus-spotlight`).
- 22 cards (17 models, 5 tools), each with a type tag, badge (NEW / EARLY ACCESS / PREVIEW), category, description, release date, an official Source link (`target=_blank`, `rel="noopener noreferrer"`) and a Record link to the canonical detail route.
- Filters: All 22 / Models 17 / Tools 5. They are keyboard operable and update a live status line ("Showing all 22 discoveries").

Files:
- `data/nexus-spotlight.js` (new): references only, as `{type, id, badge, released}`
- `assets/nexus-spotlight.js`, `assets/nexus-spotlight.css` (new)
- `.qa/build-nexus-spotlight.js` (new): generates the static markup between `NEXUS-SPOTLIGHT:START/END` markers and ensures the CSS and both script tags are present
- `index.html`

### 2. Registry ingestion
All 22 candidates were added as NEW_VERIFIED to the existing registries. Tools went from 403 to 408, models from 300 to 317, and developer resources stayed at 300, for a total of 1,025. No fourth registry was created, and nothing was merged. Details are in the audit.

Files:
- `.qa/nexus-additions.json`, `.qa/ingest-nexus-spotlight.js` (new)
- `data/ai-tools.js`, `data/ai-models.js`, root `ai-models.json`, `ai-resources-1000.json`
- `.qa/refresh-related-index.js` (new), which regenerates `data/related-index.js`
- `.qa/api-build.js` (existing, re-run), which regenerates `api/*.json` and `api/catalog.json`
- `.qa/refresh-api-page.js` (new), which rebuilds `api.html` `<main>` from `api/catalog.json`
- Count copy: `terminal.html`, `about.html`, `ai-tools.html`, `models.html`, `.qa/update-seo-heads.js`
- `ai-tools.html`: `PRICING_ORDER` now includes `'Not stated'` so the pricing facet sums to the dataset (ElevenAI has no stated pricing)

### 3. Editorial collection intro redesign (cards unchanged)
The `#featured-collection` intro now has three parts:
- a masthead row: eyebrow on the left; "21 platforms" / "6 categories" meta on the right
- a large title
- a two-column head grid: lede and intro copy on the left, an editorial pull-quote panel on the right

At 768px and below the grid stacks into one column. The card markup and card CSS were not modified.

Files: `.qa/build-featured-collection.js`, `assets/featured-collection.css`, `index.html` (regenerated block).

### 4. QA scripts
- `.qa/qa-nexus-spotlight.js` (new)
- `.qa/shot-spotlight-intro.js` (new; screenshots in `.qa/shots-spotlight/`)
- Updated for Spotlight: `.qa/qa-featured-collection.js`, `.qa/qa-nexus-seo.js`, `.qa/qa-nexus-smoke.js`

## Test results (executed and inspected 2026-11-16)

Legacy suites hardcode `file:///H:/Devspirehub AI/` (the parent folder copy). They were run through temporary copies pointing at this project folder, and those copies were deleted afterwards.

| Suite | Result |
|---|---|
| `qa-nexus-spotlight.js` | 93 / 93 passed |
| `qa-featured-collection.js` | 265 / 265 passed |
| `qa-nexus-seo.js` | 137 / 137 passed |
| `qa-nexus-smoke.js` | all pages overflow 0, `weekly: false`, `ERRORS []` |
| `qa-ai-tools.js` | 116 / 116 passed |
| `qa-models.js` | 93 / 93 passed |
| `qa-dev.js` | 81 / 81 passed |
| `qa-nexus-flow.js` | bookmark, collection create/add/rename/export/remove, contact validation and mocked success all completed; `ERRORS []` |
| `qa-related.js` | 147 / 150 (see below) |
| `qa-collections-core.js` | 34 / 37 (see below) |
| `qa-forms.js` | 69 / 72 (see below) |

### Responsive measurements (`shot-spotlight-intro.js`)

| Width | Page overflow | Spotlight columns | Editorial intro grid |
|---|---|---|---|
| 1440 | 0 | 4 | 2 columns (723 / 535 px) |
| 1366 | 0 | 4 | 2 columns |
| 1024 | 0 | 3 | 2 columns (538 / 397 px) |
| 768 | 0 | 2 | 1 column |
| 390 | 0 | 1 | 1 column |
| 320 | 0 | 1 (min card 272 px) | 1 column |

Editorial card columns were unchanged at 4/4/3/2/1/1. No page errors at any width.

## Known failures not introduced by this work

None of these files was modified in this work. Their last-modified date is 2026-11-08, before this work started.

1. **`qa-related.js`: 3 failures.** The test rejects remote requests outside an allowlist, and Google Tag Manager and AdSense requests appear on `ai-tools.html`, `models.html` and `developer-resources.html`. Those scripts are in the shared head of 14 of 15 pages, including the unmodified `developer-resources.html`. The test was not loosened. Either add these hosts to the allowlist or drop them from the pages.
2. **`qa-collections-core.js`: 3 failures.** The selectors look for `#saved-list > div[class*="bg-surface-secondary"]`, but `assets/collections-page.js` now renders rows with `resource-row` classes. The page itself works: `qa-nexus-flow` saves, lists, adds, renames and removes items. The test selectors need updating.
3. **`qa-forms.js`: 3 failures.** These are "no key" checks, which assume an empty Web3Forms key. `data/site-config.js` now contains a configured key, so the warning banner is correctly hidden.
4. **`qa-shell.js`.** This has a `locator.hover` timeout, recorded in the baseline before any change.

## Not changed / left in place
- `data/featured-resources.js` and `assets/featured.js` (the old weekly module) are no longer referenced by any page or QA script. They were kept, not deleted, and can be removed in a follow-up.
- No logos were added for the 22 new records (`icon: null`, initials fallback).
- `sitemap.xml` and the canonical origin are unchanged.
