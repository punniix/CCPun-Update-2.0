import Image from 'next/image';
import type { ReactNode } from 'react';
import styles from './Website43.module.css';
import { Website43Footer, Website43Navbar } from './Website43Shared';

function ToolHero({ image, badge, line1, line2, description }: { image: string; badge: string; line1: string; line2: string; description: string }) {
  return (
    <section className={styles.toolHero}>
      <Image className={styles.toolHeroImage} src={image} alt="" width={1448} height={1086} sizes="(max-width: 639px) 100vw, (max-width: 1023px) 560px, 820px" priority />
      <div className={styles.toolHeroGradient} aria-hidden="true" />
      <Website43Navbar overlay />
      <div className={styles.toolHeroCopy}>
        <span className={styles.toolBadge}>{badge}</span>
        <h1 className={styles.toolTitle}>{line1}<br /><span className={styles.toolTitleGold}>{line2}</span></h1>
        <p className={styles.toolDescription}>{description}</p>
        <a className={styles.primaryButton} href="#calculator">เริ่มประเมิน</a>
      </div>
    </section>
  );
}

const fhcFaq = [
  ['Financial Health Check หน้านี้ประเมินอะไร?', 'หน้านี้เริ่มจากโมดูลประเมินความต้องการทุนประกันชีวิต โดยเทียบภาระครอบครัว หนี้ และทุนการศึกษาบุตร กับทุนประกันชีวิตและสินทรัพย์ที่คุณตั้งใจใช้ ยังไม่ได้ให้คะแนนสุขภาพการเงินทุกด้าน'],
  ['ผลลัพธ์หมายความว่าสุขภาพการเงินดีหรือไม่?', 'ยังสรุปไม่ได้ ผลลัพธ์แสดงเฉพาะช่องว่างความคุ้มครองชีวิตตามข้อมูลและสมมติฐานที่กรอก ควรทบทวนเงินสำรองฉุกเฉิน หนี้ ความเสี่ยงโรคร้ายแรง ความพร้อมลงทุน และเกษียณร่วมด้วย'],
  ['ผลลัพธ์ใช้เป็นคำแนะนำเฉพาะบุคคลได้หรือไม่?', 'ไม่ได้ ผลลัพธ์เป็นประมาณการเบื้องต้น ไม่ใช่คำแนะนำให้ซื้อผลิตภัณฑ์หรือวงเงินเฉพาะ ควรตรวจรายละเอียดความคุ้มครอง เงื่อนไข และข้อยกเว้นของกรมธรรม์ก่อนตัดสินใจ'],
] as const;

export function Website43FinancialHealthCheck({ calculator }: { calculator: ReactNode }) {
  return (
    <div className={styles.root}>
      <main id="main-content">
        <ToolHero image="/assets/website-43/fhc-hero.png" badge="Financial Health Check · โมดูลความคุ้มครองชีวิต" line1="ตรวจสุขภาพการเงิน" line2="เริ่มจากช่องว่างความคุ้มครอง" description="ประเมินภาระที่ครอบครัวยังต้องดูแล แล้วเทียบกับทุนประกันชีวิตและสินทรัพย์ที่พร้อมใช้ เพื่อเห็นจุดที่ควรทบทวนต่อในแผนการเงิน" />

        <section className={styles.toolStorySection} data-uat-section="tool-intro">
          <div className={styles.narrow}>
            <h2 className={styles.h2}>การตรวจสุขภาพการเงินต้องดูหลายเรื่องให้เชื่อมกัน</h2>
            <div className={styles.storyCopy}>
              <p>สุขภาพการเงินไม่ได้วัดจากเงินออมหรือผลตอบแทนเพียงอย่างเดียว แต่ต้องดูว่ารายรับ รายจ่าย หนี้ เงินสำรอง ความคุ้มครอง และเป้าหมายระยะยาวรองรับกันหรือไม่</p>
              <p>หน้า Financial Health Check นี้เริ่มจากโมดูลความคุ้มครองชีวิต เพื่อช่วยให้เห็นภาระที่ครอบครัวยังต้องดูแลและส่วนต่างของเงินก้อน ก่อนนำไปทบทวนด้านอื่นของแผนการเงิน</p>
            </div>
            <p className={styles.toolDisclaimer}>ผลลัพธ์เป็นประมาณการเบื้องต้นจากข้อมูลและสมมติฐานที่คุณกรอก ไม่ใช่คำแนะนำเฉพาะบุคคล และไม่ยืนยันว่าจำนวนเงินจะเพียงพอในทุกกรณี โปรดศึกษารายละเอียดความคุ้มครอง เงื่อนไข และข้อยกเว้นของกรมธรรม์ก่อนตัดสินใจทำประกันภัย และประกันไม่ใช่เงินฝาก</p>
          </div>
        </section>

        <section id="calculator" className={styles.calculatorSection} data-uat-section="calculator">
          <div className={styles.calculatorStage}>{calculator}</div>
        </section>

        <section className={`${styles.sectionDeep} ${styles.sectionBottomLarge}`} data-uat-section="tool-faq">
          <div className={styles.inner}>
            <p className={styles.eyebrow}>คำถามที่พบบ่อย</p>
            <h2 className={styles.h2}>เรื่องที่ควรรู้ก่อนใช้ผลประเมิน</h2>
            <div className={styles.faqList}>{fhcFaq.map(([question, answer]) => <details className={styles.faqItem} key={question}><summary className={styles.faqSummary}><span>{question}</span><span className={styles.faqIcon} aria-hidden="true">+</span></summary><p className={styles.faqAnswer}>{answer}</p></details>)}</div>
          </div>
        </section>
      </main>
      <Website43Footer />
    </div>
  );
}

