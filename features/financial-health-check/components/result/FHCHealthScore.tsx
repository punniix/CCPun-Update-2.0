'use client';

import { useEffect, useRef, useState } from 'react';
import type { FHNPillarBreakdown } from '@/features/financial-health-check/calculator/types';

interface FHCHealthScoreProps {
  score: number; // 0-100
  fhnBreakdown?: FHNPillarBreakdown;
}

export function getScoreLevel(score: number) {
  if (score <= 20) return { color: '#ef4444', label: 'วิกฤต', description: 'ยังไม่มีแผนรองรับ ควรเริ่มวางแผนทันที' };
  if (score <= 40) return { color: '#f97316', label: 'ต้องเร่ง', description: 'มีบ้างแต่ยังห่างไกล ควรปรึกษาผู้เชี่ยวชาญ' };
  if (score <= 60) return { color: '#eab308', label: 'กำลังพัฒนา', description: 'อยู่ระหว่างทาง มีฐานดีแต่เติมได้อีก' };
  if (score <= 80) return { color: '#84cc16', label: 'ดี', description: 'ครอบคลุมส่วนใหญ่แล้ว เหลือปรับจุดเล็กน้อย' };
  return { color: '#22c55e', label: 'มั่นคง', description: 'ครอบคลุมรอบด้าน มั่นใจได้' };
}

/** 4 Pillars ตาม FHN FinHealth Score framework */
const PILLAR_CONFIG = [
  {
    key: 'spendScore' as const,
    label: 'Spend',
    labelTH: 'การใช้จ่าย',
    max: 25,
    indicators: 'รายจ่าย < รายได้ + มี surplus รายเดือน',
  },
  {
    key: 'saveScore' as const,
    label: 'Save',
    labelTH: 'การออม',
    max: 25,
    indicators: 'เงินสำรองฉุกเฉิน 3-6 เดือน + ออมระยะยาว',
  },
  {
    key: 'borrowScore' as const,
    label: 'Borrow',
    labelTH: 'ภาระหนี้',
    max: 25,
    indicators: 'DSR ≤ 40% + ภาระหนี้รวมที่จัดการได้',
  },
  {
    key: 'planProtectScore' as const,
    label: 'Plan & Protect',
    labelTH: 'ความคุ้มครอง',
    max: 25,
    indicators: 'ทุนประกันชีวิตเพียงพอ + วางแผนระยะยาว',
  },
] as const;

export default function FHCHealthScore({ score, fhnBreakdown }: FHCHealthScoreProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const hasAnimated = useRef(false);

  const { color, label, description } = getScoreLevel(score);

  // Animated count-up
  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const duration = 1500;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(score * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  // Full-circle donut gauge — no open bottom, no overlap issues
  const size = 200;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center py-4">
      {/* Circular donut gauge */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background ring */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
          />
          {/* Score ring */}
          {displayScore > 0 && (
            <circle
              cx={cx} cy={cy} r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={progressOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{
                filter: `drop-shadow(0 0 10px ${color}60)`,
                transition: 'stroke 0.3s ease',
              }}
            />
          )}
        </svg>

        {/* Score + label centered inside ring */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl sm:text-5xl font-bold leading-none" style={{ color }}>
            {displayScore}
          </div>
          <div className="text-sm text-muted-foreground mt-1">/ 100</div>
          <div className="text-base font-semibold mt-2" style={{ color }}>{label}</div>
        </div>
      </div>

      {/* Description below ring — no overlap possible */}
      <p className="text-sm text-muted-foreground mt-3 text-center px-4">{description}</p>
      <p className="text-xs text-muted-foreground/60 mt-1">คะแนนสุขภาพการเงิน (FHN FinHealth Score)</p>

      {/* FHN 4 Pillars breakdown */}
      {fhnBreakdown && (
        <div className="mt-6 w-full max-w-sm space-y-4">
          <p className="text-sm text-muted-foreground text-center mb-3">
            4 มิติสุขภาพการเงิน (แต่ละมิติ max 25 คะแนน)
          </p>

          {PILLAR_CONFIG.map((pillar) => {
            const pillarScore = fhnBreakdown[pillar.key];
            const percentage = (pillarScore / pillar.max) * 100;

            const pillarColor =
              percentage >= 80 ? '#22c55e'
              : percentage >= 60 ? '#84cc16'
              : percentage >= 40 ? '#eab308'
              : percentage >= 20 ? '#f97316'
              : '#ef4444';

            return (
              <div key={pillar.key} className="space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{pillar.labelTH}</span>
                    <span className="text-xs text-muted-foreground/70 leading-snug mt-0.5">{pillar.indicators}</span>
                  </div>
                  <span
                    className="text-sm font-bold tabular-nums shrink-0 mt-0.5"
                    style={{ color: pillarColor }}
                  >
                    {pillarScore}
                    <span className="text-xs text-muted-foreground font-normal">/{pillar.max}</span>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${percentage}%`,
                      background: pillarColor,
                    }}
                  />
                </div>
              </div>
            );
          })}

          <p className="text-sm text-muted-foreground/70 text-center pt-1 leading-relaxed">
            อ้างอิง:{' '}
            <a
              href="https://finhealthnetwork.org/tools/financial-health-score/finhealth-score-methodology/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center underline hover:text-muted-foreground transition-colors"
            >
              Financial Health Network — FinHealth Score Methodology
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
