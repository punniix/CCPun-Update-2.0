import { getArticleSemanticTopic } from '@/lib/content/taxonomy';
import { getArticlePath } from '@/lib/content/url';
import snapshot from './blogMirror.index.snapshot.json';
import { WEBSITE43_BASE as BASE } from './constants';

export type Website43ArticleItem = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  meta: string;
  publishedAt: string;
  image: string;
  href: string;
};

type MirrorIndexArticle = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  tags?: string[] | null;
  publishedAt: string;
  contentUpdatedAt?: string | null;
  category: { title: string; slug: string };
  author?: { name: string; slug: string } | null;
  migratedFeaturedImage?: { src: string; alt: string; width: number; height: number } | null;
};

const thaiDateFormatter = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Bangkok',
});

function toWebsite43Article(article: MirrorIndexArticle): Website43ArticleItem {
  const semanticTopic = getArticleSemanticTopic({
    articleSlug: article.slug,
    categoryTitle: article.category.title,
    categorySlug: article.category.slug,
    tags: article.tags,
  });
  const articlePath = getArticlePath({
    slug: article.slug,
    category: article.category.title,
    categorySlug: article.category.slug,
  });

  return {
    slug: article.slug,
    category: semanticTopic?.title ?? article.category.title,
    title: article.title,
    excerpt: article.excerpt?.trim() || article.title,
    meta: `เผยแพร่ ${thaiDateFormatter.format(new Date(article.publishedAt))}`,
    publishedAt: article.publishedAt,
    image: article.migratedFeaturedImage?.src ?? '/assets/blog-hub-hero-ccpun-v1.webp',
    href: `${BASE}${articlePath}`,
  };
}

export const website43Articles = (snapshot.articles as MirrorIndexArticle[]).map(toWebsite43Article);

export const website43ArticlesByPublished = [...website43Articles].sort(
  (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
);
