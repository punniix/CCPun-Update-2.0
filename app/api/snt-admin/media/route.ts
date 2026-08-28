import { NextResponse } from "next/server";
import { isConfiguredAdminOrigin } from "@/lib/admin/auth-config";
import { getAdminIdentity } from "@/lib/admin/identity";
import { hasAdminPermission } from "@/lib/admin/rbac";
import {
  getMediaLibraryRuntimeStatus,
  getMediaStorageProviderState,
  mediaLibrarySnapshotSchema,
  SYNTHETIC_MEDIA_LIBRARY,
} from "@/lib/admin/media/foundation";

export async function GET(request: Request) {
  const identity = await getAdminIdentity();
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!hasAdminPermission(identity.role, "social:read")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!isConfiguredAdminOrigin(request.url, process.env.AUTH_URL)) {
    return NextResponse.json({ error: "forbidden-origin" }, { status: 403 });
  }
  if (!getMediaLibraryRuntimeStatus().enabled) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      snapshot: mediaLibrarySnapshotSchema.parse(SYNTHETIC_MEDIA_LIBRARY),
      storage: getMediaStorageProviderState(),
      limitations: [
        "ข้อมูลทั้งหมดเป็น synthetic UAT",
        "ยังไม่เชื่อม storage provider",
        "ไม่มี media URL หรือข้อมูลรับรองสิทธิ์ในผลลัพธ์",
        "ยังไม่มีการอัปโหลดหรือส่งสื่อจริง",
      ],
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
