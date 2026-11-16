# Nexus Spotlight — Resource Ingestion Audit

Review date: 2026-11-14 (re-checked 2026-11-16)
Source of candidates: the 22 "Resources of the Week" (Week 46) items, now Nexus Spotlight.
Machine-readable input: `.qa/nexus-additions.json` (applied by `.qa/ingest-nexus-spotlight.js`).

## Summary

| Measure | Count |
|---|---|
| Candidates submitted | 22 |
| Exact duplicates (same id or same official URL) | 0 |
| Probable duplicates (same product, different name) | 0 |
| Existing records reused | 0 |
| NEW_VERIFIED (added) | 22 |
| Pending verification | 0 |
| Excluded | 0 |
| Classification corrections | 0 |
| Added to AI Models | 17 |
| Added to AI Tools | 5 |
| Added to Developer Resources | 0 |

Registry counts after ingestion (`data/*.js`, verified with Node `vm` on 2026-11-16):

| Registry | Before | After |
|---|---|---|
| AI Tools (`window.AI_TOOLS`) | 403 | 408 |
| AI Models (`window.AI_MODELS`) | 300 | 317 |
| Developer Resources (`window.DEVELOPER_RESOURCES`) | 300 | 300 |
| **Total** | **1,003** | **1,025** |

All ids are unique within each registry (408/408, 317/317). No fourth registry was created; Spotlight
(`data/nexus-spotlight.js`) stores only `{type, id, badge, released}` references that resolve to canonical records.

## Method

1. Exact match: candidate id, normalised name and official URL compared against all three registries.
2. Near match: name keyword search across all three registries (for example "claude", "scribe", "gemini 4", "gr00t").
3. Each near match was compared on vendor, product type and official URL. A record was only treated as a duplicate if it described the same product. No ambiguous merges were made.
4. Each candidate was checked against the vendor's own pages (product page, model card, API docs or official blog). Values the sources do not state (pricing, license, context window) are recorded as "Not stated" or described as such in `notes`, not inferred.

## Near-match decisions

| Candidate | Existing record | Decision |
|---|---|---|
| Scribe v3, Scribe v3 Live (models) | `tool:scribe` | Different product. The existing record is the Scribe workflow-documentation tool. Scribe v3 is ElevenLabs' speech-to-text model. |
| ElevenAI (tool) | `tool:elevenlabs` | Different product. ElevenAI is a separate note-taking/dictation app; `elevenlabs` is the voice platform. |
| Claude Meetings / Sheets / Whiteboards / Personal Finance (tools) | `tool:claude`, `tool:claude-code`, Claude 2/3 models | Different products. These are distinct features announced with their own pages and plan availability; the existing records are the chat app, the CLI and older models. |
| GPT-6 Cyber (model) | `tool:darktrace` (keyword "cyber" only) | Unrelated. |
| All other 15 models | none | No existing record for the product or for an earlier version under the same name. |

## Per-item record

