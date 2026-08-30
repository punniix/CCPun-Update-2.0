import { safeAuditJson } from "../audit-sanitizer";

export function sanitizeLegacyAuditPayload(value: unknown) {
  const serialized = safeAuditJson(value);
  return serialized ? JSON.parse(serialized) as unknown : null;
}

