import Image from 'next/image';
import Link from 'next/link';
import styles from './Website43.module.css';
import { Website43Footer, Website43Navbar } from './Website43Shared';
import { WEBSITE43_BASE as BASE } from './constants';

const toc = [
  ['why-foundation', 'ทำไมต้องเริ่มจากฐาน'],
  ['seven-topics', '7 เรื่องเงินใน 3 กลุ่ม'],
  ['how-to-use', 'วิธีนำไปใช้กับแผนของคุณ'],
  ['faq', 'คำถามที่พบบ่อย'],
] as const;

const articleFaqs = [
  {
    question: 'ควรมีเงินสำรองฉุกเฉินเท่าไร?',
    answer: 'จำนวนที่เหมาะสมขึ้นอยู่กับค่าใช้จ่ายจำเป็น ความมั่นคงของรายได้ ภาระ และคนที่ต้องดูแล จึงควรเริ่มจากมองค่าใช้จ่ายจริงของตัวเองก่อน แล้วกำหนดเงินสำรองที่ช่วยให้รับมือเหตุไม่คาดฝันได้โดยไม่ต้องรีบขายเงินลงทุน',
  },
  {
    question: 'มีประกันแล้ว ยังต้องทบทวนความคุ้มครองไหม?',
    answer: 'ควรทบทวนเมื่อชีวิต รายได้ ภาระ สวัสดิการ หรือคนที่ต้องดูแลเปลี่ยนไป เพื่อดูว่าความคุ้มครองเดิมยังสัมพันธ์กับสถานการณ์ปัจจุบันหรือไม่',
  },
  {
    question: 'ควรเริ่มลงทุนเมื่อไร?',
    answer: 'ก่อนเริ่มลงทุนควรมองภาพรวมของเงินสำรอง หนี้ดอกเบี้ยสูง ความคุ้มครอง เป้าหมาย ระยะเวลา และความเสี่ยงที่รับได้ แล้วค่อยเลือกแนวทางลงทุนที่สอดคล้องกับแผนของตัวเอง',
  },
] as const;

