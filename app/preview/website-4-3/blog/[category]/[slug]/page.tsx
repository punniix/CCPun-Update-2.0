import type { Metadata } from 'next';
import { draftMode } from 'next/headers';
import { notFound, permanentRedirect } from 'next/navigation';
import Website43Article from '@/features/website-43-uat/Website43Article';
import { getWebsite43PreviewArticle, listWebsite43PreviewArticles } from '@/features/website-43-uat/blogPreviewData';
import { WEBSITE43_BASE } from '@/features/website-43-uat/constants';
import { buildArticleMetadata } from '@/lib/content/article-metadata';
import { buildArticleSchemaGraph } from '@/lib/content/structured-data/article-schema';
import { serializeJsonLd } from '@/lib/content/structured-data/serialize-json-ld';
import { getArticleCategorySlug, getArticlePath, getMovedArticleRedirectPath, isArticleCanonicalAligned } from '@/lib/content/url';

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }): Promise<Metadata> {
  const { category, slug } = await params;
  const { isEnabled } = await draftMode();
  const article = await getWebsite43PreviewArticle(slug, { includeDrafts: isEnabled });
  return buildArticleMetadata(article, {
    categoryMatches: article ? category === getArticleCategorySlug(article) : true,
    forceNoindex: true,
  });
}

export default async function Page({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const movedPath = getMovedArticleRedirectPath(category, slug);
  if (movedPath) permanentRedirect(`${WEBSITE43_BASE}${movedPath}`);

  const { isEnabled } = await draftMode();
  const article = await getWebsite43PreviewArticle(slug, { includeDrafts: isEnabled });
  if (!article) notFound();

  if (category !== getArticleCategorySlug(article)) permanentRedirect(`${WEBSITE43_BASE}${getArticlePath(article)}`);

  const relatedArticles = (await listWebsite43PreviewArticles({ includeDrafts: isEnabled }))
    .filter((candidate) => candidate.slug !== article.slug)
    .slice(0, 2);
  const schema = isArticleCanonicalAligned(article) ? buildArticleSchemaGraph(article) : null;

  return (
    <>
      {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />}
      <Website43Article article={article} relatedArticles={relatedArticles} />
    </>
  );
}
