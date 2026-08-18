'use client';

export default function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event('ccpun:openCookieSettings'))}
      className="inline-flex min-h-11 items-center text-[13px] text-muted-foreground hover:text-primary transition-colors"
    >
      ตั้งค่าคุกกี้
    </button>
  );
}
