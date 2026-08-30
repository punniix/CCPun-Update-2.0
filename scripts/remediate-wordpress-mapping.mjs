import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const hash = (value, length = 16) => createHash('sha256').update(String(value)).digest('hex').slice(0, length);

export function splitFocusKeyword(value) {
  const values = [...new Set(clean(value).split(',').map(clean).filter(Boolean))];
  return { primary: values[0] ?? '', secondary: values.slice(1) };
}

export function extractFaq(html, sourceId) {
  const document = new JSDOM(String(html ?? '')).window.document;
  const nodes = [...document.querySelectorAll('h2,h3,p,li')];
  const start = nodes.findIndex((node) => node.tagName === 'H2' && /^(คำถามที่พบบ่อย|faq)$/i.test(clean(node.textContent)));
  if (start < 0) return [];
  const items = [];
  let question = '';
  let answers = [];
  const push = () => {
    const answer = clean(answers.join(' '));
    if (question && answer) items.push({ _key: hash(`${sourceId}:${question}`), _type: 'faqItem', question, answer });
  };
  for (const node of nodes.slice(start + 1)) {
    if (node.tagName === 'H2') break;
    if (node.tagName === 'H3') {
      push();
      question = clean(node.textContent);
      answers = [];
    } else if (question && !node.closest('li')?.parentElement?.closest('li')) {
      const text = clean(node.textContent);
      if (text) answers.push(text);
    }
  }
  push();
  return items.slice(0, 8);
}

export function rewriteInternalLinks(body, publishedRoutes) {
  let changed = 0;
  const rewritten = (body ?? []).map((block) => {
    if (!Array.isArray(block.markDefs)) return block;
    const markDefs = block.markDefs.map((mark) => {
      if (mark._type !== 'link' || !mark.href) return mark;
      let url;
      try { url = new URL(mark.href, 'https://ccpun.com'); } catch { return mark; }
      if (!['ccpun.com', 'www.ccpun.com', 'blog.ccpun.com'].includes(url.hostname)) return mark;
      const parts = url.pathname.split('/').filter(Boolean);
      const slug = parts[0] === 'blog' && parts.length === 2 ? parts[1] : url.hostname === 'blog.ccpun.com' && parts.length === 1 ? parts[0] : '';
      const category = publishedRoutes.get(slug);
      if (!category) return mark;
      const href = `/blog/${category}/${slug}/${url.search}${url.hash}`;
      if (href === mark.href) return mark;
      changed += 1;
      return { ...mark, href };
    });
    return { ...block, markDefs };
  });
  return { body: rewritten, changed };
}

function mergeEvidence(target, post, source) {
  const id = Number(post.id ?? post.wpId);
  if (!Number.isInteger(id)) return;
  const meta = post.meta ?? post.rankMath ?? {};
  const values = {
    focus: clean(meta.rank_math_focus_keyword ?? meta.focusKeyword),
    title: clean(meta.rank_math_title ?? meta.title),
    description: clean(meta.rank_math_description ?? meta.description),
  };
  const current = target.get(id) ?? { sources: [] };
  for (const field of ['focus', 'title', 'description']) {
    if (values[field] && current[field] && values[field] !== current[field]) throw new Error(`Conflicting ${field} evidence for WordPress ID ${id}`);
    if (values[field]) current[field] = values[field];
  }
  current.sources.push(source);
  target.set(id, current);
}

