import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdSlot } from "@/components/monetization/AdSlot";
import { SupportBanner } from "@/components/monetization/SupportBanner";
import { SeoHead } from "@/components/seo/SeoHead";
import { categories } from "@/data/categories";
import { publishedBlogPosts } from "@/data/blogPosts";
import { getToolById } from "@/data/tools";
import { buildHomeSeo } from "@/lib/seo";
import type { Tool } from "@/types";
import {
  ArrowRight,
  BookOpen,
  CircleDollarSign,
  Lock,
  ScanSearch,
  Shield,
  Zap,
} from "lucide-react";

const FEATURED_TOOL_IDS = [
  "png-to-jpg",
  "pdf-compressor",
  "image-resizer",
  "video-compressor",
  "bmi-calculator",
  "password-generator",
  "qr-generator",
  "merge-pdf",
] as const;

// Curated high-intent set for the homepage spotlight.
const featuredTools: Tool[] = FEATURED_TOOL_IDS.map((id) => getToolById(id)).filter(
  (tool): tool is Tool => Boolean(tool),
);

const valueProps = [
  {
    icon: Shield,
    title: "100% Private",
    description: "Everything runs on-device in your browser. Files never leave your machine.",
  },
  {
    icon: CircleDollarSign,
    title: "Free Forever",
    description: "No subscriptions, no hidden limits, no account walls. Just open and use.",
  },
  {
    icon: Zap,
    title: "Blazing Fast",
    description: "No server round-trips. Instant interactions and near-zero waiting.",
  },
];

const HeroFlowAnimation = lazy(async () => {
  const module = await import("@/components/HeroFlowAnimation");
  return { default: module.HeroFlowAnimation };
});

