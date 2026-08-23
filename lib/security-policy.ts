import { IS_REVIEW_ENVIRONMENT } from "./deployment-environment";

const IS_DEVELOPMENT = process.env.NODE_ENV === "development";
export function shouldEnforceHttps(environment = process.env.CCPUN_APP_ENV): boolean {
  return environment !== "local-uat" && environment !== "local-production";
}

const ENFORCE_HTTPS = shouldEnforceHttps();
const SANITY_REVIEW_SCRIPT_SOURCES = IS_REVIEW_ENVIRONMENT
  ? " https://core.sanity-cdn.com"
  : "";
const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
const SANITY_CONNECT_SOURCES = /^[a-z0-9]+$/.test(SANITY_PROJECT_ID)
  ? ` https://${SANITY_PROJECT_ID}.api.sanity.io wss://${SANITY_PROJECT_ID}.api.sanity.io`
  : "";
const SANITY_REVIEW_CONNECT_SOURCES = IS_REVIEW_ENVIRONMENT
  ? " https://sanity-cdn.com https://*.sanity-cdn.com"
  : "";

export const SECURITY_POLICY = [
  ...(ENFORCE_HTTPS ? ["upgrade-insecure-requests"] : []),
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${IS_DEVELOPMENT ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://connect.facebook.net https://static.cloudflareinsights.com https://*.cloudflare.com${SANITY_REVIEW_SCRIPT_SOURCES}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  `connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://connect.facebook.net https://www.facebook.com https://static.cloudflareinsights.com https://fonts.googleapis.com https://fonts.gstatic.com https://lead-proxy.ccpun.com${SANITY_CONNECT_SOURCES}${SANITY_REVIEW_CONNECT_SOURCES}`,
  "frame-src 'self' https://www.facebook.com",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://www.facebook.com",
].join("; ");

export const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: SECURITY_POLICY },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ...(ENFORCE_HTTPS
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
] as const;
