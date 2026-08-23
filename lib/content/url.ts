import type { Article } from "./types";
import { LEGACY_CATEGORY_TOPICS, normalizeArticleTaxonomy } from "./taxonomy";

// URL Migration V2: every interim /life-insurance/ article path redirects
// directly to the final semantic destination. Do not add a hop through any
// historical path; Google and users should see one permanent redirect only.
const MOVED_ARTICLE_PATHS: Record<string, string> = {
  "life-insurance/aia-health-happy-describe": "/blog/health-insurance/aia-health-happy-describe/",
  "life-insurance/aia-health-ci-hero-guide": "/blog/health-insurance/aia-health-ci-hero-guide/",
  "life-insurance/critical-illness-insurance": "/blog/critical-illness/critical-illness-insurance/",
};

export function getArticleCategorySlug(article: Pick<Article, "category" | "categorySlug">) {
  const slug = normalizeArticleTaxonomy({
    categoryTitle: article.category,
    categorySlug: article.categorySlug,
  }).categorySlug;
  if (!slug) throw new Error("Unsupported article category");
  return slug;
}

export function getArticlePath(article: Pick<Article, "slug" | "category" | "categorySlug">) {
  return `/blog/${getArticleCategorySlug(article)}/${article.slug}/`;
}

export function getArticleCanonical(article: Pick<Article, "slug" | "category" | "categorySlug" | "canonical">) {
  return article.canonical ?? `https://ccpun.com${getArticlePath(article)}`;
}

export function isArticleCanonicalAligned(article: Pick<Article, "slug" | "category" | "categorySlug" | "canonical">) {
  try {
    const canonical = new URL(getArticleCanonical(article));
    return canonical.origin === "https://ccpun.com"
      && canonical.pathname === getArticlePath(article)
      && !canonical.username
      && !canonical.password
      && !canonical.search
      && !canonical.hash;
  } catch {
    return false;
  }
}

export function getLegacyCategoryRedirectPath(segment: string) {
  const topic = LEGACY_CATEGORY_TOPICS[segment as keyof typeof LEGACY_CATEGORY_TOPICS];
  return topic ? `/blog/?tag=${encodeURIComponent(topic)}` : null;
}

export function getMovedArticleRedirectPath(category: string, slug: string) {
  return MOVED_ARTICLE_PATHS[`${category}/${slug}`] ?? null;
}