export default function Website43Article() {
  return (
    <div className={styles.root}>
      <Website43Navbar />
      <main id="main-content">
        <header className={styles.articleHeader}>
          <div className={styles.inner}>
            <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
              <Link href={BASE}>หน้าแรก</Link> <span>›</span> <Link href={`${BASE}/blog`}>บทความ</Link> <span>›</span> <span>การเงินส่วนบุคคล</span>
            </nav>
            <h1 className={styles.articleHeadline}>พีระมิดทางการเงิน คืออะไร? วางรากฐานก่อนลงทุน</h1>
            <p className={styles.articleHeaderMeta}>โดย Pun · อ่าน 6 นาที · เผยแพร่เมื่อ 2 มีนาคม 2569 · อัปเดตล่าสุด 1 กันยายน 2569 · การเงินส่วนบุคคล</p>
            <img className={styles.articleFeature} src="/assets/blog-migration/financial-pyramid/featured-01-Financial-Pyramid-Article.png" alt="พีระมิดทางการเงิน" />
          </div>
        </header>

        <section className={styles.articleReadingWrap}>
          <div className={styles.articleReadingGrid}>
            <aside className={styles.toc} aria-label="สารบัญบทความ">
              <strong>สารบัญบทความ</strong>
              {toc.map(([id, label]) => <a href={`#${id}`} key={id}>{label}</a>)}
            </aside>
            <details className={styles.tocMobile}>
              <summary>สารบัญบทความ</summary>
              {toc.map(([id, label]) => <a href={`#${id}`} key={id}>{label}</a>)}
            </details>
            <article className={styles.prose}>
              <p>พีระมิดทางการเงินช่วยให้เราเห็นว่า เรื่องเงินบางอย่างควรทำก่อนเรื่องอื่น เพราะรากฐานที่ไม่มั่นคงทำให้เป้าหมายระยะยาวสะดุดได้ง่าย</p>

              <h2 id="why-foundation">ทำไมต้องเริ่มจากฐานก่อน</h2>
              <p>หลายคนเริ่มลงทุนทันทีเพราะอยากให้เงินโต แต่ถ้ายังไม่มีเงินสำรองฉุกเฉิน มีหนี้ดอกเบี้ยสูง หรือความคุ้มครองไม่พอ การลงทุนอาจถูกบังคับให้ขายในเวลาที่ไม่เหมาะสม</p>
              <blockquote className={styles.articleQuote}>“ฐานที่ดีไม่ได้ทำให้คุณรวยช้าลง แต่ช่วยให้ไม่ต้องเริ่มใหม่ทุกครั้งที่ชีวิตสะดุด”</blockquote>

              <h2 id="seven-topics">7 เรื่องเงินใน 3 กลุ่มที่ควรทบทวนให้เชื่อมกัน</h2>
              <h3>กลุ่ม 1 · ความมั่นคงพื้นฐาน</h3>
              <p>01 เงินสำรองฉุกเฉิน<br />02 จัดการหนี้ดอกเบี้ยสูง<br />03 ความคุ้มครองชีวิตและสุขภาพ</p>
              <h3>กลุ่ม 2 · เป้าหมายที่ต้องใช้เงิน</h3>
              <p>04 เงินก้อนระยะสั้นและกลาง<br />05 เป้าหมายครอบครัวและการศึกษา</p>
              <h3>กลุ่ม 3 · การเติบโตระยะยาว</h3>
              <p>06 การลงทุนตามเป้าหมายและความเสี่ยง<br />07 เกษียณและส่งต่อทรัพย์สิน</p>

              <h2 id="how-to-use">วิธีนำไปใช้กับแผนของคุณ</h2>
              <p>เริ่มจากจดรายได้ รายจ่าย หนี้ เงินสำรอง และความคุ้มครองที่มีอยู่ จากนั้นกำหนดเป้าหมายพร้อมระยะเวลา แล้วค่อยจัดเงินลงทุนให้สอดคล้องกับความเสี่ยงที่รับได้ ควรทบทวนเมื่อชีวิต รายได้ หรือภาระเปลี่ยน</p>
              <h3>แหล่งข้อมูลและข้อจำกัด</h3>
              <p>แนวคิดนี้ใช้เพื่อจัดลำดับการวางแผนทั่วไป ไม่ใช่สูตรตายตัว และไม่ทดแทนคำแนะนำที่พิจารณาข้อมูลเฉพาะบุคคล</p>
            </article>
          </div>
        </section>

        <section id="faq" className={styles.section}>
          <div className={styles.inner}>
            <h2 className={styles.h2}>คำถามที่พบบ่อย</h2>
            <div className={styles.faqList}>
              {articleFaqs.map(({ question, answer }) => (
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

        <section className={`${styles.sectionDeep} ${styles.sectionTopLarge} ${styles.sectionBottomLarge}`}>
          <div className={styles.inner}>
            <h2 className={styles.h2}>อยากจัดลำดับแผนให้เหมาะกับชีวิตคุณ?</h2>
            <p className={styles.lead} style={{ color: '#faf9f9' }}>เตรียมข้อมูลรายได้ รายจ่าย หนี้ และเป้าหมาย แล้วคุยกันแบบเห็นภาพรวม</p>
            <a className={styles.primaryButton} style={{ width: 200, marginTop: 20 }} href="https://lin.ee/tqLCs4f" target="_blank" rel="noopener noreferrer">คุยกับ Pun ทาง LINE</a>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.inner}>
            <div className={styles.authorCard}>
              <Image className={styles.authorAvatar} src="/assets/pun.jpg" alt="ชนาธิป ชิตประเสริฐ" width={96} height={96} sizes="(max-width: 639px) 72px, 96px" />
              <div className={styles.authorIdentity}>
                <strong className={styles.authorName}>ชนาธิป ชิตประเสริฐ</strong>
                <span className={styles.authorRole}>ที่ปรึกษาการเงินส่วนบุคคล</span>
              </div>
              <p className={styles.authorBio}>ผู้แนะนำการลงทุนและตัวแทนประกันชีวิต เน้นอธิบายจากเป้าหมายและสถานการณ์จริง เพื่อช่วยให้เห็นภาพรวมก่อนตัดสินใจ</p>
              <Link className={styles.authorLink} href={`${BASE}#about-ccpun`}>รู้จัก CCPun เพิ่มเติม →</Link>
            </div>
            <p className={styles.articleMeta} style={{ marginTop: 16 }}>บทความนี้มีวัตถุประสงค์เพื่อให้ความรู้ทั่วไป ไม่ใช่คำแนะนำทางการเงิน การลงทุน ภาษี หรือประกันภัยเฉพาะบุคคล</p>
          </div>
        </section>

        <section className={`${styles.sectionDeep} ${styles.sectionTopLarge} ${styles.sectionBottomLarge}`}>
          <div className={styles.inner}>
            <h2 className={styles.h2}>อ่านต่อ</h2>
            <div className={styles.relatedGrid}>
              <Link className={styles.articleCard} href={`${BASE}/blog/health-insurance/aia-vitality`}>
                <img className={styles.articleImage} src="/assets/blog-migration/aia-vitality/featured-01-financial-basewealth-by-ccpun-template-vitality-1.webp" alt="" />
                <div className={styles.articleCardBody}><h3 className={styles.articleTitle}>รู้จัก AIA Vitality สุขภาพดี มีเงินคืน</h3><p className={styles.articleExcerpt}>สิทธิประโยชน์มีอะไรบ้าง และต้องทำอย่างไรถึงจะได้ส่วนลดหรือเงินคืน</p><span className={styles.articleCategory}>อ่านบทความ →</span></div>
              </Link>
              <Link className={styles.articleCard} href={`${BASE}/blog/critical-illness-insurance/critical-illness-insurance`}>
                <img className={styles.articleImage} src="/assets/blog-migration/critical-illness-insurance/featured-01-Financial-Basewealth-by-CCPun-Template.png" alt="" />
                <div className={styles.articleCardBody}><h3 className={styles.articleTitle}>ประกันโรคร้ายแรง ต่างจากประกันสุขภาพอย่างไร</h3><p className={styles.articleExcerpt}>เข้าใจบทบาทเงินก้อนกับค่ารักษา เพื่อวางความคุ้มครองไม่ซ้ำและไม่ขาด</p><span className={styles.articleCategory}>อ่านบทความ →</span></div>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Website43Footer />
    </div>
  );
}
