'use client';

import dynamic from 'next/dynamic';

const CookieConsent = dynamic(() => import('@/components/CookieConsent'), { ssr: false });
const GoogleAnalytics = dynamic(() => import('@/components/GoogleAnalytics'), { ssr: false });
const MetaPixel = dynamic(() => import('@/components/MetaPixel'), { ssr: false });

export default function ClientWidgets({ gaId, metaPixelId }: { gaId: string; metaPixelId: string }) {
  return <><CookieConsent />{gaId && <GoogleAnalytics gaId={gaId} />}{metaPixelId && <MetaPixel pixelId={metaPixelId} />}</>;
}
