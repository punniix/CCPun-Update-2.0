const CDP_HTTP = process.env.CDP_HTTP ?? 'http://127.0.0.1:9343';
const BASE_URL = process.env.TRACKING_BASE_URL ?? 'http://127.0.0.1:3006';
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '';

if (!/^G-[A-Z0-9]+$/.test(GA_ID) || !/^\d{5,20}$/.test(META_PIXEL_ID)) {
  throw new Error('Set valid NEXT_PUBLIC_GA_ID and NEXT_PUBLIC_META_PIXEL_ID for this QA run.');
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const checks = [];

function expect(name, pass, detail = '') {
  checks.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
}

class CDPClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.url);
    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result ?? {});
        return;
      }
      for (const listener of this.listeners.get(message.method) ?? []) listener(message.params ?? {});
    });
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  once(method, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Timeout waiting for ${method}`)), timeoutMs);
      const listener = (params) => {
        clearTimeout(timeout);
        this.listeners.set(method, (this.listeners.get(method) ?? []).filter((item) => item !== listener));
        resolve(params);
      };
      this.listeners.set(method, [...(this.listeners.get(method) ?? []), listener]);
    });
  }

  close() { this.ws?.close(); }
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result?.value;
}

async function navigate(client, path) {
  const loaded = client.once('Page.loadEventFired').catch(() => undefined);
  await client.send('Page.navigate', { url: `${BASE_URL}${path}` });
  await loaded;
  await sleep(1000);
}

async function inspect(client) {
  return evaluate(client, `(() => {
    const normalize = (row) => Array.from(row ?? []);
    const dataLayer = (window.dataLayer ?? []).map(normalize);
    const fbq = (window.fbq?.queue ?? []).map(normalize);
    return {
      gaScripts: [...document.querySelectorAll('#ga-script')].map((item) => item.src),
      metaScripts: [...document.querySelectorAll('#meta-pixel-script')].map((item) => item.src),
      dataLayer,
      fbq,
      consent: localStorage.getItem('ccpun_cookie_consent'),
      trackingResources: performance.getEntriesByType('resource').map((entry) => entry.name)
        .filter((name) => /google-analytics|googletagmanager|facebook|fbevents/.test(name)),
      trackingCookies: document.cookie.split(';').map((item) => item.trim().split('=')[0])
        .filter((name) => name.startsWith('_ga') || name.startsWith('_fb')),
    };
  })()`);
}

const target = await fetch(`${CDP_HTTP}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' }).then((response) => response.json());
const client = new CDPClient(target.webSocketDebuggerUrl);

try {
  await client.connect();
  await Promise.all([client.send('Page.enable'), client.send('Runtime.enable'), client.send('Network.enable')]);
  await client.send('Storage.clearDataForOrigin', { origin: new URL(BASE_URL).origin, storageTypes: 'all' });
  await client.send('Network.clearBrowserCookies');
  // ponytail: block provider endpoints; this validates browser behavior without polluting real analytics.
  await client.send('Network.setBlockedURLs', { urls: [
    '*://*.google-analytics.com/*', '*://*.googletagmanager.com/*',
    '*://*.facebook.com/tr*', '*://connect.facebook.net/*',
  ] });

  await navigate(client, '/ci-planning/');
  let state = await inspect(client);
  expect('pre-consent stores no preference', state.consent === null);
  expect('pre-consent loads no GA script', state.gaScripts.length === 0);
  expect('pre-consent loads no Meta script', state.metaScripts.length === 0);
  expect('pre-consent creates no tracking cookie', state.trackingCookies.length === 0);

  await evaluate(client, `(() => {
    localStorage.setItem('ccpun_cookie_consent', JSON.stringify({status:'accepted_all',essential:true,performance:true,analytics:true,social:true,timestamp:new Date().toISOString(),expires:Date.now()+86400000}));
    window.dispatchEvent(new CustomEvent('ccpun:consent', {detail:'accepted'}));
    return true;
  })()`);
  await sleep(500);
  state = await inspect(client);
  expect('accepted consent loads one GA script', state.gaScripts.length === 1);
  expect('accepted consent uses expected GA property', state.gaScripts[0]?.includes(GA_ID), state.gaScripts[0] ?? '');
  expect('accepted consent loads one Meta script', state.metaScripts.length === 1);
  expect('Meta initializes expected dataset', state.fbq.some((row) => row[0] === 'init' && row[1] === META_PIXEL_ID));
  expect('CI PageView fires once', state.fbq.filter((row) => row[0] === 'track' && row[1] === 'PageView').length === 1);
  expect('CI ViewContent fires once', state.fbq.filter((row) => row[0] === 'track' && row[1] === 'ViewContent').length === 1);
  expect('GA config is queued once', state.dataLayer.filter((row) => row[0] === 'config' && row[1] === GA_ID).length === 1);

  await evaluate(client, `window.dispatchEvent(new CustomEvent('ccpun:consent', {detail:'accepted'})); true`);
  await sleep(250);
  state = await inspect(client);
  expect('repeat consent does not duplicate GA script', state.gaScripts.length === 1);
  expect('repeat consent does not duplicate Meta script', state.metaScripts.length === 1);
  expect('repeat consent does not duplicate CI PageView', state.fbq.filter((row) => row[0] === 'track' && row[1] === 'PageView').length === 1);

  await evaluate(client, `(() => {
    localStorage.setItem('ccpun_cookie_consent', JSON.stringify({status:'custom',essential:true,performance:false,analytics:false,social:false,timestamp:new Date().toISOString(),expires:Date.now()+86400000}));
    window.dispatchEvent(new CustomEvent('ccpun:consent', {detail:'rejected'}));
    return true;
  })()`);
  await sleep(250);
  state = await inspect(client);
  expect('reject removes GA script', state.gaScripts.length === 0);
  expect('reject removes Meta script', state.metaScripts.length === 0);
  expect(
    'blocked QA sends no analytics hit',
    !state.trackingResources.some((url) => /google-analytics|facebook\.com\/tr/.test(url)),
    JSON.stringify(state.trackingResources),
  );
  expect('reject leaves no tracking cookie', state.trackingCookies.length === 0);
} finally {
  client.close();
  await fetch(`${CDP_HTTP}/json/close/${target.id}`, { method: 'PUT' }).catch(() => undefined);
}

const failed = checks.filter((check) => !check.pass);
console.log(`\nTracking consent QA: ${checks.length - failed.length}/${checks.length} PASS`);
if (failed.length) process.exitCode = 1;
