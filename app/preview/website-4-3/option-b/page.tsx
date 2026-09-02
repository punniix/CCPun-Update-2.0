import type { Metadata } from "next";
import Website43OptionB from "@/features/website-43-preview/Website43OptionB";

export const metadata: Metadata = {
  title: "Website 4.3 Option B Preview | CCPUN",
  description: "Private premium editorial preview for CCPUN Website 4.3 Option B.",
  robots: { index: false, follow: false, nocache: true },
};

export default function Website43OptionBPage() {
  return <Website43OptionB />;
}
