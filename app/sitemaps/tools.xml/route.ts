import { renderUrlSet, xmlResponse } from "@/lib/sitemap/xml";

export const dynamic = "force-static";

export function GET() {
  return xmlResponse(
    renderUrlSet([
      { loc: "https://ccpun.com/ci-planning/", lastmod: "2026-08-18" },
      { loc: "https://ccpun.com/tools/financial-health-check/", lastmod: "2026-08-18" },
    ]),
  );
}
