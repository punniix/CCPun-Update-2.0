import { getContentProvider } from "@/lib/content/provider";
import { renderUrlSet, xmlResponse } from "@/lib/sitemap/xml";

export async function GET() {
  const articles = await getContentProvider().listArticles({ includeDrafts: false });
  return xmlResponse(
    renderUrlSet(
      articles.map((article) => ({
        loc: `https://ccpun.com/blog/${article.slug}/`,
        lastmod: article.updatedAt,
      })),
    ),
  );
}
