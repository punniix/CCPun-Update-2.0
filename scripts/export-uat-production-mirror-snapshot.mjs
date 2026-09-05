import { writeFile } from 'node:fs/promises';
import { getCliClient } from 'sanity/cli';

const TARGET = { projectId: 'ccb9lnw5', dataset: 'uat' };
const ARTICLE_PREFIX = 'drafts.ccpun-prod-mirror-';
const API_VERSION = '2026-09-04';

if (process.env.CCPUN_APP_ENV !== 'local-uat') throw new Error('Refusing export outside CCPUN_APP_ENV=local-uat');
if ((process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID) !== TARGET.projectId) throw new Error('Refusing export outside exact UAT project');
if ((process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_STUDIO_DATASET) !== TARGET.dataset) throw new Error('Refusing export outside exact UAT dataset');

const client = getCliClient({ apiVersion: API_VERSION, dataset: TARGET.dataset, perspective: 'raw' });
const rows = await client.fetch(`*[_type == "article"] {
  _id,
  title,
  "slug": slug.current,
  excerpt,
  tags,
  publishedAt,
  contentUpdatedAt,
  migration,
  "category": category->{title, "slug": slug.current},
  "author": author->{name, "slug": slug.current, bio, credentials, sameAs},
  migratedFeaturedImage,
  body,
  faq,
  sources,
  seo,
  geo
}`);

const articles = rows
  .filter((row) => row._id.startsWith(ARTICLE_PREFIX))
  .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
if (!articles.length) throw new Error('No verified Production mirror drafts found in UAT');
if (articles.some((article) => !article.slug || !article.title || !article.category?.slug || !article.author?.name || !article.publishedAt)) {
  throw new Error('UAT mirror snapshot invariant failed');
}

const publishedIds = articles.map((article) => article._id.replace(/^drafts\./, ''));
const publishedCounterparts = await client.fetch('*[_id in $ids]{_id}', { ids: publishedIds });
if (publishedCounterparts.length) throw new Error('Refusing export: Published mirror counterpart exists in UAT');

const provenance = {
  source: { projectId: 'kyfxgjnq', dataset: 'production', perspective: 'published' },
  mirror: { projectId: TARGET.projectId, dataset: TARGET.dataset, state: 'draft-only' },
};
const fixtureSnapshot = { ...provenance, articles };
const output = new URL('../features/website-43-uat/blogPreviewFixture.snapshot.json', import.meta.url);
await writeFile(output, `${JSON.stringify(fixtureSnapshot, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ ok: true, articles: articles.length, publishedCounterparts: 0, output: output.pathname }, null, 2));
