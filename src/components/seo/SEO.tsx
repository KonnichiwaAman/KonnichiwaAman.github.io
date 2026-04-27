import { Helmet } from "react-helmet-async";
import {
  DEFAULT_OG_IMAGE_URL,
  GOOGLE_SITE_VERIFICATION,
  SITE_LOCALE,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  TWITTER_HANDLE,
} from "@/lib/siteConfig";
import { toAbsoluteUrl } from "@/lib/seo";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  path: string;
  imageUrl?: string;
  ogType?: "website" | "article";
  noindex?: boolean;
  structuredData?: Record<string, unknown>[];
}

const INDEX_ROBOTS = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
const NOINDEX_ROBOTS = "noindex,nofollow,max-image-preview:none,max-snippet:-1,max-video-preview:-1";

function normalizeImageUrl(imageUrl?: string): string {
  if (!imageUrl) return DEFAULT_OG_IMAGE_URL;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return toAbsoluteUrl(imageUrl);
}

function normalizeKeywords(keywords: string[] | undefined): string[] {
  if (!keywords) return [];

  const deduped = new Set<string>();
  for (const keyword of keywords) {
    const normalized = keyword.trim();
    if (!normalized) continue;
    deduped.add(normalized);
  }

  return Array.from(deduped);
}

export function SEO({
  title,
  description,
  keywords,
  path,
  imageUrl,
  ogType,
  noindex,
  structuredData,
}: SEOProps) {
  const canonicalUrl = toAbsoluteUrl(path);
  const ogImage = normalizeImageUrl(imageUrl);
  const robotsContent = noindex ? NOINDEX_ROBOTS : INDEX_ROBOTS;
  const keywordList = normalizeKeywords(keywords);
  const normalizedTwitterHandle = TWITTER_HANDLE
    ? (TWITTER_HANDLE.startsWith("@") ? TWITTER_HANDLE : `@${TWITTER_HANDLE}`)
    : "";

  return (
    <Helmet>
      <html lang={SITE_LOCALE} />

      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robotsContent} />
      <meta name="author" content={SITE_NAME} />
      {GOOGLE_SITE_VERIFICATION ? (
        <meta name="google-site-verification" content={GOOGLE_SITE_VERIFICATION} />
      ) : null}

      {keywordList.length > 0 ? (
        <meta name="keywords" content={keywordList.join(", ")} />
      ) : null}

      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang={SITE_LOCALE} href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={SITE_LOCALE} />
      <meta property="og:type" content={ogType ?? "website"} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={`${SITE_NAME} preview`} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {normalizedTwitterHandle ? (
        <meta name="twitter:site" content={normalizedTwitterHandle} />
      ) : null}
      {normalizedTwitterHandle ? (
        <meta name="twitter:creator" content={normalizedTwitterHandle} />
      ) : null}

      {structuredData && structuredData.length > 0 ? (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      ) : null}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: SITE_NAME,
              url: SITE_URL,
              description: SITE_TAGLINE,
            },
            {
              "@type": "WebSite",
              name: SITE_NAME,
              url: SITE_URL,
              inLanguage: SITE_LOCALE,
              description: SITE_TAGLINE,
            },
          ],
        })}
      </script>
    </Helmet>
  );
}
