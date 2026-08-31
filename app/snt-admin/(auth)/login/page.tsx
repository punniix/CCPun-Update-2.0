import type { Metadata } from "next";
import AdminLoginPage from "@/features/admin/components/AdminLoginPage";

export const metadata: Metadata = {
  title: "CCPun Control Plane Login",
  robots: { index: false, follow: false, nocache: true },
};

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

export default function AdminLoginRoute({ searchParams }: LoginPageProps) {
  return <AdminLoginPage searchParams={searchParams} />;
}
