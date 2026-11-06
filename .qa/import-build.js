/* Reproducible importer for the three uploaded AI resource registries.
   Source files in G:/Downloads are copied byte-for-byte to .qa/source/ and
   were never modified. Every generated record keeps its source canonical_id,
   verified URL and evidence URLs; missing values stay null instead of being
   invented. Run: node .qa/import-build.js */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = 'G:/Downloads';
const KEEP_DIR = path.join(__dirname, 'source');
const FILES = {
  tools: 'ai-tools.json',
  models: 'ai-models.json',
  dev: 'developer-resources.json',
  combined: 'ai-resources-1000.json'
};

fs.mkdirSync(KEEP_DIR, { recursive: true });

function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }

function readSource(name) {
  const from = path.join(SRC_DIR, name);
  const to = path.join(KEEP_DIR, name);
  const original = fs.readFileSync(from);
  fs.writeFileSync(to, original);
  const copy = fs.readFileSync(to);
  if (sha256(original) !== sha256(copy)) throw new Error('Source copy mismatch: ' + name);
  return { records: JSON.parse(original.toString('utf8')), hash: sha256(original), bytes: original.length };
}

const source = Object.fromEntries(Object.entries(FILES).map(([k, f]) => [k, readSource(f)]));

/* ---------- Existing registries (legacy enrichment, never replaced blindly) ---------- */
/* These are the pre-import registries captured in .qa/legacy/. They are used
   only for exact canonical-id enrichment and for the three records that do not
   exist in the uploaded files. Name/URL similarity never transfers specs. */
const LEGACY_DIR = path.join(__dirname, 'legacy');
const OLD = {
  tools: JSON.parse(fs.readFileSync(path.join(LEGACY_DIR, 'tools.json'), 'utf8')),
  models: JSON.parse(fs.readFileSync(path.join(LEGACY_DIR, 'models.json'), 'utf8')),
  dev: JSON.parse(fs.readFileSync(path.join(LEGACY_DIR, 'developer-resources.json'), 'utf8'))
};

/* ---------- Verified icon integration mapping from icon-verification-report.json ---------- */
const VERIFIED_ICONS = (() => {
  const map = new Map();
  try {
    const repPath = path.join(ROOT, 'icon-verification-report.json');
    if (fs.existsSync(repPath)) {
      const rep = JSON.parse(fs.readFileSync(repPath, 'utf8'));
      const combined = source.combined ? source.combined.records : [];
      const idToCanonical = new Map(combined.map((r) => [r.id, r.canonical_id]));
      for (const rec of rep.records || []) {
        const lp = rec.local_path;
        if (lp && fs.existsSync(path.join(ROOT, lp))) {
          const cid = idToCanonical.get(rec.resource_id);
          if (cid) map.set(cid, lp);
          if (rec.domain) map.set('domain:' + rec.domain, lp);
        }
      }
    }
  } catch (e) {
    console.error('Warning: could not load icon verification report:', e.message);
  }
  return map;
})();

function resolveIcon(s, old) {
  const verified = VERIFIED_ICONS.get(s.canonical_id) || (s.domain ? VERIFIED_ICONS.get('domain:' + s.domain) : null);
  if (verified && fs.existsSync(path.join(ROOT, verified))) {
    return verified;
  }
  if (old && old.icon && fs.existsSync(path.join(ROOT, old.icon))) {
    return old.icon;
  }
  return null;
}

