import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  HeartHandshake,
  LineChart,
  SearchCheck,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const LINE_OA_URL = "https://lin.ee/tqLCs4f";

const concerns = [
  {
    icon: SearchCheck,
    title: "ไม่แน่ใจว่ามีแผนพอหรือยัง",
    body: "เริ่มจากดูของเดิม เป้าหมาย และความเสี่ยงที่ต้องรับผิดชอบก่อน",
  },
  {
    icon: WalletCards,
    title: "มีเงินเก็บ แต่ไม่รู้จะเริ่มลงทุนอย่างไร",
    body: "ดูเงินสำรอง ระยะเวลา และระดับความเสี่ยงก่อนเลือกเครื่องมือ",
  },
  {
    icon: ShieldCheck,
    title: "มีหลายเป้าหมาย แต่ไม่รู้ควรเริ่มตรงไหนก่อน",
    body: "เรียงลำดับสิ่งจำเป็น สิ่งสำคัญ และสิ่งที่รอได้ให้เห็นภาพเดียวกัน",
  },
];

const services = [
  {
    icon: ShieldCheck,
    step: "01",
    title: "Insurance Planning",
    body: "ดูชีวิต สุขภาพ รายได้ ครอบครัว และภาระที่ต้องรับผิดชอบเป็นภาพรวม",
  },
  {
    icon: LineChart,
    step: "02",
    title: "Investment Planning",
    body: "วางเป้าหมาย ระยะเวลา เงินที่พร้อมลงทุน และความเสี่ยงที่รับได้",
  },
  {
    icon: BarChart3,
    step: "03",
    title: "Financial Planning",
    body: "เชื่อมสิ่งที่มีอยู่กับเป้าหมายและความเสี่ยง เพื่อให้แผนไปด้วยกันได้จริง",
  },
];

const verification = [
  {
    icon: BadgeCheck,
    title: "ใบอนุญาตและคุณวุฒิ",
    body: "ข้อมูลสำคัญควรตรวจสอบกับแหล่งทางการได้ ไม่ใช้เพียงคำกล่าวอ้างหรือ badge ลอย ๆ",
  },
  {
    icon: HeartHandshake,
    title: "ผลประโยชน์ของคุณมาก่อน",
    body: "เริ่มจากสถานการณ์และเป้าหมาย ก่อนค่อยพิจารณาว่าจำเป็นต้องใช้ผลิตภัณฑ์อะไรหรือไม่",
  },
  {
    icon: CheckCircle2,
    title: "ขอบเขตและข้อจำกัดชัดเจน",
    body: "อธิบายสิ่งที่ทำได้ สิ่งที่ต้องใช้ข้อมูลเพิ่ม และจุดที่ควรตรวจสอบก่อนตัดสินใจ",
  },
];

