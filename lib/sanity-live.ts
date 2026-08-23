import "server-only";

import type { ComponentType } from "react";
import { createClient } from "next-sanity";
import { defineLive } from "next-sanity/live";
import { isSanityLaneAllowed } from "@/lib/admin/environment";
import { getAdminSanityReadToken } from "@/lib/admin/sanity-credentials";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = getAdminSanityReadToken();

type LiveProps = { includeDrafts?: boolean };

const NoopLive: ComponentType<LiveProps> = () => null;

const live = projectId && dataset && isSanityLaneAllowed(dataset)
  ? defineLive({
      client: createClient({
        projectId,
        dataset,
        apiVersion: "2026-08-18",
        useCdn: true,
        stega: { enabled: false, studioUrl: "/studio" },
      }),
      serverToken: token || false,
      browserToken: false,
    })
  : null;

export const SanityLive = live?.SanityLive ?? NoopLive;

export const sanityFetch = live?.sanityFetch ?? (async () => {
  throw new Error("Sanity Live is not configured");
});
