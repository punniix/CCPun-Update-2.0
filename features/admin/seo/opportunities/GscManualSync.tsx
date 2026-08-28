"use client";

import { useState } from "react";

type SyncResult = {
  fetchedAt: string;
  totalRows: number;
  comparisonRows: number;
  truncated: boolean;
  limitations: string[];
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
          <p className="sm:col-span-3 text-xs leading-5 text-amber-100/70">{result.truncated ? "ข้อมูลชนขีดจำกัดรอบนี้ · " : ""}{result.limitations.join(" · ")}</p>
        </div>
      ) : null}
    </section>
  );
}
