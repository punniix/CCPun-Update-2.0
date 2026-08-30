import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPermission } from "@/lib/admin/require-permission";
import { buildSyntheticContentCalendar, getSocialOperationsRuntimeStatus } from "@/lib/admin/social/operations";

export const metadata: Metadata = { title: "Content Calendar UAT" };

const statusLabel = {
  draft: "Draft",
  approved: "อนุมัติแล้ว",
  queued: "รอส่ง",
  "native-scheduled": "นัดหมายในแพลตฟอร์ม",
  "awaiting-native-finish": "รอจบงานในแอป",
  processing: "กำลังดำเนินการ",
  published: "เผยแพร่แล้ว",
  failed: "ไม่สำเร็จ",
  cancelled: "ยกเลิก",
  superseded: "มีรุ่นใหม่แทน",
} as const;

export default async function ContentCalendarUatPage() {
  await requireAdminPermission("social:read");
  if (!getSocialOperationsRuntimeStatus().enabled) notFound();
  const items = buildSyntheticContentCalendar();

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-[#e0c985]">WEBSITE 4.2 · SYNTHETIC UAT</p>
          <h1 className="mt-2 text-3xl font-semibold">Content Calendar</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">มอง Master Content และสถานะของแต่ละช่องทางในที่เดียว ข้อมูลชุดนี้เป็น Fixture และไม่มีคำสั่งส่งโพสต์</p>
        </div>
        <Link href="/snt-admin/distribution/operations/" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5">กลับ Social Operations</Link>
      </div>

      <section className="mt-7 grid gap-4 lg:grid-cols-2" aria-label="รายการ Content Calendar">
        {items.map((item) => (
          <article key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><div className="text-xs font-semibold uppercase tracking-wide text-[#e0c985]">{item.platform} · {item.format}</div><h2 className="mt-2 font-semibold">{item.masterContentTitle}</h2></div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">{statusLabel[item.status]}</span>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-white/45">Publishing mode</dt><dd className="mt-1 text-white/75">{item.publishingMode}</dd></div>
              <div><dt className="text-white/45">Scheduled time</dt><dd className="mt-1 text-white/75">{item.scheduledAt ? new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date(item.scheduledAt)) : "ยังไม่กำหนด"}</dd></div>
              <div><dt className="text-white/45">Historical analytics</dt><dd className="mt-1 text-white/75">{item.analyticsAvailable ? "มี Fixture สำหรับทดสอบ" : "ยังไม่มี"}</dd></div>
              <div><dt className="text-white/45">Provider write</dt><dd className="mt-1 text-amber-200">ปิด</dd></div>
            </dl>
          </article>
        ))}
      </section>
    </div>
  );
}