export function Website43CIPlanning({ calculator, landingTracker, faqItems }: { calculator: ReactNode; landingTracker?: ReactNode; faqItems: readonly { question: string; answer: string }[] }) {
  return (
    <div className={styles.root}>
      <main id="main-content">
        <ToolHero image="/assets/website-43/ci-hero.png" badge="เครื่องมือวางแผนทุนโรคร้ายแรง" line1="เงินก้อนจากประกันโรคร้ายแรงที่มี" line2="เพียงพอรับภาระจริงไหม?" description="กรอกรายได้หรือภาระที่ยังต้องดูแล แล้วเทียบกับเงินก้อนจากประกันโรคร้ายแรงและสินทรัพย์สภาพคล่องที่พร้อมใช้" />
        {landingTracker}

        <section className={styles.toolStorySection} data-uat-section="tool-intro">
          <div className={styles.narrow}>
            <h2 className={styles.h2}>เพราะคำว่า “พอ” ของแต่ละคนไม่เท่ากัน</h2>
            <div className={styles.storyCopy}>
              <p>หลายๆ คน รวมถึงผม พอเริ่มคิดเรื่องทุนประกันโรคร้ายแรง ก็มักติดอยู่กับคำถามเดียวกันว่า “ต้องมีเท่าไรถึงจะพอ?”</p>
              <p>เพราะเราไม่รู้ล่วงหน้าว่าโรคร้ายแรงจะเกิดเมื่อไร ต้องพักรักษาตัวนานแค่ไหน หรือรายได้จะหายไปเท่าไร แต่ค่าบ้าน ค่ารถ หนี้บัตรเครดิต ค่าเทอมลูก และค่าใช้จ่ายในครอบครัวยังเดินต่อ</p>
              <p>ผมจึงลองแยกรายได้และภาระทีละส่วน วางตามช่วงเวลาที่ต้องรับผิดชอบจริง แล้วเทียบกับเงินก้อนจากประกันโรคร้ายแรงและสินทรัพย์ที่พร้อมใช้ เพื่อให้เห็นที่มาของตัวเลขชัดขึ้น</p>
            </div>
            <p className={styles.toolDisclaimer}>ผลลัพธ์เป็นประมาณการเบื้องต้นจากข้อมูลและสมมติฐานที่คุณกรอก ไม่ใช่คำแนะนำเฉพาะบุคคล และไม่ยืนยันว่าจำนวนเงินจะเพียงพอในทุกกรณี โปรดศึกษารายละเอียดความคุ้มครอง เงื่อนไข และข้อยกเว้นของกรมธรรม์ก่อนตัดสินใจทำประกันภัย และประกันไม่ใช่เงินฝาก</p>
          </div>
        </section>

        <section id="calculator" className={styles.calculatorSection} data-uat-section="calculator">
          <div className={styles.calculatorHeader}><p className={styles.eyebrow}>เครื่องคำนวณเงินก้อนรับมือโรคร้ายแรง</p><h2>2 ขั้นตอน เพื่อเห็นส่วนต่างที่ต้องเตรียม</h2></div>
          <div className={styles.calculatorStage}>{calculator}</div>
        </section>

        <section className={`${styles.sectionDeep} ${styles.sectionBottomLarge}`} data-uat-section="tool-faq">
          <div className={styles.inner}>
            <h2 className={styles.h2}>คำถามที่พบบ่อย</h2>
            <div className={styles.faqList}>
              {faqItems.map(({ question, answer }) => (
                <details className={styles.faqItem} key={question}>
                  <summary className={styles.faqSummary}>
                    <span>{question}</span>
                    <span className={styles.faqIcon} aria-hidden="true">+</span>
                  </summary>
                  <p className={styles.faqAnswer}>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Website43Footer />
    </div>
  );
}
