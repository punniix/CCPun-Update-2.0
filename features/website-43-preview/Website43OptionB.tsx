"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Landmark,
  LineChart,
  ShieldCheck,
  Sparkles,
  Target,
  UserRoundCheck,
  WalletCards,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const LINE_OA_URL = "https://lin.ee/tqLCs4f";

const starts = [
  { icon: HeartPulse, title: "สุขภาพและความคุ้มครอง", detail: "ค่ารักษา รายได้ และภาระที่ยังต้องดูแล" },
  { icon: WalletCards, title: "ภาพรวมการเงิน", detail: "เงินสำรอง หนี้ ความคุ้มครอง และเป้าหมาย" },
  { icon: Landmark, title: "การลงทุนและเกษียณ", detail: "เป้าหมาย ระยะเวลา ความเสี่ยง และเงินที่ต้องใช้" },
];

const steps = [
  { q: "ตอนนี้คุณอยากเริ่มจากเรื่องไหน?", a: ["ดูภาพรวมการเงินก่อน", "ความคุ้มครองและสุขภาพ", "การลงทุนและเป้าหมาย", "ครอบครัวและคนที่ต้องดูแล"] },
  { q: "เรื่องไหนที่คุณอยากจัดการก่อน?", a: ["ค่ารักษาและความเสี่ยงสุขภาพ", "เงินสำรองและภาระหนี้", "เริ่มลงทุนหรือเตรียมเกษียณ", "ยังไม่แน่ใจ อยากดูภาพรวมก่อน"] },
  { q: "มีใครพึ่งพารายได้หรือการดูแลจากคุณไหม?", a: ["มีคู่สมรสหรือครอบครัว", "มีลูกหรือผู้สูงอายุที่ต้องดูแล", "ยังไม่มีภาระดูแลคนอื่น", "อยากตอบภายหลัง"] },
  { q: "ตอนนี้คุณมีแผนหรือความคุ้มครองอยู่ระดับไหน?", a: ["มีหลายอย่าง แต่อยากเช็กว่าพอไหม", "มีบางส่วน ยังไม่ครบ", "ยังไม่ได้เริ่มจริงจัง", "ไม่แน่ใจว่าที่มีนับรวมอะไรบ้าง"] },
  { q: "หลังเห็นภาพรวม คุณอยากทำอะไรต่อ?", a: ["ใช้เครื่องมือคำนวณด้วยตัวเอง", "อ่านเรื่องที่เกี่ยวข้องก่อน", "ให้ปั้นช่วยดูภาพรวม", "ขอเก็บผลไว้คิดก่อน"] },
];

const partners = ["AIA · ประกันชีวิต", "Maybank · การลงทุน", "PhillipCapital · การลงทุน", "Finnomena · การลงทุน"];

