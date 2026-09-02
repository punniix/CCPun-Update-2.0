"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Landmark,
  PawPrint,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  WalletCards,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const LINE_OA_URL = "https://lin.ee/tqLCs4f";

const concerns = [
  { icon: HeartPulse, title: "ค่ารักษาไม่พอ", detail: "เริ่มจากสุขภาพและเงินสำรอง" },
  { icon: ShieldCheck, title: "มีครอบครัวแล้ว", detail: "ดูความคุ้มครองและภาระที่ต้องดูแล" },
  { icon: Landmark, title: "อยากเริ่มลงทุน", detail: "เริ่มจากเป้าหมาย ระยะเวลา และความเสี่ยงที่รับได้" },
  { icon: Target, title: "เตรียมเกษียณ", detail: "เช็กเงินที่ต้องใช้และช่องว่างระยะยาว" },
  { icon: WalletCards, title: "มีประกันอยู่แล้ว", detail: "ดูว่าของเดิมพอ ซ้ำ หรือมีช่องว่างตรงไหน" },
  { icon: PawPrint, title: "รถ บ้าน เดินทาง สัตว์เลี้ยง", detail: "จัดการความเสี่ยงรอบชีวิตให้เป็นระบบ" },
];

const planningSteps = [
  {
    eyebrow: "สถานการณ์ตอนนี้",
    question: "ตอนนี้คุณอยากเริ่มจากเรื่องไหน?",
    options: ["ดูภาพรวมการเงินก่อน", "ความคุ้มครองและสุขภาพ", "การลงทุนและเป้าหมาย", "ครอบครัวและคนที่ต้องดูแล"],
  },
  {
    eyebrow: "เป้าหมายและความกังวล",
    question: "เรื่องไหนที่คุณอยากจัดการก่อน?",
    options: ["ค่ารักษาและความเสี่ยงสุขภาพ", "เงินสำรองและภาระหนี้", "เริ่มลงทุนหรือเตรียมเกษียณ", "ยังไม่แน่ใจ อยากดูภาพรวมก่อน"],
  },
  {
    eyebrow: "คนที่ต้องดูแล",
    question: "มีใครพึ่งพารายได้หรือการดูแลจากคุณไหม?",
    options: ["มีคู่สมรสหรือครอบครัว", "มีลูกหรือผู้สูงอายุที่ต้องดูแล", "ยังไม่มีภาระดูแลคนอื่น", "อยากตอบภายหลัง"],
  },
  {
    eyebrow: "สิ่งที่มีอยู่แล้ว",
    question: "ตอนนี้คุณมีแผนหรือความคุ้มครองอยู่ระดับไหน?",
    options: ["มีหลายอย่าง แต่อยากเช็กว่าพอไหม", "มีบางส่วน ยังไม่ครบ", "ยังไม่ได้เริ่มจริงจัง", "ไม่แน่ใจว่าที่มีนับรวมอะไรบ้าง"],
  },
  {
    eyebrow: "วิธีที่อยากไปต่อ",
    question: "หลังเห็นภาพรวม คุณอยากทำอะไรต่อ?",
    options: ["ใช้เครื่องมือคำนวณด้วยตัวเอง", "อ่านเรื่องที่เกี่ยวข้องก่อน", "ให้ปั้นช่วยดูภาพรวม", "ขอเก็บผลไว้คิดก่อน"],
  },
];

const toolCards = [
  {
    title: "Financial Health Check",
    description: "ดูเงินสำรอง ภาระ ความคุ้มครอง และภาพรวมจุดที่ควรทบทวน",
    href: "/tools/financial-health-check/",
  },
  {
    title: "วางแผนทุนโรคร้ายแรง",
    description: "ประเมินเงินก้อนจากรายได้ ภาระ และสินทรัพย์สภาพคล่องที่พร้อมใช้",
    href: "/ci-planning/",
  },
];

