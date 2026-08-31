import {
  getGoogleDrivePickerPublicConfig,
  getMediaStorageProviderState,
  mediaLibrarySnapshotSchema,
  SYNTHETIC_MEDIA_LIBRARY,
} from "@/lib/admin/media/foundation";
import GoogleDrivePickerPanel from "./GoogleDrivePickerPanel";

const kindLabel = {
  image: "รูปภาพ",
  video: "วิดีโอ",
  caption: "คำบรรยาย",
} as const;

const lifecycleLabel = {
  registered: "ลงทะเบียน metadata แล้ว",
  ready: "พร้อมนำไปใช้",
  archived: "เก็บถาวร",
} as const;

function formatBytes(byteSize: number) {
  if (byteSize >= 1_000_000) return `${(byteSize / 1_000_000).toFixed(1)} MB`;
  return `${Math.ceil(byteSize / 1_000)} KB`;
}

export default function MediaLibraryUatSection() {
  const snapshot = mediaLibrarySnapshotSchema.parse(SYNTHETIC_MEDIA_LIBRARY);
  const storage = getMediaStorageProviderState();
  const drivePickerConfig = getGoogleDrivePickerPublicConfig();

  return (
    <section aria-labelledby="media-library-title">
      <p className="text-xs font-semibold tracking-[0.12em] text-[#e0c985]">WEBSITE 4.2 · PHASE 2 · SYNTHETIC UAT</p>
      <h1 id="media-library-title" className="mt-2 text-3xl font-semibold">Media Library + Direct Upload Foundation</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
        หน้านี้ตรวจ asset metadata และ upload intent เท่านั้น Browser จะอัปโหลดตรงไปยัง storage provider เมื่อมี provider ที่ผ่านการอนุมัติ โดยไฟล์ขนาดใหญ่จะไม่ผ่าน Next.js
      </p>

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="text-sm text-white/60">Storage provider</div>
          <div className="mt-2 font-semibold text-amber-200">{storage.status === "not-connected" ? "ยังไม่เชื่อม" : storage.status}</div>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="text-sm text-white/60">รูปแบบอัปโหลด</div>
          <div className="mt-2 font-semibold">Direct upload เท่านั้น</div>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="text-sm text-white/60">การอัปโหลดจริง</div>
          <div className="mt-2 font-semibold text-amber-200">ปิดอยู่</div>
        </article>
      </div>

      <section aria-labelledby="drive-selected-file-title" className="mt-6 rounded-3xl border border-[#e0c985]/20 bg-[#e0c985]/[0.045] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold tracking-[0.1em] text-[#e0c985]">GOOGLE DRIVE · SELECTED FILE ONLY</div>
            <h2 id="drive-selected-file-title" className="mt-2 text-xl font-semibold">ไฟล์ที่เจ้าของเลือกจาก Drive</h2>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Projection รองรับ metadata, ลิงก์เปิดไฟล์ และ preview ที่ Drive ส่งให้เท่านั้น ระบบไม่อ่านเนื้อหา ดาวน์โหลดไฟล์ หรือเก็บ token
            </p>
          </div>
          <span className="rounded-full border border-amber-200/20 bg-amber-200/[0.06] px-3 py-1 text-xs text-amber-100">
            {drivePickerConfig ? "Manual OAuth / Picker พร้อม" : "รอ Manual OAuth / Picker"}
          </span>
        </div>
        <GoogleDrivePickerPanel config={drivePickerConfig} />
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {snapshot.assets.map((asset) => (
          <article key={asset.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold tracking-wide text-[#e0c985]">{kindLabel[asset.kind]}</div>
                <h2 className="mt-2 break-all font-semibold text-white/90">{asset.originalFilename}</h2>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/65">{lifecycleLabel[asset.lifecycleState]}</span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-white/55">ชนิดไฟล์</dt><dd className="mt-1 text-white/75">{asset.mimeType}</dd></div>
              <div><dt className="text-white/55">ขนาด</dt><dd className="mt-1 text-white/75">{formatBytes(asset.byteSize)}</dd></div>
              <div><dt className="text-white/55">มิติ</dt><dd className="mt-1 text-white/75">{asset.widthPx} × {asset.heightPx}</dd></div>
              <div><dt className="text-white/55">สถานะ session</dt><dd className="mt-1 text-white/75">{snapshot.uploadSessions.find((session) => session.assetId === asset.id)?.status ?? "ยังไม่สร้าง"}</dd></div>
            </dl>
          </article>
        ))}
      </div>

      <div role="note" className="mt-6 rounded-3xl border border-amber-200/20 bg-amber-200/[0.05] p-5 text-sm leading-6 text-amber-50/80">
        ระบบจะไม่ออก signed upload URL จนกว่าจะเลือก provider, อนุมัติค่าใช้จ่าย, ตั้งค่า UAT secret และผ่าน security review การกดหรือส่งไฟล์จริงยังไม่มีใน Phase 2 foundation นี้
      </div>
    </section>
  );
}
