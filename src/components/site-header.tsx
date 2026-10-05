"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu as MenuIcon,
  Package,
  Receipt,
  ShoppingBag,
  User as UserIcon,
  X,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { Logo } from "@/components/logo";
import { logoutAction } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/about", label: "About" },
] as const;

export function SiteHeader({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const { itemCount, ready } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  // Close the account menu on outside click or Escape.
  useEffect(() => {
    if (!accountOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!accountRef.current?.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setAccountOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [accountOpen]);

  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
    setAccountOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const initials = user?.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:h-18 sm:px-6 lg:px-8">
        <Logo />

        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "text-cream"
                  : "text-muted hover:bg-surface-2 hover:text-cream",
              )}
            >
              {link.label}
              {isActive(link.href) ? (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-gold-300 to-ember-400"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
            </Link>
          ))}
          {user ? (
            <Link
              href="/account/orders"
              aria-current={isActive("/account/orders") ? "page" : undefined}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                isActive("/account/orders")
                  ? "text-cream"
                  : "text-muted hover:bg-surface-2 hover:text-cream",
              )}
            >
              Orders
            </Link>
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/menu"
            className="hidden rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-line-strong hover:text-cream sm:block"
          >
            Order now
          </Link>

          {user ? (
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((open) => !open)}
                className="flex items-center gap-2 rounded-xl border border-line bg-surface py-1.5 pl-1.5 pr-2.5 transition hover:border-line-strong"
                aria-expanded={accountOpen}
                aria-haspopup="menu"
              >
                <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-ember-400 to-ember-600 text-[0.7rem] font-bold text-canvas">
                  {initials}
                </span>
                <ChevronDown
                  className={cn(
                    "size-3.5 text-faint transition-transform duration-200",
                    accountOpen && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>

              <AnimatePresence>
                {accountOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.16 }}
                    role="menu"
                    className="surface-card absolute right-0 mt-2 w-60 overflow-hidden p-1.5 shadow-[var(--shadow-lift)]"
                  >
                    <div className="border-b border-line px-3 py-2.5">
                      <p className="truncate text-sm font-semibold text-cream">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-faint">{user.email}</p>
                    </div>
                    <div className="py-1.5">
                      <AccountLink href="/account/orders" icon={Package}>
                        My orders
                      </AccountLink>
                      <AccountLink href="/account" icon={UserIcon}>
                        Account &amp; addresses
                      </AccountLink>
                      {user.role === "ADMIN" ? (
                        <AccountLink href="/admin" icon={LayoutDashboard}>
                          Admin dashboard
                        </AccountLink>
                      ) : null}
                    </div>
                    <form action={logoutAction} className="border-t border-line pt-1.5">
                      <button
                        type="submit"
                        role="menuitem"
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface-3 hover:text-chili-400"
                      >
                        <LogOut className="size-4" aria-hidden />
                        Sign out
                      </button>
                    </form>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium text-cream transition hover:border-line-strong"
            >
              <LogIn className="size-4 text-ember-400" aria-hidden />
              <span className="hidden sm:inline">Sign in</span>
            </Link>
          )}

          <Link
            href="/cart"
            className="relative flex items-center gap-2 rounded-xl bg-gradient-to-br from-gold-300 via-ember-400 to-ember-600 px-3.5 py-2 text-sm font-semibold text-canvas shadow-[0_12px_30px_-14px_rgba(242,85,31,0.95)] transition hover:brightness-110 active:scale-95"
            aria-label={`Cart, ${ready ? itemCount : 0} items`}
          >
            <ShoppingBag className="size-4.5" aria-hidden />
            <span className="hidden sm:inline">Cart</span>
            <AnimatePresence>
              {ready && itemCount > 0 ? (
                <motion.span
                  key={itemCount}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 600, damping: 20 }}
                  className="grid min-w-5 place-items-center rounded-full bg-canvas px-1.5 py-0.5 text-[0.65rem] font-bold text-gold-300"
                >
                  {itemCount}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="grid size-10 place-items-center rounded-xl border border-line bg-surface text-cream transition hover:border-line-strong md:hidden"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <X className="size-5" aria-hidden />
            ) : (
              <MenuIcon className="size-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-line bg-canvas-soft md:hidden"
          >
            <nav className="flex flex-col p-3" aria-label="Mobile">
              {[
                ...NAV_LINKS,
                ...(user ? [{ href: "/account/orders", label: "Orders" }] : []),
              ].map(
                (link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-xl px-4 py-3 text-sm font-medium transition",
                      isActive(link.href)
                        ? "bg-surface-2 text-cream"
                        : "text-muted hover:bg-surface-2 hover:text-cream",
                    )}
                  >
                    {link.label}
                  </Link>
                ),
              )}
              {user ? (
                <>
                  <Link
                    href="/account"
                    className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-cream"
                  >
                    <UserIcon className="size-4" aria-hidden />
                    Account &amp; addresses
                  </Link>
                  {user.role === "ADMIN" ? (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-cream"
                    >
                      <LayoutDashboard className="size-4" aria-hidden />
                      Admin dashboard
                    </Link>
                  ) : null}
                </>
              ) : null}
              {!user ? (
                <Link
                  href="/login"
                  className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-ember-500 px-4 py-3 text-sm font-semibold text-white"
                >
                  <LogIn className="size-4" aria-hidden />
                  Sign in
                </Link>
              ) : null}
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

function AccountLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: typeof Receipt;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface-3 hover:text-cream"
    >
      <Icon className="size-4" aria-hidden />
      {children}
    </Link>
  );
}
