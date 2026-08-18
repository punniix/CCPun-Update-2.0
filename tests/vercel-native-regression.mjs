import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const packageJson = JSON.parse(read('package.json'));
assert.equal(packageJson.version, '4.0.0');
assert.equal(packageJson.scripts.build, 'next build');
assert.equal(packageJson.scripts.start, 'next start');

const nextConfig = read('next.config.ts');
assert.doesNotMatch(nextConfig, /output:\s*["']export["']/);
assert.doesNotMatch(nextConfig, /unoptimized:\s*true/);
assert.match(nextConfig, /source:\s*["']\/living-benefits\/:path\*["']/);
assert.match(nextConfig, /destination:\s*["']\/ci-planning\/["']/);
assert.match(nextConfig, /source:\s*["']\/tools\/fhc\/:path\*["']/);
assert.match(nextConfig, /destination:\s*["']\/tools\/financial-health-check\/["']/);
assert.match(nextConfig, /SECURITY_HEADERS/);

for (const legacyStaticArtifact of ['public/CNAME', 'public/.nojekyll', 'public/_headers', 'scripts/postprocess-static.mjs']) {
  assert.equal(existsSync(new URL(`../${legacyStaticArtifact}`, import.meta.url)), false, `${legacyStaticArtifact} must stay retired`);
}

for (const retiredRoute of ['app/living-benefits', 'app/tools/fhc']) {
  assert.equal(existsSync(new URL(`../${retiredRoute}`, import.meta.url)), false, `${retiredRoute} must remain an HTTP redirect, not a rendered route`);
}

for (const requiredRoute of [
  'app/blog/page.tsx',
  'app/blog/[slug]/page.tsx',
  'app/api/preview/enable/route.ts',
  'app/studio/[[...tool]]/page.tsx',
  'sanity.config.ts',
  'cms/sanity/schema.ts',
  'lib/content/sanity.ts',
  'app/sitemap.xml/route.ts',
  'app/sitemaps/core.xml/route.ts',
  'app/sitemaps/tools.xml/route.ts',
  'app/sitemaps/blog.xml/route.ts',
  'app/robots.ts',
]) {
  assert.equal(existsSync(new URL(`../${requiredRoute}`, import.meta.url)), true, `missing ${requiredRoute}`);
}

const previewRoute = read('app/api/preview/enable/route.ts');
assert.match(previewRoute, /defineEnableDraftMode/);
assert.match(previewRoute, /IS_REVIEW_ENVIRONMENT/);
assert.match(previewRoute, /SANITY_API_READ_TOKEN/);
assert.doesNotMatch(previewRoute, /draft\.enable\(\)/);

const studioPage = read('app/studio/[[...tool]]/page.tsx');
assert.match(studioPage, /IS_REVIEW_ENVIRONMENT/);
assert.match(studioPage, /NextStudio/);

const sanityConfig = read('sanity.config.ts');
assert.match(sanityConfig, /basePath:\s*["']\/studio["']/);
assert.match(sanityConfig, /presentationTool/);
assert.match(sanityConfig, /\/api\/preview\/enable/);
assert.doesNotMatch(sanityConfig, /SANITY_API_(READ|WRITE)_TOKEN/);

const sanityProvider = read('lib/content/sanity.ts');
assert.match(sanityProvider, /perspective:\s*includeDrafts \? "drafts" : "published"/);
assert.match(sanityProvider, /import "server-only"/);
assert.match(sanityProvider, /portableTextToArticleBlocks/);

const provider = read('lib/content/provider.ts');
assert.match(provider, /hasSanityConfig \? sanityContentProvider : localContentProvider/);

const blogSitemap = read('app/sitemaps/blog.xml/route.ts');
assert.match(blogSitemap, /includeDrafts:\s*false/);

const articlePage = read('app/blog/[slug]/page.tsx');
assert.match(articlePage, /index:\s*false,\s*follow:\s*false/);
assert.match(articlePage, /blog\.ccpun\.com|blog-article-hero|Financial/);

const navbar = read('components/Navbar.tsx');
assert.match(navbar, /href="\/blog\/"/);


const articleSchema = read('lib/content/schema.ts');
assert.match(articleSchema, /article\.status !== "published"/);
assert.match(articleSchema, /"@type": "BlogPosting"/);
assert.match(articleSchema, /"@type": "BreadcrumbList"/);
assert.match(articleSchema, /"@type": "FAQPage"/);

const articleFaq = read('components/Blog/ArticleFaq.tsx');
assert.match(articleFaq, /คำถามที่พบบ่อย/);
assert.match(articlePage, /<ArticleFaq items=\{article\.faq \?\? \[\]\} \/>/);

const sanityModel = read('cms/sanity/content-model.ts');
assert.match(sanityModel, /reviewWorkflow/);
assert.match(sanityModel, /faqItem/);
assert.match(sanityModel, /reviewMetadata/);
assert.match(sanityModel, /FAQPage structured data may only be emitted/);

const sanitySchema = read('cms/sanity/schema.ts');
for (const schemaType of ['article', 'author', 'category', 'faqItem', 'sourceReference', 'reviewMetadata', 'seoMetadata', 'geoMetadata', 'imageWithAlt', 'portableText']) {
  assert.match(sanitySchema, new RegExp(`name: ["']${schemaType}["']`));
}

const deploymentEnvironment = read('lib/deployment-environment.ts');
assert.match(deploymentEnvironment, /VERCEL_ENV === "preview"/);
assert.match(deploymentEnvironment, /CCPUN_UAT_MODE === "1"/);
assert.match(deploymentEnvironment, /VERCEL_ENV === "production"/);
assert.match(deploymentEnvironment, /CCPUN_ENABLE_PRODUCTION_ANALYTICS === "1"/);

const robotsRoute = read('app/robots.ts');
assert.match(robotsRoute, /IS_REVIEW_ENVIRONMENT/);
assert.match(robotsRoute, /disallow: "\/"/);

assert.match(nextConfig, /X-Robots-Tag/);
assert.match(nextConfig, /noindex, nofollow/);

const rootLayout = read('app/layout.tsx');
assert.match(rootLayout, /PRODUCTION_ANALYTICS_ENABLED/);
assert.match(rootLayout, /robots: IS_REVIEW_ENVIRONMENT/);
assert.doesNotMatch(rootLayout, /SanityLive/);

console.log('PASS: Vercel-native regression');
