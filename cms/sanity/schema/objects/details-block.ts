import { defineField, defineType } from "sanity";

export const detailsBlock = defineType({
  name: "detailsBlock",
  title: "เนื้อหาเปิด–ปิด",
  type: "object",
  fields: [
    defineField({ name: "summary", title: "หัวข้อ", type: "string", validation: (Rule) => Rule.required().max(160) }),
    defineField({ name: "text", title: "เนื้อหา", type: "text", rows: 5, validation: (Rule) => Rule.required() }),
  ],
});
