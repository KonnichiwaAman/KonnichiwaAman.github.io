import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SeoHead } from "@/components/seo/SeoHead";
import { getPublishedBlogPostBySlug } from "@/data/blogPosts";
import { buildBlogPostSeo, buildNotFoundSeo } from "@/lib/seo";

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPublishedBlogPostBySlug(slug) : undefined;

  if (!post) {
    return (
      <>
        <SeoHead metadata={buildNotFoundSeo(`/blog/${slug ?? ""}`)} />

        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Post not found</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            The article may have moved or is no longer published.
          </p>
          <Link
            to="/blog"
            className="mobile-tap-feedback mt-6 inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] transition-colors active:scale-[0.99] md:hover:text-[var(--color-text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
        </div>
      </>
    );
  }

  const seoMetadata = buildBlogPostSeo(post);

  return (
    <>
      <SeoHead metadata={seoMetadata} />

      <article className="mx-auto max-w-4xl py-8 pl-[max(1rem,var(--safe-area-left))] pr-[max(1rem,var(--safe-area-right))] sm:px-6 sm:py-10 lg:px-8">
        <Link
          to="/blog"
          className="mobile-tap-feedback inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] transition-colors active:scale-[0.99] md:hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        <header className="mt-5 rounded-3xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            <span>{post.publishedAt}</span>
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
          <h1 className="mt-3 text-2xl font-black tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base">
            {post.description}
          </p>
        </header>

        <div className="mt-8 space-y-6">
          {post.sections.map((section) => (
            <section
              key={section.heading}
              className="rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-5 sm:p-6"
            >
              <h2 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
                {section.heading}
              </h2>

              <div className="mt-3 space-y-3">
                {section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-5 sm:p-6">
          <h2 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
            Editorial note
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base">
            This article is maintained by {post.author} and updated when the workflow,
            product behavior, or search guidance changes.
          </p>
        </section>
      </article>
    </>
  );
}
