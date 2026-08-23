import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const defaultInput = path.resolve(here, '../../UAT-Reports/Published-Blog-Migration-2026-08-19/published-migration-prepared.json');
const args = process.argv.slice(2);
const unknownFlags = args.filter((arg) => arg.startsWith('--') && !['--commit', '--replace-owned'].includes(arg));
if (unknownFlags.length) throw new Error(`Unknown argument(s): ${unknownFlags.join(', ')}`);
const inputArg = args.find((arg) => !arg.startsWith('--'));
const inputPath = path.resolve(inputArg || defaultInput);
const commit = args.includes('--commit');
const replaceOwned = args.includes('--replace-owned');
const UAT_PROJECT_ID = 'ccb9lnw5';
const projectId = process.env.SANITY_API_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.SANITY_API_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_WRITE_TOKEN;
if (commit && process.env.CCPUN_UAT_MODE !== '1') throw new Error('Refusing to write outside explicit UAT mode');
if (commit && (!projectId || !dataset || !token)) throw new Error('Missing injected Sanity UAT configuration');
if (commit && projectId.trim() !== UAT_PROJECT_ID) throw new Error('Refusing to write outside the isolated Sanity UAT project');
if (commit && dataset.trim() !== 'uat') throw new Error('Refusing to write outside the Sanity uat dataset');
const source = JSON.parse(await readFile(inputPath, 'utf8'));

if (source?.mode !== 'draft-only' || source?.count !== 5 || !Array.isArray(source.documents)) {
  throw new Error('Published migration safety check failed: unexpected prepared bundle');
}
const documents = source.documents;
const articles = documents.filter((document) => document._type === 'article');
if (articles.length !== 5 || documents.some((document) => !String(document._id).startsWith('drafts.'))) {
  throw new Error('Published migration safety check failed: bundle must contain five Draft articles and Draft-only IDs');
}
if (articles.some((article) => article.seo?.noindex !== false || article.review?.status !== 'approved' || !article.publishedAt)) {
  throw new Error('Published migration safety check failed: article publish-readiness flags are inconsistent');
}

if (!commit) {
  console.log(JSON.stringify({ mode: 'dry-run', documents: documents.length, articles: articles.length, slugs: articles.map((article) => article.slug.current), mutationAttempted: false, replaceOwned }));
  process.exit(0);
}

const { createClient } = await import('@sanity/client');
const client = createClient({ projectId, dataset, token, apiVersion: '2026-08-19', useCdn: false, perspective: 'raw' });
const draftIds = documents.map((document) => document._id);
const publishedIds = draftIds.map((id) => id.replace(/^drafts\./, ''));
const allIds = [...draftIds, ...publishedIds];
const slugs = articles.map((article) => article.slug.current);

let existing;
let collisions;
try {
  [existing, collisions] = await Promise.all([
    client.fetch('*[_id in $ids]{_id,_type,slug,migration{sourceId,sourceRevision}}', { ids: allIds }),
    client.fetch('*[_type == "article" && slug.current in $slugs && !(_id in $ids)]{_id,"slug":slug.current}', { slugs, ids: allIds }),
  ]);
} catch {
  throw new Error('Sanity UAT preflight failed; details redacted');
}

const publishedSet = new Set(publishedIds);
if (existing.some((document) => publishedSet.has(document._id))) {
  throw new Error('Published migration safety check failed: published counterpart already exists');
}
if (collisions.length) {
  throw new Error(`Published migration safety check failed: ${collisions.length} slug collision(s) exist`);
}

const existingById = new Map(existing.map((document) => [document._id, document]));
for (const article of articles) {
  const current = existingById.get(article._id);
  if (!current) continue;
  if (current._type !== 'article' || current.migration?.sourceId !== article.migration?.sourceId) {
    throw new Error(`Published migration safety check failed: existing Draft ownership differs for ${article.slug.current}`);
  }
  if (current.migration?.sourceRevision !== article.migration?.sourceRevision && !replaceOwned) {
    throw new Error(`Published migration safety check failed: existing Draft revision differs for ${article.slug.current}`);
  }
}
for (const document of documents.filter((document) => document._type !== 'article')) {
  const current = existingById.get(document._id);
  if (current && current._type !== document._type) throw new Error('Supporting Draft ID collision');
}

const missing = documents.filter((document) => !existingById.has(document._id));
const replacements = replaceOwned
  ? articles.filter((article) => existingById.has(article._id) && existingById.get(article._id)?.migration?.sourceRevision !== article.migration?.sourceRevision)
  : [];
try {
  for (let index = 0; index < missing.length; index += 10) {
    let transaction = client.transaction();
    for (const document of missing.slice(index, index + 10)) transaction = transaction.createIfNotExists(document);
    await transaction.commit({ tag: 'ccpun.uat.wordpress-published-migration' });
  }
  for (let index = 0; index < replacements.length; index += 5) {
    let transaction = client.transaction();
    for (const document of replacements.slice(index, index + 5)) transaction = transaction.createOrReplace(document);
    await transaction.commit({ tag: 'ccpun.uat.wordpress-published-migration-refresh' });
  }
} catch {
  throw new Error('Sanity UAT Draft mutation failed; details redacted');
}

let verified;
try {
  verified = await client.fetch('*[_id in $ids]{_id,_type,"slug":slug.current,seo,review,publishedAt,migration{sourceId,sourceRevision},body}', { ids: allIds });
} catch {
  throw new Error('Sanity UAT verification failed; details redacted');
}
const verifiedById = new Map(verified.map((document) => [document._id, document]));
const publishedCount = publishedIds.filter((id) => verifiedById.has(id)).length;
const missingDrafts = draftIds.filter((id) => !verifiedById.has(id));
const articleChecks = articles.map((article) => {
  const stored = verifiedById.get(article._id);
  return {
    slug: article.slug.current,
    exists: Boolean(stored),
    revisionMatch: stored?.migration?.sourceRevision === article.migration.sourceRevision,
    sourceIdMatch: stored?.migration?.sourceId === article.migration.sourceId,
    noindexFalse: stored?.seo?.noindex === false,
    approved: stored?.review?.status === 'approved',
    publishedAt: Boolean(stored?.publishedAt),
    bodyBlocks: Array.isArray(stored?.body) ? stored.body.length : 0,
  };
});
if (missingDrafts.length || publishedCount || articleChecks.some((check) => !check.exists || !check.revisionMatch || !check.sourceIdMatch || !check.noindexFalse || !check.approved || !check.publishedAt || check.bodyBlocks < 1)) {
  throw new Error('Sanity UAT verification failed: Draft or publish-readiness invariant mismatch');
}

console.log(JSON.stringify({ ok: true, created: missing.length, replacedOwned: replacements.length, preserved: documents.length - missing.length - replacements.length, draftDocuments: draftIds.length, articleDrafts: articles.length, publishedCounterparts: publishedCount, articleChecks }));
