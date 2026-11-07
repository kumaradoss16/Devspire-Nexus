/* Builds the DevSpire Nexus information pages and the personal collection
   page. Pages are plain static HTML; shell.apply() injects the canonical
   header, footer and social metadata exactly like the generated pages. */
const fs = require('fs');
const path = require('path');
const shell = require('./shell');

const ROOT = path.join(__dirname, '..');

const head = (title, description) => `<!DOCTYPE html>
<html class="dark" lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${title}</title>
<link rel="icon" type="image/png" href="assets/img/devspirehub-gears-48.png"/>
<meta name="description" content="${description}"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&amp;family=JetBrains+Mono:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script src="assets/tailwind-config.js"></script>
<link rel="stylesheet" href="assets/site.css"/>
</head>
<body class="bg-bg-canvas text-text-primary antialiased selection:bg-primary-container selection:text-bg-canvas font-body-default min-h-screen flex flex-col">
<header></header>
<main id="main-content" class="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-gutter-lg py-space-xl flex flex-col gap-space-lg">`;

const foot = (scripts) => `</main>
<footer></footer>
${scripts || ''}
</body>
</html>
`;

const crumb = (label) => `<nav class="flex items-center gap-space-xs text-metadata-label font-metadata-label text-text-muted" aria-label="Breadcrumb">
<a class="hover:text-text-primary transition-colors" href="index.html">Home</a>
<span class="text-border-subtle" aria-hidden="true">/</span>
<span class="text-primary-container" aria-current="page">${label}</span>
</nav>`;

const pageHeader = (kicker, title, text) => `<div class="flex flex-col md:flex-row md:items-end justify-between gap-space-md pb-space-md border-b border-border-subtle">
<div class="min-w-0">
<p class="font-metadata-label text-metadata-label text-primary-container uppercase tracking-[0.18em] mb-1">${kicker}</p>
<h1 class="font-display-hero-mobile text-display-hero-mobile sm:font-display-hero sm:text-display-hero text-text-primary tracking-tight">${title}</h1>
<p class="font-body-compact text-body-compact text-text-muted mt-2 max-w-3xl">${text}</p>
</div>
</div>`;

const linkCard = (href, icon, title, text) => `<a class="ui-card group rounded-xl p-space-md flex flex-col gap-2" href="${href}">
<span class="w-9 h-9 rounded bg-surface-secondary border border-border-subtle flex items-center justify-center text-primary-container"><span class="material-symbols-outlined text-[19px]" aria-hidden="true">${icon}</span></span>
<span class="font-title-card text-title-card text-text-primary group-hover:text-secondary transition-colors">${title}</span>
<span class="font-body-compact text-body-compact text-text-muted">${text}</span>
</a>`;

