'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';
import { CI_ASSESSMENT_VERSION } from '@/lib/ci/constants';
import { getConsentData } from '@/lib/cookie-consent';

const storyBeats = [
  ['01', 'รายได้ที่หายไป', 'ถ้าต้องพักรักษาตัวไม่กี่วัน ก็อาจขาดรายได้ไม่กี่วัน แต่ถ้าต้องรักษาตัวหลายเดือน รายได้ที่เคยมีก็อาจหายจนเหลือศูนย์'],
  ['02', 'ค่าบ้าน รถ และภาระค่าใช้จ่ายอื่นๆ', 'ถ้าเสาหลักต้องหยุดรักษาตัว ค่าบ้าน รถ บัตรเครดิต และสินเชื่อส่วนบุคคลอาจกลายเป็นภาระที่ครอบครัวต้องช่วยกันรับต่อ'],
  ['03', 'ทุนประกันโรคร้ายแรงที่มีอยู่ และสินทรัพย์', 'ผมจึงเทียบภาระกับทุนประกันโรคร้ายแรง รวมถึงสินทรัพย์ที่พร้อมเปลี่ยนเป็นเงินสดได้เร็ว'],
] as const;

export default function CILandingIntro() {
  const landingTrackedRef = useRef(false);

  useEffect(() => {
    const trackLanding = () => {
      if (landingTrackedRef.current || !getConsentData()?.analytics) return;
      if (process.env.NEXT_PUBLIC_SEMANTIC_EVENT_LAYER_ENABLED === 'true' && !document.getElementById('gtm-script')) return;
      landingTrackedRef.current = true;
      trackEvent('ci_landing_view', {
        tool_name: 'ci_planning',
        cta_location: 'ci_landing',
        calculator_version: CI_ASSESSMENT_VERSION,
      });
    };
    const queueLanding = () => queueMicrotask(trackLanding);
    queueLanding();
    window.addEventListener('ccpun:consent', queueLanding);
    window.addEventListener('ccpun:gtm-ready', queueLanding);
    return () => {
      window.removeEventListener('ccpun:consent', queueLanding);
      window.removeEventListener('ccpun:gtm-ready', queueLanding);
    };
  }, []);

  return (
    <section aria-labelledby="ci-problem-title" className="px-4 py-10 md:py-14">
      <div className="mx-auto max-w-5xl">
        <h2 id="ci-problem-title" className="text-[28px] font-bold leading-tight text-foreground md:text-[32px]">
          ทำไมเราถึงใช้ข้อมูลเหล่านี้
        </h2>
        <ol className="mt-6 grid gap-3 md:grid-cols-3">
          {storyBeats.map(([number, title, description]) => (
            <li key={number} className="rounded-2xl border border-border/40 bg-card/55 p-5">
              <p className="text-sm font-semibold text-primary">{number}</p>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">{description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
