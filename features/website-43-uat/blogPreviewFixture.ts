import 'server-only';

import type { Article, ArticleBlock, ArticleInline, ArticleRichText } from '@/lib/content/types';
import snapshot from './blogPreviewFixture.snapshot.json';

type RawSpan = { text: string; marks?: string[] | null };
type RawMark = { _key: string; href?: string | null; openInNewTab?: boolean | null; nofollow?: boolean | null; sponsored?: boolean | null };
type RawBodyItem = {
  _type: string;
  style?: string | null;
  listItem?: string | null;
  children?: RawSpan[] | null;
  markDefs?: RawMark[] | null;
  src?: string | null;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
  caption?: string | null;
  headers?: string[] | null;
  rows?: string[][] | null;
};
type RawMirrorArticle = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  tags?: string[] | null;
  publishedAt: string;
  contentUpdatedAt?: string | null;
  migration?: { sourceModifiedAt?: string | null } | null;
  category: { title: string; slug: string };
  author: { name: string };
  migratedFeaturedImage?: { src: string; alt: string; width: number; height: number; caption?: string | null } | null;
  body: RawBodyItem[];
  faq?: Array<{ question: string; answer: string }> | null;
  sources?: Array<{ label: string; url?: string | null; publisher?: string | null; accessedAt?: string | null }> | null;
  seo?: { title?: string | null; description?: string | null; ogTitle?: string | null; ogDescription?: string | null; semanticTopic?: string | null; canonical?: string | null; noindex?: boolean | null } | null;
  geo?: { summary?: string | null; keyEntities?: string[] | null; keyQuestions?: string[] | null } | null;
};

function richText(item: RawBodyItem): ArticleRichText {
  const markDefs = new Map((item.markDefs ?? []).map((mark) => [mark._key, mark]));
  const segments: ArticleInline[] = (item.children ?? [])
    .filter((child) => child.text.length > 0)
    .map((child) => {
      const marks = child.marks ?? [];
      const linkKey = marks.find((mark) => markDefs.has(mark));
      const link = linkKey ? markDefs.get(linkKey) : undefined;
      return {
        text: child.text,
        ...(link?.href ? { href: link.href } : {}),
        ...(link?.openInNewTab ? { openInNewTab: true } : {}),
        ...(link?.nofollow ? { nofollow: true } : {}),
        ...(link?.sponsored ? { sponsored: true } : {}),
        ...(marks.includes('strong') ? { strong: true } : {}),
        ...(marks.includes('em') ? { emphasis: true } : {}),
      };
    });
  const text = segments.map((segment) => segment.text).join('').trim();
  return { text, ...(segments.some((segment) => segment.href || segment.strong || segment.emphasis) ? { segments } : {}) };
}

function normalizeBody(items: RawBodyItem[]): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  let listType: 'bulletList' | 'numberList' | null = null;
  let listItems: ArticleRichText[] = [];
  const flush = () => {
    if (listType && listItems.length) blocks.push({ type: listType, items: listItems });
    listType = null;
    listItems = [];
  };

  for (const item of items) {
    if (item._type === 'block') {
      const rich = richText(item);
      if (!rich.text) continue;
      if (item.listItem === 'bullet' || item.listItem === 'number') {
        const next = item.listItem === 'bullet' ? 'bulletList' : 'numberList';
        if (listType !== next) flush();
        listType = next;
        listItems.push(rich);
        continue;
      }
      flush();
      if (item.style === 'h2' || item.style === 'h3') blocks.push({ type: 'heading', level: item.style === 'h2' ? 2 : 3, ...rich });
      else if (item.style === 'blockquote') blocks.push({ type: 'quote', ...rich });
      else blocks.push({ type: 'paragraph', ...rich });
      continue;
    }
    flush();
    if (item._type === 'migratedImage' && item.src && item.alt && item.width && item.height) {
      blocks.push({ type: 'image', src: item.src, alt: item.alt, width: item.width, height: item.height, caption: item.caption ?? undefined });
    } else if (item._type === 'simpleTable') {
      blocks.push({ type: 'table', headers: item.headers ?? [], rows: item.rows ?? [] });
    } else if (item._type === 'divider') {
      blocks.push({ type: 'divider' });
    }
  }
  flush();
  return blocks;
}

function normalizeArticle(raw: RawMirrorArticle): Article {
  const updatedAt = raw.contentUpdatedAt ?? raw.migration?.sourceModifiedAt ?? raw.publishedAt;
  return {
    id: raw._id,
    slug: raw.slug,
    title: raw.title,
    excerpt: raw.excerpt?.trim() || raw.title,
    category: raw.category.title,
    categorySlug: raw.category.slug,
    tags: raw.tags ?? undefined,
    semanticTopic: raw.seo?.semanticTopic ?? undefined,
    authorName: raw.author.name,
    status: 'draft',
    publishedAt: raw.publishedAt,
    updatedAt,
    seoTitle: raw.seo?.title?.trim() || raw.title,
    seoDescription: raw.seo?.description?.trim() || raw.excerpt?.trim() || raw.title,
    ogTitle: raw.seo?.ogTitle ?? undefined,
    ogDescription: raw.seo?.ogDescription ?? undefined,
    canonical: raw.seo?.canonical ?? undefined,
    noindex: raw.seo?.noindex ?? false,
    featuredImage: raw.migratedFeaturedImage
      ? {
          src: raw.migratedFeaturedImage.src,
          alt: raw.migratedFeaturedImage.alt,
          width: raw.migratedFeaturedImage.width,
          height: raw.migratedFeaturedImage.height,
          caption: raw.migratedFeaturedImage.caption ?? undefined,
        }
      : undefined,
    body: normalizeBody(raw.body),
    faq: raw.faq ?? undefined,
    sources: raw.sources?.map((source) => ({
      label: source.label,
      url: source.url ?? undefined,
      publisher: source.publisher ?? undefined,
      accessedAt: source.accessedAt ?? undefined,
    })),
    geo: raw.geo
      ? {
          summary: raw.geo.summary ?? undefined,
          keyEntities: raw.geo.keyEntities ?? undefined,
          keyQuestions: raw.geo.keyQuestions ?? undefined,
        }
      : undefined,
  };
}

const fixtureArticles = (snapshot.articles as RawMirrorArticle[]).map(normalizeArticle);

export function listWebsite43PreviewFixtureArticles(): Article[] {
  return fixtureArticles.map((article) => structuredClone(article));
}

export function getWebsite43PreviewFixtureArticle(slug: string): Article | null {
  const article = fixtureArticles.find((candidate) => candidate.slug === slug);
  return article ? structuredClone(article) : null;
}
