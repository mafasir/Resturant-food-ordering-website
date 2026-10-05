"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Tags,
  TicketPercent,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The icons live here rather than in the server layout because component
 * functions cannot be passed across the server/client boundary as props.
 */
const NAV = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", Icon: Receipt },
  { href: "/admin/menu", label: "Menu", Icon: UtensilsCrossed },
  { href: "/admin/categories", label: "Categories", Icon: Tags },
  { href: "/admin/promos", label: "Promo codes", Icon: TicketPercent },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
      {NAV.map(({ href, label, Icon }) => {
        // "/admin" must not stay active while on "/admin/orders".
        const active =
          href === "/admin" ? pathname === href : pathname.startsWith(href);

        return (
          <li key={href} className="shrink-0 lg:shrink">
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-ember-500/15 text-ember-300"
                  : "text-muted hover:bg-surface-2 hover:text-cream",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}