const fs = require('fs');
const path = require('path');

const records = JSON.parse(fs.readFileSync(path.join(__dirname, 'dev-records.json'), 'utf8'));

const SOURCE = 'https://github.com/kumaradoss16/ai-knowledge-base/blob/main/ai-tools/ai-tools-models-developer-resources.md';

const CATEGORIES = [
  'Agent Frameworks',
  'Vector Databases & RAG',
  'Model Serving & Inference',
  'Local Runtimes',
  'Fine-Tuning & Optimization',
  'Evaluation & Observability',
  'AI Security & Guardrails',
  'APIs, Gateways & Protocols',
  'Cloud & GPU Infrastructure'
];

// id -> [category, resource type]
const TYPE_MAP = {
  langchain: ['Agent Frameworks', 'Framework'],
  langgraph: ['Agent Frameworks', 'Framework'],
  crewai: ['Agent Frameworks', 'Framework'],
  autogen: ['Agent Frameworks', 'Framework'],
  dspy: ['Agent Frameworks', 'Framework'],
  dify: ['Agent Frameworks', 'Platform / Service'],
  flowise: ['Agent Frameworks', 'Platform / Service'],
  langflow: ['Agent Frameworks', 'Platform / Service'],
  n8n: ['Agent Frameworks', 'Platform / Service'],

  llamaindex: ['Vector Databases & RAG', 'Framework'],
  qdrant: ['Vector Databases & RAG', 'Database / Index'],
  pinecone: ['Vector Databases & RAG', 'Database / Index'],
  weaviate: ['Vector Databases & RAG', 'Database / Index'],
  chroma: ['Vector Databases & RAG', 'Database / Index'],
  pgvector: ['Vector Databases & RAG', 'Database / Index'],
  lancedb: ['Vector Databases & RAG', 'Database / Index'],
  milvus: ['Vector Databases & RAG', 'Database / Index'],
  faiss: ['Vector Databases & RAG', 'SDK / Library'],
  haystack: ['Vector Databases & RAG', 'Framework'],
  txtai: ['Vector Databases & RAG', 'SDK / Library'],
  ragflow: ['Vector Databases & RAG', 'Platform / Service'],
  graphrag: ['Vector Databases & RAG', 'SDK / Library'],

  vllm: ['Model Serving & Inference', 'Inference Engine'],
  sglang: ['Model Serving & Inference', 'Inference Engine'],
  'tensorrt-llm': ['Model Serving & Inference', 'SDK / Library'],
  'together-ai': ['Model Serving & Inference', 'Platform / Service'],
  'groq-cloud': ['Model Serving & Inference', 'Platform / Service'],
  replicate: ['Model Serving & Inference', 'Platform / Service'],
  'huggingface-hub': ['Model Serving & Inference', 'Platform / Service'],

  ollama: ['Local Runtimes', 'Desktop App / Runtime'],
  'llama-cpp': ['Local Runtimes', 'Inference Engine'],
  'lm-studio': ['Local Runtimes', 'Desktop App / Runtime'],
  localai: ['Local Runtimes', 'Desktop App / Runtime'],
  jan: ['Local Runtimes', 'Desktop App / Runtime'],

  unsloth: ['Fine-Tuning & Optimization', 'SDK / Library'],
  axolotl: ['Fine-Tuning & Optimization', 'Framework'],
  mlx: ['Fine-Tuning & Optimization', 'Framework'],

  langfuse: ['Evaluation & Observability', 'Platform / Service'],
  'arize-phoenix': ['Evaluation & Observability', 'Platform / Service'],
  braintrust: ['Evaluation & Observability', 'Platform / Service'],
  deepeval: ['Evaluation & Observability', 'Framework'],
  ragas: ['Evaluation & Observability', 'Framework'],

  'guardrails-ai': ['AI Security & Guardrails', 'Framework'],
  'nemo-guardrails': ['AI Security & Guardrails', 'SDK / Library'],

  'openai-api-platform': ['APIs, Gateways & Protocols', 'Platform / Service'],
  'anthropic-api': ['APIs, Gateways & Protocols', 'Platform / Service'],
  litellm: ['APIs, Gateways & Protocols', 'SDK / Library'],
  openrouter: ['APIs, Gateways & Protocols', 'Platform / Service'],
  'mcp-sdk': ['APIs, Gateways & Protocols', 'SDK / Library'],

  modal: ['Cloud & GPU Infrastructure', 'Platform / Service'],
  runpod: ['Cloud & GPU Infrastructure', 'Platform / Service']
};

