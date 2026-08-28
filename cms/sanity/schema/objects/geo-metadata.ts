import { defineArrayMember, defineField, defineType } from "sanity";

export const geoMetadata = defineType({
  name: "geoMetadata",
  title: "GEO metadata",
  type: "object",
  fields: [
    defineField({ name: "summary", title: "Summary", type: "text", rows: 3 }),
    defineField({ name: "keyEntities", title: "Key entities", type: "array", of: [defineArrayMember({ type: "string" })] }),
    defineField({ name: "keyQuestions", title: "Key questions", type: "array", of: [defineArrayMember({ type: "string" })] }),
    defineField({ name: "reviewedAt", title: "Reviewed at", type: "datetime" }),
  ],
});
