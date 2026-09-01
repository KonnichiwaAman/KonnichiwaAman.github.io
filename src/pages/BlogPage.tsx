import { Link } from "react-router-dom";
import { ArrowRight, BookOpenText, CalendarDays } from "lucide-react";
import { SeoHead } from "@/components/seo/SeoHead";
import { publishedBlogPosts } from "@/data/blogPosts";
import { buildBlogIndexSeo } from "@/lib/seo";

export function BlogPage() {
  const seoMetadata = buildBlogIndexSeo(publishedBlogPosts.length);

  return (
    <>
      <SeoHead metadata={seoMetadata} />

      <div className="mx-auto max-w-5xl py-8 pl-[max(1rem,var(--safe-area-left))] pr-[max(1rem,var(--safe-area-right))] sm:px-6 sm:py-10 lg:px-8">
        <header className="rounded-3xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            <BookOpenText className="h-3.5 w-3.5" />
            ObsidianKit Blog
          </div>

          <h1 className="mt-4 text-2xl font-black tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            SEO, performance, and tool-growth playbooks
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base">
            Tactical guides for building and scaling privacy-first utility websites.
            New playbooks cover ranking strategy, product UX, and monetization without
            sacrificing user trust.
          </p>
        </header>

        <section className="mt-7 sm:mt-9">
          {publishedBlogPosts.length === 0 ? (
            <div className="rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-6 text-sm text-[var(--color-text-secondary)]">
              Blog publishing pipeline is ready. Add entries to
              <span className="font-semibold text-[var(--color-text-primary)]"> src/data/blogPosts.ts</span>
              to publish new posts automatically.
            </div>
          ) : (
            <div className="grid gap-4">
              {publishedBlogPosts.map((post) => (
                <article
                  key={post.slug}
                  className="rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {post.publishedAt}
                    </span>
                    <span>/</span>
                    <span>{post.readingMinutes} min read</span>
                    <span>/</span>
                    <span>By {post.author}</span>
                    {post.updatedAt ? (
                      <>
                        <span>/</span>
                        <span>Updated {post.updatedAt}</span>
                      </>
                    ) : null}
                  </div>

                  <h2 className="mt-3 text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
                    <Link
                      to={`/blog/${post.slug}`}
                      className="mobile-tap-feedback transition-colors active:scale-[0.99] md:hover:text-[var(--color-text-secondary)]"
                    >
                      {post.title}
                    </Link>
                  </h2>

                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {post.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-2.5 py-1 text-[11px] text-[var(--color-text-muted)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <Link
                    to={`/blog/${post.slug}`}
                    className="mobile-tap-feedback mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)] transition-colors active:scale-[0.99] md:hover:text-[var(--color-text-secondary)]"
                  >
                    Read article
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
