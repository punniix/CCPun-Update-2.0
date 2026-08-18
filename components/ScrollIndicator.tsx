'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrollIndicatorProps {
  /** Ref to the scrollable container element */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Total number of cards/items in the container */
  count: number;
  /** Optional CSS class for wrapper positioning */
  className?: string;
}

/**
 * Apple-style scroll indicator for horizontal swipe sections.
 * Shows only on mobile (md:hidden).
 * - Pagination dots: active = gold, inactive = muted
 * - Arrow chevrons: fade out at start/end edges
 * - Uses scroll events + ResizeObserver to track position
 */
const ScrollIndicator = ({ containerRef, count, className = '' }: ScrollIndicatorProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const rafRef = useRef<number | null>(null);

  const updateState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;

    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < maxScroll - 4);

    // Determine active card index based on scroll position
    if (count > 1 && maxScroll > 0) {
      const index = Math.round((scrollLeft / maxScroll) * (count - 1));
      setActiveIndex(Math.min(Math.max(index, 0), count - 1));
    } else {
      setActiveIndex(0);
    }
  }, [containerRef, count]);

  const handleScroll = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updateState);
  }, [updateState]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Initial state
    updateState();

    el.addEventListener('scroll', handleScroll, { passive: true });

    // Re-check on resize (viewport change may affect scroll math)
    const ro = new ResizeObserver(updateState);
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', handleScroll);
      ro.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef, handleScroll, updateState]);

  const scrollToCard = (index: number) => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    const targetScroll = count > 1 ? (index / (count - 1)) * maxScroll : 0;
    el.scrollTo({ left: targetScroll, behavior: 'smooth' });
  };

  const scrollLeft = () => scrollToCard(Math.max(activeIndex - 1, 0));
  const scrollRight = () => scrollToCard(Math.min(activeIndex + 1, count - 1));

  return (
    <div className={`flex items-center justify-center gap-3 mt-4 md:hidden ${className}`} aria-hidden="true">
      {/* Left chevron */}
      <button
        onClick={scrollLeft}
        className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300 ${
          canScrollLeft
            ? 'opacity-60 hover:opacity-90 cursor-pointer'
            : 'opacity-0 pointer-events-none'
        }`}
        tabIndex={-1}
        aria-hidden="true"
      >
        <ChevronLeft className="w-5 h-5 text-primary" strokeWidth={2} />
      </button>

      {/* Pagination dots */}
      <div className="flex items-center gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToCard(i)}
            tabIndex={-1}
            aria-hidden="true"
            className={`rounded-full transition-all duration-300 cursor-pointer ${
              i === activeIndex
                ? 'w-5 h-1.5 bg-primary'
                : 'w-1.5 h-1.5 bg-foreground/25 hover:bg-foreground/45'
            }`}
          />
        ))}
      </div>

      {/* Right chevron */}
      <button
        onClick={scrollRight}
        className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300 ${
          canScrollRight
            ? 'opacity-60 hover:opacity-90 cursor-pointer'
            : 'opacity-0 pointer-events-none'
        }`}
        tabIndex={-1}
        aria-hidden="true"
      >
        <ChevronRight className="w-5 h-5 text-primary" strokeWidth={2} />
      </button>
    </div>
  );
};

export default ScrollIndicator;