| # | Registry | Id | Name | Vendor | Category | Official evidence | Notes recorded |
|---|---|---|---|---|---|---|---|
| 1 | Tools | `elevenai` | ElevenAI | ElevenLabs | Meetings & Communication | elevenlabs.io/elevenai-guide | Early access; pricing not stated |
| 2 | Tools | `claude-meetings` | Claude Meetings | Anthropic | Meetings & Communication | claude.com/resources/articles/claude-meetings | Beta; Google Meet only at launch |
| 3 | Tools | `claude-sheets` | Claude Sheets | Anthropic | Productivity | claude.com/resources/articles/sheets-whiteboards-data | All paid plans |
| 4 | Tools | `claude-whiteboards` | Claude Whiteboards | Anthropic | Productivity | claude.com/resources/articles/sheets-whiteboards-data | All paid plans |
| 5 | Tools | `claude-personal-finance` | Claude Personal Finance | Anthropic | Industry & Specialized | claude.com/resources/articles/introducing-personal-finance-in-claude | US beta; read-only connections |
| 6 | Models | `gemini-4-hydrogen` | Gemini 4 Hydrogen | Google DeepMind | Coding Models | deepmind.google model card; blog.google announcement | Pricing not stated |
| 7 | Models | `gemini-4-carbon` | Gemini 4 Carbon | Google DeepMind | Large Language Models | deepmind.google model card; blog.google announcement | Pricing not stated |
| 8 | Models | `gemini-decision-1` | Gemini Decision 1 | Google | Specialized Models | aistudio.google.com/docs/models/gemini-decision-1 | Pricing/GA not stated |
| 9 | Models | `claude-fable-5-2` | Claude Fable 5.2 | Anthropic | Large Language Models | anthropic.com/claude/fable; platform.claude.com model docs | Supersedes Fable 5 |
| 10 | Models | `claude-mythos-5-2` | Claude Mythos 5.2 | Anthropic | Specialized Models | anthropic.com/claude/mythos | Restricted access |
| 11 | Models | `muse-ember` | Muse Ember | Meta | Small / Edge Models | research.meta.ai/blog/muse-ember | License not stated |
| 12 | Models | `ernie-5-5-flash-preview` | ERNIE 5.5 Flash Preview | Baidu | Large Language Models | ernie.baidu.com release page | Preview; weights not yet published |
| 13 | Models | `pan-2` | PAN 2 | MBZUAI (IFM) | Specialized Models | huggingface.co/IFM/PAN2; ifm.ai/pan | 29B refers to the diffusion backbone |
| 14 | Models | `gemini-robotics-2-5` | Gemini Robotics 2.5 | Google DeepMind | Robotics & Embodied | deepmind.google VLA page and blog | Partner rollout |
| 15 | Models | `alphagenome-2` | AlphaGenome 2 | Google DeepMind | Specialized Models | deepmind.google blog; alphagenomedocs.com | Non-commercial / private preview |
| 16 | Models | `scribe-v3` | Scribe v3 | ElevenLabs | Audio & Speech | elevenlabs.io/blog/scribe-v3; ElevenLabs model docs | Not the Scribe tool |
| 17 | Models | `scribe-v3-live` | Scribe v3 Live | ElevenLabs | Audio & Speech | elevenlabs.io/blog/scribe-v3; ElevenLabs model docs | Pricing not stated |
| 18 | Models | `gpt-6-cyber` | GPT-6 Cyber | OpenAI | Specialized Models | openai.com announcement; developers.openai.com model docs | Requires Daybreak Red approval |
| 19 | Models | `gemini-omni-1-2-flash` | Gemini Omni 1.2 Flash | Google | Video Generation | blog.google announcement; cloud.google.com GA post | Per-token rates not listed |
| 20 | Models | `minimax-h3-image` | MiniMax H3-Image | MiniMax | Image Generation | minimax.io blog; huggingface.co/MiniMaxAI | License name not stated |
| 21 | Models | `images-2-6` | Images 2.6 | OpenAI | Image Generation | openai.com announcement; developers.openai.com model docs | API id `gpt-image-2.6-sunburst` |
| 22 | Models | `groot-2` | GR00T 2 | NVIDIA | Robotics & Embodied | research.nvidia.com GEAR page and whitepaper | Code due December 2026; license not stated |

Full evidence URLs are stored in each record's `evidence` field in `.qa/nexus-additions.json` and in the registry files.

## Downstream files regenerated from the registries

- `data/ai-tools.js`, `data/ai-models.js` (records + meta `count`, `last_verified: 2026-11-14`)
- Root `ai-models.json` / `ai-resources-1000.json` mirrors (appended)
- `data/related-index.js` (`.qa/refresh-related-index.js`: 408 / 317 / 300 rows)
- `api/*.json` and `api/catalog.json` (`.qa/api-build.js`: total 1,025)
- `api.html` (`.qa/refresh-api-page.js`)
- Count copy in `terminal.html`, `about.html`, `ai-tools.html`, `models.html`, `.qa/update-seo-heads.js`

No icons were added: all 22 new records use `icon: null` and fall back to initials, because no locally verified logo assets were available.
