import type { Metadata } from "next";
import Website43FigmaAudit from "@/features/website-43-preview/Website43FigmaAudit";

export const metadata: Metadata = {
  title: "Website 4.3 UAT | CCPUN",
  description: "Latest audited Website 4.3 UAT for CCPUN.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function Website43UATPage() {
  return <Website43FigmaAudit />;
}
