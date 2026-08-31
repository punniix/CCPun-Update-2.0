import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPermission } from "@/lib/admin/require-permission";
import { getSocialAnalyticsDashboard, getSocialAnalyticsIngestionRuntimeStatus } from "@/lib/admin/social/analytics-ingestion";

export const metadata: Metadata = { title: "Social Analytics UAT" };

const platformLabel = { facebook: "Facebook", instagram: "Instagram", youtube: "YouTube", tiktok: "TikTok" } as const;

function metricValue(value: number, unit: string) {
  return `${value.toLocaleString("th-TH")}${unit === "seconds" ? " วินาที" : unit === "minutes" ? " นาที" : ""}`;
}

export default async function SocialAnalyticsUatPage() {
  await requireAdminPermission("social:read");
  if (!getSocialAnalyticsIngestionRuntimeStatus().enabled) notFound();
  const result = await getSocialAnalyticsDashboard().then((items) => ({ items, error: null })).catch(() => ({ items: [], error: "Neon UAT ติดต่อไม่ได้ชั่วคราว" }));
  const latest = result.items.map((item) => item.fetchedAt).sort().at(-1) ?? null;

  return <div>
    <p className="text-xs font-semibold tracking-[0.12em] text-[#e0c985]">WEBSITE 4.2 · HISTORICAL SOCIAL UAT</p>
    <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold">Social Analytics</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">ดูผลของแต่ละโพสต์ตามชื่อ metric ต้นทาง เปรียบเทียบกับ Snapshot ก่อนหน้า และไม่รวม Views/Reach ข้ามแพลตฟอร์ม</p>
      </div>
      <Link href="/snt-admin/distribution/operations/" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5">กลับ Social Operations</Link>
    </div>

    <section className="mt-7 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-sm text-white/50">อัปเดตข้อมูลล่าสุด</div>
      <div className="mt-2 text-xl font-semibold">{latest ? new Date(latest).toLocaleString("th-TH") : "ยังไม่มี Snapshot"}</div>
      <p className="mt-2 text-xs text-white/45">ข้อมูลจะเพิ่มเมื่อเจ้าของกด Sync ที่หน้า Connection และ Provider ID ตรงกับโพสต์ใน Neon เท่านั้น</p>
    </section>

    {result.error ? <p role="alert" className="mt-6 rounded-2xl border border-rose-200/20 bg-rose-200/[0.05] p-4 text-sm text-rose-100">{result.error}</p> : null}
    {!result.error && result.items.length === 0 ? <p className="mt-6 rounded-2xl border border-white/10 p-5 text-sm text-white/60">ยังไม่มีข้อมูลย้อนหลัง กด Sync Provider อย่างน้อยหนึ่งครั้งเพื่อเริ่ม Baseline</p> : null}

    <section className="mt-7 grid gap-4 lg:grid-cols-2">
      {result.items.map((item) => {
        const improving = item.metrics.filter((metric) => metric.delta !== null && metric.delta > 0);
        const signal = item.snapshotCount < 2 ? "เก็บ Snapshot รอบถัดไปเพื่อเห็นแนวโน้ม" : improving.length > 0 ? "ตัวเลขยังโต—พิจารณาต่อยอดรูปแบบและหัวข้อนี้" : "ตัวเลขยังไม่โต—ทบทวน Hook, ปก และการกระจายโพสต์";
        return <article key={item.publicationId} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#e0c985]">{platformLabel[item.platform]} · {item.provider}</div>
            <div className="text-xs text-white/45">{new Date(item.fetchedAt).toLocaleString("th-TH")}</div>
          </div>
          <h2 className="mt-3 font-semibold">โพสต์ {item.platformObjectId}</h2>
          <p className="mt-2 text-sm leading-6 text-emerald-100/80">{signal}</p>
          <dl className="mt-5 space-y-3">
            {item.metrics.map((metric) => <div key={metric.key} className="flex items-end justify-between gap-4 border-b border-white/5 pb-3">
              <div><dt className="text-sm text-white/70">{metric.label}</dt><dd className="mt-1 text-xs text-white/40">{metric.key}</dd></div>
              <div className="text-right"><dd className="font-semibold">{metricValue(metric.value, metric.unit)}</dd><dd className={`mt-1 text-xs ${metric.delta === null ? "text-white/40" : metric.delta > 0 ? "text-emerald-200" : metric.delta < 0 ? "text-rose-200" : "text-white/50"}`}>{metric.delta === null ? "รอรอบเปรียบเทียบ" : `${metric.delta > 0 ? "+" : ""}${metric.delta.toLocaleString("th-TH")} จากรอบก่อน`}</dd></div>
            </div>)}
          </dl>
          <p className="mt-4 text-xs leading-5 text-white/40">{item.limitation}</p>
        </article>;
      })}
    </section>
  </div>;
}
