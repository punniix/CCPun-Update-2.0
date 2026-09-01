"use client";

import { useMemo, useRef, useState } from "react";
import { requestGoogleDriveMemorySession } from "@/features/admin/social/social-workspace-client";
import { isGoogleDriveAuthorizationUsable, type SocialMediaReference } from "@/features/admin/social/social-workspace-media";
import {
  copyHandoffText,
  prepareInstagramHandoffAssets,
  searchInstagramAudioOptions,
  submitInstagramHandoffMedia,
  type InstagramAudioOption,
  type InstagramHandoffAsset,
  type InstagramHandoffDriveSession,
} from "@/features/admin/social/instagram-mobile-handoff";

export function InstagramMobileHandoff(props: {
  variantId: string;
  revision: string | null;
  version: number;
  approvalRecorded: boolean;
  caption: string;
  format: string;
  mediaReferences: readonly SocialMediaReference[];
  driveOAuthClientId: string;
}) {
  const session = useRef<InstagramHandoffDriveSession | null>(null);
  const [assets, setAssets] = useState<InstagramHandoffAsset[]>([]);
  const [mediaState, setMediaState] = useState<"idle" | "running" | "ready" | "error">("idle");
  const [notice, setNotice] = useState("");
  const [audioType, setAudioType] = useState<"music" | "original_sound">("music");
  const [audioQuery, setAudioQuery] = useState("");
  const [audioState, setAudioState] = useState<"idle" | "running" | "ready" | "error">("idle");
  const [audioOptions, setAudioOptions] = useState<InstagramAudioOption[]>([]);
  const [selectedAudioId, setSelectedAudioId] = useState("");

  const orderedReferences = useMemo(
    () => [...props.mediaReferences].sort((left, right) => (left.order ?? 1) - (right.order ?? 1)),
    [props.mediaReferences],
  );
  const selectedAudio = audioOptions.find((option) => option.audioId === selectedAudioId) ?? null;

  async function driveSession() {
    if (session.current && isGoogleDriveAuthorizationUsable(session.current.authorization)) return session.current;
    session.current = await requestGoogleDriveMemorySession(props.driveOAuthClientId);
    return session.current;
  }

  async function prepareMedia() {
    setMediaState("running");
    setNotice("");
    try {
      const next = await prepareInstagramHandoffAssets({ references: orderedReferences, session: await driveSession() });
      setAssets(next);
      setMediaState("ready");
      setNotice(`ตรวจ metadata ของไฟล์ ${next.length} ไฟล์แล้ว ระบบจะตรวจ revision ที่อนุมัติซ้ำก่อนส่งไฟล์`);
    } catch {
      session.current = null;
      setAssets([]);
      setMediaState("error");
      setNotice("เปิดไฟล์ไม่ได้ กรุณาอนุญาต Google Drive ใหม่และตรวจว่าไฟล์ยังอยู่ในโฟลเดอร์ที่ระบบอนุมัติ");
    }
  }

  async function transfer(reference: SocialMediaReference, mode: "inline" | "attachment") {
    setNotice("");
    try {
      if (!props.approvalRecorded || !props.revision) throw new Error("instagram-handoff-approval-required");
      const currentSession = await driveSession();
      const asset = assets.find((item) => item.assetId === reference.assetId)
        ?? (await prepareInstagramHandoffAssets({ references: [reference], session: currentSession }))[0];
      if (!asset) throw new Error("instagram-media-required");
      submitInstagramHandoffMedia({
        asset,
        session: currentSession,
        mode,
        approvedVariant: { variantId: props.variantId, revision: props.revision, version: props.version },
      });
      setNotice(mode === "inline" ? "เปิดไฟล์ที่ตรวจแล้วในแท็บใหม่" : "เริ่มดาวน์โหลดไฟล์ที่ตรวจแล้ว");
    } catch {
      session.current = null;
      setNotice("ไฟล์หรือสิทธิ์หมดอายุ กรุณากดเตรียมไฟล์บนมือถืออีกครั้ง");
    }
  }

  async function copy(value: string, success: string) {
    try {
      await copyHandoffText(value);
      setNotice(success);
    } catch {
      setNotice("คัดลอกไม่สำเร็จ กรุณาเลือกข้อความและคัดลอกด้วยตนเอง");
    }
  }

  async function searchAudio() {
    setAudioState("running");
    setAudioOptions([]);
    setSelectedAudioId("");
    try {
      const options = await searchInstagramAudioOptions({ audioType, searchQuery: audioQuery });
      setAudioOptions(options);
      setAudioState("ready");
    } catch {
      setAudioState("error");
    }
  }

  return (
    <section id="instagram-handoff-guide" className="mt-5 border-t border-white/10 pt-5" aria-labelledby="instagram-handoff-title">
      <h3 id="instagram-handoff-title" className="font-semibold">Instagram mobile handoff</h3>
      <p className="mt-2 text-sm leading-6 text-white/70">
        คัดลอกแคปชัน เปิดหรือดาวน์โหลดสื่อที่อนุมัติแล้ว แล้วทำขั้นตอนสุดท้ายใน Instagram บนมือถือ
        ระบบนี้ไม่สร้าง Instagram Native Draft และยังไม่เปิด Direct schedule
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => copy(props.caption, "คัดลอกแคปชันแล้ว")} disabled={!props.caption.trim()}
          className="min-h-11 rounded-xl border border-white/15 px-3 py-2.5 text-sm text-white/80 hover:bg-white/5 disabled:opacity-40">
          คัดลอกแคปชัน
        </button>
        <button type="button" onClick={prepareMedia} disabled={!props.approvalRecorded || !props.revision || !props.driveOAuthClientId || !orderedReferences.length || mediaState === "running"}
          className="min-h-11 rounded-xl border border-[#e0c985]/50 px-3 py-2.5 text-sm font-semibold text-[#f4df9b] hover:bg-[#e0c985]/10 disabled:opacity-40">
          {mediaState === "running" ? "กำลังตรวจไฟล์…" : "เตรียมไฟล์บนมือถือ"}
        </button>
      </div>
      {!props.driveOAuthClientId ? <p className="mt-2 text-xs leading-5 text-amber-100/80">ยังไม่มี Google Drive OAuth client ID จึงเปิดไฟล์บนอุปกรณ์นี้ไม่ได้</p> : null}
      {!props.approvalRecorded || !props.revision ? <p className="mt-2 text-xs leading-5 text-amber-100/80">ต้องอนุมัติ revision นี้ก่อน จึงจะเปิดหรือดาวน์โหลดไฟล์ที่ผูกกับ handoff ได้</p> : null}
      {!orderedReferences.length ? <p className="mt-2 text-xs leading-5 text-amber-100/80">ยังไม่มีสื่อที่อนุมัติสำหรับ Instagram ชิ้นนี้</p> : null}

      {orderedReferences.length ? <ol className="mt-3 space-y-2">{orderedReferences.map((reference, index) => {
        const asset = assets.find((item) => item.assetId === reference.assetId);
        return <li key={`${reference.assetId}:${reference.order ?? index + 1}`} className="rounded-xl border border-white/10 p-3">
          <div className="text-xs text-white/65">ไฟล์ {index + 1} · {asset?.name ?? reference.mimeType ?? "กำลังรอตรวจ"}</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => transfer(reference, "inline")} disabled={!props.approvalRecorded || !props.revision} className="min-h-11 rounded-xl border border-white/15 px-3 py-2 text-sm text-white/80 hover:bg-white/5 disabled:opacity-40">เปิดสื่อ</button>
            <button type="button" onClick={() => transfer(reference, "attachment")} disabled={!props.approvalRecorded || !props.revision} className="min-h-11 rounded-xl border border-white/15 px-3 py-2 text-sm text-white/80 hover:bg-white/5 disabled:opacity-40">ดาวน์โหลด</button>
          </div>
        </li>;
      })}</ol> : null}

      {props.format === "reel" ? <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-4">
        <h4 className="text-sm font-semibold text-white/90">ค้นหาเพลงเพื่อเตรียมตัวเลือก</h4>
        <p className="mt-1 text-xs leading-5 text-white/60">
          เพลงที่เลือกตรงนี้เป็นข้อมูลอ้างอิงเท่านั้น Mobile handoff ไม่ส่งเพลงเข้า Instagram
          และไม่สร้าง Native Draft คุณต้องเลือกเพลงอีกครั้งในแอปก่อนโพสต์
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-[10rem_1fr_auto]">
          <select value={audioType} onChange={(event) => setAudioType(event.target.value as typeof audioType)}
            className="min-h-11 rounded-xl border border-white/15 bg-[#151a20] px-3 text-sm text-white">
            <option value="music">เพลง</option><option value="original_sound">Original sound</option>
          </select>
          <input value={audioQuery} onChange={(event) => setAudioQuery(event.target.value)} maxLength={100} placeholder="ชื่อเพลงหรือศิลปิน"
            className="min-h-11 rounded-xl border border-white/15 bg-[#151a20] px-3 text-sm text-white placeholder:text-white/35" />
          <button type="button" onClick={searchAudio} disabled={audioState === "running"}
            className="min-h-11 rounded-xl border border-white/15 px-4 text-sm text-white/80 disabled:opacity-40">
            {audioState === "running" ? "กำลังค้นหา…" : "ค้นหา"}
          </button>
        </div>
        {audioState === "error" ? <p className="mt-2 text-xs text-rose-200">ค้นหาเพลงไม่ได้ในขณะนี้ ให้เลือกเพลงโดยตรงใน Instagram</p> : null}
        {audioState === "ready" && !audioOptions.length ? <p className="mt-2 text-xs text-white/55">ไม่พบรายการที่ตรงกัน</p> : null}
        {audioOptions.length ? <label className="mt-3 block text-xs text-white/65">ตัวเลือกอ้างอิง
          <select value={selectedAudioId} onChange={(event) => setSelectedAudioId(event.target.value)}
            className="mt-1.5 min-h-11 w-full rounded-xl border border-white/15 bg-[#151a20] px-3 text-sm text-white">
            <option value="">เลือกเพลง</option>
            {audioOptions.map((option) => <option key={option.audioId} value={option.audioId}>{option.title}{option.artist ? ` — ${option.artist}` : ""}</option>)}
          </select>
        </label> : null}
        {selectedAudio ? <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/60">
          <span>เลือกไว้เป็นอ้างอิง: {selectedAudio.title}{selectedAudio.artist ? ` — ${selectedAudio.artist}` : ""}</span>
          <button type="button" onClick={() => copy([selectedAudio.title, selectedAudio.artist].filter(Boolean).join(" — "), "คัดลอกชื่อเพลงแล้ว")}
            className="min-h-11 rounded-xl border border-white/15 px-3 text-white/80">คัดลอกชื่อเพลง</button>
          {selectedAudio.previewUrl ? <a href={selectedAudio.previewUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-xl border border-white/15 px-3 text-white/80">ฟังตัวอย่างบน Instagram</a> : null}
        </div> : null}
      </div> : null}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-3 py-2.5 text-sm text-white/80">เปิด Instagram</a>
        <a href="https://business.facebook.com/latest/home" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-3 py-2.5 text-sm text-white/80">เปิด Meta Business Suite</a>
      </div>
      {notice ? <p role="status" className="mt-3 text-xs leading-5 text-[#9ef0ce]">{notice}</p> : null}
    </section>
  );
}
