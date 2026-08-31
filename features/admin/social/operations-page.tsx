import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPermission } from "@/lib/admin/require-permission";
import { getSocialAnalyticsIngestionRuntimeStatus } from "@/lib/admin/social/analytics-ingestion";
import {
  getSocialOperationsRuntimeStatus,
  SYNTHETIC_COMMENT_SERIES_PLAN,
  socialOperationsSnapshotSchema,
  SYNTHETIC_SOCIAL_OPERATIONS,
} from "@/lib/admin/social/operations";

export const metadata: Metadata = { title: "Social Operations UAT" };

const actionLabel = {
  "wait-human-review": "รอเจ้าของตรวจ",
  "prepare-native-handoff": "พร้อมเตรียมส่งเข้า Native Scheduler",
  "wait-human-finish": "รอจบงานในแอป",
  hold: "พักไว้",
} as const;

export default async function SocialOperationsUatPage() {
  await requireAdminPermission("social:read");
  if (!getSocialOperationsRuntimeStatus().enabled) notFound();
  const snapshot = socialOperationsSnapshotSchema.parse(SYNTHETIC_SOCIAL_OPERATIONS);
  const analyticsEnabled = getSocialAnalyticsIngestionRuntimeStatus().enabled;

  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.12em] text-[#e0c985]">WEBSITE 4.2 · READ-ONLY UAT</p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-3xl font-semibold">Social Publishing & Analytics Core</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/snt-admin/distribution/analytics/" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5">ดู Social Analytics</Link>
          <Link href="/snt-admin/distribution/analytics/post-live/" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5">ดูสถิติย้อนหลัง Live</Link>
          <Link href="/snt-admin/distribution/connections/meta/" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5">ตรวจ Meta Connection</Link>
          <Link href="/snt-admin/distribution/connections/youtube/" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5">ตรวจ YouTube Connection</Link>
          <Link href="/snt-admin/distribution/connections/tiktok/" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5">ตรวจ TikTok Connection</Link>
          <Link href="/snt-admin/distribution/calendar/" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5">เปิด Content Calendar</Link>
        </div>
      </div>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
        ระบบเตรียม approval, scheduling, duplicate protection, retry และ audit ไว้แล้ว การอ่านสถิติย้อนหลังเขียนเฉพาะ Neon UAT เมื่อเจ้าของกด Sync ส่วนการส่งโพสต์จริงยังปิด
      </p>

      <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Approval", "พร้อม", "ผูก revision/version ที่มนุษย์อนุมัติ"],
          ["Duplicate protection", "พร้อม", "ใช้ idempotency key ต่อชิ้นงาน"],
          ["Retry & lease", "พร้อม", "CAS, lease expiry และ max attempts"],
          ["Provider write", "ปิด", "รอ API + exact platform approval"],
        ].map(([label, value, note]) => <article key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="text-xs text-white/50">{label}</div><div className={`mt-2 font-semibold ${value === "ปิด" ? "text-amber-200" : "text-emerald-200"}`}>{value}</div><div className="mt-2 text-xs leading-5 text-white/45">{note}</div>
        </article>)}
      </section>

      <section className="mt-7">
        <h2 className="text-xl font-semibold">แผนส่งงานจำลอง</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {snapshot.publicationPlans.map((plan) => (
            <article key={plan.publicationId} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#e0c985]">{plan.platform}</div>
              <div className="mt-2 font-semibold">{actionLabel[plan.nextAction]}</div>
              <p className="mt-3 text-sm leading-6 text-white/65">{plan.reason}</p>
              <div className="mt-4 text-xs text-amber-200">Provider write: ปิด</div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-[#e0c985]">Facebook Comment Series</div>
        <h2 className="mt-2 text-xl font-semibold">{SYNTHETIC_COMMENT_SERIES_PLAN.state === "wait-main-post" ? "รอ Main Post" : SYNTHETIC_COMMENT_SERIES_PLAN.state}</h2>
        <p className="mt-3 text-sm leading-6 text-white/65">{SYNTHETIC_COMMENT_SERIES_PLAN.reason}</p>
        <div className="mt-3 text-xs text-amber-200">Provider write: ปิด · ลำดับ, duplicate protection และ executor claim contract พร้อมแล้ว</div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Social Stats จำลอง</h2>
        {analyticsEnabled ? <p className="mt-2 text-sm text-emerald-200">Historical ingestion พร้อมใช้งานที่หน้า Social Analytics</p> : null}
        <p className="mt-2 text-sm text-white/60">เก็บชื่อ metric ของแต่ละแพลตฟอร์มตามต้นทาง และไม่บวก Views/Reach ข้ามแพลตฟอร์มเป็นยอดเดียว</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {snapshot.analytics.map((item) => (
            <article key={item.publicationId} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#e0c985]">{item.platform}</div>
              <div className="mt-2 text-xs text-white/45">เผยแพร่จำลองแล้ว · {snapshot.publications.find((publication) => publication.publicationId === item.publicationId)?.publishedAt?.slice(0, 10)}</div>
              <dl className="mt-4 space-y-3">
                {item.nativeMetrics.map((metric) => (
                  <div key={metric.key} className="flex items-end justify-between gap-3 border-b border-white/5 pb-3">
                    <div><dt className="text-sm text-white/70">{metric.label}</dt><dd className="mt-1 text-xs text-white/40">{metric.key}</dd></div>
                    <div className="text-lg font-semibold">{metric.value.toLocaleString("th-TH")}</div>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs leading-5 text-white/45">{item.limitations[0]}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
