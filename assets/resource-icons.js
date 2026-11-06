/* Category-level icon fallbacks for records without a verified local logo.
   Icons are Material Symbols glyphs already loaded by the shared shell, so
   they add no network requests and cannot 404. */
(() => {
  'use strict';

  const MAP = {
    'Assistants & Chatbots': 'forum',
    'Search & Research': 'travel_explore',
    'Coding & Development': 'code',
    'Writing & Content': 'edit_note',
    'Productivity': 'task_alt',
    'Meetings & Communication': 'groups',
    'Agents & Automation': 'smart_toy',
    'Image & Design': 'palette',
    'Video': 'movie',
    'Audio & Speech': 'graphic_eq',
    'Business & Enterprise': 'domain',
    'Data & Analytics': 'query_stats',
    'Infrastructure & Security': 'shield',
    'Industry & Specialized': 'precision_manufacturing',
    'LLM': 'chat',
    'Large Language Models': 'chat',
    'Reasoning & CoT': 'psychology',
    'Coding': 'code_blocks',
    'Coding Models': 'code_blocks',
    'Vision & Multimodal': 'visibility',
    'Image': 'image',
    'Image Generation': 'image',
    '3D': 'view_in_ar',
    '3D Generation': 'view_in_ar',
    'Audio': 'graphic_eq',
    'Embeddings': 'scatter_plot',
    'Embeddings & Rerankers': 'scatter_plot',
    'Small/Edge': 'memory',
    'Small / Edge Models': 'memory',
    'Robotics': 'smart_toy',
    'Robotics & Embodied': 'smart_toy',
    'Robotics & Embodied AI': 'smart_toy',
    'Specialized': 'science',
    'Specialized Models': 'science',
    'Video Generation': 'movie',
    'Agent Frameworks': 'hub',
    'Vector Databases & RAG': 'database',
    'Model Serving & Inference': 'dns',
    'Local Runtimes': 'desktop_windows',
    'Fine-Tuning & Optimization': 'tuning',
    'Evaluation & Observability': 'monitoring',
    'AI Security & Guardrails': 'security',
    'APIs/Gateways/Protocols': 'api',
    'APIs, Gateways & Protocols': 'api',
    'Cloud & GPU Infrastructure': 'cloud',
    'Developer Tooling & QA': 'build',
    'Data & Annotation': 'dataset'
  };

  const TYPE_FALLBACK = { tool: 'apps', model: 'memory', resource: 'handyman' };

  const symbolFor = (category, type) => MAP[category] || TYPE_FALLBACK[type] || 'widgets';

  const initials = (name) => String(name || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || 'AI';

  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  /* Category glyph, with initials kept as a secondary visual cue. The glyph is
     decorative because the adjacent label already names the category. */
  const html = (category, type, name, options = {}) => {
    const size = options.size || 'text-[20px]';
    const showInitials = options.initials !== false && name;
    return `<span class="resource-icon-fallback" aria-hidden="true"><span class="material-symbols-outlined ${size}">${symbolFor(category, type)}</span>${showInitials ? `<span class="resource-icon-initials">${esc(initials(name))}</span>` : ''}</span>`;
  };

  window.ResourceIcons = { symbolFor, initials, html, map: MAP };
})();
