const STORAGE_KEY = 'ccpun_cookie_consent';
const CONSENT_DURATION_MS = 365 * 24 * 60 * 60 * 1000;

export type ConsentStatus = 'accepted_all' | 'custom' | null;

export interface ConsentData {
  status: ConsentStatus;
  essential: boolean;
  performance: boolean;
  analytics: boolean;
  social: boolean;
  timestamp: string;
  expires: number;
}

export function getConsentData(): ConsentData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentData;
    if (Date.now() > parsed.expires) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function isAnalyticsEnabled(): boolean {
  const data = getConsentData();
  if (!data) return false;
  if (data.status === 'accepted_all') return true;
  return data.analytics === true;
}

export function getConsentStatus(): 'accepted' | 'rejected' | null {
  const data = getConsentData();
  if (!data) return null;
  return isAnalyticsEnabled() ? 'accepted' : 'rejected';
}

export function saveConsent(data: Omit<ConsentData, 'expires'>) {
  const full: ConsentData = {
    ...data,
    expires: Date.now() + CONSENT_DURATION_MS,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
}
