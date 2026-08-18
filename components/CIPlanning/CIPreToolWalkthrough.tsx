'use client';

import Image from 'next/image';
import { ArrowDown, MessageCircle } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { CI_ASSESSMENT_VERSION, CI_LINE_OA_URL } from '@/lib/ci/constants';

const steps = [
  {
    number: '01',
    title: 'เริ่มจากรายได้ ภาระ และระยะเวลาที่ต้องการวางแผน',
    description: 'เลือกดูจากรายได้ หรือรวมค่าใช้จ่ายและภาระที่ยังต้องดูแลตามที่คุณทราบ',
    src: '/assets/ci-planning/step-1-income-expenses.png',
    alt: 'หน้าจอจริงขั้นแรกของเครื่องมือ สำหรับกรอกรายได้ ค่าใช้จ่าย และเลือกระยะเวลาที่ต้องการวางแผน',
    width: 736,
    height: 1654,
  },
  {
    number: '02',
    title: 'เทียบเงินก้อนและสินทรัพย์ที่พร้อมใช้',
    description: 'กรอกเงินก้อนจากประกันโรคร้ายแรงและสินทรัพย์สภาพคล่องเท่าที่ต้องการนำมาดูในแผนนี้',
    src: '/assets/ci-planning/step-2-resources.png',
    alt: 'หน้าจอจริงขั้นที่สองของเครื่องมือ สำหรับกรอกเงินก้อนจากประกันโรคร้ายแรงและสินทรัพย์สภาพคล่อง',
    width: 736,
    height: 576,
  },
  {
    number: '03',
    title: 'ดูผลประมาณการแยกตามวิธีคิด',
    description: 'ทบทวนผลตามรายได้หรือรายจ่าย และเปรียบเทียบกับทรัพยากรที่พร้อมใช้ก่อนตัดสินใจ',
    src: '/assets/ci-planning/step-3-result.png',
    alt: 'หน้าจอจริงของผลประมาณการ แสดงตัวเลือกทุนตามรายได้หรือรายจ่ายและส่วนต่างเทียบทรัพยากรที่พร้อมใช้',
    width: 736,
    height: 833,
  },
] as const;

export default function CIPreToolWalkthrough() {
  return (
    <section aria-labelledby="ci-walkthrough-title" className="px-4 pb-12 pt-4 md:pb-16 md:pt-6">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold text-primary">ก่อนเริ่มเครื่องมือ</p>
        <h2 id="ci-walkthrough-title" className="mt-2 text-balance text-2xl font-bold leading-snug text-foreground md:text-3xl">
          ดูตัวอย่าง 3 ขั้นตอนก่อนเริ่มกรอกข้อมูล
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">
          ใช้ข้อมูลเท่าที่คุณทราบก่อน แล้วค่อยเติมส่วนที่อยากนำมาทบทวนในแผนนี้
        </p>

        <ol className="mt-7 grid gap-5 md:grid-cols-2">
          {steps.map((step, index) => (
            <li key={step.number} className={index === 0 ? 'md:col-span-2' : undefined}>
              <figure className="overflow-hidden rounded-2xl border border-border/40 bg-card/40">
                <div className="aspect-video overflow-hidden bg-background/70 p-3 md:p-4">
                  <Image
                    src={step.src}
                    alt={step.alt}
                    width={step.width}
                    height={step.height}
                    sizes="(max-width: 767px) calc(100vw - 3.5rem), (max-width: 1023px) calc(50vw - 2.25rem), 460px"
                    className="h-full w-full rounded-xl border border-border/30 object-cover object-top"
                    loading="eager"
                  />
                </div>
                <figcaption className="border-t border-border/30 px-5 py-4 md:px-6">
                  <p className="text-sm font-semibold text-primary">ขั้นที่ {step.number}</p>
                  <h3 className="mt-1 text-lg font-semibold leading-snug text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </figcaption>
              </figure>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          ภาพหน้าจอจากเครื่องมือจริง โดยภาพผลลัพธ์ใช้ข้อมูลทดสอบ ไม่ใช่ข้อมูลของผู้ใช้
        </p>

        <div className="mt-7 flex flex-col gap-4 border-t border-border/30 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            เริ่มจากข้อมูลที่ทราบก่อน หรือคุยกับ CCPun หากอยากทบทวนว่าควรเริ่มจากรายได้หรือรายจ่าย
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="#ci-calculator"
              className="gold-button liquid-shine inline-flex min-h-14 items-center justify-center gap-2 px-7 py-3"
              onClick={() => trackEvent('ci_calculator_cta_click', {
                tool_name: 'ci_planning',
                cta_location: 'ci_walkthrough',
                surface_group: 'ci_planning',
                calculator_version: CI_ASSESSMENT_VERSION,
              })}
            >
              เริ่มกรอกข้อมูล
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href={CI_LINE_OA_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="คุยกับ CCPun ทาง LINE OA (เปิดในแท็บใหม่)"
              className="glass-button inline-flex min-h-14 items-center justify-center gap-2 px-7 py-3"
              onClick={() => trackEvent('ci_contact_click', {
                tool_name: 'ci_planning',
                contact_channel: 'line',
                cta_location: 'ci_walkthrough',
                surface_group: 'ci_planning',
              })}
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              คุยกับ CCPun ทาง LINE OA
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
