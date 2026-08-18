import { getConsentData } from './cookie-consent';

const STORAGE_KEY = 'ccpun_ci_first_touch_v1';
const TOKEN = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const HOST = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const UTM_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
  traffic_source: string;
}

function token(value: string | null): string | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized && TOKEN.test(normalized) ? normalized : undefined;
}

function parseStoredAttribution(value: string): Attribution | null {
  const parsed = JSON.parse(value) as Record<string, unknown>;
  const trafficSource = typeof parsed.traffic_source === 'string' ? token(parsed.traffic_source) : undefined;
  if (!trafficSource) return null;

  const attribution: Attribution = { traffic_source: trafficSource };
  for (const field of UTM_FIELDS) {
    const storedValue = typeof parsed[field] === 'string' ? token(parsed[field]) : undefined;
    if (storedValue) attribution[field] = storedValue;
  }
  if (typeof parsed.referrer === 'string' && HOST.test(parsed.referrer)) attribution.referrer = parsed.referrer;
  return attribution;
}

/** First touch wins for this browser session; acquisition storage starts only after analytics consent. */
export function getAttribution(): Attribution | null {
  if (typeof window === 'undefined' || getConsentData()?.analytics !== true) return null;
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const attribution = parseStoredAttribution(stored);
      if (attribution) {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
        return attribution;
      }
    }
    const search = new URLSearchParams(window.location.search);
    const attribution: Attribution = { traffic_source: 'direct' };
    for (const field of UTM_FIELDS) {
      const value = token(search.get(field));
      if (value) attribution[field] = value;
    }
    let referrer: string | undefined;
    try {
      referrer = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : undefined;
    } catch { /* invalid referrer is ignored */ }
    if (referrer && HOST.test(referrer)) attribution.referrer = referrer;
    const fromSearch = Boolean(referrer && ['google.com', 'bing.com', 'duckduckgo.com', 'yahoo.com'].some((host) => referrer === host || referrer.endsWith(`.${host}`)));
    attribution.traffic_source = attribution.utm_source ?? (fromSearch ? 'organic' : referrer ? 'referral' : 'direct');
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
    return attribution;
  } catch {
    return null;
  }
}

export function getGAAttribution(): Attribution {
  const attribution = getAttribution();
  if (!attribution) return { traffic_source: 'direct' };
  return {
    utm_source: attribution.utm_source,
    utm_medium: attribution.utm_medium,
    utm_campaign: attribution.utm_campaign,
    utm_content: attribution.utm_content,
    utm_term: attribution.utm_term,
    traffic_source: attribution.traffic_source,
    referrer: attribution.referrer,
  };
}

export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' | 'unknown' {
  if (typeof navigator === 'undefined') return 'unknown';
  const userAgent = navigator.userAgent.toLowerCase();
  if (/ipad|tablet/.test(userAgent)) return 'tablet';
  if (/mobi|android|iphone|ipod/.test(userAgent)) return 'mobile';
  return userAgent ? 'desktop' : 'unknown';
}
