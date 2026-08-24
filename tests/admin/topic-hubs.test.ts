import assert from "node:assert/strict";
import test from "node:test";
import { buildArticleSchemaGraph, buildBlogTopicHubSchema } from "../../lib/content/schema";
import {
  BLOG_TOPIC_HUBS,
  getArticleSemanticTopic,
  getBlogTopicHub,
  isArticleInSemanticTopic,
} from "../../lib/content/taxonomy";
import type { Article } from "../../lib/content/types";
import { getArticleCanonical, getArticlePath, getMovedArticleRedirectPath } from "../../lib/content/url";

function article(overrides: Partial<Article>): Article {
  return {
    id: "article-test",
    slug: "example",
    title: "Example",
    excerpt: "Example excerpt",
    category: "ประกันชีวิต",
    categorySlug: "life-insurance",
    tags: [],
    authorName: "CCPun",
    status: "published",
    publishedAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-23T00:00:00.000Z",
    seoTitle: "Example | CCPun",
    seoDescription: "Example description",
    noindex: false,
    body: [],
    ...overrides,
  };
}

test("Phase 1 exposes five real topic hubs while investment remains non-indexable", () => {
  assert.deepEqual(BLOG_TOPIC_HUBS.map(({ slug }) => slug), [
    "personal-finance",
    "life-insurance",
    "health-insurance",
    "critical-illness",
    "investment",
  ]);
  assert.equal(getBlogTopicHub("health-insurance")?.indexable, true);
  assert.equal(getBlogTopicHub("critical-illness")?.indexable, true);
  assert.equal(getBlogTopicHub("investment")?.indexable, false);
  assert.equal(getBlogTopicHub("unknown"), null);
});

test("semantic topic is decoupled from the current canonical URL category", () => {
  const healthHappy = article({ slug: "aia-health-happy-describe", tags: ["ประกันสุขภาพ"] });
  const healthCiHero = article({ slug: "aia-health-ci-hero-guide", tags: ["ประกันชีวิต", "ประกันสุขภาพ", "ประกันโรคร้ายแรง"] });
  const critical = article({ slug: "critical-illness-insurance", tags: ["ประกันชีวิต", "ประกันสุขภาพ", "ประกันโรคร้ายแรง"] });
  const vitality = article({ slug: "aia-vitality", tags: ["ประกันชีวิต", "ประกันสุขภาพ", "ประกันโรคร้ายแรง"] });

  assert.equal(getArticleSemanticTopic({ articleSlug: healthHappy.slug, categoryTitle: healthHappy.category, categorySlug: healthHappy.categorySlug, tags: healthHappy.tags })?.slug, "health-insurance");
  assert.equal(getArticleSemanticTopic({ articleSlug: healthCiHero.slug, categoryTitle: healthCiHero.category, categorySlug: healthCiHero.categorySlug, tags: healthCiHero.tags })?.slug, "health-insurance");
  assert.equal(getArticleSemanticTopic({ articleSlug: critical.slug, categoryTitle: critical.category, categorySlug: critical.categorySlug, tags: critical.tags })?.slug, "critical-illness");
  assert.equal(getArticleSemanticTopic({ articleSlug: vitality.slug, categoryTitle: vitality.category, categorySlug: vitality.categorySlug, tags: vitality.tags })?.slug, "life-insurance");

  assert.equal(getArticlePath(healthHappy), "/blog/life-insurance/aia-health-happy-describe/");
  assert.equal(getArticlePath(healthCiHero), "/blog/life-insurance/aia-health-ci-hero-guide/");
  assert.equal(getArticlePath(critical), "/blog/life-insurance/critical-illness-insurance/");
  assert.equal(getArticleCanonical(healthHappy), "https://ccpun.com/blog/life-insurance/aia-health-happy-describe/");
});

test("existing moved article redirects keep their original direction with no reverse redirect", () => {
  assert.equal(
    getMovedArticleRedirectPath("health-insurance", "aia-health-happy-describe"),
    "/blog/life-insurance/aia-health-happy-describe/",
  );
  assert.equal(
    getMovedArticleRedirectPath("health-insurance", "aia-health-ci-hero-guide"),
    "/blog/life-insurance/aia-health-ci-hero-guide/",
  );
  assert.equal(
    getMovedArticleRedirectPath("critical-illness", "critical-illness-insurance"),
    "/blog/life-insurance/critical-illness-insurance/",
  );
  assert.equal(getMovedArticleRedirectPath("life-insurance", "aia-health-happy-describe"), null);
  assert.equal(getMovedArticleRedirectPath("life-insurance", "critical-illness-insurance"), null);
});

test("article schema uses semantic topic for articleSection and breadcrumb but keeps canonical", () => {
  const healthHappy = article({ slug: "aia-health-happy-describe", title: "AIA Health Happy", tags: ["ประกันสุขภาพ"] });
  const schema = buildArticleSchemaGraph(healthHappy);
  assert.ok(schema);
  const graph = schema["@graph"] as Array<Record<string, unknown>>;
  const posting = graph.find((node) => node["@type"] === "BlogPosting")!;
  const breadcrumb = graph.find((node) => node["@type"] === "BreadcrumbList")!;
  const items = breadcrumb.itemListElement as Array<Record<string, unknown>>;

  assert.equal(posting.mainEntityOfPage, "https://ccpun.com/blog/life-insurance/aia-health-happy-describe/");
  assert.equal(posting.articleSection, "ประกันสุขภาพ");
  assert.equal(items[2]?.name, "ประกันสุขภาพ");
  assert.equal(items[2]?.item, "https://ccpun.com/blog/health-insurance/");
  assert.equal(items[3]?.item, "https://ccpun.com/blog/life-insurance/aia-health-happy-describe/");
});

test("hub ItemList links to article canonical URLs rather than synthetic topic leaf URLs", () => {
  const hub = getBlogTopicHub("health-insurance")!;
  const healthHappy = article({ slug: "aia-health-happy-describe", title: "AIA Health Happy", tags: ["ประกันสุขภาพ"] });
  assert.equal(isArticleInSemanticTopic({ articleSlug: healthHappy.slug, categoryTitle: healthHappy.category, categorySlug: healthHappy.categorySlug, tags: healthHappy.tags }, "health-insurance"), true);

  const schema = buildBlogTopicHubSchema(hub, [healthHappy]);
  const graph = schema["@graph"] as Array<Record<string, unknown>>;
  const itemList = graph.find((node) => node["@type"] === "ItemList")!;
  const items = itemList.itemListElement as Array<Record<string, unknown>>;
  assert.equal(items[0]?.url, "https://ccpun.com/blog/life-insurance/aia-health-happy-describe/");
});
