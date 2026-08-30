export const ADMIN_OPERATIONS_MIGRATION_VERSION = "20260830_website_42_admin_operations_v1";
export const ADMIN_OPERATIONS_MIGRATION_CHECKSUM = "sha256:51f16b563368488362408f323f95863ecf8f277b6b725b96189fedddf1300e4f";
export const ADMIN_OPERATIONS_IDENTITY = {
  projectId: "young-term-47483330",
  branchId: "br-crimson-mouse-az7ajkv8",
  endpointId: "ep-mute-frost-aztvz394",
  database: "neondb",
  runtimeRole: "ccpun_admin_runtime",
} as const;

const ADMIN_OPERATIONS_HOSTS = new Set([
  `${ADMIN_OPERATIONS_IDENTITY.endpointId}.ap-southeast-1.aws.neon.tech`,
  `${ADMIN_OPERATIONS_IDENTITY.endpointId}-pooler.ap-southeast-1.aws.neon.tech`,
]);

export type AdminOperationsRuntimeIdentity = {
  environment: string | undefined;
  projectId: string | undefined;
  branchId: string | undefined;
  database: string | undefined;
  connectionString: string | undefined;
};

export function isAdminOperationsRuntimeIdentityValid(input: AdminOperationsRuntimeIdentity) {
  if (!input.connectionString || !["admin-uat", "local-uat"].includes(input.environment ?? "")) return false;
  if (input.projectId !== ADMIN_OPERATIONS_IDENTITY.projectId || input.branchId !== ADMIN_OPERATIONS_IDENTITY.branchId || input.database !== ADMIN_OPERATIONS_IDENTITY.database) return false;
  try {
    const url = new URL(input.connectionString);
    return (
      url.protocol === "postgresql:" &&
      ADMIN_OPERATIONS_HOSTS.has(url.hostname) &&
      decodeURIComponent(url.username) === ADMIN_OPERATIONS_IDENTITY.runtimeRole &&
      decodeURIComponent(url.pathname.slice(1)) === ADMIN_OPERATIONS_IDENTITY.database
    );
  } catch {
    return false;
  }
}
