'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import styles from './Website43.module.css';
import { Website43Footer, Website43Navbar } from './Website43Shared';
import { website43ArticlesByPublished, type Website43ArticleItem } from './blogData';

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
  const featuredScrollerRef = useRef<HTMLDivElement>(null);
  const featuredRailRef = useRef<HTMLDivElement>(null);
  const [activeFeatured, setActiveFeatured] = useState(0);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('ทั้งหมด');

  const categories = useMemo(
    () => ['ทั้งหมด', ...Array.from(new Set(website43ArticlesByPublished.map((article) => article.category)))],
    [],
  );

  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('th');
    return website43ArticlesByPublished.filter((article) => {
      const matchesCategory = category === 'ทั้งหมด' || article.category === category;
      const searchable = `${article.title} ${article.excerpt} ${article.category}`.toLocaleLowerCase('th');
      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [category, query]);

  const scrollFeaturedTo = (index: number) => {
    const scroller = featuredScrollerRef.current;
    const rail = featuredRailRef.current;
    const card = rail?.children[index] as HTMLElement | undefined;
    if (!scroller || !card) return;
    const scrollerRect = scroller.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const left = scroller.scrollLeft + (cardRect.left - scrollerRect.left) - (scroller.clientWidth - cardRect.width) / 2;
    scroller.scrollTo({ left, behavior: 'smooth' });
    setActiveFeatured(index);
  };

  const syncFeaturedDot = () => {
    const scroller = featuredScrollerRef.current;
    const rail = featuredRailRef.current;
    if (!scroller || !rail) return;
    const scrollerRect = scroller.getBoundingClientRect();
    const center = scrollerRect.left + scrollerRect.width / 2;
    const cards = Array.from(rail.children) as HTMLElement[];
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - center);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    setActiveFeatured(nearestIndex);
  };

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
            <div className={styles.featuredScroller} ref={featuredScrollerRef} onScroll={syncFeaturedDot}>
              <div className={styles.featuredRail} ref={featuredRailRef}>
                {website43ArticlesByPublished.map((article) => (
                  <Link className={styles.featuredCard} href={article.href} key={article.title} aria-label={article.title}>
                    <img src={article.image} alt="" />
                  </Link>
                ))}
              </div>
            </div>
            <div className={styles.carouselControls} aria-label="เลือกบทความแนะนำ">
              {website43ArticlesByPublished.map((article, index) => (
                <button
                  className={`${styles.carouselDotButton} ${index === activeFeatured ? styles.carouselDotButtonActive : ''}`}
                  type="button"
                  onClick={() => scrollFeaturedTo(index)}
                  aria-label={`แสดงบทความแนะนำ ${index + 1}: ${article.title}`}
                  aria-current={index === activeFeatured ? 'true' : undefined}
                  key={article.title}
                />
              ))}
            </div>
          </div>

          <div className={styles.inner}>
            <div className={styles.searchFilters}>
              <input
                className={styles.searchField}
                type="search"
                placeholder="ค้นหาบทความ…"
                aria-label="ค้นหาบทความ"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <label className={styles.categorySelectWrap}>
                <span className={styles.srOnly}>เลือกหมวดหมู่บทความ</span>
                <select className={styles.categorySelect} value={category} onChange={(event) => setCategory(event.target.value)}>
                  {categories.map((item) => <option value={item} key={item}>{item === 'ทั้งหมด' ? 'ทุกหมวดหมู่' : item}</option>)}
                </select>
                <span className={styles.categoryChevron} aria-hidden="true">⌄</span>
              </label>
            </div>
            <div className={styles.articleListHeading}>
              <h2 className={styles.h2}>บทความทั้งหมด</h2>
              <p className={styles.articleSortNote}>เรียงตามวันที่เผยแพร่ครั้งแรก · ใหม่ไปเก่า</p>
            </div>
            {filteredArticles.length ? (
              <div className={styles.articleGrid}>
                {filteredArticles.map((article) => <ArticleCard article={article} key={article.title} />)}
              </div>
            ) : (
              <div className={styles.emptyState}>ไม่พบบทความที่ตรงกับคำค้นหรือหมวดหมู่ที่เลือก</div>
            )}
          </div>
        </section>
      </main>
      <Website43Footer />
    </div>
  );
}
