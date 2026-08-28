import { defineLocations, presentationTool } from "sanity/presentation";

export function createStudioPresentationPlugin() {
  return presentationTool({
    previewUrl: {
      initial: "/",
      previewMode: {
        enable: "/api/preview/enable",
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
  });
}
