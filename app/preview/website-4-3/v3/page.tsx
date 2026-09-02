import type { Metadata } from "next";
import Website43PreviewV3 from "@/features/website-43-preview/Website43PreviewV3";

export const metadata: Metadata = {
  title: "Website 4.3 V3 — Refined | CCPUN",
  description: "Private review surface for Website 4.3 V3 refined trust-first direction.",
  robots: { index: false, follow: false, nocache: true },
};

export default function Website43V3Page() {
  return <Website43PreviewV3 />;
}
