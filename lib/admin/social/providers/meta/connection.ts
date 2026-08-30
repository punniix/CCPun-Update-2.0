import { z } from "zod";

export const META_MINIMUM_READ_SCOPES = ["pages_show_list", "instagram_basic"] as const;

const boundedId = z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9_.:-]+$/);

export const metaConnectionDiscoverySchema = z.object({
  mode: z.literal("synthetic-uat"),
  authorizationState: z.enum(["not-connected", "active", "expired", "revoked"]),
  grantedScopes: z.tuple([
    z.literal(META_MINIMUM_READ_SCOPES[0]),
    z.literal(META_MINIMUM_READ_SCOPES[1]),
  ]),
  selectedPageId: boundedId.nullable(),
  pages: z.array(z.object({
    id: boundedId,
    name: z.string().trim().min(1).max(120),
    instagramAccount: z.object({
      id: boundedId,
      username: z.string().trim().min(1).max(120),
    }).nullable(),
  })).max(20),
});

export type MetaConnectionDiscovery = z.infer<typeof metaConnectionDiscoverySchema>;
export type MetaConnectionStatus = "not-connected" | "reconnect-required" | "no-page" | "selection-required" | "connected";

export function normalizeMetaConnection(input: MetaConnectionDiscovery) {
  const discovery = metaConnectionDiscoverySchema.parse(input);
  const active = discovery.authorizationState === "active";
  const selectedPageId = active
    ? discovery.selectedPageId ?? (discovery.pages.length === 1 ? discovery.pages[0]!.id : null)
    : null;
  const selectedPageExists = discovery.pages.some((page) => page.id === selectedPageId);
  const status: MetaConnectionStatus = discovery.authorizationState === "not-connected"
    ? "not-connected"
    : discovery.authorizationState !== "active"
      ? "reconnect-required"
      : discovery.pages.length === 0
        ? "no-page"
        : !selectedPageExists
          ? "selection-required"
          : "connected";

  return {
    mode: discovery.mode,
    status,
    authorizationState: discovery.authorizationState,
    grantedScopes: discovery.grantedScopes,
    selectedPageId: selectedPageExists ? selectedPageId : null,
    pages: discovery.pages.map((page) => ({
      id: page.id,
      name: page.name,
      selected: page.id === selectedPageId,
      instagram: page.instagramAccount
        ? { status: "linked" as const, username: page.instagramAccount.username }
        : { status: "not-linked" as const, username: null },
    })),
    providerRequestAllowed: false as const,
    limitations: [
      "ข้อมูลเป็น synthetic UAT และไม่ได้เรียก Meta API",
      "สิทธิ์จำกัดเฉพาะรายชื่อ Page และการเชื่อม Instagram เบื้องต้น",
      "ไม่มีสิทธิ์เผยแพร่โพสต์หรืออ่าน Insights",
    ],
  };
}

export const SYNTHETIC_META_CONNECTION = normalizeMetaConnection({
  mode: "synthetic-uat",
  authorizationState: "active",
  grantedScopes: [...META_MINIMUM_READ_SCOPES],
  selectedPageId: "meta-page-ccpun",
  pages: [
    {
      id: "meta-page-ccpun",
      name: "CCPun Financial Advisor (UAT)",
      instagramAccount: { id: "meta-ig-ccpun", username: "ccpun.uat" },
    },
    {
      id: "meta-page-secondary",
      name: "CCPun Secondary Page (UAT)",
      instagramAccount: null,
    },
  ],
});
