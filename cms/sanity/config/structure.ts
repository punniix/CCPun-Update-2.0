import { structureTool } from "sanity/structure";
import { filterStudioStructureItems } from "../policy/studio-policy";

export function createStudioStructurePlugin() {
  return structureTool({
    structure: (S) =>
      S.list().id("content").title("เนื้อหา").items(filterStudioStructureItems(S.documentTypeListItems())),
  });
}
