"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminDataLaneLabel, friendlyApiErrorFromPayload } from "@/lib/admin/presentation";

export default function GenerateSeoSuggestionsButton({ articleId }: { articleId: string }) {
  const laneLabel = adminDataLaneLabel();
  const router = useRouter();
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function generate() {
    if (state === "running") return;
    if (!window.confirm(
      `สร้างข้อเสนอ Search Intent, SEO Title และ Meta Description จากหลักฐานของบทความนี้ใน ${laneLabel} หรือไม่? ระบบจะส่งข้อเสนอไปหน้ารอตรวจ และจะไม่แก้หรือเผยแพร่บทความเอง`,
    )) return;

    setState("running");
    setErrorMessage("");
    try {
      const response = await fetch(`/api/snt-admin/seo/audit/${encodeURIComponent(articleId)}/proposals/`, { method: "POST" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(friendlyApiErrorFromPayload(payload));
        setState("error");
        return;
      }
      setState("done");
      router.push("/snt-admin/reviews/");
      router.refresh();
    } catch {
      setErrorMessage(friendlyApiErrorFromPayload(null));
      setState("error");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={generate}
        disabled={state === "running"}
        className="min-h-11 rounded-xl border border-[#e0c985]/30 bg-[#e0c985]/10 px-4 py-2.5 text-sm font-semibold text-[#f4df9b] transition hover:bg-[#e0c985]/15 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {state === "running" ? "กำลังวิเคราะห์หลักฐาน…" : state === "done" ? "สร้างข้อเสนอแล้ว" : state === "error" ? "ลองสร้างอีกครั้ง" : "สร้างข้อเสนอ SEO ด้วย AI"}
      </button>
      {state === "error" ? <p role="alert" className="mt-2 max-w-md text-sm leading-6 text-red-200">{errorMessage}</p> : null}
      <span role="status" aria-live="polite" className="sr-only">
        {state === "running"
          ? `กำลังสร้างข้อเสนอ SEO ใน ${laneLabel}`
          : state === "done"
            ? "สร้างข้อเสนอแล้ว กำลังเปิดหน้ารอตรวจ"
            : state === "error"
              ? errorMessage
              : ""}
      </span>
    </>
  );
}
