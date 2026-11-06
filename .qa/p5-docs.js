(() => {
  'use strict';

  const T = window.AI_TOOLS || [];
  const M = window.AI_MODELS || [];
  const D = window.DEVELOPER_RESOURCES || [];
  const TM = window.AI_TOOLS_META || {};
  const MM = window.AI_MODELS_META || {};
  const DM = window.DEVELOPER_RESOURCES_META || {};

  const set = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  const verified = (meta) => meta.last_verified ? `Last verified ${meta.last_verified}` : 'Last verified date not recorded';

  set('doc-tools-count', String(T.length));
  set('doc-models-count', String(M.length));
  set('doc-resources-count', String(D.length));
  set('doc-tools-verified', verified(TM));
  set('doc-models-verified', verified(MM));
  set('doc-resources-verified', verified(DM));

  const counts = { tools: T.length, models: M.length, resources: D.length };
  document.querySelectorAll('[data-doc-count]').forEach((el) => {
    const key = el.getAttribute('data-doc-count');
    el.textContent = String(counts[key] == null ? 0 : counts[key]);
  });
})();