// id -> [license, license chip, open source]
const LICENSE_MAP = {
  langchain: ['MIT', 'MIT', true],
  llamaindex: ['MIT', 'MIT', true],
  qdrant: ['Apache 2.0', 'Apache 2.0', true],
  ollama: ['MIT', 'MIT', true],
  vllm: ['Apache 2.0', 'Apache 2.0', true],
  'huggingface-hub': [null, null, false],
  pinecone: [null, null, false],
  weaviate: ['BSD-3-Clause', 'BSD-3', true],
  langgraph: ['MIT', 'MIT', true],
  crewai: ['MIT', 'MIT', true],
  langfuse: ['MIT', 'MIT', true],
  'openai-api-platform': [null, null, false],
  'anthropic-api': [null, null, false],
  'llama-cpp': ['MIT', 'MIT', true],
  chroma: ['Apache 2.0', 'Apache 2.0', true],
  autogen: ['MIT', 'MIT', true],
  replicate: [null, null, false],
  'mcp-sdk': ['MIT', 'MIT', true],
  litellm: ['MIT', 'MIT', true],
  sglang: ['Apache 2.0', 'Apache 2.0', true],
  'tensorrt-llm': ['Apache 2.0', 'Apache 2.0', true],
  unsloth: ['Apache 2.0', 'Apache 2.0', true],
  axolotl: ['Apache 2.0', 'Apache 2.0', true],
  dspy: ['MIT', 'MIT', true],
  openrouter: [null, null, false],
  'together-ai': [null, null, false],
  'groq-cloud': [null, null, false],
  modal: [null, null, false],
  runpod: [null, null, false],
  braintrust: [null, null, false],
  'arize-phoenix': ['Apache 2.0', 'Apache 2.0', true],
  'guardrails-ai': ['Apache 2.0', 'Apache 2.0', true],
  pgvector: ['PostgreSQL License', 'PostgreSQL', true],
  lancedb: ['Apache 2.0', 'Apache 2.0', true],
  milvus: ['Apache 2.0', 'Apache 2.0', true],
  faiss: ['MIT', 'MIT', true],
  haystack: ['Apache 2.0', 'Apache 2.0', true],
  txtai: ['Apache 2.0', 'Apache 2.0', true],
  ragflow: ['Apache 2.0', 'Apache 2.0', true],
  graphrag: ['MIT', 'MIT', true],
  dify: ['Apache 2.0 with commercial restrictions (Dify Open Source License)', 'Dify License', true],
  flowise: ['MIT', 'MIT', true],
  langflow: ['MIT', 'MIT', true],
  n8n: ['Sustainable Use License (source-available)', 'Sustainable Use', false],
  'lm-studio': ['Proprietary (free for personal use)', 'Proprietary', false],
  localai: ['MIT', 'MIT', true],
  jan: ['AGPL-3.0', 'AGPL-3.0', true],
  mlx: ['MIT', 'MIT', true],
  deepeval: ['Apache 2.0', 'Apache 2.0', true],
  ragas: ['Apache 2.0', 'Apache 2.0', true],
  'nemo-guardrails': ['Apache 2.0', 'Apache 2.0', true]
};

// id -> languages explicitly stated in the source
const LANGUAGE_MAP = {
  langchain: ['Python', 'JavaScript'],
  llamaindex: ['Python'],
  qdrant: ['Rust'],
  langgraph: ['Python'],
  crewai: ['Python'],
  'llama-cpp': ['C++'],
  chroma: ['Python', 'JavaScript'],
  autogen: ['Python', '.NET'],
  'mcp-sdk': ['Python', 'TypeScript', 'Kotlin'],
  'tensorrt-llm': ['Python', 'C++'],
  dspy: ['Python'],
  modal: ['Python'],
  'guardrails-ai': ['Python', 'JavaScript'],
  lancedb: ['Python', 'JavaScript'],
  faiss: ['C++', 'Python'],
  haystack: ['Python'],
  langflow: ['Python'],
  mlx: ['Python', 'C++']
};

// id -> icon file in assets/img/icons
const ICON_MAP = {
  langchain: 'langchain.png',
  llamaindex: 'llamaindex.png',
  qdrant: 'qdrant.png',
  ollama: 'ollama.png',
  vllm: 'vllm.png',
  'huggingface-hub': 'huggingface.png',
  pinecone: 'pinecone.png',
  weaviate: 'weaviate.png',
  langgraph: 'langchain.png',
  crewai: 'crewai.png',
  langfuse: 'langfuse.png',
  'openai-api-platform': 'openai.png',
  'anthropic-api': 'anthropic.png',
  'llama-cpp': 'llama-cpp.png',
  chroma: 'chroma.png',
  autogen: 'microsoft.png',
  replicate: 'replicate.png',
  'mcp-sdk': 'mcp.png',
  litellm: 'litellm.png',
  sglang: 'github.png',
  'tensorrt-llm': 'nvidia.png',
  unsloth: 'unsloth.png',
  axolotl: 'github.png',
  dspy: 'dspy.png',
  openrouter: 'openrouter.png',
  'together-ai': 'together-ai.png',
  'groq-cloud': 'groq.png',
  modal: 'modal.png',
  runpod: 'runpod.png',
  braintrust: 'braintrust.png',
  'arize-phoenix': 'arize.png',
  'guardrails-ai': 'guardrails-ai.png',
  pgvector: 'postgresql.png',
  lancedb: 'lancedb.png',
  milvus: 'milvus.png',
  faiss: 'meta.png',
  haystack: 'deepset.png',
  txtai: 'github.png',
  ragflow: 'ragflow.png',
  graphrag: 'microsoft.png',
  dify: 'dify.png',
  flowise: 'flowise.png',
  langflow: 'langflow.png',
  n8n: 'n8n.png',
  'lm-studio': 'lm-studio.png',
  localai: 'localai.png',
  jan: 'jan.png',
  mlx: 'apple.png',
  deepeval: 'confident-ai.png',
  ragas: 'ragas.png',
  'nemo-guardrails': 'nvidia.png'
};

