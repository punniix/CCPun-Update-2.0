import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { ACTIVE_ARTICLE_CATEGORIES, normalizeArticleTaxonomy } from '../lib/content/taxonomy.ts';

const args = process.argv.slice(2);
const allowedArgs = new Set(['--dry-run', '--commit']);
const unknownArgs = args.filter((arg) => !allowedArgs.has(arg));
if (unknownArgs.length) throw new Error(`Unknown argument: ${unknownArgs.join(', ')}`);
if (args.includes('--dry-run') && args.includes('--commit')) throw new Error('Choose either --dry-run or --commit');

const commit = args.includes('--commit');
const UAT_PROJECT_ID = 'ccb9lnw5';
if (commit && process.env.CCPUN_UAT_MODE !== '1') throw new Error('Refusing to write outside explicit UAT mode');
const projectId = process.env.SANITY_API_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.SANITY_API_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_WRITE_TOKEN;
if (commit && (!projectId || !dataset || !token)) throw new Error('Missing Sanity UAT configuration');
if (commit && projectId.trim() !== UAT_PROJECT_ID) throw new Error('Refusing to write outside the isolated Sanity UAT project');
if (commit && dataset.trim() !== 'uat') throw new Error('Refusing to write outside the Sanity uat dataset');

const inputPath = path.resolve(process.env.WP_DRAFT_EXPORT ?? path.join(tmpdir(), 'ccpun-wp-drafts-export.json'));
const source = JSON.parse(await readFile(inputPath, 'utf8'));
const key = (value) => createHash('sha256').update(String(value)).digest('hex').slice(0, 16);
const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const textFromHtml = (html) => clean(new JSDOM(String(html ?? '')).window.document.body.textContent);
const rankText = (value) => clean(Array.isArray(value) ? value.join(',') : value);
const isHttpUrl = (value) => {
  try {
    return ['http:', 'https:'].includes(new URL(String(value)).protocol);
  } catch {
    return false;
  }
};
const activeCategoryBySlug = new Map(ACTIVE_ARTICLE_CATEGORIES.map((category) => [category.slug, category]));
const categoryDocumentIds = {
  'personal-finance': 'ccpun-wp-category-1',
  'life-insurance': 'ccpun-wp-category-4',
  investment: 'ccpun-category-investment',
};
const normalizeWordPressTaxonomy = (post) => {
  const primaryCategory = post.categories[0];
  const normalized = normalizeArticleTaxonomy({
    categoryTitle: primaryCategory?.name,
    categorySlug: primaryCategory?.slug,
    tags: post.tags.map((tag) => tag.name),
  });
  const category = normalized.categorySlug ? activeCategoryBySlug.get(normalized.categorySlug) : null;
  const documentId = normalized.categorySlug ? categoryDocumentIds[normalized.categorySlug] : null;
  if (!category || !documentId) throw new Error(`Import safety check failed: unknown primary category for WordPress ID ${post.wpId}`);
  return { category: { ...category, documentId }, tags: normalized.tags };
};

function validateSource(input) {
  if (input?.source !== 'https://blog.ccpun.com') throw new Error('Import safety check failed: unexpected WordPress source');
  if (!Array.isArray(input.posts)) throw new Error('Import safety check failed: posts must be an array');
  const ids = new Set();
  for (const post of input.posts) {
    if (!Number.isInteger(post?.wpId) || post.wpId <= 0 || ids.has(post.wpId)) throw new Error('Import safety check failed: invalid or duplicate WordPress ID');
    ids.add(post.wpId);
    if (post.status !== 'draft') throw new Error('Import safety check failed: expected WordPress drafts only');
    if (!clean(post.title) || typeof post.slug !== 'string' || typeof post.contentHtml !== 'string' || typeof post.excerptHtml !== 'string') {
      throw new Error(`Import safety check failed: invalid required fields for WordPress ID ${post.wpId}`);
    }
    if (!Number.isInteger(post.authorId) || !Array.isArray(post.categories) || !Array.isArray(post.tags) || !post.modified || Number.isNaN(Date.parse(post.modified))) {
      throw new Error(`Import safety check failed: invalid metadata for WordPress ID ${post.wpId}`);
    }
    if (post.categories.some((category) => !category || !clean(category.name) || !clean(category.slug)) || post.tags.some((tag) => !tag || !clean(tag.name) || !clean(tag.slug))) {
      throw new Error(`Import safety check failed: invalid taxonomy for WordPress ID ${post.wpId}`);
    }
  }
}

