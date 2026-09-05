import Image from 'next/image';
import Link from 'next/link';
import styles from './Website43.module.css';
import { SectionHeading, Website43Footer, Website43Navbar } from './Website43Shared';
import { WEBSITE43_BASE as BASE } from './constants';

const pains = [
  ['/assets/website-43/icon-protection-gap.svg', 'ไม่แน่ใจว่ามีประกันเพียงพอหรือยัง', 'มีความคุ้มครองอยู่ แต่ไม่แน่ใจว่าพอกับคนที่ต้องดูแลหรือไม่'],
  ['/assets/website-43/icon-tax.svg', 'มีเงินเก็บ แต่ไม่รู้จะเริ่มลงทุนอย่างไร', 'อยากให้เงินทำงาน แต่ยังไม่รู้ว่าควรเริ่มจากเป้าหมายหรือเครื่องมือไหน'],
  ['/assets/website-43/icon-investment-risk.svg', 'มีหลายเป้าหมาย แต่ไม่รู้ควรเริ่มตรงไหนก่อน', 'ทั้งประกัน การลงทุน ภาษี และอนาคตมาพร้อมกัน จึงต้องช่วยกันจัดลำดับ'],
] as const;

const services = [
  ['/assets/website-43/icon-risk-foundation.svg', '01', 'Insurance Planning', 'ดูชีวิต สุขภาพ รายได้ที่อาจสะดุด และภาระของคนที่บ้าน เทียบกับความคุ้มครองที่มีอยู่'],
  ['/assets/website-43/icon-goal.svg', '02', 'Investment Planning', 'วางเป้าหมาย ระยะเวลา และความเสี่ยงที่รับได้จริง ก่อนเลือกแนวทางลงทุน'],
  ['/assets/website-43/icon-tax-plan.svg', '03', 'Financial Planning', 'เชื่อมรายได้ รายจ่าย หนี้ เงินสำรอง ความคุ้มครอง ภาษี และเป้าหมายระยะยาวให้ทำงานร่วมกัน'],
] as const;

const steps = [
  ['01', 'เข้าใจสถานการณ์', 'ดูชีวิต เป้าหมาย ภาระ และสิ่งที่กำลังกังวล'],
  ['02', 'ดูสิ่งที่มีอยู่แล้ว', 'ดูประกัน เงินเก็บ การลงทุน หรือแผนที่มีอยู่'],
  ['03', 'หา Gap', 'ดูว่าส่วนไหนเพียงพอ ส่วนไหนยังขาด และอะไรอาจไม่จำเป็น'],
  ['04', 'เลือกทางที่เหมาะ', 'ค่อยเลือกว่าจะปรับ เพิ่ม ลด หรือยังไม่ต้องทำอะไร'],
] as const;

const faqs = [
  {
    question: 'CCPun คือใคร?',
    answer: 'CCPun คือผู้ให้คำแนะนำด้านประกันและการลงทุน โดยมีใบอนุญาตตัวแทนประกันชีวิตและผู้แนะนำการลงทุน และใช้แนวทางวางแผนจากชีวิตจริงก่อนเลือกผลิตภัณฑ์',
  },
  {
    question: 'CCPun ช่วยวางแผนเรื่องอะไรได้บ้าง?',
    answer: 'ช่วยวางแผนประกัน การลงทุน และการเงิน โดยดูความคุ้มครอง เงินสำรองและกระแสเงินสด การลงทุนตามเป้าหมาย ภาษี และเกษียณให้ทำงานร่วมกัน',
  },
  {
    question: 'คุยแล้วต้องซื้ออะไรไหม?',
    answer: 'ไม่ต้อง การเริ่มคุยไม่ได้แปลว่าต้องซื้อผลิตภัณฑ์ทันที เราเริ่มจากการทำความเข้าใจสิ่งที่คุณมี เป้าหมาย และสิ่งที่กำลังกังวลก่อน แล้วค่อยตัดสินใจว่าจะปรับ เพิ่ม ลด หรือยังไม่ต้องทำอะไร',
  },
  {
    question: 'ถ้ายังไม่รู้ว่าควรเริ่มจากอะไรทำอย่างไร?',
    answer: 'เริ่มจากเข้าใจสถานการณ์และสิ่งที่มีอยู่ก่อน จากนั้นหา Gap แล้วค่อยเลือกว่าจะปรับ เพิ่ม ลด หรือยังไม่ต้องทำอะไร',
  },
] as const;

