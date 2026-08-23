export type ContentReadiness = {
  internalLinks: number;
  legacyInternalLinks: number;
  externalLinks: number;
  legacyFacebookCtas: number;
  faqCount: number;
  sourcesCount: number;
  migratedImages: number;
  hasNativeFeaturedImage: boolean;
  usesMigratedFeaturedImage: boolean;
  factChecked: boolean;
  complianceReviewed: boolean;
  geoCompleted: number;
  geoTotal: 4;
};

export function summarizeContentReadiness(input: {
  links: string[];
  bodyTypes: string[];
  faqCount: number;
  sourcesCount: number;
  hasNativeFeaturedImage: boolean;
  usesMigratedFeaturedImage: boolean;
  factCheckedAt?: string | null;
  complianceReviewedAt?: string | null;
  geo?: { summary?: string | null; keyEntities?: string[] | null; keyQuestions?: string[] | null; reviewedAt?: string | null } | null;
}): ContentReadiness {
  const isInternalLink = (href: string) => {
    if (href.startsWith("/") && !href.startsWith("//")) return true;
    try {
      return ["ccpun.com", "www.ccpun.com", "blog.ccpun.com"].includes(new URL(href).hostname);
    } catch {
      return false;
    }
  };
  const isLegacyInternalLink = (href: string) => {
    try {
      const url = new URL(href, "https://ccpun.com");
      return url.hostname === "blog.ccpun.com" || ((url.hostname === "ccpun.com" || url.hostname === "www.ccpun.com") && /^\/blog\/[^/]+\/?$/.test(url.pathname));
    } catch {
      return false;
    }
  };
  const geo = input.geo ?? {};

  return {
    internalLinks: input.links.filter(isInternalLink).length,
    legacyInternalLinks: input.links.filter(isLegacyInternalLink).length,
    externalLinks: input.links.filter((href) => /^https?:\/\//.test(href) && !isInternalLink(href)).length,
    legacyFacebookCtas: input.links.filter((href) => /facebook\.com\/(?:messages|msg)|m\.me\//i.test(href)).length,
    faqCount: input.faqCount,
    sourcesCount: input.sourcesCount,
    migratedImages: input.bodyTypes.filter((type) => type === "migratedImage").length,
    hasNativeFeaturedImage: input.hasNativeFeaturedImage,
    usesMigratedFeaturedImage: input.usesMigratedFeaturedImage,
    factChecked: Boolean(input.factCheckedAt),
    complianceReviewed: Boolean(input.complianceReviewedAt),
    geoCompleted: [Boolean(geo.summary?.trim()), Boolean(geo.keyEntities?.length), Boolean(geo.keyQuestions?.length), Boolean(geo.reviewedAt)].filter(Boolean).length,
    geoTotal: 4,
  };
}
