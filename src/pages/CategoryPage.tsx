import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Grid2x2, Search } from "lucide-react";
import { AdSlot } from "@/components/monetization/AdSlot";
import { SeoHead } from "@/components/seo/SeoHead";
import { getCategoryById } from "@/data/categories";
import { getToolsByCategory } from "@/data/tools";
import { buildCategorySeo, buildNotFoundSeo } from "@/lib/seo";
import { ToolCard } from "@/components/ui/ToolCard";

export function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [query, setQuery] = useState("");

  const category = useMemo(
    () => (categoryId ? getCategoryById(categoryId) : undefined),
    [categoryId],
  );
  const categoryTools = useMemo(
    () => (categoryId ? getToolsByCategory(categoryId) : []),
    [categoryId],
  );

  const filteredTools = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return categoryTools;

    return categoryTools.filter((tool) => {
      const haystack = `${tool.name} ${tool.description}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [categoryTools, query]);

  const pagePath = category ? category.path : `/category/${categoryId ?? ""}`;
  const seoMetadata = useMemo(
    () => (category ? buildCategorySeo(category, categoryTools) : buildNotFoundSeo(pagePath)),
    [category, categoryTools, pagePath],
  );

  if (!category) {
    return (
      <>
        <SeoHead metadata={seoMetadata} />

        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Category not found
          </h1>
          <Link
            to="/"
            className="mobile-tap-feedback mt-4 inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)]
                     transition-colors active:scale-[0.985] md:hover:text-[var(--color-text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </>
    );
  }

  const Icon = category.icon;
  const totalTools = categoryTools.length;
  const visibleTools = filteredTools.length;

  return (
    <>
      <SeoHead metadata={seoMetadata} />

      <div className="relative mx-auto max-w-7xl py-7 pl-[max(1rem,var(--safe-area-left))] pr-[max(1rem,var(--safe-area-right))] sm:px-6 sm:py-9 lg:px-8 lg:py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-44 bg-[radial-gradient(circle_at_top,rgba(161,161,170,0.12),transparent_72%)] sm:h-56" />

      <div>
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <li>
              <Link
                to="/"
                className="transition-colors duration-200 md:hover:text-[var(--color-text-primary)]"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-[var(--color-border-hover)]">/</li>
            <li className="font-medium text-[var(--color-text-secondary)]" aria-current="page">
              {category.name}
            </li>
          </ol>
        </nav>

        <section className="mt-5 rounded-3xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-5 sm:mt-6 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-2.5 py-1 text-[11px] font-medium tracking-wide text-[var(--color-text-secondary)]">
                <Grid2x2 className="h-3 w-3" />
                CATEGORY
              </div>

              <div className="flex items-center gap-3.5 sm:gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border-primary)]
                             bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] sm:h-16 sm:w-16"
                >
                  <Icon className="h-5 w-5 animate-[tool-ready-pop_220ms_cubic-bezier(0.22,1,0.36,1)_both] sm:h-7 sm:w-7" />
                </div>

                <div>
                  <h1 className="text-xl font-black tracking-tight text-[var(--color-text-primary)] sm:text-3xl lg:text-4xl">
                    {category.name}
                  </h1>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {category.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-3 sm:w-auto">
              <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-3.5 py-2.5 text-left">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Total</p>
                <p className="mt-0.5 text-xl font-extrabold text-[var(--color-text-primary)]">{totalTools}</p>
              </div>
              <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-3.5 py-2.5 text-left">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Showing</p>
                <p className="mt-0.5 text-xl font-extrabold text-[var(--color-text-primary)]">{visibleTools}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-[var(--color-bg-primary)] p-2 sm:mt-6">
            <label className="flex items-center gap-3 px-3" htmlFor="category-tool-search">
              <Search className="h-4 w-4 text-[var(--color-text-muted)]" />
              <input
                id="category-tool-search"
                type="text"
                aria-label={`Search ${category.name} tools`}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search in ${category.name}...`}
                className="searchbar-input w-full bg-transparent py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
              />
            </label>
          </div>
        </section>

        <section className="mt-7 sm:mt-10">
          {filteredTools.length === 0 ? (
            <div className="rounded-3xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-10 text-center">
              <p className="text-base font-semibold text-[var(--color-text-primary)]">No tools matched your search.</p>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Try a different keyword or clear the filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 sm:mt-10">
          <AdSlot />
        </section>
      </div>
      </div>
    </>
  );
}