async function loadEvidence(root) {
  const evidence = new Map();
  const inventoryPath = path.resolve(root, '../../../Marketing/Content-Writer/Articles/2026-08-09-wordpress-post-body-inventory.json');
  const snapshotsPath = path.resolve(root, '../../../Marketing/Content-Writer/Articles/2026-08-13-strategy-rebuild/wp-snapshots');
  const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'));
  for (const post of inventory.posts ?? []) mergeEvidence(evidence, post, path.basename(inventoryPath));
  for (const filename of (await readdir(snapshotsPath)).filter((name) => name.endsWith('.json')).sort()) {
    mergeEvidence(evidence, JSON.parse(await readFile(path.join(snapshotsPath, filename), 'utf8')), filename);
  }
  return evidence;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  if ([...args].some((arg) => !['--dry-run', '--commit', '--self-test'].includes(arg))) throw new Error('Allowed arguments: --dry-run, --commit, --self-test');
  if (args.has('--dry-run') && args.has('--commit')) throw new Error('Choose either --dry-run or --commit');
  if (args.has('--self-test')) {
    const focus = splitFocusKeyword('หลัก, รอง, รอง');
    if (focus.primary !== 'หลัก' || focus.secondary.join(',') !== 'รอง') throw new Error('Focus keyword self-test failed');
    const faq = extractFaq('<h2>คำถามที่พบบ่อย</h2><h3>ถาม?</h3><p>ตอบ</p>', 1);
    if (faq.length !== 1 || faq[0].answer !== 'ตอบ') throw new Error('FAQ self-test failed');
    const links = rewriteInternalLinks([{ markDefs: [{ _type: 'link', href: '/blog/example/' }] }], new Map([['example', 'news']]));
    if (links.changed !== 1 || links.body[0].markDefs[0].href !== '/blog/news/example/') throw new Error('Link self-test failed');
    console.log('PASS: remediation helpers');
    return;
  }

  const commit = args.has('--commit');
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim();
  const token = commit ? process.env.SANITY_PRODUCTION_API_WRITE_TOKEN : process.env.SANITY_PRODUCTION_API_READ_TOKEN;
  if (projectId !== 'kyfxgjnq' || dataset !== 'production' || !token) throw new Error('Exact Production dataset credentials are required');
  if (commit && (process.env.CCPUN_APP_ENV !== 'local-production' || process.env.CCPUN_LOCAL_PRODUCTION_DRAFT_WRITES !== '1' || !process.env.SANITY_PRODUCTION_API_WRITE_TOKEN)) {
    throw new Error('Refusing to write outside explicit Local Production Draft mode');
  }

  const { createClient } = await import('@sanity/client');
  const client = createClient({ projectId, dataset, token, apiVersion: '2026-08-20', useCdn: false, perspective: 'raw' });
  const documents = await client.fetch(`*[_type == "article" && _id in path("drafts.**") && migration.platform == "WordPress"]{
    _id,_rev,title,excerpt,slug,body,faq,contentUpdatedAt,seo,migration,"categorySlug":category->slug.current
  }`);
  const expected = Number(process.env.CCPUN_EXPECTED_WORDPRESS_DRAFTS || 39);
  if (documents.length !== expected) throw new Error(`Expected ${expected} WordPress article drafts, found ${documents.length}`);
  const sourceIds = documents.map((document) => document.migration?.sourceId);
  if (new Set(sourceIds).size !== sourceIds.length) throw new Error('Duplicate WordPress sourceId detected; refusing remediation');

  const evidence = await loadEvidence(path.dirname(fileURLToPath(import.meta.url)));
  const publishedRoutes = new Map(documents.filter((document) => document.migration?.sourceStatus === 'published').map((document) => [document.slug?.current, document.categorySlug]));
  const plans = [];
  for (const document of documents) {
    const source = evidence.get(Number(document.migration?.sourceId));
    const set = {};
    if (!document.contentUpdatedAt && document.migration?.sourceModifiedAt) set.contentUpdatedAt = document.migration.sourceModifiedAt;
    if (source?.focus) {
      const focus = splitFocusKeyword(source.focus);
      if (!document.migration?.rankMathFocusKeyword) set['migration.rankMathFocusKeyword'] = source.focus;
      if (!clean(document.seo?.focusKeyword)) set['seo.focusKeyword'] = focus.primary;
      if ((!document.seo?.secondaryKeywords?.length) && focus.secondary.length) set['seo.secondaryKeywords'] = focus.secondary;
    }
    if (document.migration?.sourceStatus === 'draft' && source) {
      const fallbackTitle = clean(document.title).slice(0, 60);
      const fallbackDescription = clean(document.excerpt).slice(0, 160);
      if (source.title && !document.migration?.rankMathTitle) set['migration.rankMathTitle'] = source.title;
      if (source.description && !document.migration?.rankMathDescription) set['migration.rankMathDescription'] = source.description;
      const mappedTitle = (source.title ?? '').slice(0, 60);
      const mappedDescription = (source.description ?? '').slice(0, 160);
      if (source.title && clean(document.seo?.title) === fallbackTitle && clean(document.seo?.title) !== mappedTitle) set['seo.title'] = mappedTitle;
      if (source.description && clean(document.seo?.description) === fallbackDescription && clean(document.seo?.description) !== mappedDescription) set['seo.description'] = mappedDescription;
    }
    if (!document.faq?.length) {
      const faq = extractFaq(document.migration?.sourceHtml, document.migration?.sourceId);
      if (faq.length) set.faq = faq;
    }
    const links = rewriteInternalLinks(document.body, publishedRoutes);
    if (links.changed) set.body = links.body;
    if (Object.keys(set).length) plans.push({ document, set, links: links.changed });
  }

  const summary = {
    mode: commit ? 'commit' : 'dry-run',
    articleDraftsBefore: documents.length,
    publishedMigrationDrafts: documents.filter((document) => document.migration?.sourceStatus === 'published').length,
    publishedWithFocusKeyword: documents.filter((document) => document.migration?.sourceStatus === 'published' && clean(document.seo?.focusKeyword)).length,
    documentsWithFaq: documents.filter((document) => document.faq?.length).length,
    changedArticles: plans.length,
    focusKeywords: plans.filter((plan) => plan.set['seo.focusKeyword']).length,
    rankMathTitles: plans.filter((plan) => plan.set['seo.title']).length,
    rankMathDescriptions: plans.filter((plan) => plan.set['seo.description']).length,
    faqArticles: plans.filter((plan) => plan.set.faq).length,
    internalLinks: plans.reduce((total, plan) => total + plan.links, 0),
    contentDates: plans.filter((plan) => plan.set.contentUpdatedAt).length,
  };
  if (!commit || !plans.length) {
    console.log(`PASS: ${JSON.stringify({ ...summary, mutationAttempted: false })}`);
    return;
  }

  requireProductionNeonAuditWriter();
  let transaction = client.transaction();
  for (const plan of plans) transaction = transaction.patch(plan.document._id, (patch) => patch.ifRevisionId(plan.document._rev).set(plan.set));
  await transaction.commit({ tag: 'ccpun.wordpress-mapping-remediation' });
  const after = await client.fetch('count(*[_type == "article" && _id in path("drafts.**") && migration.platform == "WordPress"])');
  if (after !== documents.length) throw new Error(`Article count changed unexpectedly: ${documents.length} -> ${after}`);
  console.log(`PASS: ${JSON.stringify({ ...summary, articleDraftsAfter: after, published: false })}`);
}

function requireProductionNeonAuditWriter() {
  throw new Error('Refusing Production WordPress remediation: Production Neon Admin audit writer is not configured');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