/* ---------- Category normalization (source category -> display taxonomy) ---------- */
const TOOL_CATEGORY_ORDER = [
  'Assistants & Chatbots', 'Search & Research', 'Coding & Development', 'Writing & Content',
  'Productivity', 'Meetings & Communication', 'Agents & Automation', 'Image & Design',
  'Video', 'Audio & Speech', 'Business & Enterprise', 'Data & Analytics',
  'Infrastructure & Security', 'Industry & Specialized'
];
const TOOL_CATEGORY = {
  'General-purpose AI Assistants': 'Assistants & Chatbots',
  'AI Chatbots': 'Assistants & Chatbots',
  'AI Search and Research Assistants': 'Search & Research',
  'AI Search and Intelligence': 'Search & Research',
  'AI Knowledge Management': 'Search & Research',
  'AI Research and Scientific Applications': 'Search & Research',
  'Enterprise Search and Knowledge Discovery': 'Search & Research',
  'AI Coding Assistants': 'Coding & Development',
  'AI IDEs and Code Editors': 'Coding & Development',
  'AI Code Review and Debugging': 'Coding & Development',
  'AI Code Review': 'Coding & Development',
  'Autonomous QA and Software Testing': 'Coding & Development',
  'Developer Tooling': 'Coding & Development',
  'AI Writing and Editing': 'Writing & Content',
  'AI Content Generation': 'Writing & Content',
  'AI Translation': 'Writing & Content',
  'AI Document Processing': 'Writing & Content',
  'AI Productivity': 'Productivity',
  'AI Presentation Builders': 'Productivity',
  'AI Office Automation': 'Productivity',
  'AI Browser Extensions': 'Productivity',
  'AI Desktop Applications': 'Productivity',
  'AI Meeting Assistants': 'Meetings & Communication',
  'AI Agents and Agent Builders': 'Agents & Automation',
  'AI Workflow Automation': 'Agents & Automation',
  'AI Image Generation': 'Image & Design',
  'AI Image Editing': 'Image & Design',
  'AI Design Tools': 'Image & Design',
  '3D Generative AI': 'Image & Design',
  'AI Video Generation': 'Video',
  'AI Video Editing': 'Video',
  'AI Audio/Video Editing': 'Video',
  'AI Voice Generation': 'Audio & Speech',
  'AI Audio Generation': 'Audio & Speech',
  'AI Music Generation': 'Audio & Speech',
  'Speech Recognition and Transcription': 'Audio & Speech',
  'Speech-to-Text Software': 'Audio & Speech',
  'Speech Recognition and Synthesis': 'Audio & Speech',
  'AI Hardware and Voice Recorders': 'Audio & Speech',
  'AI Sales and CRM': 'Business & Enterprise',
  'AI Sales CRM': 'Business & Enterprise',
  'AI Recruiting and HR': 'Business & Enterprise',
  'AI Customer Support': 'Business & Enterprise',
  'AI Customer Service': 'Business & Enterprise',
  'Customer Support and Conversational AI': 'Business & Enterprise',
  'AI Marketing and SEO': 'Business & Enterprise',
  'AI Social Media Management': 'Business & Enterprise',
  'AI E-commerce': 'Business & Enterprise',
  'Legal and Compliance AI': 'Business & Enterprise',
  'AI Data Analysis': 'Data & Analytics',
  'AI Business Intelligence': 'Data & Analytics',
  'AI Analytics and BI': 'Data & Analytics',
  'AI Guardrails': 'Infrastructure & Security',
  'Model Serving and Deployment': 'Infrastructure & Security',
  'Game AI Tools': 'Industry & Specialized',
  'Robotics and Embodied AI': 'Industry & Specialized'
};

const MODEL_CATEGORY_ORDER = [
  'Large Language Models', 'Reasoning & CoT', 'Coding Models', 'Vision & Multimodal',
  'Image Generation', '3D Generation', 'Video Generation', 'Audio & Speech',
  'Embeddings & Rerankers', 'Small / Edge Models', 'Robotics & Embodied', 'Specialized Models'
];
const MODEL_CATEGORY = {
  'Large Language Models': 'Large Language Models',
  'Open-Weight Models': 'Large Language Models',
  'Reasoning Models': 'Reasoning & CoT',
  'Mathematical Reasoning Models': 'Reasoning & CoT',
  'Code Generation Models': 'Coding Models',
  'Vision-Language Models': 'Vision & Multimodal',
  'Multimodal Models': 'Vision & Multimodal',
  'Image Segmentation Models': 'Vision & Multimodal',
  'Object Detection Models': 'Vision & Multimodal',
  'Video Understanding Models': 'Vision & Multimodal',
  'Diffusion Models': 'Image Generation',
  'Image Generation Models': 'Image Generation',
  'Image Editing Models': 'Image Generation',
  '3D Generation Models': '3D Generation',
  'Video Generation Models': 'Video Generation',
  'Speech-to-Text Models': 'Audio & Speech',
  'Text-to-Speech Models': 'Audio & Speech',
  'Audio Generation Models': 'Audio & Speech',
  'Music Generation Models': 'Audio & Speech',
  'Audio Understanding Models': 'Audio & Speech',
  'Speech Recognition and Synthesis': 'Audio & Speech',
  'Embedding Models': 'Embeddings & Rerankers',
  'Reranking Models': 'Embeddings & Rerankers',
  'Small Language Models': 'Small / Edge Models',
  'Robotics and Embodied AI': 'Robotics & Embodied',
  'Spatial and Robotics Models': 'Robotics & Embodied',
  'Domain-Specific Models': 'Specialized Models',
  'Safety and Moderation Models': 'Specialized Models',
  'Time-Series Models': 'Specialized Models'
};

