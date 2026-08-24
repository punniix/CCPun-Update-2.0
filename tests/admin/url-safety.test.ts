import assert from "node:assert/strict";
import test from "node:test";
import {
  getArticleCanonical,
  getArticlePath,
  getLegacyCategoryRedirectPath,
  getMovedArticleRedirectPath,
  isArticleCanonicalAligned,
} from "../../lib/content/url";

test("health and critical categories keep their own semantic canonical paths", () => {
  for (const [category, categorySlug, expected] of [
    ["ประกันสุขภาพ", "health-insurance", "/blog/health-insurance/example/"],
    ["ประกันโรคร้ายแรง", "critical-illness", "/blog/critical-illness/example/"],
  ] as const) {
    const article = { slug: "example", category, categorySlug };
    assert.equal(getArticlePath(article), expected);
    assert.equal(getArticleCanonical(article), `https://ccpun.com${expected}`);
    assert.equal(isArticleCanonicalAligned(article), true);
  }
});

test("interim life-insurance redirects stay disabled before the data cutover", () => {
  assert.equal(getMovedArticleRedirectPath("life-insurance", "aia-health-happy-describe"), null);
  assert.equal(getMovedArticleRedirectPath("life-insurance", "aia-health-ci-hero-guide"), null);
  assert.equal(getMovedArticleRedirectPath("life-insurance", "critical-illness-insurance"), null);
});

test("the V2 redirect manifest still maps each interim path directly to its final URL", () => {
  assert.equal(getMovedArticleRedirectPath("life-insurance", "aia-health-happy-describe", true), "/blog/health-insurance/aia-health-happy-describe/");
  assert.equal(getMovedArticleRedirectPath("life-insurance", "aia-health-ci-hero-guide", true), "/blog/health-insurance/aia-health-ci-hero-guide/");
  assert.equal(getMovedArticleRedirectPath("life-insurance", "critical-illness-insurance", true), "/blog/critical-illness/critical-illness-insurance/");
  assert.equal(getMovedArticleRedirectPath("health-insurance", "aia-health-happy-describe", true), null);
  assert.equal(getMovedArticleRedirectPath("critical-illness", "critical-illness-insurance", true), null);
  assert.equal(getMovedArticleRedirectPath("life-insurance", "aia-vitality", true), null);
});

test("post-fetch category state provides a direct transition with no redirect loop", () => {
  const before = { slug: "aia-health-happy-describe", category: "ประกันชีวิต", categorySlug: "life-insurance" };
  const after = { slug: "aia-health-happy-describe", category: "ประกันสุขภาพ", categorySlug: "health-insurance" };
  assert.equal(getArticlePath(before), "/blog/life-insurance/aia-health-happy-describe/");
  assert.equal(getArticlePath(after), "/blog/health-insurance/aia-health-happy-describe/");
  assert.notEqual(getArticlePath(before), getArticlePath(after));
});

test("historical category landing paths still resolve to archive topic filters", () => {
  assert.equal(getLegacyCategoryRedirectPath("health-insurance"), "/blog/?tag=%E0%B8%9B%E0%B8%A3%E0%B8%B0%E0%B8%81%E0%B8%B1%E0%B8%99%E0%B8%AA%E0%B8%B8%E0%B8%82%E0%B8%A0%E0%B8%B2%E0%B8%9E");
  assert.equal(getLegacyCategoryRedirectPath("critical-illness"), "/blog/?tag=%E0%B8%9B%E0%B8%A3%E0%B8%B0%E0%B8%81%E0%B8%B1%E0%B8%99%E0%B9%82%E0%B8%A3%E0%B8%84%E0%B8%A3%E0%B9%89%E0%B8%B2%E0%B8%A2%E0%B9%81%E0%B8%A3%E0%B8%87");
  assert.equal(getLegacyCategoryRedirectPath("critical-illness-insurance"), null);
});

test("an explicit stale or decorated canonical fails the release alignment check", () => {
  const health = { slug: "example", category: "ประกันสุขภาพ", categorySlug: "health-insurance" };
  assert.equal(isArticleCanonicalAligned({ ...health, canonical: "https://ccpun.com/blog/life-insurance/example/" }), false);
  assert.equal(isArticleCanonicalAligned({ ...health, canonical: "https://ccpun.com/blog/health-insurance/example/?ref=old" }), false);
  assert.equal(isArticleCanonicalAligned({ ...health, canonical: "https://ccpun.com/blog/health-insurance/example/" }), true);
});

test("unknown categories fail closed instead of silently becoming another insurance category", () => {
  assert.throws(() => getArticlePath({ slug: "example", category: "Unknown", categorySlug: "unknown" }), /Unsupported article category/);
  assert.throws(
    () => getArticlePath({ slug: "example", category: "ประกันสุขภาพ", categorySlug: "personal-finance" }),
    /Unsupported article category/,
  );
});