const PRICING_LABEL = {
  open_source: 'Free / Self-Hosted',
  free_tier: 'Free Tier',
  freemium: 'Freemium',
  usage_based: 'Usage-Based',
  free: 'Free'
};

const clean = (s) => (s ? s.replace(/\\\$/g, '$').replace(/\n\n---\s*$/, '').trim() : null);

const host = (u) => {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return null; }
};

const pick = (evidence, test) => {
  const hit = evidence.find(([label, url]) => test(label, url));
  return hit ? hit[1] : null;
};

const out = records.map((r) => {
  const id = r.id.replace(/^developer_resource:/, '');
  const type = TYPE_MAP[id];
  const lic = LICENSE_MAP[id];
  const icon = ICON_MAP[id];
  if (!type) throw new Error('Missing type mapping: ' + id);
  if (!lic) throw new Error('Missing license mapping: ' + id);
  if (!icon) throw new Error('Missing icon mapping: ' + id);
  if (!fs.existsSync(path.join(__dirname, '..', 'assets', 'img', 'icons', icon))) {
    throw new Error('Missing icon file for ' + id + ': ' + icon);
  }

  const evidence = r.evidence.filter(([label, url]) => host(url) !== 'google.com');
  const documentation = pick(r.evidence, (label) => /doc/i.test(label) && !/icon/i.test(label));
  const repository = pick(r.evidence, (label, url) => /github/i.test(label) && host(url) === 'github.com');

  return {
    id,
    name: r.name,
    description: r.desc,
    category: type[0],
    resource_type: type[1],
    resource_subtype: r.subtype,
    official_url: r.officialUrl,
    documentation_url: documentation,
    repository_url: repository,
    api_url: null,
    pricing: PRICING_LABEL[r.pricingClass],
    pricing_class: r.pricingClass,
    license: lic[0],
    license_short: lic[1],
    open_source: lic[2],
    hosting: r.local ? ['Self-hosted'] : ['Managed cloud'],
    self_hostable: r.local,
    signup_required: r.signup,
    programming_languages: LANGUAGE_MAP[id] || [],
    integrations: [],
    tags: r.tags,
    icon: 'assets/img/icons/' + icon,
    verified: r.verified,
    status: r.status,
    notes: clean(r.notes),
    evidence,
    source: SOURCE
  };
});

const ids = new Set();
out.forEach((x) => {
  if (ids.has(x.id)) throw new Error('Duplicate id: ' + x.id);
  ids.add(x.id);
});

const catCounts = {};
out.forEach((x) => { catCounts[x.category] = (catCounts[x.category] || 0) + 1; });
CATEGORIES.forEach((c) => { if (!catCounts[c]) throw new Error('Empty category: ' + c); });
const unknown = Object.keys(catCounts).filter((c) => !CATEGORIES.includes(c));
if (unknown.length) throw new Error('Unmapped categories: ' + unknown.join(', '));

const header = `/* DevSpireHub AI Intelligence Directory - Developer Resources dataset
 * Source: ${SOURCE}
 * Records: ${out.length}. Every record is extracted from the source above and verified ${out[0].verified}.
 * Presentation and filtering logic live in developer-resources.html; this file only holds data.
 * Fields the source does not state are null or empty arrays - never invented.
 */
window.DEVELOPER_RESOURCES = ${JSON.stringify(out, null, 2)};
window.DEVELOPER_RESOURCES_META = ${JSON.stringify({
  count: out.length,
  source: SOURCE,
  last_verified: out[0].verified,
  catalog: 'developer-resources'
}, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '..', 'data', 'developer-resources.js'), header);

console.log('records:', out.length);
console.log('categories:', CATEGORIES.map((c) => c + '=' + catCounts[c]).join(' | '));
console.log('open source:', out.filter((x) => x.open_source).length);
console.log('self-hostable:', out.filter((x) => x.self_hostable).length);
console.log('with docs:', out.filter((x) => x.documentation_url).length, 'with repo:', out.filter((x) => x.repository_url).length);
console.log('missing official:', out.filter((x) => !x.official_url).map((x) => x.id));