/* ---------------------------------------------------------------- About */
const about = head('About | DevSpire Nexus', 'Learn how DevSpire Nexus, the AI Intelligence Directory from DevSpireHub.com, curates verified AI tools, models, and developer resources.') + `
${crumb('About')}
${pageHeader('About the directory', 'About DevSpire Nexus', 'DevSpire Nexus is the AI Intelligence Directory from DevSpireHub.com — a static, evidence-oriented catalog of AI tools, models, and developer resources. Discover. Connect. Build.')}

<section class="grid grid-cols-1 sm:grid-cols-3 gap-gutter" aria-labelledby="about-registries">
<h2 class="sr-only" id="about-registries">Registries</h2>
<a class="ui-card group rounded-xl p-space-md" href="ai-tools.html">
<span class="font-code-badge text-code-badge text-secondary">REGISTRY::01</span>
<span class="block font-headline-section text-headline-section text-text-primary mt-1 group-hover:text-secondary transition-colors">403 AI Tools</span>
<span class="block font-body-compact text-body-compact text-text-muted mt-1">Assistants, coding environments, research engines, media tools, and business automation.</span>
</a>
<a class="ui-card group rounded-xl p-space-md" href="models.html">
<span class="font-code-badge text-code-badge text-primary">REGISTRY::02</span>
<span class="block font-headline-section text-headline-section text-text-primary mt-1 group-hover:text-primary transition-colors">300 AI Models</span>
<span class="block font-body-compact text-body-compact text-text-muted mt-1">Language, reasoning, coding, multimodal, image, audio, video, and embedding models.</span>
</a>
<a class="ui-card group rounded-xl p-space-md" href="developer-resources.html">
<span class="font-code-badge text-code-badge text-[#34D399]">REGISTRY::03</span>
<span class="block font-headline-section text-headline-section text-text-primary mt-1 group-hover:text-[#34D399] transition-colors">300 Developer Resources</span>
<span class="block font-body-compact text-body-compact text-text-muted mt-1">Serving engines, vector databases, agent frameworks, local runtimes, evaluation, and security.</span>
</a>
</section>

<section class="ui-card rounded-xl p-space-lg" aria-labelledby="about-what">
<h2 class="font-headline-section text-headline-section text-text-primary mb-3" id="about-what">What this directory is</h2>
<div class="grid grid-cols-1 lg:grid-cols-2 gap-space-lg font-body-default text-body-default text-text-muted">
<div class="flex flex-col gap-3">
<p>DevSpire Nexus is a browsable intelligence layer for the AI ecosystem. Each registry record keeps the fields the source states — such as licensing, pricing model, deployment format, context window, hosting, and evidence links — instead of inventing values to fill a table.</p>
<p>The catalog is static. Records are prepared from the DevSpireHub AI knowledge base, reviewed in verification passes, and published with a last-verified date. It is not a live price feed, a benchmark leaderboard, or an automated ranking of products.</p>
</div>
<div class="flex flex-col gap-3">
<p>Search, filters, sorting, deep links, and cross-registry related resources run entirely in the browser. There are no accounts and no server-side profile. Personal collections are stored only in your browser and can be exported as JSON.</p>
<p>You can also access the same catalog through static JSON files documented on the <a class="text-secondary hover:underline" href="api.html">API and Data Access</a> page, or propose a record through the <a class="text-secondary hover:underline" href="submit.html">submission workflow</a>.</p>
</div>
</div>
</section>

<section class="ui-card rounded-xl p-space-lg" aria-labelledby="about-verify">
<h2 class="font-headline-section text-headline-section text-text-primary mb-3" id="about-verify">How records are prepared</h2>
<ol class="flex flex-col gap-3 font-body-compact text-body-compact text-text-muted max-w-3xl">
<li class="flex gap-3"><span class="font-code-badge text-code-badge text-primary-container shrink-0 pt-0.5">01</span><span><strong class="text-text-primary font-medium">Source first.</strong> A record starts from the uploaded registry dataset. Fields absent in the source stay absent; they are never guessed.</span></li>
<li class="flex gap-3"><span class="font-code-badge text-code-badge text-primary-container shrink-0 pt-0.5">02</span><span><strong class="text-text-primary font-medium">Evidence links.</strong> Where the source provides an official page or repository, the record links to it so you can check the claim yourself.</span></li>
<li class="flex gap-3"><span class="font-code-badge text-code-badge text-primary-container shrink-0 pt-0.5">03</span><span><strong class="text-text-primary font-medium">Explicit dates.</strong> Verification dates are shown with records and registries. A date describes the last review pass, not a promise of live accuracy.</span></li>
<li class="flex gap-3"><span class="font-code-badge text-code-badge text-primary-container shrink-0 pt-0.5">04</span><span><strong class="text-text-primary font-medium">Corrections.</strong> If a record is wrong or stale, send the record name, URL, and a public evidence link through the <a class="text-secondary hover:underline" href="contact.html">contact page</a>. Corrections are reviewed manually.</span></li>
</ol>
</section>

<section class="ui-card rounded-xl p-space-lg" aria-labelledby="about-limits">
<h2 class="font-headline-section text-headline-section text-text-primary mb-3" id="about-limits">What it deliberately does not do</h2>
<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 font-body-compact text-body-compact text-text-muted">
<div class="rounded border border-border-subtle bg-surface-secondary p-3 flex gap-2"><span class="material-symbols-outlined text-[17px] text-status-warning shrink-0" aria-hidden="true">block</span><span>No paid placements, scores, or engagement ranking.</span></div>
<div class="rounded border border-border-subtle bg-surface-secondary p-3 flex gap-2"><span class="material-symbols-outlined text-[17px] text-status-warning shrink-0" aria-hidden="true">block</span><span>No user reviews or testimonials presented as facts.</span></div>
<div class="rounded border border-border-subtle bg-surface-secondary p-3 flex gap-2"><span class="material-symbols-outlined text-[17px] text-status-warning shrink-0" aria-hidden="true">block</span><span>No automated publishing of submitted records.</span></div>
<div class="rounded border border-border-subtle bg-surface-secondary p-3 flex gap-2"><span class="material-symbols-outlined text-[17px] text-status-warning shrink-0" aria-hidden="true">block</span><span>No tracking scripts or advertising cookies of our own.</span></div>
</div>
</section>

<section class="ui-card rounded-xl p-space-lg relative overflow-hidden" aria-labelledby="about-parent">
<p class="font-metadata-label text-metadata-label text-primary-container uppercase tracking-[0.18em] mb-1">The parent brand</p>
<h2 class="font-headline-section text-headline-section text-text-primary mb-2" id="about-parent">A product of DevSpireHub.com</h2>
<p class="font-body-compact text-body-compact text-text-muted max-w-3xl mb-4">DevSpire Nexus is a product of DevSpireHub.com, the parent brand for practical programming, networking, cloud, and cybersecurity learning resources. The directory keeps its own identity while sharing the parent brand's evidence-first approach.</p>
<a class="inline-flex items-center gap-2 bg-primary-container text-bg-canvas font-body-compact text-body-compact font-semibold px-4 py-2 rounded btn-amber" href="https://devspirehub.com/" target="_blank" rel="noopener">Visit DevSpireHub <span class="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_outward</span></a>
</section>

<section aria-labelledby="about-next">
<h2 class="font-headline-section text-headline-section text-text-primary mb-3" id="about-next">Start exploring</h2>
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
${linkCard('index.html', 'explore', 'Directory', 'Search across all 1,003 records from one page.')}
${linkCard('collections.html', 'bookmark', 'My Collections', 'Save records in this browser and organise custom collections.')}
${linkCard('docs.html', 'menu_book', 'Documentation', 'Field definitions, provenance, and static data access.')}
${linkCard('contact.html', 'mail', 'Contact', 'Corrections, privacy questions, and directory feedback.')}
</div>
</section>
` + foot();

