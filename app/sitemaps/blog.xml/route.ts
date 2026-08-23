import { getContentProvider } from "@/lib/content/provider";
import { renderUrlSet, xmlResponse } from "@/lib/sitemap/xml";
import { getArticleCanonical, isArticleCanonicalAligned } from "@/lib/content/url";

export async function GET() {
  const articles = await getContentProvider().listArticles({ includeDrafts: false });
  return xmlResponse(
    renderUrlSet(
      articles.filter(isArticleCanonicalAligned).map((article) => ({
        loc: getArticleCanonical(article),
        lastmod: article.updatedAt,
      })),
    ),
  );
}