export function HomePage() {
  const [showHeroAnimation, setShowHeroAnimation] = useState(true);

  const totalTools = categories.reduce((sum, category) => sum + category.toolCount, 0);
  const seoMetadata = useMemo(
    () => buildHomeSeo(totalTools, categories.length),
    [totalTools],
  );

  useEffect(() => {
    const mobileAnimationQuery = window.matchMedia(
      "(hover: none) and (pointer: coarse), (max-width: 767px)",
    );

    const syncAnimationPreference = () => {
      setShowHeroAnimation(!mobileAnimationQuery.matches);
    };

    syncAnimationPreference();

    if (typeof mobileAnimationQuery.addEventListener === "function") {
      mobileAnimationQuery.addEventListener("change", syncAnimationPreference);
    } else {
      mobileAnimationQuery.addListener(syncAnimationPreference);
    }

    return () => {
      if (typeof mobileAnimationQuery.removeEventListener === "function") {
        mobileAnimationQuery.removeEventListener("change", syncAnimationPreference);
      } else {
        mobileAnimationQuery.removeListener(syncAnimationPreference);
      }
    };
  }, []);

  const latestPosts = publishedBlogPosts.slice(0, 3);

  return (
    <>
      <SeoHead metadata={seoMetadata} />

      <div className="relative overflow-hidden bg-[var(--color-bg-primary)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_75%_at_15%_0%,rgba(181,181,181,0.08),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_70%_at_85%_20%,rgba(120,120,120,0.08),transparent_70%)]" />

      <section className="relative isolate overflow-hidden border-b border-[var(--color-border-primary)]">
        {showHeroAnimation ? (
          <Suspense fallback={null}>
            <HeroFlowAnimation className="absolute inset-0" iconCount={16} />
          </Suspense>
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(10,10,10,0.1)] to-[var(--color-bg-primary)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-end">
            <div className="landing-reveal">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[var(--color-border-primary)] bg-[var(--color-bg-card)]/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                <ScanSearch className="h-3.5 w-3.5" />
                Local-First Utility Platform
              </div>

              <h1 className="home-hero-serif max-w-4xl text-balance text-5xl font-semibold leading-[0.95] tracking-tight text-[var(--color-text-primary)] sm:text-6xl lg:text-8xl">
                Precision Tools for
                <span className="block text-[0.92em] text-[var(--color-text-secondary)]">
                  Private PDF, Image, Video, and Text Workflows.
                </span>
              </h1>

              <p className="mt-6 max-w-3xl text-pretty text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base lg:text-lg">
                A premium browser workspace for modern utility work. {totalTools}+ free tools across
                {categories.length} categories, including PDF compression, image conversion, video
                trimming, and everyday calculators, all processed locally on your device.
              </p>

              <div className="mt-9 flex w-full max-w-xl flex-col gap-3 sm:flex-row">
                <Link
                  to="/tools"
                  className="group mobile-tap-feedback inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border-hover)] bg-[var(--color-text-primary)] px-7 text-sm font-semibold text-[var(--color-bg-primary)] transition-all duration-300 active:scale-[0.985] sm:h-12 sm:w-auto sm:text-[15px] md:hover:scale-[1.015] md:hover:opacity-90"
                >
                  Browse All {totalTools}+ Tools
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 md:group-hover:translate-x-0.5" />
                </Link>

                <Link
                  to="/tool/pdf-compressor"
                  className="mobile-tap-feedback inline-flex h-12 w-full items-center justify-center rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)]/90 px-7 text-sm font-semibold text-[var(--color-text-primary)] transition-colors duration-300 active:scale-[0.985] sm:h-12 sm:w-auto sm:text-[15px] md:hover:border-[var(--color-border-hover)] md:hover:bg-[var(--color-bg-card-hover)]"
                >
                  Try PDF Compressor
                </Link>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)] sm:text-xs">
                <span>Zero Uploads</span>
                <span className="text-[var(--color-border-hover)]">/</span>
                <span>No Sign-Up</span>
                <span className="text-[var(--color-border-hover)]">/</span>
                <span>Private by Design</span>
              </div>
            </div>

            <aside className="landing-reveal landing-reveal-delay-1 hidden rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)]/80 p-5 backdrop-blur-sm lg:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                At a Glance
              </p>

              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-3.5 py-3">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Tool Library</p>
                  <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{totalTools}+</p>
                </div>

                <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-3.5 py-3">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Categories</p>
                  <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{categories.length}</p>
                </div>

                <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-3.5 py-3">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Privacy</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">100% Browser-Side</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="content-visibility-auto mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="landing-reveal landing-reveal-delay-1 mb-10 text-center sm:mb-12">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
            Standards
          </p>
          <h2 className="home-section-serif text-4xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-5xl">
            Built for Serious Work
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base">
            Every interaction is tuned for calm speed, reliability, and confidence across desktop and mobile.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          {valueProps.map((prop, index) => {
            const Icon = prop.icon;
            return (
              <article
                key={prop.title}
                className={`landing-reveal rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-6 py-7 text-left transition-all duration-300 sm:px-7 sm:py-8 md:hover:border-[var(--color-border-hover)] md:hover:bg-[var(--color-bg-card-hover)] ${
                  index === 1 ? "landing-reveal-delay-1" : index === 2 ? "landing-reveal-delay-2" : ""
                }`}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">{prop.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">{prop.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="browse-categories"
        className="content-visibility-auto scroll-mt-24 border-y border-[var(--color-border-primary)] bg-[linear-gradient(180deg,var(--color-bg-secondary),var(--color-bg-primary))]"
      >
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="landing-reveal landing-reveal-delay-1 mb-10 flex flex-col gap-5 sm:mb-12 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                Explore
              </p>
              <h2 className="home-section-serif text-4xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-5xl">
                Browse by Category
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base">
                Structured for speed: move from idea to output in a few clicks.
              </p>
            </div>
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              {categories.length} focused domains
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => {
              const Icon = category.icon;

              return (
                <Link
                  key={category.id}
                  to={category.path}
                  className={`landing-reveal group mobile-tap-feedback rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-5 transition-all duration-300 active:scale-[0.985] sm:p-6 md:hover:border-[var(--color-border-hover)] md:hover:bg-[var(--color-bg-card-hover)] ${
                    index % 3 === 1 ? "landing-reveal-delay-1" : index % 3 === 2 ? "landing-reveal-delay-2" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] transition-colors duration-300 md:group-hover:text-[var(--color-text-primary)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-muted)]">
                      {category.toolCount}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
                    {category.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {category.description}
                  </p>

                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                    Explore
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 md:group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="content-visibility-auto mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="landing-reveal landing-reveal-delay-1 mb-12">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
            Featured
          </p>
          <h2 className="home-section-serif text-4xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-5xl">
            High-Traffic Essentials
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base">
            Popular workflows with polished defaults and zero operational overhead.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredTools.map((tool, index) => {
            const Icon = tool.icon;

            return (
              <Link
                key={tool.id}
                id={`tool-${tool.id}`}
                to={tool.path}
                className={`landing-reveal group mobile-tap-feedback relative overflow-hidden rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-5 transition-all duration-300 active:scale-[0.985] md:hover:border-[var(--color-border-hover)] md:hover:bg-[var(--color-bg-card-hover)] ${
                  index % 4 === 1 ? "landing-reveal-delay-1" : index % 4 === 2 ? "landing-reveal-delay-2" : ""
                }`}
              >
                <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-border-hover)] to-transparent opacity-0 transition-opacity duration-300 md:group-hover:opacity-100" />

                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] transition-colors duration-300 md:group-hover:text-[var(--color-text-primary)]">
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="text-[17px] font-semibold tracking-tight text-[var(--color-text-primary)]">
                  {tool.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {tool.description}
                </p>

                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                  Open Tool
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 md:group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="content-visibility-auto mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <AdSlot />
      </section>

      {latestPosts.length > 0 ? (
        <section className="content-visibility-auto mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-16 lg:px-8">
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                <BookOpen className="h-3.5 w-3.5" />
                Latest Guides
              </p>
              <h2 className="home-section-serif text-4xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-5xl">
                Practical Workflows
              </h2>
            </div>

            <Link
              to="/blog"
              className="mobile-tap-feedback inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)] transition-colors active:scale-[0.99] md:hover:text-[var(--color-text-primary)]"
            >
              View blog
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {latestPosts.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group mobile-tap-feedback rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-5 transition-all active:scale-[0.985] md:hover:border-[var(--color-border-hover)] md:hover:bg-[var(--color-bg-card-hover)]"
              >
                <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  {post.publishedAt} - {post.readingMinutes} min read
                </p>
                <h3 className="mt-3 text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {post.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                  Read guide
                  <ArrowRight className="h-4 w-4 transition-transform md:group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="content-visibility-auto mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <SupportBanner />
      </section>

      <section className="content-visibility-auto px-4 pb-14 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
        <div className="landing-reveal landing-reveal-delay-2 mx-auto max-w-6xl rounded-3xl border border-[var(--color-border-primary)] bg-[linear-gradient(145deg,var(--color-bg-secondary),var(--color-bg-card))] px-5 py-10 text-center sm:px-10 sm:py-14">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)]">
            <Lock className="h-5 w-5" />
          </div>

          <h2 className="home-section-serif text-4xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-5xl">
            Work Faster. Stay Private.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base">
            ObsidianKit keeps your workflows local, clean, and fast. Open a tool and finish the task in seconds.
          </p>

          <div className="mx-auto mt-8 flex w-full max-w-md flex-col items-center justify-center gap-3 sm:mt-9 sm:max-w-none sm:flex-row sm:gap-4">
            <Link
              to="/tools"
              className="group mobile-tap-feedback inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border-hover)] bg-[var(--color-text-primary)] px-7 text-sm font-semibold text-[var(--color-bg-primary)] transition-all duration-300 active:scale-[0.985] sm:w-auto md:hover:scale-[1.015] md:hover:opacity-90"
            >
              Browse All {totalTools}+ Tools
              <ArrowRight className="h-4 w-4 transition-transform duration-300 md:group-hover:translate-x-0.5" />
            </Link>

            <Link
              to="/tool/password-generator"
              className="mobile-tap-feedback inline-flex h-12 w-full items-center justify-center rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-7 text-sm font-semibold text-[var(--color-text-primary)] transition-colors duration-300 active:scale-[0.985] sm:w-auto md:hover:border-[var(--color-border-hover)] md:hover:bg-[var(--color-bg-card-hover)]"
            >
              Try Password Generator
            </Link>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}
