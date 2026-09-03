'use client';

import Link from 'next/link';
import styles from './Website43.module.css';
import { Website43Footer, Website43Navbar } from './Website43Shared';
import { WEBSITE43_BASE as BASE } from './constants';

const privacySections = [
  ['1', 'ผู้ควบคุมข้อมูลและขอบเขต', 'CCPUN โดย ชนาธิป ชิตประเสริฐ ในฐานะที่ปรึกษาการเงินส่วนบุคคล เป็นผู้ควบคุมข้อมูลที่เก็บผ่าน ccpun.com เช่น การติดต่อและการใช้เครื่องมือบนเว็บไซต์ นโยบายนี้ครอบคลุมเฉพาะข้อมูลที่ CCPUN ดูแลโดยตรง'],
  ['2', 'ข้อมูลที่เราเก็บ', 'เราอาจเก็บชื่อ ช่องทางติดต่อ ข้อมูลที่คุณเลือกกรอกในแบบฟอร์มหรือเครื่องมือ และข้อมูลทางเทคนิคจากการใช้งานเว็บไซต์ เช่น อุปกรณ์ หน้าเว็บที่เข้าชม และคุกกี้ตามการตั้งค่าของคุณ'],
  ['3', 'เราได้ข้อมูลมาอย่างไรและใช้เพื่ออะไร', 'ข้อมูลส่วนใหญ่มาจากสิ่งที่คุณส่งให้เราเองผ่านเว็บไซต์ LINE หรือช่องทางติดต่ออื่น เพื่อให้ตอบคำถาม นัดหมาย ให้คำปรึกษา ส่งข้อมูลที่เกี่ยวข้อง และปรับปรุงเว็บไซต์ โดยใช้ข้อมูลเท่าที่จำเป็น'],
  ['4', 'ฐานกฎหมาย', 'การใช้ข้อมูลอาจอาศัยความยินยอม การดำเนินการตามคำขอของคุณ ประโยชน์โดยชอบด้วยกฎหมาย หรือหน้าที่ตามกฎหมาย ขึ้นอยู่กับกิจกรรมและประเภทข้อมูล'],
  ['5', 'การส่งต่อข้อมูลและผู้ให้บริการ', 'หากคุณขอให้ดำเนินการต่อกับบริษัทประกัน ผู้ให้บริการการลงทุน หรือผู้ให้บริการทางการเงินอื่น เราอาจส่งข้อมูลที่จำเป็นให้ผู้ให้บริการนั้นเพื่อดำเนินการตามคำขอ เมื่อข้อมูลเข้าสู่ระบบของผู้ให้บริการ การใช้ข้อมูลจะเป็นไปตามนโยบายความเป็นส่วนตัวของผู้ให้บริการนั้นด้วย CCPUN ไม่ขายข้อมูลส่วนบุคคล'],
  ['6', 'ระยะเวลาเก็บรักษา', 'เราเก็บข้อมูลเท่าที่จำเป็นต่อการติดต่อ ให้บริการ ปฏิบัติตามกฎหมาย และพิสูจน์สิทธิ เมื่อหมดความจำเป็นจะลบ ทำลาย หรือทำให้ไม่สามารถระบุตัวบุคคลได้ตามความเหมาะสม'],
  ['7', 'ความปลอดภัยของข้อมูล', 'เราใช้มาตรการทางเทคนิคและการจัดการที่เหมาะสม จำกัดการเข้าถึงเฉพาะผู้ที่จำเป็น และเลือกใช้ผู้ให้บริการที่มีมาตรการคุ้มครองข้อมูล'],
  ['8', 'สิทธิของคุณ', 'คุณอาจขอเข้าถึง แก้ไข ลบ จำกัดการใช้ คัดค้าน ถอนความยินยอม หรือขอรับข้อมูลได้ตามเงื่อนไขของกฎหมาย รวมถึงร้องเรียนต่อหน่วยงานกำกับดูแล'],
  ['9', 'ติดต่อเราและการเปลี่ยนแปลง', 'หากต้องการสอบถามหรือใช้สิทธิ สามารถติดต่อ CCPUN ผ่านช่องทางที่ระบุบนเว็บไซต์ นโยบายนี้อาจปรับเมื่อบริการ เครื่องมือ หรือกฎหมายเปลี่ยน และจะแสดงวันที่อัปเดตล่าสุด'],
] as const;

function LegalHeader({ title, intro, takeaway }: { title: string; intro: string; takeaway: string }) {
  return (
    <header className={styles.legalHeader}>
      <div className={styles.inner}>
        <Link className={styles.legalBack} href={BASE}>← กลับหน้าแรก</Link>
        <h1 className={styles.legalTitle}>{title}</h1>
        <p className={styles.legalUpdated}>อัปเดตล่าสุด: สิงหาคม 2569</p>
        <p className={styles.legalIntro}>{intro}</p>
        <div className={styles.takeaway}>{takeaway}</div>
      </div>
    </header>
  );
}