/* --------------------------------------------------------------- Privacy */
const privacy = head('Privacy Policy | DevSpire Nexus', 'How DevSpire Nexus handles data: browser-only collections, no accounts, no tracking scripts of its own, and honest disclosure of Web3Forms and third-party requests.') + `
${crumb('Privacy Policy')}
${pageHeader('Legal &amp; information', 'Privacy Policy', 'This policy describes the data practices of the DevSpire Nexus website. Last updated November 5, 2026.')}

<section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter" aria-label="Privacy summary">
<div class="ui-card rounded-xl p-space-md"><span class="material-symbols-outlined text-[20px] text-tertiary" aria-hidden="true">no_accounts</span><p class="font-title-card text-title-card text-text-primary mt-2">No accounts</p><p class="font-body-compact text-body-compact text-text-muted mt-1">There is nothing to sign up for and no server-side visitor profile.</p></div>
<div class="ui-card rounded-xl p-space-md"><span class="material-symbols-outlined text-[20px] text-tertiary" aria-hidden="true">visibility_off</span><p class="font-title-card text-title-card text-text-primary mt-2">No tracking scripts</p><p class="font-body-compact text-body-compact text-text-muted mt-1">The site ships no analytics, advertising, or session-recording scripts of its own.</p></div>
<div class="ui-card rounded-xl p-space-md"><span class="material-symbols-outlined text-[20px] text-tertiary" aria-hidden="true">bookmark</span><p class="font-title-card text-title-card text-text-primary mt-2">Local collections</p><p class="font-body-compact text-body-compact text-text-muted mt-1">Bookmarks and collections stay in this browser and are never uploaded.</p></div>
<div class="ui-card rounded-xl p-space-md"><span class="material-symbols-outlined text-[20px] text-tertiary" aria-hidden="true">send</span><p class="font-title-card text-title-card text-text-primary mt-2">Forms are explicit</p><p class="font-body-compact text-body-compact text-text-muted mt-1">Contact and submission forms transmit only when a delivery key is configured.</p></div>
</section>

<div class="max-w-4xl flex flex-col gap-space-lg font-body-default text-body-default text-text-muted">
<section class="ui-card rounded-xl p-space-lg" aria-labelledby="privacy-scope">
<h2 class="font-headline-section text-headline-section text-text-primary mb-2" id="privacy-scope">1. Scope</h2>
<p>This policy applies to the static DevSpire Nexus pages: the directory landing page, the three registries, documentation, API reference, submission and contact forms, legal pages, and personal collections. It does not govern external websites reached through outbound links, including DevSpireHub.com and the official pages of cataloged products.</p>
</section>

<section class="ui-card rounded-xl p-space-lg" aria-labelledby="privacy-browser">
<h2 class="font-headline-section text-headline-section text-text-primary mb-2" id="privacy-browser">2. Information stored in your browser</h2>
<p class="mb-2">Personal collections use the browser's localStorage under the key <code class="font-code-badge text-secondary">devspire-nexus:personal-collections:v1</code>. The stored payload contains a schema version, bookmarks (resource type, resource ID, and save time), and collections (name, timestamps, and resource references). It contains no account identity, contact details, or free-text notes.</p>
<p class="mb-2">This data stays on your device. It is not transmitted to DevSpireHub, DevSpire Nexus maintainers, or any third party. You can export it as JSON, import a backup, or delete it from the collections page or your browser's site-data settings.</p>
<p>If stored data is malformed, the site keeps an untouched copy under a <code class="font-code-badge text-secondary">:corrupt:</code> suffixed key before falling back to an empty state, so a corrupt payload is not silently discarded. The submission form also keeps a short-lived local duplicate fingerprint under <code class="font-code-badge text-secondary">dsh-submission:</code> keys to block accidental repeat submissions for the configured window; it contains a hash-like string, not your message.</p>
</section>

<section class="ui-card rounded-xl p-space-lg" aria-labelledby="privacy-not">
<h2 class="font-headline-section text-headline-section text-text-primary mb-2" id="privacy-not">3. Information this site does not collect</h2>
<ul class="flex flex-col gap-2 list-disc pl-5">
<li>No user accounts, passwords, or profiles.</li>
<li>No analytics, advertising, heatmap, or session-recording scripts of the site's own.</li>
<li>No cookies set by DevSpire Nexus pages for tracking or personalisation.</li>
<li>No server-side storage of bookmarks or collections.</li>
<li>No sale or rental of personal information, because none is collected by the static pages.</li>
</ul>
</section>

<section class="ui-card rounded-xl p-space-lg" aria-labelledby="privacy-forms">
<h2 class="font-headline-section text-headline-section text-text-primary mb-2" id="privacy-forms">4. Contact and submission forms</h2>
<p class="mb-2">The contact form requests a name, email address, topic, and message. The resource submission form requests record details plus optional submitter name and email. Both forms validate input in the browser first.</p>
<p class="mb-2">Delivery uses <a class="text-secondary hover:underline" href="https://web3forms.com/" target="_blank" rel="noopener">Web3Forms</a>, a third-party form relay. If the deployer has configured a Web3Forms access key, the form sends the fields you entered to the configured endpoint so the service can forward them to the directory maintainers. Web3Forms processes the request under its own privacy policy and may process technical data such as your IP address to deliver and secure the message.</p>
<p class="mb-2">This repository ships with an empty access key. In that state the forms remain visible, validate locally, and state clearly that nothing is transmitted. No message is queued or stored elsewhere.</p>
<p>Both forms include a hidden honeypot field and a minimum completion time to reduce automated spam. The contact form keeps no server-side copy; the submission form keeps a local duplicate fingerprint for a limited window, as described above.</p>
</section>

<section class="ui-card rounded-xl p-space-lg" aria-labelledby="privacy-third">
<h2 class="font-headline-section text-headline-section text-text-primary mb-2" id="privacy-third">5. Third-party requests</h2>
<p class="mb-2">The pages load open-source presentation dependencies from public content networks: the Tailwind CSS CDN, Google Fonts (Geist and JetBrains Mono), and Google's Material Symbols font. Your browser connects directly to those providers, which may receive standard request data such as your IP address, user agent, and the page that requested the asset, under their own policies.</p>
<p>Catalog icons are stored locally in <code class="font-code-badge text-secondary">assets/img/icons/</code>. Outbound links to official product sites are opened only when you choose to follow them.</p>
</section>

<section class="ui-card rounded-xl p-space-lg" aria-labelledby="privacy-links">
<h2 class="font-headline-section text-headline-section text-text-primary mb-2" id="privacy-links">6. External links</h2>
<p>Records link to official product pages, repositories, documentation, and the DevSpireHub parent site. Those destinations have their own privacy practices. A link is not an endorsement and does not transfer data until you click it.</p>
</section>

<section class="ui-card rounded-xl p-space-lg" aria-labelledby="privacy-children">
<h2 class="font-headline-section text-headline-section text-text-primary mb-2" id="privacy-children">7. Children</h2>
<p>The directory is a general-audience technical reference and is not directed at children. The site does not knowingly collect personal information from anyone, including children, because it does not operate accounts or store form submissions itself.</p>
</section>

<section class="ui-card rounded-xl p-space-lg" aria-labelledby="privacy-choices">
<h2 class="font-headline-section text-headline-section text-text-primary mb-2" id="privacy-choices">8. Your choices</h2>
<ul class="flex flex-col gap-2 list-disc pl-5">
<li>Browse the directory without saving anything.</li>
<li>Clear saved bookmarks and collections with <em>Clear all</em> on the <a class="text-secondary hover:underline" href="collections.html">My Collections</a> page, or by clearing site data in your browser.</li>
<li>Export a JSON backup before clearing or switching browsers.</li>
<li>Avoid including sensitive personal information in form messages.</li>
</ul>
</section>

<section class="ui-card rounded-xl p-space-lg" aria-labelledby="privacy-changes">
<h2 class="font-headline-section text-headline-section text-text-primary mb-2" id="privacy-changes">9. Changes to this policy</h2>
<p>If the site's data practices change — for example, if a delivery key or a new integration is added — this page will be updated and the date at the top revised. The static site has no mailing list for policy notices, so the page itself is the authoritative record.</p>
</section>

<section class="ui-card rounded-xl p-space-lg" aria-labelledby="privacy-contact">
<h2 class="font-headline-section text-headline-section text-text-primary mb-2" id="privacy-contact">10. Contact</h2>
<p class="mb-3">Privacy questions or data-practice corrections can be sent through the contact page. When form delivery is not configured, the same page links to the DevSpireHub contact channel instead of pretending to send a message.</p>
<a class="inline-flex items-center gap-2 bg-primary-container text-bg-canvas font-body-compact text-body-compact font-semibold px-4 py-2 rounded btn-amber" href="contact.html">Open contact page <span class="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span></a>
</section>
</div>
` + foot();

