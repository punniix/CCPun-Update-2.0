import type { MetadataRoute } from "next";
import { IS_REVIEW_ENVIRONMENT } from "@/lib/deployment-environment";

const privatePaths = ["/api/", "/snt-admin/", "/studio/"];

export default function robots(): MetadataRoute.Robots {
  if (IS_REVIEW_ENVIRONMENT) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: privatePaths,
      },
    ],
    sitemap: "https://ccpun.com/sitemap.xml",
  };
}
