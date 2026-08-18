import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@sanity/client';

const CDP_HTTP = 'http://127.0.0.1:9222';
const BASE_URL = process.env.UAT_BASE_URL || 'http://localhost:3001';
const OUTPUT_DIR = path.resolve('qa/blog-uat');
const ARTICLE_PATH = '/blog/uat-article-system/';
const VIEWPORTS = [
  { name: 'mobile-320', width: 320, height: 568, mobile: true },
  { name: 'mobile-375', width: 375, height: 812, mobile: true },
  { name: 'mobile-390', width: 390, height: 844, mobile: true },
  { name: 'mobile-414', width: 414, height: 896, mobile: true },
  { name: 'tablet-820', width: 820, height: 1180, mobile: false },
  { name: 'tablet-1024', width: 1024, height: 1366, mobile: false },
  { name: 'desktop-1440', width: 1440, height: 1000, mobile: false },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function createSecurePreviewUrl() {
  if (process.env.BLOG_UAT_PREVIEW_URL) return process.env.BLOG_UAT_PREVIEW_URL;

  const projectId = process.env.SANITY_API_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_API_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET;
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!projectId || !dataset || !token) throw new Error('Sanity UAT env is required for secure Draft Mode QA');

  const base = new URL(BASE_URL);
  if (process.env.VERCEL_ENV === 'production' || !(base.hostname === 'localhost' || base.hostname === '127.0.0.1' || base.hostname.endsWith('.vercel.app'))) {
    throw new Error(`Refusing Draft Mode QA outside localhost or Vercel Preview: ${base.hostname}`);
  }

  // ponytail: use Sanity's installed secret generator; replace only if it gains a public package export.
  let secret;
  try {
    const { createPreviewSecret } = await import('../node_modules/sanity/node_modules/@sanity/preview-url-secret/dist/create-secret.js');
    const client = createClient({ projectId, dataset, token, apiVersion: '2026-08-18', useCdn: false });
    ({ secret } = await createPreviewSecret(client, 'ccpun/uat-qa', new URL('/studio/', BASE_URL).href));
  } catch {
    throw new Error('Sanity secure preview setup failed; request details redacted');
  }
  const url = new URL('/api/preview/enable', BASE_URL);
  url.searchParams.set('sanity-preview-secret', secret);
  url.searchParams.set('sanity-preview-pathname', ARTICLE_PATH);
  return url.href;
}

async function createTarget() {
  const response = await fetch(`${CDP_HTTP}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' });
  if (!response.ok) throw new Error(`Unable to create Chrome target: ${response.status}`);
  return response.json();
}

async function closeTarget(id) {
  await fetch(`${CDP_HTTP}/json/close/${id}`, { method: 'PUT' }).catch(() => undefined);
}

class CDPClient {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
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
        if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message}`));
        else pending.resolve(message.result ?? {});
        return;
      }
      for (const callback of this.listeners.get(message.method) ?? []) callback(message.params ?? {});
    });
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
  }
  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  once(method, timeoutMs = 15000) {
    return new Promise((resolve) => {
      const callback = (params) => {
        clearTimeout(timeout);
        this.listeners.set(method, (this.listeners.get(method) ?? []).filter((item) => item !== callback));
        resolve(params);
      };
      const timeout = setTimeout(() => {
        this.listeners.set(method, (this.listeners.get(method) ?? []).filter((item) => item !== callback));
        resolve(undefined);
      }, timeoutMs);
      this.listeners.set(method, [...(this.listeners.get(method) ?? []), callback]);
    });
  }
  close() { this.ws?.close(); }
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed');
  return result.result?.value;
}

async function navigate(client, url) {
  const loaded = client.once('Page.loadEventFired');
  await client.send('Page.navigate', { url });
  await loaded;
  await evaluate(client, `document.fonts?.ready?.then(() => true) ?? true`);
  await sleep(250);
}

async function setViewport(client, viewport) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile,
    screenWidth: viewport.width, screenHeight: viewport.height, dontSetVisibleSize: false,
  });
}

