import { z } from "zod";
import {
  resolveSocialRuntime,
  SOCIAL_UAT_ANALYTICS_BRANCH,
  SOCIAL_UAT_PROVIDER_BRANCH,
} from "./runtime";

if (typeof window !== "undefined") throw new Error("SOCIAL_PROVIDER_READINESS_SERVER_ONLY");

export const WEBSITE_42_SOCIAL_PROVIDER_BRANCH = SOCIAL_UAT_PROVIDER_BRANCH;
export const WEBSITE_42_SOCIAL_ANALYTICS_BRANCH = SOCIAL_UAT_ANALYTICS_BRANCH;
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
  const runtime = resolveSocialRuntime(env, {
      uatBranches: [WEBSITE_42_SOCIAL_PROVIDER_BRANCH, WEBSITE_42_SOCIAL_ANALYTICS_BRANCH],
    });
  const laneReady = env.CCPUN_SOCIAL_PROVIDER_READS_ENABLED === "1" && Boolean(runtime);
  const prefix = provider === "meta" ? "META" : provider === "youtube" ? "YOUTUBE" : "TIKTOK";
  const scopeVariable = `CCPUN_${prefix}_GRANTED_SCOPES`;
  const tokenVariable = `CCPUN_${prefix}_ACCESS_TOKEN`;
  const graphVersion = provider === "meta" ? env.CCPUN_META_GRAPH_VERSION?.trim() : undefined;
  const analyticsLane = Boolean(runtime)
    && env.CCPUN_SOCIAL_ANALYTICS_INGESTION_ENABLED === "1";
  const scopeReady = provider === "meta"
    ? SOCIAL_READ_ONLY_SCOPES.meta.every((scope) => env[scopeVariable]?.split(",").map((item) => item.trim()).includes(scope))
    : exactScopes(env[scopeVariable], SOCIAL_READ_ONLY_SCOPES[provider]);
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
      ? "เจ้าของต้องกด Sync เอง บันทึกเฉพาะ metric ที่จับคู่ exact ID ใน Neon UAT และ provider writes ยังปิดแม้ token มี publishing scope"
      : "เจ้าของต้องกด Sync เอง ข้อมูลไม่ถูกบันทึก และ provider writes ยังปิดแม้ token มี publishing scope",
  };
}
