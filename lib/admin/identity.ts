import "server-only";

import { auth } from "@/auth";
import type { AdminRole } from "./rbac";

export type AdminIdentity = {
  actorType: "human";
  actor: string;
  role: AdminRole;
  authSource: "authjs";
};

export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const session = await auth();

  if (session?.user?.role) {
    return {
      actorType: "human",
      actor: session.user.email ?? session.user.name ?? "authenticated-admin",
      role: session.user.role,
      authSource: "authjs",
    };
  }

  return null;
}
