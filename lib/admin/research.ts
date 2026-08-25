import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { createClient, groq } from "next-sanity";
import { z } from "zod";
import { isAdminDataPlaneAllowed, isAdminReadDataPlaneAllowed } from "./environment";
import { getAdminSanityReadToken, getAdminSanityResearchWriteToken } from "./sanity-credentials";
import { buildAuditLogDocument } from "./sanity-control";
import { normalizeResearchKeyword, researchInputSchema, type ResearchInput } from "./research-input";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim();
const readToken = getAdminSanityReadToken();
const writeToken = getAdminSanityResearchWriteToken();

const researchRowSchema = z.object({
  id: z.string(),
  keyword: z.string(),
  provider: z.string(),
  scope: z.string().nullish(),
  volume: z.number().nullish(),
  difficulty: z.number().nullish(),
  intent: z.string().nullish(),
  competitors: z.array(z.string()).nullish(),
  serpCount: z.number().nullish().transform((value) => value ?? 0),
  checkedAt: z.string(),
  trustClass: z.string().nullish(),
});

const researchSerpEvidenceSchema = z.object({
  position: z.number().int().positive().nullish(),
  title: z.string().nullish(),
  url: z.string().nullish(),
  domain: z.string().nullish(),
  snippet: z.string().nullish(),
}).passthrough();

const researchEvidenceSchema = z.object({
  id: z.string(),
  keyword: z.string(),
  provider: z.string(),
  scope: z.string().nullish(),
  volume: z.number().nullish(),
  difficulty: z.number().nullish(),
  intent: z.string().nullish(),
  serp: z.array(researchSerpEvidenceSchema).nullish().transform((value) => value ?? []),
  competitors: z.array(z.string()).nullish().transform((value) => value ?? []),
  checkedAt: z.string(),
  trustClass: z.string().nullish(),
});

export type ResearchSnapshotRow = z.infer<typeof researchRowSchema>;
export type SeoResearchEvidence = z.infer<typeof researchEvidenceSchema>;
export type ResearchSnapshotList = {
  rows: ResearchSnapshotRow[];
  error: "not-configured" | "request-failed" | null;
};

const researchMutationContextSchema = z.object({
  actor: z.string().min(1).max(320),
  actorType: z.enum(["human", "ai", "system"]),
  requestId: z.string().uuid(),
});

type ResearchMutationContext = z.infer<typeof researchMutationContextSchema>;

function readClient() {
  if (!projectId || !dataset || !readToken || !isAdminReadDataPlaneAllowed(dataset)) return null;
  return createClient({ projectId, dataset, token: readToken, apiVersion: "2026-08-20", useCdn: false, perspective: "raw" });
}

function writeClient() {
  if (!projectId || !dataset || !writeToken || !isAdminDataPlaneAllowed(dataset)) return null;
  return createClient({ projectId, dataset, token: writeToken, apiVersion: "2026-08-20", useCdn: false, perspective: "raw" });
}

export function getResearchProviderStatus(ubersuggestConnected = false) {
  return [
    {
      id: "ubersuggest",
      label: "Ubersuggest",
      connected: ubersuggestConnected,
      mode: ubersuggestConnected ? "local-oauth" : "adapter-ready",
      detail: ubersuggestConnected ? "เชื่อมต่อแบบอ่านอย่างเดียวบน Mac เครื่องนี้แล้ว" : "รองรับรูปแบบข้อมูลแล้ว แต่ยังต้องเชื่อมบัญชีบน Mac เครื่องนี้",
    },
    {
      id: "gsc",
      label: "Google Search Console",
      connected: false,
      mode: "phase-4",
      detail: "วางแผนเชื่อมแบบอ่านอย่างเดียวใน Phase 4 และยังไม่นำข้อมูลเข้าตอนนี้",
    },
    {
      id: "serp",
      label: "SERP research",
      connected: false,
      mode: "schema-ready",
      detail: "รองรับรูปแบบข้อมูลแล้ว แต่ยังไม่มีเครื่องมือนำเข้าที่ตรวจสอบแหล่งที่มา",
    },
    {
      id: "manual",
      label: "Manual research",
      connected: true,
      mode: "normalized-import",
      detail: "กรอกข้อมูลด้วยตนเองได้ และระบบติดป้ายว่าเป็นข้อมูลภายนอกที่ยังไม่ยืนยัน",
    },
  ] as const;
}

export function isResearchWriteReady() {
  return Boolean(writeClient());
}

