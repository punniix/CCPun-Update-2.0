import { getAdminEnvironment, isAdminMutationEnvironment, isAdminReadDataPlaneAllowed } from "./admin/environment";

const APP_ENVIRONMENT = getAdminEnvironment();

export const IS_REVIEW_ENVIRONMENT =
  process.env.VERCEL_ENV === "preview" ||
  process.env.CCPUN_UAT_MODE === "1" ||
  APP_ENVIRONMENT === "local-production" ||
  APP_ENVIRONMENT === "production-admin" ||
  isAdminMutationEnvironment(APP_ENVIRONMENT);

export const IS_DRAFT_PREVIEW_ALLOWED = isAdminReadDataPlaneAllowed(
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  APP_ENVIRONMENT,
);

export const PRODUCTION_ANALYTICS_ENABLED =
  process.env.VERCEL_ENV === "production" &&
  APP_ENVIRONMENT === "production" &&
  process.env.CCPUN_ENABLE_PRODUCTION_ANALYTICS === "1";
