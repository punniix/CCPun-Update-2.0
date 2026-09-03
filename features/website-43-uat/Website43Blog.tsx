import Link from 'next/link';
import styles from './Website43.module.css';
import { Website43Footer, Website43Navbar } from './Website43Shared';
import { website43Articles, type Website43ArticleItem } from './blogData';

function ArticleCard({ article }: { article: Website43ArticleItem }) {
  return (
    <Link className={styles.articleCard} href={article.href}>
      <img className={styles.articleImage} src={article.image} alt="" />
      <div className={styles.articleCardBody}>
        <span className={styles.articleCategory}>{article.category}</span>
        <h2 className={styles.articleTitle}>{article.title}</h2>
        <p className={styles.articleExcerpt}>{article.excerpt}</p>
        <p className={styles.articleMeta}>{article.meta}</p>
      </div>
    </Link>
  );
}

export default function Website43Blog() {
  return (
    <div className={styles.root}>
      <main id="main-content">
        <section className={styles.blogHero} aria-labelledby="blog-title">
          <img className={styles.blogHeroImage} src="/assets/website-43/blog-hero.png" alt="" />
          <div className={styles.blogHeroGradient} aria-hidden="true" />
          <Website43Navbar overlay />
          <div className={styles.blogHeroCopy}>
            <h1 id="blog-title">บทความ</h1>
            <p>เคล็ดลับการเงิน การลงทุน และการวางแผนอนาคต</p>
          </div>
        </section>

        <section className={styles.blogContent}>
          <div className={styles.inner}>
            <p className={styles.eyebrow}>บทความแนะนำ</p>
          </div>
          <div className={styles.featuredViewport} aria-label="บทความแนะนำ">
            <div className={styles.featuredRail}>
              {website43Articles.map((article) => (
                <Link className={styles.featuredCard} href={article.href} key={article.title} aria-label={article.title}>
                  <img src={article.image} alt="" />
                </Link>
              ))}
            </div>
            <div className={styles.carouselControls} aria-hidden="true">
              <span className={`${styles.carouselDot} ${styles.carouselDotActive}`} />
              <span className={styles.carouselDot} /><span className={styles.carouselDot} /><span className={styles.carouselDot} /><span className={styles.carouselDot} />
            </div>
          </div>

          <div className={styles.inner}>
            <div className={styles.searchFilters}>
              <input className={styles.searchField} type="search" placeholder="ค้นหาบทความ…" aria-label="ค้นหาบทความ" />
              <button className={styles.categoryButton} type="button" aria-label="ทุกหมวดหมู่">ทุกหมวดหมู่ <span aria-hidden="true">⌄</span></button>
            </div>
            <h2 className={styles.h2}>บทความทั้งหมด</h2>
            <div className={styles.articleGrid}>
              {website43Articles.map((article) => <ArticleCard article={article} key={article.title} />)}
            </div>
          </div>
        </section>
      </main>
      <Website43Footer />
    </div>
  );
}
