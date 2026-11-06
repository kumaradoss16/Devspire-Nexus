import fs from 'node:fs';

const PORT = 9223;
const SITE = 'http://127.0.0.1:8123/';
const OUT = 'H:/Devspirehub AI/.qa';

const targetRes = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' });
const target = await targetRes.json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

let nextId = 0;
const pending = new Map();
const consoleErrors = [];
const exceptions = [];

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const job = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) job.reject(new Error(JSON.stringify(msg.error)));
    else job.resolve(msg.result);
    return;
  }
  if (msg.method === 'Runtime.consoleAPICalled' && ['error', 'warning', 'assert'].includes(msg.params.type)) {
    consoleErrors.push(msg.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' '));
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    exceptions.push(msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description || ''));
  }
  if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
    consoleErrors.push(msg.params.entry.text);
  }
};

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text + ' ' + (result.exceptionDetails.exception?.description || ''));
  }
  return result.result.value;
}

async function openAt(width, height = 900) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: SITE });
  await new Promise((resolve) => setTimeout(resolve, 900));
  await evaluate('document.fonts.ready.then(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))');
}

async function metrics() {
  return evaluate(`(() => {
    const de = document.documentElement;
    const offenders = Array.from(document.querySelectorAll('body *')).filter((el) => {
      const style = getComputedStyle(el);
      if (style.position === 'fixed' || style.visibility === 'hidden' || style.display === 'none') return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && (rect.right > de.clientWidth + 1 || rect.left < -1);
    }).slice(0, 8).map((el) => ({
      tag: el.tagName,
      cls: typeof el.className === 'string' ? el.className.slice(0, 60) : '',
      right: Math.round(el.getBoundingClientRect().right),
      scrollX: window.scrollX
    }));
    return {
      viewport: window.innerWidth,
      clientWidth: de.clientWidth,
      scrollWidth: de.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      pageHeight: de.scrollHeight,
      horizontalOverflow: de.scrollWidth > de.clientWidth + 1,
      offenders
    };
  })()`);
}

async function screenshot(name, full = true) {
  if (full) {
    const layout = await send('Page.getLayoutMetrics');
    const size = layout.cssContentSize;
    await send('Emulation.setDeviceMetricsOverride', {
      width: Math.ceil(size.width),
      height: Math.ceil(size.height),
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: full,
    fromSurface: true
  });
  fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(shot.data, 'base64'));
}

await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');

const widths = [320, 375, 480, 768, 1024, 1280, 1360, 1440, 1920];
const layoutReport = [];
for (const width of widths) {
  await openAt(width, 900);
  const data = await metrics();
  layoutReport.push(data);
  if ([320, 375, 768, 1024, 1440].includes(width)) {
    await screenshot(`page-${width}`);
  }
}

const interactionReport = {};

await openAt(1440, 900);
interactionReport.initial = await evaluate(`(() => ({
  cards: document.querySelectorAll('.resource-card').length,
  taxonomy: document.querySelectorAll('.taxonomy-item').length,
  feed: document.querySelectorAll('.feed-item').length,
  status: document.getElementById('results-status').textContent,
  fonts: {
    geist: document.fonts.check('14px Geist'),
    mono: document.fonts.check('12px "JetBrains Mono"')
  }
}))()`);

interactionReport.search = await evaluate(`(() => {
  const input = document.getElementById('resource-search');
  input.value = 'deepseek';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  return {
    cards: document.querySelectorAll('.resource-card').length,
    name: document.querySelector('.resource-title')?.textContent,
    status: document.getElementById('results-status').textContent,
    filterBarVisible: !document.getElementById('filter-bar').hidden,
    clearVisible: !document.getElementById('search-clear').hidden
  };
})()`);

interactionReport.clearSearch = await evaluate(`(() => {
  document.getElementById('search-clear').click();
  return {
    cards: document.querySelectorAll('.resource-card').length,
    query: document.getElementById('resource-search').value,
    clearHidden: document.getElementById('search-clear').hidden
  };
})()`);

await evaluate(`document.querySelector('[data-view="table"]').click()`);
await evaluate(`document.getElementById('featured').scrollIntoView({ behavior: 'auto', block: 'start' })`);
await new Promise((resolve) => setTimeout(resolve, 250));
await screenshot('table-1440', false);

interactionReport.tableView = await evaluate(`(() => {
  return {
    rows: document.querySelectorAll('#resource-table-body tr').length,
    tableVisible: !document.getElementById('resource-table-wrap').hidden,
    gridHidden: document.getElementById('resource-grid').hidden,
    pressed: document.querySelector('[data-view="table"]').getAttribute('aria-pressed')
  };
})()`);

