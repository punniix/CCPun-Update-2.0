import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MessageCircle } from "lucide-react";

const LINE_OA_URL = "https://lin.ee/tqLCs4f";

const HeroSection = () => {
  return (
    <section
      id="home"
      aria-label="เริ่มวางแผนการเงินกับ CCPun"
      className="relative overflow-hidden border-b border-white/[0.06] pt-20 md:pt-28"
      data-uat-section="hero"
    >
      <div className="absolute inset-0 section-bg-dark" aria-hidden="true" />
      <div className="absolute inset-0 hidden md:block" data-uat-role="hero-portrait" aria-hidden="true">
        <Image
          src="/assets/hero-pun-laptop-v3.png"
          alt=""
          fill
          fetchPriority="high"
          quality={90}
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover object-[62%_center]"
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0 hidden md:block"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(90deg, hsl(0 24% 12% / .99) 0%, hsl(0 24% 12% / .97) 30%, hsl(0 24% 12% / .88) 46%, hsl(0 24% 12% / .48) 66%, transparent 86%), linear-gradient(180deg, hsl(0 24% 12% / .18), transparent 42%, hsl(0 24% 12% / .88) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="pb-8 md:flex md:min-h-[650px] md:items-center md:pb-12 md:pt-10 lg:min-h-[690px]">
          <div className="relative z-20 w-full md:max-w-[52%] xl:max-w-[56%]" data-uat-role="hero-copy">
            <div className="relative -mx-4 aspect-[4/3] overflow-hidden sm:-mx-6 md:mx-0 md:aspect-auto md:overflow-visible">
              <div className="absolute inset-0 md:hidden" data-uat-role="hero-portrait" aria-hidden="true">
                <Image
                  src="/assets/hero-pun-laptop-mobile-v5.webp"
                  alt=""
                  fill
                  fetchPriority="high"
                  quality={75}
                  sizes="100vw"
                  className="object-cover object-center"
                />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, hsl(0 24% 10% / .78) 0%, hsl(0 24% 10% / .58) 26%, hsl(0 24% 10% / .18) 35%, transparent 44%)",
                  }}
                />
              </div>

              <h1
                aria-label="ปิดความเสี่ยงการเงินของคุณ เปิดความมั่งคั่งผ่านแผนการลงทุน"
                className="absolute left-1/2 top-2 z-10 w-[calc(100%_-_2rem)] max-w-[22rem] -translate-x-1/2 text-center text-[1.25rem] font-semibold leading-[1.12] tracking-[-0.02em] text-foreground min-[360px]:top-3 min-[360px]:text-[1.375rem] min-[400px]:text-[1.4375rem] md:static md:left-auto md:block md:w-auto md:max-w-[21ch] md:translate-x-0 md:text-left md:text-[3rem] md:leading-[1.18] md:tracking-[-0.025em] xl:text-[3.35rem]"
              >
                <span className="md:hidden">
                  <span className="block">ปิดความเสี่ยงการเงินของคุณ</span>
                  <span className="block">เปิดความมั่งคั่ง</span>
                  <span className="block">ผ่านแผนการลงทุน</span>
                </span>
                <span className="hidden md:inline">ปิดความเสี่ยงการเงินของคุณ เปิดความมั่งคั่งผ่านแผนการลงทุน</span>
              </h1>
            </div>

            <p className="mx-auto mt-5 max-w-[31ch] text-center text-base leading-[1.6] text-foreground/70 text-balance md:mx-0 md:max-w-[52ch] md:text-left md:text-lg md:leading-8" data-uat-role="hero-support">
              ออกแบบแผนการเงิน การลงทุนเฉพาะที่เหมาะกับตัวคุณ
            </p>

            <div className="mt-5 flex justify-center md:mt-7 md:justify-start" data-uat-role="hero-actions">
              <a
                href={LINE_OA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-[#06C755] px-7 py-3 text-base font-semibold text-[#1f1414] transition-colors hover:bg-[#05B94E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06C755] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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