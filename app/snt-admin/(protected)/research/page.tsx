import type { Metadata } from "next";
import ResearchSnapshotForm from "@/components/admin/ResearchSnapshotForm";
import SyncUbersuggestButton from "@/components/admin/SyncUbersuggestButton";
import UbersuggestResearchForm from "@/components/admin/UbersuggestResearchForm";
import { getAdminEnvironment } from "@/lib/admin/environment";
import { requireAdminPermission } from "@/lib/admin/require-permission";
import { hasAdminPermission } from "@/lib/admin/rbac";
import { getResearchProviderStatus, isResearchWriteReady, listResearchSnapshots } from "@/lib/admin/research";
import { normalizeResearchKeyword, researchOpportunityScore } from "@/lib/admin/research-input";
import { listAdminArticles } from "@/lib/admin/sanity-control";
import { getUbersuggestConnectionStatus } from "@/lib/admin/ubersuggest";
import {
  getUbersuggestDashboardData,
  isSnapshotFresh,
  isUbersuggestSyncWriteReady,
} from "@/lib/admin/ubersuggest-dashboard";

export const metadata: Metadata = { title: "Research Intelligence" };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

function quotaClass(status: "available" | "near-limit" | "full") {
  if (status === "full") return "border-red-300/20 bg-red-300/[0.06] text-red-100";
  if (status === "near-limit") return "border-amber-300/20 bg-amber-300/[0.06] text-amber-100";
  return "border-emerald-300/20 bg-emerald-300/[0.05] text-emerald-100";
}

function providerLabel(value: string) {
  if (value === "openai") return "OpenAI";
  if (value === "gemini") return "Gemini";
  if (value === "google_aio") return "Google AI Overviews";
  return value;
}

function actionLabel(covered: boolean, opportunity: number | null) {
  if (covered) return "มีบทความรองรับ";
  if (opportunity != null && opportunity >= 70) return "Research gap · โอกาสสูง";
  return "Research gap";
}

