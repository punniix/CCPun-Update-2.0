export const ACTIVE_ARTICLE_CATEGORIES = [
  { slug: "personal-finance", title: "การเงินส่วนบุคคล" },
  { slug: "life-insurance", title: "ประกันชีวิต" },
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

export const LEGACY_CATEGORY_TOPICS = {
  "health-insurance": "ประกันสุขภาพ",
  "critical-illness": "ประกันโรคร้ายแรง",
} as const;

const LEGACY_TOPIC_BY_TITLE: Record<string, string> = {
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
  const legacySlugTopic = LEGACY_CATEGORY_TOPICS[slug as keyof typeof LEGACY_CATEGORY_TOPICS];
  const legacyTitleTopic = LEGACY_TOPIC_BY_TITLE[title];
  const combinedLegacyTitle = title === "ประกันสุขภาพและโรคร้ายแรง";
  const slugCategory = activeSlugs.has(slug) ? slug : legacySlugTopic ? "life-insurance" : null;
  const titleCategory = activeSlugByTitle.get(title) ?? (legacyTitleTopic || combinedLegacyTitle ? "life-insurance" : null);
  const categoryConflict = Boolean(slugCategory && titleCategory && slugCategory !== titleCategory);
  const inheritedTopics = legacySlugTopic
    ? [legacySlugTopic]
    : combinedLegacyTitle
      ? Object.values(LEGACY_CATEGORY_TOPICS)
      : legacyTitleTopic
        ? [legacyTitleTopic]
        : [];

  return {
    categorySlug: categoryConflict ? null : slugCategory ?? titleCategory,
    tags: normalizeTags([...(tags ?? []), ...inheritedTopics]),
  };
}

export function isReservedArticleSlug(slug?: string | null) {
  return Boolean(slug && Object.hasOwn(LEGACY_CATEGORY_TOPICS, slug));
}
