import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, BookOpen, Calculator, CheckCircle2, ExternalLink, HeartHandshake, SearchCheck, ShieldCheck } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const journeys = [
  { label: "เช็กก่อนว่าที่มีพอไหม", title: "เริ่มจากภาพรวมการเงิน", detail: "ดูเงินสำรอง ภาระ และความคุ้มครองก่อนเพิ่มอะไรใหม่", href: "/tools/financial-health-check/", icon: Calculator },
  { label: "มีเรื่องที่กังวลชัดเจน", title: "เริ่มจากความเสี่ยงที่อยากจัดการ", detail: "สุขภาพ ครอบครัว เกษียณ การลงทุน หรือความเสี่ยงรอบชีวิต", href: "#planning-map", icon: ShieldCheck },
  { label: "อยากเข้าใจก่อนตัดสินใจ", title: "เริ่มจาก Knowledge", detail: "อ่านคำอธิบายที่ช่วยให้เปรียบเทียบทางเลือกได้ด้วยตัวเอง", href: "/blog/", icon: BookOpen },
];

export default function Website43PreviewV3() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <section className="relative overflow-hidden border-b border-white/[0.08] pt-20 md:pt-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,hsl(42_50%_35%/.12),transparent_35%),linear-gradient(180deg,hsl(0_23%_11%),hsl(0_18%_14%))]" aria-hidden="true" />
          <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:px-8">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-primary/85">
                <span className="rounded-full border border-primary/25 bg-primary/[0.05] px-3 py-1.5">Website 4.3 · V3 Refined</span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-foreground/55">Insurance & Investment Planning</span>
              </div>
              <h1 className="mt-5 max-w-[18ch] text-[2.1rem] font-semibold leading-[1.13] tracking-[-0.035em] sm:text-[2.7rem] md:text-[3.25rem] lg:text-[3.5rem]">
                การเงินที่ดี ไม่ได้เริ่มจากผลิตภัณฑ์ แต่เริ่มจากการเห็นภาพของตัวเองชัดขึ้น
              </h1>
              <p className="mt-5 max-w-[58ch] text-base leading-7 text-foreground/68 md:text-lg md:leading-8">
                CCPUN ช่วยคุณมองประกัน การลงทุน และความเสี่ยงเป็นแผนเดียวกัน พร้อมเครื่องมือและข้อมูลที่ตรวจสอบได้ก่อนตัดสินใจ
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/tools/financial-health-check/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-105">
                  เริ่มจาก Financial Health Check <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a href="https://lin.ee/tqLCs4f" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.035] px-6 py-3 text-sm font-semibold transition hover:bg-white/[0.06]">
                  ปรึกษา CCPUN
                </a>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-foreground/48">
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> เริ่มจากข้อมูลของคุณ</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> มีเครื่องมือให้ลองเอง</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> ตรวจสอบที่มาได้</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[520px] lg:max-w-none">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] border border-white/[0.1] bg-white/[0.025] shadow-2xl">
                <Image src="/assets/hero-pun-laptop-v3.png" alt="" fill priority sizes="(min-width:1024px) 40vw, 90vw" className="object-cover object-[64%_center]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0_22%_11%/.88)] via-transparent to-transparent" />
                <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/[0.12] bg-black/30 p-4 backdrop-blur-md">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Plan before product</p>
                  <p className="mt-1.5 text-sm leading-6 text-white/80">เห็นภาพรวม → รู้ช่องว่าง → เข้าใจทางเลือก → ค่อยตัดสินใจ</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[hsl(0_18%_13%)] py-16 md:py-22">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Choose a starting point</p>
              <h2 className="mt-3 text-[1.8rem] font-semibold leading-tight md:text-[2.25rem]">คุณไม่จำเป็นต้องเริ่มเหมือนคนอื่น</h2>
              <p className="mt-3 text-base leading-7 text-foreground/62">เลือกทางที่ตรงกับระดับความพร้อมของคุณในวันนี้ แล้วค่อยเชื่อมไปสู่ขั้นถัดไป</p>
            </div>
            <div className="mt-9 grid gap-4 lg:grid-cols-3">
              {journeys.map(({ label, title, detail, href, icon: Icon }, index) => (
                <Link key={title} href={href} className="group flex min-h-[260px] flex-col rounded-[24px] border border-white/[0.09] bg-white/[0.025] p-6 transition hover:-translate-y-0.5 hover:border-primary/35 hover:bg-white/[0.045]">
                  <div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" aria-hidden="true" /></span><span className="text-xs font-semibold text-foreground/30">0{index + 1}</span></div>
                  <p className="mt-7 text-xs font-medium text-primary/75">{label}</p>
                  <h3 className="mt-2 text-xl font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-foreground/55">{detail}</p>
                  <span className="mt-auto flex items-center gap-2 pt-6 text-sm font-semibold text-primary">ไปต่อ <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="planning-map" className="border-y border-white/[0.07] py-16 md:py-22">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">One planning map</p>
                <h2 className="mt-3 text-[1.8rem] font-semibold leading-tight md:text-[2.25rem]">ประกันกับการลงทุน ไม่ควรถูกแยกออกจากชีวิตจริง</h2>
                <p className="mt-4 text-base leading-7 text-foreground/62">จัดลำดับสิ่งที่ต้องป้องกันก่อน แล้วค่อยให้เงินส่วนที่พร้อมทำงานเพื่อเป้าหมายระยะยาว</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["01", "ฐานการเงิน", "เงินสำรอง กระแสเงินสด และภาระ"],
                  ["02", "ความเสี่ยง", "สุขภาพ รายได้ ครอบครัว และทรัพย์สิน"],
                  ["03", "เป้าหมาย", "การลงทุน เกษียณ การศึกษา และความมั่งคั่ง"],
                  ["04", "ทบทวน", "ปรับแผนเมื่อชีวิต รายได้ หรือเป้าหมายเปลี่ยน"],
                ].map(([number, title, detail]) => (
                  <article key={number} className="rounded-2xl border border-white/[0.08] bg-white/[0.022] p-5"><span className="text-xs font-semibold text-primary/60">{number}</span><h3 className="mt-4 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-foreground/55">{detail}</p></article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[hsl(0_18%_13%)] py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="rounded-[28px] border border-primary/20 bg-[linear-gradient(135deg,hsl(0_18%_17%),hsl(0_21%_13%))] p-6 md:p-8">
              <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-center">
                <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Trust layer</p><h2 className="mt-3 text-2xl font-semibold md:text-[2rem]">ตัดสินใจจากข้อมูลที่ตรวจสอบได้</h2><p className="mt-3 max-w-[48ch] text-sm leading-7 text-foreground/60">หน้าเว็บควรช่วยให้ผู้ใช้เห็นทั้งผู้ให้คำแนะนำ ขอบเขตบริการ แหล่งอ้างอิง และเครื่องมือ ไม่ใช่แค่ข้อความขาย</p></div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[[BadgeCheck,"Credentials"],[SearchCheck,"Sources"],[HeartHandshake,"Human advice"]].map(([TrustIcon,label]) => { const T = TrustIcon as typeof BadgeCheck; return <div key={label as string} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"><T className="h-5 w-5 text-primary"/><p className="mt-3 text-sm font-semibold">{label as string}</p></div>; })}
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-center"><a href="https://lin.ee/tqLCs4f" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">คุยกับ CCPUN เมื่อพร้อม <ExternalLink className="h-4 w-4" /></a></div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
