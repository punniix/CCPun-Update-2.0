import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPermission } from "@/lib/admin/require-permission";
import { getSocialOperationsRuntimeStatus } from "@/lib/admin/social/operations";
import { isSocialPublicationApprovalEnabled } from "@/lib/admin/social/publishing";
import SocialPostsWorkspace from "@/features/admin/social/SocialPostsWorkspace";

export const metadata: Metadata = { title: "Social Posts & Drafts UAT" };

export default async function SocialOperationsUatPage() {
  await requireAdminPermission("social:read");
  if (!getSocialOperationsRuntimeStatus().enabled) notFound();

  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.12em] text-[#e0c985]">WEBSITE 4.2 · SANITY UAT DRAFTS</p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Social Posts & Drafts</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
            สร้างและแก้ Sanity Draft จริงด้วย revision ที่ตรวจสอบได้ พร้อมดู publication state ในมุมมองเดียว การบันทึก Draft ไม่อนุมัติและไม่ส่งโพสต์ให้แพลตฟอร์ม
          </p>
        </div>
        <Link href="/snt-admin/distribution/calendar/" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#e0c985]">เปิด Calendar</Link>
      </div>

      <section role="note" className="mt-6 rounded-2xl border border-amber-200/20 bg-amber-200/[0.05] px-4 py-3 text-sm leading-6 text-amber-50/85">
        Provider write ปิดอยู่ · การตั้งเวลา Facebook และการส่งต่อ Instagram ต้องยืนยันในแอปของแพลตฟอร์มด้วยตนเอง
      </section>

      <SocialPostsWorkspace approvalEnabled={isSocialPublicationApprovalEnabled()} />

      <nav aria-label="ลิงก์ Social ขั้นสูง" className="mt-8 flex flex-wrap gap-2 border-t border-white/10 pt-5">
        <Link href="/snt-admin/distribution/analytics/" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5">ดู Social Stats</Link>
        <Link href="/snt-admin/distribution/analytics/post-live/" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5">ดูสถิติย้อนหลัง Live</Link>
        <Link href="/snt-admin/distribution/connections/meta/" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5">ตรวจ Meta Connection</Link>
        <Link href="/snt-admin/distribution/connections/youtube/" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5">ตรวจ YouTube Connection</Link>
        <Link href="/snt-admin/distribution/connections/tiktok/" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5">ตรวจ TikTok Connection</Link>
      </nav>
    </div>
  );
}
