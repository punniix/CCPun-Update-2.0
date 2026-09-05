import styles from './Website43.module.css';

/**
 * Final visual polish after the five-viewport UAT pass.
 *
 * 600 and 1100 remain transition references only. These rules refine geometry
 * inside the existing responsive modes; they intentionally add no new
 * breakpoint at either reference width.
 */
export function Website43FinalPolishStyles() {
  const css = String.raw`
@media (min-width: 1024px) {
  .${styles.footerWrap} {
    padding-left: var(--w43-nav-gutter);
    padding-right: var(--w43-nav-gutter);
  }

  /* Keep portrait subjects below the navigation safe area on image-led heroes. */
  .${styles.blogHeroImage} {
    inset: 80px 0 auto auto;
    height: calc(100% - 18px);
  }
  .${styles.toolHeroImage} {
    inset: 96px 0 auto auto;
    height: 620px;
  }

  /* The 1100 transition reference uses the same fluid shell as navigation. */
  .${styles.toolStorySection} {
    padding-left: var(--w43-nav-gutter);
    padding-right: var(--w43-nav-gutter);
  }

  .${styles.notFound} {
    height: clamp(390px, calc(16.4706vw + 208.8235px), 446px);
    padding-top: clamp(72px, calc(4.70588vw + 20.2353px), 88px);
    padding-bottom: clamp(30px, calc(2.94118vw - 2.35294px), 40px);
  }
  .${styles.notFoundCode} {
    font-size: clamp(96px, calc(7.05882vw + 18.3529px), 120px);
  }
  .${styles.notFoundFooterWrap} {
    padding-top: clamp(16px, calc(7.05882vw - 61.6471px), 40px);
    padding-right: var(--w43-nav-gutter);
    padding-bottom: clamp(0px, calc(11.7647vw - 129.4118px), 40px);
    padding-left: var(--w43-nav-gutter);
  }
}

@media (min-width: 640px) and (max-width: 1023px) {
  .${styles.blogHeroImage} {
    top: 76px;
    right: 0;
    bottom: auto;
    left: auto;
    width: 508px;
    height: 346px;
  }
  .${styles.toolHeroImage} {
    inset: 80px 0 auto 0;
    width: 100%;
    height: 600px;
  }
}

@media (max-width: 1023px) {
  .${styles.notFound} {
    height: auto;
    padding-top: 72px;
  }
  .${styles.notFoundCode} {
    font-size: 96px;
  }
  .${styles.notFoundFooterWrap} {
    padding: 40px;
  }
}

@media (max-width: 639px) {
  .${styles.notFound} {
    padding-top: clamp(48px, calc(3.80952vw + 33.1429px), 56px);
    padding-right: var(--w43-hero-gutter);
    padding-bottom: 40px;
    padding-left: var(--w43-hero-gutter);
  }
  .${styles.notFound} > .${styles.inner} {
    width: var(--w43-mobile-reading-width);
    max-width: 100%;
    margin-right: auto;
    margin-left: 0;
  }
  .${styles.notFoundCode} {
    font-size: 72px;
  }
  .${styles.notFoundActions},
  .${styles.blogRecovery} {
    width: 100%;
  }
  .${styles.notFoundFooterWrap} {
    height: clamp(137px, calc(11.9048vw + 90.5714px), 162px);
    padding-top: 24px;
    padding-right: var(--w43-hero-gutter);
    padding-bottom: 24px;
    padding-left: var(--w43-hero-gutter);
  }
}
`;

  return <style data-w43-final-polish="five-viewport-uat">{css}</style>;
}
