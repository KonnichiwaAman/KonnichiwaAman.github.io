import type { Category, Tool } from "../types";
import {
  DEFAULT_OG_IMAGE_URL,
  SITE_LOCALE,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from "./siteConfig";
import { getToolKeywordCluster } from "../data/toolKeywordMap";

export type JsonLdObject = Record<string, unknown>;

export interface SeoMetadata {
  title: string;
  description: string;
  keywords: string[];
  path: string;
  imageUrl?: string;
  ogType?: "website" | "article";
  noindex?: boolean;
  structuredData?: JsonLdObject[];
}

const BASE_KEYWORDS = [
  "ObsidianKit",
  "free online tools",
  "client-side tools",
  "private browser tools",
  "no upload utilities",
  "PDF tools",
  "image tools",
  "video tools",
  "calculators",
  "converters",
];

function normalizePath(path: string): string {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

function trimMetaDescription(description: string): string {
  const compact = description.replace(/\s+/g, " ").trim();
  if (compact.length <= 158) return compact;
  return `${compact.slice(0, 155).trimEnd()}...`;
}

function dedupeKeywords(keywords: string[]): string[] {
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const keyword of keywords) {
    const normalized = keyword.trim();
    if (!normalized) continue;

    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(normalized);
  }

  return cleaned;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function toAbsoluteUrl(path: string): string {
  return new URL(normalizePath(path), SITE_URL).toString();
}

function buildBreadcrumbSchema(entries: Array<{ name: string; path: string }>): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: toAbsoluteUrl(entry.path),
    })),
  };
}

export function buildHomeSeo(totalTools: number, totalCategories: number): SeoMetadata {
  const description = trimMetaDescription(
    `${SITE_NAME} is a fast, monochrome workspace with ${totalTools}+ free tools across ${totalCategories} categories. ` +
      "Compress PDFs, convert images, trim videos, run calculators, and process files privately in your browser.",
  );

  return {
    title: `${SITE_NAME} - ${totalTools}+ Free Online Tools (Private & Client-Side)`,
    description,
    keywords: dedupeKeywords([
      ...BASE_KEYWORDS,
      `${SITE_NAME} tools`,
      "online PDF compressor",
      "image converter online",
      "video converter online",
      "productivity tools",
      "web utilities",
    ]),
    path: "/",
    imageUrl: DEFAULT_OG_IMAGE_URL,
    ogType: "website",
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        inLanguage: SITE_LOCALE,
        description,
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/tools?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: SITE_NAME,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any",
        url: SITE_URL,
        inLanguage: SITE_LOCALE,
        description: SITE_TAGLINE,
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        featureList: [
          `${totalTools}+ browser-based tools`,
          "No file uploads required",
          "Client-side processing by design",
          "Works on desktop and mobile",
        ],
      },
    ],
  };
}

export function buildToolsIndexSeo(allTools: Tool[], allCategories: Category[]): SeoMetadata {
  const description = trimMetaDescription(
    `Browse all ${allTools.length}+ free ${SITE_NAME} tools in one searchable directory. ` +
      "Find PDF compressors, image converters, calculators, text utilities, and private browser-based workflows.",
  );

  return {
    title: `All Tools - ${allTools.length}+ Free Online Utilities | ${SITE_NAME}`,
    description,
    keywords: dedupeKeywords([
      ...BASE_KEYWORDS,
      "all online tools",
      "free web utilities",
      "PDF compressor online",
      "image tools online",
      "calculator tools",
      ...allCategories.map((category) => category.name),
      ...allTools.slice(0, 20).map((tool) => `${tool.name} online`),
    ]),
    path: "/tools",
    imageUrl: DEFAULT_OG_IMAGE_URL,
    ogType: "website",
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `All ${SITE_NAME} Tools`,
        url: toAbsoluteUrl("/tools"),
        inLanguage: SITE_LOCALE,
        description,
        isPartOf: {
          "@type": "WebSite",
          name: SITE_NAME,
          url: SITE_URL,
        },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: allTools.length,
          itemListElement: allTools.map((tool, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: tool.name,
            url: toAbsoluteUrl(tool.path),
          })),
        },
      },
      buildBreadcrumbSchema([
        { name: SITE_NAME, path: "/" },
        { name: "All Tools", path: "/tools" },
      ]),
    ],
  };
}

