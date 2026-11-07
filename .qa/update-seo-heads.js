const fs = require('fs');
const path = require('path');

const METADATA = {
  'directory.html': {
    title: 'DevSpire Nexus | AI Intelligence Directory',
    description: 'Discover and explore verified AI tools, foundation models, and developer resources in the DevSpire Nexus intelligence directory. Discover. Connect. Build.',
    keywords: 'AI tools directory, AI models, developer resources, AI software, machine learning tools, developer frameworks, AI APIs, DevSpire Nexus',
    canonical: 'https://devspirehub.com/',
    ogUrl: 'https://devspirehub.com/',
    robots: 'index, follow',
    structuredData: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": "https://devspirehub.com/#website",
          "url": "https://devspirehub.com/",
          "name": "DevSpire Nexus",
          "description": "Curated intelligence directory of verified AI tools, foundation models, and developer resources.",
          "publisher": {
            "@id": "https://devspirehub.com/#organization"
          },
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://devspirehub.com/directory.html?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        },
        {
          "@type": "Organization",
          "@id": "https://devspirehub.com/#organization",
          "name": "DevSpireHub",
          "url": "https://devspirehub.com/",
          "logo": {
            "@type": "ImageObject",
            "url": "https://devspirehub.com/assets/img/devspirehub-icon-128.png",
            "width": 128,
            "height": 128
          },
          "sameAs": [
            "https://github.com/kumaradoss16/Devspire-Nexus"
          ]
        }
      ]
    }
  },
  'ai-tools.html': {
    title: 'AI Tools | DevSpire Nexus',
    description: 'Browse 403 verified AI tools, assistants, coding platforms, research engines, media generators, and productivity software with pricing, platforms, and license details.',
    keywords: 'AI tools directory, AI software directory, AI productivity tools, AI coding tools, AI assistants, AI writing tools, AI video generators, DevSpire Nexus',
    canonical: 'https://devspirehub.com/ai-tools.html',
    ogUrl: 'https://devspirehub.com/ai-tools.html',
    robots: 'index, follow',
    structuredData: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": "https://devspirehub.com/ai-tools.html#webpage",
          "url": "https://devspirehub.com/ai-tools.html",
          "name": "AI Tools | DevSpire Nexus",
          "description": "Browse 403 verified AI tools, assistants, coding platforms, research engines, media generators, and productivity software with pricing, platforms, and license details.",
          "isPartOf": { "@id": "https://devspirehub.com/#website" }
        },
        {
          "@type": "BreadcrumbList",
          "@id": "https://devspirehub.com/ai-tools.html#breadcrumb",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://devspirehub.com/" },
            { "@type": "ListItem", "position": 2, "name": "AI Tools", "item": "https://devspirehub.com/ai-tools.html" }
          ]
        }
      ]
    }
  },
  'models.html': {
    title: 'AI Models | DevSpire Nexus',
    description: 'Explore 300 verified AI models across LLMs, reasoning, coding, vision, audio, video, and embeddings with open weights, license details, parameters, and context window metrics.',
    keywords: 'AI models directory, open-source AI models, LLMs, large language models, vision models, embedding models, local AI models, DevSpire Nexus',
    canonical: 'https://devspirehub.com/models.html',
    ogUrl: 'https://devspirehub.com/models.html',
    robots: 'index, follow',
    structuredData: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": "https://devspirehub.com/models.html#webpage",
          "url": "https://devspirehub.com/models.html",
          "name": "AI Models | DevSpire Nexus",
          "description": "Explore 300 verified AI models across LLMs, reasoning, coding, vision, audio, video, and embeddings with open weights, license details, parameters, and context window metrics.",
          "isPartOf": { "@id": "https://devspirehub.com/#website" }
        },
        {
          "@type": "BreadcrumbList",
          "@id": "https://devspirehub.com/models.html#breadcrumb",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://devspirehub.com/" },
            { "@type": "ListItem", "position": 2, "name": "AI Models", "item": "https://devspirehub.com/models.html" }
          ]
        }
      ]
    }
  },
  'developer-resources.html': {
    title: 'Developer Resources | DevSpire Nexus',
    description: 'Explore 300 verified developer resources including agent frameworks, vector databases, model serving runtimes, fine-tuning libraries, guardrails, and APIs.',
    keywords: 'AI developer tools, agent frameworks, vector databases, RAG, model serving, local runtimes, AI APIs, machine learning libraries, DevSpire Nexus',
    canonical: 'https://devspirehub.com/developer-resources.html',
    ogUrl: 'https://devspirehub.com/developer-resources.html',
    robots: 'index, follow',
    structuredData: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": "https://devspirehub.com/developer-resources.html#webpage",
          "url": "https://devspirehub.com/developer-resources.html",
          "name": "Developer Resources | DevSpire Nexus",
          "description": "Explore 300 verified developer resources including agent frameworks, vector databases, model serving runtimes, fine-tuning libraries, guardrails, and APIs.",
          "isPartOf": { "@id": "https://devspirehub.com/#website" }
        },
        {
          "@type": "BreadcrumbList",
          "@id": "https://devspirehub.com/developer-resources.html#breadcrumb",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://devspirehub.com/" },
            { "@type": "ListItem", "position": 2, "name": "Developer Resources", "item": "https://devspirehub.com/developer-resources.html" }
          ]
        }
      ]
    }
  },
  'about.html': {
    title: 'About | DevSpire Nexus',
    description: 'Learn how DevSpire Nexus, the AI Intelligence Directory from DevSpireHub.com, catalogs verified AI tools, models, and developer technologies with evidence links.',
    keywords: 'About DevSpire Nexus, AI intelligence directory, DevSpireHub, AI directory methodology, AI catalog verification',
    canonical: 'https://devspirehub.com/about.html',
    ogUrl: 'https://devspirehub.com/about.html',
    robots: 'index, follow',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://devspirehub.com/" },
        { "@type": "ListItem", "position": 2, "name": "About", "item": "https://devspirehub.com/about.html" }
      ]
    }
  },
  'docs.html': {
    title: 'Documentation | DevSpire Nexus',
    description: 'Technical documentation for the DevSpire Nexus directory covering registry architectures, data schemas, verification criteria, terminal console, and API endpoints.',
    keywords: 'DevSpire Nexus documentation, AI directory schema, technical architecture, AI tools documentation',
    canonical: 'https://devspirehub.com/docs.html',
    ogUrl: 'https://devspirehub.com/docs.html',
    robots: 'index, follow',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://devspirehub.com/" },
        { "@type": "ListItem", "position": 2, "name": "Documentation", "item": "https://devspirehub.com/docs.html" }
      ]
    }
  },
  'api.html': {
    title: 'Static Catalog API | DevSpire Nexus',
    description: 'Static JSON files generated from the DevSpire Nexus catalog: read-only endpoints for tools, models, developer resources, and the complete catalog manifest.',
    keywords: 'AI catalog API, static JSON API, AI tools dataset, open AI data, DevSpire Nexus API',
    canonical: 'https://devspirehub.com/api.html',
    ogUrl: 'https://devspirehub.com/api.html',
    robots: 'index, follow',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://devspirehub.com/" },
        { "@type": "ListItem", "position": 2, "name": "API", "item": "https://devspirehub.com/api.html" }
      ]
    }
  },
  'terminal.html': {
    title: 'Catalog Terminal | DevSpire Nexus',
    description: 'A read-only catalog console with a fixed command allowlist: query AI tools, models, and developer resources directly from an in-browser terminal interface.',
    keywords: 'AI terminal, CLI directory, command line AI tools, DevSpire Nexus terminal',
    canonical: 'https://devspirehub.com/terminal.html',
    ogUrl: 'https://devspirehub.com/terminal.html',
    robots: 'index, follow',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://devspirehub.com/" },
        { "@type": "ListItem", "position": 2, "name": "Terminal", "item": "https://devspirehub.com/terminal.html" }
      ]
    }
  },
  'submit.html': {
    title: 'Submit a Resource | DevSpire Nexus',
    description: 'Submit an AI tool, model, or developer resource for review. Submissions require official websites and public evidence links for verification.',
    keywords: 'submit AI tool, suggest AI model, AI directory submission, submit developer resource, DevSpire Nexus',
    canonical: 'https://devspirehub.com/submit.html',
    ogUrl: 'https://devspirehub.com/submit.html',
    robots: 'index, follow',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://devspirehub.com/" },
        { "@type": "ListItem", "position": 2, "name": "Submit", "item": "https://devspirehub.com/submit.html" }
      ]
    }
  },
  'contact.html': {
    title: 'Contact | DevSpire Nexus',
    description: 'Contact DevSpire Nexus about catalog corrections, privacy questions, data feedback, or directory verification passes.',
    keywords: 'contact DevSpire Nexus, AI catalog corrections, DevSpireHub contact, directory feedback',
    canonical: 'https://devspirehub.com/contact.html',
    ogUrl: 'https://devspirehub.com/contact.html',
    robots: 'index, follow',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://devspirehub.com/" },
        { "@type": "ListItem", "position": 2, "name": "Contact", "item": "https://devspirehub.com/contact.html" }
      ]
    }
  },
  'privacy.html': {
    title: 'Privacy Policy | DevSpire Nexus',
    description: 'How DevSpire Nexus handles data: browser-only collections, no user accounts, no server profiles, and minimal static hosting infrastructure.',
    keywords: 'DevSpire Nexus privacy policy, data privacy, cookie policy, local storage',
    canonical: 'https://devspirehub.com/privacy.html',
    ogUrl: 'https://devspirehub.com/privacy.html',
    robots: 'index, follow',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://devspirehub.com/" },
        { "@type": "ListItem", "position": 2, "name": "Privacy Policy", "item": "https://devspirehub.com/privacy.html" }
      ]
    }
  },
  'terms.html': {
    title: 'Terms of Service | DevSpire Nexus',
    description: 'Terms for using the DevSpire Nexus AI Intelligence Directory: static content licensing, acceptable use, and catalog verification disclaimers.',
    keywords: 'DevSpire Nexus terms of service, terms of use, directory license, legal',
    canonical: 'https://devspirehub.com/terms.html',
    ogUrl: 'https://devspirehub.com/terms.html',
    robots: 'index, follow',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://devspirehub.com/" },
        { "@type": "ListItem", "position": 2, "name": "Terms of Service", "item": "https://devspirehub.com/terms.html" }
      ]
    }
  },
  'collections.html': {
    title: 'My Collections | DevSpire Nexus',
    description: 'Your personal DevSpire Nexus collection: bookmark AI tools, models, and developer resources privately in your browser without accounts.',
    keywords: 'DevSpire Nexus collections, bookmarked AI tools, saved models, private AI list',
    canonical: 'https://devspirehub.com/collections.html',
    ogUrl: 'https://devspirehub.com/collections.html',
    robots: 'noindex, nofollow',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://devspirehub.com/" },
        { "@type": "ListItem", "position": 2, "name": "Collections", "item": "https://devspirehub.com/collections.html" }
      ]
    }
  }
};