export default async function AdminResearchPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string }>;
}) {
  const identity = await requireAdminPermission("research:read");
  const [research, articles, ubersuggest, dashboard, params] = await Promise.all([
    listResearchSnapshots(),
    listAdminArticles(),
    getUbersuggestConnectionStatus(),
    getUbersuggestDashboardData(30),
    searchParams,
  ]);

  const environment = getAdminEnvironment();
  const productionSnapshotMode = environment === "production-admin";
  const localProviderLane = ["development", "local-uat", "local-production"].includes(environment);
  const snapshotReady = Boolean(dashboard.account || dashboard.geo);
  const writeReady = isResearchWriteReady();
  const canQueryProvider = hasAdminPermission(identity.role, "research:provider-query");
  const canSync = localProviderLane
    && ubersuggest.connected
    && isUbersuggestSyncWriteReady()
    && canQueryProvider;

  const providers = getResearchProviderStatus(ubersuggest.connected).map((provider) => {
    if (provider.id !== "ubersuggest" || !productionSnapshotMode) return provider;
    return {
      ...provider,
      connected: snapshotReady,
      mode: "sanity-snapshot",
      detail: snapshotReady
        ? "Production Admin อ่าน Quota, Keyword Research และ GEO/AEO snapshot จาก Sanity โดยไม่เก็บ OAuth token บน Vercel"
        : "Production Admin ยังไม่มี Ubersuggest snapshot สำหรับรอบนี้ ให้ Sync จาก Local provider lane ก่อน",
    };
  });

  const coveredKeywords = new Set(
    articles.rows
      .flatMap((article) => [article.primaryKeyword, ...(article.secondaryKeywords ?? [])])
      .filter((value): value is string => Boolean(value))
      .map(normalizeResearchKeyword),
  );

  const rows = research.rows.map((snapshot) => ({
    ...snapshot,
    covered: coveredKeywords.has(normalizeResearchKeyword(snapshot.keyword)),
    opportunity: researchOpportunityScore(snapshot.volume, snapshot.difficulty),
  }));
  const gaps = rows.filter((row) => !row.covered);
  const topOpportunity = gaps
    .filter((row) => row.opportunity != null)
    .sort((a, b) => (b.opportunity ?? 0) - (a.opportunity ?? 0))[0];

  const account = dashboard.account;
  const geo = dashboard.geo;
  const accountFresh = isSnapshotFresh(account?.checkedAt, 24);
  const geoFresh = isSnapshotFresh(geo?.checkedAt, 35 * 24);
  const promptGaps = [...(geo?.prompts ?? [])]
    .filter((prompt) => prompt.userVisibilityPercentage === 0)
    .sort((a, b) => b.totalAnswers - a.totalAnswers);

  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.12em] text-[#e0c985]">SEO + GEO/AEO decision workspace</p>
      <h1 className="mt-2 text-3xl font-semibold">Research Intelligence</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
        รวม Keyword Research, Ubersuggest Quota, บทความที่รองรับ, GEO/AEO Prompt Gaps และประวัติ Research ไว้ใน workflow เดียว ข้อมูลภายนอกเป็นหลักฐานประกอบและจะไม่ถูกตีความเป็นคำสั่ง
      </p>

      <nav aria-label="Research Intelligence workflow" className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["#capture", "1 · เก็บข้อมูล"],
          ["#coverage", "2 · Match บทความ"],
          ["#ubersuggest-intelligence", "3 · Ubersuggest"],
          ["#geo-aeo", "4 · GEO / AEO"],
          ["#history", "5 · History"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="inline-flex min-h-11 items-center rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5 text-sm text-white/70 transition hover:border-[#e0c985]/30 hover:text-[#f4df9b]">
            {label}
          </a>
        ))}
      </nav>

      {params.provider === "connected" ? (
        <aside role="status" className="mt-6 rounded-2xl border border-emerald-200/20 bg-emerald-200/10 p-4 text-sm leading-6 text-emerald-50">
          เชื่อมต่อ Ubersuggest แล้ว คุณเริ่มค้นคำและบันทึก Snapshot ได้
        </aside>
      ) : null}
      {params.provider === "error" ? (
        <aside role="alert" className="mt-6 rounded-2xl border border-red-200/20 bg-red-200/10 p-4 text-sm leading-6 text-red-50">
          {productionSnapshotMode
            ? "Production Admin ไม่เปิด OAuth Ubersuggest โดยตรง เพื่อไม่เก็บ refresh token บน Vercel ระบบยังอ่าน Snapshot ที่ Sync ไว้ได้ตามปกติ"
            : "เชื่อมต่อ Ubersuggest ไม่สำเร็จ ระบบไม่ได้บันทึกข้อมูลหรือแสดงผลลัพธ์ปลอม กรุณาลองใหม่"}
        </aside>
      ) : null}
      {research.error ? (
        <section role="alert" className="mt-6 rounded-2xl border border-red-200/20 bg-red-200/10 p-4 text-sm leading-6 text-red-50">
          ยังอ่านข้อมูลงานวิจัยไม่ได้ ระบบหยุดไว้โดยไม่แสดงยอด 0 และไม่สลับไปใช้ชุดข้อมูลอื่น
        </section>
      ) : null}
      {dashboard.error ? (
        <section role="alert" className="mt-6 rounded-2xl border border-red-200/20 bg-red-200/10 p-4 text-sm leading-6 text-red-50">
          ยังอ่าน Ubersuggest snapshots ไม่สำเร็จ ระบบจะไม่แทนข้อมูลด้วยเลข 0 หรือข้อมูลเดา
        </section>
      ) : null}

      <section className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="สถานะแหล่งข้อมูล">
        {providers.map((provider) => {
          const ubersuggestSnapshot = provider.id === "ubersuggest" && productionSnapshotMode;
          const statusLabel = ubersuggestSnapshot
            ? provider.connected
              ? "Snapshot พร้อมใช้"
              : "ยังไม่มี Snapshot"
            : provider.connected
              ? "พร้อมนำเข้าข้อมูล"
              : "ยังไม่เชื่อมต่อ";
          return (
            <article key={provider.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">{provider.label}</h2>
                <span className={`rounded-full px-2.5 py-1 text-xs ${provider.connected ? "bg-emerald-300/10 text-emerald-200" : "bg-white/5 text-white/60"}`}>
                  {statusLabel}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/65">{provider.detail}</p>
            </article>
          );
        })}
      </section>

      <section id="capture" className="scroll-mt-6 mt-6 rounded-3xl border border-[#e0c985]/20 bg-[#e0c985]/[0.045] p-5 md:p-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-[#e0c985]">STEP 1</p>
          <h2 className="mt-2 text-xl font-semibold">เก็บ Research ให้มีหลักฐานก่อนตัดสินใจ</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/65">
            บน Production ให้ใช้ Snapshot ที่ Sync แล้วหรือเพิ่มข้อมูลที่คุณตรวจสอบเอง ส่วน Local provider lane สามารถค้น Ubersuggest สดและบันทึก Snapshot ได้
          </p>
        </div>
        {canQueryProvider && !productionSnapshotMode ? (
          <div className="mt-5"><UbersuggestResearchForm connected={ubersuggest.connected} writeReady={writeReady} /></div>
        ) : null}
        {!research.error && writeReady && hasAdminPermission(identity.role, "research:create") ? (
          <div className="mt-5"><ResearchSnapshotForm /></div>
        ) : null}
      </section>

      {!research.error ? (
        <section id="coverage" className="scroll-mt-6 mt-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-[#e0c985]">STEP 2</p>
            <h2 className="mt-2 text-xl font-semibold">Match Research กับบทความ CCPun</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">เช็กว่า keyword ที่มีหลักฐานแล้วมี Primary/Secondary keyword owner อยู่หรือยัง ก่อนสร้างบทความใหม่</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="text-sm text-white/60">Research ทั้งหมด</div><div className="mt-2 text-xl font-semibold">{rows.length}</div></article>
            <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="text-sm text-white/60">Research gaps</div><div className="mt-2 text-xl font-semibold text-amber-300">{gaps.length}</div></article>
            <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="text-sm text-white/60">มีบทความรองรับ</div><div className="mt-2 text-xl font-semibold text-emerald-300">{rows.length - gaps.length}</div></article>
            <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="text-sm text-white/60">โอกาสภายในสูงสุด</div><div className="mt-2 text-sm font-semibold text-white/80">{topOpportunity ? `${topOpportunity.keyword} · ${topOpportunity.opportunity}/100` : "—"}</div></article>
          </div>
        </section>
      ) : null}

      <section id="ubersuggest-intelligence" className="scroll-mt-6 mt-6 rounded-3xl border border-sky-200/15 bg-sky-200/[0.035] p-5 md:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-sky-200">STEP 3 · DATA PROVIDER</p>
            <h2 className="mt-2 text-xl font-semibold">Ubersuggest Intelligence + Account Quota</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">อ่าน limit/used จากบัญชีและ project จริง ไม่ hard-code ตามชื่อแพ็กเกจ และไม่ยิง provider ซ้ำเมื่อมี Snapshot ที่ยังเหมาะกับรอบข้อมูล</p>
          </div>
          {canSync ? <SyncUbersuggestButton /> : null}
        </div>

        {!localProviderLane ? (
          <p className="mt-4 rounded-xl border border-sky-200/10 bg-black/10 p-3 text-sm leading-6 text-sky-100/75">
            Cloud Admin อ่าน Snapshot จาก Sanity เท่านั้น การ refresh provider ทำจาก Local Ubersuggest lane ที่ authenticate อยู่ เพื่อไม่ย้าย OAuth refresh token ไปเก็บบน Vercel
          </p>
        ) : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-white/10 bg-black/10 p-4"><div className="text-sm text-white/50">Account</div><div className="mt-2 text-lg font-semibold">{account?.tier ?? "ยังไม่มี snapshot"}</div><p className="mt-1 text-xs text-white/45">{account ? `${account.domain} · ${accountFresh ? "สด" : "ควร Sync ใหม่"}` : ""}</p></article>
          <article className="rounded-2xl border border-white/10 bg-black/10 p-4"><div className="text-sm text-white/50">AI Visibility</div><div className="mt-2 text-2xl font-semibold">{geo ? `${geo.visibilityPercentage}%` : "—"}</div><p className="mt-1 text-xs text-white/45">{geo ? `${geo.totalMentions} mentions` : ""}</p></article>
          <article className="rounded-2xl border border-white/10 bg-black/10 p-4"><div className="text-sm text-white/50">Share of Voice</div><div className="mt-2 text-2xl font-semibold">{geo ? geo.shareOfVoice : "—"}</div><p className="mt-1 text-xs text-white/45">Ubersuggest AI Search Visibility</p></article>
          <article className="rounded-2xl border border-white/10 bg-black/10 p-4"><div className="text-sm text-white/50">Prompt Gaps</div><div className="mt-2 text-2xl font-semibold text-amber-200">{geo ? promptGaps.length : "—"}</div><p className="mt-1 text-xs text-white/45">CCPun visibility = 0%</p></article>
        </div>

        {account?.quotas.length ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {account.quotas.map((item) => (
              <article key={item.key} className={`rounded-2xl border p-4 ${quotaClass(item.status)}`}>
                <div className="flex items-start justify-between gap-3">
                  <div><h3 className="font-medium">{item.label}</h3><p className="mt-1 text-sm opacity-70">เหลือ {item.remaining}</p></div>
                  <div className="text-right text-lg font-semibold">{item.used} / {item.limit}</div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/20"><div className="h-full rounded-full bg-current/50" style={{ width: `${Math.min(100, item.limit ? (item.used / item.limit) * 100 : 100)}%` }} /></div>
              </article>
            ))}
          </div>
        ) : <p className="mt-5 text-sm text-white/55">ยังไม่มี quota snapshot จาก Ubersuggest</p>}
        {account ? <p className="mt-4 text-xs text-white/45">Sync ล่าสุด {formatDate(account.checkedAt)}</p> : null}
      </section>

      <section id="geo-aeo" className="scroll-mt-6 mt-6 rounded-3xl border border-violet-200/15 bg-violet-200/[0.035] p-5 md:p-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-violet-200">STEP 4</p>
          <h2 className="mt-2 text-xl font-semibold">GEO / AEO — AI Search Visibility</h2>
          <p className="mt-2 text-sm leading-6 text-white/60">ใช้ prompt, provider, competitor และ intent data จาก Ubersuggest เพื่อหา AI visibility gaps ที่ควรนำกลับไปปรับบทความหรือวาง content opportunity</p>
        </div>

        {geo ? (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-2xl border border-white/10 bg-black/10 p-4"><div className="text-sm text-white/50">AI answers</div><div className="mt-2 text-xl font-semibold">{geo.totalAnswers}</div></article>
              <article className="rounded-2xl border border-white/10 bg-black/10 p-4"><div className="text-sm text-white/50">Tracked prompts</div><div className="mt-2 text-xl font-semibold">{geo.totalPrompts}</div></article>
              <article className="rounded-2xl border border-white/10 bg-black/10 p-4"><div className="text-sm text-white/50">Competitors found</div><div className="mt-2 text-xl font-semibold">{geo.totalCompetitors}</div></article>
              <article className="rounded-2xl border border-white/10 bg-black/10 p-4"><div className="text-sm text-white/50">Average AI rank</div><div className="mt-2 text-xl font-semibold">{geo.averageRank ?? "—"}</div></article>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <article className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <h3 className="font-medium">Provider breakdown</h3>
                <div className="mt-3 space-y-2">
                  {geo.providers.map((provider) => (
                    <div key={provider.provider} className="flex flex-col gap-1 rounded-xl bg-white/[0.03] px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <span>{providerLabel(provider.provider)}</span>
                      <span className="text-white/60">Visibility {provider.visibilityPercentage}% · Mentions {provider.totalMentions} · Rank {provider.averageRank ?? "—"}</span>
                    </div>
                  ))}
                </div>
              </article>
              <article className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <h3 className="font-medium">Search intents ใน AI prompts</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {geo.intents.map((item) => <span key={item.intent} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/65">{item.intent}: {item.value}</span>)}
                </div>
              </article>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/10">
              <div className="border-b border-white/10 px-4 py-3"><h3 className="font-medium">AI Prompt Gaps</h3><p className="mt-1 text-sm leading-6 text-white/55">เรียง prompt ที่ CCPun ยังไม่ถูก mention โดยให้ prompt ที่มี AI answers มากกว่าอยู่ก่อน</p></div>
              {promptGaps.length ? (
                <div className="divide-y divide-white/5">
                  {promptGaps.map((prompt) => (
                    <article key={prompt.promptText} className="p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div><div className="flex flex-wrap gap-2 text-xs text-white/50">{prompt.topic ? <span>{prompt.topic}</span> : null}<span>{prompt.intents.join(" / ") || "ไม่ระบุ intent"}</span><span>{prompt.totalAnswers} AI answers</span></div><h4 className="mt-2 font-medium text-white/85">{prompt.promptText}</h4><p className="mt-2 text-sm leading-6 text-white/55">Top brands: {prompt.topBrands.length ? prompt.topBrands.join(", ") : "ยังไม่พบ brand เด่น"}</p></div>
                        <span className="w-fit rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs text-amber-100">CCPun visibility 0%</span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : <div className="p-5 text-sm text-white/55">ยังไม่มี prompt gap ใน snapshot ล่าสุด หรือยังไม่ได้ Sync GEO data</div>}
            </div>
            <p className="mt-4 text-xs text-white/45">ช่วงข้อมูล {geo.windowStart} → {geo.windowEnd} · {geoFresh ? "อยู่ในรอบข้อมูล" : "ควร Sync ใหม่"}</p>
          </>
        ) : <p className="mt-4 text-sm text-white/55">ยังไม่มี GEO/AEO snapshot</p>}
      </section>

      {!research.error ? (
        <section id="history" className="scroll-mt-6 mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
          <div className="border-b border-white/10 px-5 py-4">
            <p className="text-xs font-semibold tracking-[0.12em] text-[#e0c985]">STEP 5</p>
            <h2 className="mt-2 font-semibold">Research History + Decision Status</h2>
            <p className="mt-1 text-sm leading-6 text-white/65">รวม Manual และ Ubersuggest Research ในตารางเดียว พร้อมสถานะบทความรองรับและคะแนน Opportunity ภายใน</p>
          </div>
          {rows.length ? (
            <>
              <p className="px-5 pt-4 text-sm text-white/60 md:hidden">เลื่อนตารางไปทางซ้ายหรือขวาเพื่อดูข้อมูลทั้งหมด</p>
              <div role="region" aria-label="ตาราง Research Intelligence" tabIndex={0} className="overflow-x-auto">
                <table className="w-full min-w-[1280px] text-left text-sm">
                  <thead className="border-b border-white/10 bg-white/[0.03] text-xs tracking-wide text-white/55">
                    <tr><th className="px-5 py-4">Keyword</th><th className="px-4 py-4">Decision status</th><th className="px-4 py-4">Opportunity</th><th className="px-4 py-4">Provider</th><th className="px-4 py-4">Scope</th><th className="px-4 py-4">Volume</th><th className="px-4 py-4">Difficulty</th><th className="px-4 py-4">Intent</th><th className="px-4 py-4">SERP</th><th className="px-5 py-4">ดึงข้อมูลเมื่อ</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td className="px-5 py-4 font-medium text-white/80">{row.keyword}</td>
                        <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs ${row.covered ? "bg-emerald-300/10 text-emerald-200" : "bg-amber-300/10 text-amber-200"}`}>{actionLabel(row.covered, row.opportunity)}</span></td>
                        <td className="px-4 py-4 text-white/65">{row.opportunity == null ? "—" : `${row.opportunity}/100`}</td>
                        <td className="px-4 py-4 text-white/60">{row.provider}</td>
                        <td className="px-4 py-4 text-white/60">{row.scope ?? "ไม่ระบุ"}</td>
                        <td className="px-4 py-4 text-white/60">{row.volume ?? "—"}</td>
                        <td className="px-4 py-4 text-white/60">{row.difficulty ?? "—"}</td>
                        <td className="px-4 py-4 text-white/60">{row.intent ?? "—"}</td>
                        <td className="px-4 py-4 text-white/60">{row.serpCount}</td>
                        <td className="px-5 py-4 text-white/60">{formatDate(row.checkedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : <div className="p-7 text-center text-sm text-white/65">ยังไม่มี Research ในชุดข้อมูลนี้</div>}
        </section>
      ) : null}
    </div>
  );
}
