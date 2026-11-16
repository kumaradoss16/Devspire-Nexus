/* Featured Editorial Collection: editorial metadata only.
   Platform entries reference canonical registry records by stable type/id and
   never duplicate registry fields. Entries without a matching registry record
   keep `registry: null`, so no "Explore in Nexus" link is generated for them. */
window.DSH_EDITORIAL_COLLECTION = {
  id: 'featured-ai-platforms-21',
  type: 'editorial-collection',
  eyebrow: 'FEATURED EDITORIAL COLLECTION',
  title: '21 AI Platforms Worth Knowing',
  description: 'Discover a curated selection of AI platforms across research, productivity, automation, software development, and creative workflows. Explore what each platform does, where it fits, and when it may be useful.',
  intro: [
    'The AI ecosystem is expanding rapidly. New platforms appear constantly, each promising to simplify a different part of how we work, research, build, and create.',
    'Rather than presenting another endless list, this collection highlights 21 platforms across practical use cases, giving visitors a starting point for exploring the broader AI ecosystem.'
  ],
  quote: 'There are more AI tools than anyone has time to properly test. One helps write, another captures meetings, another builds applications, and another organizes the working day. Finding the right tools matters more than collecting more of them.',
  quoteAttribution: 'DevSpire Nexus editorial',
  disclaimer: 'A curated selection, not an objective ranking. Platform inclusion does not imply endorsement. Categories are editorial groupings, not product classifications.',
  lastReviewed: '2026-11-14',
  categories: [
    { id: 'ai-assistants-research', label: 'AI Assistants & Research' },
    { id: 'workplace-productivity', label: 'Workplace Productivity' },
    { id: 'automation-workflows', label: 'Automation & Workflows' },
    { id: 'marketing-content', label: 'Marketing & Content' },
    { id: 'development-app-building', label: 'AI Development & App Building' },
    { id: 'media-generation', label: 'AI Media Generation' }
  ],
  platforms: [
    {
      id: 'claude-cowork',
      name: 'Claude Cowork',
      category: 'ai-assistants-research',
      description: "Anthropic's workspace for delegating file-based and multi-step knowledge work to Claude.",
      bestFor: 'Working with files and completing multi-step tasks.',
      officialUrl: 'https://claude.com/product/cowork',
      registry: null,
      logo: null
    },
    {
      id: 'chatgpt',
      name: 'ChatGPT',
      category: 'ai-assistants-research',
      description: "OpenAI's general-purpose assistant for writing, reasoning, analysis, and custom workflows.",
      bestFor: 'Everyday writing, reasoning, research, and custom GPTs.',
      officialUrl: 'https://chatgpt.com/',
      registry: { type: 'tool', id: 'chatgpt' },
      logo: 'assets/img/icons/verified/chatgpt-com.png'
    },
    {
      id: 'google-gemini',
      name: 'Google Gemini',
      category: 'ai-assistants-research',
      description: "Google's AI assistant, available across Google apps and as a standalone chat experience.",
      bestFor: "AI assistance across Google's ecosystem.",
      officialUrl: 'https://gemini.google.com',
      registry: { type: 'tool', id: 'gemini' },
      logo: 'assets/img/icons/gemini.png'
    },
    {
      id: 'perplexity',
      name: 'Perplexity',
      category: 'ai-assistants-research',
      description: 'An AI answer engine that responds to questions with cited sources.',
      bestFor: 'Research and answers supported by citations.',
      officialUrl: 'https://www.perplexity.ai/',
      registry: { type: 'tool', id: 'perplexity-ai' },
      logo: 'assets/img/icons/verified/perplexity-ai.png'
    },
    {
      id: 'grok',
      name: 'Grok',
      category: 'ai-assistants-research',
      description: "xAI's conversational assistant for questions, discussion, and information discovery.",
      bestFor: 'Conversational AI and information discovery.',
      officialUrl: 'https://grok.com',
      registry: { type: 'tool', id: 'grok' },
      logo: 'assets/img/icons/grok.png'
    },
    {
      id: 'microsoft-copilot',
      name: 'Microsoft Copilot',
      category: 'workplace-productivity',
      description: "Microsoft's AI assistant across Microsoft 365 apps, Windows, and the web.",
      bestFor: 'Drafting and summarising work across Microsoft applications.',
      officialUrl: 'https://www.microsoft.com/en/copilot',
      registry: null,
      logo: null
    },
    {
      id: 'lindy',
      name: 'Lindy',
      category: 'workplace-productivity',
      description: 'A platform for building and delegating workflows and tasks to AI agents.',
      bestFor: 'Delegating repetitive workflows and tasks to agents.',
      officialUrl: 'https://www.lindy.ai/',
      registry: null,
      logo: null
    },
    {
      id: 'granola',
      name: 'Granola',
      category: 'workplace-productivity',
      description: 'An AI meeting notepad that combines your own notes with meeting audio.',
      bestFor: 'Capturing and reviewing AI-assisted meeting notes.',
      officialUrl: 'https://www.granola.ai/',
      registry: { type: 'tool', id: 'granola' },
      logo: 'assets/img/icons/verified/granola-ai.png'
    },
    {
      id: 'wispr-flow',
      name: 'Wispr Flow',
      category: 'workplace-productivity',
      description: 'Voice dictation that turns speech into written text across your apps.',
      bestFor: 'Voice-based writing and dictation.',
      officialUrl: 'https://wisprflow.ai/',
      registry: null,
      logo: null
    },
    {
      id: 'zapier',
      name: 'Zapier',
      category: 'automation-workflows',
      description: 'An automation platform that connects apps and runs workflows across them.',
      bestFor: 'Connecting applications and automating workflows.',
      officialUrl: 'https://zapier.com/',
      registry: null,
      logo: 'assets/img/icons/verified/zapier-com.ico'
    },
    {
      id: 'jasper',
      name: 'Jasper',
      category: 'marketing-content',
      description: 'An AI writing platform for marketing content and brand-aligned copy.',
      bestFor: 'Marketing content and brand-oriented writing.',
      officialUrl: 'https://www.jasper.ai/',
      registry: { type: 'tool', id: 'jasper' },
      logo: 'assets/img/icons/verified/jasper-ai.png'
    },
    {
      id: 'morgen',
      name: 'Morgen',
      category: 'workplace-productivity',
      description: 'A calendar and task planner that brings schedules and to-dos into one place.',
      bestFor: 'Planning schedules, tasks, and calendars.',
      officialUrl: 'https://www.morgen.so/',
      registry: null,
      logo: null
    },
    {
      id: 'notion',
      name: 'Notion',
      category: 'workplace-productivity',
      description: 'A connected workspace for notes, documents, projects, and knowledge.',
      bestFor: 'Knowledge management and workspace productivity.',
      officialUrl: 'https://www.notion.com/',
      registry: null,
      logo: 'assets/img/icons/verified/notion-so.png'
    },
    {
      id: 'gamma',
      name: 'Gamma',
      category: 'marketing-content',
      description: 'An AI-assisted tool for creating presentations and visual documents.',
      bestFor: 'Creating presentations and visual documents.',
      officialUrl: 'https://gamma.app/',
      registry: { type: 'tool', id: 'gamma' },
      logo: 'assets/img/icons/verified/gamma-app.ico'
    },
    {
      id: 'replit',
      name: 'Replit',
      category: 'development-app-building',
      description: 'A browser-based development platform for building and deploying apps with AI assistance.',
      bestFor: 'Building and deploying applications with AI assistance.',
      officialUrl: 'https://replit.com/',
      registry: { type: 'tool', id: 'replit' },
      logo: 'assets/img/icons/verified/replit-com.png'
    },
    {
      id: 'cursor',
      name: 'Cursor',
      category: 'development-app-building',
      description: 'An AI-first code editor for writing, reviewing, and refactoring code.',
      bestFor: 'AI-assisted software development.',
      officialUrl: 'https://cursor.com/',
      registry: { type: 'tool', id: 'cursor' },
      logo: 'assets/img/icons/verified/cursor-com.png'
    },
    {
      id: 'lovable',
      name: 'Lovable',
      category: 'development-app-building',
      description: 'A platform for building web applications from natural-language instructions.',
      bestFor: 'Building web applications from natural-language instructions.',
      officialUrl: 'https://lovable.dev/',
      registry: { type: 'tool', id: 'lovable' },
      logo: 'assets/img/icons/verified/lovable-dev.png'
    },
    {
      id: 'n8n',
      name: 'n8n',
      category: 'automation-workflows',
      description: 'A workflow automation platform with self-hosted and integration options.',
      bestFor: 'Workflow automation and self-hosted integrations.',
      officialUrl: 'https://n8n.io/',
      registry: { type: 'resource', id: 'n8n' },
      logo: 'assets/img/icons/verified/n8n-io.ico'
    },
    {
      id: 'elevenlabs',
      name: 'ElevenLabs',
      category: 'media-generation',
      description: 'An AI audio platform for voice generation and speech applications.',
      bestFor: 'AI voice generation and audio applications.',
      officialUrl: 'https://elevenlabs.io/',
      registry: { type: 'tool', id: 'elevenlabs' },
      logo: 'assets/img/icons/verified/elevenlabs-io.png'
    },
    {
      id: 'descript',
      name: 'Descript',
      category: 'marketing-content',
      description: 'An audio and video editor built around transcript-based workflows.',
      bestFor: 'Audio and video editing using transcripts.',
      officialUrl: 'https://www.descript.com/',
      registry: { type: 'tool', id: 'descript' },
      logo: 'assets/img/icons/verified/descript-com.png'
    },
    {
      id: 'midjourney',
      name: 'Midjourney',
      category: 'media-generation',
      description: 'An AI image generation platform for visual artwork and imagery.',
      bestFor: 'AI-generated visual artwork and imagery.',
      officialUrl: 'https://www.midjourney.com/',
      registry: { type: 'tool', id: 'midjourney' },
      logo: 'assets/img/icons/verified/midjourney-com.png'
    }
  ]
};
