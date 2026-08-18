import type { Article } from "./types";

const SITE_URL = "https://ccpun.com";

export function buildArticleSchemaGraph(article: Article) {
  if (article.status !== "published" || !article.publishedAt) return null;

  const canonical = article.canonical ?? `${SITE_URL}/blog/${article.slug}/`;
  const graph: Record<string, unknown>[] = [
    {
      "@type": "BlogPosting",
      "@id": `${canonical}#article`,
      headline: article.title,
      description: article.excerpt,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
      mainEntityOfPage: canonical,
      articleSection: article.category,
      ...(article.tags?.length ? { keywords: article.tags.join(", ") } : {}),
      ...(article.featuredImage
        ? {
            image: {
              "@type": "ImageObject",
              url: article.featuredImage.src.startsWith("http")
                ? article.featuredImage.src
                : `${SITE_URL}${article.featuredImage.src}`,
              caption: article.featuredImage.caption ?? article.featuredImage.alt,
            },
          }
        : {}),
      author: { "@type": "Person", "@id": `${SITE_URL}/#person`, name: article.authorName },
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${canonical}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "หน้าแรก", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "บทความ", item: `${SITE_URL}/blog/` },
        { "@type": "ListItem", position: 3, name: article.title, item: canonical },
      ],
    },
  ];

  if (article.faq?.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${canonical}#faq`,
      mainEntity: article.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}
