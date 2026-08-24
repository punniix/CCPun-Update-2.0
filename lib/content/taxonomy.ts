export const ACTIVE_ARTICLE_CATEGORIES = [
  { slug: "personal-finance", title: "การเงินส่วนบุคคล" },
  { slug: "life-insurance", title: "ประกันชีวิต" },
  { slug: "health-insurance", title: "ประกันสุขภาพ" },
  { slug: "critical-illness", title: "ประกันโรคร้ายแรง" },
  { slug: "investment", title: "การลงทุน" },
] as const;

type ArticleTaxonomyInput = {
  categoryTitle?: string | null;
  categorySlug?: string | null;
  tags?: readonly string[] | null;
};

type NormalizedArticleTaxonomy = {
  categorySlug: string | null;
  tags: string[];
};

const activeSlugByTitle = new Map<string, string>(ACTIVE_ARTICLE_CATEGORIES.map(({ title, slug }) => [title, slug]));
const activeSlugs = new Set<string>(ACTIVE_ARTICLE_CATEGORIES.map(({ slug }) => slug));

const CATEGORY_SLUG_ALIASES: Record<string, string> = {
  "personal-finance-uat": "personal-finance",
};

// These slugs remain reserved at /blog/<segment>/ because the first-level route
// redirects the historical category landing to a filtered archive. They are also
// canonical article category slugs when used as /blog/<category>/<article>/.
export const LEGACY_CATEGORY_TOPICS = {
  "health-insurance": "ประกันสุขภาพ",
  "critical-illness": "ประกันโรคร้ายแรง",
} as const;

const TOPIC_BY_TITLE: Record<string, string> = {
  "ประกันสุขภาพ": "ประกันสุขภาพ",
  "ประกันโรคร้ายแรง": "ประกันโรคร้ายแรง",
};

function normalizeTags(tags: readonly string[]) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const tag of tags) {
    const displayTag = tag.trim();
    const dedupeKey = displayTag.toLowerCase();
    if (!displayTag || seen.has(dedupeKey)) continue;

    seen.add(dedupeKey);
    normalized.push(displayTag);
  }

  return normalized;
}

export function normalizeArticleTaxonomy({
  categoryTitle,
  categorySlug,
  tags,
}: ArticleTaxonomyInput): NormalizedArticleTaxonomy {
  const title = categoryTitle?.trim() ?? "";
  const suppliedSlug = categorySlug?.trim().toLowerCase() ?? "";
  const slug = CATEGORY_SLUG_ALIASES[suppliedSlug] ?? suppliedSlug;
  const topicFromSlug = LEGACY_CATEGORY_TOPICS[slug as keyof typeof LEGACY_CATEGORY_TOPICS];
  const topicFromTitle = TOPIC_BY_TITLE[title];
  const combinedLegacyTitle = title === "ประกันสุขภาพและโรคร้ายแรง";

  const slugCategory = activeSlugs.has(slug) ? slug : null;
  const titleCategory = activeSlugByTitle.get(title) ?? null;
  const categoryConflict = Boolean(slugCategory && titleCategory && slugCategory !== titleCategory);

  const inheritedTopics = combinedLegacyTitle
    ? Object.values(LEGACY_CATEGORY_TOPICS)
    : topicFromSlug
      ? [topicFromSlug]
      : topicFromTitle
        ? [topicFromTitle]
        : [];

  return {
    // A combined legacy title without an explicit semantic slug is intentionally
    // ambiguous and therefore fails closed. Migration code must choose the final
    // health-insurance or critical-illness category explicitly.
    categorySlug: categoryConflict ? null : slugCategory ?? titleCategory,
    tags: normalizeTags([...(tags ?? []), ...inheritedTopics]),
  };
}

export function isReservedArticleSlug(slug?: string | null) {
  return Boolean(slug && Object.hasOwn(LEGACY_CATEGORY_TOPICS, slug));
}
