import { Suspense, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import { AdSlot } from "@/components/monetization/AdSlot";
import { SupportBanner } from "@/components/monetization/SupportBanner";
import { SeoHead } from "@/components/seo/SeoHead";
import { ToolSeoContent } from "@/components/seo/ToolSeoContent";
import { getToolById } from "@/data/tools";
import { getCategoryById } from "@/data/categories";
import { buildNotFoundSeo, buildToolSeo } from "@/lib/seo";
import { ToolErrorBoundary } from "@/components/ToolErrorBoundary";
import toolRegistry from "@/tools";

function ToolLoader() {
  return (
    <div className="flex min-h-[300px] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-[var(--color-text-muted)]" />
    </div>
  );
}

function ToolPlaceholder() {
  return (
    <div
      className="flex min-h-[400px] flex-col items-center justify-center
                  rounded-2xl border-2 border-dashed border-[var(--color-border-primary)]
                  bg-[var(--color-bg-card)] p-10 text-center"
    >
      <Upload className="mb-4 h-10 w-10 text-[var(--color-text-muted)]" />
      <p className="text-sm font-medium text-[var(--color-text-secondary)]">
        This tool is coming soon
      </p>
      <p className="mt-2 text-xs text-[var(--color-text-muted)]">
        We're working on building this tool. Check back later!
      </p>
    </div>
  );
}

export function ToolPage() {
  const { toolId } = useParams<{ toolId: string }>();

  const tool = toolId ? getToolById(toolId) : undefined;
  const category = tool ? getCategoryById(tool.categoryId) : undefined;
  const ToolComponent = toolId ? toolRegistry[toolId] ?? null : null;

  const pagePath = tool ? tool.path : `/tool/${toolId ?? ""}`;
  const seoMetadata = useMemo(
    () => (tool ? buildToolSeo(tool, category) : buildNotFoundSeo(pagePath)),
    [tool, category, pagePath],
  );

  if (!tool) {
    return (
      <>
        <SeoHead metadata={seoMetadata} />

        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Tool not found
          </h1>
          <Link
            to="/"
            className="mobile-tap-feedback mt-4 inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)]
                     transition-colors active:scale-[0.99] md:hover:text-[var(--color-text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </>
    );
  }

  const Icon = tool.icon;

  return (
    <>
      <SeoHead metadata={seoMetadata} />

      <div className="mx-auto max-w-4xl py-8 pl-[max(1rem,var(--safe-area-left))] pr-[max(1rem,var(--safe-area-right))] sm:px-6 sm:py-10 lg:px-8">
        <article>
          {category && (
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
                <li>
                  <Link
                    to={category.path}
                    className="transition-colors duration-200 md:hover:text-[var(--color-text-primary)]"
                  >
                    {category.name}
                  </Link>
                </li>
                <li aria-hidden="true" className="text-[var(--color-border-hover)]">/</li>
                <li className="font-medium text-[var(--color-text-secondary)]" aria-current="page">
                  {tool.name}
                </li>
              </ol>
            </nav>
          )}

          <header className="mt-5 flex items-start gap-3.5 sm:mt-6 sm:items-center sm:gap-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl
                      border border-[var(--color-border-primary)] bg-[var(--color-bg-card)]
                      text-[var(--color-text-secondary)] sm:h-12 sm:w-12"
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--color-text-primary)] sm:text-xl">
                {tool.name}
              </h1>
              <p className="text-sm text-[var(--color-text-muted)]">{tool.description}</p>
            </div>
          </header>

          <section className="mt-6 sm:mt-8" aria-label={`${tool.name} workspace`} aria-live="polite">
            <ToolErrorBoundary resetKey={tool.id}>
              {ToolComponent ? (
                <Suspense fallback={<ToolLoader />}>
                  <ToolComponent />
                </Suspense>
              ) : (
                <ToolPlaceholder />
              )}
            </ToolErrorBoundary>
          </section>

          <section className="mt-5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-4 py-3.5 sm:mt-6 sm:px-5 sm:py-4">
            <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
              <span className="font-medium text-[var(--color-text-secondary)]">Privacy:</span>{" "}
              File processing for this tool runs locally in your browser. Your selected files stay on
              your device, while optional analytics, ads, or external APIs may still make network
              requests.
            </p>
          </section>

          <ToolSeoContent
            toolName={tool.name}
            categoryName={category?.name ?? "Utilities"}
            categoryPath={category?.path ?? "/tools"}
            toolDescription={tool.description}
          />

          <AdSlot className="mt-6" />
          <SupportBanner className="mt-6" compact />
        </article>
      </div>
    </>
  );
}
