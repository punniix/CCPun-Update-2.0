import type { MetadataRoute } from "next";
import { IS_REVIEW_ENVIRONMENT } from "@/lib/deployment-environment";

const nonContentPaths = ["/api/", "/studio/"];

export default function robots(): MetadataRoute.Robots {
  if (IS_REVIEW_ENVIRONMENT) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: ["Googlebot", "Bingbot", "Twitterbot", "facebookexternalhit"],
        allow: "/",
        disallow: nonContentPaths,
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "PerplexityBot",
          "ClaudeBot",
          "Claude-Web",
          "anthropic-ai",
          "Google-Extended",
          "Bytespider",
          "CCBot",
        ],
        allow: "/",
        disallow: nonContentPaths,
      },
      { userAgent: "*", allow: "/", disallow: nonContentPaths },
    ],
    sitemap: "https://ccpun.com/sitemap.xml",
  };
}
