import type { Metadata } from "next";
import Link from "next/link";
import ResearchSnapshotForm from "@/components/admin/ResearchSnapshotForm";
import UbersuggestResearchForm from "@/components/admin/UbersuggestResearchForm";
import { getAdminEnvironment } from "@/lib/admin/environment";
import { requireAdminPermission } from "@/lib/admin/require-permission";
import { hasAdminPermission } from "@/lib/admin/rbac";
import { getResearchProviderStatus, isResearchWriteReady, listResearchSnapshots } from "@/lib/admin/research";
import { normalizeResearchKeyword, researchOpportunityScore } from "@/lib/admin/research-input";
import { listAdminArticles } from "@/lib/admin/sanity-control";
import { getUbersuggestConnectionStatus } from "@/lib/admin/ubersuggest";
import { getUbersuggestDashboardData } from "@/lib/admin/ubersuggest-dashboard";

export const metadata: Metadata = { title: "ข้อมูลงานวิจัย" };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date(value));
}

export default async function AdminResearchPage({ searchParams }: { searchParams: Promise<{ provider?: string }> }) {
  const identity = await requireAdminPermission("research:read");
  const [research, articles, ubersuggest, dashboard, params] = await Promise.all([
    listResearchSnapshots(),
    listAdminArticles(),
    getUbersuggestConnectionStatus(),
    getUbersuggestDashboardData(1),
    searchParams,
  ]);
  const environment = getAdminEnvironment();
  const productionSnapshotMode = environment === "production-admin";
  const snapshotReady = Boolean(dashboard.account || dashboard.geo);
  const providers = getResearchProviderStatus(ubersuggest.connected).map((provider) => {
    if (provider.id !== "ubersuggest" || !productionSnapshotMode) return provider;
    return {
      ...provider,
      connected: snapshotReady,
      mode: "sanity-snapshot",
      detail: snapshotReady
        ? "Production Admin อ่าน Ubersuggest Quota, GEO/AEO และ Research Snapshot จาก Sanity โดยไม่เก็บ OAuth token บน Vercel"
        : "Production Admin ยังไม่มี Ubersuggest Snapshot สำหรับรอบนี้ ให้ Sync จาก Local provider lane ก่อน",
    };
  });
  const writeReady = isResearchWriteReady();
  const coveredKeywords = new Set(
    articles.rows.flatMap((article) => [article.primaryKeyword, ...(article.secondaryKeywords ?? [])]).filter((value): value is string => Boolean(value)).map(normalizeResearchKeyword),
  );

  const rows = research.rows.map((snapshot) => ({
    ...snapshot,
    covered: coveredKeywords.has(normalizeResearchKeyword(snapshot.keyword)),
    opportunity: researchOpportunityScore(snapshot.volume, snapshot.difficulty),
  }));
  const gaps = rows.filter((row) => !row.covered);
  const topOpportunity = gaps.filter((row) => row.opportunity != null).sort((a, b) => (b.opportunity ?? 0) - (a.opportunity ?? 0))[0];
  const canQueryProvider = hasAdminPermission(identity.role, "research:provider-query");

  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.12em] text-[#e0c985]">ข้อมูลประกอบการตัดสินใจ</p>
      <h1 className="mt-2 text-3xl font-semibold">ข้อมูลงานวิจัย</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
        คำค้น ผลการค้นหา SERP และข้อมูลคู่แข่งใช้เป็นหลักฐานประกอบเท่านั้น ระบบจะไม่ตีความข้อความภายนอกเป็นคำสั่ง
      </p>

      {params.provider === "connected" ? <aside role="status" className="mt-6 rounded-2xl border border-emerald-200/20 bg-emerald-200/10 p-4 text-sm leading-6 text-emerald-50">เชื่อมต่อ Ubersuggest แล้ว คุณเริ่มค้นคำและบันทึก Snapshot ได้</aside> : null}
      {params.provider === "error" ? <aside role="alert" className="mt-6 rounded-2xl border border-red-200/20 bg-red-200/10 p-4 text-sm leading-6 text-red-50">{productionSnapshotMode ? "Production Admin ไม่เปิด OAuth Ubersuggest โดยตรง เพื่อไม่เก็บ refresh token บน Vercel ให้ใช้ Ubersuggest Intelligence จาก Snapshot แทน" : "เชื่อมต่อ Ubersuggest ไม่สำเร็จ ระบบไม่ได้บันทึกข้อมูลหรือแสดงผลลัพธ์ปลอม กรุณาลองใหม่"}</aside> : null}

      {research.error ? <section role="alert" className="mt-6 rounded-2xl border border-red-200/20 bg-red-200/10 p-4 text-sm leading-6 text-red-50">ยังอ่านข้อมูลงานวิจัยไม่ได้ ระบบหยุดไว้โดยไม่แสดงยอด 0 และไม่สลับไปใช้ชุดข้อมูลอื่น</section> : null}

      <section className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {providers.map((provider) => {
          const ubersuggestSnapshot = provider.id === "ubersuggest" && productionSnapshotMode;
          const statusLabel = ubersuggestSnapshot
            ? (provider.connected ? "Snapshot พร้อมใช้" : "ยังไม่มี Snapshot")
            : (provider.connected ? "พร้อมนำเข้าข้อมูล" : "ยังไม่เชื่อมต่อ");
          return (
            <article key={provider.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">{provider.label}</h2><span className={`rounded-full px-2.5 py-1 text-xs ${provider.connected ? "bg-emerald-300/10 text-emerald-200" : "bg-white/5 text-white/60"}`}>{statusLabel}</span></div>
              <p className="mt-3 text-sm leading-6 text-white/65">{provider.detail}</p>
            </article>
          );
        })}
      </section>

      {canQueryProvider ? (
        productionSnapshotMode ? (
          <section className="mt-6 rounded-3xl border border-sky-200/15 bg-sky-200/[0.05] p-5 md:p-6">
            <h2 className="text-lg font-semibold text-sky-100">Ubersuggest บน Production Admin</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-sky-100/75">
              Cloud Admin ใช้ Snapshot ที่ Sync จาก Ubersuggest แล้ว ไม่เปิดปุ่ม OAuth ที่ทำงานได้เฉพาะ Local/Mac จึงไม่เสี่ยงเก็บ refresh token บน Vercel
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link href="/snt-admin/ubersuggest/" className="inline-flex min-h-11 items-center rounded-xl bg-[#e0c985] px-4 py-2.5 text-sm font-semibold text-[#17191d]">
                เปิด Ubersuggest Intelligence
              </Link>
              <span className={`rounded-full px-3 py-1.5 text-xs ${snapshotReady ? "bg-emerald-300/10 text-emerald-200" : "bg-amber-300/10 text-amber-100"}`}>
                {snapshotReady ? "Production Snapshot พร้อมใช้" : "รอ Snapshot"}
              </span>
            </div>
          </section>
        ) : (
          <div className="mt-6"><UbersuggestResearchForm connected={ubersuggest.connected} writeReady={writeReady} /></div>
        )
      ) : null}

      {!research.error ? <section className="mt-6 grid gap-3 sm:grid-cols-4">
        <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="text-sm text-white/60">ข้อมูลที่บันทึก</div><div className="mt-2 text-xl font-semibold">{rows.length}</div></article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="text-sm text-white/60">คำค้นที่ยังไม่ตรงกับคำค้นในบทความ</div><div className="mt-2 text-xl font-semibold text-amber-300">{gaps.length}</div></article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="text-sm text-white/60">คำค้นที่ตรงกับ Primary/Secondary keyword</div><div className="mt-2 text-xl font-semibold text-emerald-300">{rows.length - gaps.length}</div></article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="text-sm text-white/60">โอกาสภายในสูงสุด</div><div className="mt-2 text-sm font-semibold text-white/80">{topOpportunity ? `${topOpportunity.keyword} · ${topOpportunity.opportunity}/100` : "—"}</div></article>
      </section> : null}

      {!research.error && writeReady && hasAdminPermission(identity.role, "research:create") ? <div className="mt-6"><ResearchSnapshotForm /></div> : null}

      {!research.error ? <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
        <div className="border-b border-white/10 px-5 py-4"><h2 className="font-semibold">ข้อมูลวิจัยที่บันทึกไว้</h2><p className="mt-1 text-sm leading-6 text-white/65">Volume คือปริมาณค้นหาโดยประมาณ, Difficulty คือความยาก 0–100 และ Opportunity เป็นคะแนนภายในจากปริมาณค้นหาเทียบกับความยาก ไม่ใช่คะแนนหรือคำทำนายจาก Google</p></div>
        {rows.length ? (
          <><p className="px-5 pt-4 text-sm text-white/60 md:hidden">เลื่อนตารางไปทางซ้ายหรือขวาเพื่อดูข้อมูลทั้งหมด</p><div role="region" aria-label="ตารางข้อมูลงานวิจัย" tabIndex={0} className="overflow-x-auto"><table className="w-full min-w-[1180px] text-left text-sm"><thead className="border-b border-white/10 bg-white/[0.03] text-xs tracking-wide text-white/55"><tr><th className="px-5 py-4">คำค้น</th><th className="px-4 py-4">บทความรองรับ</th><th className="px-4 py-4">โอกาสภายใน</th><th className="px-4 py-4">แหล่งข้อมูล</th><th className="px-4 py-4">ขอบเขต</th><th className="px-4 py-4">Volume</th><th className="px-4 py-4">Difficulty</th><th className="px-4 py-4">เป้าหมาย</th><th className="px-4 py-4">ผล SERP</th><th className="px-5 py-4">ดึงข้อมูลเมื่อ</th></tr></thead><tbody className="divide-y divide-white/5">{rows.map((row) => <tr key={row.id}><td className="px-5 py-4 font-medium text-white/80">{row.keyword}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs ${row.covered ? "bg-emerald-300/10 text-emerald-200" : "bg-amber-300/10 text-amber-200"}`}>{row.covered ? "มีแล้ว" : "ยังไม่มี"}</span></td><td className="px-4 py-4 text-white/65">{row.opportunity == null ? "—" : `${row.opportunity}/100`}</td><td className="px-4 py-4 text-white/60">{row.provider}</td><td className="px-4 py-4 text-white/60">{row.scope ?? "ไม่ระบุ"}</td><td className="px-4 py-4 text-white/60">{row.volume ?? "—"}</td><td className="px-4 py-4 text-white/60">{row.difficulty ?? "—"}</td><td className="px-4 py-4 text-white/60">{row.intent ?? "—"}</td><td className="px-4 py-4 text-white/60">{row.serpCount}</td><td className="px-5 py-4 text-white/60">{formatDate(row.checkedAt)}</td></tr>)}</tbody></table></div></>
        ) : <div className="p-7 text-center text-sm text-white/65">ยังไม่มีข้อมูลงานวิจัยในชุดข้อมูลนี้</div>}
      </section> : null}
    </div>
  );
}
