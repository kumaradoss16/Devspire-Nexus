(() => {
  'use strict';

  const status = document.getElementById('copy-status');
  const say = (text) => { if (status) status.textContent = text; };

  const copyText = async (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      /* fall through */
    }
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch {
      return false;
    }
  };

  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const path = btn.getAttribute('data-copy');
      const ok = await copyText(path);
      const label = btn.textContent;
      btn.textContent = ok ? 'Copied' : 'Copy failed';
      setTimeout(() => { btn.textContent = label; }, 1600);
      say(ok ? `Copied path: ${path}` : `Copy failed — select ${path} manually.`);
    });
  });

  document.querySelectorAll('[data-copy-target]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const target = document.getElementById(btn.getAttribute('data-copy-target'));
      if (!target) return;
      const ok = await copyText(target.textContent);
      say(ok ? 'Manifest JSON copied.' : 'Copy failed — select the JSON manually.');
    });
  });
})();
