"use client";

import { useState } from "react";

type SyncResult = {
  fetchedAt: string;
  totalRows: number;
  comparisonRows: number;
  truncated: boolean;
  limitations: string[];
  observationCount: number;
  skippedRows: number;
  opportunityCount: number;
  opportunities: Array<{ id: string; type: string; page: string; evidence: Array<{ label: string; value: string }>; limitations: string[] }>;
  sample: Array<{
    dimensions: { query?: string; page?: string; device?: string; country?: string };
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
};

const errorMessage: Record<string, string> = {
  "provider-not-connected": "ยังไม่ได้เชื่อม Search Console สำหรับ UAT",
  "provider-auth-required": "สิทธิ์ Search Console หมดอายุ กรุณาเชื่อมใหม่",
  "provider-rate-limited": "Search Console จำกัดการเรียก กรุณารอแล้วลองใหม่",
  "provider-timeout": "Search Console ตอบช้าเกินกำหนด กรุณาลองใหม่",
  "provider-invalid-response": "ข้อมูลจาก Search Console ไม่อยู่ในรูปแบบที่รองรับ",
  "sync-in-progress": "มีการ Sync อยู่แล้ว กรุณารอให้เสร็จ",
};

export default function GscManualSync({ defaultStartDate, defaultEndDate }: { defaultStartDate: string; defaultEndDate: string }) {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<SyncResult | null>(null);
  const topRows = [...(result?.sample ?? [])].sort((a, b) => b.impressions - a.impressions).slice(0, 10);
  const maxImpressions = topRows[0]?.impressions ?? 0;

  async function sync() {
    if (state === "running") return;
    setState("running");
    setMessage("");
    setResult(null);
    try {
      const response = await fetch("/api/snt-admin/seo/opportunities/sync/gsc/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(errorMessage[payload?.error] ?? "Sync ไม่สำเร็จและไม่มีข้อมูลใดถูกบันทึก");
        setState("error");
        return;
      }
      setResult(payload as SyncResult);
      setState("done");
    } catch {
      setMessage("เชื่อมต่อไม่สำเร็จและไม่มีข้อมูลใดถูกบันทึก");
      setState("error");
    }
  }

  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Google Search Console · Manual Read-only Sync</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">ดึงช่วงที่เลือกและช่วงก่อนหน้าที่ยาวเท่ากันเมื่อคุณกดเท่านั้น ไม่บันทึก DB/Sanity และไม่แก้บทความ</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-white/60">เริ่ม
            <input type="date" value={startDate} max={endDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 block min-h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white" />
          </label>
          <label className="text-xs text-white/60">สิ้นสุด
            <input type="date" value={endDate} min={startDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 block min-h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white" />
          </label>
          <button type="button" onClick={sync} disabled={state === "running" || !startDate || !endDate} className="min-h-11 rounded-xl bg-[#e0c985] px-4 py-2.5 text-sm font-semibold text-[#17191d] disabled:cursor-not-allowed disabled:opacity-50">
            {state === "running" ? "กำลัง Sync…" : "Sync GSC แบบอ่านอย่างเดียว"}
          </button>
        </div>
      </div>

      {message ? <p role="alert" className="mt-4 text-sm text-red-200">{message}</p> : null}
      {result ? (
        <div role="status" className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/5 bg-black/10 p-3"><div className="text-xs text-white/45">ช่วงที่เลือก</div><div className="mt-1 font-semibold">{result.totalRows.toLocaleString("th-TH")} แถว</div></div>
          <div className="rounded-xl border border-white/5 bg-black/10 p-3"><div className="text-xs text-white/45">ช่วงเปรียบเทียบ</div><div className="mt-1 font-semibold">{result.comparisonRows.toLocaleString("th-TH")} แถว</div></div>
          <div className="rounded-xl border border-white/5 bg-black/10 p-3"><div className="text-xs text-white/45">อัปเดต</div><div className="mt-1 font-semibold">{new Date(result.fetchedAt).toLocaleString("th-TH")}</div></div>
          <div className="rounded-xl border border-white/5 bg-black/10 p-3"><div className="text-xs text-white/45">Observations ที่ยืนยันบริบทแล้ว</div><div className="mt-1 font-semibold">{result.observationCount.toLocaleString("th-TH")}</div></div>
          <div className="rounded-xl border border-white/5 bg-black/10 p-3"><div className="text-xs text-white/45">แถวที่ไม่เดาบริบท</div><div className="mt-1 font-semibold">{result.skippedRows.toLocaleString("th-TH")}</div></div>
          <div className="rounded-xl border border-white/5 bg-black/10 p-3"><div className="text-xs text-white/45">Opportunities</div><div className="mt-1 font-semibold">{result.opportunityCount.toLocaleString("th-TH")}</div></div>
          <section aria-labelledby="gsc-top-rows-title" className="sm:col-span-3 rounded-2xl border border-white/10 bg-black/10 p-4">
            <h3 id="gsc-top-rows-title" className="font-semibold">Top 10 จากข้อมูลจริง · เรียงตาม Impressions</h3>
            {topRows.length ? (
              <ol className="mt-4 space-y-4">
                {topRows.map((row, index) => {
                  const label = row.dimensions.query?.trim() || row.dimensions.page?.trim() || "ไม่ระบุ query/page";
                  const width = maxImpressions > 0 ? Math.min(100, Math.max(0, (row.impressions / maxImpressions) * 100)) : 0;
                  return (
                    <li key={`${label}:${row.dimensions.page ?? ""}:${row.dimensions.device ?? ""}:${row.dimensions.country ?? ""}:${index}`}>
                      <div className="flex min-w-0 items-baseline justify-between gap-3 text-sm">
                        <span className="truncate text-white/80" title={label}>{label}</span>
                        <span className="shrink-0 font-semibold text-[#f4df9b]">{row.impressions.toLocaleString("th-TH")}</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                        <div className="h-full rounded-full bg-[#e0c985]" style={{ width: `${width}%` }} />
                      </div>
                      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-white/55 sm:grid-cols-4">
                        <div><dt className="inline">Clicks </dt><dd className="inline text-white/75">{row.clicks.toLocaleString("th-TH")}</dd></div>
                        <div><dt className="inline">Impressions </dt><dd className="inline text-white/75">{row.impressions.toLocaleString("th-TH")}</dd></div>
                        <div><dt className="inline">CTR </dt><dd className="inline text-white/75">{(row.ctr * 100).toFixed(1)}%</dd></div>
                        <div><dt className="inline">Position </dt><dd className="inline text-white/75">{row.position.toFixed(1)}</dd></div>
                      </dl>
                      {row.dimensions.query && row.dimensions.page ? <p className="mt-1 truncate text-xs text-white/40" title={row.dimensions.page}>{row.dimensions.page}</p> : null}
                    </li>
                  );
                })}
              </ol>
            ) : <p className="mt-3 text-sm text-white/55">ช่วงวันที่เลือกไม่มี query หรือ page ที่นำมาแสดงกราฟได้</p>}
          </section>
          {result.opportunities.slice(0, 5).map((opportunity) => (
            <article key={opportunity.id} className="sm:col-span-3 rounded-xl border border-white/10 bg-black/10 p-3">
              <div className="text-xs font-semibold text-[#e0c985]">{opportunity.type}</div>
              <div className="mt-1 break-all text-sm text-white/80">{opportunity.page}</div>
              <dl className="mt-2 flex flex-wrap gap-2 text-xs text-white/55">{opportunity.evidence.map((item) => <div key={item.label}>{item.label}: {item.value}</div>)}</dl>
              {opportunity.limitations[0] ? <p className="mt-2 text-xs text-amber-100/60">ข้อจำกัด: {opportunity.limitations[0]}</p> : null}
            </article>
          ))}
          <p className="sm:col-span-3 text-xs leading-5 text-amber-100/70">{result.truncated ? "ข้อมูลชนขีดจำกัดรอบนี้ · " : ""}{result.limitations.join(" · ")}</p>
        </div>
      ) : null}
    </section>
  );
}
