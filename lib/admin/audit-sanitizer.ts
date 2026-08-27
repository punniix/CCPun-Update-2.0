const ALLOWED_AUDIT_FIELDS = new Set([
  "approvedRiskLevel",
  "approvedTargetId",
  "approvedTargetRevision",
  "approvedType",
  "criticalIssues",
  "field",
  "geoMentions",
  "geoPrompts",
  "provider",
  "quotaCount",
  "reasonPresent",
  "riskLevel",
  "score",
  "status",
  "targetDocumentId",
  "trustClass",
  "type",
  "valuePresent",
  "warnings",
]);

const SENSITIVE_FIELD = /(authorization|cookie|credential|password|secret|session|token)/i;

export function safeAuditJson(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;

  const sanitized: Record<string, string | number | boolean | null> = {};
  for (const [key, candidate] of Object.entries(value)) {
    if (!ALLOWED_AUDIT_FIELDS.has(key) || SENSITIVE_FIELD.test(key)) continue;
    if (candidate === null || typeof candidate === "number" || typeof candidate === "boolean") {
      sanitized[key] = candidate;
    } else if (typeof candidate === "string") {
      sanitized[key] = candidate.slice(0, 1000);
    }
  }

  return Object.keys(sanitized).length > 0 ? JSON.stringify(sanitized) : undefined;
}
