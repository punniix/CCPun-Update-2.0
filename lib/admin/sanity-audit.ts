import "server-only";

import { readAdminAudit } from "./operations/database";

export type AdminAuditRow = NonNullable<Awaited<ReturnType<typeof readAdminAudit>>>[number];

export async function listAuditLogs(limit = 100): Promise<{
  rows: AdminAuditRow[];
  error: "read-token-required" | "request-failed" | null;
}> {
  const safeLimit = Math.max(1, Math.min(limit, 200));
  try {
    const rows = await readAdminAudit(safeLimit);
    return rows ? { rows, error: null } : { rows: [], error: "read-token-required" };
  } catch {
    return { rows: [], error: "request-failed" };
  }
}
