import { Quote } from "lucide-react";

const testimonials = [
  {
    paragraphs: [
      "หลังจากได้รีวิวแผนประกันกับคุณปั้น รู้สึกว่าได้รับข้อมูลครบถ้วนมากขึ้น คุณปั้นอธิบายรายละเอียดของกรมธรรม์ที่เรามีอยู่ได้ชัดเจน ทำให้เข้าใจสิทธิ์ที่ตัวเองได้รับจริงๆ",
      "อยากให้ทุกคนมีโอกาสได้คุยกับเจ้าหน้าที่ที่มีความรู้แบบนี้ก่อนตัดสินใจซื้อประกัน เพราะถ้าเข้าใจกรมธรรม์ตั้งแต่แรก ก็จะไม่เกิดความเข้าใจผิดในภายหลัง",
      "ขอบคุณคุณปั้นที่ตั้งใจอธิบายมากๆ ถึงขนาดเอาไปเล่าให้แฟนฟังต่อได้เลย",
    ],
    name: "คุณ Kittisak",
  },
  {
    paragraphs: [
      "คุณปั้นให้คำแนะนำในการปรับแผนประกันสุขภาพ และโรคร้ายแรง หลังจากรีวิวแผนได้ค่อนข้างโอเค",
    ],
    name: "คุณ Maylisa",
  },
];

const TestimonialsSection = () => {
  return (
    <section
      aria-label="รีวิวจากลูกค้า"
      className="relative overflow-hidden py-16 md:py-24"
      data-uat-section="testimonials"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 18% 0%, rgba(220,190,130,0.055) 0%, transparent 52%)" }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-9 max-w-2xl md:mb-12">
          <p className="mb-3 text-sm font-medium text-primary/80">ประสบการณ์จากการพูดคุยจริง</p>
          <h2 className="text-2xl font-semibold tracking-[-0.015em] text-foreground sm:text-3xl md:text-4xl">
            รีวิวจากลูกค้าที่ได้รับคำแนะนำจริง
          </h2>
        </div>

        <div className="grid items-stretch gap-4 lg:grid-cols-12 lg:gap-5">
          <blockquote className="relative overflow-hidden rounded-2xl border border-primary/16 bg-primary/[0.035] p-6 md:p-8 lg:col-span-7">
            <Quote className="mb-5 h-7 w-7 text-primary/45" aria-hidden="true" />
            <div className="space-y-3">
              {testimonials[0].paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-7 text-foreground/76 md:text-base">
                  {paragraph}
                </p>
              ))}
            </div>
            <footer className="mt-7 border-t border-white/[0.08] pt-4 text-sm font-semibold text-foreground">
              {testimonials[0].name}
            </footer>
          </blockquote>

          <blockquote className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-primary/16 bg-primary/[0.035] p-6 md:p-8 lg:col-span-5">
            <div>
              <Quote className="mb-5 h-6 w-6 text-primary/35" aria-hidden="true" />
              {testimonials[1].paragraphs.map((paragraph) => (
                <p key={paragraph} className="max-w-[38ch] text-sm leading-7 text-foreground/76 md:text-base">
                  {paragraph}
                </p>
              ))}
            </div>
            <footer className="mt-8 border-t border-white/[0.08] pt-4 text-sm font-semibold text-foreground">
              {testimonials[1].name}
            </footer>
          </blockquote>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
