"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import ArticleCard from "./ArticleCard";
import type { Article } from "@/lib/content/types";

const CATEGORIES = [
  { id: "all", label: "ทั้งหมด" },
  { id: "การเงินส่วนบุคคล", label: "การเงินส่วนบุคคล" },
  { id: "ประกันชีวิต", label: "ประกันชีวิต" },
  { id: "ประกันสุขภาพและโรคร้ายแรง", label: "ประกันสุขภาพและโรคร้ายแรง" },
  { id: "การลงทุน", label: "การลงทุน" },
];

type Filters = { category: string; query: string };

function readFilters(): Filters {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category") || "all";
  return {
    category: CATEGORIES.some((item) => item.id === category) ? category : "all",
    query: params.get("q") || "",
  };
}

export default function BlogArchive({ articles, showDraft }: { articles: Article[]; showDraft: boolean }) {
  const [filters, setFilters] = useState<Filters>({ category: "all", query: "" });

  useEffect(() => {
    const sync = () => setFilters(readFilters());
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const updateFilters = (category: string, query: string, replace = false) => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (query.trim()) params.set("q", query.trim());
    const url = `/blog/${params.size ? `?${params}` : ""}`;
    window.history[replace ? "replaceState" : "pushState"]({}, "", url);
    setFilters({ category, query });
  };

  const filteredArticles = useMemo(() => {
    const query = filters.query.trim().toLocaleLowerCase("th");
    return articles.filter((article) => {
      const categoryMatch = filters.category === "all" || article.category === filters.category;
      const searchable = [article.title, article.excerpt, article.category, ...(article.tags || [])]
        .join(" ")
        .toLocaleLowerCase("th");
      return categoryMatch && (!query || searchable.includes(query));
    });
  }, [articles, filters]);

  const hasFilters = filters.category !== "all" || Boolean(filters.query.trim());

  return (
    <>
      <section className="py-6 sm:py-8" aria-label="ตัวกรองบทความ">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="hide-scrollbar flex min-w-0 flex-nowrap gap-2 overflow-x-auto pb-1 sm:flex-1 sm:gap-3 lg:flex-wrap lg:overflow-visible">
              {CATEGORIES.map((category) => {
                const active = filters.category === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    data-blog-category={category.id}
                    aria-pressed={active}
                    className={`blog-cat-pill whitespace-nowrap${active ? " blog-cat-pill--active" : ""}`}
                    onClick={() => updateFilters(category.id, filters.query)}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>

            <form
              role="search"
              className="relative w-full shrink-0 sm:w-56"
              onSubmit={(event) => {
                event.preventDefault();
                updateFilters(filters.category, filters.query.trim(), true);
              }}
            >
              <button
                type="submit"
                aria-label="ค้นหาบทความ"
                className="absolute left-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
              </button>
              <label htmlFor="blog-search" className="sr-only">ค้นหาบทความ</label>
              <input
                id="blog-search"
                type="search"
                name="q"
                value={filters.query}
                onChange={(event) => updateFilters(filters.category, event.target.value, true)}
                placeholder="ค้นหาบทความ..."
                className="min-h-11 w-full rounded-full border border-border/50 bg-background/50 py-2.5 pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </form>
          </div>
        </div>
      </section>

      <section className="pb-24 pt-4" aria-live="polite">
        <div className="blog-archive-content mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {filteredArticles.length > 0 ? (
            <div className="blog-archive-grid grid grid-cols-1 gap-6 md:grid-cols-2">
              {filteredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} showDraft={showDraft} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center md:py-20">
              <div className="blog-empty-icon mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full">
                <BookOpen className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
              </div>
              <h2 className="text-base font-medium text-foreground">
                {hasFilters ? "ไม่พบบทความที่ตรงกับตัวกรอง" : "บทความใหม่บน Website 4.0 กำลังเตรียมอยู่"}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                {hasFilters
                  ? "ลองเลือกหมวดอื่น เปลี่ยนคำค้นหา หรือล้างตัวกรองเพื่อดูบทความทั้งหมด"
                  : "ระหว่างช่วง migration คุณยังอ่านบทความที่เผยแพร่แล้วทั้งหมดได้จากคลังบทความเดิม"}
              </p>
              {hasFilters ? (
                <button
                  type="button"
                  className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
                  onClick={() => updateFilters("all", "")}
                >
                  ล้างตัวกรอง
                </button>
              ) : (
                <a href="https://blog.ccpun.com/" className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary">
                  ไปยังคลังบทความเดิม
                </a>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
