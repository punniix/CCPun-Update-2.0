import assert from "node:assert/strict";
import test from "node:test";
import { manualResearchInputSchema, normalizeResearchKeyword, researchInputSchema, researchOpportunityScore } from "../../lib/admin/research-input";

const sample = { keyword: "ประกันชีวิต", provider: "manual" as const, volume: 120, difficulty: 28 };

test("browser-entered research can only claim manual provenance", () => {
  assert.equal(manualResearchInputSchema.safeParse(sample).success, true);
  for (const provider of ["ubersuggest", "gsc", "serp"]) {
    assert.equal(manualResearchInputSchema.safeParse({ ...sample, provider }).success, false);
  }
});

test("keyword coverage and opportunity remain deterministic", () => {
  assert.equal(normalizeResearchKeyword("  ประกันชีวิต   AIA "), "ประกันชีวิต aia");
  assert.equal(researchOpportunityScore(120, 28), 45);
  assert.equal(researchOpportunityScore(undefined, 28), null);
});

test("the internal normalized schema remains ready for dedicated provider routes", () => {
  for (const provider of ["ubersuggest", "gsc", "serp", "manual"]) {
    assert.equal(researchInputSchema.safeParse({ ...sample, provider }).success, true);
  }
});

test("research input trims keywords and removes duplicate competitors", () => {
  const parsed = manualResearchInputSchema.parse({
    keyword: "  ประกันชีวิต  ",
    provider: "manual",
    competitors: ["Example.com", " example.com ", "คู่แข่ง.test"],
  });
  assert.equal(parsed.keyword, "ประกันชีวิต");
  assert.deepEqual(parsed.competitors, ["example.com", "คู่แข่ง.test"]);
  assert.equal(manualResearchInputSchema.safeParse({ keyword: "   ", provider: "manual" }).success, false);
  assert.equal(researchInputSchema.safeParse({ ...sample, serp: [{ url: "javascript:alert(1)" }] }).success, false);
  assert.equal(researchInputSchema.safeParse({ ...sample, serp: [{ url: "https://example.com/article" }] }).success, true);
});
