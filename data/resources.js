window.DS = window.DS || {};

DS.state = {
  view: 'grid',
  query: '',
  type: 'all',
  facet: 'all'
};

DS.typeLabels = {
  tools: 'AI Tools',
  models: 'AI Models',
  developer: 'Developer Resources'
};

DS.data = {
  sampleData: true,

  taxonomy: [
    { id: 'coding-development', label: 'Coding & Development', icon: 'code', accent: 'cyan' },
    { id: 'writing-nlp', label: 'Writing & NLP', icon: 'pen', accent: 'cyan' },
    { id: 'reasoning-llms', label: 'Reasoning & LLMs', icon: 'cpu', accent: 'amber' },
    { id: 'vision-multimodal', label: 'Vision & Multimodal', icon: 'eye', accent: 'cyan' },
    { id: 'local-ai-edge', label: 'Local AI & Edge', icon: 'server', accent: 'green' },
    { id: 'mcp-agents', label: 'MCP & Agents', icon: 'hub', accent: 'cyan' },
    { id: 'vector-dbs-rag', label: 'Vector DBs & RAG', icon: 'database', accent: 'green' },
    { id: 'audio-speech', label: 'Audio & Speech', icon: 'mic', accent: 'cyan' }
  ],

  resources: [
    {
      id: 'vllm',
      name: 'vLLM',
      monogram: 'vL',
      logoTone: 'green',
      type: 'developer',
      classification: 'Developer Resource / Inference Engine',
      description: 'High-throughput and memory-efficient LLM serving engine with PagedAttention algorithm, dynamic batching, and chunked prefill support.',
      license: 'Apache 2.0',
      licenseTone: 'neutral',
      params: [
        { label: 'Hosting', value: 'Self-hostable' },
        { label: 'Memory Engine', value: 'PagedAttention', accent: true },
        { label: 'Distributed', value: 'Tensor Parallel' }
      ],
      tags: ['CUDA / ROCm', 'Continuous Batching', 'OpenAI-compatible API'],
      verified: '2 hrs ago',
      facets: ['reasoning-llms', 'local-ai-edge'],
      keywords: ['local inference', 'serving', 'high throughput', 'gpu', 'open model'],
      url: 'https://docs.vllm.ai',
      urlLabel: 'Open vLLM documentation'
    },
    {
      id: 'cursor',
      name: 'Cursor',
      monogram: 'Cu',
      logoTone: 'cyan',
      type: 'tools',
      classification: 'AI Tool / Development Environment',
      description: 'AI-first code editor featuring full codebase indexing, multi-file diff composition, and autonomous terminal agent capabilities.',
      license: 'Freemium',
      licenseTone: 'warning',
      params: [
        { label: 'License', value: 'Proprietary' },
        { label: 'Models', value: 'Multi-Composer', accent: true },
        { label: 'Telemetry', value: 'Privacy Mode Opt-in' }
      ],
      tags: ['Claude 3.5 Sonnet', 'Repo Indexing', 'Terminal Agent'],
      verified: '4 hrs ago',
      facets: ['coding-development'],
      keywords: ['free', 'coding', 'code editor', 'ide', 'ai tools'],
      url: 'https://cursor.com',
      urlLabel: 'Open Cursor website'
    },
    {
      id: 'deepseek-r1',
      name: 'DeepSeek-R1',
      monogram: 'R1',
      logoTone: 'amber',
      type: 'models',
      classification: 'AI Model / Reasoning Architecture',
      description: 'Open-weight reasoning architecture trained via large-scale reinforcement learning without preliminary supervised fine-tuning stage.',
      license: 'MIT License',
      licenseTone: 'neutral',
      params: [
        { label: 'Active Weights', value: '671B MoE (37B act)' },
        { label: 'Context', value: '128k Tokens', accent: true },
        { label: 'Format', value: 'GGUF / BF16' }
      ],
      tags: ['Full CoT Reasoning', 'Distill Variants Available', 'Local Ollama Ready'],
      verified: 'Today',
      facets: ['reasoning-llms', 'local-ai-edge'],
      keywords: ['open-weight', 'language models', 'local ai inference', '128k', 'context window', 'reasoning'],
      url: 'https://github.com/deepseek-ai/DeepSeek-R1',
      urlLabel: 'Open DeepSeek-R1 repository'
    },
    {
      id: 'qdrant',
      name: 'Qdrant',
      monogram: 'Qd',
      logoTone: 'red',
      type: 'developer',
      classification: 'Developer Resource / Vector Database',
      description: 'Vector similarity search engine and vector database written in Rust. Features dynamic payload-based filtering and custom quantization techniques.',
      license: 'Apache 2.0',
      licenseTone: 'neutral',
      params: [
        { label: 'Core Runtime', value: 'Rust / Low Memory' },
        { label: 'Quantization', value: 'Scalar & Product', accent: true },
        { label: 'Deployment', value: 'Local + Distributed' }
      ],
      tags: ['gRPC / REST', 'HNSW Indexing', 'RAG Pipeline'],
      verified: 'Today',
      facets: ['vector-dbs-rag', 'local-ai-edge'],
      keywords: ['vector database', 'rag', 'similarity search', 'local'],
      url: 'https://qdrant.tech',
      urlLabel: 'Open Qdrant website'
    }
  ],

  activity: [
    {
      name: 'Ollama v0.5.8',
      status: 'PASS',
      description: 'Native Apple Metal GPU memory allocation verification.',
      category: 'Runtime',
      verified: 'Verified 2 hrs ago'
    },
    {
      name: 'Llama-3.3-70B-Inst',
      status: 'PASS',
      description: 'Llama Community License benchmark confirmation.',
      category: 'Model Weights',
      verified: 'Verified 4 hrs ago'
    },
    {
      name: 'FastMCP Server-TS',
      status: 'PASS',
      description: 'TypeScript MCP specification compliance check.',
      category: 'MCP Spec',
      verified: 'Verified today'
    },
    {
      name: 'SGLang v0.4.2',
      status: 'PASS',
      description: 'RadixAttention tree cache consistency audit.',
      category: 'Inference',
      verified: 'Verified today'
    }
  ]
};
