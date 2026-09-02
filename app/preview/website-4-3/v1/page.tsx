import type { Metadata } from "next";
import Website43Preview from "@/features/website-43-preview/Website43Preview";

export const metadata: Metadata = {
  title: "Website 4.3 V1 — Full Win | CCPUN",
  description: "Private review surface for Website 4.3 V1 Full Win.",
  robots: { index: false, follow: false, nocache: true },
};

export default function Website43V1Page() {
  return <Website43Preview />;
}
