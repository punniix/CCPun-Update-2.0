'use client';

/**
 * AnnouncementModal
 *
 * Two-column announcement popup — Plandee-style
 * Left: dark visual panel with feature branding
 * Right: white/light panel with description + CTA
 *
 * Behavior:
 * - แสดงอัตโนมัติครั้งแรกที่ user เปิดเว็บ
 * - dismiss ด้วย: ปุ่ม X, ปุ่ม "ปิดหน้าต่างนี้", ESC key, click outside
 * - checkbox "ไม่แสดงอีก 7 วัน" → เก็บ timestamp ใน localStorage
 * - ถ้ายังไม่ครบ 7 วัน → ไม่แสดง
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import config from './announcement.config';

const DISMISS_DURATION_MS = config.dismissDays * 24 * 60 * 60 * 1000;

// ─── localStorage helpers ──────────────────────────────────────────────────

function isDismissed(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(config.dismissKey);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (isNaN(ts)) return false;
    return Date.now() - ts < DISMISS_DURATION_MS;
  } catch {
    return false;
  }
}

function saveDismiss(): void {
  try {
    localStorage.setItem(config.dismissKey, String(Date.now()));
  } catch {
    // localStorage unavailable — silent fail
  }
}

// ─── Component ────────────────────────────────────────────────────────────

export default function AnnouncementModal() {
  const [visible, setVisible] = useState(false);
  const [dontShow, setDontShow] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleClose = useCallback(() => {
    if (dontShow) {
      saveDismiss();
    }
    setVisible(false);
  }, [dontShow]);

  // Mount check — client only
  useEffect(() => {
    if (!isDismissed()) {
      const timer = setTimeout(() => setVisible(true), config.showDelayMs);
      return () => clearTimeout(timer);
    }
  }, []);

  // Focus trap + ESC key
  useEffect(() => {
    if (!visible) return;

    // Focus ไปที่ปุ่ม X เมื่อ modal เปิด
    closeButtonRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleClose();
      }

      // Focus trap — ไม่ให้ focus ออกนอก modal
      if (e.key === 'Tab') {
        const modal = overlayRef.current?.querySelector('[role="dialog"]');
        if (!modal) return;
        const focusable = modal.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, handleClose]);

  // Click outside modal panel → close
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) {
      handleClose();
    }
  }

  if (!visible) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-6"
      style={{
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        animation: 'announcementOverlayIn 0.25s ease both',
      }}
      aria-hidden="false"
    >
      {/* Modal Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="announcement-title"
        aria-describedby="announcement-desc"
        style={{
          display: 'flex',
          flexDirection: 'column' as const,
          width: '100%',
          maxWidth: '780px',
          maxHeight: 'calc(100vh - 3rem)',
          overflowY: 'auto',
          borderRadius: '1.25rem',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
          animation: 'announcementPanelIn 0.3s cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        {/* ─── Mobile: stacked | Desktop: two-column ─── */}
        <div style={{ display: 'flex', flexDirection: 'row' as const, minHeight: '400px' }}>

          {/* ══ LEFT PANEL — dark brand visual ══════════════════════════════ */}
          <div
            aria-hidden="true"
            style={{
              display: 'none', // hidden on mobile (overridden by @media in <style> below)
              width: '42%',
              flexShrink: 0,
              position: 'relative' as const,
              background: 'linear-gradient(155deg, hsl(220,40%,14%) 0%, hsl(220,35%,10%) 40%, hsl(30,20%,8%) 100%)',
              padding: '2.5rem 2rem',
              flexDirection: 'column' as const,
              justifyContent: 'space-between' as const,
              overflow: 'hidden',
            }}
            className="announcement-left-panel"
          >
            {/* Gold dot grid pattern */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(212,168,83,0.15) 1px, transparent 0)',
                backgroundSize: '28px 28px',
                pointerEvents: 'none',
              }}
            />
            {/* Top-right glow */}
            <div
              style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(212,168,83,0.12) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />
            {/* Bottom-left glow */}
            <div
              style={{
                position: 'absolute',
                bottom: '-30px',
                left: '-30px',
                width: '160px',
                height: '160px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(27,43,94,0.4) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            {/* Content — top */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Accent badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  background: 'rgba(212,168,83,0.15)',
                  border: '1px solid rgba(212,168,83,0.35)',
                  marginBottom: '1.5rem',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'hsl(45,60%,60%)',
                    display: 'inline-block',
                    boxShadow: '0 0 6px rgba(212,168,83,0.8)',
                    animation: 'announcementDotPulse 2s ease-in-out infinite',
                  }}
                />
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: 'hsl(45,65%,68%)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase' as const,
                  }}
                >
                  {config.leftPanel.accentLabel}
                </span>
              </div>

              {/* Feature name — large */}
              <div
                style={{
                  fontSize: '4.5rem',
                  fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  color: 'transparent',
                  background: 'linear-gradient(135deg, hsl(45,70%,72%) 0%, hsl(45,55%,55%) 50%, hsl(45,65%,68%) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '0.25rem',
                }}
              >
                {config.leftPanel.featureName}
              </div>
              {/* Tagline */}
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.45)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase' as const,
                  marginBottom: '2rem',
                }}
              >
                {config.leftPanel.tagline}
              </div>

              {/* Decorative score ring */}
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  border: '2px solid rgba(212,168,83,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative' as const,
                  marginBottom: '0.75rem',
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    border: '2px solid rgba(212,168,83,0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(212,168,83,0.07)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '1.5rem',
                      color: 'hsl(45,65%,68%)',
                      lineHeight: 1,
                    }}
                  >
                    ✦
                  </span>
                </div>
              </div>
              <p
                style={{
                  fontSize: '0.6875rem',
                  color: 'rgba(255,255,255,0.3)',
                  letterSpacing: '0.04em',
                }}
              >
                ccpun.com
              </p>
            </div>

            {/* Bottom — gold accent bar */}
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                height: '3px',
                borderRadius: '9999px',
                background: 'linear-gradient(90deg, hsl(45,60%,55%) 0%, hsl(45,70%,72%) 50%, transparent 100%)',
                width: '60%',
              }}
            />
          </div>

          {/* ══ RIGHT PANEL — content ════════════════════════════════════════ */}
          <div
            style={{
              flex: 1,
              background: 'hsl(0 15% 18%)',
              padding: '1.75rem 1.5rem 1.5rem',
              display: 'flex',
              flexDirection: 'column' as const,
              position: 'relative' as const,
              borderLeft: '1px solid rgba(255,255,255,0.07)',
            }}
            className="announcement-right-panel"
          >
            {/* ─── Close button ─── */}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={handleClose}
              aria-label="ปิดหน้าต่างประกาศ"
              style={{
                position: 'absolute' as const,
                top: '1rem',
                right: '1rem',
                width: '2.75rem',
                height: '2.75rem',
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.1rem',
                lineHeight: 1,
                transition: 'border-color 0.2s, background 0.2s, color 0.2s',
                padding: 0,
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                const btn = e.currentTarget;
                btn.style.borderColor = 'rgba(212,168,83,0.5)';
                btn.style.color = 'hsl(45,65%,68%)';
                btn.style.background = 'rgba(212,168,83,0.08)';
              }}
              onMouseLeave={e => {
                const btn = e.currentTarget;
                btn.style.borderColor = 'rgba(255,255,255,0.15)';
                btn.style.color = 'rgba(255,255,255,0.6)';
                btn.style.background = 'rgba(255,255,255,0.05)';
              }}
            >
              ×
            </button>

            {/* ─── Main content area ─── */}
            <div style={{ flex: 1, paddingRight: '2rem' }}>
              {/* Title */}
              <h2
                id="announcement-title"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'hsl(0 10% 96%)',
                  lineHeight: 1.3,
                  margin: '0 0 0.375rem',
                }}
              >
                {config.title}
              </h2>

              {/* Subtitle */}
              <p
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'hsl(45,65%,62%)',
                  margin: '0 0 1rem',
                }}
              >
                {config.subtitle}
              </p>

              {/* Description */}
              <p
                id="announcement-desc"
                style={{
                  fontSize: '0.8125rem',
                  color: 'rgba(255,255,255,0.6)',
                  lineHeight: 1.65,
                  margin: '0 0 1.25rem',
                }}
              >
                {config.description}
              </p>

              {/* Feature list */}
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 1.5rem',
                  display: 'flex',
                  flexDirection: 'column' as const,
                  gap: '0.625rem',
                }}
              >
                {config.features.map((feature, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.625rem',
                    }}
                  >
                    <span
                      style={{
                        color: 'hsl(45,60%,58%)',
                        fontSize: '0.75rem',
                        lineHeight: '1.6',
                        flexShrink: 0,
                        marginTop: '1px',
                      }}
                    >
                      {feature.icon}
                    </span>
                    <span
                      style={{
                        fontSize: '0.8125rem',
                        color: 'rgba(255,255,255,0.75)',
                        lineHeight: 1.55,
                      }}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              <Link
                href={config.ctaPrimary.href}
                prefetch={false}
                onClick={handleClose}
                className="gold-button"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
                aria-label={config.ctaPrimary.label}
              >
                {config.ctaPrimary.label}
                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>→</span>
              </Link>
            </div>

            {/* ─── Bottom bar: dismiss + checkbox ─── */}
            <div
              style={{
                marginTop: '1.25rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255,255,255,0.07)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                flexWrap: 'wrap' as const,
              }}
            >
              {/* Checkbox: ไม่แสดงอีก 7 วัน */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  minHeight: '2.75rem',
                  cursor: 'pointer',
                  userSelect: 'none' as const,
                }}
              >
                <input
                  type="checkbox"
                  checked={dontShow}
                  onChange={e => setDontShow(e.target.checked)}
                  aria-label={`ไม่แสดงอีก ${config.dismissDays} วัน`}
                  style={{
                    width: '1.125rem',
                    height: '1.125rem',
                    accentColor: 'hsl(45,60%,60%)',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.45)',
                  }}
                >
                  ไม่แสดงอีก {config.dismissDays} วัน
                </span>
              </label>

              {/* ปิดหน้าต่างนี้ */}
              <button
                type="button"
                onClick={handleClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '0.75rem 0.25rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.35)',
                  textDecoration: 'underline',
                  textDecorationColor: 'rgba(255,255,255,0.2)',
                  textUnderlineOffset: '3px',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
              >
                ปิดหน้าต่างนี้
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Keyframes + responsive ─── */}
      <style>{`
        @keyframes announcementOverlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes announcementPanelIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes announcementDotPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(212,168,83,0.8); }
          50% { opacity: 0.6; box-shadow: 0 0 12px rgba(212,168,83,0.4); }
        }

        /* Desktop: show left panel */
        @media (min-width: 640px) {
          .announcement-left-panel {
            display: flex !important;
          }
        }

        /* Mobile: full-width right panel */
        @media (max-width: 639px) {
          .announcement-right-panel {
            padding: 1.5rem 1.25rem 1.25rem !important;
          }
        }
      `}</style>
    </div>
  );
}
