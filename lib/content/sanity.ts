import "server-only";

import { createClient, groq } from "next-sanity";
import { z } from "zod";
import type { Article, ArticleBlock, ContentProvider } from "./types";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_READ_TOKEN;

export const hasSanityConfig = Boolean(projectId && dataset);

const client = hasSanityConfig
  ? createClient({ projectId: projectId!, dataset: dataset!, apiVersion: "2026-08-18", useCdn: false })
  : null;

const spanSchema = z.object({ text: z.string() });
const portableBlockSchema = z.object({
  _type: z.literal("block"),
  style: z.string().nullish(),
  listItem: z.string().nullish(),
  children: z.array(spanSchema),
});
const calloutSchema = z.object({ _type: z.literal("callout"), title: z.string().nullish(), text: z.string() });
const bodyItemSchema = z.union([portableBlockSchema, calloutSchema]);

const rawArticleSchema = z.object({
  _id: z.string(),
  _originalId: z.string().nullish(),
  slug: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()).nullish(),
  authorName: z.string().min(1),
  publishedAt: z.string().nullish(),
  updatedAt: z.string().min(1),
  seo: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    canonical: z.string().url().nullish(),
    noindex: z.boolean().nullish(),
  }),
  featuredImage: z
    .object({
      src: z.string().url(),
      alt: z.string().min(1),
      width: z.number().positive(),
      height: z.number().positive(),
      caption: z.string().nullish(),
      credit: z.string().nullish(),
    })
    .nullish(),
  body: z.array(bodyItemSchema),
  faq: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).nullish(),
  sources: z
    .array(
      z.object({
        label: z.string().min(1),
        url: z.string().url().nullish(),
        publisher: z.string().nullish(),
        accessedAt: z.string().nullish(),
      }),
    )
    .nullish(),
  review: z
    .object({
      status: z.enum(["drafting", "content-review", "fact-check", "compliance-review", "ready-for-coo", "approved"]).optional(),
      contentReviewedAt: z.string().nullish(),
      factCheckedAt: z.string().nullish(),
      complianceReviewedAt: z.string().nullish(),
    })
    .nullish(),
  geo: z
    .object({
      summary: z.string().nullish(),
      keyEntities: z.array(z.string()).nullish(),
      keyQuestions: z.array(z.string()).nullish(),
    })
    .nullish(),
});

type RawArticle = z.infer<typeof rawArticleSchema>;
type PortableBodyItem = z.infer<typeof bodyItemSchema>;

export function portableTextToArticleBlocks(items: PortableBodyItem[]): ArticleBlock[] {
  const result: ArticleBlock[] = [];
  let listType: "bulletList" | "numberList" | null = null;
  let listItems: string[] = [];

  const flushList = () => {
    if (listType && listItems.length) result.push({ type: listType, items: listItems });
    listType = null;
    listItems = [];
  };

  for (const item of items) {
    if (item._type === "callout") {
      flushList();
      result.push({ type: "callout", title: item.title ?? undefined, text: item.text });
      continue;
    }

    const text = item.children.map((child) => child.text).join("").trim();
    if (!text) continue;

    if (item.listItem === "bullet" || item.listItem === "number") {
      const nextType = item.listItem === "bullet" ? "bulletList" : "numberList";
      if (listType !== nextType) flushList();
      listType = nextType;
      listItems.push(text);
      continue;
    }

    flushList();
    if (item.style === "h2" || item.style === "h3") {
      result.push({ type: "heading", level: item.style === "h2" ? 2 : 3, text });
    } else if (item.style === "blockquote") {
      result.push({ type: "quote", text });
    } else {
      result.push({ type: "paragraph", text });
    }
  }

  flushList();
  return result;
}

