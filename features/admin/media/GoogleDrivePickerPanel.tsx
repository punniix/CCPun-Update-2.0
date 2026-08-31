"use client";

import Script from "next/script";
import { useRef, useState } from "react";

const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";

type PickerConfig = { apiKey: string; appId: string; clientId: string };
type DriveAuthorization = {
  scope: typeof DRIVE_FILE_SCOPE;
  mode: "owner-interactive";
  tokenPersistence: "memory-only";
  refreshTokenPersistence: "forbidden";
  issuedAtMs: number;
  expiresAtMs: number;
};
type TokenResponse = { access_token?: string; expires_in?: number | string; scope?: string; error?: string };
type DriveItem = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink: string | null;
  thumbnailLink: string | null;
  iconLink: string | null;
};

interface PickerView {
  setIncludeFolders(value: boolean): this;
  setMode(value: string): this;
  setSelectFolderEnabled(value: boolean): this;
}

interface PickerBuilder {
  addView(view: PickerView): this;
  setAppId(value: string): this;
  setCallback(callback: (data: { action?: string; docs?: Array<{ id?: string }> }) => void): this;
  setDeveloperKey(value: string): this;
  setOAuthToken(value: string): this;
  build(): { setVisible(value: boolean): void };
}

declare global {
  interface Window {
    gapi?: { load(name: string, callback: () => void): void };
    google?: {
      accounts?: { oauth2?: { initTokenClient(config: {
        client_id: string;
        scope: string;
        include_granted_scopes: boolean;
        callback: (response: TokenResponse) => void;
        error_callback: () => void;
      }): { requestAccessToken(options: { prompt: string }): void } } };
      picker?: {
        Action: { PICKED: string };
        DocsViewMode: { LIST: string };
        ViewId: { DOCS: string };
        DocsView: new (viewId: string) => PickerView;
        PickerBuilder: new () => PickerBuilder;
      };
    };
  }
}

export function parseDriveTokenResponse(response: TokenResponse, nowMs: number) {
  const scopes = response.scope?.split(/\s+/u).filter(Boolean) ?? [];
  const expiresInSeconds = Number(response.expires_in);
  if (
    !response.access_token || response.access_token.length > 8_192 || response.error || scopes.length !== 1 || scopes[0] !== DRIVE_FILE_SCOPE ||
    !Number.isSafeInteger(nowMs) || nowMs < 0 || !Number.isFinite(expiresInSeconds) ||
    expiresInSeconds <= 0 || expiresInSeconds > 3_600
  ) return null;

  return {
    accessToken: response.access_token,
    authorization: {
      scope: DRIVE_FILE_SCOPE,
      mode: "owner-interactive",
      tokenPersistence: "memory-only",
      refreshTokenPersistence: "forbidden",
      issuedAtMs: nowMs,
      expiresAtMs: nowMs + Math.floor(expiresInSeconds * 1_000),
    } satisfies DriveAuthorization,
  };
}

function isDriveItem(value: unknown): value is DriveItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<DriveItem>;
  return typeof item.id === "string" && typeof item.name === "string" &&
    typeof item.mimeType === "string" && typeof item.modifiedTime === "string";
}

