"use client";

import { defineConfig } from "sanity";
import { schemaTypes } from "./cms/sanity/schema";
import { createStudioPresentationPlugin } from "./cms/sanity/config/presentation";
import { getStudioPublishingOptions } from "./cms/sanity/config/publishing";
import { createStudioStructurePlugin } from "./cms/sanity/config/structure";
import {
  filterStudioAuthProviders,
  filterStudioDocumentActions,
  filterStudioNewDocumentOptions,
  protectProductionContentLifecycleActions,
} from "./cms/sanity/policy/studio-policy";
import { isStudioDataPlaneAllowed, resolveSanityConfigEnvironment } from "./lib/admin/environment";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET;
const environment = resolveSanityConfigEnvironment(
  process.env.NEXT_PUBLIC_CCPUN_APP_ENV,
  process.env.CCPUN_APP_ENV,
  typeof process !== "undefined" && process.release?.name === "node",
);
const isProductionCms = dataset === "production";
const studioName = isProductionCms ? "ccpun-website-production-cms" : "ccpun-website-uat-cms";
const studioTitle = isProductionCms ? "CCPun Website Production CMS" : "CCPun Website UAT CMS";

export const sanityStudioConfig =
  projectId && dataset && isStudioDataPlaneAllowed(dataset, environment, undefined, undefined, projectId)
    ? defineConfig({
        name: studioName,
        title: studioTitle,
        basePath: "/studio",
        projectId,
        dataset,
        auth: {
          providers: (providers) => filterStudioAuthProviders(providers, dataset, environment, projectId),
          redirectOnSingle: true,
        },
        ...getStudioPublishingOptions(dataset, environment, projectId),
        plugins: [
          createStudioStructurePlugin(),
          createStudioPresentationPlugin(),
        ],
        schema: { types: schemaTypes },
        document: {
          actions: (previousActions, context) =>
            protectProductionContentLifecycleActions(
              filterStudioDocumentActions(previousActions, context.dataset, environment, context.schemaType, projectId),
              environment,
              context.schemaType,
            ),
          newDocumentOptions: (previousOptions) => filterStudioNewDocumentOptions(previousOptions, dataset, environment, projectId),
        },
      })
    : null;

export default sanityStudioConfig;
