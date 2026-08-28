import { defineArrayMember, defineField, defineType } from "sanity";

export const migrationSource = defineType({
  name: "migrationSource",
  title: "Migration source",
  type: "object",
  fields: [
    defineField({ name: "platform", title: "Platform", type: "string", readOnly: true }),
    defineField({ name: "sourceId", title: "Source ID", type: "number", readOnly: true }),
    defineField({ name: "sourceStatus", title: "Source status", type: "string", readOnly: true }),
    defineField({ name: "sourceRevision", title: "Source revision", type: "string", readOnly: true }),
    defineField({ name: "disposition", title: "Migration disposition", type: "string", readOnly: true }),
    defineField({ name: "sourceCreatedAt", title: "Source created at", type: "datetime", readOnly: true }),
    defineField({ name: "sourceModifiedAt", title: "Source modified at", type: "datetime", readOnly: true }),
    defineField({ name: "importedAt", title: "Imported at", type: "datetime", readOnly: true }),
    defineField({ name: "sourceHtml", title: "Original WordPress body", type: "text", rows: 12, readOnly: true }),
    defineField({ name: "sourceExcerptHtml", title: "Original WordPress excerpt", type: "text", rows: 4, readOnly: true }),
    defineField({ name: "sourceCategories", title: "Original categories", type: "array", of: [defineArrayMember({ type: "string" })], readOnly: true }),
    defineField({ name: "sourceTags", title: "Original tags", type: "array", of: [defineArrayMember({ type: "string" })], readOnly: true }),
    defineField({ name: "rankMathTitle", title: "Original Rank Math title", type: "string", readOnly: true }),
    defineField({ name: "rankMathDescription", title: "Original Rank Math description", type: "text", rows: 3, readOnly: true }),
    defineField({ name: "rankMathFocusKeyword", title: "Original Rank Math focus keyword", type: "string", readOnly: true }),
    defineField({ name: "rankMathCanonical", title: "Original Rank Math canonical", type: "url", readOnly: true }),
    defineField({ name: "rankMathRobots", title: "Original Rank Math robots", type: "string", readOnly: true }),
    defineField({ name: "featuredImageUrl", title: "Original featured image URL", type: "url", readOnly: true }),
    defineField({ name: "featuredImageAlt", title: "Original featured image alt", type: "string", readOnly: true }),
    defineField({ name: "featuredImageCaption", title: "Original featured image caption", type: "text", rows: 3, readOnly: true }),
  ],
});
