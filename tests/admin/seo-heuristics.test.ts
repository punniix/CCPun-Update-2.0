import assert from "node:assert/strict";
import test from "node:test";
import { countGraphemes, countMatchingQuestions, isReviewDateFresh, seoBodyFacts } from "../../lib/admin/seo-heuristics";

test("Thai SEO length counts visible graphemes instead of combining code units", () => {
  assert.equal("กำ".length, 2);
  assert.equal(countGraphemes("กำ"), 1);
});

test("GEO FAQ alignment requires matching questions, not only matching counts", () => {
  assert.equal(countMatchingQuestions(["ประกันชีวิตคืออะไร?", "เหมาะกับใคร"], ["ประกันชีวิตคืออะไร", "เหมาะกับใคร?"]), 2);
  assert.equal(countMatchingQuestions(["ประกันชีวิตคืออะไร", "เหมาะกับใคร"], ["คำถามอื่นหนึ่ง", "คำถามอื่นสอง"]), 0);
});

test("GEO freshness rejects future review dates", () => {
  const now = Date.parse("2026-08-22T00:00:00.000Z");
  assert.equal(isReviewDateFresh("2026-08-21T00:00:00.000Z", now), true);
  assert.equal(isReviewDateFresh("2026-08-23T00:00:00.000Z", now), false);
});

test("SEO audit includes visible custom blocks and direct CTA links", () => {
  const facts = seoBodyFacts([
    { _type: "callout", title: "ควรรู้", text: "รายละเอียดสำคัญ" },
    { _type: "detailsBlock", summary: "อ่านเพิ่ม", text: "คำอธิบาย" },
    { _type: "simpleTable", headers: ["หัวข้อ"], rows: [{ cells: ["ข้อมูล"] }] },
    { _type: "ctaBlock", label: "อ่านบทความ", url: "/blog/life-insurance/example/" },
  ]);

  for (const text of ["ควรรู้", "รายละเอียดสำคัญ", "อ่านเพิ่ม", "คำอธิบาย", "หัวข้อ", "ข้อมูล", "อ่านบทความ"]) {
    assert.ok(facts.text.includes(text));
  }
  assert.deepEqual(facts.links, ["/blog/life-insurance/example/"]);
});
