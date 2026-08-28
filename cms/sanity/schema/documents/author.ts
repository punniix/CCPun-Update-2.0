import { defineArrayMember, defineField, defineType } from "sanity";

export const author = defineType({
  name: "author",
  title: "Author",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Name", type: "string", validation: (Rule) => Rule.required() }),
    defineField({
      name: "slug",
      title: "URL Slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "bio", title: "Bio", type: "text", rows: 4 }),
    defineField({ name: "credentials", title: "Credentials", type: "array", of: [defineArrayMember({ type: "string" })] }),
    defineField({
      name: "sameAs",
      title: "Profile URLs",
      type: "array",
      of: [defineArrayMember({ type: "url", validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }) })],
    }),
  ],
  preview: { select: { title: "name", subtitle: "slug.current" } },
});
