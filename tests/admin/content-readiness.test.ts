import assert from "node:assert/strict";
import test from "node:test";
import { summarizeContentReadiness } from "../../lib/admin/content-readiness";

test("content readiness classifies migrated links, media, review and GEO without affecting content", () => {
  const result = summarizeContentReadiness({
    links: [
      "https://ccpun.com/blog/critical-illness/critical-illness-insurance/",
      "https://ccpun.com/blog/financial-pyramid/",
      "https://blog.ccpun.com/aia-vitality/",
      "https://facebook.com/messages/t/ccpun",
      "https://example.com/source",
    ],
    bodyTypes: ["block", "migratedImage", "imageWithAlt"],
    faqCount: 2,
    sourcesCount: 3,
    hasNativeFeaturedImage: false,
    usesMigratedFeaturedImage: true,
    factCheckedAt: "2026-08-21T00:00:00.000Z",
    complianceReviewedAt: null,
    geo: { summary: "สรุป", keyEntities: ["AIA"], keyQuestions: [], reviewedAt: null },
  });

  assert.deepEqual(result, {
    internalLinks: 3,
    legacyInternalLinks: 2,
    externalLinks: 2,
    legacyFacebookCtas: 1,
    faqCount: 2,
    sourcesCount: 3,
    migratedImages: 1,
    hasNativeFeaturedImage: false,
    usesMigratedFeaturedImage: true,
    factChecked: true,
    complianceReviewed: false,
    geoCompleted: 2,
    geoTotal: 4,
  });
});
