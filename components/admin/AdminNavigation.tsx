"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationItem = { href: string; label: string };

export default function AdminNavigation({ items }: { items: NavigationItem[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="เมนูหน้าควบคุม" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== "/snt-admin/dashboard/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`min-h-11 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition ${
              active
                ? "border-[#e0c985] font-medium text-[#f4df9b]"
                : "border-transparent text-white/65 hover:border-white/20 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