validateSource(source);

const disposition = (title) => {
  if (/SOURCE ONLY/i.test(title)) return 'source-only';
  if (/MERGED/i.test(title)) return 'merged';
  if (/HOLD|DO NOT PUBLISH/i.test(title)) return 'hold';
  return 'standard';
};

function bodyFromHtml(html, wpId) {
  const document = new JSDOM(String(html ?? '')).window.document;
  const blocks = [];
  for (const element of document.body.querySelectorAll('h1,h2,h3,p,li,blockquote,tr')) {
    if (element.matches('p') && element.closest('li,blockquote,td,th')) continue;
    if (element.matches('blockquote') && element.closest('blockquote') !== element) continue;
    const text = clean(element.textContent);
    if (!text) continue;
    const listItem = element.matches('li') ? (element.closest('ol') ? 'number' : 'bullet') : undefined;
    const style = element.matches('h1,h2') ? 'h2' : element.matches('h3') ? 'h3' : element.matches('blockquote') ? 'blockquote' : 'normal';
    blocks.push({
      _key: key(`${wpId}:${blocks.length}:${text}`),
      _type: 'block',
      style,
      ...(listItem ? { listItem, level: 1 } : {}),
      markDefs: [],
      children: [{ _key: key(`${wpId}:${blocks.length}:span`), _type: 'span', marks: [], text }],
    });
  }
  return blocks.length ? blocks : [{
    _key: key(`${wpId}:empty`),
    _type: 'callout',
    title: 'Imported draft',
    text: 'WordPress source body was empty or could not be converted. Review the original HTML in Migration before editing.',
  }];
}

const sourceRevision = (post) => key(JSON.stringify({
  wpId: post.wpId,
  modified: post.modified,
  title: post.title,
  slug: post.slug,
  contentHtml: post.contentHtml,
  excerptHtml: post.excerptHtml,
  author: post.author ?? post.authorId,
  categories: post.categories,
  tags: post.tags,
  featuredImage: post.featuredImage,
  rankMath: post.rankMath,
}));
const authorId = (id) => `ccpun-wp-author-${id}`;
const importedAt = new Date().toISOString();
const taxonomyByWordPressId = new Map(source.posts.map((post) => [post.wpId, normalizeWordPressTaxonomy(post)]));
const categories = [...new Map([...taxonomyByWordPressId.values()].map(({ category }) => [category.slug, category])).values()];
const authors = [...new Map(source.posts.map((post) => [post.authorId, { ...(post.author ?? {}), id: post.authorId }])).values()];

const supportDocuments = [
  ...authors.map((author) => ({
    _id: `drafts.${authorId(author.id)}`,
    _type: 'author',
    name: clean(author.name) || 'CCPun',
    slug: { _type: 'slug', current: clean(author.slug) || `wp-author-${author.id}` },
    ...(clean(author.description) ? { bio: clean(author.description) } : {}),
    ...([author.url, author.link].some(isHttpUrl) ? { sameAs: [...new Set([author.url, author.link].filter(isHttpUrl))] } : {}),
  })),
  ...categories.map((category) => ({
    _id: `drafts.${category.documentId}`,
    _type: 'category',
    title: category.title,
    slug: { _type: 'slug', current: category.slug },
    description: 'Canonical CCPun article category used by the WordPress Draft import.',
  })),
];

