import Link from 'next/link';
import styles from './Website43.module.css';
import { Website43Footer, Website43Navbar } from './Website43Shared';
import { WEBSITE43_BASE as BASE } from './constants';

export default function Website43NotFound() {
  return (
    <div className={styles.root}>
      <Website43Navbar />
      <main id="main-content">
        <section className={styles.notFound}>
          <div className={styles.inner}>
            <p className={styles.notFoundCode}>404</p>
            <h1>ไม่พบหน้าที่คุณกำลังหา</h1>
            <p>ลิงก์อาจเปลี่ยนหรือถูกย้าย ลองกลับหน้าแรกหรือเลือกอ่านบทความเพื่อไปต่อ</p>
            <div className={styles.notFoundActions}>
              <Link className={styles.primaryButton} href={BASE}>กลับหน้าแรก</Link>
              <Link className={styles.blogRecovery} href={`${BASE}/blog`}>ดูบทความ</Link>
            </div>
          </div>
        </section>
      </main>
      <Website43Footer />
    </div>
  );
}
