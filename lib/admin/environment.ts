export const ADMIN_ENVIRONMENTS = [
  "development",
  "web-uat",
  "local-uat",
  "local-production",
  "lab",
  "uat",
  "production-admin",
  "production",
  "unknown",
] as const;

export type AdminEnvironment = (typeof ADMIN_ENVIRONMENTS)[number];

export const CCPUN_VERCEL_PROJECT_IDS = {
  web: "prj_dxwjITkd0av5QiJQv2snUlIASUWu",
  adminProduction: "prj_6tuUxJxYbQ4mpF7sMgNWx2p2jowN",
  adminNonproduction: "prj_F6yodVaz1U57FcUlEXsKBazI7KF7",
  legacyAdminLab: "prj_438M14AAob2nbf20q7Xa5L7A7aMo",
  legacyAdminUat: "prj_OR7AlGsE8spGahQegDvd0JudaiEg",
} as const;

const EXPLICIT_ENVIRONMENTS = new Set<AdminEnvironment>([
  "development",
  "web-uat",
  "local-uat",
  "local-production",
  "lab",
  "uat",
  "production-admin",
  "production",
]);

const SANITY_DATASET_BY_ENVIRONMENT: Partial<Record<AdminEnvironment, "uat" | "production">> = {
  development: "uat",
  "web-uat": "uat",
  "local-uat": "uat",
  "local-production": "production",
  lab: "uat",
  uat: "uat",
  "production-admin": "production",
  production: "production",
};

const SANITY_PROJECT_BY_ENVIRONMENT: Partial<Record<AdminEnvironment, string>> = {
  development: "ccb9lnw5",
  "web-uat": "ccb9lnw5",
  "local-uat": "ccb9lnw5",
  "local-production": "kyfxgjnq",
  lab: "ccb9lnw5",
  uat: "ccb9lnw5",
  "production-admin": "kyfxgjnq",
  production: "kyfxgjnq",
};

function getDeploymentProjectId() {
  return (
    process.env.VERCEL_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_CCPUN_VERCEL_PROJECT_ID?.trim()
  );
}

function getProductionAdminProjectId() {
  return (
    process.env.CCPUN_PRODUCTION_ADMIN_VERCEL_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_CCPUN_PRODUCTION_ADMIN_VERCEL_PROJECT_ID?.trim()
  );
}

function getSanityProjectId() {
  return process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
}

export function isSanityProjectAllowed(
  projectId: string | undefined,
  environment = getAdminEnvironment(),
): boolean {
  const expectedProjectId = SANITY_PROJECT_BY_ENVIRONMENT[environment];
  return Boolean(projectId && expectedProjectId && projectId === expectedProjectId);
}

export function parseAdminEnvironment(value: string | undefined): AdminEnvironment {
  const explicit = value?.trim().toLowerCase();

  if (explicit && EXPLICIT_ENVIRONMENTS.has(explicit as AdminEnvironment)) {
    return explicit as AdminEnvironment;
  }

  return "unknown";
}

export function getAdminEnvironment(): AdminEnvironment {
  return parseAdminEnvironment(process.env.CCPUN_APP_ENV);
}

export function resolveSanityConfigEnvironment(
  publicValue: string | undefined,
  serverValue: string | undefined,
  serverRuntime: boolean,
): AdminEnvironment {
  const publicEnvironment = parseAdminEnvironment(publicValue);
  if (!serverRuntime) return publicEnvironment;

  const serverEnvironment = parseAdminEnvironment(serverValue);
  if (serverEnvironment === "unknown") return "unknown";
  if (publicEnvironment !== "unknown" && publicEnvironment !== serverEnvironment) return "unknown";
  return serverEnvironment;
}

export function isDeploymentProjectAllowed(
  environment: AdminEnvironment,
  deploymentProjectId = getDeploymentProjectId(),
  productionAdminProjectId = getProductionAdminProjectId(),
): boolean {
  switch (environment) {
    case "development":
      return (
        !deploymentProjectId ||
        deploymentProjectId === CCPUN_VERCEL_PROJECT_IDS.web ||
        deploymentProjectId === CCPUN_VERCEL_PROJECT_IDS.adminNonproduction
      );
    case "web-uat":
      return deploymentProjectId === CCPUN_VERCEL_PROJECT_IDS.web;
    case "local-uat":
    case "local-production":
      return !deploymentProjectId;
    case "lab":
    case "uat":
      return deploymentProjectId === CCPUN_VERCEL_PROJECT_IDS.adminNonproduction;
    case "production-admin":
      return Boolean(
        deploymentProjectId === CCPUN_VERCEL_PROJECT_IDS.adminProduction &&
        productionAdminProjectId === CCPUN_VERCEL_PROJECT_IDS.adminProduction,
      );
    case "production":
      return deploymentProjectId === CCPUN_VERCEL_PROJECT_IDS.web;
    default:
      return false;
  }
}

