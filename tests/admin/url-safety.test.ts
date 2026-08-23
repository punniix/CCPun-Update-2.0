import assert from "node:assert/strict";
import test from "node:test";
import {
  getArticleCanonical,
  getArticlePath,
  getLegacyCategoryRedirectPath,
  isArticleCanonicalAligned,
} from "../../lib/content/url";

test("health and critical-illness categories keep their public URL prefixes", () => {
  for (const [category, categorySlug] of [["ประกันสุขภาพ", "health-insurance"], ["ประกันโรคร้ายแรง", "critical-illness"]]) {
    const article = { slug: "example", category, categorySlug };
    assert.equal(getArticlePath(article), `/blog/${categorySlug}/example/`);
    assert.equal(getArticleCanonical(article), `https://ccpun.com/blog/${categorySlug}/example/`);
    assert.equal(isArticleCanonicalAligned(article), true);
  }
});

test("legacy category landing paths redirect to tag filters without colliding with article slugs", () => {
  assert.equal(getLegacyCategoryRedirectPath("health-insurance"), "/blog/?tag=%E0%B8%9B%E0%B8%A3%E0%B8%B0%E0%B8%81%E0%B8%B1%E0%B8%99%E0%B8%AA%E0%B8%B8%E0%B8%82%E0%B8%A0%E0%B8%B2%E0%B8%9E");
  assert.equal(getLegacyCategoryRedirectPath("critical-illness"), "/blog/?tag=%E0%B8%9B%E0%B8%A3%E0%B8%B0%E0%B8%81%E0%B8%B1%E0%B8%99%E0%B9%82%E0%B8%A3%E0%B8%84%E0%B8%A3%E0%B9%89%E0%B8%B2%E0%B8%A2%E0%B9%81%E0%B8%A3%E0%B8%87");
  assert.equal(getLegacyCategoryRedirectPath("critical-illness-insurance"), null);
});

test("an explicit stale or decorated canonical fails the release alignment check", () => {
  const base = { slug: "example", category: "ประกันชีวิต", categorySlug: "life-insurance" };
  assert.equal(isArticleCanonicalAligned({ ...base, canonical: "https://ccpun.com/blog/health-insurance/example/" }), false);
  assert.equal(isArticleCanonicalAligned({ ...base, canonical: "https://ccpun.com/blog/life-insurance/example/?ref=old" }), false);
  assert.equal(isArticleCanonicalAligned({ ...base, canonical: "https://ccpun.com/blog/life-insurance/example/" }), true);
});

test("unknown categories fail closed instead of silently becoming personal-finance", () => {
  assert.throws(() => getArticlePath({ slug: "example", category: "Unknown", categorySlug: "unknown" }), /Unsupported article category/);
  assert.throws(
    () => getArticlePath({ slug: "example", category: "ประกันสุขภาพ", categorySlug: "personal-finance" }),
    /Unsupported article category/,
  );
});
