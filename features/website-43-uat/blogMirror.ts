import snapshot from './blogMirror.snapshot.json';

export type Website43MirrorSpan = { text: string; marks?: string[] | null };
export type Website43MirrorMarkDef = {
  _key: string;
  _type: string;
  href?: string | null;
  openInNewTab?: boolean | null;
  nofollow?: boolean | null;
  sponsored?: boolean | null;
};
export type Website43MirrorBodyItem = {
  _key?: string;
  _type: string;
  style?: string | null;
  listItem?: string | null;
  children?: Website43MirrorSpan[] | null;
  markDefs?: Website43MirrorMarkDef[] | null;
  src?: string | null;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
  caption?: string | null;
  headers?: string[] | null;
  rows?: string[][] | null;
  title?: string | null;
  text?: string | null;
};
export type Website43MirrorArticle = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  tags?: string[] | null;
  publishedAt: string;
  contentUpdatedAt?: string | null;
  migration?: { sourceModifiedAt?: string | null } | null;
  category: { title: string; slug: string };
  author: {
    name: string;
    slug: string;
    bio?: string | null;
    credentials?: string[] | null;
    sameAs?: string[] | null;
  };
  migratedFeaturedImage?: {
    src: string;
    alt: string;
    width: number;
    height: number;
    caption?: string | null;
  } | null;
  body: Website43MirrorBodyItem[];
  faq?: Array<{ question: string; answer: string }> | null;
  sources?: Array<{ label: string; url?: string | null; publisher?: string | null; accessedAt?: string | null }> | null;
  seo?: Record<string, unknown> | null;
  geo?: Record<string, unknown> | null;
};

export const website43MirrorArticles = snapshot.articles as Website43MirrorArticle[];

export function getWebsite43MirrorArticle(slug: string) {
  return website43MirrorArticles.find((article) => article.slug === slug) ?? null;
}