export function buildCategorySeo(category: Category, categoryTools: Tool[]): SeoMetadata {
  const categoryUrl = toAbsoluteUrl(category.path);
  const topToolNames = categoryTools.slice(0, 4).map((tool) => tool.name);
  const spotlightText = topToolNames.length
    ? `Popular choices include ${topToolNames.join(", ")}.`
    : "Explore streamlined workflows for this category.";

  const description = trimMetaDescription(
    `${category.name} on ${SITE_NAME}: ${categoryTools.length} free tools for everyday workflows. ` +
      `${spotlightText} 100% browser-based and privacy-first.`,
  );

  const itemListElement = categoryTools.map((tool, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: tool.name,
    url: toAbsoluteUrl(tool.path),
    item: {
      "@type": "SoftwareApplication",
      additionalType: "https://schema.org/Tool",
      name: tool.name,
      applicationCategory: category.name,
      operatingSystem: "Web Browser",
      isAccessibleForFree: true,
      description: tool.description,
      url: toAbsoluteUrl(tool.path),
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
  }));

  return {
    title: `${category.name} - ${categoryTools.length} Free Online Tools | ${SITE_NAME}`,
    description,
    keywords: dedupeKeywords([
      ...BASE_KEYWORDS,
      category.name,
      `${category.name} tools`,
      `${category.name.toLowerCase()} online`,
      ...categoryTools.slice(0, 6).map((tool) => `${tool.name} online`),
    ]),
    path: category.path,
    imageUrl: DEFAULT_OG_IMAGE_URL,
    ogType: "website",
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: `${category.name} - ${SITE_NAME}`,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any",
        url: categoryUrl,
        inLanguage: SITE_LOCALE,
        description,
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${category.name} Tools`,
        url: categoryUrl,
        inLanguage: SITE_LOCALE,
        description,
        isPartOf: {
          "@type": "WebSite",
          name: SITE_NAME,
          url: SITE_URL,
        },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: categoryTools.length,
          itemListElement,
        },
      },
      buildBreadcrumbSchema([
        { name: SITE_NAME, path: "/" },
        { name: category.name, path: category.path },
      ]),
    ],
  };
}

export function buildToolSeo(tool: Tool, category?: Category): SeoMetadata {
  const categoryName = category?.name ?? "Utilities";

  const description = trimMetaDescription(
    `Use ${tool.name} online for free with ${SITE_NAME}. ${tool.description}. ` +
      "Your files stay on-device with fast, client-side processing.",
  );

  return {
    title: `${tool.name} - Free Online Tool | ${SITE_NAME}`,
    description,
    keywords: dedupeKeywords([
      ...BASE_KEYWORDS,
      ...getToolKeywordCluster(tool, categoryName),
      categoryName,
      `${categoryName} tools`,
      tool.id.replace(/-/g, " "),
    ]),
    path: tool.path,
    imageUrl: DEFAULT_OG_IMAGE_URL,
    ogType: "website",
    structuredData: [
      buildBreadcrumbSchema([
        { name: SITE_NAME, path: "/" },
        ...(category ? [{ name: category.name, path: category.path }] : []),
        { name: tool.name, path: tool.path },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `Does ${tool.name} upload my file?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. File processing runs locally in your browser tab, and outputs are generated on your device.",
            },
          },
          {
            "@type": "Question",
            name: `Is ${tool.name} free to use?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${SITE_NAME} tools are free and optimized for private, browser-based workflows.`,
            },
          },
          {
            "@type": "Question",
            name: `Can I use ${tool.name} on mobile?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Most workflows work on mobile browsers, though large files process faster on desktop hardware.",
            },
          },
        ],
      },
    ],
  };
}

interface BlogSeoPostInput {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  publishedAt: string;
  updatedAt?: string;
  author: string;
}

export function buildBlogIndexSeo(publishedPostCount: number): SeoMetadata {
  const description = trimMetaDescription(
    `Read the ${SITE_NAME} blog for practical guides on file productivity, client-side privacy, and growth playbooks for modern utility sites. ` +
      `${publishedPostCount} in-depth article${publishedPostCount === 1 ? "" : "s"} available.`,
  );

  return {
    title: `Blog - ${SITE_NAME}`,
    description,
    keywords: dedupeKeywords([
      ...BASE_KEYWORDS,
      "tool website SEO",
      "client-side privacy guides",
      "web performance optimization",
      "utility website growth",
    ]),
    path: "/blog",
    imageUrl: DEFAULT_OG_IMAGE_URL,
    ogType: "website",
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "Blog",
        name: `${SITE_NAME} Blog`,
        url: toAbsoluteUrl("/blog"),
        inLanguage: SITE_LOCALE,
        description,
      },
      buildBreadcrumbSchema([
        { name: SITE_NAME, path: "/" },
        { name: "Blog", path: "/blog" },
      ]),
    ],
  };
}

export function buildBlogPostSeo(post: BlogSeoPostInput): SeoMetadata {
  const path = `/blog/${post.slug}`;
  const canonicalUrl = toAbsoluteUrl(path);
  const dateModified = post.updatedAt || post.publishedAt;

  return {
    title: `${post.title} | ${SITE_NAME} Blog`,
    description: trimMetaDescription(post.description),
    keywords: dedupeKeywords([...BASE_KEYWORDS, "blog", ...post.tags]),
    path,
    imageUrl: DEFAULT_OG_IMAGE_URL,
    ogType: "article",
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.description,
        datePublished: post.publishedAt,
        dateModified,
        mainEntityOfPage: canonicalUrl,
        inLanguage: SITE_LOCALE,
        author: {
          "@type": "Person",
          name: post.author,
        },
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          url: SITE_URL,
        },
        keywords: post.tags.join(", "),
      },
      buildBreadcrumbSchema([
        { name: SITE_NAME, path: "/" },
        { name: "Blog", path: "/blog" },
        { name: post.title, path },
      ]),
    ],
  };
}

export function buildNotFoundSeo(path: string): SeoMetadata {
  const normalizedPath = normalizePath(path);

  return {
    title: `404 - Page Not Found | ${SITE_NAME}`,
    description: trimMetaDescription(
      "The page you requested could not be found. Explore ObsidianKit's free client-side tools instead.",
    ),
    keywords: dedupeKeywords([...BASE_KEYWORDS, "404", "page not found"]),
    path: normalizedPath,
    imageUrl: DEFAULT_OG_IMAGE_URL,
    ogType: "website",
    noindex: true,
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "404 Not Found",
        url: toAbsoluteUrl(normalizedPath),
        inLanguage: SITE_LOCALE,
        dateModified: toIsoDate(new Date()),
      },
    ],
  };
}