export default function Website43Home() {
  return (
    <div className={styles.root}>
      <main id="main-content">
        <section id="home" className={styles.homeHero} aria-labelledby="home-hero-title">
          <div className={styles.homeHeroPicture}>
            <Image src="/assets/website-43/home-hero-desktop.png" alt="CCPun กำลังนั่งทำงานพร้อมคอมพิวเตอร์โน้ตบุ๊ก" fill priority sizes="100vw" />
          </div>
          <div className={styles.homeHeroGradient} aria-hidden="true" />
          <div className={styles.homeHeroBottomGradient} aria-hidden="true" />
          <Website43Navbar overlay />
          <div className={styles.homeHeroCopy}>
            <p className={styles.eyebrow}>วางแผนจากชีวิตจริง ไม่ใช่ผลิตภัณฑ์</p>
            <h1 id="home-hero-title" className={styles.homeHeroTitle}>วางแผนประกัน การลงทุน และความเสี่ยงในชีวิต<br />ให้เหมาะกับคุณจริง ๆ</h1>
            <p className={styles.homeHeroBody}>เริ่มจากสิ่งที่คุณมี สิ่งที่กังวล และเป้าหมายของคุณ ก่อนค่อยเลือกเครื่องมือหรือผลิตภัณฑ์ที่เหมาะสม</p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryButton} href={`${BASE}/tools/financial-health-check`}>เช็กสุขภาพการเงิน</Link>
              <a className={styles.outlineButton} href="https://lin.ee/tqLCs4f" target="_blank" rel="noopener noreferrer" data-analytics-surface="homepage" data-analytics-location="home_hero">คุยกับปั้น</a>
            </div>
            <p className={styles.heroProof}>5+ ปี · 2 ใบอนุญาต · 4 พาร์ทเนอร์</p>
          </div>
        </section>

        <section className={`${styles.sectionDeep} ${styles.sectionTopLarge}`}>
          <div className={styles.inner}>
            <SectionHeading eyebrow="โจทย์ที่พบบ่อย" title="ถ้าเรื่องเงินยังทำให้คุณไม่สบายใจ" description="เราเริ่มจากการมองความเสี่ยงจริง แล้วจัดลำดับสิ่งที่ควรทำก่อน" />
            <div className={styles.threeCols}>
              {pains.map(([icon, title, body]) => (
                <article className={styles.editorialCard} key={title}>
                  <Image className={styles.editorialCardIcon} src={icon} alt="" width={24} height={24} aria-hidden="true" />
                  <h3 className={styles.cardTitle}>{title}</h3>
                  <p className={styles.cardBody}>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.sectionDeep}>
          <div className={styles.inner}>
            <SectionHeading eyebrow="สิ่งที่ CCPun ช่วยวางแผน" title="วางแผนให้ครบ ในสิ่งที่เหมาะกับคุณ" description="เริ่มจากแผนและเป้าหมายของคุณ แล้วค่อยเลือกเครื่องมือหรือผลิตภัณฑ์ที่เหมาะสม" />
            <div className={styles.threeCols}>
              {services.map(([icon, number, title, body]) => (
                <article className={styles.planCard} key={number}>
                  <Image className={styles.editorialCardIcon} src={icon} alt="" width={24} height={24} aria-hidden="true" />
                  <span className={styles.planNum}>{number}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.sectionDeep}>
          <div className={styles.inner}>
            <SectionHeading eyebrow="เริ่มคุยโดยไม่ต้องรีบตัดสินใจ" title="ไม่ต้องซื้ออะไรกับผมก่อน" />
            <div className={styles.reassurance}>การเริ่มคุย ไม่ได้แปลว่าต้องซื้อผลิตภัณฑ์ทันที เราเริ่มจากการทำความเข้าใจสิ่งที่คุณมี เป้าหมาย และสิ่งที่กำลังกังวลก่อน แล้วค่อยตัดสินใจว่าจะปรับ เพิ่ม ลด หรือยังไม่ต้องทำอะไร</div>
          </div>
        </section>

        <section id="about-ccpun" className={styles.about}>
          <div className={styles.aboutInner}>
            <div className={styles.aboutCopy}>
              <p className={styles.eyebrow}>มุมมองของที่ปรึกษา</p>
              <h2 className={styles.h2}>จากคนที่โฟกัสแต่การลงทุน สู่แผนที่เริ่มจากชีวิตจริง</h2>
              <div className={styles.aboutPortraitStage}>
                <Image className={styles.aboutPortrait} src="/assets/website-43/about-pun.png" alt="CCPun" width={400} height={526} sizes="(max-width: 639px) 318px, (max-width: 1023px) 260px, 400px" priority={false} />
              </div>
              <div className={styles.aboutParagraphs}>
                <p>จากคนที่โฟกัสแต่เพียงเรื่องการลงทุน จนเจอเหตุไม่คาดฝัน ผมจึงกลับมาจัดแผนการเงินใหม่จากระดับรากฐาน และเลือกเดินต่อในบทบาทตัวแทนประกันชีวิตกับผู้แนะนำการลงทุน</p>
                <p>จากประสบการณ์ด้านการเงินและการลงทุนกว่า 5 ปี ผมยึดประโยชน์ของลูกค้าเป็นหลัก นำทั้งประสบการณ์ทำงานและเรื่องที่พบเจอในชีวิตจริงมาช่วยเรียงทางเลือกให้เหมาะกับแต่ละคน เพื่อให้แผนสร้างทั้งความมั่นคงและความมั่งคั่งอย่างยั่งยืน</p>
              </div>
              <div className={styles.advisorNote}>“เป้าหมายไม่ใช่ทำให้แผนดูซับซ้อน แต่ทำให้คุณรู้ว่าควรทำอะไรก่อน และเพราะอะไร”</div>
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.sectionTopLarge}`}>
          <div className={styles.inner}>
            <SectionHeading eyebrow="TRUST & VERIFICATION" title="ตรวจสอบได้ ก่อนตัดสินใจ" description="รู้ว่าใครให้ข้อมูล ขอบเขตการช่วยเหลือคืออะไร และข้อมูลสำคัญตรวจสอบกับแหล่งทางการได้" />
            <div className={styles.stats}>
              <div className={styles.stat}><strong>5+ ปี</strong><span>ประสบการณ์ด้านการเงิน</span></div>
              <div className={styles.stat}><strong>2 ใบอนุญาต</strong><span>การลงทุนและประกันชีวิต</span></div>
              <div className={styles.stat}><strong>CFP Paper 1</strong><span>ผ่านชุดวิชาที่ 1 · CMSK</span></div>
            </div>
            <p className={styles.license}>ใบอนุญาต: ตัวแทนประกันชีวิต 6801064783 · ผู้แนะนำการลงทุน 106654 · ตรวจสอบได้กับ คปภ. และ ก.ล.ต.</p>
            <p className={styles.partnerLabel}>พาร์ทเนอร์สำหรับการวางแผน</p>
            <div className={styles.partners}>
              <div className={styles.partner}><strong>AIA</strong><span>ตัวแทนประกันชีวิต</span></div>
              <div className={styles.partner}><strong>Maybank</strong><span>ผู้แนะนำการลงทุนอิสระ</span></div>
              <div className={styles.partner}><strong>PhillipCapital</strong><span>ผู้แนะนำการลงทุนอิสระ</span></div>
              <div className={styles.partner}><strong>Finnomena</strong><span>ผู้แนะนำการลงทุนอิสระ</span></div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.inner}>
            <SectionHeading eyebrow="เสียงจากการพูดคุยจริง" title="เข้าใจมากขึ้น ก่อนตัดสินใจ" />
            <div className={styles.voices}>
              <div className={styles.voice}><blockquote>“หลังจากได้รีวิวแผนประกันกับคุณปั้น รู้สึกว่าได้รับข้อมูลครบถ้วนมากขึ้น และเข้าใจสิทธิที่มีอยู่ชัดขึ้น”</blockquote><cite>คุณ Kittisak</cite></div>
              <div className={styles.voiceDivider} aria-hidden="true" />
              <div className={styles.voice}><blockquote>“คุณปั้นให้คำแนะนำในการปรับแผนประกันสุขภาพ และโรคร้ายแรง หลังจากรีวิวแผนได้ค่อนข้างโอเค”</blockquote><cite>คุณ Maylisa</cite></div>
            </div>
          </div>
        </section>

        <section className={`${styles.sectionDeep} ${styles.sectionTopLarge}`}>
          <div className={styles.inner}>
            <SectionHeading eyebrow="HOW IT WORKS" title="ถ้าเริ่มวางแผนกับ CCPun จะเกิดอะไรขึ้น?" description="คุยกันครั้งแรกไม่ต้องเตรียมอะไรซับซ้อน เราเริ่มจากสถานการณ์จริงก่อนค่อยหาทางที่เหมาะ" />
            <div className={styles.journey}>
              {steps.map(([number, title, body], index) => (
                <article className={styles.step} key={number}>
                  <div className={styles.stepRail}><span className={styles.stepNum}>{number}</span>{index < steps.length - 1 ? <span className={styles.stepLine} /> : null}</div>
                  <h3>{title}</h3><p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.sectionTopLarge}`}>
          <div className={styles.inner}>
            <SectionHeading eyebrow="เลือกจากแผน ไม่ใช่เริ่มจากผลิตภัณฑ์" title="ไม่มีคำตอบเดียวสำหรับทุกคน" description="เครื่องมือแต่ละแบบเหมาะกับเป้าหมายที่ต่างกัน จึงเลือกใช้จากแผน ไม่ใช่เริ่มจากผลิตภัณฑ์" />
            <div className={styles.chips}>
              <span className={styles.chip}>ความคุ้มครอง</span><span className={styles.chip}>เงินสำรองและกระแสเงินสด</span><span className={`${styles.chip} ${styles.chipAccent}`}>การลงทุนตามเป้าหมาย</span><span className={styles.chip}>ภาษีและเกษียณ</span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.inner}>
            <SectionHeading eyebrow="ยังไม่พร้อมคุย ก็เริ่มศึกษาก่อนได้" title="เข้าใจมากขึ้น ก่อนตัดสินใจ" description="เลือกอ่านบทความ หรือทดลองใช้เครื่องมือวางแผนก่อน แล้วค่อยกลับมาคุยเมื่อคุณพร้อม" />
            <div className={styles.learnGrid}>
              <article className={styles.learnCard}>
                <Image className={styles.editorialCardIcon} src="/assets/website-43/icon-financial-health.svg" alt="" width={24} height={24} aria-hidden="true" />
                <span className={styles.planNum}>READ</span><h3>อ่านก่อนตัดสินใจ</h3><p>บทความเรื่องประกัน การลงทุน และการวางแผนการเงิน</p><Link href={`${BASE}/blog`}>ดูบทความทั้งหมด →</Link>
              </article>
              <article className={`${styles.learnCard} ${styles.learnCardAlt}`}>
                <Image className={styles.editorialCardIcon} src="/assets/website-43/icon-protection.svg" alt="" width={24} height={24} aria-hidden="true" />
                <span className={styles.planNum}>TRY</span><h3>ลองประเมินด้วยตัวเอง</h3><p>ตรวจสุขภาพการเงิน · วางแผนเงินก้อนโรคร้ายแรง · เครื่องมืออื่นในอนาคต</p><Link href={`${BASE}/tools/financial-health-check`}>ดูเครื่องมือวางแผน →</Link>
              </article>
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.sectionBottomLarge}`}>
          <div className={styles.inner}>
            <SectionHeading eyebrow="คำถามที่พบบ่อย" title="ก่อนเริ่มวางแผนกับ CCPun" />
            <div className={styles.faqList}>
              {faqs.map(({ question, answer }) => (
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

        <section className={`${styles.sectionDeep} ${styles.sectionTopLarge}`} data-uat-section="contact">
          <div className={styles.inner}>
            <SectionHeading eyebrow="เลือกวิธีเริ่มต้นที่สบายใจกับคุณ" title="ยังไม่แน่ใจว่าควรเริ่มตรงไหน?" description="คุยกับปั้นได้เลย หรือถ้ายังไม่พร้อม ลองเช็กสุขภาพการเงินของตัวเองก่อน" />
            <div className={styles.finalActions}>
              <a className={styles.primaryButton} href="https://lin.ee/tqLCs4f" target="_blank" rel="noopener noreferrer" data-analytics-surface="homepage" data-analytics-location="home_contact">คุยกับปั้น</a>
              <Link className={styles.outlineButton} href={`${BASE}/tools/financial-health-check`}>ลองเช็กตัวเองก่อน</Link>
            </div>
          </div>
        </section>
      </main>
      <Website43Footer warnings />
    </div>
  );
}
