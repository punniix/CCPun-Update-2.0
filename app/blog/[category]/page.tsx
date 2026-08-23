import { draftMode } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { getContentProvider } from "@/lib/content/provider";
import { getArticlePath, getLegacyCategoryRedirectPath } from "@/lib/content/url";

export default async function LegacyArticleRedirect({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const legacyCategoryRedirect = getLegacyCategoryRedirectPath(slug);
  if (legacyCategoryRedirect) permanentRedirect(legacyCategoryRedirect);
  const { isEnabled } = await draftMode();
  const article = await getContentProvider().getArticleBySlug(slug, { includeDrafts: isEnabled });
  if (!article) notFound();
  permanentRedirect(getArticlePath(article));
}