const usedSlugs = new Set();
const articles = source.posts.map((post) => {
  let slug = post.slug || `wp-draft-${post.wpId}`;
  if (usedSlugs.has(slug)) slug = `${slug}-${post.wpId}`;
  usedSlugs.add(slug);
  const articleText = textFromHtml(post.contentHtml);
  const excerpt = (textFromHtml(post.excerptHtml) || articleText || post.title).slice(0, 240);
  const taxonomy = taxonomyByWordPressId.get(post.wpId);
  if (!taxonomy) throw new Error(`Import safety check failed: missing normalized taxonomy for WordPress ID ${post.wpId}`);
  const status = disposition(post.title);
  const rankMath = post.rankMath ?? {};
  const canonical = rankText(rankMath.canonical);
  const [focusKeyword, ...secondaryKeywords] = rankText(rankMath.focusKeyword).split(',').map(clean).filter(Boolean);
  return {
    _id: `drafts.ccpun-wp-article-${post.wpId}`,
    _type: 'article',
    title: post.title,
    slug: { _type: 'slug', current: slug },
    excerpt,
    category: { _type: 'reference', _ref: taxonomy.category.documentId, _weak: true },
    tags: taxonomy.tags,
    author: { _type: 'reference', _ref: authorId(post.authorId), _weak: true },
    body: bodyFromHtml(post.contentHtml, post.wpId),
    faq: [],
    sources: [],
    review: {
      _type: 'reviewMetadata',
      status: 'drafting',
      notes: `Imported from WordPress Draft ID ${post.wpId}. Disposition: ${status}. Never publish without content, fact, compliance and COO review. Featured image remains source metadata only.`,
    },
    seo: {
      _type: 'seoMetadata',
      title: (rankText(rankMath.title) || clean(post.title)).slice(0, 60),
      description: (rankText(rankMath.description) || excerpt).slice(0, 160),
      ...(focusKeyword ? { focusKeyword } : {}),
      ...(secondaryKeywords.length ? { secondaryKeywords: [...new Set(secondaryKeywords)] } : {}),
      ...(isHttpUrl(canonical) ? { canonical } : {}),
      noindex: true,
    },
    migration: {
      _type: 'migrationSource',
      platform: 'WordPress',
      sourceId: post.wpId,
      sourceStatus: 'draft',
      sourceRevision: sourceRevision(post),
      disposition: status,
      ...(post.date && !Number.isNaN(Date.parse(post.date)) ? { sourceCreatedAt: post.date } : {}),
      sourceModifiedAt: post.modified,
      importedAt,
      sourceHtml: post.contentHtml,
      sourceExcerptHtml: post.excerptHtml,
      sourceCategories: post.categories.map((category) => category.name),
      sourceTags: post.tags.map((tag) => tag.name),
      ...(rankText(rankMath.title) ? { rankMathTitle: rankText(rankMath.title) } : {}),
      ...(rankText(rankMath.description) ? { rankMathDescription: rankText(rankMath.description) } : {}),
      ...(rankText(rankMath.focusKeyword) ? { rankMathFocusKeyword: rankText(rankMath.focusKeyword) } : {}),
      ...(isHttpUrl(canonical) ? { rankMathCanonical: canonical } : {}),
      ...(rankText(rankMath.robots) ? { rankMathRobots: rankText(rankMath.robots) } : {}),
      ...(post.featuredImage?.sourceUrl ? {
        featuredImageUrl: post.featuredImage.sourceUrl,
        featuredImageAlt: post.featuredImage.alt || '',
        featuredImageCaption: textFromHtml(post.featuredImage.caption),
      } : {}),
    },
    contentUpdatedAt: post.modified,
  };
});

const documents = [...supportDocuments, ...articles];
if (documents.some((document) => !document._id.startsWith('drafts.')) || articles.some((article) => 'publishedAt' in article)) {
  throw new Error('Import safety check failed: every document must remain a draft without publishedAt');
}

