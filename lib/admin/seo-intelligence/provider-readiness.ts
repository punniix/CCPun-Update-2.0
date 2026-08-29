import { z } from "zod";

if (typeof window !== "undefined") throw new Error("SEO_PROVIDER_READINESS_SERVER_ONLY");

export const seoGoogleProviderSchema = z.enum(["gsc", "ga4"]);
export type SeoGoogleProvider = z.infer<typeof seoGoogleProviderSchema>;

const providerConfig = {
  gsc: {
    accessToken: "CCPUN_GSC_ACCESS_TOKEN",
    resource: "CCPUN_GSC_SITE_URL",
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
  },
  ga4: {
    accessToken: "CCPUN_GA4_ACCESS_TOKEN",
    resource: "CCPUN_GA4_PROPERTY_ID",
    scope: "https://www.googleapis.com/auth/analytics.readonly",
  },
} as const;

function validResource(provider: SeoGoogleProvider, value: string | undefined) {
  if (!value?.trim()) return false;
  if (provider === "ga4") return /^\d{1,20}$/.test(value.trim());
  const site = value.trim();
  if (site.startsWith("sc-domain:")) return /^sc-domain:[A-Za-z0-9.-]+$/.test(site);
  try {
    const url = new URL(site);
    return url.protocol === "https:" && url.toString() === site;
  } catch {
    return false;
  }
}

export function getSeoGoogleProviderReadiness(
  providerValue: unknown,
  env: Record<string, string | undefined> = process.env,
) {
  const provider = seoGoogleProviderSchema.parse(providerValue);
  const config = providerConfig[provider];
  const tokenPresent = Boolean(env[config.accessToken]?.trim());
  const resourcePresent = Boolean(env[config.resource]?.trim());
  const resourceValid = validResource(provider, env[config.resource]);
  return {
    provider,
    mode: "temporary-uat-access-token" as const,
    status: tokenPresent && resourceValid ? "manual-sync-ready" as const : "configuration-required" as const,
    required: [
      { name: config.accessToken, present: tokenPresent, valid: tokenPresent },
      { name: config.resource, present: resourcePresent, valid: resourceValid },
    ],
    scope: config.scope,
    refreshableConnectionReady: false as const,
    callbackPath: null,
    limitation: "The current UAT lane accepts one short-lived server token. A persistent refreshable OAuth connection is intentionally not available yet.",
  };
}

