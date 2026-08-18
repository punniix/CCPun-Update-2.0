'use client';

import { useEffect } from 'react';
import { CCPUN_SITE_VERSION, clearPendingAnalyticsEvents, flushPendingAnalyticsEvents } from '@/lib/analytics';
import { getConsentData } from '@/lib/cookie-consent';

function loadGA(gaId: string) {
  if (document.getElementById('ga-script')) return flushPendingAnalyticsEvents('analytics');
  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => window.dataLayer?.push(args);
  window.gtag('js', new Date());
  window.gtag('set', { site_version: CCPUN_SITE_VERSION });
  window.gtag('config', gaId);
  const script = document.createElement('script');
  script.id = 'ga-script'; script.async = true; script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);
  flushPendingAnalyticsEvents('analytics');
}

function disableGA() {
  clearPendingAnalyticsEvents('analytics');
  window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
  document.getElementById('ga-script')?.remove();
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=', 1)[0]?.trim();
    if (!name?.startsWith('_ga')) continue;
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
    document.cookie = `${name}=; Path=/; Domain=.ccpun.com; Max-Age=0; SameSite=Lax`;
  }
  delete window.gtag;
  delete window.dataLayer;
}

export default function GoogleAnalytics({ gaId }: { gaId: string }) {
  useEffect(() => {
    const apply = () => getConsentData()?.analytics ? loadGA(gaId) : disableGA();
    apply(); window.addEventListener('ccpun:consent', apply);
    return () => window.removeEventListener('ccpun:consent', apply);
  }, [gaId]);
  return null;
}
