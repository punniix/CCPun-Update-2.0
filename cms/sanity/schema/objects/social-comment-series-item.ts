import { defineField, defineType } from "sanity";

export const socialCommentSeriesItem = defineType({
  name: "socialCommentSeriesItem",
  title: "Social Comment Series Item",
  type: "object",
  fields: [
    defineField({
      name: "position",
      title: "ลำดับ",
      type: "number",
      validation: (Rule) => Rule.required().integer().min(1).max(20),
    }),
    defineField({
      name: "text",
      title: "ข้อความ",
      type: "text",
      rows: 4,
      validation: (Rule) => Rule.required().max(2_000),
    }),
  ],
  preview: {
    select: { title: "text", position: "position" },
    prepare: ({ title, position }) => ({ title: `${position ?? "?"} · ${title ?? ""}` }),
  },
});
