import type { Metadata } from "next";
import Website43PreviewV2 from "@/features/website-43-preview/Website43PreviewV2";

export const metadata: Metadata = {
  title: "Website 4.3 V2 — Decision-first | CCPUN",
  description: "Private review surface for Website 4.3 V2 Decision-first.",
  robots: { index: false, follow: false, nocache: true },
};

export default function Website43V2Page() {
  return <Website43PreviewV2 />;
}
