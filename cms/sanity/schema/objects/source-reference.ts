import { defineField, defineType } from "sanity";

export const sourceReference = defineType({
  name: "sourceReference",
  title: "Source / reference",
  type: "object",
  fields: [
    defineField({ name: "label", title: "Label", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "url", title: "URL", type: "url", validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }) }),
    defineField({ name: "publisher", title: "Publisher", type: "string" }),
    defineField({ name: "accessedAt", title: "Accessed date", type: "date" }),
  ],
});
