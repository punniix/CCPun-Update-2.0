import type { DefaultSession } from "next-auth";
import type { AdminRole } from "../lib/admin/rbac";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      role: AdminRole | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    adminRole?: AdminRole | null;
  }
}