export default function Website43Preview() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<number, number>>({ 1: 0 });

  const current = planningSteps[step - 1];
  const selected = answers[step];
  const isComplete = step === planningSteps.length && selected !== undefined;

  const priorities = useMemo(() => {
    const first = answers[1] ?? 0;
    if (first === 1) return ["ทบทวนความคุ้มครองสุขภาพ", "เช็กเงินสำรองฉุกเฉิน", "ค่อยต่อยอดเป้าหมายระยะยาว"];
    if (first === 2) return ["กำหนดเป้าหมายและระยะเวลา", "เช็กฐานเงินสำรองและความคุ้มครอง", "ประเมินความเสี่ยงที่รับได้"];
    if (first === 3) return ["ดูภาพรวมการเงินก่อน", "จัดลำดับความเสี่ยงจำเป็น", "เลือกเครื่องมือหรือบทความที่ตรงกับคุณ"];
    return ["เงินสำรองฉุกเฉิน", "ความคุ้มครองสุขภาพและรายได้", "เป้าหมายลงทุนระยะยาว"];
  }, [answers]);

  const choose = (index: number) => setAnswers((old) => ({ ...old, [step]: index }));
  const next = () => selected !== undefined && setStep((s) => Math.min(planningSteps.length, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <section className="relative overflow-hidden border-b border-white/[0.08] pt-20 md:pt-28">
          <div className="absolute inset-0 bg-[hsl(0_24%_12%)]" aria-hidden="true" />
          <div className="absolute inset-y-0 right-0 hidden w-[54%] md:block" aria-hidden="true">
            <Image
              src="/assets/hero-pun-laptop-v3.png"
              alt=""
              fill
              priority
              sizes="54vw"
              className="object-cover object-[62%_center]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(0_24%_12%)] via-[hsl(0_24%_12%/.62)] to-transparent" />
          </div>
          <div className="relative z-10 mx-auto max-w-7xl px-5 py-16 sm:px-6 md:py-28 lg:px-8">
            <div className="max-w-3xl md:max-w-[58%]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Insurance & Investment Planning</p>
              <h1 className="mt-5 max-w-[19ch] text-[2rem] font-semibold leading-[1.18] tracking-[-0.025em] sm:text-[2.5rem] md:text-[3rem] lg:text-[3.25rem]">
                วางแผนประกัน การลงทุน และความเสี่ยงในชีวิต ให้เหมาะกับคุณจริง ๆ
              </h1>
              <p className="mt-5 max-w-[54ch] text-base leading-7 text-foreground/70 md:text-lg md:leading-8">
                เริ่มจากสิ่งที่คุณมี สิ่งที่กังวล และเป้าหมายของคุณ ก่อนค่อยเลือกผลิตภัณฑ์
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#guided-planning"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-105"
                >
                  ช่วยดูว่าควรเริ่มตรงไหน <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/tools/financial-health-check/"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-white/[0.08]"
                >
                  เช็กสุขภาพการเงิน
                </Link>
              </div>
              <p className="mt-5 text-xs leading-5 text-foreground/50">Website 4.3 Preview · ยังไม่ใช่ Production</p>
            </div>
          </div>
        </section>

        <section className="bg-[hsl(0_18%_13%)] py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">เริ่มจากคุณ</p>
              <h2 className="mt-3 text-[1.75rem] font-semibold leading-tight md:text-[2rem]">วันนี้คุณกำลังกังวลเรื่องอะไร?</h2>
              <p className="mt-3 text-base leading-7 text-foreground/65">ไม่ต้องรู้ชื่อผลิตภัณฑ์ก่อน เลือกจากสิ่งที่อยากจัดการ แล้วค่อยดูทางเลือกที่เหมาะสม</p>
            </div>
            <div className="mt-9 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {concerns.map(({ icon: Icon, title, detail }) => (
                <a key={title} href="#guided-planning" className="group rounded-2xl border border-white/[0.09] bg-white/[0.035] p-5 transition hover:border-primary/50 hover:bg-white/[0.055] focus-visible:outline-none">
                  <div className="flex items-start gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                    <span>
                      <span className="block text-lg font-semibold">{title}</span>
                      <span className="mt-1.5 block text-sm leading-6 text-foreground/60">{detail}</span>
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/[0.07] py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Trust & Verification</p>
              <h2 className="mt-3 text-[1.75rem] font-semibold md:text-[2rem]">ตรวจสอบได้ ก่อนตัดสินใจ</h2>
              <p className="mt-3 text-base leading-7 text-foreground/65">รู้ว่าใครให้ข้อมูล วิธีทำงานเป็นอย่างไร และอะไรควรตรวจสอบเพิ่มเติมก่อนตัดสินใจเรื่องการเงิน</p>
            </div>
            <div className="mt-9 grid gap-4 md:grid-cols-3">
              {[
                [BadgeCheck, "ใบอนุญาตและคุณวุฒิ", "แสดงข้อมูลที่ตรวจสอบกับแหล่งทางการได้ ไม่ใช้ badge ลอย ๆ แทนหลักฐาน"],
                [Sparkles, "วิธีทำงาน", "ฟังสถานการณ์ → ดูสิ่งที่มีอยู่ → หาช่องว่าง → เปรียบเทียบทางเลือก"],
                [ShieldCheck, "ขอบเขตชัดเจน", "อธิบายทั้งสิ่งที่ช่วยได้ ข้อจำกัดของข้อมูล และจุดที่ต้องใช้ข้อมูลเพิ่ม"],
              ].map(([I, title, detail]) => {
                const Icon = I as typeof BadgeCheck;
                return <div key={String(title)} className="rounded-2xl border border-white/[0.09] bg-secondary/60 p-6"><Icon className="h-5 w-5 text-primary" aria-hidden="true" /><h3 className="mt-5 text-lg font-semibold">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-foreground/60">{String(detail)}</p></div>;
              })}
            </div>
          </div>
        </section>

        <section id="guided-planning" className="scroll-mt-24 bg-[hsl(0_18%_13%)] py-16 md:py-24">
          <div className="mx-auto max-w-5xl px-5 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Guided Planning</p>
            <h2 className="mt-3 max-w-[22ch] text-[1.8rem] font-semibold leading-tight md:text-[2.25rem]">ช่วยปั้นแนะนำว่าคุณควรเริ่มตรงไหน</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-foreground/65">ตอบเพียงไม่กี่ข้อเพื่อจัดลำดับสิ่งที่ควรดูต่อ โดยยังไม่ต้องเลือกผลิตภัณฑ์หรือกรอกข้อมูลส่วนตัว</p>

            <div className="mt-9 rounded-3xl border border-white/[0.1] bg-[hsl(0_15%_18%)] p-5 sm:p-7 md:p-9">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-semibold text-primary">ขั้นที่ {step} จาก {planningSteps.length} · {current.eyebrow}</span>
                <span className="text-foreground/45">{Math.round((step / planningSteps.length) * 100)}%</span>
              </div>
              <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-primary transition-[width] motion-reduce:transition-none" style={{ width: `${(step / planningSteps.length) * 100}%` }} /></div>
              <h3 className="mt-7 text-xl font-semibold leading-snug md:text-2xl">{current.question}</h3>
              <div className="mt-5 grid gap-3">
                {current.options.map((option, index) => {
                  const active = selected === index;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => choose(index)}
                      aria-pressed={active}
                      className={`flex min-h-14 w-full items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left text-base transition focus-visible:outline-none ${active ? "border-primary bg-primary/[0.08]" : "border-white/[0.1] bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.055]"}`}
                    >
                      <span>{option}</span>
                      {active && <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary"><Check className="h-4 w-4" aria-hidden="true" /> เลือกแล้ว</span>}
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button type="button" onClick={back} disabled={step === 1} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-35"><ChevronLeft className="h-4 w-4" /> ย้อนกลับ</button>
                <button type="button" onClick={next} disabled={selected === undefined || step === planningSteps.length} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-35">ต่อไป <ChevronRight className="h-4 w-4" /></button>
              </div>

              {isComplete && (
                <div className="mt-8 rounded-2xl border border-primary/35 bg-[hsl(0_22%_11%)] p-6" aria-live="polite">
                  <p className="text-sm font-semibold text-primary">ภาพรวมเบื้องต้น</p>
                  <h4 className="mt-2 text-xl font-semibold">สิ่งที่ควรจัดการก่อน</h4>
                  <ol className="mt-5 space-y-3">
                    {priorities.map((item, i) => <li key={item} className="flex gap-3"><span className="font-semibold text-primary">{i + 1}</span><span>{item}</span></li>)}
                  </ol>
                  <p className="mt-6 text-sm leading-6 text-foreground/55">นี่เป็นการจัดลำดับเพื่อช่วยเริ่มต้น ไม่ใช่คำแนะนำเฉพาะบุคคล และไม่มีข้อมูลคำตอบของคุณถูกส่งเข้า analytics</p>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Link href="/tools/financial-health-check/" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">ใช้ Financial Health Check</Link>
                    <a href={LINE_OA_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-5 text-sm font-semibold">ให้ปั้นช่วยดูต่อ</a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Tools</p><h2 className="mt-3 text-[1.75rem] font-semibold md:text-[2rem]">เริ่มเช็กด้วยตัวเองก่อน</h2><p className="mt-3 text-base leading-7 text-foreground/65">เครื่องมืออธิบายวิธีคิดและผลลัพธ์ก่อน CTA ติดต่อ เพื่อช่วยให้ตัดสินใจได้ด้วยข้อมูลมากขึ้น</p></div>
              <Link href="/tools/" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary">ดูเครื่องมือทั้งหมด <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="mt-9 grid gap-4 md:grid-cols-2">
              {toolCards.map((tool) => <Link key={tool.title} href={tool.href} className="group rounded-2xl border border-white/[0.09] bg-secondary/45 p-6 transition hover:border-primary/45"><BookOpen className="h-5 w-5 text-primary" /><h3 className="mt-5 text-xl font-semibold">{tool.title}</h3><p className="mt-2 max-w-[48ch] text-sm leading-6 text-foreground/60">{tool.description}</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">เริ่มใช้งาน <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span></Link>)}
            </div>
          </div>
        </section>

        <section className="border-y border-white/[0.07] bg-[hsl(0_18%_13%)] py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Knowledge</p><h2 className="mt-3 text-[1.75rem] font-semibold md:text-[2rem]">อ่านตามเป้าหมาย ไม่ต้องไล่หาทีละบทความ</h2><p className="mt-3 text-base leading-7 text-foreground/65">เวอร์ชัน 4.3 จะเชื่อม Search → Topic → Article → Related Tool → Next Step เป็นเส้นทางเดียวกัน</p></div>
            <div className="mt-8 flex flex-wrap gap-2">{["สุขภาพ", "ครอบครัว", "โรคร้ายแรง", "เกษียณ", "ลงทุน", "ภาษี", "รถ", "บ้าน", "เดินทาง", "สัตว์เลี้ยง"].map((topic) => <span key={topic} className="rounded-full border border-white/[0.1] bg-white/[0.035] px-4 py-2 text-sm text-foreground/75">{topic}</span>)}</div>
            <Link href="/blog/" className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"><Search className="h-4 w-4" /> ไปคลังความรู้</Link>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-5 text-center sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Next Step</p>
            <h2 className="mt-3 text-[1.8rem] font-semibold leading-tight md:text-[2.25rem]">ยังไม่แน่ใจว่าควรเริ่มตรงไหน?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-foreground/65">เริ่มจากเครื่องมือเพื่อดูภาพรวมก่อน หรือคุยจากเรื่องที่คุณกำลังกังวลได้ โดยไม่ต้องรู้ชื่อผลิตภัณฑ์</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Link href="#guided-planning" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground">เริ่ม Guided Planning</Link><a href={LINE_OA_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-6 text-sm font-semibold">คุยผ่าน LINE</a></div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
