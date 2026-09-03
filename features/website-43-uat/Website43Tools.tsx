import LifeCoverageWizard from '@/features/financial-health-check/components/LifeCoverageWizard';
import CIWizard from '@/features/ci-planning/components/CIWizard';
import styles from './Website43.module.css';
import { Website43Footer, Website43Navbar } from './Website43Shared';

function ToolHero({ image, badge, line1, line2, description }: { image: string; badge: string; line1: string; line2: string; description: string }) {
  return (
    <section className={styles.toolHero}>
      <img className={styles.toolHeroImage} src={image} alt="" />
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

export function Website43FinancialHealthCheck() {
  return (
    <div className={styles.root}>
      <main id="main-content">
        <ToolHero image="/assets/website-43/fhc-hero.png" badge="Financial Health Check · โมดูลความคุ้มครองชีวิต" line1="ตรวจสุขภาพการเงิน" line2="เริ่มจากช่องว่างความคุ้มครอง" description="ประเมินภาระที่ครอบครัวยังต้องดูแล แล้วเทียบกับทุนประกันชีวิตและสินทรัพย์ที่พร้อมใช้ เพื่อเห็นจุดที่ควรทบทวนต่อในแผนการเงิน" />

        <section className={styles.toolStorySection}>
          <div className={styles.narrow}>
            <h2 className={styles.h2}>การตรวจสุขภาพการเงินต้องดูหลายเรื่องให้เชื่อมกัน</h2>
            <div className={styles.storyCopy}>
              <p>สุขภาพการเงินไม่ได้วัดจากเงินออมหรือผลตอบแทนเพียงอย่างเดียว แต่ต้องดูว่ารายรับ รายจ่าย หนี้ เงินสำรอง ความคุ้มครอง และเป้าหมายระยะยาวรองรับกันหรือไม่</p>
              <p>หน้า Financial Health Check นี้เริ่มจากโมดูลความคุ้มครองชีวิต เพื่อช่วยให้เห็นภาระที่ครอบครัวยังต้องดูแลและส่วนต่างของเงินก้อน ก่อนนำไปทบทวนด้านอื่นของแผนการเงิน</p>
            </div>
            <p className={styles.eyebrow}>กรอบ Financial Health Check</p>
            <h3 style={{ margin: '8px 0 0', fontSize: 20 }}>7 เรื่องใน 3 กลุ่มที่ควรทบทวนให้เชื่อมกัน</h3>
            <div className={styles.truthGrid}>
              <article className={styles.truth}><span className={styles.truthNum}>01</span><h3>ความคุ้มครองกับภาระจริง</h3><p>ช่องว่างความคุ้มครองและความต้องการทุนประกันชีวิตควรดูจากค่าใช้จ่าย หนี้ และเป้าหมายของคนที่ยังต้องพึ่งรายได้</p></article>
              <article className={styles.truth}><span className={styles.truthNum}>02</span><h3>สภาพคล่องและเหตุไม่คาดคิด</h3><p>เงินสำรองฉุกเฉิน ภาระหนี้ และความเสี่ยงโรคร้ายแรงควรถูกทบทวนร่วมกัน เพราะทุกเรื่องกระทบเงินที่พร้อมใช้</p></article>
              <article className={styles.truth}><span className={styles.truthNum}>03</span><h3>ลงทุนเมื่อฐานการเงินพร้อม</h3><p>ความพร้อมลงทุนและแผนเกษียณควรต่อยอดจากฐานที่รับความเสี่ยงระยะสั้นและความคุ้มครองจำเป็นได้แล้ว</p></article>
            </div>
            <div className={styles.methodBox}>
              <div><p className={styles.eyebrow}>โมดูลที่เปิดให้ใช้ตอนนี้</p><h3>ประเมินความต้องการทุนประกันชีวิต</h3></div>
              <div>
                <p>เริ่มจากค่าใช้จ่ายในครอบครัวและระยะเวลาที่ต้องการให้เงินก้อนรองรับ แล้วเพิ่มหนี้และทุนการศึกษาบุตร ก่อนเทียบกับทุนประกันชีวิตและสินทรัพย์ที่ตั้งใจใช้</p>
                <p>ระบบจะแสดงช่องว่างความคุ้มครองจากข้อมูลที่กรอก เพื่อใช้ตั้งคำถามกับแผนเบื้องต้น ไม่ใช่คะแนนสุขภาพการเงินทั้งแผน และไม่ใช่คำแนะนำให้ซื้อผลิตภัณฑ์หรือวงเงินเฉพาะ</p>
                <p>ดูฐานของแผนการเงินต่อได้ที่ พีระมิดทางการเงิน และหากต้องการทบทวนเงินก้อนเมื่อเผชิญโรคร้ายแรง ใช้เครื่องมือวางแผนทุนโรคร้ายแรง</p>
              </div>
            </div>
            <div className={styles.toolFaq}>
              <p className={styles.eyebrow}>คำถามที่พบบ่อย</p>
              <h3 style={{ margin: '8px 0 16px', fontSize: 24 }}>เรื่องที่ควรรู้ก่อนใช้ผลประเมิน</h3>
              <div className={styles.faqDetails}>{fhcFaq.map(([q, a]) => <details open key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
            </div>
            <div className={styles.toolCtas}>
              <p className={styles.eyebrow}>เริ่มจากข้อมูลที่ทราบก่อน แล้วค่อยกลับมาแก้ไขเมื่อพร้อม</p>
              <div className={styles.toolCtasActions}><a className={styles.primaryButton} href="#calculator">เริ่มประเมินความต้องการทุนประกันชีวิต</a><a className={styles.outlineButton} href="https://lin.ee/tqLCs4f" target="_blank" rel="noopener noreferrer">คุยกับ CCPun ทาง LINE OA</a></div>
            </div>
            <p className={styles.eyebrow} style={{ marginTop: 24 }}>ผลลัพธ์เป็นประมาณการเบื้องต้นจากข้อมูลและสมมติฐานที่คุณกรอก ไม่ใช่คำแนะนำเฉพาะบุคคล และไม่ยืนยันว่าจำนวนเงินจะเพียงพอในทุกกรณี โปรดศึกษารายละเอียดความคุ้มครอง เงื่อนไข และข้อยกเว้นของกรมธรรม์ก่อนตัดสินใจทำประกันภัย และประกันไม่ใช่เงินฝาก</p>
          </div>
        </section>

        <section id="calculator" className={styles.calculatorSection}>
          <div className={styles.calculatorStage}><LifeCoverageWizard /></div>
        </section>
      </main>
      <Website43Footer />
    </div>
  );
}

export function Website43CIPlanning() {
  return (
    <div className={styles.root}>
      <main id="main-content">
        <ToolHero image="/assets/website-43/ci-hero.png" badge="เครื่องมือวางแผนทุนโรคร้ายแรง" line1="เงินก้อนจากประกันโรคร้ายแรงที่มี" line2="เพียงพอรับภาระจริงไหม?" description="กรอกรายได้หรือภาระที่ยังต้องดูแล แล้วเทียบกับเงินก้อนจากประกันโรคร้ายแรงและสินทรัพย์สภาพคล่องที่พร้อมใช้" />

        <section className={styles.toolStorySection}>
          <div className={styles.narrow}>
            <h2 className={styles.h2}>เพราะคำว่า “พอ” ของแต่ละคนไม่เท่ากัน</h2>
            <div className={styles.storyCopy}>
              <p>หลายๆ คน รวมถึงผม พอเริ่มคิดเรื่องทุนประกันโรคร้ายแรง ก็มักติดอยู่กับคำถามเดียวกันว่า “ต้องมีเท่าไรถึงจะพอ?”</p>
              <p>เพราะเราไม่รู้ล่วงหน้าว่าโรคร้ายแรงจะเกิดเมื่อไร ต้องพักรักษาตัวนานแค่ไหน หรือรายได้จะหายไปเท่าไร แต่ค่าบ้าน ค่ารถ หนี้บัตรเครดิต ค่าเทอมลูก และค่าใช้จ่ายในครอบครัวยังเดินต่อ</p>
              <p>ผมจึงลองแยกรายได้และภาระทีละส่วน วางตามช่วงเวลาที่ต้องรับผิดชอบจริง แล้วเทียบกับเงินก้อนจากประกันโรคร้ายแรงและสินทรัพย์ที่พร้อมใช้ เพื่อให้เห็นที่มาของตัวเลขชัดขึ้น</p>
            </div>
            <div className={styles.ciStoryGrid}>
              <article className={styles.ciStoryCard}><img src="/assets/website-43/ci-hero.png" alt="" /><div><h3>รายได้ที่หายไป</h3><p>ถ้าต้องพักรักษาตัวไม่กี่วัน ก็อาจขาดรายได้ไม่กี่วัน แต่ถ้าต้องรักษาตัวหลายเดือน รายได้ที่เคยมีก็อาจหายจนเหลือศูนย์</p></div></article>
              <article className={styles.ciStoryCard}><img src="/assets/website-43/ci-story-debt.png" alt="" /><div><h3>ค่าบ้าน รถ และภาระค่าใช้จ่ายอื่นๆ</h3><p>ถ้าเสาหลักต้องหยุดรักษาตัว ค่าบ้าน รถ บัตรเครดิต และสินเชื่อส่วนบุคคลอาจกลายเป็นภาระที่ครอบครัวต้องช่วยกันรับต่อ</p></div></article>
              <article className={styles.ciStoryCard}><img src="/assets/website-43/ci-story-coverage.png" alt="" /><div><h3>ทุนประกันโรคร้ายแรงที่มีอยู่ และสินทรัพย์</h3><p>ผมจึงเทียบภาระกับทุนประกันโรคร้ายแรง รวมถึงสินทรัพย์ที่พร้อมเปลี่ยนเป็นเงินสดได้เร็ว</p></div></article>
            </div>
            <p className={styles.eyebrow} style={{ marginTop: 20 }}>ภาพประกอบสร้างด้วย Generative AI</p>
            <p className={styles.cardBody}>เมื่อแยกทีละส่วน คุณจะเห็นที่มาของตัวเลข ภาระส่วนไหนต้องดูแลอีกนาน และเงินก้อนจากประกันโรคร้ายแรงที่มีอยู่ช่วยรองรับได้เพียงใด</p>
            <p className={styles.eyebrow} style={{ marginTop: 20 }}>ผลลัพธ์เป็นประมาณการเบื้องต้นจากข้อมูลและสมมติฐานที่คุณกรอก ไม่ใช่คำแนะนำเฉพาะบุคคล และไม่ยืนยันว่าจำนวนเงินจะเพียงพอในทุกกรณี โปรดศึกษารายละเอียดความคุ้มครอง เงื่อนไข และข้อยกเว้นของกรมธรรม์ก่อนตัดสินใจทำประกันภัย และประกันไม่ใช่เงินฝาก</p>
          </div>
        </section>

        <section id="calculator" className={styles.calculatorSection}>
          <div className={styles.calculatorHeader}><p className={styles.eyebrow}>เครื่องคำนวณเงินก้อนรับมือโรคร้ายแรง</p><h2>2 ขั้นตอน เพื่อเห็นส่วนต่างที่ต้องเตรียม</h2></div>
          <div className={styles.calculatorStage}><CIWizard /></div>
        </section>

        <section className={`${styles.sectionDeep} ${styles.sectionBottomLarge}`}>
          <div className={styles.inner}>
            <h2 className={styles.h2}>คำถามที่พบบ่อย</h2>
            <div className={styles.faqList}>
              <div className={styles.faqItem}>เงินก้อนต่างจากค่ารักษาพยาบาลอย่างไร?&nbsp;&nbsp;+</div>
              <div className={styles.faqItem}>ควรนับเงินสำรองฉุกเฉินทั้งหมดไหม?&nbsp;&nbsp;+</div>
              <div className={styles.faqItem}>ผลประเมินใช้แทนคำแนะนำได้หรือไม่?&nbsp;&nbsp;+</div>
            </div>
          </div>
        </section>
      </main>
      <Website43Footer />
    </div>
  );
}