async function screenshot(client, filename) {
  const metrics = await client.send('Page.getLayoutMetrics');
  const size = metrics.cssContentSize ?? metrics.contentSize;
  const shot = await client.send('Page.captureScreenshot', {
    format: 'png', captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: Math.ceil(size.width), height: Math.ceil(size.height), scale: 1 },
  });
  await writeFile(path.join(OUTPUT_DIR, filename), Buffer.from(shot.data, 'base64'));
}

await mkdir(OUTPUT_DIR, { recursive: true });
const target = await createTarget();
const client = new CDPClient(target.webSocketDebuggerUrl);
const report = { generatedAt: new Date().toISOString(), baseUrl: BASE_URL, viewports: {}, summary: { passed: 0, failed: 0 } };

try {
  await client.connect();
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Network.enable');

  const rejectedPreview = await fetch(`${BASE_URL}/api/preview/enable/`, { redirect: 'manual' });
  const rejectedPreviewCheck = {
    name: 'unauthenticated preview handshake is rejected',
    pass: rejectedPreview.status === 401,
    details: `HTTP ${rejectedPreview.status}`,
  };
  if (rejectedPreviewCheck.pass) report.summary.passed++;
  else report.summary.failed++;
  report.previewSecurity = { checks: [rejectedPreviewCheck] };

  await navigate(client, await createSecurePreviewUrl());

  for (const viewport of VIEWPORTS) {
    await setViewport(client, viewport);
    await navigate(client, `${BASE_URL}/blog/`);
    const hubState = await evaluate(client, `(() => {
      const hero = document.querySelector('.blog-hub-hero');
      const image = document.querySelector('[data-uat-role="blog-hub-background"] img');
      return {
        h1: document.querySelector('h1')?.textContent?.trim() || '',
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        imageLoaded: Boolean(image?.complete && image?.naturalWidth > 0),
        imageSource: image?.currentSrc || image?.src || '',
        heroHeight: hero?.getBoundingClientRect().height || 0,
      };
    })()`);
    const hubChecks = [
      { name: 'Blog hub H1 remains present', pass: hubState.h1 === 'บทความ' },
      { name: 'Blog hub has no horizontal overflow', pass: !hubState.overflow },
      { name: 'CCPun finance hero image loads', pass: hubState.imageLoaded && hubState.imageSource.includes('blog-hub-hero-ccpun-v1') },
      { name: 'Blog hub hero retains responsive height', pass: hubState.heroHeight >= 304, details: `${Math.round(hubState.heroHeight)}px` },
    ];
    for (const check of hubChecks) {
      if (check.pass) report.summary.passed++;
      else report.summary.failed++;
    }
    await screenshot(client, `index-${viewport.name}.png`);

    const controls = await evaluate(client, `({
      categoryButtons: document.querySelectorAll('[data-blog-category]').length,
      searchInput: Boolean(document.querySelector('#blog-search')),
      searchButton: Boolean(document.querySelector('form[role="search"] button[type="submit"]')),
    })`);
    await evaluate(client, `document.querySelector('[data-blog-category="การเงินส่วนบุคคล"]')?.click()`);
    await sleep(100);
    const categoryState = await evaluate(client, `({
      url: location.href,
      active: document.querySelector('[data-blog-category="การเงินส่วนบุคคล"]')?.getAttribute('aria-pressed'),
      resultCount: document.querySelectorAll('.blog-archive-grid article').length,
    })`);
    await evaluate(client, `document.querySelector('[data-blog-category="all"]')?.click()`);
    await sleep(100);
    await evaluate(client, `(() => {
      const input = document.querySelector('#blog-search');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(input, 'zzzz-no-article-uat');
      input?.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await sleep(100);
    const emptyState = await evaluate(client, `document.body.innerText.includes('ไม่พบบทความที่ตรงกับตัวกรอง')`);
    await evaluate(client, `(() => {
      const input = document.querySelector('#blog-search');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(input, 'Sanity Draft CMS');
      input?.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await sleep(100);
    const searchState = await evaluate(client, `({
      url: location.href,
      value: document.querySelector('#blog-search')?.value || '',
      result: document.body.innerText.includes('ตัวอย่างบทความ UAT — Sanity Draft CMS'),
    })`);
    const interactionChecks = [
      { name: 'five category filters and search controls are interactive', pass: controls.categoryButtons === 5 && controls.searchInput && controls.searchButton },
      { name: 'category click updates active state and shareable URL', pass: categoryState.active === 'true' && categoryState.url.includes('category=') },
      { name: 'category filter returns imported CMS drafts', pass: categoryState.resultCount > 0, details: `${categoryState.resultCount} articles` },
      { name: 'empty search state gives useful feedback', pass: emptyState },
      { name: 'search filters CMS articles and updates shareable URL', pass: searchState.value === 'Sanity Draft CMS' && searchState.result && searchState.url.includes('q=Sanity+Draft+CMS') },
    ];
    for (const check of interactionChecks) {
      if (check.pass) report.summary.passed++;
      else report.summary.failed++;
    }

    await navigate(client, `${BASE_URL}${ARTICLE_PATH}`);
    const state = await evaluate(client, `(() => ({
      viewport: window.innerWidth,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      h1: document.querySelector('h1')?.textContent?.trim() || '',
      robots: document.querySelector('meta[name="robots"]')?.content || '',
      canonical: document.querySelector('link[rel="canonical"]')?.href || '',
      navbar: Boolean(document.querySelector('nav')),
      footer: Boolean(document.querySelector('footer')),
      draftBadge: document.body.innerText.includes('Draft UAT · noindex'),
      articleWidth: document.querySelector('.blog-content')?.getBoundingClientRect().width || 0,
      bodyFont: getComputedStyle(document.body).fontFamily,
      faqVisible: document.body.innerText.includes('คำถามที่พบบ่อย') && document.querySelectorAll('section details').length >= 2,
      articleSchemaPresent: [...document.querySelectorAll('script[type="application/ld+json"]')].some((script) => {
        const text = script.textContent || '';
        return text.includes('BlogPosting') || text.includes('#article') || text.includes('#faq');
      }),
    }))()`);

    const checks = [
      { name: 'viewport width matches', pass: Math.abs(state.viewport - viewport.width) <= 1, details: `${state.viewport} vs ${viewport.width}` },
      { name: 'no horizontal overflow', pass: !state.overflow },
      { name: 'Sanity draft H1 present', pass: state.h1.includes('Sanity Draft CMS') },
      { name: 'draft is noindex,nofollow', pass: state.robots.includes('noindex') && state.robots.includes('nofollow') },
      { name: 'canonical uses final CCPun path', pass: state.canonical === 'https://ccpun.com/blog/uat-article-system/' },
      { name: 'shared navbar present', pass: state.navbar },
      { name: 'shared footer present', pass: state.footer },
      { name: 'draft badge visible', pass: state.draftBadge },
      { name: 'article measure stays readable', pass: state.articleWidth > 0 && state.articleWidth <= 768, details: `${Math.round(state.articleWidth)}px` },
      { name: 'Kanit remains primary font', pass: state.bodyFont.toLowerCase().includes('kanit'), details: state.bodyFont },
      { name: 'visible FAQ renders from content model', pass: state.faqVisible },
      { name: 'draft emits no article structured data', pass: !state.articleSchemaPresent },
    ];

    for (const check of checks) {
      if (check.pass) report.summary.passed++;
      else report.summary.failed++;
    }
    report.viewports[viewport.name] = { hubChecks, interactionChecks, checks };
    await screenshot(client, `article-${viewport.name}.png`);
  }

  await navigate(client, `${BASE_URL}/api/preview/disable`);
  await navigate(client, `${BASE_URL}${ARTICLE_PATH}`);
  const disabled = await evaluate(client, `({title: document.title, robots: document.querySelector('meta[name="robots"]')?.content || ''})`);
  const disableChecks = [
    { name: 'draft disappears after preview disabled', pass: disabled.title.includes('ไม่พบหน้า') },
    { name: 'not-found remains noindex', pass: disabled.robots.includes('noindex') },
  ];
  for (const check of disableChecks) {
    if (check.pass) report.summary.passed++;
    else report.summary.failed++;
  }
  report.previewDisabled = { checks: disableChecks };

  await writeFile(path.join(OUTPUT_DIR, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary));
  if (report.summary.failed > 0) process.exitCode = 1;
} finally {
  client.close();
  await closeTarget(target.id);
}
