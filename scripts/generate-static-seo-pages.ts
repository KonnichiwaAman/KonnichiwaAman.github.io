import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { publishedBlogPosts } from "../src/data/blogPosts";
import { categories } from "../src/data/categories";
import { tools } from "../src/data/tools";
import {
  buildBlogIndexSeo,
  buildBlogPostSeo,
  buildCategorySeo,
  buildHomeSeo,
  buildNotFoundSeo,
  buildToolSeo,
  buildToolsIndexSeo,
  type SeoMetadata,
  toAbsoluteUrl,
} from "../src/lib/seo";
import {
  DEFAULT_OG_IMAGE_URL,
  SITE_LOCALE,
  SITE_NAME,
  TWITTER_HANDLE,
} from "../src/lib/siteConfig";
import { buildPublicRoutes } from "./route-manifest";

function dedupeKeywords(keywords: string[] = []): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const keyword of keywords) {
    const normalized = keyword.trim();
    if (!normalized) continue;

    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeImageUrl(imageUrl?: string): string {
  if (!imageUrl) return DEFAULT_OG_IMAGE_URL;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return toAbsoluteUrl(imageUrl);
}

function stripManagedSeoTags(head: string): string {
  return head
    .replace(/<title>[\s\S]*?<\/title>\s*/gi, "")
    .replace(/<meta\s+(?:name|property)=["'](?:title|description|keywords|robots|author|og:[^"']+|twitter:[^"']+)["'][^>]*>\s*/gi, "")
    .replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, "")
    .replace(/<link\s+rel=["']alternate["'][^>]*>\s*/gi, "")
    .replace(/<link\s+rel=["']sitemap["'][^>]*>\s*/gi, "")
    .replace(/<script\s+type=["']application\/ld\+json["'][\s\S]*?<\/script>\s*/gi, "");
}

function buildSeoTags(metadata: SeoMetadata): string {
  const canonicalUrl = toAbsoluteUrl(metadata.path);
  const imageUrl = normalizeImageUrl(metadata.imageUrl);
  const keywords = dedupeKeywords(metadata.keywords);
  const robots = metadata.noindex
    ? "noindex,nofollow,max-image-preview:none,max-snippet:-1,max-video-preview:-1"
    : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
  const normalizedTwitterHandle = TWITTER_HANDLE
    ? (TWITTER_HANDLE.startsWith("@") ? TWITTER_HANDLE : `@${TWITTER_HANDLE}`)
    : "";

  const tags = [
    `<title>${escapeHtml(metadata.title)}</title>`,
    `<meta name="description" content="${escapeHtml(metadata.description)}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<meta name="author" content="${SITE_NAME}" />`,
  ];

  if (keywords.length > 0) {
    tags.push(`<meta name="keywords" content="${escapeHtml(keywords.join(", "))}" />`);
  }

  tags.push(
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    `<link rel="alternate" hreflang="${SITE_LOCALE}" href="${escapeHtml(canonicalUrl)}" />`,
    `<link rel="alternate" hreflang="x-default" href="${escapeHtml(canonicalUrl)}" />`,
    `<link rel="sitemap" type="application/xml" href="/sitemap.xml" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="${SITE_LOCALE}" />`,
    `<meta property="og:type" content="${escapeHtml(metadata.ogType ?? "website")}" />`,
    `<meta property="og:title" content="${escapeHtml(metadata.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(metadata.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:image" content="${escapeHtml(imageUrl)}" />`,
    `<meta property="og:image:alt" content="${SITE_NAME} preview" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(metadata.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(metadata.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(imageUrl)}" />`,
  );

  if (normalizedTwitterHandle) {
    tags.push(
      `<meta name="twitter:site" content="${escapeHtml(normalizedTwitterHandle)}" />`,
      `<meta name="twitter:creator" content="${escapeHtml(normalizedTwitterHandle)}" />`,
    );
  }

  if (metadata.structuredData && metadata.structuredData.length > 0) {
    tags.push(
      `<script type="application/ld+json">`,
      JSON.stringify(metadata.structuredData),
      `</script>`,
    );
  }

  return tags.map((tag) => `    ${tag}`).join("\n");
}

function injectSeo(template: string, metadata: SeoMetadata): string {
  const headMatch = template.match(/<head>([\s\S]*?)<\/head>/i);
  if (!headMatch) return template;

  const cleanedHead = stripManagedSeoTags(headMatch[1]).trim();
  const seoTags = buildSeoTags(metadata);
  const nextHead = `<head>\n    ${cleanedHead.replace(/\n/g, "\n    ")}\n${seoTags}\n  </head>`;

  return template.replace(/<head>[\s\S]*?<\/head>/i, nextHead);
}

function routeToOutputPath(distDir: string, route: string): string {
  if (route === "/") return path.join(distDir, "index.html");
  const parts = route.split("/").filter(Boolean);
  return path.join(distDir, ...parts, "index.html");
}

function getMetadata(route: string): SeoMetadata {
  if (route === "/") {
    return buildHomeSeo(tools.length, categories.length);
  }

  if (route === "/tools") {
    return buildToolsIndexSeo(tools, categories);
  }

  if (route === "/blog") {
    return buildBlogIndexSeo(publishedBlogPosts.length);
  }

  if (route === "/404") {
    return buildNotFoundSeo(route);
  }

  const matchingCategory = categories.find((category) => category.path === route);
  if (matchingCategory) {
    const categoryTools = tools.filter((tool) => tool.categoryId === matchingCategory.id);
    return buildCategorySeo(matchingCategory, categoryTools);
  }

  const matchingTool = tools.find((tool) => tool.path === route);
  if (matchingTool) {
    const matchingCategoryById = categories.find((category) => category.id === matchingTool.categoryId);
    return buildToolSeo(matchingTool, matchingCategoryById);
  }

  const blogSlugMatch = route.match(/^\/blog\/(.+)$/);
  if (blogSlugMatch) {
    const matchingPost = publishedBlogPosts.find((post) => post.slug === blogSlugMatch[1]);
    if (matchingPost) {
      return buildBlogPostSeo(matchingPost);
    }
  }

  return buildNotFoundSeo(route);
}

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const distDir = path.join(projectRoot, "dist");
const templatePath = path.join(distDir, "index.html");
const routesPath = path.join(projectRoot, "public", "prerender-routes.json");

if (!existsSync(templatePath)) {
  throw new Error("dist/index.html was not found. Run vite build before static SEO generation.");
}

const template = readFileSync(templatePath, "utf8");
const routes = existsSync(routesPath)
  ? (JSON.parse(readFileSync(routesPath, "utf8")) as string[])
  : buildPublicRoutes();

const normalizedRoutes = Array.from(new Set(routes.concat("/404"))).sort((a, b) => a.localeCompare(b));

let written = 0;
for (const route of normalizedRoutes) {
  const outputPath = routeToOutputPath(distDir, route);
  const metadata = getMetadata(route);
  const html = injectSeo(template, metadata);

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, html, "utf8");
  written += 1;
}

console.log(`Generated static SEO HTML for ${written} routes at ${toAbsoluteUrl("/")}`);
