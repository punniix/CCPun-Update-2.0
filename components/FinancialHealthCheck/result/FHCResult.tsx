'use client';

import { useState } from 'react';
import { Pencil, RotateCcw, Copy, Check } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';
import FHCHealthScore from './FHCHealthScore';
import FHCGapSummary from './FHCGapSummary';
// FHCShareExport removed (hidden feature — component deleted)
import FHCBreakdownChart from './FHCBreakdownChart';
import FHCDetailedBreakdown from './FHCDetailedBreakdown';
import FHCCallToAction from './FHCCallToAction';
import type { FHCResult as FHCResultType, FHCFormData } from '@/lib/fhc/types';
import { getNickname } from '@/lib/fhc/nickname';
import type { FHCNickname } from '@/lib/fhc/nickname';

interface FHCResultProps {
  result: FHCResultType;
  formData: FHCFormData;
  onEditData: () => void;
  onReset: () => void;
}

// -------------------------------------------
// Tier badge config
// -------------------------------------------
const TIER_CONFIG: Record<
  FHCNickname['tier'],
  { label: string; className: string }
> = {
  excellent: { label: 'ยอดเยี่ยม', className: 'bg-amber-400/20 text-amber-300 border border-amber-400/40' },
  good:      { label: 'ดี',        className: 'bg-amber-500/20 text-amber-400 border border-amber-500/40' },
  fair:      { label: 'พอใช้',     className: 'bg-amber-400/10 text-amber-400/60 border border-amber-400/20' },
  poor:      { label: 'ต้องปรับ',  className: 'bg-slate-400/20 text-slate-300 border border-slate-400/40' },
};

export default function FHCResult({ result, formData, onEditData, onReset }: FHCResultProps) {
  const [copied, setCopied] = useState(false);

  // Bug 1 & 2 fix: pass hasNoLifeInsurance so nickname.ts can detect
  // cases where plan pillar is inflated by i8 (retirement score) despite having no life insurance
  const hasNoLifeInsurance = formData.existingCoverage.lifeInsuranceSumAssured === 0;
  const nickname: FHCNickname = getNickname(result.fhnBreakdown, hasNoLifeInsurance);
  const tierConfig = TIER_CONFIG[nickname.tier];

  function handleCopyShare() {
    navigator.clipboard.writeText(nickname.shareText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        // fallback: ไม่มีอะไรแสดง แค่ไม่ crash
      });
  }

  return (
    <div data-fhc-result className="pt-8 pb-6 md:pt-12 md:pb-8 max-w-4xl mx-auto px-4 space-y-8">
      {/* Print header (hidden on screen, visible on print) */}
      <div data-fhc-print-header className="hidden print:block text-center mb-8">
        <h1 className="text-2xl font-bold">CCPun Financial Advisor</h1>
        <p>Financial Health Check — ผลการวิเคราะห์</p>
        <p className="text-sm">วันที่: {new Date().toLocaleDateString('th-TH')}</p>
      </div>

      {/* Header + Edit / Reset */}
      <ScrollReveal>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            ผลวิเคราะห์<span className="text-gold-gradient">สุขภาพการเงิน</span>{' '}
            <span className="text-sm font-normal text-muted-foreground">(Beta)</span>
          </h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onEditData}
              className="glass-button-sm flex min-h-11 items-center gap-2 text-sm"
            >
              <Pencil className="w-3.5 h-3.5" />
              แก้ไขข้อมูล
            </button>
            <button
              type="button"
              onClick={onReset}
              className="flex min-h-11 items-center gap-1.5 px-2 text-sm text-muted-foreground underline underline-offset-2 hover:text-primary transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              เริ่มใหม่
            </button>
          </div>
        </div>
        <div className="section-divider mb-0" />
      </ScrollReveal>

      {/* ===== FREE SECTION ===== */}

      {/* Health Score Gauge */}
      <ScrollReveal delay={0.05}>
        <div className="form-glass p-5 md:p-8">
          <FHCHealthScore score={result.healthScore} fhnBreakdown={result.fhnBreakdown} />
        </div>
      </ScrollReveal>

      {/* Gap Summary */}
      <ScrollReveal delay={0.1}>
        <div className="form-glass p-5 md:p-8">
          <FHCGapSummary
            gap={result.gap}
            isAdequate={result.isAdequate}
            totalNeed={result.totalNeed}
            totalExisting={result.totalExisting}
          />
        </div>
      </ScrollReveal>

      <div className="space-y-8">
          {/* ===== DETAILED SECTION ===== */}

          {/* Financial Nickname — ฉายาการเงิน */}
          <ScrollReveal delay={0.03}>
            <div className="form-glass p-5 md:p-8">
              {/* Section header */}
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-4">
                ฉายาการเงินของคุณ
              </p>

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Nickname + tier badge */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-2xl sm:text-3xl font-bold text-gold-gradient leading-tight break-words">
                      {nickname.nickname}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${tierConfig.className}`}
                    >
                      {tierConfig.label}
                    </span>
                  </div>

                  {/* Tagline */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {nickname.tagline}
                  </p>
                </div>

                {/* Copy share button */}
                <div className="self-start shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyShare}
                    className="glass-button-sm flex min-h-11 items-center gap-2 text-sm mt-3 sm:mt-0"
                    aria-label="คัดลอกข้อความเพื่อแชร์"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-400">คัดลอกแล้ว</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        คัดลอกเพื่อแชร์
                      </>
                    )}
                  </button>
                  <span aria-live="polite" className="sr-only">
                    {copied ? 'คัดลอกเรียบร้อยแล้ว' : ''}
                  </span>
                </div>
              </div>

              {/* Share text preview */}
              <div className="mt-4 rounded-lg bg-foreground/5 border border-border/30 px-4 py-3">
                <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                  {nickname.shareText}
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Breakdown Chart */}
          <ScrollReveal delay={0.05}>
            <div className="form-glass p-5 md:p-8">
              <FHCBreakdownChart result={result} />
            </div>
          </ScrollReveal>

          {/* Detailed Breakdown */}
          <ScrollReveal delay={0.15}>
            <FHCDetailedBreakdown result={result} formData={formData} />
          </ScrollReveal>

          {/* Call to Action */}
          <ScrollReveal delay={0.25}>
            <div className="form-glass p-5 md:p-8">
              <FHCCallToAction gap={result.gap} />
            </div>
          </ScrollReveal>
      </div>
    </div>
  );
}