/* --------------------------------------------------------------- Contact */
const contact = head('Contact | DevSpire Nexus', 'Contact DevSpire Nexus about catalog corrections, privacy questions, or directory feedback. The form is honest about delivery configuration and never fakes a send.') + `
${crumb('Contact')}
${pageHeader('Contact', 'Contact DevSpire Nexus', 'Corrections, privacy questions, and directory feedback. Messages are delivered through Web3Forms only when the deployer has configured an access key.')}

<div class="rounded-xl border border-status-warning/40 bg-status-warning/10 p-4 flex items-start gap-3" id="contact-config" role="note" hidden>
<span class="material-symbols-outlined text-status-warning text-xl shrink-0" aria-hidden="true">settings</span>
<div class="min-w-0">
<p class="font-body-compact text-body-compact text-text-primary font-medium" id="contact-config-title">Form delivery is not configured in this copy</p>
<p class="font-metadata-label text-metadata-label text-text-muted mt-0.5" id="contact-config-text">No Web3Forms access key is present in <code class="font-code-badge">data/site-config.js</code>, so this form will validate your message but cannot transmit it. You can reach the parent brand through the <a class="text-secondary hover:underline" href="https://devspirehub.com/Website/contact/index.html" target="_blank" rel="noopener">DevSpireHub contact page</a>.</p>
</div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-space-lg items-start">
<section class="ui-card rounded-xl p-space-lg" aria-labelledby="contact-form-title">
<h2 class="font-headline-section text-headline-section text-text-primary mb-1" id="contact-form-title">Send a message</h2>
<p class="font-body-compact text-body-compact text-text-muted mb-4">Required fields are marked. Do not include passwords, private keys, or anything you would not publish.</p>
<form id="contact-form" action="https://api.web3forms.com/submit" method="POST" novalidate>
<input type="hidden" name="access_key" value="99ea5478-6d12-4190-bd08-d596eb363775"/>
<div class="rounded border border-status-error/40 bg-status-error/10 px-3 py-2 mb-4 font-body-compact text-body-compact text-status-error" id="contact-status" role="alert" aria-live="assertive" tabindex="-1" hidden></div>
<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
<div class="flex flex-col gap-1.5">
<label class="font-metadata-label text-metadata-label text-text-muted" for="contact-name">Your name <span class="text-primary-container">*</span></label>
<input class="nexus-input" id="contact-name" name="name" type="text" maxlength="80" autocomplete="name" required aria-describedby="contact-name-error"/>
<p class="nexus-error" id="contact-name-error" hidden></p>
</div>
<div class="flex flex-col gap-1.5">
<label class="font-metadata-label text-metadata-label text-text-muted" for="contact-email">Email address <span class="text-primary-container">*</span></label>
<input class="nexus-input" id="contact-email" name="email" type="email" inputmode="email" maxlength="120" autocomplete="email" required aria-describedby="contact-email-error"/>
<p class="nexus-error" id="contact-email-error" hidden></p>
</div>
<div class="flex flex-col gap-1.5 sm:col-span-2">
<label class="font-metadata-label text-metadata-label text-text-muted" for="contact-topic">Topic <span class="text-primary-container">*</span></label>
<select class="nexus-input" id="contact-topic" name="topic" required aria-describedby="contact-topic-error">
<option value="">Select a topic…</option>
<option value="Catalog correction">Catalog correction</option>
<option value="Resource suggestion">Resource suggestion</option>
<option value="Privacy question">Privacy question</option>
<option value="Directory feedback">Directory feedback</option>
<option value="Other">Other</option>
</select>
<p class="nexus-error" id="contact-topic-error" hidden></p>
</div>
<div class="flex flex-col gap-1.5 sm:col-span-2">
<label class="font-metadata-label text-metadata-label text-text-muted" for="contact-message">Message <span class="text-primary-container">*</span></label>
<textarea class="nexus-input min-h-[150px]" id="contact-message" name="message" maxlength="2000" required aria-describedby="contact-message-error contact-message-help"></textarea>
<p class="font-metadata-label text-metadata-label text-text-muted" id="contact-message-help">20–2000 characters. For corrections, include the record name, URL, and a public evidence link.</p>
<p class="nexus-error" id="contact-message-error" hidden></p>
</div>
</div>
<div class="hidden" aria-hidden="true">
<label for="contact-botcheck">Leave this field unchecked</label>
<input id="contact-botcheck" name="botcheck" type="checkbox" tabindex="-1" autocomplete="off"/>
</div>
<div class="flex flex-wrap items-center gap-3 mt-5">
<button class="inline-flex items-center gap-2 bg-primary-container text-bg-canvas font-body-compact text-body-compact font-semibold px-4 py-2 rounded transition-all duration-150 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed" id="contact-submit" type="submit">
<span class="material-symbols-outlined text-[18px]" aria-hidden="true">send</span>
<span id="contact-submit-label">Submit Form</span>
</button>
<p class="font-metadata-label text-metadata-label text-text-muted" id="contact-delivery-note">Delivery status is checked in the browser before sending.</p>
</div>
<p class="font-metadata-label text-metadata-label text-text-muted mt-3">When configured, messages are transmitted by <a class="text-secondary hover:underline" href="https://web3forms.com/" target="_blank" rel="noopener">Web3Forms</a> to the directory maintainers. See the <a class="text-secondary hover:underline" href="privacy.html">Privacy Policy</a>.</p>
</form>
<noscript>
<div class="rounded-xl border border-status-warning/40 bg-status-warning/10 p-4 mt-4 font-body-compact text-body-compact text-text-primary">This form needs JavaScript to validate and deliver a message. Without JavaScript, nothing is transmitted.</div>
</noscript>
</section>

<aside class="flex flex-col gap-space-md">
<section class="ui-card rounded-xl p-space-md" aria-labelledby="contact-help-title">
<h2 class="font-title-card text-title-card text-text-primary mb-2" id="contact-help-title">What to include</h2>
<ul class="flex flex-col gap-2 font-body-compact text-body-compact text-text-muted">
<li class="flex gap-2"><span class="material-symbols-outlined text-[16px] text-tertiary shrink-0" aria-hidden="true">check</span><span>The record name and the registry page that lists it.</span></li>
<li class="flex gap-2"><span class="material-symbols-outlined text-[16px] text-tertiary shrink-0" aria-hidden="true">check</span><span>A public source that supports the correction, such as official documentation.</span></li>
<li class="flex gap-2"><span class="material-symbols-outlined text-[16px] text-tertiary shrink-0" aria-hidden="true">check</span><span>What specifically is wrong or outdated.</span></li>
<li class="flex gap-2"><span class="material-symbols-outlined text-[16px] text-status-warning shrink-0" aria-hidden="true">block</span><span>No confidential material, credentials, or private personal data.</span></li>
</ul>
</section>
<section class="ui-card rounded-xl p-space-md" aria-labelledby="contact-process-title">
<h2 class="font-title-card text-title-card text-text-primary mb-2" id="contact-process-title">How messages are handled</h2>
<p class="font-body-compact text-body-compact text-text-muted">Corrections are reviewed manually against the evidence you provide. A message does not automatically change a record, and delivery does not guarantee a response or a publication date.</p>
</section>
<section class="ui-card rounded-xl p-space-md" aria-labelledby="contact-alt-title">
<h2 class="font-title-card text-title-card text-text-primary mb-2" id="contact-alt-title">Other channels</h2>
<p class="font-body-compact text-body-compact text-text-muted mb-2">For parent-brand enquiries, use the DevSpireHub website. For catalog submissions, use the structured form.</p>
<ul class="flex flex-col gap-1.5 font-body-compact text-body-compact">
<li><a class="text-secondary hover:underline inline-flex items-center gap-1" href="https://devspirehub.com/Website/contact/index.html" target="_blank" rel="noopener">DevSpireHub contact <span class="material-symbols-outlined text-[14px]" aria-hidden="true">open_in_new</span></a></li>
<li><a class="text-secondary hover:underline inline-flex items-center gap-1" href="submit.html">Submit a resource <span class="material-symbols-outlined text-[14px]" aria-hidden="true">arrow_forward</span></a></li>
</ul>
</section>
</aside>
</div>
` + foot('<script src="data/site-config.js"></script>\n<script src="assets/contact.js"></script>');

