import { z } from "zod";
import { CCPUN_VERCEL_PROJECT_IDS, parseAdminEnvironment } from "../environment";
import { WEBSITE_42_SANITY_DATASET, WEBSITE_42_SANITY_PROJECT_ID } from "./foundation";

if (typeof window !== "undefined") throw new Error("SOCIAL_PROVIDER_READINESS_SERVER_ONLY");

export const WEBSITE_42_SOCIAL_PROVIDER_BRANCH = "codex/website-42-social-provider-readonly-20260831";
export const WEBSITE_42_SOCIAL_ANALYTICS_BRANCH = "codex/website-42-social-analytics-ingestion-20260831";
export const SOCIAL_READ_ONLY_SCOPES = {
  meta: ["pages_show_list", "pages_read_engagement", "instagram_basic"],
  youtube: ["https://www.googleapis.com/auth/youtube.readonly"],
  tiktok: ["user.info.basic", "video.list"],
} as const;

const providerSchema = z.enum(["meta", "youtube", "tiktok"]);

function exactScopes(value: string | undefined, expected: readonly string[]) {
  const scopes = value?.split(",").map((scope) => scope.trim()).filter(Boolean) ?? [];
  return scopes.length === expected.length && expected.every((scope) => scopes.includes(scope));
}

export function getSocialProviderReadiness(
  providerValue: unknown,
  env: Record<string, string | undefined> = process.env,
) {
  const provider = providerSchema.parse(providerValue);
  const environment = parseAdminEnvironment(env.CCPUN_APP_ENV);
  const projectId = env.VERCEL_PROJECT_ID?.trim() || env.NEXT_PUBLIC_CCPUN_VERCEL_PROJECT_ID?.trim();
  const laneReady = env.CCPUN_SOCIAL_PROVIDER_READS_ENABLED === "1"
    && environment === "admin-uat"
    && projectId === CCPUN_VERCEL_PROJECT_IDS.adminProduction
    && [WEBSITE_42_SOCIAL_PROVIDER_BRANCH, WEBSITE_42_SOCIAL_ANALYTICS_BRANCH].includes(env.VERCEL_GIT_COMMIT_REF?.trim() ?? "")
    && env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() === WEBSITE_42_SANITY_PROJECT_ID
    && env.NEXT_PUBLIC_SANITY_DATASET?.trim() === WEBSITE_42_SANITY_DATASET;
  const prefix = provider === "meta" ? "META" : provider === "youtube" ? "YOUTUBE" : "TIKTOK";
  const scopeVariable = `CCPUN_${prefix}_GRANTED_SCOPES`;
  const tokenVariable = `CCPUN_${prefix}_ACCESS_TOKEN`;
  const graphVersion = provider === "meta" ? env.CCPUN_META_GRAPH_VERSION?.trim() : undefined;
  const analyticsLane = env.VERCEL_GIT_COMMIT_REF?.trim() === WEBSITE_42_SOCIAL_ANALYTICS_BRANCH
    && env.CCPUN_SOCIAL_ANALYTICS_INGESTION_ENABLED === "1";
  const scopeReady = exactScopes(env[scopeVariable], SOCIAL_READ_ONLY_SCOPES[provider]);
  const tokenReady = Boolean(env[tokenVariable]?.trim());
  const versionReady = provider !== "meta" || /^v\d{1,2}\.\d{1,2}$/.test(graphVersion ?? "");

  return {
    provider,
    mode: "manual-read-only" as const,
    status: laneReady && scopeReady && tokenReady && versionReady
      ? "manual-sync-ready" as const
      : "configuration-required" as const,
    laneReady,
    required: [
      { name: "CCPUN_SOCIAL_PROVIDER_READS_ENABLED", present: env.CCPUN_SOCIAL_PROVIDER_READS_ENABLED === "1", valid: laneReady },
      { name: scopeVariable, present: Boolean(env[scopeVariable]?.trim()), valid: scopeReady },
      { name: tokenVariable, present: tokenReady, valid: tokenReady },
      ...(provider === "meta" ? [{ name: "CCPUN_META_GRAPH_VERSION", present: Boolean(graphVersion), valid: versionReady }] : []),
    ],
    scopes: [...SOCIAL_READ_ONLY_SCOPES[provider]],
    providerWriteAllowed: false as const,
    backgroundSyncAllowed: false as const,
    limitation: analyticsLane
      ? "เจ้าของต้องกด Sync เอง บันทึกเฉพาะ metric ที่จับคู่ exact ID ใน Neon UAT และไม่มี publishing/upload scope"
      : "เจ้าของต้องกด Sync เอง ข้อมูลไม่ถูกบันทึก และไม่มี publishing/upload scope",
  };
}
