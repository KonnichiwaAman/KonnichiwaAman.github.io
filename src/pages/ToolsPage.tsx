import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Grid2x2, Search } from "lucide-react";
import { AdSlot } from "@/components/monetization/AdSlot";
import { SeoHead } from "@/components/seo/SeoHead";
import { ToolCard } from "@/components/ui/ToolCard";
import { categories } from "@/data/categories";
import { getToolsByCategory, tools } from "@/data/tools";
import { buildToolsIndexSeo } from "@/lib/seo";

export function ToolsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(queryParam);
  const seoMetadata = buildToolsIndexSeo(tools, categories);

  useEffect(() => {
    setQuery(queryParam);
  }, [queryParam]);

  function updateQuery(nextQuery: string) {
    setQuery(nextQuery);
    const trimmed = nextQuery.trim();
    setSearchParams(trimmed ? { q: trimmed } : {}, { replace: true });
  }

  const groupedTools = useMemo(() => {
    const term = query.trim().toLowerCase();

    return categories
      .map((category) => {
        const categoryTools = getToolsByCategory(category.id);
        const filteredTools = term
          ? categoryTools.filter((tool) => {
              const haystack = `${tool.name} ${tool.description} ${category.name}`.toLowerCase();
              return haystack.includes(term);
            })
          : categoryTools;

        return {
          category,
          tools: filteredTools,
        };
      })
      .filter((group) => group.tools.length > 0);
  }, [query]);

  const visibleToolCount = groupedTools.reduce((sum, group) => sum + group.tools.length, 0);

  return (
    <>
      <SeoHead metadata={seoMetadata} />

      <div className="relative mx-auto max-w-7xl py-7 pl-[max(1rem,var(--safe-area-left))] pr-[max(1rem,var(--safe-area-right))] sm:px-6 sm:py-9 lg:px-8 lg:py-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-44 bg-[radial-gradient(circle_at_top,rgba(161,161,170,0.12),transparent_72%)] sm:h-56" />

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
              All Tools
            </li>
          </ol>
        </nav>

        <header className="mt-3 rounded-3xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                <Grid2x2 className="h-3 w-3" />
                Tool Directory
              </div>

              <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-primary)] sm:text-4xl lg:text-5xl">
                All ObsidianKit Tools
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base">
                Search every private, browser-based utility in one place: PDF tools, image tools,
                media converters, calculators, unit converters, and developer workflows.
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-3 sm:w-auto">
              <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-3.5 py-2.5 text-left">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  Total
                </p>
                <p className="mt-0.5 text-xl font-extrabold text-[var(--color-text-primary)]">
                  {tools.length}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-3.5 py-2.5 text-left">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  Showing
                </p>
                <p className="mt-0.5 text-xl font-extrabold text-[var(--color-text-primary)]">
                  {visibleToolCount}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-[var(--color-bg-primary)] p-2 sm:mt-6">
            <label className="flex items-center gap-3 px-3" htmlFor="all-tool-search">
              <Search className="h-4 w-4 text-[var(--color-text-muted)]" />
              <input
                id="all-tool-search"
                type="search"
                aria-label="Search all ObsidianKit tools"
                value={query}
                onChange={(event) => updateQuery(event.target.value)}
                placeholder="Search all tools..."
                className="searchbar-input w-full bg-transparent py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
              />
            </label>
          </div>
        </header>

        {groupedTools.length === 0 ? (
          <section className="mt-7 rounded-3xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-10 text-center">
            <p className="text-base font-semibold text-[var(--color-text-primary)]">
              No tools matched your search.
            </p>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Try a shorter keyword or browse the categories below.
            </p>
          </section>
        ) : (
          <div className="mt-8 space-y-10">
            {groupedTools.map(({ category, tools: categoryTools }) => {
              const Icon = category.icon;

              return (
                <section key={category.id} aria-labelledby={`${category.id}-heading`}>
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] text-[var(--color-text-secondary)]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h2
                          id={`${category.id}-heading`}
                          className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]"
                        >
                          {category.name}
                        </h2>
                        <p className="text-sm text-[var(--color-text-muted)]">
                          {categoryTools.length} tool{categoryTools.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>

                    <Link
                      to={category.path}
                      className="mobile-tap-feedback inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)] transition-colors active:scale-[0.99] md:hover:text-[var(--color-text-primary)]"
                    >
                      View category
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                    {categoryTools.map((tool) => (
                      <ToolCard key={tool.id} tool={tool} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <section className="mt-8 sm:mt-10">
          <AdSlot />
        </section>
      </div>
    </>
  );
}
