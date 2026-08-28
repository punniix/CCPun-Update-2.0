import ClientPage from "@/features/home/components/ClientPage";
import { faqSchema } from "@/lib/seo/structured-data/site-schema";

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <ClientPage />
    </>
  );
}
