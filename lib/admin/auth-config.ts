import type { AdminEnvironment } from "./environment";

const LOCAL_ADMIN_HOSTS: Partial<Record<AdminEnvironment, string>> = {
  "local-uat": "localhost:3100",
  "local-production": "localhost:3000",
};

export function hasStrongAuthSecret(value: string | undefined): boolean {
  return Boolean(value && value.length >= 32);
}

export function isSecureAdminAuthUrl(
  value: string | undefined,
  nodeEnvironment = process.env.NODE_ENV,
): boolean {
  if (!value) return false;

  try {
    const url = new URL(value);
    const isLocalDevelopment =
      nodeEnvironment !== "production" &&
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1");

    return (
      (url.protocol === "https:" || isLocalDevelopment) &&
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}

export function isSafeExternalAuthorizationUrl(url: URL | undefined, allowedOrigin?: string): boolean {
  return Boolean(
    url &&
    url.protocol === "https:" &&
    !url.username &&
    !url.password &&
    (!allowedOrigin || url.origin === allowedOrigin),
  );
}

export function isSameOriginAdminMutation(requestUrl: string, origin: string | null): boolean {
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(requestUrl).origin;
  } catch {
    return false;
  }
}

export function isConfiguredAdminOrigin(requestUrl: string, authUrl: string | undefined): boolean {
  if (!authUrl) return false;

  try {
    return new URL(requestUrl).origin === new URL(authUrl).origin;
  } catch {
    return false;
  }
}

export function getLocalAdminOrigin(environment: AdminEnvironment): string | null {
  const host = LOCAL_ADMIN_HOSTS[environment];
  return host ? `http://${host}` : null;
}

export function getLocalAdminCookieNamespace(environment: AdminEnvironment): string | null {
  if (environment === "local-uat") return "ccpun-uat.authjs";
  if (environment === "local-production") return "ccpun-production.authjs";
  return null;
}

export function isLocalAdminHost(host: string | null, environment: AdminEnvironment): boolean {
  return Boolean(host && LOCAL_ADMIN_HOSTS[environment] === host);
}