function toArticle(rawInput: unknown): Article {
  const raw: RawArticle = rawArticleSchema.parse(rawInput);
  const originalId = raw._originalId ?? raw._id;
  const status = originalId.startsWith("drafts.") ? "draft" : "published";

  return {
    id: originalId,
    slug: raw.slug,
    title: raw.title,
    excerpt: raw.excerpt,
    category: raw.category,
    tags: raw.tags ?? undefined,
    authorName: raw.authorName,
    status,
    publishedAt: raw.publishedAt ?? undefined,
    updatedAt: raw.updatedAt,
    seoTitle: raw.seo.title,
    seoDescription: raw.seo.description,
    canonical: raw.seo.canonical ?? undefined,
    noindex: raw.seo.noindex ?? false,
    featuredImage: raw.featuredImage
      ? {
          src: raw.featuredImage.src,
          alt: raw.featuredImage.alt,
          width: raw.featuredImage.width,
          height: raw.featuredImage.height,
          caption: raw.featuredImage.caption ?? undefined,
          credit: raw.featuredImage.credit ?? undefined,
        }
      : undefined,
    body: portableTextToArticleBlocks(raw.body),
    faq: raw.faq ?? undefined,
    sources: raw.sources?.map((source) => ({
      label: source.label,
      url: source.url ?? undefined,
      publisher: source.publisher ?? undefined,
      accessedAt: source.accessedAt ?? undefined,
    })),
    review: raw.review
      ? {
          status: raw.review.status,
          contentReviewedAt: raw.review.contentReviewedAt ?? undefined,
          factCheckedAt: raw.review.factCheckedAt ?? undefined,
          complianceReviewedAt: raw.review.complianceReviewedAt ?? undefined,
        }
      : undefined,
    geo: raw.geo
      ? {
          summary: raw.geo.summary ?? undefined,
          keyEntities: raw.geo.keyEntities ?? undefined,
          keyQuestions: raw.geo.keyQuestions ?? undefined,
        }
      : undefined,
  };
}

const articleProjection = groq`{
  _id,
  _originalId,
  "slug": slug.current,
  title,
  excerpt,
  "category": category->title,
  tags,
  "authorName": author->name,
  publishedAt,
  "updatedAt": _updatedAt,
  seo,
  "featuredImage": select(defined(featuredImage.asset) => {
    "src": featuredImage.asset->url,
    "width": featuredImage.asset->metadata.dimensions.width,
    "height": featuredImage.asset->metadata.dimensions.height,
    "alt": featuredImage.alt,
    "caption": featuredImage.caption,
    "credit": featuredImage.credit
  }),
  body[]{_type, style, listItem, children[]{text}, title, text},
  faq[]{question, answer},
  sources[]{label, url, publisher, accessedAt},
  review,
  geo
}`;

const listQuery = groq`*[_type == "article" && defined(slug.current)] | order(coalesce(publishedAt, _updatedAt) desc) ${articleProjection}`;
const bySlugQuery = groq`*[_type == "article" && slug.current == $slug][0] ${articleProjection}`;

function configuredClient(includeDrafts: boolean) {
  if (!client) throw new Error("Sanity is not configured");
  if (includeDrafts && !token) throw new Error("Sanity Draft Mode requires SANITY_API_READ_TOKEN");
  return client.withConfig({
    perspective: includeDrafts ? "drafts" : "published",
    token: token || undefined,
    useCdn: false,
  });
}

export function getSanityPreviewClient() {
  return configuredClient(true);
}

export const sanityContentProvider: ContentProvider = {
  async listArticles(options = {}) {
    try {
      const rows = await configuredClient(options.includeDrafts === true).fetch<unknown[]>(listQuery);
      return z.array(z.unknown()).parse(rows).map(toArticle);
    } catch {
      throw new Error("Sanity content request failed; details redacted");
    }
  },
  async getArticleBySlug(slug, options = {}) {
    try {
      const row = await configuredClient(options.includeDrafts === true).fetch<unknown>(bySlugQuery, { slug });
      return row ? toArticle(row) : null;
    } catch {
      throw new Error("Sanity content request failed; details redacted");
    }
  },
};