interactionReport.gridView = await evaluate(`(() => {
  document.querySelector('[data-view="grid"]').click();
  return {
    gridVisible: !document.getElementById('resource-grid').hidden,
    tableHidden: document.getElementById('resource-table-wrap').hidden,
    pressed: document.querySelector('[data-view="grid"]').getAttribute('aria-pressed')
  };
})()`);

interactionReport.details = await evaluate(`(() => {
  document.querySelector('[data-details="vllm"]').click();
  const dialog = document.getElementById('details-dialog');
  const title = document.getElementById('details-title');
  const external = dialog.querySelector('a[target="_blank"]');
  const result = {
    open: dialog.open,
    title: title?.textContent,
    externalHref: external?.getAttribute('href'),
    externalRel: external?.getAttribute('rel')
  };
  return result;
})()`);

await new Promise((resolve) => setTimeout(resolve, 250));
await screenshot('details-1440', false);
interactionReport.detailsClosed = await evaluate(`(() => {
  const dialog = document.getElementById('details-dialog');
  dialog.querySelector('[data-close-dialog]').click();
  return !dialog.open;
})()`);

interactionReport.preset = await evaluate(`(() => {
  Array.from(document.querySelectorAll('[data-preset]')).find((b) => b.dataset.preset.includes('mcp')).click();
  return {
    query: document.getElementById('resource-search').value,
    cards: document.querySelectorAll('.resource-card').length,
    empty: Boolean(document.querySelector('.empty-state')),
    status: document.getElementById('results-status').textContent
  };
})()`);

interactionReport.clearFilters = await evaluate(`(() => {
  document.querySelector('.empty-state [data-clear-filters]').click();
  return {
    cards: document.querySelectorAll('.resource-card').length,
    query: document.getElementById('resource-search').value
  };
})()`);

interactionReport.typeFilter = await evaluate(`(() => {
  document.querySelector('.type-card[data-filter-type="developer"]').click();
  return {
    cards: document.querySelectorAll('.resource-card').length,
    names: Array.from(document.querySelectorAll('.resource-title')).map((n) => n.textContent),
    filterBarVisible: !document.getElementById('filter-bar').hidden,
    activeNav: document.querySelector('[data-nav][aria-current="page"]')?.dataset.nav
  };
})()`);

interactionReport.facetFilter = await evaluate(`(() => {
  document.querySelector('.taxonomy-item[data-facet="mcp-agents"]').click();
  const result = {
    cards: document.querySelectorAll('.resource-card').length,
    empty: Boolean(document.querySelector('.empty-state')),
    typeFilterCleared: document.getElementById('filter-bar').textContent.includes('FACET')
  };
  document.getElementById('clear-filters').click();
  return result;
})()`);

interactionReport.shortcut = await evaluate(`(() => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
  return { activeId: document.activeElement?.id };
})()`);

interactionReport.submit = await evaluate(`(() => {
  document.querySelector('.header-cta').click();
  const dialog = document.getElementById('submit-dialog');
  const open = dialog.open;
  const form = document.getElementById('submit-form');
  document.getElementById('submit-name').value = 'Test Resource';
  document.getElementById('submit-url').value = 'https://example.com';
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  const status = document.getElementById('submit-status');
  const result = { open, statusVisible: !status.hidden, status: status.textContent };
  dialog.querySelector('[data-close-dialog]').click();
  return result;
})()`);

await openAt(375, 844);
interactionReport.mobile = await evaluate(`(() => {
  const toggle = document.getElementById('menu-toggle');
  toggle.click();
  const menu = document.getElementById('mobile-menu');
  const result = {
    expanded: toggle.getAttribute('aria-expanded'),
    menuVisible: !menu.hidden,
    menuLinks: menu.querySelectorAll('a').length
  };
  return result;
})()`);
await screenshot('menu-375', false);
await evaluate(`document.getElementById('menu-toggle').click()`);
interactionReport.mobileClosed = await evaluate(`({
  expanded: document.getElementById('menu-toggle').getAttribute('aria-expanded'),
  menuHidden: document.getElementById('mobile-menu').hidden
})`);

interactionReport.mobileMenuFilter = await evaluate(`(() => {
  const toggle = document.getElementById('menu-toggle');
  toggle.click();
  document.querySelector('#mobile-menu [data-filter-type="models"]').click();
  return {
    menuHidden: document.getElementById('mobile-menu').hidden,
    cards: document.querySelectorAll('.resource-card').length,
    names: Array.from(document.querySelectorAll('.resource-title')).map((n) => n.textContent)
  };
})()`);

interactionReport.consoleErrors = consoleErrors;
interactionReport.exceptions = exceptions;

fs.writeFileSync(`${OUT}/report.json`, JSON.stringify({ layoutReport, interactionReport }, null, 2));
console.log(JSON.stringify({ layoutReport, interactionReport }, null, 2));
ws.close();
