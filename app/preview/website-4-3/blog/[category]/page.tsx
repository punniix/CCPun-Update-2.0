import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';
import Website43Blog from '@/features/website-43-uat/Website43Blog';
import { toWebsite43ArticleItems } from '@/features/website-43-uat/blogData';
import { listWebsite43PreviewArticles } from '@/features/website-43-uat/blogPreviewData';
import { WEBSITE43_BLOG_CATEGORIES } from '@/features/website-43-uat/constants';
import { getBlogTopicHub, isArticleInSemanticTopic } from '@/lib/content/taxonomy';

export default async function Page({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const categoryConfig = WEBSITE43_BLOG_CATEGORIES.find((item) => item.slug === category);
  if (!categoryConfig || categoryConfig.slug === null) notFound();

  const hub = getBlogTopicHub(categoryConfig.slug);
  if (!hub) notFound();

  const { isEnabled } = await draftMode();
  const articles = await listWebsite43PreviewArticles({ includeDrafts: isEnabled });
  const categoryArticles = articles.filter((article) => isArticleInSemanticTopic({
    articleSlug: article.slug,
    semanticTopic: article.semanticTopic,
    categoryTitle: article.category,
    categorySlug: article.categorySlug,
    tags: article.tags,
  }, hub.slug));

  return (
    <Website43Blog
      articles={toWebsite43ArticleItems(categoryArticles)}
      activeCategorySlug={categoryConfig.slug}
    />
  );
}
