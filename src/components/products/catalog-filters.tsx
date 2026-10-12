"use client";

import { LoaderCircle, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface CatalogFilterState {
  q: string;
  category: string;
  featured: boolean;
  newArrival: boolean;
}

interface CatalogFiltersProps {
  basePath: string;
  initial: CatalogFilterState;
  /** Category chips; omit on a category page. */
  categories?: { slug: string; name: string }[];
  /** Results, dimmed while a new filter is loading. */
  children: ReactNode;
}

function toQueryString(state: CatalogFilterState): string {
  const params = new URLSearchParams();
  if (state.q.trim()) params.set("q", state.q.trim());
  if (state.category) params.set("category", state.category);
  if (state.featured) params.set("featured", "1");
  if (state.newArrival) params.set("new", "1");
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

const chip =
  "inline-flex h-9 shrink-0 items-center rounded-lg border px-4 text-[13px] font-medium transition-colors";
const chipIdle = "border-line bg-paper text-ink/75 hover:border-ink/40 hover:text-ink";
const chipActive = "border-ink bg-ink text-white";

export function CatalogFilters({ basePath, initial, categories, children }: CatalogFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState(initial);
  const [query, setQuery] = useState(initial.q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-sync when the URL changes from outside (back/forward, links), but not
  // for changes this component made itself (keeps in-progress typing intact).
  const initialKey = toQueryString(initial);
  const [syncedKey, setSyncedKey] = useState(initialKey);
  const [appliedKey, setAppliedKey] = useState(initialKey);
  if (initialKey !== syncedKey) {
    setSyncedKey(initialKey);
    if (initialKey !== appliedKey) {
      setAppliedKey(initialKey);
      setState(initial);
      setQuery(initial.q);
    }
  }

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  function apply(next: CatalogFilterState) {
    setState(next);
    setAppliedKey(toQueryString(next));
    startTransition(() => {
      router.replace(`${basePath}${toQueryString(next)}`, { scroll: false });
    });
  }

  function onQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => apply({ ...state, q: value }), 350);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    apply({ ...state, q: query });
  }

  const hasFilters = Boolean(state.q || state.category || state.featured || state.newArrival);

  function clearAll() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery("");
    apply({ q: "", category: "", featured: false, newArrival: false });
  }

  return (
    <div>
      <div className="flex flex-col gap-4 rounded-(--radius-card) border border-line bg-paper/80 p-3 shadow-(--shadow-card) backdrop-blur sm:p-4 lg:flex-row lg:items-center">
        <form role="search" onSubmit={onSubmit} className="relative lg:w-80 lg:shrink-0">
          <label htmlFor="catalog-search" className="sr-only">
            Search products
          </label>
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
          />
          <input
            id="catalog-search"
            type="search"
            inputMode="search"
            autoComplete="off"
            enterKeyHint="search"
            maxLength={60}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search products..."
            className="h-11 w-full rounded-lg border border-line bg-cream/60 pr-10 pl-10 text-[15px] text-ink transition-colors outline-none placeholder:text-muted focus:border-gold focus:bg-paper"
          />
          {isPending && (
            <LoaderCircle
              aria-hidden
              className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 animate-spin text-gold-deep"
            />
          )}
        </form>

        <div
          role="group"
          aria-label="Filter products"
          className="-mx-3 flex scrollbar-none gap-2 overflow-x-auto px-3 sm:-mx-4 sm:px-4 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0"
        >
          {categories && (
            <>
              <button
                type="button"
                aria-pressed={!state.category}
                onClick={() => apply({ ...state, category: "" })}
                className={cn(chip, !state.category ? chipActive : chipIdle)}
              >
                All
              </button>
              {categories.map((category) => {
                const active = state.category === category.slug;
                return (
                  <button
                    key={category.slug}
                    type="button"
                    aria-pressed={active}
                    onClick={() => apply({ ...state, category: active ? "" : category.slug })}
                    className={cn(chip, active ? chipActive : chipIdle)}
                  >
                    {category.name}
                  </button>
                );
              })}
              <span aria-hidden className="mx-1 my-1.5 w-px shrink-0 bg-line" />
            </>
          )}
          <button
            type="button"
            aria-pressed={state.featured}
            onClick={() => apply({ ...state, featured: !state.featured })}
            className={cn(chip, state.featured ? "border-gold bg-gold-soft text-ink" : chipIdle)}
          >
            Featured
          </button>
          <button
            type="button"
            aria-pressed={state.newArrival}
            onClick={() => apply({ ...state, newArrival: !state.newArrival })}
            className={cn(chip, state.newArrival ? "border-gold bg-gold-soft text-ink" : chipIdle)}
          >
            New Arrivals
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className={cn(chip, "gap-1.5 border-transparent text-muted hover:text-ink")}
            >
              <X aria-hidden className="size-3.5" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div
        aria-busy={isPending}
        className={cn("mt-8 transition-opacity duration-300", isPending && "opacity-50")}
      >
        {children}
      </div>
    </div>
  );
}