Object.entries(METADATA).forEach(([file, meta]) => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  const headMatch = content.match(/<head>([\s\S]*?)<\/head>/i);
  if (!headMatch) return;
  const originalHead = headMatch[1];

  // Extract Tailwind script + tailwind.config + any <style> block
  const twStart = originalHead.indexOf('<script src="https://cdn.tailwindcss.com');
  if (twStart === -1) {
    console.warn('Tailwind script not found in', file);
    return;
  }

  // Find the end of styles or scripts that belong to page styling
  let twAndStyles = originalHead.slice(twStart);
  // Strip out any trailing meta tags that were appended at the end of head
  const lastStyleIdx = twAndStyles.lastIndexOf('</style>');
  if (lastStyleIdx !== -1) {
    twAndStyles = twAndStyles.slice(0, lastStyleIdx + 8);
  } else {
    const lastScriptIdx = twAndStyles.lastIndexOf('</script>');
    if (lastScriptIdx !== -1) {
      twAndStyles = twAndStyles.slice(0, lastScriptIdx + 9);
    }
  }

  const newHead = `
  <!-- Character encoding and responsive viewport -->
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>

  <!-- Primary SEO -->
  <title>${meta.title}</title>
  <meta name="description" content="${meta.description}"/>
  <meta name="keywords" content="${meta.keywords}"/>
  <link rel="canonical" href="${meta.canonical}"/>
  <meta name="robots" content="${meta.robots}"/>

  <!-- Brand Theme -->
  <meta name="theme-color" content="#010D18"/>

  <!-- Open Graph / Facebook / LinkedIn -->
  <meta property="og:type" content="website"/>
  <meta property="og:site_name" content="DevSpire Nexus"/>
  <meta property="og:title" content="${meta.title}"/>
  <meta property="og:description" content="${meta.description}"/>
  <meta property="og:url" content="${meta.ogUrl}"/>
  <meta property="og:image" content="https://devspirehub.com/assets/images/social-preview.png"/>
  <meta property="og:image:alt" content="DevSpire Nexus AI Intelligence Directory"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta property="og:locale" content="en_US"/>

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${meta.title}"/>
  <meta name="twitter:description" content="${meta.description}"/>
  <meta name="twitter:image" content="https://devspirehub.com/assets/images/social-preview.png"/>
  <meta name="twitter:image:alt" content="DevSpire Nexus AI Intelligence Directory"/>

  <!-- Favicons and App Icons -->
  <link rel="icon" type="image/png" href="assets/img/devspirehub-icon-48.png"/>
  <link rel="apple-touch-icon" href="assets/img/devspirehub-icon-128.png"/>

  <!-- Preconnects & Typography Performance -->
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin=""/>
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&amp;family=JetBrains+Mono:wght@400;500;600&amp;display=swap" rel="stylesheet"/>

  <!-- Structured Data (JSON-LD) -->
  <script type="application/ld+json">
${JSON.stringify(meta.structuredData, null, 2)}
  </script>

  <!-- Tailwind CSS Engine & Configuration -->
  ${twAndStyles.trim()}

  <!-- Master Stylesheet (Overrides) -->
  <link rel="stylesheet" href="assets/site.css"/>
`;

  content = content.replace(/<head>[\s\S]*?<\/head>/i, `<head>${newHead}\n</head>`);
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated head in ${file}`);
});
