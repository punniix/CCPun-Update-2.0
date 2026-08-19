import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MessageCircle, Sparkles } from "lucide-react";

const LINE_OA_URL = "https://lin.ee/tqLCs4f";

const HeroSection = () => {
  return (
    <section
      id="home"
      aria-label="เริ่มวางแผนการเงินกับ CCPun"
      className="relative overflow-hidden border-b border-white/[0.06] pt-24 md:pt-28"
      data-uat-section="hero"
    >
      <div className="absolute inset-0 section-bg-dark" aria-hidden="true" />
      <div className="absolute inset-0 hidden md:block" data-uat-role="hero-portrait" aria-hidden="true">
        <Image
          src="/assets/hero-pun-laptop-v3.png"
          alt=""
          fill
          priority
          quality={90}
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover object-[62%_center]"
        />
      </div>
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(90deg, hsl(0 24% 12% / .99) 0%, hsl(0 24% 12% / .97) 30%, hsl(0 24% 12% / .88) 46%, hsl(0 24% 12% / .48) 66%, transparent 86%), linear-gradient(180deg, hsl(0 24% 12% / .18), transparent 42%, hsl(0 24% 12% / .88) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="pb-10 pt-8 md:flex md:min-h-[650px] md:items-center md:pb-12 md:pt-10 lg:min-h-[690px]">
          <div className="relative z-20 w-full md:max-w-[52%] xl:max-w-[56%]" data-uat-role="hero-copy">
            <div className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.055] px-3 text-[13px] font-medium leading-5 text-primary sm:px-4 sm:text-sm">
              <Sparkles className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
              <span>ออกแบบแผนการเงินที่เหมาะกับคุณ</span>
            </div>

            <div className="relative -mx-4 aspect-[4/3] overflow-hidden sm:-mx-6 md:mx-0 md:aspect-auto md:overflow-visible">
              <div className="absolute inset-0 md:hidden" data-uat-role="hero-portrait" aria-hidden="true">
                <Image
                  src="/assets/hero-pun-laptop-mobile-v5.webp"
                  alt=""
                  fill
                  priority
                  quality={92}
                  sizes="100vw"
                  className="object-cover object-center"
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,hsl(0_24%_10%/.72)_0%,hsl(0_24%_10%/.46)_38%,transparent_62%)]" />
              </div>

              <h1
                aria-label="ปิดความเสี่ยงการเงินของคุณ เปิดความมั่งคั่งผ่านแผนการลงทุน"
                className="absolute inset-x-4 top-3 z-10 text-[1.4rem] font-semibold leading-[1.13] tracking-[-0.02em] text-foreground drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] sm:inset-x-6 sm:top-4 sm:text-[1.6rem] md:static md:block md:max-w-[21ch] md:text-[3rem] md:leading-[1.18] md:tracking-[-0.025em] md:drop-shadow-none xl:text-[3.35rem]"
              >
                <span className="md:hidden">
                  <span className="block">ปิดความเสี่ยงการเงินของคุณ</span>
                  <span className="block">เปิดความมั่งคั่ง</span>
                  <span className="block">ผ่านแผนการลงทุน</span>
                </span>
                <span className="hidden md:inline">ปิดความเสี่ยงการเงินของคุณ เปิดความมั่งคั่งผ่านแผนการลงทุน</span>
              </h1>
            </div>

            <p className="mt-5 max-w-[52ch] text-base leading-7 text-foreground/70 md:text-lg md:leading-8" data-uat-role="hero-support">
              ออกแบบแผนการเงิน การลงทุนเฉพาะที่เหมาะกับตัวคุณ
            </p>

            <div className="mt-7 flex" data-uat-role="hero-actions">
              <a
                href={LINE_OA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-[#06C755] px-7 py-3 text-base font-semibold text-white transition-colors hover:bg-[#05B94E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06C755] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                วางแผนร่วมกับ CCPun
              </a>
            </div>
          </div>
        </div>

        <div className="border-y border-white/[0.1]" data-uat-role="hero-routes">
          <ul className="divide-y divide-white/[0.08] md:grid md:grid-cols-2 md:divide-x md:divide-y-0">
            <li>
              <Link
                href="/tools/financial-health-check/"
                prefetch={false}
                className="group flex min-h-[76px] items-center justify-between gap-4 px-2 py-4 transition-colors hover:bg-white/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/60 md:min-h-20 md:px-6"
              >
                <div className="flex min-w-0 items-start gap-4">
                  <span className="mt-0.5 w-7 shrink-0 text-xs font-semibold tracking-[0.14em] text-primary/65">01</span>
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-foreground/50">ประเมินความคุ้มครอง</span>
                    <span className="mt-1 block text-base font-semibold leading-snug text-foreground">
                      คำนวณทุนชีวิตที่ครอบครัวควรมี
                    </span>
                  </span>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-foreground/30 transition-colors group-hover:text-primary" aria-hidden="true" />
              </Link>
            </li>
            <li>
              <Link
                href="/ci-planning/"
                prefetch={false}
                className="group flex min-h-[76px] items-center justify-between gap-4 px-2 py-4 transition-colors hover:bg-white/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/60 md:min-h-20 md:px-6"
              >
                <div className="flex min-w-0 items-start gap-4">
                  <span className="mt-0.5 w-7 shrink-0 text-xs font-semibold tracking-[0.14em] text-primary/65">02</span>
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-foreground/50">เตรียมรับมือรายได้สะดุด</span>
                    <span className="mt-1 block text-base font-semibold leading-snug text-foreground">
                      เตรียมเงินก้อนรับมือโรคร้ายแรง
                    </span>
                  </span>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-foreground/35 transition-colors group-hover:text-primary" aria-hidden="true" />
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