export function isAdminSurfaceAllowed(
  environment = getAdminEnvironment(),
  deploymentProjectId = getDeploymentProjectId(),
  productionAdminProjectId = getProductionAdminProjectId(),
): boolean {
  switch (environment) {
    case "development":
      return !deploymentProjectId || deploymentProjectId === CCPUN_VERCEL_PROJECT_IDS.adminNonproduction;
    case "local-uat":
    case "local-production":
    case "lab":
    case "uat":
    case "production-admin":
      return isDeploymentProjectAllowed(environment, deploymentProjectId, productionAdminProjectId);
    default:
      return false;
  }
}

export function isSanityLaneAllowed(
  dataset: string | undefined,
  environment = getAdminEnvironment(),
  deploymentProjectId = getDeploymentProjectId(),
  productionAdminProjectId = getProductionAdminProjectId(),
  sanityProjectId = getSanityProjectId(),
): boolean {
  const expectedDataset = SANITY_DATASET_BY_ENVIRONMENT[environment];
  return Boolean(
    dataset &&
    expectedDataset &&
    expectedDataset === dataset &&
    isSanityProjectAllowed(sanityProjectId, environment) &&
    isDeploymentProjectAllowed(environment, deploymentProjectId, productionAdminProjectId),
  );
}

export function isAdminMutationEnvironment(
  environment = getAdminEnvironment(),
  deploymentProjectId = getDeploymentProjectId(),
  productionAdminProjectId = getProductionAdminProjectId(),
): boolean {
  if (!isAdminSurfaceAllowed(environment, deploymentProjectId, productionAdminProjectId)) return false;

  return (
    environment === "development" ||
    environment === "local-uat" ||
    environment === "lab" ||
    environment === "uat" ||
    (environment === "local-production" && isLocalProductionDraftWriteEnabled(environment)) ||
    environment === "production-admin"
  );
}

export function isLocalProductionDraftWriteEnabled(
  environment = getAdminEnvironment(),
  value = typeof window === "undefined"
    ? process.env.CCPUN_LOCAL_PRODUCTION_DRAFT_WRITES
    : process.env.NEXT_PUBLIC_CCPUN_LOCAL_PRODUCTION_DRAFT_WRITES,
): boolean {
  return environment === "local-production" && value === "1";
}

export function isAdminReadDataPlaneAllowed(
  dataset: string | undefined,
  environment = getAdminEnvironment(),
  deploymentProjectId = getDeploymentProjectId(),
  productionAdminProjectId = getProductionAdminProjectId(),
  sanityProjectId = getSanityProjectId(),
): boolean {
  return (
    isAdminSurfaceAllowed(environment, deploymentProjectId, productionAdminProjectId) &&
    isSanityLaneAllowed(dataset, environment, deploymentProjectId, productionAdminProjectId, sanityProjectId)
  );
}

export function isAdminDataPlaneAllowed(
  dataset: string | undefined,
  environment = getAdminEnvironment(),
  deploymentProjectId = getDeploymentProjectId(),
  productionAdminProjectId = getProductionAdminProjectId(),
  sanityProjectId = getSanityProjectId(),
): boolean {
  return (
    isAdminMutationEnvironment(environment, deploymentProjectId, productionAdminProjectId) &&
    isSanityLaneAllowed(dataset, environment, deploymentProjectId, productionAdminProjectId, sanityProjectId)
  );
}

export function isStudioDataPlaneAllowed(
  dataset: string | undefined,
  environment = getAdminEnvironment(),
  deploymentProjectId = getDeploymentProjectId(),
  productionAdminProjectId = getProductionAdminProjectId(),
  sanityProjectId = getSanityProjectId(),
): boolean {
  if (environment === "local-production" && !isLocalProductionDraftWriteEnabled(environment)) return false;
  return (
    isAdminSurfaceAllowed(environment, deploymentProjectId, productionAdminProjectId) &&
    isSanityLaneAllowed(dataset, environment, deploymentProjectId, productionAdminProjectId, sanityProjectId)
  );
}

export function isProductionEnvironment(environment = getAdminEnvironment()): boolean {
  return environment === "production";
}

export function getEnvironmentLabel(environment = getAdminEnvironment()): string {
  switch (environment) {
    case "development":
      return "LOCAL DEVELOPMENT";
    case "web-uat":
      return "WEB UAT";
    case "local-uat":
      return "LOCAL UAT";
    case "local-production":
      return "LOCAL PRODUCTION DRAFT";
    case "lab":
      return "MAJOR LAB";
    case "uat":
      return "UAT";
    case "production-admin":
      return "PRODUCTION ADMIN";
    case "production":
      return "PRODUCTION";
    default:
      return "ENVIRONMENT UNKNOWN";
  }
}
