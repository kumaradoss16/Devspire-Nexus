/* DevSpire Nexus: Resource Sharing Module (Requirement 5)
   Provides accessible, multi-platform sharing (WhatsApp, Email, Telegram, Threads,
   Facebook, Instagram fallback, Native Web Share, and Copy Link) with canonical URLs. */
(() => {
  'use strict';

  const PAGE_MAP = {
    tool: 'ai-tools.html',
    model: 'models.html',
    resource: 'developer-resources.html'
  };

  const TYPE_LABELS = {
    tool: 'AI Tool',
    model: 'AI Model',
    resource: 'Developer Resource'
  };

  function resolveResource(type, id) {
    if (window.DevSpireCollections && typeof window.DevSpireCollections.resolve === 'function') {
      const res = window.DevSpireCollections.resolve(type, id);
      if (res) return res;
    }
    const list = type === 'tool' ? window.AI_TOOLS : type === 'model' ? window.AI_MODELS : window.DEVELOPER_RESOURCES;
    if (Array.isArray(list)) {
      return list.find((r) => r.id === id) || null;
    }
    return null;
  }

  function getCanonicalUrl(type, id) {
    const page = PAGE_MAP[type] || 'directory.html';
    const hash = `#${type}/${encodeURIComponent(id)}`;
    if (window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file:')) {
      const path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
      return `${window.location.origin}${path}${page}${hash}`;
    }
    return `${page}${hash}`;
  }

  function formatSharePayload(resource, type) {
    const name = resource ? resource.name : 'AI Resource';
    const desc = resource ? (resource.description || '') : '';
    const category = resource ? (resource.category || '') : '';
    const typeLabel = TYPE_LABELS[type] || 'AI Resource';
    const url = getCanonicalUrl(type, resource ? resource.id : '');

    const title = `${name} | DevSpire Nexus`;
    const text = `${name} (${typeLabel} · ${category}): ${desc}\n\nDiscover more on DevSpire Nexus:`;
    const fullText = `${text}\n${url}`;

    return { name, desc, category, typeLabel, url, title, text, fullText };
  }

  function showToast(message) {
    if (window.DevSpireCollections && typeof window.DevSpireCollections.toast === 'function') {
      window.DevSpireCollections.toast(message);
      return;
    }
    let toast = document.getElementById('nexus-share-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'nexus-share-toast';
      toast.className = 'fixed bottom-5 right-5 z-[1000] bg-surface-card border border-border-subtle rounded-lg px-4 py-2.5 text-text-primary text-sm shadow-xl flex items-center gap-2';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span class="material-symbols-outlined text-primary text-base" aria-hidden="true">check_circle</span><span>${message}</span>`;
    toast.hidden = false;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.hidden = true; }, 3200);
  }

  async function copyToClipboard(text, successMsg = 'Link copied to clipboard!') {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        showToast(successMsg);
        return true;
      }
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast(successMsg);
      return true;
    } catch (err) {
      showToast('Could not copy link automatically.');
      return false;
    }
  }

  let activeModal = null;

  function closeModal() {
    if (activeModal) {
      activeModal.remove();
      activeModal = null;
      document.removeEventListener('keydown', handleKey);
    }
  }

  function handleKey(e) {
    if (e.key === 'Escape') closeModal();
  }

  function openShareDialog(type, id) {
    const resource = resolveResource(type, id);
    const p = formatSharePayload(resource, type);

    closeModal();

    const backdrop = document.createElement('div');
    backdrop.className = 'nexus-modal-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-label', `Share ${p.name}`);

    const hasNativeShare = typeof navigator.share === 'function';

    backdrop.innerHTML = `
      <div class="nexus-modal-panel">
        <div class="flex items-center justify-between gap-3 pb-3 border-b border-border-subtle">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="p-2 rounded bg-surface-secondary border border-border-subtle text-primary shrink-0">
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true">share</span>
            </span>
            <div class="min-w-0">
              <h3 class="font-title-card text-[16px] font-semibold text-text-primary truncate">Share ${p.name}</h3>
              <p class="font-metadata-label text-[12px] text-text-muted truncate">${p.typeLabel} · ${p.category || 'Directory'}</p>
            </div>
          </div>
          <button class="w-8 h-8 rounded bg-surface-secondary border border-border-subtle text-text-muted hover:text-text-primary flex items-center justify-center transition-colors" type="button" aria-label="Close dialog" id="share-close-btn">
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">close</span>
          </button>
        </div>

        <div class="share-grid">
          ${hasNativeShare ? `
          <button class="share-item-btn" type="button" id="share-native">
            <span class="material-symbols-outlined text-[22px] text-secondary" aria-hidden="true">share</span>
            <span>Device Share</span>
          </button>` : ''}
          <a class="share-item-btn" href="https://api.whatsapp.com/send?text=${encodeURIComponent(p.fullText)}" target="_blank" rel="noopener noreferrer">
            <span class="material-symbols-outlined text-[22px] text-[#25D366]" aria-hidden="true">chat</span>
            <span>WhatsApp</span>
          </a>
          <a class="share-item-btn" href="https://t.me/share/url?url=${encodeURIComponent(p.url)}&text=${encodeURIComponent(p.text)}" target="_blank" rel="noopener noreferrer">
            <span class="material-symbols-outlined text-[22px] text-[#229ED9]" aria-hidden="true">send</span>
            <span>Telegram</span>
          </a>
          <a class="share-item-btn" href="https://threads.net/intent/post?text=${encodeURIComponent(p.text + ' ' + p.url)}" target="_blank" rel="noopener noreferrer">
            <span class="material-symbols-outlined text-[22px] text-text-primary" aria-hidden="true">alternate_email</span>
            <span>Threads</span>
          </a>
          <a class="share-item-btn" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(p.url)}" target="_blank" rel="noopener noreferrer">
            <span class="material-symbols-outlined text-[22px] text-[#1877F2]" aria-hidden="true">thumb_up</span>
            <span>Facebook</span>
          </a>
          <a class="share-item-btn" href="mailto:?subject=${encodeURIComponent(p.title)}&body=${encodeURIComponent(p.fullText)}">
            <span class="material-symbols-outlined text-[22px] text-primary-container" aria-hidden="true">mail</span>
            <span>Email</span>
          </a>
          <button class="share-item-btn" type="button" id="share-instagram">
            <span class="material-symbols-outlined text-[22px] text-[#E4405F]" aria-hidden="true">photo_camera</span>
            <span>Instagram</span>
          </button>
          <button class="share-item-btn" type="button" id="share-copy">
            <span class="material-symbols-outlined text-[22px] text-tertiary" aria-hidden="true">content_copy</span>
            <span>Copy Link</span>
          </button>
        </div>

        <div class="mt-3 p-2.5 rounded bg-surface-secondary border border-border-subtle flex items-center justify-between gap-2">
          <input class="bg-transparent border-0 font-code-param text-[12px] text-text-muted flex-1 min-w-0 outline-none select-all" type="text" readonly value="${p.url}" id="share-url-input"/>
          <button class="text-xs font-semibold text-secondary hover:underline px-2 py-1 shrink-0" type="button" id="share-url-copy-btn">Copy</button>
        </div>

        <div id="instagram-note" class="mt-3 p-3 rounded bg-surface-secondary/70 border border-border-subtle text-xs text-text-muted hidden">
          <p class="font-semibold text-text-primary mb-1">Instagram Sharing Note</p>
          <p class="mb-2">Instagram does not support direct link pre-population via web URLs. We have copied the resource summary & link to your clipboard so you can paste it into a caption or story.</p>
          <div class="flex items-center gap-2">
            <button class="bg-primary-container text-bg-canvas font-semibold px-2.5 py-1 rounded text-xs hover:brightness-110" type="button" id="open-instagram-btn">Open Instagram</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    activeModal = backdrop;
    document.addEventListener('keydown', handleKey);

    // Event bindings inside modal
    backdrop.querySelector('#share-close-btn').addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });

    const copyBtn = backdrop.querySelector('#share-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        await copyToClipboard(p.url, 'Resource link copied to clipboard!');
        closeModal();
      });
    }

    const urlCopyBtn = backdrop.querySelector('#share-url-copy-btn');
    if (urlCopyBtn) {
      urlCopyBtn.addEventListener('click', async () => {
        await copyToClipboard(p.url, 'Resource link copied to clipboard!');
      });
    }

    const nativeBtn = backdrop.querySelector('#share-native');
    if (nativeBtn) {
      nativeBtn.addEventListener('click', async () => {
        try {
          await navigator.share({ title: p.title, text: p.text, url: p.url });
          closeModal();
        } catch (e) {
          // User dismissed or share failed
        }
      });
    }

    const igBtn = backdrop.querySelector('#share-instagram');
    const igNote = backdrop.querySelector('#instagram-note');
    if (igBtn && igNote) {
      igBtn.addEventListener('click', async () => {
        await copyToClipboard(p.fullText, 'Caption & link copied for Instagram!');
        igNote.classList.remove('hidden');
      });
    }

    const openIgBtn = backdrop.querySelector('#open-instagram-btn');
    if (openIgBtn) {
      openIgBtn.addEventListener('click', () => {
        window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
        closeModal();
      });
    }
  }

  // Global click delegate for [data-share] buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-share]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const raw = btn.getAttribute('data-share') || '';
    const [type, ...rest] = raw.split(':');
    const id = rest.join(':');
    if (type && id) {
      openShareDialog(type, id);
    }
  });

  window.NexusShare = {
    open: openShareDialog,
    copyLink: copyToClipboard,
    getCanonicalUrl,
    formatPayload: formatSharePayload
  };
})();
