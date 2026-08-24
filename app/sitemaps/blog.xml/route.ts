import { getContentProvider } from "@/lib/content/provider";
import { BLOG_TOPIC_HUBS, isArticleInSemanticTopic } from "@/lib/content/taxonomy";
import { renderUrlSet, xmlResponse } from "@/lib/sitemap/xml";
import { getArticleCanonical, isArticleCanonicalAligned } from "@/lib/content/url";

function latestUpdatedAt(values: string[]) {
  return values.reduce((latest, value) => (value > latest ? value : latest), values[0] ?? "");
}

export async function GET() {
  const articles = await getContentProvider().listArticles({ includeDrafts: false });
  const canonicalArticles = articles.filter(isArticleCanonicalAligned);
  const indexableArticles = canonicalArticles.filter(
    (article) => article.status === "published" && article.noindex !== true,
  );
  const articleEntries = indexableArticles.map((article) => ({
    loc: getArticleCanonical(article),
    lastmod: article.updatedAt,
  }));

  const hubEntries = BLOG_TOPIC_HUBS.flatMap((hub) => {
    if (!hub.indexable) return [];
    const relevant = indexableArticles.filter((article) =>
      isArticleInSemanticTopic(
        {
          articleSlug: article.slug,
          semanticTopic: article.semanticTopic,
          categoryTitle: article.category,
          categorySlug: article.categorySlug,
          tags: article.tags,
        },
        hub.slug,
      ),
    );
    if (!relevant.length) return [];
    return [{
      loc: `https://ccpun.com/blog/${hub.slug}/`,
      lastmod: latestUpdatedAt(relevant.map((article) => article.updatedAt)),
    }];
  });

  return xmlResponse(renderUrlSet([...hubEntries, ...articleEntries]));
}
