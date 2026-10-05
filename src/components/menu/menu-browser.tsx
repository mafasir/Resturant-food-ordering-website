"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal, UtensilsCrossed, X } from "lucide-react";
import { MenuItemCard } from "@/components/menu-item-card";
import { CategoryIcon } from "@/components/category-icon";
import { EmptyState } from "@/components/ui/primitives";
import type { CategoryWithCount, MenuItemView } from "@/lib/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

const SORTS = [
  { value: "featured", label: "Featured first" },
  { value: "rating", label: "Top rated" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "fastest", label: "Quickest to prepare" },
] as const;

const TAG_FILTERS = [
  { value: "", label: "Everything" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "spicy", label: "Spicy" },
  { value: "gluten-free", label: "Gluten free" },
  { value: "signature", label: "Signature" },
] as const;

export function MenuBrowser({
  items,
  categories,
  initialCategory,
  initialQuery,
  initialTag,
  initialSort,
}: {
  items: MenuItemView[];
  categories: CategoryWithCount[];
  initialCategory: string;
  initialQuery: string;
  initialTag: string;
  initialSort: string;
}) {
  const router = useRouter();

  const [search, setSearch] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [tag, setTag] = useState(initialTag);
  const [sort, setSort] = useState(initialSort || "featured");
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Keep the URL shareable without re-rendering the tree on every keystroke.
  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (category) params.set("category", category);
    if (tag) params.set("tag", tag);
    if (sort && sort !== "featured") params.set("sort", sort);
    const query = params.toString();
    const timer = setTimeout(() => {
      router.replace(query ? `/menu?${query}` : "/menu", { scroll: false });
    }, 350);
    return () => clearTimeout(timer);
  }, [search, category, tag, sort, router]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    const matches = items.filter((item) => {
      if (category && item.category.slug !== category) return false;
      if (term) {
        const haystack = `${item.name} ${item.description} ${item.category.name} ${item.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (tag === "vegetarian" && !item.isVeg) return false;
      if (tag === "spicy" && !item.isSpicy) return false;
      if (tag && tag !== "vegetarian" && tag !== "spicy" && !item.tags.includes(tag)) {
        return false;
      }
      return true;
    });

    const sorted = [...matches];
    switch (sort) {
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "fastest":
        sorted.sort((a, b) => a.prepMinutes - b.prepMinutes);
        break;
      default:
        sorted.sort(
          (a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.name.localeCompare(b.name),
        );
    }
    return sorted;
  }, [items, search, category, tag, sort]);

  const resetFilters = useCallback(() => {
    setSearch("");
    setCategory("");
    setTag("");
  }, []);

  const shown = filtered.slice(0, visible);

  const activeCategory = categories.find((item) => item.slug === category);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      {/* ------------------------------------------------------- Filter bar */}
      <div className="sticky top-16 z-30 -mx-4 mb-8 border-b border-line bg-canvas/85 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint"
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setVisible(PAGE_SIZE);
                }}
                placeholder="Search dishes, ingredients or categories…"
                aria-label="Search the menu"
                className="w-full rounded-xl border border-line bg-surface py-3 pl-10 pr-10 text-sm text-cream placeholder:text-faint transition focus:border-ember-500/60 focus:outline-none"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-faint transition hover:text-cream"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              ) : null}
            </div>

            <div className="relative sm:w-56">
              <SlidersHorizontal
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint"
                aria-hidden
              />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                aria-label="Sort dishes"
                className="w-full appearance-none rounded-xl border border-line bg-surface py-3 pl-10 pr-4 text-sm text-cream transition focus:border-ember-500/60 focus:outline-none"
              >
                {SORTS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-surface">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category pills */}
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <CategoryPill
              active={category === ""}
              onClick={() => {
                setCategory("");
                setVisible(PAGE_SIZE);
              }}
            >
              <UtensilsCrossed className="size-3.5" aria-hidden />
              All dishes
            </CategoryPill>
            {categories.map((item) => (
              <CategoryPill
                key={item.id}
                active={category === item.slug}
                onClick={() => {
                  setCategory(category === item.slug ? "" : item.slug);
                  setVisible(PAGE_SIZE);
                }}
              >
                <CategoryIcon name={item.icon} className="size-3.5" />
                {item.name}
                <span className="text-faint">{item._count.items}</span>
              </CategoryPill>
            ))}
          </div>

          {/* Tag filters */}
          <div className="-mx-1 flex flex-wrap gap-2 px-1">
            {TAG_FILTERS.map((option) => (
              <button
                key={option.value || "all"}
                type="button"
                onClick={() => {
                  setTag(option.value);
                  setVisible(PAGE_SIZE);
                }}
                aria-pressed={tag === option.value}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
                  tag === option.value
                    ? "border-ember-500/60 bg-ember-500/15 text-ember-300"
                    : "border-line bg-surface text-muted hover:border-line-strong hover:text-cream",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------- Result meta */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          <span className="font-semibold text-cream">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "dish" : "dishes"}
          {activeCategory ? (
            <>
              {" "}
              in <span className="font-semibold text-cream">{activeCategory.name}</span>
            </>
          ) : null}
          {search.trim() ? (
            <>
              {" "}
              matching{" "}
              <span className="font-semibold text-cream">“{search.trim()}”</span>
            </>
          ) : null}
        </p>
        {search || category || tag ? (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-semibold text-ember-400 transition hover:text-ember-300"
          >
            Clear all filters
          </button>
        ) : null}
      </div>

      {/* ------------------------------------------------------------- Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          art="search"
          icon={<UtensilsCrossed className="size-6" />}
          title="Nothing matches that"
          description="Try a different search term, or clear the filters to see the whole menu."
          action={
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-xl bg-ember-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ember-600"
            >
              Reset filters
            </button>
          }
        />
      ) : (
        <>
          <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {shown.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.22, delay: Math.min(index, 8) * 0.02 }}
                >
                  <MenuItemCard item={item} priority={index < 4} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {visible < filtered.length ? (
            <div className="mt-12 flex flex-col items-center gap-4">
              <p className="text-xs text-faint">
                Showing {shown.length} of {filtered.length}
              </p>
              <div className="h-1 w-48 overflow-hidden rounded-full bg-surface-2">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-gold-300 to-ember-500"
                  animate={{ width: `${(shown.length / filtered.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <button
                type="button"
                onClick={() => setVisible((count) => count + PAGE_SIZE)}
                className="rounded-xl border border-line bg-surface px-6 py-3 text-sm font-semibold text-cream transition hover:border-line-strong"
              >
                Load more dishes
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function CategoryPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition",
        active
          ? "border-ember-500/60 bg-ember-500/15 text-ember-300"
          : "border-line bg-surface text-muted hover:border-line-strong hover:text-cream",
      )}
    >
      {children}
    </button>
  );
}
