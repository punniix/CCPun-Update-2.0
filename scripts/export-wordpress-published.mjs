import { readFile, writeFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import path from 'node:path';

const outPath = process.argv[2] || path.resolve('../UAT-Reports/Published-Blog-Migration-2026-08-19/published-wordpress-export.json');
const focusEvidencePath = process.argv[3];

const posts = [
  { wpId: 413, slug: 'aia-vitality', category: 'ประกันชีวิต', tags: ['aia','AIA Vitality','ประกันชีวิต','ประกันสุขภาพ','ประกันโรคร้ายแรง'], publishedAt: '2026-08-04T14:39:00+07:00' },
  { wpId: 359, slug: 'aia-health-ci-hero-guide', category: 'ประกันสุขภาพและโรคร้ายแรง', tags: ['aia','Health CI Hero','ประกันชีวิต','ประกันสุขภาพ','ประกันโรคร้ายแรง'], publishedAt: '2026-08-03T22:29:00+07:00' },
  { wpId: 233, slug: 'critical-illness-insurance', category: 'ประกันสุขภาพและโรคร้ายแรง', tags: ['ประกันชีวิต','ประกันสุขภาพ','ประกันโรคร้ายแรง'], publishedAt: '2026-05-22T12:27:00+07:00' },
  { wpId: 196, slug: 'aia-health-happy-describe', category: 'ประกันสุขภาพและโรคร้ายแรง', tags: ['aia','healthhappy','ประกันสุขภาพ'], publishedAt: '2026-04-06T22:12:00+07:00' },
  { wpId: 95, slug: 'financial-pyramid', category: 'การเงินส่วนบุคคล', tags: [], publishedAt: '2026-03-02T15:55:00+07:00' },
];

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const attr = (doc, selector, name='content') => doc.querySelector(selector)?.getAttribute(name)?.trim() || '';
const focusKeywordByWpId = new Map();

if (focusEvidencePath) {
  const evidence = JSON.parse(await readFile(path.resolve(focusEvidencePath), 'utf8'));
  if (!Array.isArray(evidence.posts)) throw new Error('Focus keyword evidence must contain a posts array');
  for (const item of evidence.posts) {
    const wpId = Number(item.id ?? item.wpId);
    const meta = item.meta ?? item.rankMath ?? {};
    const focusKeyword = clean(meta.rank_math_focus_keyword ?? meta.focusKeyword);
    if (!Number.isInteger(wpId) || !focusKeyword) continue;
    if (focusKeyword.length > 200) throw new Error(`Focus keyword evidence is too long for WordPress ID ${wpId}`);
    if (focusKeywordByWpId.has(wpId) && focusKeywordByWpId.get(wpId) !== focusKeyword) throw new Error(`Conflicting focus keyword evidence for WordPress ID ${wpId}`);
    focusKeywordByWpId.set(wpId, focusKeyword);
  }
}

for (const post of posts) {
  const url = `https://blog.ccpun.com/${post.slug}/`;
  const response = await fetch(url, { headers: { 'user-agent': 'CCPun migration verification/2026-08-19' } });
  if (!response.ok) throw new Error(`Fetch failed ${response.status}: ${url}`);
  if (response.redirected || response.url !== url) throw new Error(`WordPress source redirected and can no longer be exported safely: ${url}`);
  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;
  const content = doc.querySelector('.blog-content');
  if (!content) throw new Error(`Missing .blog-content: ${url}`);
  const h1 = clean(doc.querySelector('article h1')?.textContent);
  const seoTitle = clean(doc.title);
  const description = attr(doc, 'meta[name="description"]');
  const canonical = doc.querySelector('link[rel="canonical"]')?.href || url;
  const articleModified = attr(doc, 'meta[property="article:modified_time"]');
  const articlePublished = attr(doc, 'meta[property="article:published_time"]');
  const featured = doc.querySelector('article .article-featured-image img, article img[fetchpriority="high"]');
  const excerpt = clean(attr(doc, 'meta[property="og:description"]') || description || content.textContent).slice(0, 240);
  const bodyImages = [...content.querySelectorAll('img')].map((img) => ({
    src: img.currentSrc || img.src || img.getAttribute('data-src') || '',
    alt: clean(img.alt),
    width: Number(img.getAttribute('width')) || undefined,
    height: Number(img.getAttribute('height')) || undefined,
  })).filter((image) => image.src);
  const links = [...content.querySelectorAll('a[href]')].map((a) => ({ href: a.href, text: clean(a.textContent) })).filter((link) => link.href);
  Object.assign(post, {
    sourceUrl: url,
    title: h1,
    seoTitle,
    metaDescription: description,
    canonical,
    excerpt,
    articlePublishedAt: articlePublished || post.publishedAt,
    modifiedAt: articleModified || articlePublished || post.publishedAt,
    authorName: 'CCPun',
    contentHtml: content.innerHTML.trim(),
    contentTextLength: clean(content.textContent).length,
    featuredImage: featured ? {
      src: featured.currentSrc || featured.src,
      alt: clean(featured.alt || h1),
      width: Number(featured.getAttribute('width')) || 1400,
      height: Number(featured.getAttribute('height')) || 600,
    } : null,
    bodyImages,
    links,
    ...(focusKeywordByWpId.has(post.wpId) ? { focusKeyword: focusKeywordByWpId.get(post.wpId) } : {}),
  });
}

const exportData = {
  source: 'https://blog.ccpun.com',
  generatedAt: new Date().toISOString(),
  status: 'published',
  count: posts.length,
  posts,
};

await writeFile(outPath, `${JSON.stringify(exportData, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ ok: true, outPath, count: posts.length, slugs: posts.map((post) => post.slug), textLengths: Object.fromEntries(posts.map((post) => [post.slug, post.contentTextLength])) }));