export default function Website43OptionB() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const selected = answers[step];
  const complete = step === steps.length - 1 && selected !== undefined;

  const priorities = useMemo(() => {
    const first = answers[0] ?? 0;
    if (first === 1) return ["เช็กความคุ้มครองสุขภาพและรายได้", "ดูเงินสำรองที่พร้อมใช้", "ทบทวนภาระของคนที่ต้องดูแล"];
    if (first === 2) return ["กำหนดเป้าหมายและระยะเวลา", "เช็กฐานเงินสำรองและความคุ้มครอง", "ประเมินความเสี่ยงที่รับได้"];
    if (first === 3) return ["ดูภาระและคนที่ต้องดูแล", "เช็กทุนความคุ้มครอง", "จัดลำดับเป้าหมายของครอบครัว"];
    return ["เงินสำรองฉุกเฉิน", "ความคุ้มครองสุขภาพและรายได้", "เป้าหมายลงทุนระยะยาว"];
  }, [answers]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <section className="relative isolate min-h-[760px] overflow-hidden border-b border-white/10 pt-20 md:min-h-[880px] md:pt-24">
          <Image src="/assets/hero-pun-laptop-v3.png" alt="" fill priority sizes="100vw" className="-z-20 object-cover object-[68%_center] md:object-center" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,16,12,.96)_0%,rgba(8,16,12,.86)_36%,rgba(8,16,12,.38)_67%,rgba(8,16,12,.08)_100%)]" />
          <div className="mx-auto flex min-h-[680px] max-w-7xl items-center px-5 py-16 sm:px-6 md:min-h-[780px] lg:px-8">
            <div className="max-w-[760px] md:max-w-[58%]">
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Insurance & Investment Planning</p>
              <h1 className="mt-5 text-[2.4rem] font-semibold leading-[1.12] tracking-[-.035em] sm:text-[3.25rem] lg:text-[4rem]">วางแผนชีวิตและการเงิน โดยเริ่มจากตัวคุณ ไม่ใช่ผลิตภัณฑ์</h1>
              <p className="mt-6 max-w-[58ch] text-base leading-7 text-white/72 md:text-lg md:leading-8">ดูสิ่งที่มีอยู่ ความเสี่ยงที่ต้องรับผิดชอบ และเป้าหมายที่อยากไปให้ถึง ก่อนเลือกประกันหรือการลงทุนที่เหมาะกับคุณจริง ๆ</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="#guided" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">เริ่มดูภาพรวมของคุณ <ArrowRight className="h-4 w-4" /></Link>
                <Link href="/tools/financial-health-check/" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/25 bg-black/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10">เช็กสุขภาพการเงิน</Link>
              </div>
              <div className="mt-12 flex flex-wrap gap-x-7 gap-y-2 text-xs text-white/60"><span>PERSONAL FINANCE</span><span>PROTECTION</span><span>INVESTMENT</span></div>
            </div>
          </div>
        </section>

        <section className="bg-[#f6f5ef] py-20 text-[#172019] md:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
              <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Start with you</p><h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-.02em] md:text-5xl">ไม่ต้องรู้ก่อนว่า “ควรซื้ออะไร”</h2></div>
              <p className="max-w-2xl text-base leading-8 text-[#435047] md:text-lg">เริ่มจากเรื่องที่อยากจัดการก่อน แล้วค่อยเชื่อมไปยังข้อมูล เครื่องมือ และทางเลือกที่เกี่ยวข้อง วิธีนี้ช่วยลดการตัดสินใจจากชื่อผลิตภัณฑ์เพียงอย่างเดียว</p>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-3">{starts.map(({icon:Icon,title,detail},i)=><a key={title} href="#guided" className="group rounded-[28px] border border-black/8 bg-white/80 p-7 shadow-[0_16px_50px_rgba(0,0,0,.05)] transition hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(0,0,0,.08)]"><div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span><span className="text-xs text-black/40">0{i+1}</span></div><h3 className="mt-8 text-xl font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-black/55">{detail}</p><span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary">เริ่มจากเรื่องนี้ <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></a>)}</div>
          </div>
        </section>

        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Planning map</p><h2 className="mt-4 text-3xl font-semibold tracking-[-.02em] md:text-5xl">จากความกังวล → แผนที่มองเห็นได้</h2><p className="mt-5 text-base leading-8 text-foreground/60">ไม่แยกประกันกับการลงทุนออกจากชีวิตจริง แต่จัดตามลำดับความจำเป็นและเป้าหมาย</p></div>
            <div className="mt-12 grid gap-4 lg:grid-cols-3">{[[ShieldCheck,"1 · ป้องกันความเสี่ยง","สุขภาพ รายได้ ครอบครัว และภาระที่ไม่ควรปล่อยให้พังแผน"],[BarChart3,"2 · สร้างฐานการเงิน","เงินสำรอง กระแสเงินสด หนี้ และสิ่งที่มีอยู่แล้ว"],[LineChart,"3 · เติบโตตามเป้าหมาย","ลงทุน เกษียณ ภาษี และการส่งต่อทรัพย์สิน"]].map(([Icon,title,body]:any)=><div key={title} className="rounded-[28px] border border-border/60 bg-card p-7"><Icon className="h-6 w-6 text-primary"/><h3 className="mt-7 text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-7 text-foreground/60">{body}</p></div>)}</div>
          </div>
        </section>

        <section id="guided" className="border-y border-border/60 bg-[#f6f5ef] py-20 text-[#172019] md:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[.78fr_1.22fr]">
              <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Guided planning</p><h2 className="mt-4 text-3xl font-semibold tracking-[-.02em] md:text-5xl">เริ่มจากคำถาม 5 ข้อ</h2><p className="mt-5 max-w-md text-base leading-8 text-black/55">ไม่ใช่แบบสอบถามเพื่อขายของ แต่เป็นทางลัดให้เห็นว่าควรเริ่มจัดการเรื่องไหนก่อน</p><div className="mt-8 flex gap-2">{steps.map((_,i)=><span key={i} className={`h-1.5 flex-1 rounded-full ${i<=step?"bg-primary":"bg-black/10"}`} />)}</div></div>
              <div className="rounded-[32px] border border-black/8 bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,.07)] md:p-9">
                {!complete ? <><div className="flex items-center justify-between text-xs text-black/45"><span>STEP {step+1} / {steps.length}</span><span>ใช้เวลาประมาณ 1 นาที</span></div><h3 className="mt-6 text-2xl font-semibold leading-snug md:text-3xl">{steps[step].q}</h3><div className="mt-7 grid gap-3">{steps[step].a.map((x,i)=><button key={x} onClick={()=>setAnswers(v=>({...v,[step]:i}))} className={`flex min-h-14 items-center justify-between rounded-2xl border px-5 py-4 text-left text-sm font-medium transition ${selected===i?"border-primary bg-primary/8":"border-black/10 hover:border-primary/40 hover:bg-black/[.02]"}`}><span>{x}</span>{selected===i&&<Check className="h-4 w-4 text-primary"/>}</button>)}</div><div className="mt-8 flex items-center justify-between"><button onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold disabled:opacity-30"><ChevronLeft className="h-4 w-4"/>ย้อนกลับ</button><button onClick={()=>selected!==undefined&&setStep(s=>Math.min(steps.length-1,s+1))} disabled={selected===undefined} className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-40">{step===steps.length-1?"ดูผลลัพธ์":"ต่อไป"}<ChevronRight className="h-4 w-4"/></button></div></> : <><p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Your planning direction</p><h3 className="mt-4 text-3xl font-semibold">สิ่งที่ควรจัดลำดับก่อน</h3><div className="mt-7 grid gap-3">{priorities.map((x,i)=><div key={x} className="flex items-start gap-4 rounded-2xl bg-[#f6f5ef] p-5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{i+1}</span><span className="pt-1 text-sm font-medium">{x}</span></div>)}</div><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/tools/financial-health-check/" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary px-6 text-sm font-semibold text-primary-foreground">ทำ Financial Health Check</Link><button onClick={()=>{setStep(0);setAnswers({})}} className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-black/10 px-6 text-sm font-semibold">เริ่มใหม่</button></div></>}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center"><div className="relative min-h-[520px] overflow-hidden rounded-[32px] bg-muted"><Image src="/assets/hero-pun-laptop-v3.png" alt="Chanatip Chidprasert" fill className="object-cover object-center"/></div><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">About & credentials</p><h2 className="mt-4 text-3xl font-semibold tracking-[-.02em] md:text-5xl">วางแผนโดยคนที่คุณตรวจสอบตัวตนและขอบเขตงานได้</h2><p className="mt-6 text-base leading-8 text-foreground/60">Chanatip Chidprasert — Financial Advisor / Investment Planner ทำงานโดยเริ่มจากสถานการณ์ของลูกค้า ตรวจสิ่งที่มีอยู่ แล้วค่อยหาช่องว่างและทางเลือกที่เหมาะสม</p><div className="mt-8 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-border p-5"><BadgeCheck className="h-5 w-5 text-primary"/><p className="mt-4 text-sm font-semibold">ก.ล.ต. · Investment Planner</p><p className="mt-1 text-sm text-foreground/55">IP License #IP106654</p></div><div className="rounded-2xl border border-border p-5"><UserRoundCheck className="h-5 w-5 text-primary"/><p className="mt-4 text-sm font-semibold">คปภ. · ใบอนุญาตนายหน้า</p><p className="mt-1 text-sm text-foreground/55">แสดงเลขที่ยืนยันแล้วก่อนเผยแพร่ Production</p></div></div><p className="mt-5 text-xs leading-5 text-foreground/45">Preview นี้ไม่ใช้เลขใบอนุญาตที่ยังไม่ได้ยืนยันจากแหล่งทางการ</p></div></div>
          </div>
        </section>

        <section className="bg-[#f6f5ef] py-20 text-[#172019] md:py-24"><div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8"><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Partners</p><h2 className="mt-4 text-3xl font-semibold md:text-4xl">พันธมิตรที่เกี่ยวข้องกับการให้บริการ</h2><div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{partners.map(x=><div key={x} className="rounded-2xl border border-black/8 bg-white/65 px-5 py-5 text-sm font-semibold">{x}</div>)}</div><p className="mt-5 text-xs leading-5 text-black/45">การมี partner ไม่ได้หมายความว่าทุกผลิตภัณฑ์เหมาะกับทุกคน การวางแผนควรมาก่อนการเลือกผลิตภัณฑ์</p></div></section>

        <section className="py-20 md:py-24"><div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8"><div className="grid gap-8 lg:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Tools</p><h2 className="mt-4 text-3xl font-semibold md:text-4xl">อยากเริ่มด้วยตัวเองก่อนก็ได้</h2></div><div className="grid gap-3"><Link href="/tools/financial-health-check/" className="rounded-[24px] border border-border p-6 transition hover:border-primary/50"><Sparkles className="h-5 w-5 text-primary"/><h3 className="mt-5 text-lg font-semibold">Financial Health Check</h3><p className="mt-2 text-sm leading-6 text-foreground/55">ดูฐานเงินสำรอง ภาระ และความคุ้มครองก่อนวางแผนต่อ</p></Link><Link href="/ci-planning/" className="rounded-[24px] border border-border p-6 transition hover:border-primary/50"><Target className="h-5 w-5 text-primary"/><h3 className="mt-5 text-lg font-semibold">วางแผนทุนโรคร้ายแรง</h3><p className="mt-2 text-sm leading-6 text-foreground/55">ประเมินเงินก้อนจากรายได้ ภาระ และสินทรัพย์ที่พร้อมใช้</p></Link><Link href="/blog/" className="rounded-[24px] border border-border p-6 transition hover:border-primary/50"><BookOpen className="h-5 w-5 text-primary"/><h3 className="mt-5 text-lg font-semibold">อ่าน Knowledge ก่อนตัดสินใจ</h3><p className="mt-2 text-sm leading-6 text-foreground/55">บทความประกัน การลงทุน ภาษี และการวางแผนชีวิต</p></Link></div></div></div></section>

        <section className="bg-[#08100c] py-20 text-white md:py-24"><div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8"><div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Plan with CCPUN</p><h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-[-.02em] md:text-5xl">ไม่จำเป็นต้องตัดสินใจทุกอย่างวันนี้ แค่เริ่มเห็นภาพให้ชัดก่อน</h2><p className="mt-5 max-w-2xl text-base leading-8 text-white/60">ถ้าคุณมีประกันหรือการลงทุนอยู่แล้ว สามารถเริ่มจากการทบทวนของเดิมได้ ไม่จำเป็นต้องเริ่มใหม่ทั้งหมด</p></div><a href={LINE_OA_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-semibold text-primary-foreground">คุยกับปั้นทาง LINE <ArrowRight className="h-4 w-4"/></a></div></div></section>
      </main>
      <Footer />
    </div>
  );
}
