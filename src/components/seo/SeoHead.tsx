import type { SeoMetadata } from "@/lib/seo";
import { SEO } from "@/components/seo/SEO";

export function SeoHead({ metadata }: { metadata: SeoMetadata }) {
  return (
    <SEO
      title={metadata.title}
      description={metadata.description}
      keywords={metadata.keywords}
      path={metadata.path}
      imageUrl={metadata.imageUrl}
      ogType={metadata.ogType}
      noindex={metadata.noindex}
      structuredData={metadata.structuredData}
    />
  );
}
