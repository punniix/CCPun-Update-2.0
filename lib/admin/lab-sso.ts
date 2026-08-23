/**
 * Legacy compatibility hook for the former Lab trust mode.
 *
 * Vercel Deployment Protection is perimeter security only. It must never create
 * an in-application Admin identity; Auth.js and the CCPun email allowlist remain
 * required in every environment.
 */
export function isVercelSsoLabTrustMode(): boolean {
  return false;
}
