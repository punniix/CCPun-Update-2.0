import "server-only";

import { createClient, groq } from "next-sanity";
import { z } from "zod";
import { isAdminReadDataPlaneAllowed } from "./environment";
import { getAdminSanityReadToken } from "./sanity-credentials";
import { getAdminSanityStatus } from "./sanity-control";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim();
const readToken = getAdminSanityReadToken();

const auditRowSchema = z.object({
  id: z.string(),
  actor: z.string().nullish(),
  actorType: z.string().nullish(),
  action: z.string().nullish(),
  objectType: z.string().nullish(),
  objectId: z.string().nullish(),
  requestId: z.string().nullish(),
  environment: z.string().nullish(),
  timestamp: z.string().nullish(),
});

export type AdminAuditRow = z.infer<typeof auditRowSchema>;

export async function listAuditLogs(limit = 100): Promise<{
  rows: AdminAuditRow[];
  error: "read-token-required" | "request-failed" | null;
}> {
  const status = getAdminSanityStatus();
  if (!status.readReady || !projectId || !dataset || !readToken || !isAdminReadDataPlaneAllowed(dataset)) {
    return { rows: [], error: "read-token-required" };
  }

  const client = createClient({
    projectId,
    dataset,
    token: readToken,
    apiVersion: "2026-08-20",
    useCdn: false,
    perspective: "drafts",
  });

  const safeLimit = Math.max(1, Math.min(limit, 200));
  const query = groq`*[_type == "auditLog"] | order(timestamp desc)[0...$limit] {
    "id": coalesce(_originalId, _id),
    actor,
    actorType,
    action,
    objectType,
    objectId,
    requestId,
    environment,
    timestamp
  }`;

  try {
    const rows = await client.fetch(query, { limit: safeLimit });
    return { rows: z.array(auditRowSchema).parse(rows), error: null };
  } catch {
    return { rows: [], error: "request-failed" };
  }
}