export default function GoogleDrivePickerPanel({ config }: { config: PickerConfig | null }) {
  const [identityReady, setIdentityReady] = useState(false);
  const [pickerReady, setPickerReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<DriveItem | null>(null);
  const accessToken = useRef("");
  const authorization = useRef<DriveAuthorization | null>(null);

  function clearAuthorization() {
    accessToken.current = "";
    authorization.current = null;
  }

  async function projectSelectedFile(fileId: string) {
    try {
      const response = await fetch("/api/snt-admin/media/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedFileId: fileId, accessToken: accessToken.current, authorization: authorization.current }),
      });
      const body = await response.json().catch(() => null) as { item?: unknown; error?: string } | null;
      if (!response.ok || !isDriveItem(body?.item)) throw new Error(body?.error ?? "อ่าน metadata ไม่สำเร็จ");
      setItem(body.item);
    } catch {
      setError("อ่านไฟล์ไม่ได้ กรุณาตรวจว่าไฟล์อยู่ในโฟลเดอร์ที่อนุมัติและลองใหม่");
    } finally {
      clearAuthorization();
      setBusy(false);
    }
  }

  function openPicker(token: string) {
    const picker = window.google?.picker;
    if (!picker) {
      clearAuthorization();
      setBusy(false);
      setError("Google Picker ยังโหลดไม่สำเร็จ");
      return;
    }
    const view = new picker.DocsView(picker.ViewId.DOCS)
      .setIncludeFolders(true)
      .setMode(picker.DocsViewMode.LIST)
      .setSelectFolderEnabled(false);
    new picker.PickerBuilder()
      .addView(view)
      .setAppId(config!.appId)
      .setOAuthToken(token)
      .setDeveloperKey(config!.apiKey)
      .setCallback((data) => {
        const fileId = data.action === picker.Action.PICKED ? data.docs?.[0]?.id : null;
        if (fileId) void projectSelectedFile(fileId);
        else {
          clearAuthorization();
          setBusy(false);
        }
      })
      .build()
      .setVisible(true);
  }

  function authorizeAndPick() {
    const oauth = window.google?.accounts?.oauth2;
    if (!config || !identityReady || !pickerReady || !oauth) return;
    setBusy(true);
    setError(null);
    oauth.initTokenClient({
      client_id: config.clientId,
      scope: DRIVE_FILE_SCOPE,
      include_granted_scopes: false,
      callback: (response) => {
        const parsed = parseDriveTokenResponse(response, Date.now());
        if (!parsed) {
          clearAuthorization();
          setBusy(false);
          setError("Google ไม่ได้อนุญาตสิทธิ์ drive.file แบบที่ระบบกำหนด");
          return;
        }
        accessToken.current = parsed.accessToken;
        authorization.current = parsed.authorization;
        openPicker(parsed.accessToken);
      },
      error_callback: () => {
        clearAuthorization();
        setBusy(false);
        setError("ยกเลิกหรือเปิดหน้าต่าง Google ไม่สำเร็จ");
      },
    }).requestAccessToken({ prompt: "consent" });
  }

  const ready = Boolean(config && identityReady && pickerReady);
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-black/10 p-4">
      {config ? (
        <>
          <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setIdentityReady(true)} />
          <Script src="https://apis.google.com/js/api.js" strategy="afterInteractive" onLoad={() => window.gapi?.load("picker", () => setPickerReady(true))} />
        </>
      ) : null}
      <div className="text-sm font-medium text-white/80">{item ? item.name : "ยังไม่ได้เลือกไฟล์"}</div>
      <p role="status" className="mt-2 text-sm leading-6 text-white/60">
        {config ? "เลือกไฟล์ที่อยู่ภายในโฟลเดอร์ CCPun ที่อนุมัติ ระบบอ่านเฉพาะ metadata และไม่เก็บ token" : "รอตั้งค่า Google Picker สำหรับ Preview branch นี้"}
      </p>
      <button type="button" disabled={!ready || busy} onClick={authorizeAndPick} className="mt-4 min-h-11 rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 disabled:cursor-not-allowed disabled:opacity-40">
        {busy ? "กำลังเปิด Google Drive…" : item ? "เลือกใหม่ / Refresh metadata" : "เลือกไฟล์จาก Google Drive"}
      </button>
      {error ? <p role="alert" className="mt-3 text-sm text-rose-200">{error}</p> : null}
      {item ? (
        <article className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          {/* Drive supplies an arbitrary short-lived thumbnail URL, so Next Image cannot safely preconfigure its host. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {item.thumbnailLink ? <img src={item.thumbnailLink} alt={`ตัวอย่าง ${item.name}`} referrerPolicy="no-referrer" className="mb-4 max-h-52 rounded-xl object-contain" /> : null}
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-white/45">ชนิดไฟล์</dt><dd className="mt-1 text-white/75">{item.mimeType}</dd></div>
            <div><dt className="text-white/45">แก้ไขล่าสุด</dt><dd className="mt-1 text-white/75">{new Date(item.modifiedTime).toLocaleString("th-TH")}</dd></div>
          </dl>
          {item.webViewLink ? <a href={item.webViewLink} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[#e0c985]">เปิดไฟล์ใน Google Drive</a> : null}
        </article>
      ) : null}
    </div>
  );
}
