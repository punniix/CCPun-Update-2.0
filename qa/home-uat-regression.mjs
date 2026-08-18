import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CDP_HTTP = process.env.CDP_HTTP ?? 'http://127.0.0.1:9222';
const BASE_URL = process.env.UAT_BASE_URL ?? 'http://127.0.0.1:3015';
const OUTPUT_DIR = path.resolve('qa/home-uat-latest');
const VIEWPORTS = [
  { name: '320', width: 320, height: 720, mobile: true },
  { name: '375', width: 375, height: 812, mobile: true },
  { name: '390', width: 390, height: 844, mobile: true },
  { name: '414', width: 414, height: 896, mobile: true },
  { name: '820', width: 820, height: 1180, mobile: false },
  { name: '1024', width: 1024, height: 900, mobile: false },
  { name: '1440', width: 1440, height: 1000, mobile: false },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
    this.ws = null;
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

  once(method, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Timeout waiting for ${method}`)), timeoutMs);
      const callback = (params) => {
        clearTimeout(timeout);
        this.listeners.set(method, (this.listeners.get(method) ?? []).filter((item) => item !== callback));
        resolve(params);
      };
      const callbacks = this.listeners.get(method) ?? [];
      callbacks.push(callback);
      this.listeners.set(method, callbacks);
    });
  }

  close() {
    this.ws?.close();
  }
}

async function evaluate(client, expression) {
  const response = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text || 'Runtime evaluation failed');
  }
  return response.result?.value;
}

async function setViewport(client, viewport) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile,
    screenWidth: viewport.width,
    screenHeight: viewport.height,
    dontSetVisibleSize: false,
  });
  await client.send('Emulation.setTouchEmulationEnabled', {
    enabled: viewport.mobile,
    maxTouchPoints: viewport.mobile ? 5 : 1,
  });
}

async function navigate(client, url) {
  const loaded = client.once('Page.loadEventFired').catch(() => undefined);
  await client.send('Page.navigate', { url });
  await loaded;
  await evaluate(client, `document.fonts?.ready?.then(() => true) ?? true`);
  await sleep(900);
}

async function captureFullPage(client, filePath) {
  await evaluate(client, `window.scrollTo(0, 0); true`);
  const metrics = await client.send('Page.getLayoutMetrics');
  const size = metrics.cssContentSize ?? metrics.contentSize;
  const screenshot = await client.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: Math.ceil(size.width), height: Math.ceil(size.height), scale: 1 },
  });
  await writeFile(filePath, Buffer.from(screenshot.data, 'base64'));
}

async function inspect(client) {
  return evaluate(client, `(() => {
    const visible = (element) => Boolean(element && getComputedStyle(element).display !== 'none' && getComputedStyle(element).visibility !== 'hidden' && element.getBoundingClientRect().height > 0);
    const rect = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    };
    const hero = document.querySelector('[data-uat-section="hero"]');
    const heroCopy = document.querySelector('[data-uat-role="hero-copy"]');
    const portrait = document.querySelector('[data-uat-role="hero-portrait"]');
    const heroHeading = document.querySelector('[data-uat-section="hero"] h1');
    const routes = [...document.querySelectorAll('[data-uat-role="hero-routes"] > ul > li')].filter(visible);
    const heroGold = hero ? [...hero.querySelectorAll('.gold-button')].filter(visible) : [];
    const heroActions = [...document.querySelectorAll('[data-uat-role="hero-actions"] a')].filter(visible);
    const finalCta = document.querySelector('.uat-contact-cta');
    const testimonialCards = [...document.querySelectorAll('[data-uat-section="testimonials"] blockquote')];
    const storyImages = (selector) => [...document.querySelectorAll(selector)].map((wrapper) => ({
      width: wrapper.getBoundingClientRect().width,
      src: wrapper.querySelector('img')?.getAttribute('src') ?? '',
    }));
    const navGoldLabels = [...document.querySelectorAll('nav .gold-button')].map((item) => item.textContent.trim());
    const bodyText = document.body.innerText;
    const trackingResources = [...performance.getEntriesByType('resource')]
      .map((entry) => entry.name)
      .filter((name) => ['google-analytics.com', 'googletagmanager.com/gtag', 'connect.facebook.net/en_US/fbevents.js', 'facebook.com/tr'].some((token) => name.includes(token)));
    const metaRobots = document.querySelector('meta[name="robots"]')?.content ?? '';
    return {
      h1Count: document.querySelectorAll('h1').length,
      h1Text: document.querySelector('h1')?.innerText.replace(/\\s+/g, ' ').trim() ?? '',
      viewportWidth: innerWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      hero: rect('[data-uat-section="hero"]'),
      heroCopy: rect('[data-uat-role="hero-copy"]'),
      portrait: rect('[data-uat-role="hero-portrait"]'),
      portraitImageSrc: portrait?.querySelector('img')?.getAttribute('src') ?? '',
      heroHeadingFontSize: heroHeading ? Number.parseFloat(getComputedStyle(heroHeading).fontSize) : 0,
      routeCount: routes.length,
      routeText: routes.map((item) => item.innerText.replace(/\\s+/g, ' ').trim()),
      routeLinks: routes.map((item) => {
        const link = item.querySelector('a');
        const style = link ? getComputedStyle(link) : null;
        return {
          height: link?.getBoundingClientRect().height ?? 0,
          radius: style ? Number.parseFloat(style.borderRadius) : -1,
          text: link?.innerText.replace(/\\s+/g, ' ').trim() ?? '',
        };
      }),
      heroGoldCount: heroGold.length,
      heroActions: heroActions.map((item) => ({ text: item.textContent.trim(), height: item.getBoundingClientRect().height })),
      duplicateToolsCount: [...document.querySelectorAll('section[aria-label="เครื่องมือวางแผนการเงิน"]')].filter(visible).length,
      hasDuplicateConversation: bodyText.includes('คุยกับปั้น'),
      hasArticleRoute: bodyText.includes('บทความแนะนำ'),
      finalHeading: document.querySelector('[data-uat-section="contact"] h2')?.textContent?.trim() ?? '',
      finalCopy: document.querySelector('[data-uat-section="contact"] h2 + p')?.textContent?.replace(/\\s+/g, ' ').trim() ?? '',
      finalCta: finalCta?.textContent?.replace(/\\s+/g, ' ').trim() ?? '',
      finalCtaColor: finalCta ? getComputedStyle(finalCta).backgroundColor : '',
      finalCtaHasArrow: Boolean(finalCta?.querySelector('.lucide-arrow-up-right')),
      hasLineNewTabNote: bodyText.includes('ระบบจะเปิด LINE Official Account ในแท็บใหม่'),
      painPointIconCount: document.querySelectorAll('[data-uat-section="pain-points"] svg').length,
      painStoryImages: storyImages('[data-uat-role="pain-story-image"]'),
      painRows: [...document.querySelectorAll('[data-uat-section="pain-points"] ol > li')].map((row) => ({
        imageX: row.querySelector('[data-uat-role="pain-story-image"]')?.getBoundingClientRect().x ?? -1,
        textX: row.querySelector('[data-uat-role="pain-story-image"] + div')?.getBoundingClientRect().x ?? -1,
      })),
      planningStoryImages: storyImages('[data-uat-role="planning-story-image"]'),
      planningIconCount: document.querySelectorAll('[data-uat-role="planning-icon"] svg').length,
      aboutImageSrc: document.querySelector('[data-uat-section="about"] img')?.getAttribute('src') ?? '',
      activityHeading: document.querySelector('[data-uat-section="credentials"] h2')?.textContent?.trim() ?? '',
      partnerCount: document.querySelectorAll('[data-uat-section="partners"] h3').length,
      hasEvidenceLabel: bodyText.includes('หลักฐานที่ตรวจสอบได้'),
      testimonialFrames: testimonialCards.map((card) => {
        const style = getComputedStyle(card);
        return { border: style.borderTopWidth, radius: Number.parseFloat(style.borderRadius) };
      }),
      navGoldLabels,
      metaRobots,
      trackingResources,
      heroExists: Boolean(hero),
      heroCopyExists: Boolean(heroCopy),
      portraitExists: Boolean(portrait),
    };
  })()`);
}

function runChecks(data, viewport) {
  const checks = [];
  const expect = (name, pass, detail = '') => checks.push({ name, pass: Boolean(pass), detail });
  expect('viewport width', data.viewportWidth === viewport.width, `${data.viewportWidth}/${viewport.width}`);
  expect('one H1', data.h1Count === 1, String(data.h1Count));
  expect('approved H1', data.h1Text === 'ปิดความเสี่ยงการเงินของคุณ เปิดความมั่งคั่งผ่านแผนการลงทุน', data.h1Text);
  expect('hero contract present', data.heroExists && data.heroCopyExists && data.portraitExists);
  expect('no horizontal overflow', data.scrollWidth <= data.clientWidth + 1, `${data.scrollWidth}/${data.clientWidth}`);
  expect('two hero routes', data.routeCount === 2, JSON.stringify(data.routeText));
  expect('FHC hero route present', data.routeText.some((text) => text.includes('คำนวณทุนชีวิตที่ครอบครัวควรมี')));
  expect('CI hero route present', data.routeText.some((text) => text.includes('เตรียมเงินก้อนรับมือโรคร้ายแรง')));
  expect('flat editorial hero routes', data.routeLinks.length === 2 && data.routeLinks.every((route) => route.radius <= 1) && data.routeLinks[0].text.includes('01') && data.routeLinks[1].text.includes('02'), JSON.stringify(data.routeLinks));
  expect('hero route touch targets', data.routeLinks.every((route) => route.height >= 44 && route.height <= 100), JSON.stringify(data.routeLinks));
  expect('duplicate tools removed', data.duplicateToolsCount === 0, String(data.duplicateToolsCount));
  expect('duplicate conversation CTA removed', !data.hasDuplicateConversation);
  expect('article route removed', !data.hasArticleRoute);
  expect('no duplicate calculator hero CTA', data.heroGoldCount === 0, String(data.heroGoldCount));
  expect('one prominent LINE hero action', data.heroActions.length === 1 && data.heroActions[0].text.includes('LINE @ccpun') && data.heroActions[0].height >= 44, JSON.stringify(data.heroActions));
  expect('enhanced Mac portrait active', data.portraitImageSrc.includes('hero-pun-laptop-v3'), data.portraitImageSrc);
  expect('full-bleed hero image layer', data.hero && data.portrait && Math.abs(data.hero.x - data.portrait.x) <= 1 && Math.abs(data.hero.y - data.portrait.y) <= 1 && Math.abs(data.hero.width - data.portrait.width) <= 1 && Math.abs(data.hero.height - data.portrait.height) <= 1, JSON.stringify({ hero: data.hero, portrait: data.portrait }));
  expect('balanced hero heading scale', data.heroHeadingFontSize >= 32 && data.heroHeadingFontSize <= 54, String(data.heroHeadingFontSize));
  expect('pain points use text narrative without icons', data.painPointIconCount === 0, String(data.painPointIconCount));
  expect('five clear pain story images', data.painStoryImages.length === 5 && data.painStoryImages.every((image) => image.src.includes('home-stories%2Fpain-')), JSON.stringify(data.painStoryImages));
  expect('pain stories alternate at desktop width', viewport.width < 768 || data.painRows.every((row, index) => index % 2 === 0 ? row.imageX < row.textX : row.imageX > row.textX), JSON.stringify(data.painRows));
  expect('planning uses four icons without repeated images', data.planningIconCount === 4 && data.planningStoryImages.length === 0, JSON.stringify({ icons: data.planningIconCount, images: data.planningStoryImages }));
  expect('uploaded About portrait active', data.aboutImageSrc.includes('about-pun-arms-crossed-v1'), data.aboutImageSrc);
  expect('activity section renamed', data.activityHeading === 'กิจกรรมที่เข้าร่วม', data.activityHeading);
  expect('partner section separated', data.partnerCount === 4, String(data.partnerCount));
  expect('evidence label removed', !data.hasEvidenceLabel);
  expect('testimonial frames match', data.testimonialFrames.length === 2 && data.testimonialFrames.every((frame) => frame.border !== '0px' && frame.radius >= 16), JSON.stringify(data.testimonialFrames));
  expect('final heading refined', data.finalHeading === 'เริ่มต้นพูดคุยกับ CCPun', data.finalHeading);
  expect('final support copy refined', data.finalCopy === 'เล่าปัญหาการเงินที่คุณกังวล แล้วจัดทำแผนการเงินที่เหมาะสมกับคุณโดยเฉพาะ', data.finalCopy);
  expect('final LINE CTA refined', data.finalCta === 'คุยกับ CCPun ทาง LINE OA', data.finalCta);
  expect('final LINE CTA is green without arrow', data.finalCtaColor.includes('6, 199, 85') && !data.finalCtaHasArrow, `${data.finalCtaColor}/${data.finalCtaHasArrow}`);
  expect('LINE new-tab note removed', !data.hasLineNewTabNote);
  expect('navbar contact wording', data.navGoldLabels.length >= 1 && data.navGoldLabels.every((label) => label === 'ติดต่อเรา'), JSON.stringify(data.navGoldLabels));
  expect('preview meta noindex', data.metaRobots.includes('noindex'), data.metaRobots);
  expect('no production analytics', data.trackingResources.length === 0, JSON.stringify(data.trackingResources));
  return checks;
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const target = await createTarget();
  const client = new CDPClient(target.webSocketDebuggerUrl);
  const report = { generatedAt: new Date().toISOString(), baseUrl: BASE_URL, viewports: {}, summary: { passed: 0, failed: 0 } };

  try {
    await client.connect();
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    for (const viewport of VIEWPORTS) {
      await setViewport(client, viewport);
      await navigate(client, `${BASE_URL}/?home-qa=${viewport.name}&t=${Date.now()}`);
      const data = await inspect(client);
      const checks = runChecks(data, viewport);
      const screenshot = path.join(OUTPUT_DIR, `home-${viewport.name}.png`);
      await captureFullPage(client, screenshot);
      report.viewports[viewport.name] = { data, checks, screenshot };
      for (const check of checks) {
        if (check.pass) report.summary.passed++;
        else report.summary.failed++;
      }
    }
    await writeFile(path.join(OUTPUT_DIR, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report.summary));
    if (report.summary.failed) process.exitCode = 1;
  } finally {
    client.close();
    await closeTarget(target.id);
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
