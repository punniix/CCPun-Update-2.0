import { notFound } from "next/navigation";
import { NextStudio, metadata, viewport } from "next-sanity/studio";
import { IS_REVIEW_ENVIRONMENT } from "@/lib/deployment-environment";
import { sanityStudioConfig } from "../../../sanity.config";

export const dynamic = "force-static";
export { metadata, viewport };

export default function StudioPage() {
  if (!IS_REVIEW_ENVIRONMENT) notFound();
  if (!sanityStudioConfig) {
    return (
      <main style={{ minHeight: "100vh", padding: "3rem", fontFamily: "system-ui", background: "#251818", color: "#faf9f9" }}>
        <h1>Sanity Studio is not configured</h1>
        <p>Set the public Sanity project and dataset variables for this UAT environment.</p>
      </main>
    );
  }

  return <NextStudio config={sanityStudioConfig} />;
}
