/* Curated "Resources of the Week" configuration.
   Entries are stable type/id references into the three registries, never
   duplicated records. The homepage picks four per week in a deterministic
   order, so the section changes every Monday without a backend scheduler.
   `overrides` is an optional manual pin keyed by the Monday of the week
   (YYYY-MM-DD); pinned weeks keep their exact order. */
window.DSH_FEATURED = {
  version: 1,
  perWeek: 4,
  epoch: '2026-01-05',
  pool: [
    { type: 'tool', id: 'cursor' },
    { type: 'model', id: 'deepseek-r1' },
    { type: 'resource', id: 'vllm' },
    { type: 'tool', id: 'claude' },
    { type: 'resource', id: 'qdrant' },
    { type: 'model', id: 'llama-3-1' },
    { type: 'tool', id: 'midjourney' },
    { type: 'resource', id: 'ollama' },
    { type: 'model', id: 'gemini-1-5-pro' },
    { type: 'tool', id: 'chatgpt' },
    { type: 'resource', id: 'langchain' },
    { type: 'model', id: 'whisper' },
    { type: 'tool', id: 'runway' },
    { type: 'resource', id: 'mcp-sdk' },
    { type: 'model', id: 'flux-1-schnell' }
  ],
  overrides: {}
};
