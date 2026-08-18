"use client";

import { defineConfig } from "sanity";
import { defineLocations, presentationTool } from "sanity/presentation";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./cms/sanity/schema";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

export const sanityStudioConfig =
  projectId && dataset
    ? defineConfig({
        name: "ccpun-website-v4-uat",
        title: "CCPun Website 4.0 UAT",
        basePath: "/studio",
        projectId,
        dataset,
        plugins: [
          structureTool(),
          presentationTool({
            previewUrl: { previewMode: { enable: "/api/preview/enable" } },
            resolve: {
              locations: {
                article: defineLocations({
                  select: { title: "title", slug: "slug.current" },
                  resolve: (document) => ({
                    locations: document?.slug
                      ? [
                          { title: document.title || "Untitled article", href: `/blog/${document.slug}/` },
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
      })
    : null;

export default sanityStudioConfig;
