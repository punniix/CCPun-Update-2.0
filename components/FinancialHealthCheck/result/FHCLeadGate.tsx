'use client';

import { useState, useRef } from 'react';
import { Mail, User, ChevronDown, Loader2, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';
import { trackEvent } from '@/lib/analytics';
import type { LeadData, FHNPillarBreakdown, FHCResult, FHCFormData } from '@/lib/fhc/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface FHCLeadGateProps {
  /** Called when user chooses to skip the gate */
  onSkip: () => void;
  /** Called when user successfully submits — parent unlocks full report */
  onSubmitSuccess: () => void;
  /** FHC health score — shown above the gate to tease the result */
  score: number;
  /** FHN 4-pillar breakdown scores */
  fhnBreakdown: FHNPillarBreakdown;
  /** Full calculation result — gap, totalNeed, totalExisting, etc. */
  result: FHCResult;
  /** Raw form data entered by the user */
  formData: FHCFormData;
}

// ---------------------------------------------------------------------------
// Validation schema — name + email only per UX spec
// ---------------------------------------------------------------------------
const gateSchema = z.object({
  name: z.string().trim().min(2, 'กรุณากรอกชื่อ (อย่างน้อย 2 ตัวอักษร)'),
  email: z.string().trim().email({ message: 'กรุณากรอกอีเมลให้ถูกต้อง' }),
});

// ---------------------------------------------------------------------------
// Lead proxy URL — should point to Cloudflare Worker, not n8n directly.
// ---------------------------------------------------------------------------
const LEAD_PROXY_URL = process.env.NEXT_PUBLIC_LEAD_PROXY_URL ?? '';

