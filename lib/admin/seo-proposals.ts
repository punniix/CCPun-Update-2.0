const SEARCH_INTENTS = ["informational", "commercial", "transactional", "navigational", "mixed"] as const;
const SAFE_RESEARCH_PROVIDERS = ["gsc", "ubersuggest", "serp"] as const;
const MAX_RESEARCH_AGE_MS = 30 * 24 * 60 * 60 * 1000;

type SearchIntent = (typeof SEARCH_INTENTS)[number];
type SafeResearchProvider = (typeof SAFE_RESEARCH_PROVIDERS)[number];

export type SeoProposalResearch = {
  provider: SafeResearchProvider | "manual" | string;
  intent: SearchIntent | string | null;
  checkedAt: string;
};

export type DeterministicSeoProposal = {
  type: "search-intent";
  after: SearchIntent;
  reason: string;
  confidence: 0.5;
  riskLevel: "low";
  evidence: Array<{
    label: string;
    sourceType: "first-party" | "provider" | "serp";
    detail: string;
    capturedAt: string;
  }>;
};

function isOneOf<T extends string>(value: string, allowed: readonly T[]): value is T {
  return allowed.includes(value as T);
}

export function buildDeterministicSeoProposals(input: {
  focusKeyword: string | null | undefined;
  currentSearchIntent: string | null | undefined;
  research: SeoProposalResearch | null;
  now: string;
}): DeterministicSeoProposal[] {
  const keyword = input.focusKeyword?.replace(/\s+/g, " ").trim();
  const provider = input.research?.provider ?? "";
  const intent = input.research?.intent ?? "";
  const checkedAt = Date.parse(input.research?.checkedAt ?? "");
  const now = Date.parse(input.now);
  const age = now - checkedAt;

  if (
    !keyword ||
    input.currentSearchIntent?.trim() ||
    !isOneOf(provider, SAFE_RESEARCH_PROVIDERS) ||
    !isOneOf(intent, SEARCH_INTENTS) ||
    !Number.isFinite(age) ||
    age < 0 ||
    age > MAX_RESEARCH_AGE_MS
  ) return [];

  const label = provider === "gsc" ? "Google Search Console" : provider === "serp" ? "SERP research" : "Ubersuggest";
  const sourceType = provider === "gsc" ? "first-party" : provider === "serp" ? "serp" : "provider";
  return [{
    type: "search-intent",
    after: intent,
    reason: `Research Snapshot ล่าสุดสำหรับคำค้นหลัก “${keyword}” ระบุ Search intent เป็น ${intent} ข้อมูลนี้เป็นข้อเสนอจากแหล่งภายนอกและต้องให้มนุษย์ตรวจสอบก่อนใช้`,
    confidence: 0.5,
    riskLevel: "low",
    evidence: [{
      label: `Research Snapshot: ${label}`,
      sourceType,
      detail: `คำค้นหลัก: ${keyword} · Search intent: ${intent}`,
      capturedAt: input.research!.checkedAt,
    }],
  }];
}
