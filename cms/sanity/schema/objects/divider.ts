import { defineField, defineType } from "sanity";

export const divider = defineType({
  name: "divider",
  title: "Divider",
  type: "object",
  fields: [defineField({ name: "label", title: "Label", type: "string", hidden: true, initialValue: "divider" })],
});
