import { defineField, defineType } from "sanity";

export const masterContent = defineType({
  name: "masterContent",
  title: "Master Content (UAT)",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "หัวข้อหลัก",
      type: "string",
      validation: (Rule) => Rule.required().max(200),
    }),
    defineField({ name: "summary", title: "แก่นเนื้อหา", type: "text", rows: 4 }),
    defineField({ name: "semanticTopic", title: "Semantic Topic", type: "string" }),
    defineField({
      name: "websiteArticle",
      title: "บทความเว็บไซต์",
      type: "reference",
      to: [{ type: "article" }],
    }),
    defineField({
      name: "review",
      title: "ขั้นตรวจเนื้อหา",
      type: "reviewMetadata",
      validation: (Rule) => Rule.required(),
    }),
  ],
});
