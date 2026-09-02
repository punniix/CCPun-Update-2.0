import type { Metadata } from "next";
import Website43Preview from "@/features/website-43-preview/Website43Preview";

export const metadata: Metadata = {
  title: "Website 4.3 Preview | CCPUN",
  description: "Private review surface for the CCPUN Website 4.3 Full Win UX iteration.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function Website43PreviewPage() {
  return <Website43Preview />;
}
