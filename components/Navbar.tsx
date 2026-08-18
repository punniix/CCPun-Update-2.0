'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import navConfig from "@/lib/nav-config.json";

const LINE_OA_URL = "https://lin.ee/tqLCs4f";

const TOOLS_ITEMS: { label: string; href: string }[] = navConfig.tools;

type NavbarProps = {
  isToolPage?: boolean;
};

const Navbar = ({ isToolPage = false }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let ticking = false;
    let current = window.scrollY > 50;

    const update = () => {
      const next = window.scrollY > 50;
      if (next !== current) {
        current = next;
        setIsScrolled(next);
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const triggerButton = mobileMenuButtonRef.current;

    const getFocusable = (): HTMLElement[] => {
      const drawer = mobileMenuRef.current;
      if (!drawer) return [];
      return Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null);
    };

    // Move focus into the drawer when it opens (dialog semantics)
    const focusable = getFocusable();
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      mobileMenuRef.current?.focus();
    }

    const drawerContainsActiveElement = () =>
      !!mobileMenuRef.current?.contains(document.activeElement);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
        setIsMobileToolsOpen(false);
        return;
      }

      if (e.key === "Tab") {
        const items = getFocusable();
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (!drawerContainsActiveElement()) {
          // Focus escaped the drawer somehow (e.g. browser chrome) — pull it back in
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      // Return focus to the trigger button on close
      triggerButton?.focus();
    };
  }, [isMobileMenuOpen]);

  // Close tools dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logoHref = isToolPage ? "/" : "#home";
  const homeHref = isToolPage ? "/" : "#home";

  const navLinkClass = (active?: boolean) =>
    `inline-flex min-h-11 items-center transition-colors duration-300 text-sm font-medium relative group focus-visible:outline-none focus-visible:text-primary focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:rounded ${active ? "text-primary" : "text-muted-foreground hover:text-primary"}`;

  return (
    <nav className={`glass-nav transition-shadow duration-500 ${isScrolled ? "shadow-xl shadow-black/20" : ""}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href={logoHref} prefetch={false} className="flex min-h-11 items-center">
            <span className="text-2xl font-bold tracking-tight">
              CC<span className="text-gold-gradient">PUN</span>
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href={homeHref} prefetch={false} className={navLinkClass()}>
              หน้าแรก
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-[width] duration-300 group-hover:w-full" />
            </Link>
            <Link href="/blog/" prefetch={false} className={navLinkClass()}>
              บทความ
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-[width] duration-300 group-hover:w-full" />
            </Link>

            {/* Tools Dropdown — Desktop (click-only) */}
            <div ref={toolsRef} className="relative">
              <button
                className={`${navLinkClass()} gap-1.5 px-3 -mx-3 cursor-pointer`}
                aria-haspopup="menu"
                aria-expanded={isToolsOpen}
                onClick={() => setIsToolsOpen((v) => !v)}
              >
                เครื่องมือ
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${isToolsOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown panel */}
              <div
                className="absolute top-[calc(100%+8px)] left-1/2 w-72 z-[60]"
                style={{
                  visibility: isToolsOpen ? "visible" : "hidden",
                  opacity: isToolsOpen ? 1 : 0,
                  transform: `translateX(-50%) translateY(${isToolsOpen ? "0" : "-8px"})`,
                  transition: "opacity 0.2s ease, transform 0.2s ease, visibility 0.2s",
                  pointerEvents: isToolsOpen ? "auto" : "none",
                }}
              >
                {/* Arrow */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
                  style={{
                    background: "rgba(50,42,42,0.95)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRight: "none",
                    borderBottom: "none",
                  }}
                />
                {/* Panel */}
                <div
                  role="menu"
                  className="rounded-2xl overflow-hidden p-2 shadow-2xl"
                  style={{
                    background: "rgba(50,42,42,0.95)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  {TOOLS_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={false}
                      role="menuitem"
                      onClick={() => setIsToolsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-primary hover:bg-white/8 transition-colors duration-200"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <a href={LINE_OA_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('cta_click', { cta_location: 'navbar', surface_group: 'homepage', contact_channel: 'line' })} className="gold-button text-base px-6 py-3">
              ติดต่อเรา
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            ref={mobileMenuButtonRef}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="md:hidden text-foreground h-11 w-11 inline-flex items-center justify-center hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded"
            aria-label={isMobileMenuOpen ? "ปิดเมนู" : "เปิดเมนู"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="เมนูนำทางมือถือ"
            tabIndex={-1}
            className="md:hidden fixed inset-x-0 top-20 z-[55] max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-white/10 bg-background/95 px-4 pb-6 shadow-2xl shadow-black/40 backdrop-blur-xl"
          >
            <div className="flex flex-col gap-2 pt-4">
              <Link href={homeHref} prefetch={false} onClick={() => setIsMobileMenuOpen(false)} className="flex min-h-11 items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                หน้าแรก
              </Link>
              <Link href="/blog/" prefetch={false} onClick={() => setIsMobileMenuOpen(false)} className="flex min-h-11 items-center text-sm font-medium transition-colors text-muted-foreground hover:text-primary">
                บทความ
              </Link>

              {/* Tools — Mobile expandable */}
              <div>
                <button
                  onClick={() => setIsMobileToolsOpen((v) => !v)}
                  className="flex min-h-11 items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded"
                  aria-expanded={isMobileToolsOpen}
                >
                  <span>เครื่องมือ</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${isMobileToolsOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isMobileToolsOpen && (
                  <div className="pl-4 flex flex-col gap-1 pb-1">
                    {TOOLS_ITEMS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={false}
                        onClick={() => { setIsMobileMenuOpen(false); setIsMobileToolsOpen(false); }}
                        className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/50 flex-shrink-0" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <a href={LINE_OA_URL} target="_blank" rel="noopener noreferrer" onClick={() => { trackEvent('cta_click', { cta_location: 'navbar_mobile', surface_group: 'homepage', contact_channel: 'line' }); setIsMobileMenuOpen(false); }} className="gold-button text-base text-center w-full min-h-12 px-6 py-3">
                ติดต่อเรา
              </a>
            </div>
          </div>
        )}
        {isMobileMenuOpen && (
          <button
            type="button"
            aria-label="ปิดเมนู"
            className="md:hidden fixed inset-0 top-20 z-[54] bg-black/35 backdrop-blur-[2px]"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsMobileToolsOpen(false);
            }}
          />
        )}
      </div>
    </nav>
  );
};

export default Navbar;