const DEV_CATEGORY_ORDER = [
  'Agent Frameworks', 'Vector Databases & RAG', 'Model Serving & Inference', 'Local Runtimes',
  'Fine-Tuning & Optimization', 'Evaluation & Observability', 'AI Security & Guardrails',
  'APIs, Gateways & Protocols', 'Cloud & GPU Infrastructure', 'Developer Tooling & QA',
  'Data & Annotation', 'Robotics & Embodied AI'
];
const DEV_CATEGORY = {
  'Agent Frameworks': 'Agent Frameworks',
  'Multi-Agent Frameworks': 'Agent Frameworks',
  'LLM Orchestration Frameworks': 'Agent Frameworks',
  'Agent Engineering': 'Agent Frameworks',
  'AI Agent Frameworks': 'Agent Frameworks',
  'Agent Orchestration': 'Agent Frameworks',
  'Agent Memory Systems': 'Agent Frameworks',
  'Tool Calling Frameworks': 'Agent Frameworks',
  'Agent Communication': 'Agent Frameworks',
  'AI Agents and Agent Builders': 'Agent Frameworks',
  'AI Workflow Automation': 'Agent Frameworks',
  'Vector Databases': 'Vector Databases & RAG',
  'Vector Search Engines': 'Vector Databases & RAG',
  'Vector Database Integrations': 'Vector Databases & RAG',
  'RAG Frameworks': 'Vector Databases & RAG',
  'RAG and Knowledge Systems': 'Vector Databases & RAG',
  'Knowledge Graph Systems': 'Vector Databases & RAG',
  'Chunking and Indexing': 'Vector Databases & RAG',
  'Document Parsing': 'Vector Databases & RAG',
  'Data Connectors and Extractors': 'Vector Databases & RAG',
  'Hybrid Search': 'Vector Databases & RAG',
  'Model Serving and Deployment': 'Model Serving & Inference',
  'Model Serving': 'Model Serving & Inference',
  'Model Deployment': 'Model Serving & Inference',
  'Model Hosting': 'Model Serving & Inference',
  'Inference Engines': 'Model Serving & Inference',
  'Inference APIs': 'Model Serving & Inference',
  'Inference Optimization': 'Model Serving & Inference',
  'Distributed Inference': 'Model Serving & Inference',
  'Model Optimization': 'Model Serving & Inference',
  'Model Quantization': 'Model Serving & Inference',
  'Model Compression and Quantization': 'Model Serving & Inference',
  'Model Serialization': 'Model Serving & Inference',
  'Model Interoperability': 'Model Serving & Inference',
  'Local AI and Model Infrastructure': 'Local Runtimes',
  'Local LLM Runtimes': 'Local Runtimes',
  'Edge AI and On-Device Runtimes': 'Local Runtimes',
  'Fine-Tuning Frameworks': 'Fine-Tuning & Optimization',
  'Training Infrastructure': 'Fine-Tuning & Optimization',
  'AI Observability': 'Evaluation & Observability',
  'AI Tracing': 'Evaluation & Observability',
  'AI Evaluation': 'Evaluation & Observability',
  'Model Benchmarking': 'Evaluation & Observability',
  'Experiment Tracking': 'Evaluation & Observability',
  'AI Testing and Quality Assurance': 'Evaluation & Observability',
  'AI Security and Reliability': 'AI Security & Guardrails',
  'Prompt Injection Protection': 'AI Security & Guardrails',
  'AI Guardrails': 'AI Security & Guardrails',
  'AI Red Teaming': 'AI Security & Guardrails',
  'Content Moderation': 'AI Security & Guardrails',
  'Safety and Moderation Models': 'AI Security & Guardrails',
  'Model Governance': 'AI Security & Guardrails',
  'Data Validation': 'AI Security & Guardrails',
  'AI Gateways': 'APIs, Gateways & Protocols',
  'API Gateways': 'APIs, Gateways & Protocols',
  'Model Routing and Aggregation': 'APIs, Gateways & Protocols',
  'Model APIs': 'APIs, Gateways & Protocols',
  'AI APIs': 'APIs, Gateways & Protocols',
  'Embedding APIs': 'APIs, Gateways & Protocols',
  'MCP Servers': 'APIs, Gateways & Protocols',
  'MCP Registries': 'APIs, Gateways & Protocols',
  'AI SDKs': 'APIs, Gateways & Protocols',
  'Structured Outputs': 'APIs, Gateways & Protocols',
  'Prompt Management': 'APIs, Gateways & Protocols',
  'AI Cloud Infrastructure': 'Cloud & GPU Infrastructure',
  'GPU Acceleration': 'Cloud & GPU Infrastructure',
  'GPU Cloud Platforms': 'Cloud & GPU Infrastructure',
  'Compute Platforms': 'Cloud & GPU Infrastructure',
  'Developer Tooling': 'Developer Tooling & QA',
  'Autonomous QA and Software Testing': 'Developer Tooling & QA',
  'Data Annotation': 'Data & Annotation',
  'Synthetic Data Generation': 'Data & Annotation',
  'Dataset Management': 'Data & Annotation',
  'Data Processing': 'Data & Annotation',
  'Robotics and Embodied AI': 'Robotics & Embodied AI'
};

/* ---------- Small helpers ---------- */
const PRICING_LABEL = {
  freemium: 'Freemium', paid: 'Paid', free: 'Free', free_tier: 'Free Tier',
  usage_based: 'Usage-Based', open_source: 'Open Source', open_weights: 'Open Weights'
};
const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const initials = (s) => String(s || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || 'AI';
const stripSlash = (u) => String(u || '').replace(/\/+$/, '').toLowerCase();
const firstEvidence = (s) => (s.evidence_sources || []).find((u) => /^https?:\/\//i.test(u)) || null;
const officialUrl = (s) => (s.verified_link && s.verified_link.url) || firstEvidence(s) || null;
const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } };
const rootOf = (host) => {
  const clean = String(host || '').replace(/^www\./, '');
  const parts = clean.split('.');
  if (parts.length >= 2) return parts[parts.length - 2];
  return clean;
};

/* Provider key keeps GitHub/Hugging Face owners apart (openai vs tencent) and
   normalizes normal vendor domains to their registrable root. */
