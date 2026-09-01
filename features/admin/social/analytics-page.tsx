import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPermission } from "@/lib/admin/require-permission";
import { getSocialAnalyticsDashboard, getSocialAnalyticsIngestionRuntimeStatus } from "@/lib/admin/social/analytics-ingestion";
import SocialStatsDashboard, { type SocialAnalyticsItem } from "@/features/admin/social/SocialStatsDashboard";

export const metadata: Metadata = { title: "Social Stats" };

export default async function SocialAnalyticsUatPage() {
  await requireAdminPermission("social:read");
  if (!getSocialAnalyticsIngestionRuntimeStatus().enabled) notFound();
  const result = await getSocialAnalyticsDashboard()
    .then((items) => ({ items, error: null }))
    .catch(() => ({ items: [], error: "ฐานข้อมูลสถิติติดต่อไม่ได้ชั่วคราว" }));
  const items: SocialAnalyticsItem[] = result.items.map((item) => ({
    ...item,
    metrics: item.metrics.map((metric) => ({ ...metric, delta: metric.delta })),
  }));

  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.12em] text-[#e0c985]">SOCIAL · HISTORICAL STATS</p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Social Stats</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
            กรอง เปรียบเทียบ และดูประวัติ Snapshot ของแต่ละโพสต์ โดยคงชื่อ metric ต้นทางและไม่รวม Views/Reach ข้ามแพลตฟอร์ม
          </p>
        </div>
        <Link href="/snt-admin/distribution/operations/" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#e0c985]">เปิด Social Posts</Link>
      </div>

      {result.error ? <p role="alert" className="mt-6 rounded-2xl border border-rose-200/20 bg-rose-200/[0.05] p-4 text-sm text-rose-100">{result.error}</p> : null}
      {!result.error && items.length === 0 ? <p className="mt-6 rounded-2xl border border-white/10 p-5 text-sm text-white/65">ยังไม่มีข้อมูลย้อนหลัง กด Sync Provider อย่างน้อยหนึ่งครั้งเพื่อเริ่ม Baseline</p> : null}
      {!result.error && items.length ? <SocialStatsDashboard items={items} /> : null}
    </div>
  );
}
