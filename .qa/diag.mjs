import fs from 'node:fs';

const targetRes = await fetch('http://127.0.0.1:9223/json/new?about:blank', { method: 'PUT' });
const target = await targetRes.json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let nextId = 0;
const pending = new Map();
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const job = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? job.reject(new Error(JSON.stringify(msg.error))) : job.resolve(msg.result);
  }
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'http://127.0.0.1:8123/' });
await new Promise((resolve) => setTimeout(resolve, 900));

const diagnose = `(() => {
  const de = document.documentElement;
  const pick = (selector) => Array.from(document.querySelectorAll(selector)).map((el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return {
      sel: selector,
      tag: el.tagName,
      cls: typeof el.className === 'string' ? el.className : '',
      left: Math.round(r.left),
      width: Math.round(r.width),
      right: Math.round(r.right),
      scrollWidth: el.scrollWidth,
      minWidth: s.minWidth,
      whiteSpace: s.whiteSpace,
      flexShrink: s.flexShrink
    };
  });
  return {
    viewport: innerWidth,
    docScroll: de.scrollWidth,
    bodyScroll: document.body.scrollWidth,
    main: pick('.page-main'),
    hero: pick('.hero'),
    heroChildren: pick('.hero > *'),
    search: pick('.search-box, #resource-search, .search-box .key-hint, .query-presets, .preset-chip'),
    typeGrid: pick('.type-grid, .type-card'),
    header: pick('.header-inner, .brand-name, .header-actions')
  };
})()`;

const before = await evaluate(diagnose);
const after = await evaluate(`(() => {
  const style = document.createElement('style');
  style.textContent = '.page-main > * { min-width: 0; } .hero { min-width: 0; }';
  document.head.appendChild(style);
  const de = document.documentElement;
  return { scrollWidth: de.scrollWidth, heroWidth: document.querySelector('.hero').getBoundingClientRect().width, badgeWidth: document.querySelector('.badge-pill').getBoundingClientRect().width, badgeHeight: document.querySelector('.badge-pill').getBoundingClientRect().height };
})()`);

fs.writeFileSync('H:/Devspirehub AI/.qa/diag.json', JSON.stringify({ before, after }, null, 2));
console.log(JSON.stringify({ before, after }, null, 2));
ws.close();