function buildLeadEndpoint(path: string): string {
  if (!LEAD_PROXY_URL) return '';
  return `${LEAD_PROXY_URL.replace(/\/$/, '')}${path}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function FHCLeadGate({
  onSkip,
  onSubmitSuccess,
  score,
  fhnBreakdown,
  result,
  formData,
}: FHCLeadGateProps) {
  const [gateForm, setGateForm] = useState({ name: '', email: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  /** Honeypot — bot detection, hidden from real users */
  const [honeypot, setHoneypot] = useState('');
  /** Ref สำหรับ scroll-to consent เมื่อ submit ขณะยังไม่ tick */
  const consentRef = useRef<HTMLLabelElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGateForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Honeypot check — bots fill hidden fields
    if (honeypot) return;

    const parseResult = gateSchema.safeParse(gateForm);
    if (!parseResult.success) {
      const fieldErrors: Record<string, string> = {};
      parseResult.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (path && !fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    if (!consent) {
      // Scroll to consent checkbox + highlight
      setConsentError(true);
      consentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setConsentError(false);

    setIsSubmitting(true);
    setSubmitError('');

    const leadData: LeadData = parseResult.data;
    const leadEndpoint = buildLeadEndpoint('/api/fhc-lead');

    if (!leadEndpoint) {
      setSubmitError('โหมดนี้ยังไม่ได้เชื่อมระบบส่งรายงาน กรุณาข้ามเพื่อดูผล หรือทัก LINE @ccpun');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(leadEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'fhc-lead',
          lead: {
            name: leadData.name,
            email: leadData.email,
          },
          score,
          submittedAt: new Date().toISOString(),
          source: 'fhc-tool',
          fhnBreakdown: {
            spendScore: fhnBreakdown.spendScore,
            saveScore: fhnBreakdown.saveScore,
            borrowScore: fhnBreakdown.borrowScore,
            planProtectScore: fhnBreakdown.planProtectScore,
          },
          result: {
            totalNeed: result.totalNeed,
            totalExisting: result.totalExisting,
            gap: result.gap,
            isAdequate: result.isAdequate,
            emergencyFund: result.emergencyFund,
          },
          formData: {
            age: formData.personalInfo.age,
            monthlyIncome: formData.incomeExpenses.monthlyIncome,
            monthlyExpenses: formData.incomeExpenses.monthlyExpenses,
            totalDebt: formData.debts.totalDebt,
            debtItems: formData.debts.items,
            savings: formData.existingCoverage.savings,
            investments: formData.existingCoverage.investments,
            existingEmergencyFund: formData.existingCoverage.existingEmergencyFund,
            lifeInsuranceSumAssured: formData.existingCoverage.lifeInsuranceSumAssured,
            hasHealthInsurance: formData.existingCoverage.hasHealthInsurance,
            healthInsuranceCoverage: formData.existingCoverage.healthInsuranceCoverage,
            hasCriticalIllness: formData.existingCoverage.hasCriticalIllness,
            criticalIllnessCoverage: formData.existingCoverage.criticalIllnessCoverage,
            numberOfDependents: formData.dependents.numberOfDependents,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Lead proxy responded with status ${response.status}`);
      }

      const payload = await response.json().catch(() => null) as { success?: boolean } | null;
      if (!payload?.success) {
        throw new Error('Lead proxy did not confirm success');
      }

      trackEvent('fhc_lead_submitted', { score, source: 'fhc_lead_gate' });
      setSubmitted(true);

      // Small delay so user sees the thank-you message before full report appears
      setTimeout(() => {
        onSubmitSuccess();
      }, 1800);
    } catch {
      setSubmitError('ระบบส่งรายงานยังไม่สำเร็จ กรุณาลองอีกครั้ง หรือข้ามเพื่อดูผลเลย');
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Success state — thank-you before unlocking full report
  // ---------------------------------------------------------------------------
  if (submitted) {
    return (
      <div className="form-glass p-6 md:p-10 text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle2 className="w-12 h-12 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-foreground">ขอบคุณที่ไว้ใจ CCPun</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          เราจะส่งรายงานสุขภาพการเงินฉบับเต็มไปที่อีเมลของคุณ
          กำลังแสดงผลวิเคราะห์ทั้งหมด...
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main gate UI
  // ---------------------------------------------------------------------------
  return (
    <div className="form-glass overflow-hidden">
      {/* Teaser bar — score preview above the gate */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between gap-4 bg-white/[0.03]">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">คะแนนสุขภาพการเงินของคุณ</p>
          <p className="text-2xl font-bold text-foreground">
            {score}{' '}
            <span className="text-sm font-normal text-muted-foreground">/ 100</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">รายงานฉบับเต็มรอคุณอยู่ด้านล่าง</p>
          <ChevronDown className="w-5 h-5 text-muted-foreground/50 ml-auto mt-1" />
        </div>
      </div>

      {/* Gate body */}
      <div className="p-6 md:p-8 space-y-6">
        {/* Headline */}
        <div className="text-center space-y-1.5">
          <h3 className="text-xl font-bold text-foreground">
            รับรายงานสุขภาพการเงินฉบับเต็ม
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            พร้อมคำแนะนำเฉพาะสำหรับคุณ — ส่งตรงถึงอีเมล
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto">
          {/* Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="gate-name"
              className="text-sm font-medium text-foreground flex items-center gap-2"
            >
              <User className="w-4 h-4 text-primary" />
              ชื่อ
            </label>
            <input
              id="gate-name"
              name="name"
              type="text"
              autoComplete="name"
              value={gateForm.name}
              onChange={handleChange}
              placeholder="ชื่อของคุณ"
              maxLength={100}
              aria-describedby={errors.name ? 'gate-name-error' : undefined}
              className={`w-full h-12 px-4 rounded-lg bg-white/5 border text-foreground placeholder:text-muted-foreground/50 text-sm outline-none transition-colors focus:border-primary/60 ${
                errors.name ? 'border-destructive' : 'border-white/10'
              }`}
            />
            {errors.name && (
              <p id="gate-name-error" role="alert" className="text-xs text-destructive">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="gate-email"
              className="text-sm font-medium text-foreground flex items-center gap-2"
            >
              <Mail className="w-4 h-4 text-primary" />
              อีเมล
            </label>
            <input
              id="gate-email"
              name="email"
              type="email"
              autoComplete="email"
              value={gateForm.email}
              onChange={handleChange}
              placeholder="email@example.com"
              maxLength={255}
              aria-describedby={errors.email ? 'gate-email-error' : undefined}
              className={`w-full h-12 px-4 rounded-lg bg-white/5 border text-foreground placeholder:text-muted-foreground/50 text-sm outline-none transition-colors focus:border-primary/60 ${
                errors.email ? 'border-destructive' : 'border-white/10'
              }`}
            />
            {errors.email && (
              <p id="gate-email-error" role="alert" className="text-xs text-destructive">
                {errors.email}
              </p>
            )}
          </div>

          {/* Honeypot — hidden from real users, catches bots */}
          <input
            type="text"
            name="website"
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            aria-hidden="true"
          />

          {/* PDPA Consent */}
          <label
            ref={consentRef}
              className={`flex min-h-11 items-start gap-3 cursor-pointer select-none rounded-lg p-2 -mx-2 transition-colors ${
              consentError ? 'ring-2 ring-destructive/60 bg-destructive/5' : ''
            }`}
          >
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (e.target.checked) setConsentError(false);
              }}
              className="mt-0.5 accent-primary shrink-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              ยินยอมรับสรุปผลการตรวจสุขภาพการเงิน รวมถึงข้อมูลที่กรอกไว้ ทางอีเมลนี้ — ดู{' '}
              <a
                href="/privacy/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-primary hover:text-primary/80 transition-colors"
              >
                นโยบายความเป็นส่วนตัว
              </a>
            </span>
          </label>
          {consentError && (
            <p role="alert" className="text-xs text-destructive -mt-2">
              กรุณายืนยันการยินยอมก่อน
            </p>
          )}

          {/* Submit error */}
          {submitError && (
            <p role="alert" className="text-xs text-destructive text-center">
              {submitError}
            </p>
          )}

          {/* Submit button — ปุ่ม active ตลอด, handle consent ผ่าน scroll */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="gold-button w-full flex items-center justify-center gap-2 h-12 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังส่ง...
              </>
            ) : (
              'รับรายงานฉบับเต็ม'
            )}
          </button>
        </form>

        {/* Skip — soft gate: always accessible */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => {
              trackEvent('fhc_lead_skipped', { score });
              onSkip();
            }}
            className="text-xs text-muted-foreground/60 underline underline-offset-2 hover:text-muted-foreground transition-colors"
          >
            ข้ามและดูผลเลย
          </button>
        </div>
      </div>
    </div>
  );
}