export function Website43Privacy() {
  return (
    <div className={styles.root}>
      <Website43Navbar />
      <main id="main-content">
        <LegalHeader title="นโยบายความเป็นส่วนตัว" intro="นโยบายนี้อธิบายว่า CCPUN เก็บและใช้ข้อมูลจากการเยี่ยมชมเว็บไซต์ การใช้เครื่องมือ และการติดต่อขอคำปรึกษาอย่างไร รวมถึงกรณีที่คุณขอให้ส่งข้อมูลต่อไปยังผู้ให้บริการที่เกี่ยวข้อง" takeaway="สรุป: เก็บเท่าที่จำเป็น • ไม่ขายข้อมูล • ใช้เพื่อให้บริการและติดต่อกลับ • คุณขอเข้าถึง แก้ไข หรือลบข้อมูลได้" />
        <section className={styles.legalBody}>
          <div className={styles.legalGrid}>
            <nav className={styles.legalIndex} aria-label="สารบัญนโยบายความเป็นส่วนตัว">
              <p>สารบัญ</p>
              {privacySections.map(([number, title]) => <a href={`#privacy-${number}`} key={number}>{number}. {title}</a>)}
            </nav>
            <article className={styles.legalContent}>
              {privacySections.map(([number, title, body]) => <section id={`privacy-${number}`} key={number}><h2>{number}. {title}</h2><p>{body}</p></section>)}
              <Link className={styles.cookieCard} style={{ display: 'block', marginTop: 32, color: '#e0c985', fontWeight: 600 }} href={`${BASE}/cookie-policy`}>อ่านนโยบายคุกกี้ →</Link>
            </article>
          </div>
        </section>
      </main>
      <Website43Footer />
    </div>
  );
}

const cookieCategories = [
  ['คุกกี้ที่จำเป็น', 'ทำให้หน้าเว็บ ระบบความปลอดภัย และการจดจำตัวเลือกความยินยอมทำงาน คุกกี้กลุ่มนี้จำเป็นต่อการให้บริการพื้นฐาน'],
  ['คุกกี้วิเคราะห์', 'ช่วยให้เราเข้าใจการใช้งานเว็บไซต์ในภาพรวม เช่น จำนวนการเข้าชม หน้าและเส้นทางที่ใช้งาน เพื่อนำไปปรับปรุงเว็บไซต์'],
  ['คุกกี้ฟังก์ชัน', 'ช่วยจดจำตัวเลือกหรือการตั้งค่าบางอย่าง เพื่อให้การใช้งานเว็บไซต์ต่อเนื่องและเหมาะกับคุณมากขึ้น'],
  ['คุกกี้การตลาด', 'ใช้วัดผลแคมเปญและการสื่อสาร หรือเชื่อมโยงกับแพลตฟอร์มโฆษณา เมื่อมีการเปิดใช้งานและคุณให้ความยินยอม'],
] as const;

export function Website43CookiePolicy() {
  const openCookieSettings = () => window.dispatchEvent(new Event('ccpun:openCookieSettings'));
  return (
    <div className={styles.root}>
      <Website43Navbar />
      <main id="main-content">
        <LegalHeader title="นโยบายคุกกี้" intro="CCPUN ใช้คุกกี้และเทคโนโลยีที่คล้ายกันเพื่อให้เว็บไซต์ทำงาน จดจำการตั้งค่า เข้าใจการใช้งาน และวัดผลการสื่อสาร โดยส่วนที่ไม่จำเป็นจะทำงานตามการตั้งค่าความยินยอมของคุณ" takeaway="สรุป: คุกกี้จำเป็นทำงานเสมอ • วิเคราะห์/ฟังก์ชัน/การตลาดควบคุมได้ • เปลี่ยนการตั้งค่าได้ทุกเมื่อ" />
        <section className={styles.legalBody}>
          <div className={styles.inner}>
            <h2 className={styles.h2} style={{ marginTop: 0 }}>คุกกี้แต่ละประเภท</h2>
            <div className={styles.cookieCategories}>
              {cookieCategories.map(([title, body]) => <article className={styles.cookieCard} key={title}><h3>{title}</h3><p>{body}</p></article>)}
            </div>
            <h2 className={styles.h2}>การตั้งค่าและผู้ให้บริการ</h2>
            <p className={styles.legalIntro}>คุณเปลี่ยนการตั้งค่าได้ทุกเมื่อจาก “ตั้งค่าคุกกี้” เว็บไซต์อาจใช้ผู้ให้บริการภายนอกด้านการวิเคราะห์หรือวัดผล เช่น Google Analytics หรือแพลตฟอร์มโฆษณาที่ CCPUN เปิดใช้งาน ผู้ให้บริการเหล่านี้อาจมีนโยบายความเป็นส่วนตัวของตนเอง</p>
            <button className={`${styles.outlineButton} ${styles.cookieButton}`} type="button" onClick={openCookieSettings}>ตั้งค่าคุกกี้</button>
            <div><Link className={styles.legalBack} style={{ marginTop: 12 }} href={`${BASE}/privacy`}>อ่านนโยบายความเป็นส่วนตัว →</Link></div>
          </div>
        </section>
      </main>
      <Website43Footer />
    </div>
  );
}
