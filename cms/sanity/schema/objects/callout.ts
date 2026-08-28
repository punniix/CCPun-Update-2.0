import { defineField, defineType } from "sanity";

export const callout = defineType({
  name: "callout",
  title: "Callout",
  type: "object",
  fields: [
    defineField({ name: "title", title: "ชื่อบทความ", type: "string" }),
    defineField({ name: "text", title: "Text", type: "text", rows: 4, validation: (Rule) => Rule.required() }),
  ],
});
