import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const taxonomy = await read('lib/content/taxonomy.ts');
const urls = await read('lib/content/url.ts');
const schema = await read('lib/content/schema.ts');
const blogPage = await read('app/blog/page.tsx');
const categoryPage = await read('app/blog/[category]/page.tsx');
const articlePage = await read('app/blog/[category]/[slug]/page.tsx');
const sitemap = await read('app/sitemaps/blog.xml/route.ts');
const archive = await read('components/Blog/BlogArchive.tsx');
const card = await read('components/Blog/ArticleCard.tsx');

for (const slug of ['personal-finance', 'life-insurance', 'health-insurance', 'critical-illness', 'investment']) {
  assert.match(taxonomy, new RegExp(`slug: ["']${slug}["']`));
}
assert.match(taxonomy, /slug: "investment"[\s\S]*?indexable: false/);
assert.match(taxonomy, /"aia-health-happy-describe": "health-insurance"/);
assert.match(taxonomy, /"aia-health-ci-hero-guide": "health-insurance"/);
assert.match(taxonomy, /"critical-illness-insurance": "critical-illness"/);
assert.match(taxonomy, /"aia-vitality": "life-insurance"/);

// Phase 1 canonical category contract remains the current three-category model.
assert.match(taxonomy, /ACTIVE_ARTICLE_CATEGORIES = \[[\s\S]*personal-finance[\s\S]*life-insurance[\s\S]*investment[\s\S]*\] as const/);
assert.doesNotMatch(taxonomy.match(/ACTIVE_ARTICLE_CATEGORIES = \[[\s\S]*?\] as const/)?.[0] ?? '', /health-insurance|critical-illness/);

// Exact existing moved-article redirects must keep old -> current direction.
assert.match(urls, /"health-insurance\/aia-health-happy-describe": "\/blog\/life-insurance\/aia-health-happy-describe\/"/);
assert.match(urls, /"health-insurance\/aia-health-ci-hero-guide": "\/blog\/life-insurance\/aia-health-ci-hero-guide\/"/);
assert.match(urls, /"critical-illness\/critical-illness-insurance": "\/blog\/life-insurance\/critical-illness-insurance\/"/);
assert.doesNotMatch(urls, /"life-insurance\/aia-health-happy-describe":/);
assert.doesNotMatch(urls, /"life-insurance\/critical-illness-insurance":/);

// Hub routing happens before the legacy one-segment redirect fallback.
assert.match(categoryPage, /const hub = getBlogTopicHub\(slug\);[\s\S]*if \(!hub\) \{[\s\S]*getLegacyCategoryRedirectPath/);
assert.match(categoryPage, /alternates: \{ canonical \}/);
assert.match(categoryPage, /const shouldIndexHub = hub\.indexable && relevantIndexableArticles\.length > 0/);
assert.match(categoryPage, /!isEnabled && shouldIndexHub \? \{ index: true, follow: true \} : \{ index: false, follow: true \}/);
assert.match(categoryPage, /const schema = shouldIndexHub \? buildBlogTopicHubSchema\(hub, relevantIndexableArticles\) : null/);
assert.match(categoryPage, /hub\.featuredLink\.href/);

// Article routing/canonical functions stay intact while visible topic navigation is semantic.
assert.match(articlePage, /getMovedArticleRedirectPath\(category, slug\)/);
assert.match(articlePage, /getArticleCategorySlug\(article\)/);
assert.match(articlePage, /getArticleSemanticTopic/);
assert.match(articlePage, /href=\{topicHref\}/);
assert.doesNotMatch(articlePage, /\/blog\/\?category=/);
assert.match(card, /const href = getArticlePath\(article\)/);
assert.match(card, /getArticleSemanticTopic/);

// JSON-LD uses semantic hub but mainEntityOfPage remains canonical.
assert.match(schema, /mainEntityOfPage: canonical/);
assert.match(schema, /articleSection: sectionName/);
assert.match(schema, /item: sectionUrl/);
assert.doesNotMatch(schema, /\/blog\/\?category=/);
assert.match(schema, /"@type": "CollectionPage"/);
assert.match(schema, /"@type": "ItemList"/);

// Sitemap includes useful hubs only and never exposes filter state.
assert.match(sitemap, /if \(!hub\.indexable\) return \[\]/);
assert.match(sitemap, /if \(!relevant\.length\) return \[\]/);
assert.match(sitemap, /https:\/\/ccpun\.com\/blog\/\$\{hub\.slug\}\//);
assert.doesNotMatch(sitemap, /\?category=|\?tag=/);

// Main Blog page exposes indexable topic hubs as server-rendered internal links.
assert.match(blogPage, /const navigableHubs = BLOG_TOPIC_HUBS\.filter/);
assert.match(blogPage, /isArticleCanonicalAligned\(article\)/);
assert.match(blogPage, /href=\{`\/blog\/\$\{hub\.slug\}\/`\}/);
assert.match(blogPage, /navigableHubs\.map/);

// Query-string filters remain a client-side UX convenience, not an SEO breadcrumb node.
assert.match(archive, /window\.history/);
assert.match(archive, /params\.set\("category"/);
assert.match(archive, /params\.set\("tag"/);

console.log('PASS: SEO topic hub routing regression');
