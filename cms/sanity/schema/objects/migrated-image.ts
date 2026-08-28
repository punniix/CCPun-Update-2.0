import { defineField, defineType } from "sanity";

export const migratedImage = defineType({
  name: "migratedImage",
  title: "Migrated image",
  type: "object",
  fields: [
    defineField({ name: "src", title: "Source path", type: "string", readOnly: true, validation: (Rule) => Rule.required() }),
    defineField({ name: "alt", title: "Alt text", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "width", title: "Width", type: "number", readOnly: true, validation: (Rule) => Rule.required().positive() }),
    defineField({ name: "height", title: "Height", type: "number", readOnly: true, validation: (Rule) => Rule.required().positive() }),
    defineField({ name: "caption", title: "Caption", type: "string" }),
  ],
});