export async function findFreshResearchSnapshot(provider: ResearchInput["provider"], keyword: string, maxAgeHours = 24) {
  const client = readClient();
  if (!client) return null;
  const keywordKey = normalizeResearchKeyword(keyword);
  const freshAfter = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();
  const row = await client.fetch(groq`*[_type == "researchSnapshot" && provider == $provider && keywordKey == $keywordKey && checkedAt >= $freshAfter] | order(checkedAt desc)[0]{"id": _id, checkedAt}`, {
    provider,
    keywordKey,
    freshAfter,
  });
  return z.object({ id: z.string(), checkedAt: z.string() }).nullable().parse(row);
}

export async function getSeoResearchEvidence(keyword: string, maxAgeDays = 45): Promise<SeoResearchEvidence[]> {
  const client = readClient();
  if (!client) return [];
  const keywordKey = normalizeResearchKeyword(keyword);
  if (!keywordKey) return [];
  const freshAfter = new Date(Date.now() - Math.max(1, maxAgeDays) * 24 * 60 * 60 * 1000).toISOString();
  const rows = await client.fetch(groq`*[
    _type == "researchSnapshot" &&
    keywordKey == $keywordKey &&
    checkedAt >= $freshAfter
  ] | order(checkedAt desc)[0...3] {
    "id": _id,
    keyword,
    provider,
    scope,
    volume,
    difficulty,
    intent,
    serp[0...10]{position, title, url, domain, snippet},
    competitors,
    checkedAt,
    trustClass
  }`, { keywordKey, freshAfter });
  return z.array(researchEvidenceSchema).parse(rows);
}

export async function createResearchSnapshot(input: ResearchInput, context: ResearchMutationContext) {
  const client = writeClient();
  if (!client) throw new Error("SANITY_WRITE_NOT_CONFIGURED");
  const parsed = researchInputSchema.parse(input);
  const auditContext = researchMutationContextSchema.parse(context);
  const normalizedKeyword = parsed.keyword.replace(/\s+/g, " ").trim();
  const keywordKey = normalizeResearchKeyword(normalizedKeyword);
  const day = (parsed.checkedAt ?? new Date().toISOString()).slice(0, 10);
  const stableKey = createHash("sha256").update(`${parsed.provider}|${keywordKey}|${day}`).digest("hex").slice(0, 32);
  const providerSnapshot = parsed.provider !== "manual";
  const snapshotId = providerSnapshot ? `researchSnapshot.${stableKey}` : `researchSnapshot.${randomUUID()}`;
  const now = new Date().toISOString();
  const checkedAt = parsed.checkedAt ?? now;
  const snapshotDocument = {
    _id: snapshotId,
    _type: "researchSnapshot",
    keyword: normalizedKeyword,
    keywordKey,
    provider: parsed.provider,
    scope: parsed.scope,
    volume: parsed.volume,
    difficulty: parsed.difficulty,
    intent: parsed.intent,
    serp: parsed.serp?.map((item) => ({ _type: "serpResult", ...item })),
    competitors: parsed.competitors,
    trustClass: "untrusted-external-data",
    checkedAt,
  };
  const auditDocument = buildAuditLogDocument({
    id: providerSnapshot ? `auditLog.research.${stableKey}` : `auditLog.${randomUUID()}`,
    actor: auditContext.actor,
    actorType: auditContext.actorType,
    action: "research-snapshot:create",
    objectType: "researchSnapshot",
    objectId: snapshotId,
    after: {
      keyword: normalizedKeyword,
      provider: parsed.provider,
      trustClass: "untrusted-external-data",
    },
    requestId: auditContext.requestId,
    timestamp: now,
  });

  const transaction = client.transaction();
  if (providerSnapshot) {
    await transaction.createIfNotExists(snapshotDocument).createIfNotExists(auditDocument).commit();
  } else {
    await transaction.create(snapshotDocument).create(auditDocument).commit();
  }
  return { _id: snapshotId, reused: providerSnapshot };
}

export async function listResearchSnapshots(limit = 100): Promise<ResearchSnapshotList> {
  const client = readClient();
  if (!client) return { rows: [], error: "not-configured" };
  const safeLimit = Math.max(1, Math.min(limit, 200));
  try {
    const rows = await client.fetch(groq`*[_type == "researchSnapshot"] | order(checkedAt desc)[0...$limit] {
      "id": _id,
      keyword,
      provider,
      scope,
      volume,
      difficulty,
      intent,
      competitors,
      "serpCount": count(serp),
      checkedAt,
      trustClass
    }`, { limit: safeLimit });
    return { rows: z.array(researchRowSchema).parse(rows), error: null };
  } catch {
    return { rows: [], error: "request-failed" };
  }
}
