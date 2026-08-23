import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, isAdminAuthConfigured, signIn } from "@/auth";
import { getEnvironmentLabel } from "@/lib/admin/environment";

export const metadata: Metadata = {
  title: "CCPun Control Plane Login",
  robots: { index: false, follow: false, nocache: true },
};

function safeCallbackUrl(value: string | undefined): string {
  if (!value || !value.startsWith("/snt-admin/")) return "/snt-admin/dashboard/";
  return value;
}

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (session?.user?.role) redirect("/snt-admin/dashboard/");

  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  const configured = isAdminAuthConfigured();
  const environmentLabel = getEnvironmentLabel();

  async function loginWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: callbackUrl });
  }

  return (
    <main id="main-content" className="min-h-screen bg-[#15191f] px-5 py-16 text-white">
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center">
        <section className="w-full rounded-3xl border border-white/10 bg-white/[0.05] p-7 shadow-2xl backdrop-blur md:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e0c985]">{environmentLabel}</p>
          <h1 className="mt-4 text-3xl font-semibold">เข้าสู่พื้นที่ควบคุม CCPun</h1>
          <p className="mt-3 text-base leading-7 text-white/70">
            พื้นที่ทดสอบสำหรับตรวจบทความ วิเคราะห์ SEO และให้คุณอนุมัติทุกการเปลี่ยนแปลงด้วยตัวเอง
          </p>

          {params.error ? (
            <div role="alert" className="mt-6 rounded-2xl border border-red-300/20 bg-red-300/10 px-4 py-3 text-sm leading-6 text-red-100">
              เข้าสู่ระบบไม่สำเร็จ บัญชีนี้อาจยังไม่ได้รับสิทธิ์ กรุณาติดต่อผู้ดูแลให้เพิ่มอีเมลของคุณในรายชื่อผู้ใช้
            </div>
          ) : null}

          {configured ? (
            <form action={loginWithGoogle} className="mt-8">
              <button
                type="submit"
                className="w-full rounded-2xl bg-[#e0c985] px-5 py-3.5 text-sm font-semibold text-[#17191d] transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-[#e0c985]/60"
              >
                เข้าสู่ระบบด้วย Google
              </button>
            </form>
          ) : (
            <div className="mt-8 rounded-2xl border border-amber-200/20 bg-amber-200/10 px-4 py-4 text-sm leading-6 text-amber-50">
              ระบบเข้าสู่ระบบของพื้นที่ทดสอบยังตั้งค่าไม่ครบ จึงปิดการเข้าใช้งานไว้เพื่อความปลอดภัย กรุณาให้ผู้ดูแลตั้งค่า Google Login และรายชื่อผู้ใช้ก่อน
            </div>
          )}

          <p className="mt-6 text-sm leading-6 text-white/60">
            แม้เข้า Vercel หรือ Sanity ได้ บัญชีของคุณยังต้องอยู่ในรายชื่อผู้ใช้ของ CCPun เพื่อเปิดพื้นที่นี้
          </p>
        </section>
      </div>
    </main>
  );
}
