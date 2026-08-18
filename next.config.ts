import type { NextConfig } from "next";
import { IS_REVIEW_ENVIRONMENT } from "./lib/deployment-environment";
import { SECURITY_HEADERS } from "./lib/security-policy";

const REVIEW_HEADERS = IS_REVIEW_ENVIRONMENT
  ? [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }]
  : [];

const nextConfig: NextConfig = {
  trailingSlash: true,
  compress: true,
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-slot",
      "@radix-ui/react-toast",
      "class-variance-authority",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
    deviceSizes: [640, 768, 1080, 1280, 1920],
    imageSizes: [16, 32, 64, 128, 256],
  },
  async redirects() {
    return [
      {
        source: "/living-benefits/:path*",
        destination: "/ci-planning/",
        permanent: true,
      },
      {
        source: "/tools/fhc/:path*",
        destination: "/tools/financial-health-check/",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...SECURITY_HEADERS, ...REVIEW_HEADERS],
      },
    ];
  },
};

export default nextConfig;
