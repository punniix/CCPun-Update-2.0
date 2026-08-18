import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { NextResponse } from "next/server";
import { IS_REVIEW_ENVIRONMENT } from "@/lib/deployment-environment";
import { getSanityPreviewClient, hasSanityConfig } from "@/lib/content/sanity";

export const dynamic = "force-dynamic";

const enabledHandler =
  IS_REVIEW_ENVIRONMENT && hasSanityConfig && process.env.SANITY_API_READ_TOKEN
    ? defineEnableDraftMode({ client: getSanityPreviewClient() }).GET
    : null;

export async function GET(request: Request) {
  if (!enabledHandler) return new NextResponse("Not Found", { status: 404 });
  try {
    return await enabledHandler(request);
  } catch (error) {
    const digest = typeof error === "object" && error && "digest" in error ? String(error.digest) : "";
    if (digest.startsWith("NEXT_REDIRECT")) throw error;
    return new NextResponse("Preview unavailable", { status: 503 });
  }
}
