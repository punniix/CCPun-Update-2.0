"use client";

import { defineConfig } from "sanity";
import { defineLocations, presentationTool } from "sanity/presentation";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./cms/sanity/schema";
import {
  filterStudioAuthProviders,
  filterStudioDocumentActions,
  filterStudioNewDocumentOptions,
  filterStudioStructureItems,
  getStudioPublishingOptions,
  protectProductionContentLifecycleActions,
} from "./cms/sanity/studio-policy";
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
          structureTool({
            structure: (S) =>
              S.list().id("content").title("เนื้อหา").items(filterStudioStructureItems(S.documentTypeListItems())),
          }),
          presentationTool({
            previewUrl: {
              initial: "/",
              previewMode: {
                enable: "/api/preview/enable",
                disable: "/api/preview/disable",
              },
            },
            resolve: {
              locations: {
                article: defineLocations({
                  select: { title: "title", slug: "slug.current", categorySlug: "category.slug.current" },
                  resolve: (document) => ({
                    locations: document?.slug
                      ? [
                          { title: document.title || "Untitled article", href: `/blog/${document.categorySlug || "personal-finance"}/${document.slug}/` },
                          { title: "Blog hub", href: "/blog/" },
                        ]
                      : [{ title: "Blog hub", href: "/blog/" }],
                  }),
                }),
              },
            },
          }),
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
