import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPermission } from "@/lib/admin/require-permission";
import { getSocialOperationsRuntimeStatus } from "@/lib/admin/social/operations";
import { SYNTHETIC_META_CONNECTION } from "@/lib/admin/social/providers/meta/connection";

export const metadata: Metadata = { title: "Meta Connection UAT" };

const statusLabel = {
  "not-connected": "ยังไม่ได้เชื่อมต่อ",
  "reconnect-required": "ต้องเชื่อมต่อใหม่",
  "no-page": "ไม่พบ Facebook Page",
  "selection-required": "ต้องเลือก Facebook Page",
  connected: "พร้อมตรวจสอบแบบ Read-only",
} as const;

export default async function MetaConnectionUatPage() {
  await requireAdminPermission("social:read");
  if (!getSocialOperationsRuntimeStatus().enabled) notFound();
  const connection = SYNTHETIC_META_CONNECTION;

  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.12em] text-[#e0c985]">WEBSITE 4.2 · SYNTHETIC UAT</p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Meta Connection</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
            ตรวจโครงสร้างการเลือก Facebook Page และบัญชี Instagram เท่านั้น ยังไม่เรียก Meta API และไม่มีสิทธิ์โพสต์หรืออ่าน Insights
          </p>
        </div>
        <Link href="/snt-admin/distribution/operations/" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5">
          กลับ Social Operations
        </Link>
      </div>

      <section className="mt-7 grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="text-sm text-white/55">สถานะ</div>
          <div className="mt-2 font-semibold text-emerald-200">{statusLabel[connection.status]}</div>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="text-sm text-white/55">Facebook Pages</div>
          <div className="mt-2 font-semibold">{connection.pages.length}</div>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="text-sm text-white/55">Provider request</div>
          <div className="mt-2 font-semibold text-amber-200">ปิดอยู่</div>
        </article>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Page ที่ค้นพบจาก Fixture</h2>
        <p className="mt-2 text-sm text-white/60">กรณีมีหลาย Page ต้องเลือกให้ชัดเจนก่อน ระบบจะไม่เดาแทนเจ้าของ</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {connection.pages.map((page) => (
            <article key={page.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold">{page.name}</h3>
                {page.selected ? <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">เลือกแล้ว</span> : null}
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-white/45">Instagram</dt>
                  <dd className="mt-1 text-white/75">{page.instagram.status === "linked" ? `@${page.instagram.username}` : "ยังไม่ได้เชื่อม"}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section role="note" className="mt-7 rounded-3xl border border-amber-200/20 bg-amber-200/[0.05] p-5 text-sm leading-6 text-amber-50/80">
        สิทธิ์จำลอง: {connection.grantedScopes.join(" + ")} · ไม่มี publishing scopes · ไม่มี insights scopes · ไม่มีข้อมูล credential
      </section>
    </div>
  );
}