/* ----------------------------------------------------------------- Terms */
const terms = head('Terms of Service | DevSpire Nexus', 'Terms for using the DevSpire Nexus AI Intelligence Directory: informational catalog, third-party links, acceptable use, submissions, local collections, and liability limits.') + `
${crumb('Terms of Service')}
${pageHeader('Legal &amp; information', 'Terms of Service', 'These terms describe the conditions for using the DevSpire Nexus static directory. Last updated November 5, 2026.')}

<div class="max-w-4xl flex flex-col gap-space-lg font-body-default text-body-default text-text-muted">
<section class="ui-card rounded-xl p-space-lg" aria-labelledby="terms-accept">
<h2 class="font-headline-section text-headline-section text-text-primary mb-2" id="terms-accept">1. Acceptance</h2>
<p>By browsing DevSpire Nexus you agree to these terms. If you do not agree, do not use the site. These terms describe this static website; they do not create or name a separately registered legal entity, and they state no postal address or jurisdiction because this build does not publish unverified legal details.</p>
</section>

<section class="ui-card rounded-xl p-space-lg" aria-labelledby="terms-informational">
<h2 class="font-headline-section text-headline-section text-text-primary mb-2" id="terms-informational">2. Informational directory</h2>
<p class="mb-2">The catalog is an informational index of AI tools, models, and developer resources. Records reflect the source dataset at the last verification date shown on the record or registry. Pricing, licensing, capabilities, availability, and deployment details can change at any time.</p>
<p>Nothing on the site is a live price feed, a security assessment, a benchmark result, or a guarantee that a product behaves as described. Verify important details on the official page before making a decision.</p>
</section>

<section class="ui-card rounded-xl p-space-lg" aria-labelledby="terms-advice">
<h2 class="font-headline-section text-headline-section text-text-primary mb-2" id="terms-advice">3. No professional advice</h2>
<p>The directory does not provide legal, financial, security, medical, or other professional advice. Licensing terms are shown as metadata, not as legal interpretation. Consult the license text and qualified advice for your situation.</p>
</section>

<section class="ui-card rounded-xl p-space-lg" aria-labelledby="terms-third">
<h2 class="font-headline-section text-headline-section text-text-primary mb-2" id="terms-third">4. Third-party names and links</h2>
<p class="mb-2">Product names, company names, logos, and icons belong to their respective owners and appear for identification only. Their presence is not an endorsement, partnership, or sponsorship.</p>
<p>Outbound links lead to third-party websites with their own terms and privacy practices. You are responsible for reviewing them. DevSpire Nexus does not control third-party content.</p>
</section>

<section class="ui-card rounded-xl p-space-lg" aria-labelledby="terms-accuracy">
<h2 class="font-headline-section text-headline-section text-text-primary mb-2" id="terms-accuracy">5. Accuracy and availability</h2>
<p>The site is provided on an "as is" and "as available" basis. Records may be incomplete, outdated, or incorrect despite review. The site may change, move, or become unavailable without notice, and static endpoints or file paths may change between verification passes. No warranty of fitness for a particular purpose is offered.</p>
</section>

<section class="ui-card rounded-xl p-space-lg" aria-labelledby="terms-use">
<h2 class="font-headline-section text-headline-section text-text-primary mb-2" id="terms-use">6. Acceptable use</h2>
<ul class="flex flex-col gap-2 list-disc pl-5">
<li>Do not attempt to disrupt, overload, or gain unauthorised access to the site or its hosting.</li>
<li>Do not use the site or its datasets for unlawful purposes.</li>
<li>Do not misrepresent records as current when their verification dates are older.</li>
<li>Do not remove attribution when redistributing substantial portions of the datasets under the terms described on the <a class="text-secondary hover:underline" href="api.html">API and Data Access</a> page.</li>
</ul>
</section>

<section class="ui-card rounded-xl p-space-lg" aria-labelledby="terms-submissions">
<h2 class="font-headline-section text-headline-section text-text-primary mb-2" id="terms-submissions">7. Submissions</h2>
<p class="mb-2">Submissions are voluntary. By sending a record you confirm that the information is accurate to your knowledge and that you may share it publicly. Do not submit confidential information, credentials, or material you do not have the right to share.</p>
<p>Maintainers may edit, reject, or defer a submission, and nothing is published automatically. Sending a submission does not create a payment obligation or a right to inclusion.</p>
</section>

<section class="ui-card rounded-xl p-space-lg" aria-labelledby="terms-collections">
<h2 class="font-headline-section text-headline-section text-text-primary mb-2" id="terms-collections">8. Personal collections</h2>
<p>Bookmarks and collections are stored in your browser, not on a server. They can be lost if you clear site data, use private browsing, change devices, or hit storage limits. Export a JSON backup if the data matters to you. The site provides no recovery service for local data.</p>
</section>

<section class="ui-card rounded-xl p-space-lg" aria-labelledby="terms-ip">
<h2 class="font-headline-section text-headline-section text-text-primary mb-2" id="terms-ip">9. Intellectual property</h2>
<p class="mb-2">The site's layout, structure, and curated compilation are part of the DevSpire Nexus project. Factual record fields belong to their original sources where applicable. Local icons are used to identify the products they represent.</p>
<p>Static JSON exports are provided for research and integration. Attribution to the source record or official page remains appropriate when the underlying data is reused.</p>
</section>

<section class="ui-card rounded-xl p-space-lg" aria-labelledby="terms-liability">
<h2 class="font-headline-section text-headline-section text-text-primary mb-2" id="terms-liability">10. Limitation of liability</h2>
<p>To the maximum extent permitted by applicable law, the project and its maintainers are not liable for indirect, incidental, special, consequential, or punitive damages arising from use of the site, reliance on a record, or inability to access the site. Because the site is free and static, the total aggregate liability for any claim is limited to the amount you paid to use it, which is zero.</p>
</section>

<section class="ui-card rounded-xl p-space-lg" aria-labelledby="terms-changes">
<h2 class="font-headline-section text-headline-section text-text-primary mb-2" id="terms-changes">11. Changes</h2>
<p>These terms may be updated when the site's features change. The revised date at the top of this page is the version marker. Continued use after an update means you accept the revised terms.</p>
</section>

<section class="ui-card rounded-xl p-space-lg" aria-labelledby="terms-contact">
<h2 class="font-headline-section text-headline-section text-text-primary mb-2" id="terms-contact">12. Contact</h2>
<p class="mb-3">Questions about these terms can be sent through the contact page. See also the <a class="text-secondary hover:underline" href="privacy.html">Privacy Policy</a> for data practices.</p>
<a class="inline-flex items-center gap-2 bg-primary-container text-bg-canvas font-body-compact text-body-compact font-semibold px-4 py-2 rounded btn-amber" href="contact.html">Open contact page <span class="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span></a>
</section>
</div>
` + foot();

