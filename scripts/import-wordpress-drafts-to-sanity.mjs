import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@sanity/client';
import { JSDOM } from 'jsdom';

if (process.env.CCPUN_UAT_MODE !== '1') throw new Error('Refusing to write outside explicit UAT mode');
const inputPath = path.resolve(process.env.WP_DRAFT_EXPORT ?? 'wp-drafts-export.json');
const projectId = process.env.SANITY_API_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.SANITY_API_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_WRITE_TOKEN;
if (!projectId || !dataset || !token) throw new Error('Missing Sanity UAT configuration');

const source = JSON.parse(await readFile(inputPath, 'utf8'));
if (!Array.isArray(source.posts) || source.posts.length === 0 || source.posts.some((post) => post.status !== 'draft')) {
  throw new Error('Import safety check failed: expected WordPress drafts only');
}

const key = (value) => createHash('sha1').update(String(value)).digest('hex').slice(0, 12);
const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const textFromHtml = (html) => clean(new JSDOM(String(html ?? '')).window.document.body.textContent);
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

const authorId = 'ccpun-wp-author';
const categories = [...new Map(source.posts.flatMap((post) => post.categories).map((category) => [category.slug, category])).values()];
if (!categories.length) categories.push({ slug: 'uncategorized', name: 'ไม่มีหมวดหมู่' });
const categoryId = (slug) => `ccpun-wp-category-${slug.replace(/[^a-z0-9-]/gi, '-').slice(0, 70)}`;
const importedAt = new Date().toISOString();
const supportDocuments = [
  {
    _id: `drafts.${authorId}`,
    _type: 'author',
    name: 'CCPun',
    slug: { _type: 'slug', current: 'ccpun' },
    bio: 'CCPun — imported WordPress draft author. Review before publication.',
  },
  ...categories.map((category) => ({
    _id: `drafts.${categoryId(category.slug)}`,
    _type: 'category',
    title: category.name,
    slug: { _type: 'slug', current: category.slug },
    description: 'Imported from WordPress Draft inventory. Review before publication.',
  })),
];

const usedSlugs = new Set();
const articles = source.posts.map((post) => {
  let slug = post.slug || `wp-draft-${post.wpId}`;
  if (usedSlugs.has(slug)) slug = `${slug}-${post.wpId}`;
  usedSlugs.add(slug);
  const articleText = textFromHtml(post.contentHtml);
  const excerpt = (textFromHtml(post.excerptHtml) || articleText || post.title).slice(0, 240);
  const primaryCategory = post.categories[0] ?? categories[0];
  const status = disposition(post.title);
  return {
    _id: `drafts.ccpun-wp-article-${post.wpId}`,
    _type: 'article',
    title: post.title,
    slug: { _type: 'slug', current: slug },
    excerpt,
    category: { _type: 'reference', _ref: categoryId(primaryCategory.slug), _weak: true },
    tags: post.tags.map((tag) => tag.name),
    author: { _type: 'reference', _ref: authorId, _weak: true },
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
      title: clean(post.title).slice(0, 60),
      description: excerpt.slice(0, 160),
      noindex: true,
    },
    migration: {
      _type: 'migrationSource',
      platform: 'WordPress',
      sourceId: post.wpId,
      sourceStatus: 'draft',
      disposition: status,
      sourceModifiedAt: post.modified,
      importedAt,
      sourceHtml: post.contentHtml,
      sourceExcerptHtml: post.excerptHtml,
      ...(post.featuredImage?.sourceUrl ? {
        featuredImageUrl: post.featuredImage.sourceUrl,
        featuredImageAlt: post.featuredImage.alt || '',
        featuredImageCaption: textFromHtml(post.featuredImage.caption),
      } : {}),
    },
  };
});

const documents = [...supportDocuments, ...articles];
if (documents.some((document) => !document._id.startsWith('drafts.')) || articles.some((article) => 'publishedAt' in article)) {
  throw new Error('Import safety check failed: every document must remain a draft without publishedAt');
}

const client = createClient({ projectId, dataset, token, apiVersion: '2026-08-19', useCdn: false });
for (let index = 0; index < documents.length; index += 10) {
  let transaction = client.transaction();
  for (const document of documents.slice(index, index + 10)) transaction = transaction.createOrReplace(document);
  await transaction.commit({ tag: 'ccpun.uat.wordpress-draft-import' });
}

const rawClient = client.withConfig({ perspective: 'raw' });
const draftIds = articles.map((article) => article._id);
const publishedIds = draftIds.map((id) => id.replace(/^drafts\./, ''));
const [draftCount, publishedCount] = await Promise.all([
  rawClient.fetch('count(*[_id in $ids])', { ids: draftIds }),
  rawClient.fetch('count(*[_id in $ids])', { ids: publishedIds }),
]);
if (draftCount !== articles.length || publishedCount !== 0) {
  throw new Error(`Sanity verification failed: drafts=${draftCount}/${articles.length}; published=${publishedCount}`);
}

console.log(`PASS: imported and verified ${draftCount} WordPress articles as Sanity Drafts; published=0; supporting drafts=${supportDocuments.length}`);
