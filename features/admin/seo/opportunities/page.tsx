import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPermission } from "@/lib/admin/require-permission";
import { getSeoIntelligenceRuntimeStatus, getSyntheticSeoIntelligenceSnapshot, type SeoOpportunityType } from "@/lib/admin/seo-intelligence/foundation";
import GscManualSync from "./GscManualSync";
import Ga4ManualSync from "./Ga4ManualSync";

export const metadata: Metadata = { title: "SEO Opportunities UAT" };

const typeLabel: Record<SeoOpportunityType, string> = {
  "ctr-underperformance": "CTR ต่ำกว่าฐาน",
  "position-4-15": "อันดับ 4–15",
  "content-decay": "Content Decay",
  cannibalization: "Cannibalization",
};

const providerStateLabel = {
  ready: "พร้อมใช้",
  unavailable: "Provider ไม่พร้อม",
  stale: "ข้อมูลเก่า",
  missing: "ข้อมูลไม่ครบ",
} as const;

function bangkokDate(daysAgo: number) {
  const date = new Date(Date.now() - daysAgo * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export default async function SeoOpportunitiesUatPage() {
  await requireAdminPermission("seo:read");
  if (!getSeoIntelligenceRuntimeStatus().enabled) notFound();
  const snapshot = getSyntheticSeoIntelligenceSnapshot();

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-[#e0c985]">WEBSITE 4.2 · MANUAL READ-ONLY UAT</p>
          <h1 className="mt-2 text-3xl font-semibold">SEO Opportunities</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">ปุ่ม Manual Sync เรียก GSC และ GA4 จริงแบบอ่านอย่างเดียวเมื่อคุณกด ส่วนการ์ด Opportunities ด้านล่างยังใช้หลักฐานจำลองเพื่อทดสอบกฎ ระบบไม่สร้างข้อเสนอและไม่แก้บทความ</p>
        </div>
        <Link href="/snt-admin/seo/" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5">กลับ SEO Control Center</Link>
      </div>

      <section className="mt-7 grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="text-sm text-white/60">Observations</div><div className="mt-2 text-lg font-semibold">{snapshot.observations}</div></article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="text-sm text-white/60">Opportunities</div><div className="mt-2 text-lg font-semibold">{snapshot.opportunities.length}</div></article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="text-sm text-white/60">การเปลี่ยน Production</div><div className="mt-2 font-semibold text-emerald-200">ไม่มี</div></article>
      </section>

      <GscManualSync defaultStartDate={bangkokDate(27)} defaultEndDate={bangkokDate(0)} />
      <Ga4ManualSync defaultStartDate={bangkokDate(27)} defaultEndDate={bangkokDate(0)} />

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Market provider states</h2>
            <p className="mt-1 text-sm text-white/55">สถานะจำลองสำหรับทดสอบ fallback เท่านั้น ไม่มีการเรียก Ubersuggest หรือ provider แบบเสียเงิน</p>
          </div>
          <span className="rounded-full border border-amber-200/20 px-3 py-1 text-xs text-amber-100/75">untrusted external data</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {snapshot.marketProviderStates.map((provider, index) => (
            <article key={`${provider.provider}:${provider.state}:${index}`} className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <div className="text-xs font-semibold tracking-wide text-[#e0c985]">{provider.provider}</div>
              <div className="mt-2 font-semibold">{providerStateLabel[provider.state]}</div>
              <p className="mt-2 text-xs leading-5 text-white/55">{provider.evidence?.keyword ?? "ไม่มีหลักฐานที่ใช้ได้"}</p>
              <p className="mt-2 text-xs leading-5 text-white/45">{provider.limitations[0]}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        {snapshot.opportunities.map((opportunity) => (
          <article key={opportunity.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-semibold tracking-wide text-[#e0c985]">{typeLabel[opportunity.type]} · {opportunity.branded ? "Brand" : "Non-brand"}</div>
              <div className="rounded-full border border-[#e0c985]/25 bg-[#e0c985]/10 px-3 py-1 text-sm font-semibold text-[#f4df9b]">Priority {opportunity.priority}/100</div>
            </div>
            <h2 className="mt-3 break-all text-lg font-semibold text-white/90">{opportunity.page}</h2>
            <p className="mt-2 text-sm text-white/55">Query cluster: {opportunity.queryCluster}</p>

            <dl className="mt-4 grid gap-2 sm:grid-cols-2">
              {opportunity.evidence.map((item) => <div key={item.label} className="rounded-xl border border-white/5 bg-black/10 p-3"><dt className="text-xs text-white/45">{item.label}</dt><dd className="mt-1 text-sm text-white/80">{item.value}</dd></div>)}
            </dl>

            <details className="mt-4 rounded-xl border border-white/10 p-3">
              <summary className="cursor-pointer text-sm font-medium text-white/75">เหตุผลของคะแนน</summary>
              <ul className="mt-3 space-y-2 text-xs leading-5 text-white/60">
                {Object.entries(opportunity.priorityComponents).map(([name, item]) => <li key={name}><strong className="text-white/75">{name} {item.value}/5:</strong> {item.reason}</li>)}
              </ul>
            </details>

            <div className="mt-4 text-sm leading-6 text-white/70">{opportunity.recommendedActions[0]}</div>
            <div className="mt-3 text-xs leading-5 text-amber-100/70">Protected: {opportunity.protectedFields.join(" · ")}</div>
          </article>
        ))}
      </section>

      <section role="note" className="mt-6 rounded-3xl border border-amber-200/20 bg-amber-200/[0.05] p-5 text-sm leading-6 text-amber-50/80">
        <strong>ข้อจำกัด:</strong> {snapshot.limitations.join(" · ")}
      </section>
    </div>
  );
}
