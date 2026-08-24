import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("SEO Control Center keeps semantic topic separate from protected published URL fields", () => {
  const schema = readFileSync("cms/sanity/schema.ts", "utf8");
  const input = readFileSync("cms/sanity/components/SeoScoreInput.tsx", "utf8");
  const contract = readFileSync("docs/seo-control-center-v1.md", "utf8");

  assert.match(schema, /BLOG_TOPIC_HUBS/);
  assert.match(schema, /name: "semanticTopic"/);
  assert.match(schema, /การเปลี่ยนช่องนี้ไม่ใช่การย้าย URL/);

  assert.match(schema, /title: "URL Slug \(Protected หลังเผยแพร่\)"/);
  assert.match(schema, /title: "หมวดหมู่หลัก \(Protected หลังเผยแพร่\)"/);
  assert.match(schema, /title: "Canonical override \(Protected\)"/);
  assert.match(schema, /title: "Noindex \(Protected\)"/);

  const publishedLocks = schema.match(/readOnly: \(\{ document \}\) => Boolean\(document\?\.publishedAt\)/g) ?? [];
  assert.ok(publishedLocks.length >= 4, "slug, category, canonical and noindex must be protected after publication");

  assert.match(input, /Google Preview/);
  assert.match(input, /สถานะ SEO ที่ควรตรวจ/);
  assert.match(input, /Protected SEO fields/);
  assert.match(input, /Semantic Topic แยกจาก URL จริง/);
  assert.match(input, /Indexability/);

  assert.match(contract, /Redirect ownership remains in code\/URL migration contracts/);
  assert.match(contract, /AIA Health CI Hero remains semantically Health insurance/);
});
