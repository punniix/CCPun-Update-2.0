"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BadgeCheck, CheckCircle2, HeartPulse, Landmark, ShieldCheck, Target, WalletCards } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const paths = [
  { icon: HeartPulse, title: "สุขภาพและค่ารักษา", detail: "เริ่มจากความเสี่ยงที่กระทบกระแสเงินสดและเงินสำรอง" },
  { icon: ShieldCheck, title: "ครอบครัวและความคุ้มครอง", detail: "ดูภาระ คนที่ต้องดูแล และทุนที่มีอยู่แล้ว" },
  { icon: Landmark, title: "ลงทุนและสร้างความมั่งคั่ง", detail: "วางเป้าหมาย ระยะเวลา และระดับความเสี่ยงก่อนเลือกทางลงทุน" },
  { icon: Target, title: "เกษียณและเป้าหมายระยะยาว", detail: "ประเมินช่องว่างระหว่างสิ่งที่มีวันนี้กับเงินที่ต้องใช้ในอนาคต" },
];

const process = ["เล่าสถานการณ์", "เช็กสิ่งที่มี", "เห็นช่องว่าง", "เลือกทางไปต่อ"];

export default function Website43PreviewV2() {
  const [selected, setSelected] = useState(0);
  const path = paths[selected];
  const Icon = path.icon;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <section className="relative overflow-hidden border-b border-white/[0.08] pt-20 md:pt-28">
          <div className="absolute inset-0 bg-[hsl(0_24%_11%)]" aria-hidden="true" />
          <div className="absolute inset-y-0 right-0 hidden w-[48%] lg:block" aria-hidden="true">
            <Image src="/assets/hero-pun-laptop-v3.png" alt="" fill priority sizes="48vw" className="object-cover object-[64%_center] opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(0_24%_11%)] via-[hsl(0_24%_11%/.62)] to-transparent" />
          </div>
          <div className="relative z-10 mx-auto max-w-7xl px-5 py-16 sm:px-6 md:py-24 lg:px-8">
            <div className="max-w-[700px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.06] px-3 py-1.5 text-xs font-medium text-primary">
                Website 4.3 · V2 Decision-first
              </div>
              <h1 className="mt-5 max-w-[18ch] text-[2.05rem] font-semibold leading-[1.16] tracking-[-0.03em] sm:text-[2.6rem] md:text-[3.2rem]">
                ไม่ต้องเริ่มจากคำว่า “ซื้ออะไร” เริ่มจากเรื่องที่คุณอยากจัดการ
              </h1>
              <p className="mt-5 max-w-[56ch] text-base leading-7 text-foreground/68 md:text-lg md:leading-8">
                CCPUN ช่วยเรียงความเสี่ยง ประกัน และการลงทุนให้เห็นเป็นภาพเดียว ก่อนตัดสินใจเลือกทางที่เหมาะกับชีวิตจริงของคุณ
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#choose-path" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
                  เลือกเรื่องที่อยากเริ่ม <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <Link href="/tools/financial-health-check/" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-semibold">
                  เช็กสุขภาพการเงินก่อน
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="choose-path" className="bg-[hsl(0_18%_13%)] py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Choose your path</p>
                <h2 className="mt-3 text-[1.8rem] font-semibold leading-tight md:text-[2.2rem]">เรื่องไหนสำคัญกับคุณที่สุดตอนนี้?</h2>
                <p className="mt-3 max-w-[50ch] text-base leading-7 text-foreground/62">เลือกได้โดยไม่ต้องรู้ชื่อแบบประกัน กองทุน หรือผลิตภัณฑ์ใด ๆ</p>
                <div className="mt-7 grid gap-3">
                  {paths.map(({ icon: PathIcon, title, detail }, index) => (
                    <button
                      key={title}
                      type="button"
                      onClick={() => setSelected(index)}
                      aria-pressed={selected === index}
                      className={`flex min-h-[84px] w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${selected === index ? "border-primary/60 bg-primary/[0.08]" : "border-white/[0.09] bg-white/[0.025] hover:bg-white/[0.05]"}`}
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-primary"><PathIcon className="h-5 w-5" aria-hidden="true" /></span>
                      <span><span className="block font-semibold">{title}</span><span className="mt-1 block text-sm leading-6 text-foreground/55">{detail}</span></span>
                    </button>
                  ))}
                </div>
              </div>

              <aside className="lg:sticky lg:top-28">
                <div className="rounded-[28px] border border-primary/25 bg-[linear-gradient(145deg,hsl(0_17%_18%),hsl(0_20%_14%))] p-6 shadow-2xl md:p-8">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                  <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-primary/75">เส้นทางที่เลือก</p>
                  <h3 className="mt-2 text-2xl font-semibold">{path.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-foreground/62">{path.detail}</p>
                  <div className="mt-7 space-y-3 border-t border-white/[0.08] pt-6">
                    {process.map((item, index) => (
                      <div key={item} className="flex items-center gap-3 text-sm"><span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span>{item}</div>
                    ))}
                  </div>
                  <a href="https://lin.ee/tqLCs4f" target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
                    คุยเรื่องนี้กับ CCPUN <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="border-y border-white/[0.07] py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                [BadgeCheck, "ตรวจสอบตัวตนและใบอนุญาต", "แหล่งอ้างอิงและขอบเขตการให้บริการต้องชัดเจน"],
                [CheckCircle2, "เห็นเหตุผลก่อนข้อเสนอ", "เริ่มจากข้อมูลและช่องว่าง ไม่เริ่มจากการดันผลิตภัณฑ์"],
                [WalletCards, "เครื่องมือช่วยคิด", "คำนวณและอ่านต่อได้ด้วยตัวเองก่อนนัดคุย"],
              ].map(([TrustIcon, title, detail]) => {
                const T = TrustIcon as typeof BadgeCheck;
                return <article key={title as string} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"><T className="h-5 w-5 text-primary" aria-hidden="true" /><h3 className="mt-4 font-semibold">{title as string}</h3><p className="mt-2 text-sm leading-6 text-foreground/55">{detail as string}</p></article>;
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
