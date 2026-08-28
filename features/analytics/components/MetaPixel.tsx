'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { CCPUN_SITE_VERSION, clearPendingAnalyticsEvents, flushPendingAnalyticsEvents, type MetaPixelFunction } from '@/lib/analytics';
import { getConsentData } from '@/lib/cookie-consent';

function valid(pixelId: string) { return /^\d{5,20}$/.test(pixelId); }
let lastTrackedPath: string | null = null;

function paidSurface(pathname: string): { tool_name: 'ci_planning' | 'fhc'; page_type: 'tool' } | null {
  if (pathname.startsWith('/ci-planning')) return { tool_name: 'ci_planning', page_type: 'tool' };
  if (pathname.startsWith('/tools/fhc') || pathname.startsWith('/tools/financial-health-check')) return { tool_name: 'fhc', page_type: 'tool' };
  return null;
}

function load(pixelId: string, pathname: string) {
  const surface = paidSurface(pathname);
  if (!surface || !valid(pixelId) || typeof window === 'undefined') return disable();
  if (!window.fbq) {
    const fbq = ((...args: unknown[]) => fbq.callMethod ? fbq.callMethod(...args) : fbq.queue?.push(args)) as MetaPixelFunction;
    fbq.queue = []; fbq.push = fbq; fbq.loaded = true; fbq.version = '2.0';
    window.fbq = fbq; window._fbq = fbq;
  }
  if (!document.getElementById('meta-pixel-script')) {
    const script = document.createElement('script');
    script.id = 'meta-pixel-script'; script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'; document.head.appendChild(script);
    window.fbq('init', pixelId);
  }
  window.fbq('consent', 'grant');
  if (lastTrackedPath !== pathname) {
    const context = { site_version: CCPUN_SITE_VERSION, page_type: surface.page_type, tool_name: surface.tool_name };
    window.fbq('track', 'PageView', context);
    window.fbq('track', 'ViewContent', context);
    lastTrackedPath = pathname;
  }
  flushPendingAnalyticsEvents('social');
}

function disable() {
  clearPendingAnalyticsEvents('social');
  window.fbq?.('consent', 'revoke');
  document.getElementById('meta-pixel-script')?.remove();
  for (const name of ['_fbp', '_fbc']) {
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
    document.cookie = `${name}=; Path=/; Domain=.ccpun.com; Max-Age=0; SameSite=Lax`;
  }
  delete window.fbq;
  delete window._fbq;
  lastTrackedPath = null;
}

export default function MetaPixel({ pixelId }: { pixelId: string }) {
  const pathname = usePathname();
  useEffect(() => {
    const apply = () => getConsentData()?.social ? load(pixelId, pathname) : disable();
    apply(); window.addEventListener('ccpun:consent', apply);
    return () => window.removeEventListener('ccpun:consent', apply);
  }, [pixelId, pathname]);
  return null;
}
