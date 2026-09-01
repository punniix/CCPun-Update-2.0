import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPermission } from "@/lib/admin/require-permission";
import { getSocialOperationsRuntimeStatus } from "@/lib/admin/social/operations";
import { SocialOverviewSummary } from "@/features/admin/social/SocialWorkspaceSummary";

export const metadata: Metadata = { title: "Social Overview UAT" };

const routes = [
  { href: "/snt-admin/distribution/operations/", label: "Posts", title: "เตรียมโพสต์และฉบับร่าง", detail: "แพลตฟอร์ม เวลา สื่อ แคปชัน สถานะอนุมัติ และ mobile handoff" },
  { href: "/snt-admin/distribution/calendar/", label: "Calendar", title: "ดูแผนเผยแพร่", detail: "ดูวันเวลา สถานะ และ publishing mode ของทุกช่องทาง" },
  { href: "/snt-admin/distribution/analytics/", label: "Stats", title: "วิเคราะห์ผลโพสต์", detail: "กรอง metric ดูแนวโน้ม Top content และ Raw Snapshot History" },
  { href: "/snt-admin/distribution/connections/", label: "Connections", title: "ตรวจการเชื่อมต่อ", detail: "Meta, YouTube และ TikTok แบบ manual read-only" },
] as const;

export default async function SocialOverviewPage() {
  await requireAdminPermission("social:read");
  if (!getSocialOperationsRuntimeStatus().enabled) notFound();

  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.12em] text-[#e0c985]">WEBSITE 4.2 · SOCIAL WORKSPACE</p>
      <h1 className="mt-2 text-3xl font-semibold">Social Overview</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">ภาพรวมจาก Sanity Draft และ publication record ปัจจุบัน รายการใหม่ใน UAT จะปรากฏผ่าน API อัตโนมัติ และไม่มี Provider call จากหน้านี้</p>

      <SocialOverviewSummary />

      <section aria-label="ทางลัด Social" className="mt-6 grid gap-4 md:grid-cols-2">
        {routes.map((route) => (
          <Link key={route.href} href={route.href} className="group rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#e0c985]/40 hover:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-[#e0c985]">
            <div className="text-xs font-semibold tracking-wide text-[#e0c985]">{route.label}</div>
            <h2 className="mt-2 text-lg font-semibold group-hover:text-[#f4df9b]">{route.title}</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">{route.detail}</p>
          </Link>
        ))}
      </section>

      <p className="mt-6 text-xs leading-5 text-white/60">Provider write ปิดอยู่ · ไม่มี cron, background publishing หรือ automatic native draft creation</p>
    </div>
  );
}
