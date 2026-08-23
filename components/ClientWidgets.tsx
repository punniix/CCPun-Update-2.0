'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const CookieConsent = dynamic(() => import('@/components/CookieConsent'), { ssr: false });
const GoogleAnalytics = dynamic(() => import('@/components/GoogleAnalytics'), { ssr: false });
const GoogleTagManager = dynamic(() => import('@/components/GoogleTagManager'), { ssr: false });
const MetaPixel = dynamic(() => import('@/components/MetaPixel'), { ssr: false });

export default function ClientWidgets({ gaId, gtmId, metaPixelId }: { gaId: string; gtmId: string; metaPixelId: string }) {
  const pathname = usePathname();
  const isPrivateSurface = pathname === '/snt-admin'
    || pathname.startsWith('/snt-admin/')
    || pathname === '/studio'
    || pathname.startsWith('/studio/');

  if (isPrivateSurface) return null;

  return <><CookieConsent />{gtmId && <GoogleTagManager gtmId={gtmId} />}{gaId && <GoogleAnalytics gaId={gaId} />}{metaPixelId && <MetaPixel pixelId={metaPixelId} />}</>;
}
