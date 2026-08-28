import Image from "next/image";

const AboutSection = () => {
  return (
    <section id="about" aria-label="เกี่ยวกับ CCPun" className="relative overflow-hidden py-16 md:py-24" data-uat-section="about">
      <div className="absolute inset-0 section-bg-dark-reverse" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(300px,.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <div
            className="relative mx-auto h-[520px] w-full max-w-[430px] overflow-hidden rounded-3xl border border-primary/30 bg-background/20 md:h-[600px] lg:mx-0"
            data-uat-role="about-portrait-frame"
          >
            <Image
              src="/assets/about-pun-arms-crossed-v1.jpg"
              alt="ปั้น ที่ปรึกษาทางการเงิน CCPun"
              fill
              sizes="(min-width: 1024px) 430px, calc(100vw - 32px)"
              className="object-cover object-top opacity-[.92]"
              style={{ filter: "saturate(.78) sepia(.08) contrast(1.04)" }}
            />
          </div>

          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-medium text-primary/80">มุมมองของที่ปรึกษา</p>
            <h2 className="text-2xl font-semibold tracking-[-0.015em] text-foreground sm:text-3xl md:text-4xl">
              เกี่ยวกับ <span className="text-primary">CCPun</span>
            </h2>

            <blockquote className="mt-7 border-l border-primary/35 pl-5 text-lg leading-8 text-foreground/90 md:pl-7 md:text-xl md:leading-9">
              จากคนที่โฟกัสแต่เพียงเรื่องการลงทุน จนเจอเหตุไม่คาดฝัน จึงปรับแผนการเงินใหม่ให้มั่นคงด้วยการวางแผนการเงินในระดับรากฐาน และต้องการช่วยเหลือผู้คนด้วยการเป็นตัวแทนประกันชีวิตและผู้แนะนำการลงทุน
            </blockquote>

            <p className="mt-7 leading-7 text-foreground/62 md:text-base">
              จากประสบการณ์ด้านการเงินการลงทุน 5 ปี ผมมุ่งเน้นการให้คำแนะนำที่เป็นกลาง ยึดประโยชน์ของลูกค้าเป็นหลัก โดยเอาประสบการณ์ทั้งจากที่ทำงาน และสิ่งที่ประสบพบเจอในชีวิตตัวเอง มาช่วยเหลือและให้คำแนะนำที่เหมาะสม เพื่อให้ลูกค้ามีคุณภาพชีวิตที่ดี มีความมั่นคง และมั่งคั่งอย่างยั่งยืนในระยะยาว
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
