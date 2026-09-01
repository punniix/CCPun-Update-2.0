"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationItem = { href: string; label: string; children?: Array<{ href: string; label: string }> };

export default function AdminNavigation({ items }: { items: NavigationItem[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="เมนูหน้าควบคุม" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
      {items.map((item) => {
        const exact = pathname === item.href;
        const within = exact || (item.href !== "/snt-admin/dashboard/" && pathname.startsWith(item.href));
        return (
          <div key={item.href} className="shrink-0 lg:min-w-0">
            <Link
              href={item.href}
              aria-current={exact ? "page" : undefined}
              className={`flex min-h-11 items-center whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition ${
                within
                  ? "border-[#e0c985] font-medium text-[#f4df9b]"
                  : "border-transparent text-white/65 hover:border-white/20 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
            {item.children ? (
              <div role="group" className={`${within ? "flex" : "hidden"} ml-2 gap-1 border-l border-white/10 pl-2 lg:flex lg:flex-col`} aria-label={`เมนูย่อย ${item.label}`}>
                {item.children.map((child, index) => {
                  const childActive = pathname === child.href || pathname.startsWith(child.href) || (exact && index === 0);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      aria-current={childActive ? "page" : undefined}
                      className={`flex min-h-11 items-center whitespace-nowrap rounded-lg px-3 py-2 text-xs transition focus:outline-none focus:ring-2 focus:ring-[#e0c985] ${childActive ? "bg-[#e0c985]/10 font-medium text-[#f4df9b]" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
