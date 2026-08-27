import { NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin/identity";
import { hasAdminPermission } from "@/lib/admin/rbac";
import {
  getSocialFoundationRuntimeStatus,
  socialFoundationSnapshotSchema,
  SYNTHETIC_SOCIAL_FOUNDATION,
} from "@/lib/admin/social-foundation";

export async function GET() {
  const identity = await getAdminIdentity();
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!hasAdminPermission(identity.role, "dashboard:read")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const runtime = getSocialFoundationRuntimeStatus();
  if (!runtime.enabled) return NextResponse.json({ error: "not-found" }, { status: 404 });

  const snapshot = socialFoundationSnapshotSchema.parse(SYNTHETIC_SOCIAL_FOUNDATION);
  return NextResponse.json(
    {
      snapshot,
      operationalDatabase: {
        configured: runtime.databaseConfigured,
        migrationApplied: false,
      },
      limitations: [
        "ข้อมูลทั้งหมดเป็น synthetic UAT",
        "ยังไม่เชื่อมบัญชี Social จริง",
        "ยังไม่มีการส่งงานไปยังแพลตฟอร์มหรือ Production",
      ],
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
