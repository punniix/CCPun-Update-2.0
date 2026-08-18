import { renderUrlSet, xmlResponse } from "@/lib/sitemap/xml";

export const dynamic = "force-static";

export function GET() {
  return xmlResponse(
    renderUrlSet([
      { loc: "https://ccpun.com/", lastmod: "2026-08-18" },
      { loc: "https://ccpun.com/blog/", lastmod: "2026-08-18" },
      { loc: "https://ccpun.com/privacy/", lastmod: "2026-08-17" },
      { loc: "https://ccpun.com/cookie-policy/", lastmod: "2026-08-17" },
    ]),
  );
}
