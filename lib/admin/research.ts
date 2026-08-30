import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { normalizeResearchKeyword, researchInputSchema, type ResearchInput } from "./research-input";
import {
  buildAdminAudit, createAdminResearchSnapshot, findAdminResearchSnapshot,
  isAdminOperationsWriteReady, readAdminResearch,
} from "./operations/database";
import { privateAdminDocumentId } from "./suggestion-lifecycle";

export type ResearchSnapshotRow = NonNullable<Awaited<ReturnType<typeof readAdminResearch>>>[number];
export type ResearchSnapshotList = { rows: ResearchSnapshotRow[]; error: "not-configured" | "request-failed" | null };

export function getResearchProviderStatus(ubersuggestConnected = false) {
  return [
    { id: "ubersuggest", label: "Ubersuggest", connected: ubersuggestConnected, mode: ubersuggestConnected ? "local-oauth" : "adapter-ready", detail: ubersuggestConnected ? "เชื่อมต่อแบบอ่านอย่างเดียวบน Mac เครื่องนี้แล้ว" : "รองรับรูปแบบข้อมูลแล้ว แต่ยังต้องเชื่อมบัญชีบน Mac เครื่องนี้" },
    { id: "gsc", label: "Google Search Console", connected: false, mode: "phase-4", detail: "วางแผนเชื่อมแบบอ่านอย่างเดียวใน Phase 4 และยังไม่นำข้อมูลเข้าตอนนี้" },
    { id: "serp", label: "SERP research", connected: false, mode: "schema-ready", detail: "รองรับรูปแบบข้อมูลแล้ว แต่ยังไม่มีเครื่องมือนำเข้าที่ตรวจสอบแหล่งที่มา" },
    { id: "manual", label: "Manual research", connected: true, mode: "normalized-import", detail: "กรอกข้อมูลด้วยตนเองได้ และระบบติดป้ายว่าเป็นข้อมูลภายนอกที่ยังไม่ยืนยัน" },
  ] as const;
}

export function isResearchWriteReady() { return isAdminOperationsWriteReady(); }

export async function findFreshResearchSnapshot(provider: ResearchInput["provider"], keyword: string, maxAgeHours = 24) {
  return findAdminResearchSnapshot(
    provider,
    normalizeResearchKeyword(keyword),
    new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString(),
  );
}

export async function createResearchSnapshot(
  input: ResearchInput,
  context: { actor: string; actorType: "human" | "ai" | "system"; requestId: string },
) {
  const parsed = researchInputSchema.parse(input);
  const keyword = parsed.keyword.replace(/\s+/g, " ").trim();
  const keywordKey = normalizeResearchKeyword(keyword);
  const checkedAt = parsed.checkedAt ?? new Date().toISOString();
  const stableKey = createHash("sha256").update(`${parsed.provider}|${keywordKey}|${checkedAt.slice(0, 10)}`).digest("hex").slice(0, 32);
  const idempotent = parsed.provider !== "manual";
  const id = privateAdminDocumentId(idempotent ? `researchSnapshot.${stableKey}` : `researchSnapshot.${randomUUID()}`);
  const now = new Date().toISOString();
  const audit = buildAdminAudit({
    id: privateAdminDocumentId(idempotent ? `auditLog.research.${stableKey}` : `auditLog.${randomUUID()}`),
    actor: context.actor, actorType: context.actorType, action: "research-snapshot:create",
    objectType: "researchSnapshot", objectId: id,
    after: { keyword, provider: parsed.provider, trustClass: "untrusted-external-data" },
    requestId: context.requestId, timestamp: now,
  });
  const result = await createAdminResearchSnapshot({
    id, keyword, keywordKey, provider: parsed.provider, scope: parsed.scope, location: parsed.location,
    language: parsed.language, volume: parsed.volume, difficulty: parsed.difficulty, intent: parsed.intent,
    serp: parsed.serp, competitors: parsed.competitors, checkedAt, trustClass: "untrusted-external-data",
  }, audit, idempotent);
  return { _id: result.id, reused: result.reused };
}

export async function listResearchSnapshots(limit = 100): Promise<ResearchSnapshotList> {
  try {
    const rows = await readAdminResearch(Math.max(1, Math.min(limit, 200)));
    return rows ? { rows, error: null } : { rows: [], error: "not-configured" };
  } catch {
    return { rows: [], error: "request-failed" };
  }
}
