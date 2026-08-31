import ClientPage from "@/features/home/components/ClientPage";
import AdminLoginPage from "@/features/admin/components/AdminLoginPage";
import { IS_DEPLOYED_ADMIN_APPLICATION } from "@/lib/deployment-environment";
import { faqSchema } from "@/lib/seo/structured-data/site-schema";

export default function Home() {
  if (IS_DEPLOYED_ADMIN_APPLICATION) return <AdminLoginPage />;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <ClientPage />
    </>
  );
}
