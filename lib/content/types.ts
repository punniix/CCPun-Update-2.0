export type ArticleStatus = "draft" | "published";

export type ArticleBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "bulletList"; items: string[] }
  | { type: "numberList"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "callout"; title?: string; text: string };

export type ArticleSource = {
  label: string;
  url?: string;
  publisher?: string;
  accessedAt?: string;
};

export type ArticleFaq = {
  question: string;
  answer: string;
};

export type ArticleReview = {
  status?: "drafting" | "content-review" | "fact-check" | "compliance-review" | "ready-for-coo" | "approved";
  contentReviewedAt?: string;
  factCheckedAt?: string;
  complianceReviewedAt?: string;
};

export type ArticleGeo = {
  summary?: string;
  keyEntities?: string[];
  keyQuestions?: string[];
};

export type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags?: string[];
  authorName: string;
  status: ArticleStatus;
  publishedAt?: string;
  updatedAt: string;
  seoTitle: string;
  seoDescription: string;
  canonical?: string;
  noindex?: boolean;
  featuredImage?: {
    src: string;
    alt: string;
    width: number;
    height: number;
    caption?: string;
    credit?: string;
  };
  body: ArticleBlock[];
  faq?: ArticleFaq[];
  sources?: ArticleSource[];
  geo?: ArticleGeo;
  review?: ArticleReview;
};

export interface ContentProvider {
  listArticles(options?: { includeDrafts?: boolean }): Promise<Article[]>;
  getArticleBySlug(slug: string, options?: { includeDrafts?: boolean }): Promise<Article | null>;
}
