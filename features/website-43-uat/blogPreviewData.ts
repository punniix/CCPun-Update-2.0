import 'server-only';

import type { Article } from '@/lib/content/types';
import { getContentProvider } from '@/lib/content/provider';
import { IS_REVIEW_ENVIRONMENT } from '@/lib/deployment-environment';
import { getWebsite43PreviewFixtureArticle, listWebsite43PreviewFixtureArticles } from './blogPreviewFixture';

export async function listWebsite43PreviewArticles(options: { includeDrafts?: boolean } = {}): Promise<Article[]> {
  try {
    const articles = await getContentProvider().listArticles(options);
    if (articles.length > 0 || !IS_REVIEW_ENVIRONMENT) return articles;
  } catch (error) {
    if (!IS_REVIEW_ENVIRONMENT) throw error;
  }
  return listWebsite43PreviewFixtureArticles();
}

export async function getWebsite43PreviewArticle(slug: string, options: { includeDrafts?: boolean } = {}): Promise<Article | null> {
  try {
    const article = await getContentProvider().getArticleBySlug(slug, options);
    if (article || !IS_REVIEW_ENVIRONMENT) return article;
  } catch (error) {
    if (!IS_REVIEW_ENVIRONMENT) throw error;
  }
  return getWebsite43PreviewFixtureArticle(slug);
}
