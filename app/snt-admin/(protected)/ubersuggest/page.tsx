import type { Metadata } from "next";
import SyncUbersuggestButton from "@/components/admin/SyncUbersuggestButton";
import { getAdminEnvironment } from "@/lib/admin/environment";
import { requireAdminPermission } from "@/lib/admin/require-permission";
import { hasAdminPermission } from "@/lib/admin/rbac";
import { getUbersuggestConnectionStatus } from "@/lib/admin/ubersuggest";
import { getUbersuggestDashboardData, isSnapshotFresh, isUbersuggestSyncWriteReady } from "@/lib/admin/ubersuggest-dashboard";

export const metadata: Metadata = { title: "Ubersuggest Intelligence" };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date(value));
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

export default async function UbersuggestAdminPage() {
  const identity = await requireAdminPermission("research:read");
  const [dashboard, connection] = await Promise.all([
    getUbersuggestDashboardData(30),
    getUbersuggestConnectionStatus(),
  ]);
  const environment = getAdminEnvironment();
  const localProviderLane = ["development", "local-uat", "local-production"].includes(environment);
  const canSync = localProviderLane
    && connection.connected
    && isUbersuggestSyncWriteReady()
    && hasAdminPermission(identity.role, "research:provider-query");
  const account = dashboard.account;
  const geo = dashboard.geo;
  const accountFresh = isSnapshotFresh(account?.checkedAt, 24);
  const geoFresh = isSnapshotFresh(geo?.checkedAt, 35 * 24);
  const promptGaps = [...(geo?.prompts ?? [])]
    .filter((prompt) => prompt.userVisibilityPercentage === 0)
    .sort((a, b) => b.totalAnswers - a.totalAnswers);

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-[#e0c985]">SEO + GEO/AEO provider intelligence</p>
          <h1 className="mt-2 text-3xl font-semibold">Ubersuggest Intelligence</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
            ใช้ Ubersuggest เป็น data provider แล้วเก็บ snapshot ที่ไม่ใช่ secret ลง Sanity เพื่อให้ admin.ccpun.com อ่าน Quota, Research History และ AI Search Visibility ได้จากทุกอุปกรณ์ โดยไม่เก็บ OAuth token ไว้ใน CMS
          </p>
        </div>
        {canSync ? <SyncUbersuggestButton /> : null}
      </div>

      {!localProviderLane ? (
        <section className="mt-6 rounded-2xl border border-sky-200/15 bg-sky-200/[0.05] p-4 text-sm leading-6 text-sky-100/80">
          หน้า Cloud Admin อ่าน snapshot จาก Sanity เท่านั้น การ refresh provider ยังทำจาก Local Ubersuggest lane ที่ authenticate อยู่ เพื่อไม่ย้าย OAuth refresh token ไปเก็บบน Vercel แบบไม่ปลอดภัย
        </section>
      ) : null}

      {dashboard.error ? (
        <section role="alert" className="mt-6 rounded-2xl border border-red-200/20 bg-red-200/10 p-4 text-sm leading-6 text-red-50">
          ยังอ่าน Ubersuggest snapshots ไม่สำเร็จ ระบบจะไม่แทนข้อมูลด้วยเลข 0 หรือข้อมูลเดา
        </section>
      ) : null}

      <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="text-sm text-white/55">Account</div>
          <div className="mt-2 text-lg font-semibold">{account?.tier ?? "ยังไม่มี snapshot"}</div>
          <p className="mt-1 text-xs text-white/45">{account ? `${account.domain} · ${accountFresh ? "สด" : "ควร Sync ใหม่"}` : ""}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="text-sm text-white/55">AI Visibility</div>
          <div className="mt-2 text-2xl font-semibold">{geo ? `${geo.visibilityPercentage}%` : "—"}</div>
          <p className="mt-1 text-xs text-white/45">{geo ? `${geo.totalMentions} mentions · ${geoFresh ? "ตามรอบข้อมูล" : "ควร Sync ใหม่"}` : ""}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="text-sm text-white/55">Share of Voice</div>
          <div className="mt-2 text-2xl font-semibold">{geo ? geo.shareOfVoice : "—"}</div>
          <p className="mt-1 text-xs text-white/45">จาก Ubersuggest AI Search Visibility</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="text-sm text-white/55">Prompt Gaps</div>
          <div className="mt-2 text-2xl font-semibold text-amber-200">{geo ? promptGaps.length : "—"}</div>
          <p className="mt-1 text-xs text-white/45">Tracked prompts ที่ CCPun visibility = 0%</p>
        </article>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.025] p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Account Quota</h2>
            <p className="mt-1 text-sm leading-6 text-white/60">อ่าน limit/used จากบัญชีและ project จริง ไม่ hard-code ตามชื่อแพ็กเกจ</p>
          </div>
          {account ? <span className="text-xs text-white/45">Sync ล่าสุด {formatDate(account.checkedAt)}</span> : null}
        </div>
        {account?.quotas.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {account.quotas.map((item) => (
              <article key={item.key} className={`rounded-2xl border p-4 ${quotaClass(item.status)}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{item.label}</h3>
                    <p className="mt-1 text-sm opacity-70">เหลือ {item.remaining}</p>
                  </div>
                  <div className="text-right text-lg font-semibold">{item.used} / {item.limit}</div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/20">
                  <div className="h-full rounded-full bg-current/50" style={{ width: `${Math.min(100, item.limit ? (item.used / item.limit) * 100 : 100)}%` }} />
                </div>
              </article>
            ))}
          </div>
        ) : <p className="mt-4 text-sm text-white/55">ยังไม่มี quota snapshot จาก Ubersuggest</p>}
      </section>

      <section className="mt-6 rounded-3xl border border-violet-200/15 bg-violet-200/[0.035] p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">GEO / AEO — AI Search Visibility</h2>
            <p className="mt-1 text-sm leading-6 text-white/60">ใช้ prompt, provider, competitor และ intent data จาก Ubersuggest เพื่อหา AI visibility gaps ของ CCPun</p>
          </div>
          {geo ? <span className="text-xs text-white/45">ช่วง {geo.windowStart} → {geo.windowEnd}</span> : null}
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
                    <div key={provider.provider} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2 text-sm">
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
          </>
        ) : <p className="mt-4 text-sm text-white/55">ยังไม่มี GEO/AEO snapshot</p>}
      </section>

      <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="font-semibold">AI Prompt Gaps</h2>
          <p className="mt-1 text-sm leading-6 text-white/60">เรียง prompt ที่ CCPun ยังไม่ถูก mention โดยให้ prompt ที่มี AI answers มากกว่าอยู่ก่อน เพื่อนำไปต่อเป็น Content/GEO opportunity</p>
        </div>
        {promptGaps.length ? (
          <div className="divide-y divide-white/5">
            {promptGaps.map((prompt) => (
              <article key={prompt.promptText} className="p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2 text-xs text-white/50">
                      {prompt.topic ? <span>{prompt.topic}</span> : null}
                      <span>{prompt.intents.join(" / ") || "ไม่ระบุ intent"}</span>
                      <span>{prompt.totalAnswers} AI answers</span>
                    </div>
                    <h3 className="mt-2 font-medium text-white/85">{prompt.promptText}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/55">Top brands: {prompt.topBrands.length ? prompt.topBrands.join(", ") : "ยังไม่พบ brand เด่น"}</p>
                  </div>
                  <span className="w-fit rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs text-amber-100">CCPun visibility 0%</span>
                </div>
              </article>
            ))}
          </div>
        ) : <div className="p-6 text-sm text-white/55">ยังไม่มี prompt gap ใน snapshot ล่าสุด หรือยังไม่ได้ Sync GEO data</div>}
      </section>

      <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="font-semibold">Research History</h2>
          <p className="mt-1 text-sm leading-6 text-white/60">Keyword/SERP searches ที่ทำผ่าน CCPun Admin จะถูกเก็บเป็น Ubersuggest Research Snapshot และนำกลับมาใช้แทนการยิง provider ซ้ำเมื่อข้อมูลยังสด</p>
        </div>
        {dashboard.history.length ? (
          <div role="region" aria-label="Ubersuggest research history" tabIndex={0} className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03] text-xs text-white/50"><tr><th className="px-5 py-4">Keyword</th><th className="px-4 py-4">Volume</th><th className="px-4 py-4">Difficulty</th><th className="px-4 py-4">Intent</th><th className="px-4 py-4">SERP</th><th className="px-5 py-4">Checked</th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {dashboard.history.map((row) => <tr key={row.id}><td className="px-5 py-4 font-medium text-white/80">{row.keyword}</td><td className="px-4 py-4 text-white/60">{row.volume ?? "—"}</td><td className="px-4 py-4 text-white/60">{row.difficulty ?? "—"}</td><td className="px-4 py-4 text-white/60">{row.intent ?? "—"}</td><td className="px-4 py-4 text-white/60">{row.serpCount}</td><td className="px-5 py-4 text-white/60">{formatDate(row.checkedAt)}</td></tr>)}
              </tbody>
            </table>
          </div>
        ) : <div className="p-6 text-sm text-white/55">ยังไม่มี Ubersuggest keyword snapshot ที่บันทึกไว้</div>}
      </section>
    </div>
  );
}
