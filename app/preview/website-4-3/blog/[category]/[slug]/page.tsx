import { notFound, permanentRedirect } from 'next/navigation';
import Website43Article from '@/features/website-43-uat/Website43Article';
import { getWebsite43MirrorArticle } from '@/features/website-43-uat/blogMirror';
import { WEBSITE43_BASE } from '@/features/website-43-uat/constants';
import { getArticlePath } from '@/lib/content/url';

export default async function Page({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const article = getWebsite43MirrorArticle(slug);
  if (!article) notFound();

  const articlePath = getArticlePath({
    slug: article.slug,
    category: article.category.title,
    categorySlug: article.category.slug,
  });
  const expectedCategory = articlePath.split('/')[2];
  if (category !== expectedCategory) permanentRedirect(`${WEBSITE43_BASE}${articlePath}`);

  return <Website43Article article={article} />;
}
