import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CDP_HTTP = 'http://127.0.0.1:9222';
const BASE_URL = process.env.WEBSITE43_BASE_URL || 'http://127.0.0.1:3100';
const OUTPUT_DIR = path.resolve('qa/website-43-preview-2026-09-03');
const VIEWPORTS = [
  { name: 'mobile-390', width: 390, height: 844, mobile: true },
  { name: 'intermediate-600', width: 600, height: 900, mobile: false },
  { name: 'tablet-820', width: 820, height: 1180, mobile: false },
  { name: 'intermediate-1100', width: 1100, height: 1000, mobile: false },
  { name: 'desktop-1440', width: 1440, height: 1000, mobile: false },
];
const ROUTES = [
  ['home', '/preview/website-4-3'],
  ['blog', '/preview/website-4-3/blog'],
  ['article', '/preview/website-4-3/blog/personal-finance/financial-pyramid'],
  ['fhc', '/preview/website-4-3/tools/financial-health-check'],
  ['ci', '/preview/website-4-3/ci-planning'],
  ['privacy', '/preview/website-4-3/privacy'],
  ['cookie', '/preview/website-4-3/cookie-policy'],
  ['not-found', '/preview/website-4-3/404'],
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function createTarget() {
  const response = await fetch(`${CDP_HTTP}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' });
  if (!response.ok) throw new Error(`Unable to create Chrome target: ${response.status}`);
  return response.json();
}
async function closeTarget(id) { await fetch(`${CDP_HTTP}/json/close/${id}`, { method: 'PUT' }).catch(() => undefined); }

class CDPClient {
  constructor(url) { this.url = url; this.ws = null; this.nextId = 1; this.pending = new Map(); this.listeners = new Map(); }
  async connect() {
    this.ws = new WebSocket(this.url);
    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id); if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message}`)); else pending.resolve(message.result ?? {});
        return;
      }
      for (const callback of this.listeners.get(message.method) ?? []) callback(message.params ?? {});
    });
    await new Promise((resolve, reject) => { this.ws.addEventListener('open', resolve, { once: true }); this.ws.addEventListener('error', reject, { once: true }); });
  }
  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject, method }); this.ws.send(JSON.stringify({ id, method, params })); });
  }
  once(method, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Timeout waiting for ${method}`)), timeoutMs);
      const callback = (params) => { clearTimeout(timeout); this.listeners.set(method, (this.listeners.get(method) ?? []).filter((item) => item !== callback)); resolve(params); };
      this.listeners.set(method, [...(this.listeners.get(method) ?? []), callback]);
    });
  }
  close() { this.ws?.close(); }
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Runtime evaluation failed');
  return result.result?.value;
}
async function setViewport(client, viewport) {
  await client.send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile, screenWidth: viewport.width, screenHeight: viewport.height, positionX: 0, positionY: 0, dontSetVisibleSize: false });
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: viewport.mobile, maxTouchPoints: viewport.mobile ? 5 : 1 });
}
async function navigate(client, url) {
  const loaded = client.once('Page.loadEventFired').catch(() => undefined);
  await client.send('Page.navigate', { url }); await loaded;
  await evaluate(client, `document.fonts?.ready?.then(() => true) ?? true`); await sleep(300);
}
async function screenshot(client, filePath) {
  await evaluate(client, 'window.scrollTo(0,0); true');
  const metrics = await client.send('Page.getLayoutMetrics');
  const size = metrics.cssContentSize ?? metrics.contentSize;
  const capture = await client.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: true, clip: { x: 0, y: 0, width: Math.ceil(size.width), height: Math.ceil(size.height), scale: 1 } });
  await writeFile(filePath, Buffer.from(capture.data, 'base64'));
  return { width: Math.ceil(size.width), height: Math.ceil(size.height) };
}

async function inspect(client, routeKey, viewport) {
  const base = await evaluate(client, `(() => {
    const doc = document.documentElement;
    const footer = document.querySelector('footer');
    const footerRect = footer?.getBoundingClientRect();
    const hamburger = document.querySelector('button[aria-label="เปิดเมนู"]');
    const hamburgerRect = hamburger?.getBoundingClientRect();
    const desktopNavLinks = [...document.querySelectorAll('nav[aria-label="เมนูหลัก"] a')].map(a => ({text:a.textContent?.trim(), rect:a.getBoundingClientRect().toJSON()}));
    return {
      innerWidth,
      clientWidth: doc.clientWidth,
      scrollWidth: doc.scrollWidth,
      scrollHeight: doc.scrollHeight,
      horizontalOverflow: doc.scrollWidth > doc.clientWidth + 1,
      footer: footerRect ? { top: footerRect.top + scrollY, bottom: footerRect.bottom + scrollY, height: footerRect.height } : null,
      hamburgerVisible: Boolean(hamburgerRect && hamburgerRect.width > 0 && getComputedStyle(hamburger).display !== 'none'),
      desktopNavLinks,
      bodyText: document.body.innerText,
    };
  })()`);
  const checks = [];
  const expect = (name, pass, details = '') => checks.push({ name, pass: Boolean(pass), details });
  expect('viewport width matches target', base.innerWidth === viewport.width, `${base.innerWidth} vs ${viewport.width}`);
  expect('no root horizontal overflow', !base.horizontalOverflow, `${base.scrollWidth} vs ${base.clientWidth}`);
  expect('footer rendered', Boolean(base.footer), JSON.stringify(base.footer));
  if (base.footer) expect('footer ends inside document', base.footer.bottom <= base.scrollHeight + 1, `${base.footer.bottom} vs ${base.scrollHeight}`);
  if (viewport.width < 1024) expect('responsive hamburger visible', base.hamburgerVisible);
  else expect('desktop nav visible', base.desktopNavLinks.length >= 3, JSON.stringify(base.desktopNavLinks));

  if (routeKey === 'home') {
    const home = await evaluate(client, `(() => {
      const portrait = document.querySelector('img[alt="CCPun"]');
      const stage = portrait?.parentElement;
      const sr = stage?.getBoundingClientRect();
      const pr = portrait?.getBoundingClientRect();
      const hero = document.querySelector('main section');
      const heroRect = hero?.getBoundingClientRect();
      const trustStripGone = !document.body.innerText.includes('วางแผนประกัน\\nวางแผนการลงทุน\\nวางแผนการเงิน');
      return { stage: sr && {w:sr.width,h:sr.height}, portrait: pr && {top:pr.top-(sr?.top||0),w:pr.width,h:pr.height}, heroHeight:heroRect?.height||0, trustStripGone };
    })()`);
    const expectedPortrait = viewport.width <= 639 ? 318 : viewport.width < 1024 ? 260 : 400;
    expect('Home removed Trust Strip', home.trustStripGone);
    expect('About portrait stage is square', home.stage && Math.abs(home.stage.w - home.stage.h) < 1, JSON.stringify(home.stage));
    if ([390,820,1440].includes(viewport.width)) expect('About portrait stage matches Figma target', home.stage && Math.abs(home.stage.w - expectedPortrait) < 1.5, JSON.stringify(home.stage));
    expect('Portrait subject is shifted down inside square', home.portrait && home.portrait.top >= 14, JSON.stringify(home.portrait));
    const targetHero = viewport.width <= 639 ? 740 : viewport.width < 1024 ? 820 : 800;
    if ([390,820,1440].includes(viewport.width)) expect('Home hero height matches Figma target', Math.abs(home.heroHeight-targetHero)<1.5, `${home.heroHeight} vs ${targetHero}`);
  }
  if (routeKey === 'blog') {
    const cards = await evaluate(client, `(() => {
      const all = [...document.querySelectorAll('a')].filter(a => a.querySelector('img[src*="blog-migration"]') && a.querySelector('h2'));
      return all.map(a => { const r=a.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}; });
    })()`);
    expect('Blog has five article cards', cards.length === 5, JSON.stringify(cards));
    if (cards.length === 5) {
      const maxY = Math.max(...cards.map(c=>Math.round(c.y)));
      const last = cards.filter(c=>Math.abs(Math.round(c.y)-maxY)<3);
      const minX = Math.min(...last.map(c=>c.x)); const maxRight = Math.max(...last.map(c=>c.x+c.w));
      const contentCenter = base.clientWidth/2; const rowCenter=(minX+maxRight)/2;
      expect('Blog orphan row visually centered', Math.abs(rowCenter-contentCenter) < 4, `${rowCenter} vs ${contentCenter}; ${JSON.stringify(last)}`);
    }
  }
  if (routeKey === 'article') {
    expect('Article has Figma title', base.bodyText.includes('พีระมิดทางการเงิน คืออะไร? วางรากฐานก่อนลงทุน'));
    expect('Article key quote present', base.bodyText.includes('ฐานที่ดีไม่ได้ทำให้คุณรวยช้าลง'));
  }
  if (routeKey === 'fhc') expect('FHC live calculator reused', base.bodyText.includes('เครื่องคำนวณทุนประกันชีวิต') && base.bodyText.includes('ค่าใช้จ่ายครัวเรือนต่อเดือนที่ยังต้องดูแล'));
  if (routeKey === 'ci') expect('CI live calculator reused', base.bodyText.includes('2 ขั้นตอน เพื่อเห็นส่วนต่างที่ต้องเตรียม') && base.bodyText.includes('รายได้ต่อเดือน'));
  if (routeKey === 'privacy') expect('Privacy has all nine sections', base.bodyText.includes('9. ติดต่อเราและการเปลี่ยนแปลง'));
  if (routeKey === 'cookie') {
    expect('Cookie policy has four public categories', ['คุกกี้ที่จำเป็น','คุกกี้วิเคราะห์','คุกกี้ฟังก์ชัน','คุกกี้การตลาด'].every(v=>base.bodyText.includes(v)));
    expect('Non-public cookie design specs are not rendered', !base.bodyText.includes('ตัวอย่างหน้าต่างการตั้งค่าคุกกี้'));
  }
  if (routeKey === 'not-found') expect('404 recovery copy matches Figma', base.bodyText.includes('ไม่พบหน้าที่คุณกำลังหา') && base.bodyText.includes('ดูบทความ'));
  return { checks, metrics: base };
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const target = await createTarget(); const client = new CDPClient(target.webSocketDebuggerUrl);
  const report = { generatedAt:new Date().toISOString(), baseUrl:BASE_URL, viewports:{}, summary:{passed:0,failed:0} };
  try {
    await client.connect(); await client.send('Page.enable'); await client.send('Runtime.enable'); await client.send('Network.enable');
    for (const viewport of VIEWPORTS) {
      await setViewport(client, viewport); const vr={routes:{}}; report.viewports[viewport.name]=vr;
      for (const [routeKey, routePath] of ROUTES) {
        await navigate(client, `${BASE_URL}${routePath}`);
        const inspected=await inspect(client,routeKey,viewport);
        const file=path.join(OUTPUT_DIR,`${routeKey}-${viewport.name}.png`); const image=await screenshot(client,file);
        vr.routes[routeKey]={...inspected,screenshot:path.relative(process.cwd(),file),image};
        for(const check of inspected.checks){ if(check.pass)report.summary.passed++; else report.summary.failed++; }
      }
    }
    await writeFile(path.join(OUTPUT_DIR,'report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report.summary));
    if(report.summary.failed) process.exitCode=1;
  } finally { client.close(); await closeTarget(target.id); }
}
main().catch((error)=>{console.error(error.stack||error.message||error);process.exitCode=1;});
