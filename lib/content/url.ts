import type { Article } from "./types";
import { LEGACY_CATEGORY_TOPICS, normalizeArticleTaxonomy } from "./taxonomy";

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
