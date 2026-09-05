import type { Metadata } from 'next';
import type { Article } from './types';
import { getArticleCanonical, isArticleCanonicalAligned } from './url';

const DEFAULT_SOCIAL_IMAGE = '/assets/blog-hub-hero-ccpun-v1.webp';

export function buildArticleMetadata(
  article: Article | null,
  options: { categoryMatches: boolean; forceNoindex?: boolean } = { categoryMatches: true },
): Metadata {
  if (!article) {
    return {
      title: 'ไม่พบหน้า | CCPun',
      robots: { index: false, follow: true },
    };
  }

  if (!options.categoryMatches) return { robots: { index: false, follow: true } };

  const canonical = getArticleCanonical(article);
  const isDraft = article.status !== 'published';
  const noindex = options.forceNoindex === true || isDraft || article.noindex === true || !isArticleCanonicalAligned(article);
  const socialImage = article.ogImage?.src ?? article.featuredImage?.src ?? DEFAULT_SOCIAL_IMAGE;
  const socialAlt = article.ogImage?.alt ?? article.featuredImage?.alt ?? 'CCPun บทความวางแผนการเงิน';

  return {
    title: article.seoTitle,
    description: article.seoDescription,
    alternates: { canonical },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: 'article',
      locale: 'th_TH',
      url: canonical,
      title: article.ogTitle || article.seoTitle,
      description: article.ogDescription || article.seoDescription,
      siteName: 'CCPun Financial Advisor',
      images: [{ url: socialImage, alt: socialAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.ogTitle || article.seoTitle,
      description: article.ogDescription || article.seoDescription,
      images: [socialImage],
    },
  };
}
