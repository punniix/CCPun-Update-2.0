import { structureTool } from "sanity/structure";
import { filterStudioStructureItems } from "../policy/studio-policy";
import type { AdminEnvironment } from "../../../lib/admin/environment";

export function createStudioStructurePlugin(environment: AdminEnvironment) {
  return structureTool({
    structure: (S) =>
      S.list().id("content").title("เนื้อหา").items(filterStudioStructureItems(S.documentTypeListItems(), environment)),
  });
}
