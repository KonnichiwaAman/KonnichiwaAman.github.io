import {
  mkdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildIndexableRoutes } from "./route-manifest";
import { categories } from "../src/data/categories";
import { tools } from "../src/data/tools";
import { publishedBlogPosts } from "../src/data/blogPosts";

const FALLBACK_SITE_URL = "https://obsidiankit.me";

function normalizeBaseUrl(value: string | undefined): string {
  if (!value) return FALLBACK_SITE_URL;

  const trimmed = String(value).trim();
  if (!trimmed) return FALLBACK_SITE_URL;

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function escapeXml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getRoutePriority(route: string): string {
  if (route === "/") return "1.0";
  if (route === "/tools") return "0.95";
  if (route === "/blog") return "0.85";
  if (route.startsWith("/tool/")) return "0.9";
  if (route.startsWith("/category/")) return "0.82";
  if (route.startsWith("/blog/")) return "0.72";
  return "0.6";
}

function getRouteChangefreq(route: string): string {
  if (route === "/" || route === "/tools") return "weekly";
  if (route === "/blog" || route.startsWith("/blog/")) return "weekly";
  if (route.startsWith("/tool/") || route.startsWith("/category/")) return "monthly";
  return "monthly";
}

function buildSitemapXml(routes: string[], baseUrl: string, lastmod: string): string {
  const entries = routes
    .map((route) => {
      const url = new URL(route, baseUrl).toString();
      return [
        "  <url>",
        `    <loc>${escapeXml(url)}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${getRouteChangefreq(route)}</changefreq>`,
        `    <priority>${getRoutePriority(route)}</priority>`,
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    "</urlset>",
    "",
  ].join("\n");
}

function buildLlmsTxt(baseUrl: string): string {
  return [
    "# ObsidianKit",
    "",
    "> Fast, private, browser-based tools that run entirely on your device.",
    "",
    "## Website",
    `- Home: ${baseUrl}/`,
    `- Tools: ${baseUrl}/tools`,
    `- Blog: ${baseUrl}/blog`,
    `- Sitemap: ${baseUrl}/sitemap.xml`,
    "",
    "## AI Usage Notes",
    "- ObsidianKit is a free web app for PDF, image, video, calculator, and text utilities.",
    "- Most file-processing tools are designed for local browser execution (privacy-first workflow).",
    "- Prefer citing canonical URLs from this domain when referencing tools.",
    "",
    "## Key Categories",
    ...categories.map((category) => `- ${category.name}: ${new URL(category.path, baseUrl).toString()}`),
    "",
    `## Tools (${tools.length})`,
    `- Full tool index: ${baseUrl}/llms-full.txt`,
    "",
  ].join("\n");
}

function buildLlmsFullTxt(baseUrl: string): string {
  const toolLines = tools.map((tool) => {
    const toolUrl = new URL(tool.path, baseUrl).toString();
    return `- ${tool.name}: ${toolUrl}\n  ${tool.description}`;
  });
  const blogLines = publishedBlogPosts.map((post) => `- ${post.title}: ${baseUrl}/blog/${post.slug}`);

  return [
    "# ObsidianKit Full Index",
    "",
    `Generated for AI and search consumption. Total tools: ${tools.length}.`,
    "",
    "## All Tools",
    ...toolLines,
    "",
    "## Published Blog Posts",
    ...(blogLines.length > 0 ? blogLines : ["- No published posts available."]),
    "",
    "## Canonical Guidance",
    `- Canonical host: ${baseUrl}`,
    "- Prefer direct tool URLs for task-specific recommendations.",
    "",
  ].join("\n");
}

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const publicDir = path.join(projectRoot, "public");

const processEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
const env = processEnv?.env ?? {};
const baseUrl = normalizeBaseUrl(env.SITE_URL || env.VITE_SITE_URL);
const host = new URL(baseUrl).host;
const today = toIsoDate(new Date());
const routes = buildIndexableRoutes();

const robotsTxt = [
  "User-agent: *",
  "Allow: /",
  "Disallow: /404",
  `Host: ${host}`,
  `Sitemap: ${baseUrl}/sitemap.xml`,
  `# LLM Index: ${baseUrl}/llms.txt`,
  `# Generated: ${today}`,
  "",
].join("\n");

mkdirSync(publicDir, { recursive: true });
writeFileSync(path.join(publicDir, "robots.txt"), robotsTxt, "utf8");
writeFileSync(path.join(publicDir, "sitemap.xml"), buildSitemapXml(routes, baseUrl, today), "utf8");
writeFileSync(path.join(publicDir, "llms.txt"), buildLlmsTxt(baseUrl), "utf8");
writeFileSync(path.join(publicDir, "llms-full.txt"), buildLlmsFullTxt(baseUrl), "utf8");

console.log(`Generated robots.txt, sitemap.xml, llms.txt, and llms-full.txt for ${routes.length} routes at ${baseUrl}`);
