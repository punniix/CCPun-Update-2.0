import { createClient } from '@sanity/client';
import { getCliClient } from 'sanity/cli';
import { isDeepStrictEqual } from 'node:util';

const SOURCE = { projectId: 'kyfxgjnq', dataset: 'production' };
const TARGET = { projectId: 'ccb9lnw5', dataset: 'uat' };
const API_VERSION = '2026-09-04';
const ARTICLE_PREFIX = 'drafts.ccpun-prod-mirror-';
const AUTHOR_PREFIX = 'ccpun-prod-mirror-author-';

const args = process.argv.slice(2);
const commit = args.includes('--commit');
const slugArgs = args.filter((arg) => arg.startsWith('--slug=')).map((arg) => arg.slice(7)).filter(Boolean);
const unknown = args.filter((arg) => arg.startsWith('--') && arg !== '--commit' && !arg.startsWith('--slug='));
if (unknown.length) throw new Error(`Unknown argument(s): ${unknown.join(', ')}`);
if (process.env.CCPUN_APP_ENV !== 'local-uat') throw new Error('Refusing sync outside CCPUN_APP_ENV=local-uat');
if ((process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID) !== TARGET.projectId) throw new Error('Refusing sync outside exact UAT project');
if ((process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_STUDIO_DATASET) !== TARGET.dataset) throw new Error('Refusing sync outside exact UAT dataset');
if (commit && process.env.CCPUN_UAT_MODE !== '1') throw new Error('Commit requires CCPUN_UAT_MODE=1');

const source = createClient({ ...SOURCE, apiVersion: API_VERSION, useCdn: false, perspective: 'published' });
const target = getCliClient({ apiVersion: API_VERSION, dataset: TARGET.dataset, perspective: 'raw' });

const ARTICLE_FIELDS = ['title','slug','excerpt','tags','featuredImage','migratedFeaturedImage','body','faq','sources','review','seo','geo','migration','contentUpdatedAt','publishedAt'];
const AUTHOR_FIELDS = ['name','slug','bio','credentials','sameAs'];
const clone = (value) => structuredClone(value);
const pick = (obj, keys) => Object.fromEntries(keys.filter((key) => obj?.[key] !== undefined).map((key) => [key, clone(obj[key])]));
const stable = (doc) => {
  if (!doc) return null;
  const out = clone(doc);
  for (const key of ['_rev','_createdAt','_updatedAt','_originalId']) delete out[key];
  return out;
};
const collectRefs = (value, refs = []) => {
  if (!value || typeof value !== 'object') return refs;
  if (Array.isArray(value)) { for (const item of value) collectRefs(item, refs); return refs; }
  if (typeof value._ref === 'string') refs.push(value._ref);
  for (const child of Object.values(value)) collectRefs(child, refs);
  return refs;
};
const safeId = (value) => String(value).toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

const rows = await source.fetch(`*[_type == "article" && !(_id in path("drafts.**"))] | order(publishedAt desc) {
  ...,
  "sourceRevision": _rev,
  "sourceUpdatedAt": _updatedAt,
  "sourceAuthor": author->{_id,name,slug,bio,credentials,sameAs},
  "sourceCategory": category->{_id,title,slug,description}
}`);
const selected = slugArgs.length ? rows.filter((row) => slugArgs.includes(row.slug?.current)) : rows;
if (!selected.length) throw new Error('No Production Published articles selected');
if (slugArgs.length) {
  const found = new Set(selected.map((row) => row.slug?.current));
  const missing = slugArgs.filter((slug) => !found.has(slug));
  if (missing.length) throw new Error(`Production slug(s) not found: ${missing.join(', ')}`);
}

for (const article of selected) {
  if (!article.publishedAt || article.review?.status !== 'approved') throw new Error(`Source publish invariant failed: ${article._id}`);
  if (!article.slug?.current || !article.sourceAuthor?.slug?.current || !article.sourceCategory?.slug?.current) throw new Error(`Source reference invariant failed: ${article._id}`);
  const assetRefs = collectRefs(pick(article, ARTICLE_FIELDS)).filter((ref) => ref.startsWith('image-') || ref.startsWith('file-'));
  if (assetRefs.length) throw new Error(`Cross-project Sanity asset ref found in ${article.slug.current}; explicit asset migration required`);
}

const targetCategories = await target.fetch('*[_type == "category"]{_id,title,slug}');
const categoryBySlug = new Map();
for (const category of targetCategories) {
  const slug = category.slug?.current;
  if (!slug) continue;
  if (categoryBySlug.has(slug)) throw new Error(`Duplicate UAT category slug: ${slug}`);
  categoryBySlug.set(slug, category);
}

