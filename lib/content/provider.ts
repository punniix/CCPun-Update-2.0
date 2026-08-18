import { localContentProvider } from "./local";
import { hasSanityConfig, sanityContentProvider } from "./sanity";
import type { ContentProvider } from "./types";

/**
 * Content-provider boundary for Website 4.0.
 *
 * Local UAT intentionally uses an in-repo provider so UX/UI, Draft Mode,
 * sitemap rules and article rendering can be verified before any CMS account
 * is coupled to the release. The Sanity adapter will implement this same
 * interface after project/dataset configuration is approved.
 */
export function getContentProvider(): ContentProvider {
  return hasSanityConfig ? sanityContentProvider : localContentProvider;
}
