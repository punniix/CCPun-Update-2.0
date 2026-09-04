import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './Website43.module.css';
import { Website43Footer, Website43Navbar } from './Website43Shared';
import { WEBSITE43_BASE as BASE } from './constants';
import { getArticleSemanticTopic } from '@/lib/content/taxonomy';
import { getArticlePath } from '@/lib/content/url';
import {
  website43MirrorArticles,
  type Website43MirrorArticle,
  type Website43MirrorBodyItem,
  type Website43MirrorMarkDef,
} from './blogMirror';

const financialPyramidFallbackFaq = [
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

const thaiDateFormatter = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Bangkok',
});

function textOfBlock(item: Website43MirrorBodyItem) {
  return (item.children ?? []).map((child) => child.text).join('').trim();
}

function inlineContent(item: Website43MirrorBodyItem) {
  const markDefs = new Map<string, Website43MirrorMarkDef>((item.markDefs ?? []).map((mark) => [mark._key, mark]));
  return (item.children ?? []).map((child, index) => {
    const marks = child.marks ?? [];
    let node: ReactNode = child.text;
    if (marks.includes('strong')) node = <strong>{node}</strong>;
    if (marks.includes('em')) node = <em>{node}</em>;
    const linkKey = marks.find((mark) => markDefs.has(mark));
    if (linkKey) {
      const mark = markDefs.get(linkKey);
      if (mark?.href) {
        const rel = [mark.openInNewTab ? 'noopener noreferrer' : '', mark.nofollow ? 'nofollow' : '', mark.sponsored ? 'sponsored' : ''].filter(Boolean).join(' ');
        node = <a href={mark.href} target={mark.openInNewTab ? '_blank' : undefined} rel={rel || undefined}>{node}</a>;
      }
    }
    return <span key={`${item._key ?? 'block'}-${index}`}>{node}</span>;
  });
}

