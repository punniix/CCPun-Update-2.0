import type { Metadata } from "next";
import Link from "next/link";
import GenerateSeoSuggestionsButton from "@/components/admin/GenerateSeoSuggestionsButton";
import RunSeoAuditButton from "@/components/admin/RunSeoAuditButton";
import { requireAdminPermission } from "@/lib/admin/require-permission";
import { getSeoProposalContext, runSeoAudit } from "@/lib/admin/seo-audit";
import { getAdminSanityStatus } from "@/lib/admin/sanity-control";
import { isStudioDataPlaneAllowed } from "@/lib/admin/environment";
import { isSeoAiConfigured } from "@/lib/admin/seo-ai";

export const metadata: Metadata = { title: "รายละเอียดผลตรวจ SEO" };

type PageProps = { params: Promise<{ id: string }> };

function badgeClass(severity: string) {
  if (severity === "critical") return "bg-red-300/10 text-red-200";
  if (severity === "warning") return "bg-amber-300/10 text-amber-200";
  return "bg-sky-300/10 text-sky-200";
}

export default async function SeoAuditDetailPage({ params }: PageProps) {
  await requireAdminPermission("seo:read");
  const { id } = await params;
  const [audit, article] = await Promise.all([runSeoAudit(id, false), getSeoProposalContext(id)]);
  const failed = audit.checks.filter((check) => !check.passed);
  const readiness = audit.contentReadiness;
  const geoAudit = audit.geoAudit;
  const studioHref = `/studio/structure/article;${encodeURIComponent(id.replace(/^drafts\./, ""))}`;
  const status = getAdminSanityStatus();
  const studioReady = isStudioDataPlaneAllowed(status.dataset ?? undefined);
  const isDraft = audit.articleId.startsWith("drafts.");
  const aiReady = isSeoAiConfigured();
  const hasPrimaryKeyword = audit.checks.find((check) => check.id === "primary-keyword")?.passed ?? false;

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-[#e0c985]">ผลตรวจที่อธิบายเหตุผลได้</p>
          <h1 className="mt-2 text-3xl font-semibold">{article.title || "รายละเอียดผลตรวจ SEO"}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">{audit.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/snt-admin/seo/" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5">กลับหน้าตรวจ SEO</Link>
          {studioReady ? <Link href={studioHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-xl border border-[#e0c985]/30 bg-[#e0c985]/10 px-4 py-2.5 text-sm font-medium text-[#f4df9b] hover:bg-[#e0c985]/15">เปิดแก้ใน Studio<span className="sr-only"> (เปิดแท็บใหม่)</span></Link> : null}
          {status.writeReady && isDraft ? <RunSeoAuditButton articleId={id} /> : null}
          {status.writeReady && isDraft && aiReady && hasPrimaryKeyword ? <GenerateSeoSuggestionsButton articleId={id} /> : null}
        </div>
      </div>

      <section role="status" className="mt-6 rounded-2xl border border-sky-200/20 bg-sky-200/[0.06] p-4 text-sm leading-6 text-sky-100">
        <h2 className="font-semibold">คะแนนคำนวณสดจากฉบับปัจจุบัน</h2>
        <p className="mt-1 text-sky-100/75">ผลนี้ยังไม่ได้บันทึกเป็นผลตรวจ SEO และไม่แทนผลตรวจล่าสุดที่บันทึกไว้</p>
      </section>

      <section className="mt-7 grid gap-3 sm:grid-cols-5">
        <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="text-sm text-white/60">คะแนนคำนวณสด</div><div className="mt-2 text-2xl font-semibold">{audit.score}/100</div></article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="text-sm text-white/60">ผ่าน</div><div className="mt-2 text-2xl font-semibold text-emerald-300">{audit.passedChecks}</div></article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="text-sm text-white/60">ต้องแก้ด่วน</div><div className="mt-2 text-2xl font-semibold text-red-300">{audit.criticalIssues}</div></article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="text-sm text-white/60">คำเตือน</div><div className="mt-2 text-2xl font-semibold text-amber-300">{audit.warnings}</div></article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="text-sm text-white/60">โอกาสปรับปรุง</div><div className="mt-2 text-2xl font-semibold text-sky-300">{audit.opportunities}</div></article>
      </section>

      <section className="mt-6 rounded-3xl border border-[#e0c985]/15 bg-[#e0c985]/[0.04] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#f4df9b]">AI SEO Suggestions</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/65">สร้างข้อเสนอ Search Intent, SEO Title และ Meta Description จากเนื้อหาจริง + Primary keyword + Research Snapshot/SERP + Search Intent Owner ที่ผ่านการทบทวนแล้ว ข้อเสนอทุกชิ้นมีความเสี่ยงอย่างน้อยระดับปานกลางและต้องผ่าน Human Review ก่อน Apply to Draft</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`rounded-full border px-2.5 py-1 ${aiReady ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200" : "border-amber-300/20 bg-amber-300/10 text-amber-200"}`}>{aiReady ? "AI provider พร้อม" : "AI provider ยังไม่ตั้งค่า"}</span>
            <span className={`rounded-full border px-2.5 py-1 ${hasPrimaryKeyword ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200" : "border-amber-300/20 bg-amber-300/10 text-amber-200"}`}>{hasPrimaryKeyword ? "มี Primary keyword" : "ต้องกำหนด Primary keyword ก่อน"}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-white/60">GSC: Phase ถัดไป</span>
          </div>
        </div>
        {!hasPrimaryKeyword ? <p className="mt-4 text-sm leading-6 text-amber-100/80">เปิด Studio และกำหนดคำค้นหลักก่อน ระบบจะไม่เดาคำค้นหลักเพื่อหลีกเลี่ยง keyword cannibalization</p> : null}
        {!aiReady ? <p className="mt-4 text-sm leading-6 text-amber-100/80">ฟังก์ชัน Generate ถูกปิดแบบ fail-closed จนกว่าจะมี OPENAI_API_KEY ใน environment ที่อนุญาต</p> : null}
        {status.writeReady && isDraft && aiReady && hasPrimaryKeyword ? <div className="mt-4"><GenerateSeoSuggestionsButton articleId={id} /></div> : null}
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.025] p-5">
        <h2 className="text-lg font-semibold">ความพร้อมก่อนทำงานจริง</h2>
        <p className="mt-2 text-sm leading-6 text-white/65">ส่วนนี้เป็นรายการตรวจสำหรับคนทำงาน ไม่รวมในคะแนน SEO และไม่รับประกันอันดับหรือการอ้างอิงจาก AI</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <div className="text-sm text-white/55">ลิงก์ภายในบทความ</div>
            <div className="mt-2 font-semibold">{readiness.internalLinks} ลิงก์</div>
            <p className={`mt-1 text-sm ${readiness.legacyInternalLinks ? "text-amber-200" : "text-emerald-200"}`}>{readiness.legacyInternalLinks ? `${readiness.legacyInternalLinks} ลิงก์ยังผ่าน URL เก่า` : "ไม่พบลิงก์ URL เก่า"}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <div className="text-sm text-white/55">แหล่งอ้างอิง / FAQ</div>
            <div className="mt-2 font-semibold">{readiness.sourcesCount} แหล่ง · {readiness.faqCount} คำถาม</div>
            <p className="mt-1 text-sm text-white/60">เพิ่มเองในแท็บตรวจสอบและ SEO / การค้นหา</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <div className="text-sm text-white/55">Fact-check / Compliance</div>
            <div className="mt-2 font-semibold">{Number(readiness.factChecked) + Number(readiness.complianceReviewed)}/2 ขั้น</div>
            <p className={`mt-1 text-sm ${readiness.factChecked && readiness.complianceReviewed ? "text-emerald-200" : "text-amber-200"}`}>{readiness.factChecked && readiness.complianceReviewed ? "บันทึกครบแล้ว" : "ยังต้องบันทึกวันที่ตรวจ"}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <div className="text-sm text-white/55">ความครบถ้วนข้อมูล GEO / AI Search</div>
            <div className="mt-2 font-semibold">{readiness.geoCompleted}/{readiness.geoTotal} ช่อง</div>
            <p className="mt-1 text-sm text-white/60">สรุป · Entities · คำถาม · วันที่ตรวจ</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <div className="text-sm text-white/55">รูปภาพจาก WordPress</div>
            <div className="mt-2 font-semibold">{readiness.migratedImages} รูปในเนื้อหา</div>
            <p className="mt-1 text-sm text-white/60">{readiness.usesMigratedFeaturedImage && !readiness.hasNativeFeaturedImage ? "หน้าปกเดิมยังแสดงได้; เปลี่ยนเป็นรูป Sanity เมื่อต้องการแก้" : "หน้าปกใช้รูปที่แก้ใน Sanity ได้"}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <div className="text-sm text-white/55">CTA เก่าจาก Facebook</div>
            <div className="mt-2 font-semibold">{readiness.legacyFacebookCtas} จุด</div>
            <p className={`mt-1 text-sm ${readiness.legacyFacebookCtas ? "text-amber-200" : "text-emerald-200"}`}>{readiness.legacyFacebookCtas ? "ควรตรวจและเปลี่ยนเป็น LINE OA ใน Studio" : "ไม่พบ CTA เก่า"}</p>
          </article>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-violet-200/15 bg-violet-200/[0.04] p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 className="text-lg font-semibold">ตรวจ GEO / AI Search</h2><p className="mt-1 text-sm leading-6 text-white/65">ผ่าน {geoAudit.passedChecks}/{geoAudit.totalChecks} ข้อ เป็นรายการตรวจภายใน ไม่ใช่คะแนนหรือการรับประกันว่า AI จะอ้างอิง</p></div>
          <span className="text-xs text-white/50">คำนวณจากฉบับปัจจุบัน</span>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {geoAudit.checks.map((check) => <article key={check.id} className="rounded-2xl border border-white/10 bg-black/10 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-medium text-white/85">{check.label}</h3><p className="mt-1 text-sm leading-6 text-white/60">{check.detail}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${check.passed ? "bg-emerald-300/10 text-emerald-200" : check.required ? "bg-amber-300/10 text-amber-200" : "bg-sky-300/10 text-sky-200"}`}>{check.passed ? "ผ่าน" : check.required ? "ควรแก้" : "แนะนำ"}</span></div></article>)}
        </div>
      </section>

      <section className="mt-6 space-y-3">
        {audit.checks.map((check) => (
          <article key={check.id} className={`rounded-2xl border p-4 ${check.passed ? "border-emerald-300/10 bg-emerald-300/[0.025]" : "border-white/10 bg-white/[0.03]"}`}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs ${check.passed ? "bg-emerald-300/10 text-emerald-200" : badgeClass(check.severity)}`}>{check.passed ? "ผ่าน" : check.severity === "critical" ? "ต้องแก้ด่วน" : check.severity === "warning" ? "คำเตือน" : "โอกาสปรับปรุง"}</span>
                  <span className="text-xs text-white/55">น้ำหนัก {check.weight}</span>
                </div>
                <h2 className="mt-2 font-semibold text-white/85">{check.label}</h2>
                <p className="mt-1 text-sm leading-6 text-white/65">{check.detail}</p>
              </div>
              {!check.passed ? <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/60">ตรวจและแก้ใน Studio</span> : null}
            </div>
          </article>
        ))}
      </section>

      {failed.length ? <p className="mt-5 text-sm leading-6 text-white/65">ผลตรวจมาจากกฎที่อธิบายได้ คุณยังต้องตรวจและอนุมัติก่อนนำข้อเสนอไปใช้กับฉบับร่าง</p> : null}
    </div>
  );
}
