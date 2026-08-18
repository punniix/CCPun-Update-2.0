export const IS_REVIEW_ENVIRONMENT =
  process.env.VERCEL_ENV === "preview" || process.env.CCPUN_UAT_MODE === "1";

export const PRODUCTION_ANALYTICS_ENABLED =
  process.env.VERCEL_ENV === "production" &&
  process.env.CCPUN_ENABLE_PRODUCTION_ANALYTICS === "1";
