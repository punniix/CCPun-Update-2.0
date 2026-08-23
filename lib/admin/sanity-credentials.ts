import "server-only";

import { getAdminEnvironment, isLocalProductionDraftWriteEnabled } from "./environment";

export function getAdminSanityReadToken(): string | undefined {
  const value = getAdminEnvironment() === "local-production"
    ? process.env.SANITY_PRODUCTION_API_READ_TOKEN
    : process.env.SANITY_API_READ_TOKEN;
  return value?.trim() || undefined;
}

export function getAdminSanityWriteToken(): string | undefined {
  const environment = getAdminEnvironment();
  if (environment === "local-production" && !isLocalProductionDraftWriteEnabled(environment)) return undefined;
  const value = environment === "local-production"
    ? process.env.SANITY_PRODUCTION_API_WRITE_TOKEN
    : process.env.SANITY_API_WRITE_TOKEN;
  return value?.trim() || undefined;
}

export function getAdminSanityResearchWriteToken(): string | undefined {
  const environment = getAdminEnvironment();
  const value = environment === "local-production"
    ? process.env.SANITY_PRODUCTION_RESEARCH_WRITE_TOKEN
    : process.env.SANITY_API_WRITE_TOKEN;
  return value?.trim() || undefined;
}
