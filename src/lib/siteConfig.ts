const FALLBACK_SITE_URL = "https://obsidiankit.me";

type RuntimeEnv = Record<string, string | undefined>;

function readRuntimeEnv(): RuntimeEnv {
  const importMetaEnv = (import.meta as ImportMeta & { env?: RuntimeEnv }).env;
  if (importMetaEnv) {
    return importMetaEnv;
  }

  const processRef = (globalThis as { process?: { env?: RuntimeEnv } }).process;
  return processRef?.env ?? {};
}

const runtimeEnv = readRuntimeEnv();

function normalizeSiteUrl(value: string | undefined): string {
  if (!value) return FALLBACK_SITE_URL;

  const trimmed = value.trim();
  if (!trimmed) return FALLBACK_SITE_URL;

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export const SITE_NAME = "ObsidianKit";
export const SITE_TAGLINE = "Fast, private, browser-based tools that run entirely on your device.";
export const SITE_LOCALE = "en";
export const SITE_URL = normalizeSiteUrl(runtimeEnv.VITE_SITE_URL ?? runtimeEnv.SITE_URL);

export const DEFAULT_OG_IMAGE_PATH = "/og-image.svg";
export const DEFAULT_OG_IMAGE_URL = `${SITE_URL}${DEFAULT_OG_IMAGE_PATH}`;

export const TWITTER_HANDLE = runtimeEnv.VITE_TWITTER_HANDLE?.trim() ?? "";
export const GOOGLE_SITE_VERIFICATION = runtimeEnv.VITE_GOOGLE_SITE_VERIFICATION?.trim() ?? "";

export const ADSENSE_CLIENT = runtimeEnv.VITE_ADSENSE_CLIENT?.trim() ?? "";
export const ADSENSE_ENABLED = ADSENSE_CLIENT.startsWith("ca-pub-");
export const ADSENSE_SLOT_INLINE = runtimeEnv.VITE_ADSENSE_SLOT_INLINE?.trim() ?? "";

export const GA4_MEASUREMENT_ID = runtimeEnv.VITE_GA4_MEASUREMENT_ID?.trim() ?? "";

export const SUPPORT_LINKS = {
  kofi: runtimeEnv.VITE_KOFI_URL?.trim() || "https://ko-fi.com/obsidiankit",
  githubSponsors:
    runtimeEnv.VITE_GITHUB_SPONSORS_URL?.trim() || "https://github.com/sponsors",
};
