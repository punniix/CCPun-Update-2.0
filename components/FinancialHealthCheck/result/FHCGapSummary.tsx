'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { formatBaht } from '@/lib/fhc/formatters';

interface FHCGapSummaryProps {
  gap: number;
  isAdequate: boolean;
  totalNeed: number;
  totalExisting: number;
}

export default function FHCGapSummary({ gap, isAdequate, totalNeed, totalExisting }: FHCGapSummaryProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  // Animated count-up effect
  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const target = Math.abs(gap);
    const duration = 2000; // 2 seconds
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(target * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [gap]);

  return (
    <div ref={ref} className="text-center py-8">
      {/* Status label */}
      <p className={cn(
        'text-sm font-medium mb-2',
        isAdequate ? 'text-green-400' : 'text-muted-foreground'
      )}>
        {isAdequate
          ? 'ยอดเยี่ยม! ความคุ้มครองของคุณเพียงพอแล้ว'
          : 'ส่วนที่ยังสามารถเพิ่มเติมได้'}
      </p>

      {/* Large gap number */}
      <div className={cn(
        'text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 break-all sm:break-normal',
        isAdequate ? 'text-green-400' : 'text-gold-gradient'
      )}>
        {formatBaht(displayValue)}
      </div>

      {/* Context note under gap number */}
      {!isAdequate && (
        <div className="space-y-2 mb-6">
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            ตัวเลขนี้คือความต้องการรวมตลอดระยะเวลาที่คุณดูแลครอบครัว ไม่ใช่จำนวนที่ต้องมีทั้งหมดวันนี้
          </p>
          <p className="text-xs text-primary/80 max-w-md mx-auto font-medium">
            การรู้ตัวเลขนี้คือก้าวแรกที่ดี — คุณสามารถวางแผนปิดส่วนนี้ได้ทีละขั้น
          </p>
        </div>
      )}

      {/* Subtitle — total need vs total existing */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div>
          <span className="text-muted-foreground">ความต้องการรวม</span>
          <p className="font-semibold text-foreground">{formatBaht(totalNeed)}</p>
        </div>
        <div className="w-px h-8 bg-border/50" />
        <div>
          <span className="text-muted-foreground">มีรองรับแล้วหลังกันเงินสำรอง</span>
          <p className="font-semibold text-foreground">{formatBaht(totalExisting)}</p>
        </div>
      </div>
    </div>
  );
}