const dispositions = Object.fromEntries([...new Set(articles.map((article) => article.migration.disposition))].map((status) => [status, articles.filter((article) => article.migration.disposition === status).length]));
if (!commit) {
  console.log(`PASS: ${JSON.stringify({
    mode: 'dry-run',
    source: source.source,
    articles: articles.length,
    supportingDrafts: supportDocuments.length,
    documents: documents.length,
    dispositions,
    taxonomy: articles.map((article) => ({ sourceId: article.migration.sourceId, categoryRef: article.category._ref, tags: article.tags })),
    mutationAttempted: false,
    commitRequired: true,
  })}`);
  process.exit(0);
}

const { createClient } = await import('@sanity/client');
const client = createClient({ projectId, dataset, token, apiVersion: '2026-08-19', useCdn: false, perspective: 'raw' });
const draftIds = documents.map((document) => document._id);
const publishedIds = draftIds.map((id) => id.replace(/^drafts\./, ''));
const allIds = [...draftIds, ...publishedIds];
let existingDocuments;
let slugCollisions;
try {
  [existingDocuments, slugCollisions] = await Promise.all([
    client.fetch('*[_id in $ids]{_id,_type,migration{sourceId,sourceModifiedAt,sourceRevision}}', { ids: allIds }),
    client.fetch('*[_type == "article" && slug.current in $slugs && !(_id in $ids)]{_id}', { slugs: [...usedSlugs], ids: allIds }),
  ]);
} catch {
  throw new Error('Sanity UAT preflight failed; details redacted');
}

const publishedSet = new Set(publishedIds);
if (existingDocuments.some((document) => publishedSet.has(document._id))) {
  throw new Error('Import safety check failed: a published counterpart already exists');
}
if (slugCollisions.length) throw new Error(`Import safety check failed: ${slugCollisions.length} slug collision(s) exist outside this import`);

const existingById = new Map(existingDocuments.map((document) => [document._id, document]));
for (const article of articles) {
  const existing = existingById.get(article._id);
  if (!existing) continue;
  if (existing._type !== 'article' || existing.migration?.sourceId !== article.migration.sourceId || existing.migration?.sourceRevision !== article.migration.sourceRevision) {
    throw new Error(`Import safety check failed: existing Draft revision differs for WordPress ID ${article.migration.sourceId}`);
  }
}
for (const support of supportDocuments) {
  const existing = existingById.get(support._id);
  if (existing && existing._type !== support._type) throw new Error('Import safety check failed: supporting Draft ID has a different type');
}

const missingDocuments = documents.filter((document) => !existingById.has(document._id));
try {
  for (let index = 0; index < missingDocuments.length; index += 10) {
    let transaction = client.transaction();
    for (const document of missingDocuments.slice(index, index + 10)) transaction = transaction.createIfNotExists(document);
    await transaction.commit({ tag: 'ccpun.uat.wordpress-draft-import' });
  }
} catch {
  throw new Error('Sanity UAT Draft mutation failed; details redacted');
}

let verifiedDocuments;
try {
  verifiedDocuments = await client.fetch('*[_id in $ids]{_id,_type,migration{sourceId,sourceRevision}}', { ids: allIds });
} catch {
  throw new Error('Sanity UAT verification failed; details redacted');
}
const verifiedById = new Map(verifiedDocuments.map((document) => [document._id, document]));
const publishedCount = publishedIds.filter((id) => verifiedById.has(id)).length;
const changedRevisionCount = articles.filter((article) => verifiedById.get(article._id)?.migration?.sourceRevision !== article.migration.sourceRevision).length;
if (draftIds.some((id) => !verifiedById.has(id)) || publishedCount !== 0 || changedRevisionCount !== 0) {
  throw new Error(`Sanity verification failed: drafts=${draftIds.filter((id) => verifiedById.has(id)).length}/${draftIds.length}; published=${publishedCount}; changedRevisions=${changedRevisionCount}`);
}

console.log(`PASS: imported ${missingDocuments.length} missing Sanity Draft documents; preserved=${documents.length - missingDocuments.length}; articles=${articles.length}; published=0`);
