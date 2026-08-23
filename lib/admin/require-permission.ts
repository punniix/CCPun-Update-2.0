import "server-only";

import { redirect } from "next/navigation";
import { getAdminIdentity } from "./identity";
import { hasAdminPermission, type AdminPermission } from "./rbac";

export async function requireAdminPermission(permission: AdminPermission) {
  const identity = await getAdminIdentity();
  if (!identity) redirect("/snt-admin/login/");
  if (!hasAdminPermission(identity.role, permission)) redirect("/snt-admin/dashboard/?error=forbidden");
  return identity;
}