function providerKey(url) {
  const host = hostOf(url);
  if (!host) return '';
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    if (host === 'github.com' && parts[0]) return 'github.com/' + parts[0].toLowerCase();
    if (host === 'huggingface.co' && parts.length) {
      const owner = parts[0] === 'collections' && parts[1] ? parts[1] : parts[0];
      return 'huggingface.co/' + owner.toLowerCase();
    }
  } catch { /* ignore malformed URLs */ }
  return rootOf(host);
}

const BRAND = {
  openai: 'OpenAI', 'openai-community': 'OpenAI', anthropic: 'Anthropic', google: 'Google',
  deepmind: 'Google DeepMind', 'google-deepmind': 'Google DeepMind', 'google-research': 'Google Research',
  meta: 'Meta', 'meta-llama': 'Meta', facebook: 'Meta', facebookresearch: 'Meta AI', ai: 'Meta AI',
  mistralai: 'Mistral AI', mistral: 'Mistral AI', qwen: 'Qwen', qwenlm: 'Qwen', deepseek: 'DeepSeek',
  'deepseek-ai': 'DeepSeek', huggingface: 'Hugging Face', microsoft: 'Microsoft', nvidia: 'NVIDIA',
  stabilityai: 'Stability AI', 'stability-ai': 'Stability AI', blackforestlabs: 'Black Forest Labs',
  'black-forest-labs': 'Black Forest Labs', cohere: 'Cohere', cohereforai: 'Cohere', 'cohere-ai': 'Cohere',
  ai21: 'AI21 Labs', 'ai21labs': 'AI21 Labs', tii: 'TII', tiiuae: 'TII', ibm: 'IBM', internlm: 'InternLM',
  openbmb: 'OpenBMB', zhipuai: 'Zhipu AI', thudm: 'THUDM', '01-ai': '01.AI', '01': '01.AI', baai: 'BAAI',
  allenai: 'Allen Institute for AI', eleutherai: 'EleutherAI', together: 'Together AI',
  togethercomputer: 'Together AI', mosaicml: 'MosaicML', databricks: 'Databricks', salesforce: 'Salesforce',
  snowflake: 'Snowflake', voyageai: 'Voyage AI', 'jina-ai': 'Jina AI', jina: 'Jina AI', 'nomic-ai': 'Nomic AI',
  nomic: 'Nomic AI', 'sentence-transformers': 'Sentence Transformers', tencent: 'Tencent', coqui: 'Coqui',
  'kwai-kolors': 'Kwai-Kolors', kuaishou: 'Kuaishou', suno: 'Suno', opengvlab: 'OpenGVLab',
  langchain: 'LangChain', 'langchain-ai': 'LangChain', llamaindex: 'LlamaIndex', 'run-llama': 'LlamaIndex',
  ollama: 'Ollama', vllm: 'vLLM', 'vllm-project': 'vLLM', pinecone: 'Pinecone', weaviate: 'Weaviate',
  chroma: 'Chroma', trychroma: 'Chroma', crewai: 'CrewAI', crewaiinc: 'CrewAI', langfuse: 'Langfuse',
  litellm: 'LiteLLM', berriai: 'BerriAI', sglang: 'SGLang', 'sgl-project': 'SGLang', unsloth: 'Unsloth',
  axolotl: 'Axolotl', 'axolotl-ai-cloud': 'Axolotl', dspy: 'DSPy', stanfordnlp: 'Stanford NLP',
  openrouter: 'OpenRouter', groq: 'Groq', modal: 'Modal', runpod: 'RunPod', braintrust: 'Braintrust',
  arize: 'Arize', 'arize-ai': 'Arize', guardrailsai: 'Guardrails AI', 'guardrails-ai': 'Guardrails AI',
  pgvector: 'pgvector', lancedb: 'LanceDB', milvus: 'Milvus', 'milvus-io': 'Milvus', faiss: 'FAISS',
  haystack: 'Haystack', 'deepset-ai': 'deepset', txtai: 'txtai', neuml: 'NeuML', ragflow: 'RAGFlow',
  infiniflow: 'InfiniFlow', graphrag: 'GraphRAG', dify: 'Dify', langgenius: 'LangGenius', flowise: 'Flowise',
  flowiseai: 'Flowise', langflow: 'LangFlow', 'langflow-ai': 'LangFlow', n8n: 'n8n', 'n8n-io': 'n8n',
  lmstudio: 'LM Studio', 'lm-studio': 'LM Studio', localai: 'LocalAI', mudler: 'LocalAI', jan: 'Jan',
  janhq: 'Jan', mlx: 'MLX', 'ml-explore': 'MLX', deepeval: 'DeepEval', 'confident-ai': 'Confident AI',
  ragas: 'RAGAS', explodinggradients: 'Exploding Gradients', 'nemo-guardrails': 'NeMo Guardrails',
  aclanthology: 'ACL Anthology', arxiv: 'arXiv', openreview: 'OpenReview', qdrant: 'Qdrant',
  replicate: 'Replicate', anthropicai: 'Anthropic', fireworks: 'Fireworks AI', upstage: 'Upstage',
  databricks: 'Databricks', snowflake: 'Snowflake', alpindale: 'Alpindale', moonshotai: 'Moonshot AI',
  moonshot: 'Moonshot AI', minimax: 'MiniMax', baichuan: 'Baichuan', 'baichuan-inc': 'Baichuan',
  'internlm': 'InternLM', 'zhipu-ai': 'Zhipu AI', 'salesforce': 'Salesforce', 'bigcode': 'BigCode',
  'openlm-research': 'OpenLM Research', 'roneneldan': 'Microsoft Research',
  'microsoftresearch': 'Microsoft Research', 'allen-ai': 'Allen Institute for AI', 'myShell': 'MyShell',
  myshell: 'MyShell', 'opendatalab': 'OpenDataLab', 'evolutionaryscale': 'EvolutionaryScale',
  'ultralytics': 'Ultralytics', 'moondream': 'Moondream', 'snowflake': 'Snowflake'
};
function brandName(key) {
  if (!key) return null;
  const k = key.toLowerCase();
  if (BRAND[k]) return BRAND[k];
  return k.split(/[-_]/).filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
function derivePublisher(s) {
  const url = officialUrl(s);
  const pk = providerKey(url);
  if (pk && pk.includes('/')) return brandName(pk.split('/')[1]);
  const sourceDomain = s.domain && s.domain !== 'github.com' && s.domain !== 'huggingface.co' ? s.domain : hostOf(url);
  return brandName(rootOf(sourceDomain)) || 'Not stated';
}

function evidencePairs(s) {
  const seen = new Set();
  const out = [];
  for (const url of [officialUrl(s), ...(s.evidence_sources || [])]) {
    if (!/^https?:\/\//i.test(url || '') || seen.has(url)) continue;
    seen.add(url);
    out.push([url === officialUrl(s) ? 'Official website' : hostOf(url), url]);
  }
  return out;
}
function mergeEvidence(oldPairs, s) {
  const fresh = evidencePairs(s);
  if (!Array.isArray(oldPairs) || !oldPairs.length) return fresh;
  const labels = new Map(oldPairs.map(([label, url]) => [stripSlash(url), label]));
  return fresh.map(([label, url]) => [labels.get(stripSlash(url)) || label, url]);
}

/* ---------- Tools ---------- */
function mapTool(s, old) {
  const cat = TOOL_CATEGORY[s.category];
  if (!cat) throw new Error('Unmapped tool category: ' + s.category);
  const url = officialUrl(s);
  const local = s.local_execution;
  return {
    id: s.canonical_id.split(':')[1] || slug(s.name),
    name: s.name,
    org: old ? old.org : null,
    description: s.description,
    category: cat,
    source_category: s.category,
    resource_type: 'AI Tool',
    official_url: url,
    pricing: PRICING_LABEL[s.pricing] || s.pricing,
    pricing_class: s.pricing,
    license: old ? old.license : null,
    open_source: s.pricing === 'open_source' || !!(old && old.open_source),
    platform: old ? old.platform : null,
    hosting: old && old.hosting ? old.hosting : (local === 'Yes' ? ['Self-hosted'] : local === 'Partial' ? ['Hybrid'] : ['Managed Cloud']),
    self_hostable: local === 'Yes',
    signup_required: s.signup_required === 'Yes',
    tags: s.technical_tags || [],
    initials: initials(s.name),
    icon: resolveIcon(s, old),
    verified: s.last_verified,
    status: s.verification_status,
    notes: s.notes || (old && old.notes) || null,
    evidence: mergeEvidence(old && old.evidence, s),
    source: 'G:/Downloads/ai-tools.json',
    domain: s.domain,
    provider: providerKey(url),
    local_execution: local,
    canonical_id: s.canonical_id
  };
}
function legacyTool(old) {
  const LEGACY_TOOL_CATEGORY = {
    'Assistants & Chatbots': 'Assistants & Chatbots',
    'Search & Research': 'Search & Research',
    'Coding & Development': 'Coding & Development',
    'Writing & Content': 'Writing & Content',
    'Productivity': 'Productivity',
    'Automation & Workflows': 'Agents & Automation',
    'AI Agents': 'Agents & Automation',
    'Image Generation': 'Image & Design',
    'Video Generation': 'Video',
    'Audio & Voice': 'Audio & Speech',
    'Design & Creative': 'Image & Design',
    'Data & Docs': 'Data & Analytics'
  };
  return {
    ...old,
    category: LEGACY_TOOL_CATEGORY[old.category] || old.category,
    hosting: old.hosting || ['Managed Cloud'],
    domain: hostOf(old.official_url),
    provider: providerKey(old.official_url),
    canonical_id: 'tool:' + old.id,
    local_execution: old.self_hostable ? 'Yes' : 'No',
    source: old.source || 'Legacy registry retained because the record is absent from the uploaded dataset'
  };
}

/* ---------- Models ---------- */
function modelModalities(s, old) {
  if (old && Array.isArray(old.modalities) && old.modalities.length) return old.modalities;
  const tags = (s.technical_tags || []).map((t) => t.toLowerCase());
  const has = (re) => tags.some((t) => re.test(t));
  const out = [];
  if (has(/llm|text-generation|reasoning|chatbot|language-model/)) out.push('Text & Reasoning');
  if (has(/code|coding/)) out.push('Code');
  if (has(/vision|visual|image-understanding/)) out.push('Vision');
  if (has(/audio|speech|voice/)) out.push('Audio');
  if (has(/video/)) out.push('Video');
  if (has(/image-generation|text-to-image/)) out.push('Image Generation');
  if (has(/embedding/)) out.push('Embeddings');
  if (has(/rerank/)) out.push('Reranking');
  return out;
}
function mapModel(s, old) {
  const cat = MODEL_CATEGORY[s.category];
  if (!cat) throw new Error('Unmapped model category: ' + s.category);
  const url = officialUrl(s);
  let weights = old ? old.weights : null;
  if (!weights) {
    if (s.pricing === 'open_weights' || s.pricing === 'open_source' || s.local_execution === 'Yes') weights = 'open';
    else if (['usage_based', 'paid', 'freemium'].includes(s.pricing)) weights = 'closed';
  }
  return {
    id: s.canonical_id.split(':')[1] || slug(s.name),
    name: s.name,
    publisher: (old && old.publisher) || derivePublisher(s),
    description: s.description,
    category: cat,
    source_category: s.category,
    family: s.subtype,
    resource_type: 'AI Model',
    official_url: url,
    pricing: s.pricing,
    weights: weights,
    open_weights: weights === 'open',
    self_hostable: old ? old.self_hostable : s.local_execution !== 'No',
    signup_required: s.signup_required === 'Yes',
    license: s.license !== undefined ? s.license : (old ? old.license : null),
    license_group: s.license_group !== undefined ? s.license_group : (old ? old.license_group : null),
    params: s.params !== undefined ? s.params : (old ? old.params : null),
    context: s.context !== undefined ? s.context : null,
    context_k: s.context_k !== undefined ? s.context_k : (old ? old.context_k : null),
    moe: s.moe !== undefined ? s.moe : (old ? old.moe : null),
    modalities: modelModalities(s, old),
    tags: s.technical_tags || [],
    icon: resolveIcon(s, old),
    verified: s.last_verified,
    status: s.verification_status,
    evidence: mergeEvidence(old && old.evidence, s),
    source: 'G:/Downloads/ai-models.json',
    domain: s.domain,
    provider: providerKey(url),
    local_execution: s.local_execution,
    canonical_id: s.canonical_id
  };
}

/* ---------- Developer resources ---------- */
const LANGUAGE_TAGS = [
  ['JavaScript', /javascript/i], ['TypeScript', /typescript/i], ['Python', /(^|\W)python(\W|$)/i],
  ['Rust', /(^|\W)rust(\W|$)/i], ['Kotlin', /kotlin/i], ['Elixir', /elixir/i], ['Go', /(^|\W)(go|golang)(\W|$)/i],
  ['C++', /c\+\+/i], ['.NET', /(\.net|c#)/i], ['Java', /(^|\W)java(\W|$)/i], ['Swift', /(^|\W)swift(\W|$)/i],
  ['Ruby', /(^|\W)ruby(\W|$)/i], ['PHP', /(^|\W)php(\W|$)/i], ['Scala', /(^|\W)scala(\W|$)/i],
  ['Julia', /(^|\W)julia(\W|$)/i], ['SQL', /(^|\W)sql(\W|$)/i]
];
function devLanguages(s, old) {
  if (old && old.programming_languages && old.programming_languages.length) return old.programming_languages;
  const tags = s.technical_tags || [];
  return LANGUAGE_TAGS.filter(([, re]) => tags.some((t) => re.test(t))).map(([name]) => name);
}
function devType(subtype, old) {
  if (old && old.resource_type) return old.resource_type;
  if (/database|vector/i.test(subtype)) return 'Database / Index';
  if (/runtime|inference engine|serving|deployment|quantization|kernel|compiler|acceleration/i.test(subtype)) return 'Inference Engine';
  if (/framework|sdk|library|toolkit|client|bindings|integration|protocol|language/i.test(subtype)) return 'Framework / SDK / Library';
  if (/platform|cloud|api|gateway|service|registry|observability|evaluation|security|guardrail/i.test(subtype)) return 'Platform / Service';
  if (/desktop/i.test(subtype)) return 'Desktop App / Runtime';
  return 'Developer Resource';
}
function devLinks(s, old) {
  const evidence = (s.evidence_sources || []).filter((u) => /^https?:\/\//i.test(u));
  const official = officialUrl(s);
  const repo = evidence.find((u) => /^https?:\/\/github\.com\/[^/]+\/[^/]+/i.test(u)) || null;
  const docs = evidence.find((u) => u !== official && (/docs?\./i.test(hostOf(u)) || /\/docs?(\/|$)/i.test(u))) || null;
  return {
    documentation_url: (old && old.documentation_url) || docs,
    repository_url: (old && old.repository_url) || repo,
    api_url: (old && old.api_url) || null
  };
}
function mapDev(s, old) {
  const cat = DEV_CATEGORY[s.category];
  if (!cat) throw new Error('Unmapped developer category: ' + s.category);
  const url = officialUrl(s);
  const local = s.local_execution;
  const links = devLinks(s, old);
  const openSource = s.pricing === 'open_source' || !!(old && old.open_source);
  return {
    id: s.canonical_id.split(':')[1] || slug(s.name),
    name: s.name,
    description: s.description,
    category: cat,
    resource_type: devType(s.subtype, old),
    resource_subtype: s.subtype,
    official_url: url,
    documentation_url: links.documentation_url,
    repository_url: links.repository_url,
    api_url: links.api_url,
    pricing: PRICING_LABEL[s.pricing] || s.pricing,
    pricing_class: s.pricing,
    license: old ? old.license : null,
    license_short: old ? old.license_short : null,
    open_source: openSource,
    hosting: old && old.hosting && old.hosting.length ? old.hosting : (local === 'Yes' ? ['Self-hosted'] : local === 'Partial' ? ['Hybrid'] : ['Managed Cloud']),
    self_hostable: local === 'Yes',
    signup_required: s.signup_required === 'Yes',
    programming_languages: devLanguages(s, old),
    integrations: (old && old.integrations) || [],
    tags: s.technical_tags || [],
    icon: resolveIcon(s, old),
    verified: s.last_verified,
    status: s.verification_status,
    notes: s.notes || (old && old.notes) || null,
    evidence: mergeEvidence(old && old.evidence, s),
    source: 'G:/Downloads/developer-resources.json',
    domain: s.domain,
    provider: providerKey(url),
    local_execution: local,
    canonical_id: s.canonical_id
  };
}

/* ---------- Merge: new data primary, legacy metadata used only to fill gaps ---------- */
function indexOld(list) {
  return new Map(list.map((r) => [r.id, r]));
}
function mergeRegistry(sourceRecords, oldList, mapper, legacyMapper) {
  const idx = indexOld(oldList);
  const used = new Set();
  const stats = { source: sourceRecords.length, idMatches: 0, legacyOnly: 0, duplicatesRemoved: 0, invalid: 0 };
  const out = sourceRecords.map((s) => {
    const id = s.canonical_id.split(':')[1];
    const old = idx.get(id) || null;
    if (old) { stats.idMatches++; used.add(old.id); }
    return mapper(s, old);
  });
  /* Only keep legacy records that are genuinely absent (no canonical-id, name
     or canonical-URL twin). Perplexity and v0 are dropped this way because the
     uploaded registry carries the same canonical URL under a newer id. */
  const sourceNames = new Set(sourceRecords.map((r) => slug(r.name)));
  const sourceUrls = new Set(sourceRecords.map((r) => stripSlash(officialUrl(r))).filter(Boolean));
  for (const old of oldList) {
    if (used.has(old.id)) continue;
    if (sourceNames.has(slug(old.name)) || sourceUrls.has(stripSlash(old.official_url))) {
      stats.duplicatesRemoved++;
      continue;
    }
    stats.legacyOnly++;
    out.push(legacyMapper(old));
  }
  return { records: out, stats };
}

const merged = {
  tools: mergeRegistry(source.tools.records, OLD.tools, mapTool, legacyTool),
  models: mergeRegistry(source.models.records, OLD.models, mapModel, (o) => o),
  dev: mergeRegistry(source.dev.records, OLD.dev, mapDev, (o) => o)
};

/* ---------- Validation ---------- */
function validate(records, label) {
  const ids = new Set();
  const invalid = [];
  for (const r of records) {
    const problems = [];
    if (!r.id || ids.has(r.id)) problems.push('duplicate/missing id');
    if (!r.name) problems.push('missing name');
    if (!r.description) problems.push('missing description');
    if (!/^https?:\/\//i.test(r.official_url || '')) problems.push('invalid official URL');
    if (!r.category) problems.push('missing category');
    if (problems.length) invalid.push({ id: r.id || null, name: r.name || null, problems });
    ids.add(r.id);
  }
  if (label === 'tools' && invalid.some((x) => x.problems.includes('invalid official URL'))) {
    throw new Error('Tool with invalid official URL');
  }
  return { count: records.length, uniqueIds: ids.size, invalid };
}

for (const [k, meta] of Object.entries({ tools: merged.tools, models: merged.models, dev: merged.dev })) {
  meta.validation = validate(meta.records, k);
  if (meta.validation.invalid.length) {
    console.error(k + ' invalid records:', JSON.stringify(meta.validation.invalid));
  }
}

/* Combined upload must equal the three per-registry uploads. */
const combinedKey = (r) => r.resource_type + '|' + r.canonical_id;
const combinedSet = new Set(source.combined.records.map(combinedKey));
const perSet = new Set([...source.tools.records, ...source.models.records, ...source.dev.records].map(combinedKey));
if (combinedSet.size !== perSet.size || [...perSet].some((k) => !combinedSet.has(k))) {
  throw new Error('Combined upload does not match the three per-registry uploads');
}

/* ---------- Metadata ---------- */
function countsBy(records, field) {
  const m = new Map();
  for (const r of records) m.set(r[field], (m.get(r[field]) || 0) + 1);
  return m;
}
function metaFor(records, order, catalog, file) {
  const counts = countsBy(records, 'category');
  return {
    count: records.length,
    catalog,
    source: 'G:/Downloads/' + file,
    source_sha256: source[catalog === 'ai-tools' ? 'tools' : catalog === 'ai-models' ? 'models' : 'dev'].hash,
    last_verified: records.reduce((max, r) => (r.verified > max ? r.verified : max), ''),
    category_order: order.filter((c) => counts.has(c)),
    categories: order.filter((c) => counts.has(c)).map((name) => ({ name, count: counts.get(name) }))
  };
}
const TOOLS_META = {
  ...metaFor(merged.tools.records, TOOL_CATEGORY_ORDER, 'ai-tools', FILES.tools),
  merged_legacy: merged.tools.stats.legacyOnly,
  source_records: source.tools.records.length
};
const MODELS_META = {
  ...metaFor(merged.models.records, MODEL_CATEGORY_ORDER, 'ai-models', FILES.models),
  merged_legacy: merged.models.stats.legacyOnly,
  source_records: source.models.records.length
};
const DEV_META = {
  ...metaFor(merged.dev.records, DEV_CATEGORY_ORDER, 'developer-resources', FILES.dev),
  merged_legacy: merged.dev.stats.legacyOnly,
  source_records: source.dev.records.length
};

/* ---------- Related index ---------- */
function shortDesc(s) {
  const clean = String(s || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= 180) return clean;
  const cut = clean.slice(0, 180);
  return cut.slice(0, cut.lastIndexOf(' ')) + '…';
}
function relatedRow(r) {
  return [
    r.id, r.name, r.category, r.source_category || r.family || r.resource_subtype || '',
    r.provider || providerKey(r.official_url), r.icon || null, shortDesc(r.description),
    (r.tags || []).slice(0, 8), r.official_url
  ];
}
const RELATED_INDEX = {
  v: 1,
  generated: new Date().toISOString(),
  t: merged.tools.records.map(relatedRow),
  m: merged.models.records.map(relatedRow),
  d: merged.dev.records.map(relatedRow)
};

/* ---------- Write generated files ---------- */
function jsArray(records, metaName, meta) {
  const body = records.map((r) => JSON.stringify(r)).join(',\n');
  return `/* Generated by .qa/import-build.js from the uploaded registry files.\n   Do not edit by hand; re-run the importer instead. */\nwindow.${metaName === 'AI_TOOLS_META' ? 'AI_TOOLS' : metaName === 'AI_MODELS_META' ? 'AI_MODELS' : 'DEVELOPER_RESOURCES'} = [\n${body}\n];\nwindow.${metaName} = ${JSON.stringify(meta, null, 2)};\n`;
}
fs.writeFileSync(path.join(ROOT, 'data', 'ai-tools.js'), jsArray(merged.tools.records, 'AI_TOOLS_META', TOOLS_META));
fs.writeFileSync(path.join(ROOT, 'data', 'ai-models.js'), jsArray(merged.models.records, 'AI_MODELS_META', MODELS_META));
fs.writeFileSync(path.join(ROOT, 'data', 'developer-resources.js'), jsArray(merged.dev.records, 'DEVELOPER_RESOURCES_META', DEV_META));
fs.writeFileSync(path.join(ROOT, 'data', 'related-index.js'), `/* Generated by .qa/import-build.js. Compact cross-registry relationship index. */\nwindow.RELATED_INDEX = ${JSON.stringify(RELATED_INDEX)};\n`);

const audit = {
  generated_at: new Date().toISOString(),
  source_files: Object.fromEntries(Object.entries(source).map(([k, v]) => [k, { file: FILES[k], records: v.records.length, bytes: v.bytes, sha256: v.hash }])),
  merge: Object.fromEntries(Object.entries(merged).map(([k, v]) => [k, v.stats])),
  validation: Object.fromEntries(Object.entries(merged).map(([k, v]) => [k, v.validation])),
  meta: { tools: TOOLS_META, models: MODELS_META, dev: DEV_META },
  related_index: { tools: RELATED_INDEX.t.length, models: RELATED_INDEX.m.length, developer_resources: RELATED_INDEX.d.length }
};
fs.writeFileSync(path.join(__dirname, 'import-audit.json'), JSON.stringify(audit, null, 2));

console.log(JSON.stringify({
  source: audit.source_files,
  merge: audit.merge,
  validation: Object.fromEntries(Object.entries(audit.validation).map(([k, v]) => [k, { count: v.count, uniqueIds: v.uniqueIds, invalid: v.invalid }])),
  categories: { tools: TOOLS_META.categories.length, models: MODELS_META.categories.length, dev: DEV_META.categories.length },
  final: { tools: TOOLS_META.count, models: MODELS_META.count, dev: DEV_META.count, total: TOOLS_META.count + MODELS_META.count + DEV_META.count }
}, null, 2));
