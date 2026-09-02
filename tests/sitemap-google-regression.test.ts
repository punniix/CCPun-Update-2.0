import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  latestSitemapLastmod,
  normalizeSitemapLastmod,
  resolveContentLastmod,
  uniqueSortedSitemapEntries,
} from "../lib/sitemap/google";

test("normalizes supported W3C timestamps to one stable ISO representation", () => {
  assert.equal(
    normalizeSitemapLastmod("2026-09-02T14:00:00+07:00"),
    "2026-09-02T07:00:00.000Z",
  );
  assert.equal(normalizeSitemapLastmod("not-a-date"), undefined);
});

test("uses the explicit meaningful-content timestamp before migration or system timestamps", () => {
  assert.equal(
    resolveContentLastmod({
      contentUpdatedAt: "2026-09-02T10:00:00Z",
      sourceModifiedAt: "2026-08-11T13:46:39+07:00",
      systemUpdatedAt: "2026-09-03T10:00:00Z",
    }),
    "2026-09-02T10:00:00.000Z",
  );
  assert.equal(
    resolveContentLastmod({
      sourceModifiedAt: "2026-08-11T13:46:39+07:00",
      systemUpdatedAt: "2026-09-03T10:00:00Z",
    }),
    "2026-08-11T06:46:39.000Z",
  );
});

test("compares timestamps by time rather than timezone-formatted strings", () => {
  assert.equal(
    latestSitemapLastmod([
      "2026-09-02T10:00:00+07:00",
      "2026-09-02T04:00:00Z",
    ]),
    "2026-09-02T04:00:00.000Z",
  );
});

test("deduplicates canonical URLs and retains the newest valid lastmod", () => {
  assert.deepEqual(
    uniqueSortedSitemapEntries([
      { loc: "https://ccpun.com/blog/b/", lastmod: "2026-09-02T10:00:00+07:00" },
      { loc: "https://ccpun.com/blog/a/" },
      { loc: "https://ccpun.com/blog/b/", lastmod: "2026-09-02T04:00:00Z" },
    ]),
    [
      { loc: "https://ccpun.com/blog/a/" },
      { loc: "https://ccpun.com/blog/b/", lastmod: "2026-09-02T04:00:00.000Z" },
    ],
  );
});

const readSource = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("uses a lightweight published-only Sanity query for Google sitemap entries", () => {
  const source = readSource("lib/content/sitemap.ts");
  assert.match(source, /perspective:\s*"published"/);
  assert.match(source, /dateTime\(publishedAt\)\s*<=\s*dateTime\(now\(\)\)/);
  assert.match(source, /review\.status\s*==\s*"approved"/);
  assert.match(source, /coalesce\(seo\.noindex, false\)\s*==\s*false/);
  assert.doesNotMatch(source, /body\[\]|faq\[\]|featuredImage\.asset/);
});

test("protects Google publish eligibility and sets one meaningful publication timestamp", () => {
  const action = readSource("cms/sanity/policy/article-publish-action.tsx");
  const config = readSource("sanity.config.ts");
  const schema = readSource("cms/sanity/schema/documents/article.ts");

  assert.match(action, /draft\?\.review\?\.status === "approved"/);
  assert.match(action, /hasFuturePublicationDate/);
  assert.match(action, /contentUpdatedAt:\s*now/);
  assert.match(action, /draft\?\.publishedAt \? \{\} : \{ publishedAt: now \}/);
  assert.match(action, /patch\.execute[\s\S]*publish\.execute/);
  assert.match(action, /schemaType !== "article"[\s\S]*action\.action === "publish"/);
  assert.match(config, /wrapGoogleSafeArticlePublishActions[\s\S]*protectProductionContentLifecycleActions/);
  assert.match(schema, /name:\s*"contentUpdatedAt"[\s\S]*readOnly:\s*true/);
});
