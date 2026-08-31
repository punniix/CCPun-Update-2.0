"use client";

import { useState } from "react";

type Period = { rows: number; sessions: number; engagedSessions: number; engagementRate: number };
type SyncResult = {
  state: "ready" | "partial";
  fetchedAt: string;
  timeZone: string | null;
  current: Period;
  comparison: Period | null;
  sample: Array<{ landingPage: string; sessions: number; engagedSessions: number; engagementRate: number }>;
  truncated: boolean;
  limitations: string[];
};

const errorMessage: Record<string, string> = {
  "provider-not-connected": "ยังไม่ได้เชื่อม GA4 สำหรับ UAT",
  "provider-auth-required": "สิทธิ์ GA4 หมดอายุ กรุณาเชื่อมใหม่",
  "provider-rate-limited": "GA4 จำกัดการเรียก กรุณารอแล้วลองใหม่",
  "provider-timeout": "GA4 ตอบช้าเกินกำหนด กรุณาลองใหม่",
  "provider-invalid-response": "ข้อมูลจาก GA4 ไม่อยู่ในรูปแบบที่รองรับ",
  "sync-in-progress": "มีการ Sync อยู่แล้ว กรุณารอให้เสร็จ",
};

export default function Ga4ManualSync({ defaultStartDate, defaultEndDate }: { defaultStartDate: string; defaultEndDate: string }) {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<SyncResult | null>(null);
  const topRows = [...(result?.sample ?? [])].sort((a, b) => b.sessions - a.sessions).slice(0, 10);
  const maxSessions = topRows[0]?.sessions ?? 0;

  async function sync() {
    if (state === "running") return;
    setState("running");
    setMessage("");
    setResult(null);
    try {
      const response = await fetch("/api/snt-admin/seo/opportunities/sync/ga4/", {
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
          <h2 className="text-lg font-semibold">GA4 · Organic Landing Pages</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">ดึง Sessions และ Engaged Sessions ของ Organic Search เมื่อคุณกดเท่านั้น ไม่ดึงข้อมูลผู้ใช้ ไม่บันทึก DB/Sanity และไม่แก้ Analytics</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-white/60">เริ่ม
            <input type="date" value={startDate} max={endDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 block min-h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white" />
          </label>
          <label className="text-xs text-white/60">สิ้นสุด
            <input type="date" value={endDate} min={startDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 block min-h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white" />
          </label>
          <button type="button" onClick={sync} disabled={state === "running" || !startDate || !endDate} className="min-h-11 rounded-xl bg-[#e0c985] px-4 py-2.5 text-sm font-semibold text-[#17191d] disabled:cursor-not-allowed disabled:opacity-50">
            {state === "running" ? "กำลัง Sync…" : "Sync GA4 แบบอ่านอย่างเดียว"}
          </button>
        </div>
      </div>

      {message ? <p role="alert" className="mt-4 text-sm text-red-200">{message}</p> : null}
      {result ? (
        <div role="status" className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/5 bg-black/10 p-3"><div className="text-xs text-white/45">Organic Sessions</div><div className="mt-1 font-semibold">{result.current.sessions.toLocaleString("th-TH")}</div></div>
          <div className="rounded-xl border border-white/5 bg-black/10 p-3"><div className="text-xs text-white/45">Engaged Sessions</div><div className="mt-1 font-semibold">{result.current.engagedSessions.toLocaleString("th-TH")}</div></div>
          <div className="rounded-xl border border-white/5 bg-black/10 p-3"><div className="text-xs text-white/45">Engagement Rate</div><div className="mt-1 font-semibold">{(result.current.engagementRate * 100).toFixed(1)}%</div></div>
          <div className="rounded-xl border border-white/5 bg-black/10 p-3"><div className="text-xs text-white/45">Landing Pages</div><div className="mt-1 font-semibold">{result.current.rows.toLocaleString("th-TH")}</div></div>
          <section aria-labelledby="ga4-top-rows-title" className="sm:col-span-4 rounded-2xl border border-white/10 bg-black/10 p-4">
            <h3 id="ga4-top-rows-title" className="font-semibold">Top 10 Organic Landing Pages · เรียงตาม Sessions</h3>
            {topRows.length ? (
              <ol className="mt-4 space-y-4">
                {topRows.map((row, index) => {
                  const width = maxSessions > 0 ? Math.min(100, Math.max(0, (row.sessions / maxSessions) * 100)) : 0;
                  return (
                    <li key={`${row.landingPage}:${index}`}>
                      <div className="flex min-w-0 items-baseline justify-between gap-3 text-sm">
                        <span className="truncate text-white/80" title={row.landingPage}>{row.landingPage}</span>
                        <span className="shrink-0 font-semibold text-[#f4df9b]">{row.sessions.toLocaleString("th-TH")}</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                        <div className="h-full rounded-full bg-[#e0c985]" style={{ width: `${width}%` }} />
                      </div>
                      <dl className="mt-2 grid grid-cols-1 gap-x-3 gap-y-1 text-xs text-white/55 sm:grid-cols-3">
                        <div><dt className="inline">Sessions </dt><dd className="inline text-white/75">{row.sessions.toLocaleString("th-TH")}</dd></div>
                        <div><dt className="inline">Engaged Sessions </dt><dd className="inline text-white/75">{row.engagedSessions.toLocaleString("th-TH")}</dd></div>
                        <div><dt className="inline">Engagement Rate </dt><dd className="inline text-white/75">{(row.engagementRate * 100).toFixed(1)}%</dd></div>
                      </dl>
                    </li>
                  );
                })}
              </ol>
            ) : <p className="mt-3 text-sm text-white/55">ช่วงวันที่เลือกไม่มี Organic landing page ที่นำมาแสดงกราฟได้</p>}
          </section>
          <p className="sm:col-span-4 text-xs leading-5 text-amber-100/70">{result.state === "partial" ? "ช่วงเปรียบเทียบยังดึงไม่สำเร็จ · " : ""}{result.truncated ? "ข้อมูลชนขีดจำกัดรอบนี้ · " : ""}{result.timeZone ? `Timezone ${result.timeZone} · ` : ""}{result.limitations.join(" · ")}</p>
        </div>
      ) : null}
    </section>
  );
}
