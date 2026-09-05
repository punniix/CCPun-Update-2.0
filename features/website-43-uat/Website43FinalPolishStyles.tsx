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
/*
 * Floating menus sit over brighter hero/content imagery than Navbar.
 * A darker translucent neutral base preserves the same perceived glass density
 * without changing Navbar itself.
 */
.${styles.navDropdown},
.${styles.mobileMenu},
.${styles.categoryMenuPanel} {
  border-color: rgba(255,255,255,.14);
  background: rgba(20,16,16,.68);
  box-shadow: 0 4px 5px rgba(0,0,0,.04);
  backdrop-filter: blur(9px) saturate(100%);
  -webkit-backdrop-filter: blur(9px) saturate(100%);
}
.${styles.navDropdown}::before {
  background: rgba(20,16,16,.68);
  border-color: rgba(255,255,255,.14);
  box-shadow: none;
}
.${styles.navDropdown}::after {
  background: none;
}

/* Figma uses a centered IMAGE/FILL crop for the Home portrait at every mode. */
.${styles.homeHeroPicture} img {
  object-position: center center;
}

@media (min-width: 1024px) {
  /* 1100 reference uses the same 56px shell gutter as Navbar; 1440 resolves to 80px. */
  .${styles.root} {
    --w43-content-gutter: var(--w43-nav-gutter);
  }

  /*
   * Home hero must interpolate the actual Figma text/gradient geometry between
   * the 1100 transition reference and the 1440 canonical frame. Previously only
   * the left gutter interpolated, leaving the 1440 text widths active at 1100-
   * 1439px and changing the line breaks/crop balance.
   */
  .${styles.homeHeroGradient} {
    width: clamp(840px, calc(82.35294vw - 65.88235px), 1120px);
  }
  .${styles.homeHeroTitle} {
    width: clamp(580.556px, 52.77778vw, 760px);
  }
  .${styles.homeHeroBody} {
    width: clamp(465.972px, 42.36111vw, 610px);
  }
  .${styles.heroActions} {
    margin-left: calc(var(--w43-nav-gutter) - var(--w43-hero-gutter));
  }

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
  /* 390 canonical = 24px content gutter; 600 transition reference = 48px. */
  .${styles.root} {
    --w43-content-gutter: var(--w43-hero-gutter);
  }

  /* Current Figma places the lower Home copy beneath the portrait, not at the stale earlier offsets. */
  .${styles.homeHeroBody} {
    top: 583px;
  }
  .${styles.heroActions} {
    top: 639px;
  }
  .${styles.heroProof} {
    top: 703px;
  }

  /* Cards fill the Figma reading shell: 342px at 390 and 504px at 600. */
  .${styles.threeCols} > *,
  .${styles.stats} > * {
    width: 100%;
  }

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