/* ------------------------------------------------------------- Collections */
const collections = head('My Collections | DevSpire Nexus', 'Your personal DevSpire Nexus collection: bookmark AI tools, models, and developer resources in this browser, organise custom collections, and export a JSON backup.') + `
${crumb('My Collections')}
${pageHeader('Personal workspace', 'My Collections', 'Save records from any registry and organise them into custom collections. Everything here stays in this browser — no account, no upload, no server copy.')}

<div class="rounded-xl border border-secondary/40 bg-secondary/5 p-4 flex items-start gap-3" role="note">
<span class="material-symbols-outlined text-secondary text-xl shrink-0" aria-hidden="true">info</span>
<div class="min-w-0">
<p class="font-body-compact text-body-compact text-text-primary font-medium">Browser-only storage</p>
<p class="font-metadata-label text-metadata-label text-text-muted mt-0.5">Bookmarks and collections are kept in this browser on this device. Clearing site data, using private browsing, or switching devices will not carry them over. Export a JSON backup from the toolbar if you want to keep or move your collection.</p>
</div>
</div>

<div class="rounded-xl border border-status-warning/40 bg-status-warning/10 p-4 flex items-start gap-3" id="storage-status" role="alert" hidden>
<span class="material-symbols-outlined text-status-warning text-xl shrink-0" aria-hidden="true">warning</span>
<div class="min-w-0">
<p class="font-body-compact text-body-compact text-text-primary font-medium">Browser storage is unavailable</p>
<p class="font-metadata-label text-metadata-label text-text-muted mt-0.5" id="storage-status-text">This browser blocked localStorage. You can use collections for this session, but changes will not survive a reload. Export a backup before leaving.</p>
</div>
</div>

<section class="grid grid-cols-2 lg:grid-cols-4 gap-gutter" id="collections-summary" aria-label="Collection summary"></section>

<section class="ui-card rounded-xl p-space-lg" aria-labelledby="saved-title">
<div class="flex flex-wrap items-center justify-between gap-3 mb-4">
<div>
<h2 class="font-headline-section text-headline-section text-text-primary" id="saved-title">All Saved</h2>
<p class="font-body-compact text-body-compact text-text-muted">Every bookmarked record across the three registries.</p>
</div>
<span class="font-code-badge text-code-badge px-2.5 py-1 rounded bg-surface-secondary border border-border-subtle text-text-muted" id="saved-count">0 saved</span>
</div>
<div id="saved-list" class="flex flex-col gap-2"></div>
</section>

<section class="ui-card rounded-xl p-space-lg" id="recently-viewed-section" hidden>
<div class="flex flex-wrap items-center justify-between gap-3 mb-4">
<div>
<h2 class="font-headline-section text-headline-section text-text-primary">Recently Viewed</h2>
<p class="font-body-compact text-body-compact text-text-muted">Resources you inspected during your browsing session.</p>
</div>
<div class="flex items-center gap-3">
<span class="font-code-badge text-code-badge px-2.5 py-1 rounded bg-surface-secondary border border-border-subtle text-text-muted" id="recently-viewed-count">0 items</span>
<button type="button" class="font-metadata-label text-metadata-label text-text-muted hover:text-status-warning transition-colors" id="clear-recent-btn">Clear history</button>
</div>
</div>
<div id="recently-viewed-list" class="flex flex-col gap-2"></div>
</section>

<section aria-labelledby="custom-title">
<div class="flex flex-wrap items-center justify-between gap-3 mb-3">
<div>
<h2 class="font-headline-section text-headline-section text-text-primary" id="custom-title">Custom collections</h2>
<p class="font-body-compact text-body-compact text-text-muted">Group saved records by project, stack, or anything else.</p>
</div>
<button class="inline-flex items-center gap-2 bg-primary-container text-bg-canvas font-body-compact text-body-compact font-semibold px-3.5 py-2 rounded transition-all duration-150 hover:brightness-110" id="new-collection-btn" type="button">
<span class="material-symbols-outlined text-[17px]" aria-hidden="true">create_new_folder</span>New collection
</button>
</div>
<form class="ui-card rounded-xl p-space-md flex flex-col sm:flex-row sm:items-end gap-3 mb-3" id="new-collection-form" hidden>
<div class="flex flex-col gap-1.5 flex-1 min-w-0">
<label class="font-metadata-label text-metadata-label text-text-muted" for="new-collection-name">Collection name</label>
<input class="nexus-input" id="new-collection-name" name="name" type="text" maxlength="60" autocomplete="off" required aria-describedby="new-collection-error"/>
<p class="nexus-error" id="new-collection-error" hidden></p>
</div>
<div class="flex items-center gap-2">
<button class="inline-flex items-center gap-1.5 bg-primary-container text-bg-canvas font-body-compact text-body-compact font-semibold px-3 py-2 rounded hover:brightness-110 transition-all" type="submit">Create</button>
<button class="inline-flex items-center gap-1.5 bg-surface-secondary border border-border-subtle text-text-primary font-body-compact text-body-compact px-3 py-2 rounded hover:border-secondary transition-colors" id="cancel-new-collection" type="button">Cancel</button>
</div>
</form>
<div id="collections-list" class="flex flex-col gap-space-md"></div>
</section>

<section class="ui-card rounded-xl p-space-lg" aria-labelledby="toolbar-title">
<div class="flex flex-wrap items-center justify-between gap-3 mb-3">
<h2 class="font-headline-section text-headline-section text-text-primary" id="toolbar-title">Find and manage</h2>
<span class="font-metadata-label text-metadata-label text-text-muted">Filters apply to both sections</span>
</div>
<label class="block font-metadata-label text-metadata-label text-text-muted mb-1" for="collection-search">Search saved resources</label>
<div class="relative mb-4 max-w-xl">
<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-text-muted pointer-events-none" aria-hidden="true">search</span>
<input class="nexus-input pl-10" id="collection-search" type="search" placeholder="Name, category, or tag…" autocomplete="off" aria-describedby="collection-search-help"/>
</div>
<p class="font-metadata-label text-metadata-label text-text-muted mb-4" id="collection-search-help">Search runs locally against the records you saved.</p>
<div class="flex flex-wrap items-center gap-2">
<button class="inline-flex items-center gap-2 bg-surface-secondary border border-border-subtle text-text-primary font-body-compact text-body-compact px-3 py-2 rounded hover:border-secondary transition-colors" id="export-btn" type="button">
<span class="material-symbols-outlined text-[17px]" aria-hidden="true">download</span>Export JSON
</button>
<label class="inline-flex items-center gap-2 bg-surface-secondary border border-border-subtle text-text-primary font-body-compact text-body-compact px-3 py-2 rounded hover:border-secondary transition-colors cursor-pointer" for="import-input">
<span class="material-symbols-outlined text-[17px]" aria-hidden="true">upload</span>Import JSON
</label>
<input class="sr-only" id="import-input" type="file" accept="application/json,.json"/>
<button class="inline-flex items-center gap-2 bg-surface-secondary border border-status-error/40 text-status-error font-body-compact text-body-compact px-3 py-2 rounded hover:border-status-error transition-colors" id="clear-all-btn" type="button">
<span class="material-symbols-outlined text-[17px]" aria-hidden="true">delete_sweep</span>Clear all
</button>
</div>
<p class="font-metadata-label text-metadata-label mt-3" id="collections-status" role="status" aria-live="polite"></p>
<p class="font-metadata-label text-metadata-label text-text-muted mt-2">Import replaces the bookmarks and collections stored in this browser. Export first if you want a backup. Nothing is transmitted.</p>
</section>
` + foot('<script src="data/ai-tools.js"></script>\n<script src="data/ai-models.js"></script>\n<script src="data/developer-resources.js"></script>\n<script src="assets/resource-icons.js"></script>\n<script src="assets/collections.js"></script>\n<script src="assets/status-badges.js"></script>\n<script src="assets/recently-viewed.js"></script>\n<script src="assets/share.js"></script>\n<script src="assets/collections-page.js"></script>');

const pages = { 'about.html': about, 'privacy.html': privacy, 'contact.html': contact, 'terms.html': terms, 'collections.html': collections };

for (const [file, source] of Object.entries(pages)) {
  fs.writeFileSync(path.join(ROOT, file), source, 'utf8');
  const changed = shell.applyFile(file);
  console.log(`${file}: written${changed ? ' + shell applied' : ''}`);
}
