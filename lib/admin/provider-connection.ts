import { z } from "zod";

export const providerConnectionSchema = z.object({
  provider: z.enum(["google-drive", "gsc", "ga4", "meta", "youtube", "tiktok"]),
  state: z.enum(["disconnected", "authorization-pending", "connected", "refresh-required", "revoked", "error"]),
  scopes: z.array(z.string().trim().min(1).max(200)).max(30),
  expiresAt: z.string().datetime().nullable(),
  lastErrorCategory: z.enum(["authorization", "revoked", "timeout", "rate-limit", "provider-unavailable", "invalid-response"]).nullable(),
}).strict();

type ProviderConnection = z.infer<typeof providerConnectionSchema>;
type ProviderConnectionEvent =
  | { type: "begin" }
  | { type: "connected"; scopes: string[]; expiresAt: string | null }
  | { type: "expired" }
  | { type: "revoked" }
  | { type: "failed"; category: Exclude<ProviderConnection["lastErrorCategory"], null> }
  | { type: "disconnect" };

export function transitionProviderConnection(current: ProviderConnection, event: ProviderConnectionEvent): ProviderConnection {
  const connection = providerConnectionSchema.parse(current);
  const next = (patch: Partial<ProviderConnection>) => providerConnectionSchema.parse({ ...connection, ...patch });

  if (event.type === "begin") return next({ state: "authorization-pending", scopes: [], expiresAt: null, lastErrorCategory: null });
  if (event.type === "connected") return next({ state: "connected", scopes: [...new Set(event.scopes)].sort(), expiresAt: event.expiresAt, lastErrorCategory: null });
  if (event.type === "expired") return next({ state: "refresh-required", lastErrorCategory: "authorization" });
  if (event.type === "revoked") return next({ state: "revoked", scopes: [], expiresAt: null, lastErrorCategory: "revoked" });
  if (event.type === "failed") return next({ state: "error", lastErrorCategory: event.category });
  return next({ state: "disconnected", scopes: [], expiresAt: null, lastErrorCategory: null });
}
