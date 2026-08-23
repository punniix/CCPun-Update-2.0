import "server-only";

import { z } from "zod";

export type GrowthSourceResult = {
  source: "gsc" | "ga4" | "vercel";
  state: "ready" | "not-connected" | "unavailable";
  fetchedAt?: string;
  dateRange?: string;
  metrics: Array<{ label: string; value: string }>;
  limitation: string;
};

function bangkokDate(daysAgo = 0) {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

async function providerFetch(url: string, init: RequestInit) {
  const response = await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error("PROVIDER_UNAVAILABLE");
  return response.json();
}

const gscSchema = z.object({ rows: z.array(z.object({ clicks: z.number().default(0), impressions: z.number().default(0), ctr: z.number().default(0), position: z.number().default(0) }).passthrough()).default([]) }).passthrough();
const ga4Schema = z.object({
  rows: z.array(z.object({ metricValues: z.array(z.object({ value: z.string() })).default([]) }).passthrough()).default([]),
  totals: z.array(z.object({ metricValues: z.array(z.object({ value: z.string() })).default([]) }).passthrough()).default([]),
}).passthrough();
const vercelSchema = z.object({ deployments: z.array(z.object({ state: z.string().nullish(), readyState: z.string().nullish(), created: z.number().nullish() }).passthrough()).default([]) }).passthrough();

export async function readGscSummary(): Promise<GrowthSourceResult> {
  const token = process.env.CCPUN_GSC_ACCESS_TOKEN?.trim();
  const siteUrl = process.env.CCPUN_GSC_SITE_URL?.trim();
  if (!token || !siteUrl) return { source: "gsc", state: "not-connected", metrics: [], limitation: "ยังไม่ได้อนุมัติการเชื่อม Google Search Console แบบอ่านอย่างเดียว" };
  const startDate = bangkokDate(27);
  const endDate = bangkokDate();
  try {
    const raw = await providerFetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate, dimensions: ["query", "page"], rowLimit: 25 }),
    });
    const data = gscSchema.parse(raw);
    const clicks = data.rows.reduce((sum, row) => sum + row.clicks, 0);
    const impressions = data.rows.reduce((sum, row) => sum + row.impressions, 0);
    const position = impressions ? data.rows.reduce((sum, row) => sum + row.position * row.impressions, 0) / impressions : null;
    return { source: "gsc", state: "ready", fetchedAt: new Date().toISOString(), dateRange: `${startDate} – ${endDate}`, metrics: [
      { label: "คลิกจากกลุ่มข้อมูลที่อ่านได้", value: clicks.toLocaleString("th-TH") },
      { label: "การแสดงผล", value: impressions.toLocaleString("th-TH") },
      { label: "CTR", value: impressions ? `${((clicks / impressions) * 100).toFixed(1)}%` : "—" },
      { label: "อันดับเฉลี่ย", value: position == null ? "—" : position.toFixed(1) },
    ], limitation: "สรุปจาก 25 คู่คำค้น/หน้าที่ API ส่งกลับ ไม่ใช่การพิสูจน์สาเหตุของอันดับ" };
  } catch {
    return { source: "gsc", state: "unavailable", metrics: [], limitation: "เชื่อม GSC แล้วแต่ดึงข้อมูลรอบนี้ไม่สำเร็จ ข้อมูลแหล่งอื่นยังใช้ได้" };
  }
}

export async function readGa4Summary(): Promise<GrowthSourceResult> {
  const token = process.env.CCPUN_GA4_ACCESS_TOKEN?.trim();
  const propertyId = process.env.CCPUN_GA4_PROPERTY_ID?.trim();
  if (!token || !propertyId) return { source: "ga4", state: "not-connected", metrics: [], limitation: "ยังไม่ได้อนุมัติการเชื่อม GA4 แบบอ่านอย่างเดียว" };
  try {
    const raw = await providerFetch(`https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ dateRanges: [{ startDate: "28daysAgo", endDate: "today" }], metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "eventCount" }], limit: 10, metricAggregations: ["TOTAL"] }),
    });
    const data = ga4Schema.parse(raw);
    const values = data.totals[0]?.metricValues;
    if (!values || values.length < 3 || values.some((item) => !Number.isFinite(Number(item.value)))) throw new Error("GA4_TOTALS_MISSING");
    return { source: "ga4", state: "ready", fetchedAt: new Date().toISOString(), dateRange: "28 วันล่าสุดตามเขตเวลาของ GA4", metrics: [
      { label: "ผู้ใช้งาน", value: Number(values[0]?.value ?? 0).toLocaleString("th-TH") },
      { label: "เซสชัน", value: Number(values[1]?.value ?? 0).toLocaleString("th-TH") },
      { label: "เหตุการณ์", value: Number(values[2]?.value ?? 0).toLocaleString("th-TH") },
    ], limitation: "เหตุการณ์หรือ CTA click เป็นสัญญาณความตั้งใจ ไม่ใช่จำนวนลูกค้า ยอดขาย หรือ lead ที่ผ่านคุณสมบัติ" };
  } catch {
    return { source: "ga4", state: "unavailable", metrics: [], limitation: "เชื่อม GA4 แล้วแต่ดึงข้อมูลรอบนี้ไม่สำเร็จ ข้อมูลแหล่งอื่นยังใช้ได้" };
  }
}

export async function readVercelHealth(): Promise<GrowthSourceResult> {
  const token = process.env.CCPUN_VERCEL_READ_TOKEN?.trim();
  const projectId = process.env.CCPUN_VERCEL_PUBLIC_PROJECT_ID?.trim();
  const teamId = process.env.CCPUN_VERCEL_TEAM_ID?.trim();
  if (!token || !projectId) return { source: "vercel", state: "not-connected", metrics: [], limitation: "ยังไม่ได้อนุมัติ token แบบอ่านอย่างเดียวสำหรับโปรเจกต์เว็บไซต์จริง" };
  try {
    const query = new URLSearchParams({ projectId, limit: "10" });
    if (teamId) query.set("teamId", teamId);
    const raw = await providerFetch(`https://api.vercel.com/v6/deployments?${query}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = vercelSchema.parse(raw);
    const latest = data.deployments[0];
    const ready = data.deployments.filter((item) => (item.readyState ?? item.state) === "READY").length;
    return { source: "vercel", state: "ready", fetchedAt: new Date().toISOString(), metrics: [
      { label: "สถานะ deployment ล่าสุด", value: latest?.readyState ?? latest?.state ?? "ไม่ทราบ" },
      { label: "READY ใน 10 รายการล่าสุด", value: `${ready}/${data.deployments.length}` },
    ], limitation: "แสดงเฉพาะข้อมูลที่แผนและ API ปัจจุบันเปิดให้ ไม่สร้าง Core Web Vitals หรือ runtime metrics ขึ้นเอง" };
  } catch {
    return { source: "vercel", state: "unavailable", metrics: [], limitation: "เชื่อม Vercel แล้วแต่ดึงข้อมูลรอบนี้ไม่สำเร็จ ข้อมูลแหล่งอื่นยังใช้ได้" };
  }
}

export async function readGrowthSources() {
  return Promise.all([readGscSummary(), readGa4Summary(), readVercelHealth()]);
}