const sourceAuthors = new Map();
for (const article of selected) sourceAuthors.set(article.sourceAuthor.slug.current, article.sourceAuthor);
const desiredAuthors = [...sourceAuthors.entries()].map(([slug, author]) => ({
  _id: `${AUTHOR_PREFIX}${safeId(slug)}`,
  _type: 'author',
  ...pick(author, AUTHOR_FIELDS),
}));
const authorBySlug = new Map(desiredAuthors.map((author) => [author.slug.current, author]));

const desiredArticles = selected.map((article) => {
  const category = categoryBySlug.get(article.sourceCategory.slug.current);
  if (!category) throw new Error(`Missing UAT category slug: ${article.sourceCategory.slug.current}`);
  const author = authorBySlug.get(article.sourceAuthor.slug.current);
  const desired = {
    _id: `${ARTICLE_PREFIX}${article._id}`,
    _type: 'article',
    ...pick(article, ARTICLE_FIELDS),
    author: { _type: 'reference', _ref: author._id },
    category: { _type: 'reference', _ref: category._id },
  };
  return { desired, sourceRevision: article.sourceRevision, sourceUpdatedAt: article.sourceUpdatedAt };
});

const desiredDocs = [...desiredAuthors, ...desiredArticles.map((item) => item.desired)];
const ids = desiredDocs.map((doc) => doc._id);
const articleSlugs = desiredArticles.map((item) => item.desired.slug.current);
const authorSlugs = desiredAuthors.map((doc) => doc.slug.current);
const [existing, articleCollisions, authorCollisions, staleOwned] = await Promise.all([
  target.fetch('*[_id in $ids]', { ids }),
  target.fetch('*[_type == "article" && slug.current in $slugs && !(_id in $ids)]{_id,title,"slug":slug.current}', { slugs: articleSlugs, ids }),
  target.fetch('*[_type == "author" && slug.current in $slugs && !(_id in $ids)]{_id,"slug":slug.current,name}', { slugs: authorSlugs, ids }),
  target.fetch('*[(_type == "article" && _id match "drafts.ccpun-prod-mirror-*") || (_type == "author" && _id match "ccpun-prod-mirror-author-*")]{_id,_type,"slug":slug.current}'),
]);
if (authorCollisions.length) throw new Error(`UAT author slug collision(s): ${authorCollisions.map((x) => x.slug).join(', ')}`);

const existingById = new Map(existing.map((doc) => [doc._id, doc]));
const actionFor = (doc) => !existingById.has(doc._id) ? 'create' : isDeepStrictEqual(stable(existingById.get(doc._id)), stable(doc)) ? 'preserve' : 'update';
const desiredIdSet = new Set(ids);
const plan = {
  mode: commit ? 'commit' : 'dry-run',
  source: SOURCE,
  target: TARGET,
  selectedProductionPublishedArticles: selected.length,
  authors: desiredAuthors.map((doc) => ({ id: doc._id, slug: doc.slug.current, action: actionFor(doc) })),
  articles: desiredArticles.map(({ desired, sourceRevision, sourceUpdatedAt }) => ({ id: desired._id, slug: desired.slug.current, publishedAt: desired.publishedAt, sourceRevision, sourceUpdatedAt, categoryRef: desired.category._ref, authorRef: desired.author._ref, action: actionFor(desired) })),
  preservedNonMirrorSlugCollisions: articleCollisions,
  staleOwnedMirrorsPreserved: staleOwned.filter((doc) => !desiredIdSet.has(doc._id)),
  deletesPlanned: 0,
  productionMutationClientCreated: false,
};

if (!commit) {
  console.log(JSON.stringify(plan, null, 2));
  process.exit(0);
}

const toWrite = desiredDocs.filter((doc) => actionFor(doc) !== 'preserve');
for (let index = 0; index < toWrite.length; index += 10) {
  let tx = target.transaction();
  for (const doc of toWrite.slice(index, index + 10)) tx = tx.createOrReplace(doc);
  await tx.commit({ tag: 'ccpun.uat.production-published-mirror' });
}

const verified = await target.fetch('*[_id in $ids]', { ids });
const verifiedById = new Map(verified.map((doc) => [doc._id, doc]));
const mismatches = desiredDocs.filter((doc) => !isDeepStrictEqual(stable(verifiedById.get(doc._id)), stable(doc))).map((doc) => doc._id);
if (mismatches.length) throw new Error(`UAT read-back mismatch: ${mismatches.join(', ')}`);
const publishedMirrorIds = desiredArticles.map(({ desired }) => desired._id.replace(/^drafts\./, ''));
const publishedMirrorCount = await target.fetch('count(*[_id in $ids])', { ids: publishedMirrorIds });
if (publishedMirrorCount !== 0) throw new Error('Safety invariant failed: a mirror article became Published in UAT');

console.log(JSON.stringify({ ok: true, ...plan, written: toWrite.length, verifiedDocuments: verified.length, publishedMirrorArticles: publishedMirrorCount }, null, 2));
