import assert from "node:assert/strict";
import test from "node:test";
import { buildDeterministicSeoProposals } from "../../lib/admin/seo-proposals";

const now = "2026-08-27T08:00:00.000Z";

test("fresh provider research creates only a human-reviewed search-intent proposal", () => {
  const proposals = buildDeterministicSeoProposals({
    focusKeyword: "ประกันสุขภาพ",
    currentSearchIntent: null,
    research: {
      provider: "ubersuggest",
      intent: "commercial",
      checkedAt: "2026-08-26T08:00:00.000Z",
    },
    now,
  });

  assert.equal(proposals.length, 1);
  assert.deepEqual(proposals[0], {
    type: "search-intent",
    after: "commercial",
    reason: "Research Snapshot ล่าสุดสำหรับคำค้นหลัก “ประกันสุขภาพ” ระบุ Search intent เป็น commercial ข้อมูลนี้เป็นข้อเสนอจากแหล่งภายนอกและต้องให้มนุษย์ตรวจสอบก่อนใช้",
    confidence: 0.5,
    riskLevel: "low",
    evidence: [{
      label: "Research Snapshot: Ubersuggest",
      sourceType: "provider",
      detail: "คำค้นหลัก: ประกันสุขภาพ · Search intent: commercial",
      capturedAt: "2026-08-26T08:00:00.000Z",
    }],
  });
});

test("proposal generation fails closed for existing intent, manual, stale, future, or incomplete evidence", () => {
  const base = {
    focusKeyword: "ประกันสุขภาพ",
    currentSearchIntent: null,
    research: { provider: "ubersuggest", intent: "commercial", checkedAt: "2026-08-26T08:00:00.000Z" },
    now,
  } as const;

  assert.deepEqual(buildDeterministicSeoProposals({ ...base, currentSearchIntent: "informational" }), []);
  assert.deepEqual(buildDeterministicSeoProposals({ ...base, research: { ...base.research, provider: "manual" } }), []);
  assert.deepEqual(buildDeterministicSeoProposals({ ...base, research: { ...base.research, checkedAt: "2026-07-01T08:00:00.000Z" } }), []);
  assert.deepEqual(buildDeterministicSeoProposals({ ...base, research: { ...base.research, checkedAt: "2026-08-28T08:00:00.000Z" } }), []);
  assert.deepEqual(buildDeterministicSeoProposals({ ...base, focusKeyword: "" }), []);
  assert.deepEqual(buildDeterministicSeoProposals({ ...base, research: null }), []);
});

test("deterministic generator never proposes protected or unsupported fields", () => {
  const proposals = buildDeterministicSeoProposals({
    focusKeyword: "วางแผนการเงิน",
    currentSearchIntent: null,
    research: { provider: "gsc", intent: "informational", checkedAt: now },
    now,
  });

  assert.deepEqual(proposals.map(({ type }) => type), ["search-intent"]);
  assert.equal(proposals.some(({ type }) => ["seo-title", "meta-description", "primary-keyword"].includes(type)), false);
});