function renderBody(items: Website43MirrorBodyItem[], headingIds: Map<number, string>) {
  const output: ReactNode[] = [];
  let listType: 'bullet' | 'number' | null = null;
  let listItems: Array<{ key: string; content: ReactNode }> = [];

  const flushList = () => {
    if (!listType || !listItems.length) return;
    const children = listItems.map((entry) => <li key={entry.key}>{entry.content}</li>);
    output.push(listType === 'number' ? <ol key={`list-${output.length}`}>{children}</ol> : <ul key={`list-${output.length}`}>{children}</ul>);
    listType = null;
    listItems = [];
  };

  items.forEach((item, index) => {
    if (item._type === 'block' && (item.listItem === 'bullet' || item.listItem === 'number')) {
      if (listType !== item.listItem) flushList();
      listType = item.listItem;
      listItems.push({ key: item._key ?? `li-${index}`, content: inlineContent(item) });
      return;
    }

    flushList();

    if (item._type === 'block') {
      const content = inlineContent(item);
      const id = headingIds.get(index);
      if (item.style === 'h2') output.push(<h2 id={id} key={item._key ?? `h2-${index}`}>{content}</h2>);
      else if (item.style === 'h3') output.push(<h3 id={id} key={item._key ?? `h3-${index}`}>{content}</h3>);
      else if (item.style === 'blockquote') output.push(<blockquote className={styles.articleQuote} key={item._key ?? `quote-${index}`}>{content}</blockquote>);
      else output.push(<p key={item._key ?? `p-${index}`}>{content}</p>);
      return;
    }

    if (item._type === 'migratedImage' && item.src) {
      output.push(
        <figure className={styles.articleInlineFigure} key={item._key ?? `image-${index}`}>
          <img src={item.src} alt={item.alt ?? ''} />
          {item.caption && <figcaption>{item.caption}</figcaption>}
        </figure>,
      );
      return;
    }

    if (item._type === 'simpleTable') {
      output.push(
        <div className={styles.articleTableWrap} key={item._key ?? `table-${index}`}>
          <table className={styles.articleTable}>
            {(item.headers?.length ?? 0) > 0 && <thead><tr>{item.headers?.map((header, cellIndex) => <th key={`${header}-${cellIndex}`}>{header}</th>)}</tr></thead>}
            <tbody>{(item.rows ?? []).map((row, rowIndex) => <tr key={`row-${rowIndex}`}>{row.map((cell, cellIndex) => <td key={`cell-${rowIndex}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      return;
    }

    if (item._type === 'divider') {
      output.push(<hr className={styles.articleDivider} key={item._key ?? `divider-${index}`} />);
      return;
    }

    if (item._type === 'callout' && item.text) {
      output.push(<aside className={styles.articleCallout} key={item._key ?? `callout-${index}`}>{item.title && <strong>{item.title}</strong>}<p>{item.text}</p></aside>);
    }
  });

  flushList();
  return output;
}

export default function Website43Article({ article }: { article: Website43MirrorArticle }) {
  const semanticTopic = getArticleSemanticTopic({
    articleSlug: article.slug,
    categoryTitle: article.category.title,
    categorySlug: article.category.slug,
    tags: article.tags,
  });
  const topicName = semanticTopic?.title ?? article.category.title;
  const updatedAt = article.contentUpdatedAt ?? article.migration?.sourceModifiedAt ?? article.publishedAt;
  const faqItems = article.faq?.length ? article.faq : article.slug === 'financial-pyramid' ? financialPyramidFallbackFaq : [];
  const headings = article.body.flatMap((item, index) => {
    if (item._type !== 'block' || (item.style !== 'h2' && item.style !== 'h3')) return [];
    const label = textOfBlock(item);
    return label ? [{ index, id: `section-${index}`, label, level: item.style === 'h2' ? 2 : 3 }] : [];
  });
  const headingIds = new Map(headings.map((heading) => [heading.index, heading.id]));
  const tocGroups = headings.reduce<Array<{ primary: (typeof headings)[number]; children: Array<(typeof headings)[number]> }>>((groups, heading) => {
    if (heading.level === 2 || groups.length === 0) {
      groups.push({ primary: heading, children: [] });
      return groups;
    }
    groups[groups.length - 1].children.push(heading);
    return groups;
  }, []);
  const related = website43MirrorArticles.filter((candidate) => candidate.slug !== article.slug).slice(0, 2);

  return (
    <div className={styles.root}>
      <Website43Navbar />
      <main id="main-content">
        <header className={styles.articleHeader}>
          <div className={styles.inner}>
            <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
              <Link href={BASE}>หน้าแรก</Link> <span>›</span> <Link href={`${BASE}/blog`}>บทความ</Link> <span>›</span> <span>{topicName}</span>
            </nav>
            <h1 className={styles.articleHeadline}>{article.title}</h1>
            <p className={styles.articleHeaderMeta}>
              โดย {article.author.name} · เผยแพร่เมื่อ {thaiDateFormatter.format(new Date(article.publishedAt))} · อัปเดตล่าสุด {thaiDateFormatter.format(new Date(updatedAt))} · {topicName}
            </p>
            {article.migratedFeaturedImage && (
              <img className={styles.articleFeature} src={article.migratedFeaturedImage.src} alt={article.migratedFeaturedImage.alt} />
            )}
          </div>
        </header>

        <section className={styles.articleReadingWrap}>
          <div className={styles.articleReadingGrid}>
            {headings.length > 0 && (
              <aside className={styles.toc} aria-label="สารบัญบทความ">
                <strong>สารบัญบทความ</strong>
                <div className={styles.tocList}>
                  {tocGroups.map((group) => (
                    <div className={styles.tocGroup} key={group.primary.id}>
                      <a className={styles.tocPrimary} href={`#${group.primary.id}`}><span aria-hidden="true" />{group.primary.label}</a>
                      {group.children.length > 0 && (
                        <div className={styles.tocSublist}>
                          {group.children.map((heading) => <a className={styles.tocSecondary} href={`#${heading.id}`} key={heading.id}>{heading.label}</a>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </aside>
            )}
            {headings.length > 0 && (
              <details className={styles.tocMobile}>
                <summary>สารบัญบทความ</summary>
                <div className={styles.tocMobileList}>
                  {tocGroups.map((group) => (
                    <div className={styles.tocGroup} key={group.primary.id}>
                      <a className={styles.tocPrimary} href={`#${group.primary.id}`}><span aria-hidden="true" />{group.primary.label}</a>
                      {group.children.length > 0 && (
                        <div className={styles.tocSublist}>
                          {group.children.map((heading) => <a className={styles.tocSecondary} href={`#${heading.id}`} key={heading.id}>{heading.label}</a>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            )}
            <article className={styles.prose}>{renderBody(article.body, headingIds)}</article>
          </div>
        </section>

        {article.sources && article.sources.length > 0 && (
          <section className={styles.section}>
            <div className={styles.inner}>
              <h2 className={styles.h2}>แหล่งอ้างอิง</h2>
              <ul className={styles.articleSources}>
                {article.sources.map((source, index) => (
                  <li key={`${source.label}-${index}`}>
                    {source.url ? <a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a> : source.label}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {faqItems.length > 0 && (
          <section id="faq" className={styles.section}>
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
        )}

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
              <p className={styles.authorBio}>{article.author.bio?.trim() || 'ผู้แนะนำการลงทุนและตัวแทนประกันชีวิต เน้นอธิบายจากเป้าหมายและสถานการณ์จริง เพื่อช่วยให้เห็นภาพรวมก่อนตัดสินใจ'}</p>
              <Link className={styles.authorLink} href={`${BASE}#about-ccpun`}>รู้จัก CCPun เพิ่มเติม →</Link>
            </div>
            <p className={styles.articleMeta} style={{ marginTop: 16 }}>บทความนี้มีวัตถุประสงค์เพื่อให้ความรู้ทั่วไป ไม่ใช่คำแนะนำทางการเงิน การลงทุน ภาษี หรือประกันภัยเฉพาะบุคคล</p>
          </div>
        </section>

        {related.length > 0 && (
          <section className={`${styles.sectionDeep} ${styles.sectionTopLarge} ${styles.sectionBottomLarge}`}>
            <div className={styles.inner}>
              <h2 className={styles.h2}>อ่านต่อ</h2>
              <div className={styles.relatedGrid}>
                {related.map((candidate) => {
                  const candidateTopic = getArticleSemanticTopic({ articleSlug: candidate.slug, categoryTitle: candidate.category.title, categorySlug: candidate.category.slug, tags: candidate.tags });
                  const href = `${BASE}${getArticlePath({ slug: candidate.slug, category: candidate.category.title, categorySlug: candidate.category.slug })}`;
                  return (
                    <Link className={styles.articleCard} href={href} key={candidate.slug}>
                      {candidate.migratedFeaturedImage && <img className={styles.articleImage} src={candidate.migratedFeaturedImage.src} alt="" />}
                      <div className={styles.articleCardBody}>
                        <span className={styles.articleCategory}>{candidateTopic?.title ?? candidate.category.title}</span>
                        <h3 className={styles.articleTitle}>{candidate.title}</h3>
                        <p className={styles.articleExcerpt}>{candidate.excerpt?.trim() || candidate.title}</p>
                        <span className={styles.articleCategory}>อ่านบทความ →</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>
      <Website43Footer />
    </div>
  );
}