export default function Website43FigmaAudit() {
  return (
    <div className="min-h-screen bg-[#251818] text-[#faf9f9]">
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <section className="relative isolate min-h-[740px] overflow-hidden bg-[#050907] md:min-h-[820px] lg:min-h-[800px]">
          <Image
            src="/assets/hero-pun-laptop-v3.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-30 object-cover object-[58%_center] md:object-center"
          />

          <div
            aria-hidden="true"
            className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgba(4,6,5,.99)_0%,rgba(4,6,5,.99)_33%,rgba(4,6,5,.86)_40%,rgba(4,6,5,.54)_44%,rgba(4,6,5,.18)_49%,rgba(4,6,5,0)_54%)] md:hidden"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 -z-20 h-[38%] bg-[linear-gradient(180deg,rgba(4,5,4,.06)_0%,rgba(4,5,4,.35)_30%,rgba(4,5,4,.78)_72%,rgba(4,5,4,.92)_100%)] md:hidden"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-20 hidden bg-[linear-gradient(90deg,rgba(6,11,9,.95)_0%,rgba(6,11,9,.78)_35%,rgba(6,11,9,.34)_60%,rgba(6,11,9,0)_82%)] md:block lg:bg-[linear-gradient(90deg,rgba(6,11,9,.94)_0%,rgba(6,11,9,.72)_48%,rgba(6,11,9,.22)_78%,rgba(6,11,9,0)_100%)]"
          />

          <div className="relative z-10 mx-auto flex min-h-[740px] max-w-7xl flex-col px-6 pb-7 pt-28 md:min-h-[820px] md:justify-end md:px-10 md:pb-16 lg:min-h-[800px] lg:justify-center lg:px-8 lg:py-28">
            <div className="max-w-[760px] md:max-w-[500px] lg:max-w-[760px]">
              <p className="text-sm font-semibold leading-6 text-[#e0c985] lg:text-[15px]">
                วางแผนจากชีวิตจริง ไม่ใช่ผลิตภัณฑ์
              </p>
              <h1 className="mt-5 max-w-[18ch] text-[2rem] font-bold leading-[1.28] tracking-[-.025em] text-[#faf9f9] md:text-[2.35rem] md:leading-[1.27] lg:max-w-[20ch] lg:text-[2.75rem] lg:leading-[1.36]">
                วางแผนประกัน การลงทุน และความเสี่ยงในชีวิต ให้เหมาะกับคุณจริง ๆ
              </h1>

              <div className="mt-auto pt-[255px] md:mt-6 md:pt-0 lg:mt-7">
                <p className="max-w-[610px] text-sm leading-6 text-[rgba(247,245,242,.92)] md:text-base md:text-[rgba(247,245,242,.92)] lg:text-lg lg:leading-7">
                  เริ่มจากสิ่งที่คุณมี สิ่งที่กังวล และเป้าหมายของคุณ ก่อนค่อยเลือกเครื่องมือหรือผลิตภัณฑ์ที่เหมาะสม
                </p>
                <div className="mt-6 flex gap-3">
                  <Link
                    href="/tools/financial-health-check/"
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#e0c985] bg-[#e0c985] px-6 text-sm font-semibold text-[#251818]"
                  >
                    เช็กสุขภาพการเงิน
                  </Link>
                  <a
                    href={LINE_OA_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#e0c985] px-6 text-sm font-semibold text-[#e0c985]"
                  >
                    คุยกับปั้น
                  </a>
                </div>
                <p className="mt-4 text-xs font-semibold text-[#e0c985]">5+ ปี · 2 ใบอนุญาต · 4 พาร์ทเนอร์</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#2f2020] py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <p className="text-xs font-semibold text-[#e0c985]">โจทย์ที่พบบ่อย</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-.02em] md:text-4xl">ถ้าเรื่องเงินยังทำให้คุณไม่สบายใจ</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#d2c7c7]">เราเริ่มจากภาพรวมของคุณ แล้วจัดลำดับสิ่งที่ควรทำก่อน</p>
            <div className="mt-9 grid gap-4 md:grid-cols-3">
              {concerns.map(({ icon: Icon, title, body }) => (
                <article key={title} className="border-b border-white/10 pb-6 md:border-b-0 md:border-r md:pr-6 last:border-0">
                  <Icon className="h-5 w-5 text-[#e0c985]" aria-hidden="true" />
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#bfaeae]">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#2b1d1d] py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <p className="text-xs font-semibold text-[#e0c985]">สิ่งที่ CCPun ช่วยวางแผน</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-.02em] md:text-4xl">วางแผนให้ครบ ในสิ่งที่เหมาะกับคุณ</h2>
            <div className="mt-9 grid gap-4 md:grid-cols-3">
              {services.map(({ icon: Icon, step, title, body }) => (
                <article key={title} className="rounded-2xl border border-white/10 bg-white/[.035] p-6">
                  <div className="flex items-center justify-between text-[#e0c985]"><Icon className="h-5 w-5"/><span className="text-xs">{step}</span></div>
                  <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#bfaeae]">{body}</p>
                </article>
              ))}
            </div>
            <div className="mt-10 rounded-2xl border border-white/10 bg-white/[.025] p-6 md:p-8">
              <p className="text-xs font-semibold text-[#e0c985]">เริ่มจากสิ่งที่มีอยู่แล้ว</p>
              <h3 className="mt-2 text-2xl font-semibold">ไม่ต้องซื้ออะไรใหม่ทุกครั้ง</h3>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#c7b8b8]">ถ้าสิ่งที่คุณมีอยู่เหมาะสมแล้ว แผนอาจเริ่มจากการจัดระบบและเติมเฉพาะช่องว่างที่จำเป็น</p>
            </div>
          </div>
        </section>

        <section className="bg-[#251818] py-16 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-[.8fr_1.2fr] md:items-center lg:px-8">
            <div className="relative mx-auto aspect-square w-full max-w-[400px] overflow-hidden rounded-2xl bg-[#eef1f5] md:max-w-[360px] lg:max-w-[400px]">
              <Image
                src="/assets/about-pun-arms-crossed-v1.jpg"
                alt="ปั้น ที่ปรึกษาด้านประกัน การลงทุน และการวางแผนการเงิน"
                fill
                sizes="(max-width: 767px) 318px, (max-width: 1023px) 360px, 400px"
                className="object-cover object-[center_22%]"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#e0c985]">มุมมองของที่ปรึกษา</p>
              <h2 className="mt-3 text-3xl font-bold leading-tight tracking-[-.02em] md:text-4xl">จากคนที่โฟกัสแต่การลงทุน สู่แผนที่เริ่มจากชีวิตจริง</h2>
              <div className="mt-6 space-y-5 text-base leading-8 text-[#c7b8b8]">
                <p>จากคนที่โฟกัสแต่เพียงเรื่องการลงทุน จนเจอเหตุไม่คาดฝัน ผมจึงกลับมาจัดแผนการเงินใหม่จากระดับรากฐาน และเลือกเดินต่อในบทบาทตัวแทนประกันชีวิตกับผู้แนะนำการลงทุน</p>
                <p>จากประสบการณ์ด้านการเงินและการลงทุนกว่า 5 ปี ผมยึดประโยชน์ของลูกค้าเป็นหลัก นำทั้งประสบการณ์ทำงานและเรื่องที่พบเจอในชีวิตจริงมาช่วยเรียงทางเลือกให้เหมาะกับแต่ละคน เพื่อให้แผนสร้างทั้งความมั่นคงและความมั่งคั่งอย่างยั่งยืน</p>
              </div>
              <blockquote className="mt-7 rounded-2xl border border-white/10 bg-[#533f3f] p-6 text-lg font-semibold leading-8 md:text-xl">“เป้าหมายไม่ใช่ทำให้แผนดูซับซ้อน แต่ทำให้คุณรู้ว่าควรทำอะไรก่อน และเพราะอะไร”</blockquote>
            </div>
          </div>
        </section>

        <section className="bg-[#2f2020] py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <p className="text-xs font-semibold text-[#e0c985]">TRUST & VERIFICATION</p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">ตรวจสอบได้ ก่อนตัดสินใจ</h2>
            <div className="mt-9 grid gap-4 md:grid-cols-3">
              {verification.map(({ icon: Icon, title, body }) => (
                <article key={title} className="rounded-2xl border border-white/10 bg-white/[.035] p-6">
                  <Icon className="h-5 w-5 text-[#e0c985]" aria-hidden="true" />
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#bfaeae]">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#251818] py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-6 text-center lg:px-8">
            <p className="text-xs font-semibold text-[#e0c985]">เริ่มต้นแบบไม่ต้องรีบตัดสินใจ</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">เริ่มจากทำให้ภาพรวมของคุณชัดขึ้นก่อน</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#c7b8b8]">ถ้าคุณมีประกันหรือการลงทุนอยู่แล้ว เริ่มจากทบทวนของเดิมได้ ไม่จำเป็นต้องเริ่มใหม่ทั้งหมด</p>
            <a href={LINE_OA_URL} target="_blank" rel="noreferrer" className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#e0c985] px-7 text-sm font-semibold text-[#251818]">คุยกับปั้นทาง LINE <ArrowRight className="h-4 w-4" /></a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
