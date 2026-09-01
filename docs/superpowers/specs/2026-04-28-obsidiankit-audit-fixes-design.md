# ObsidianKit Audit Fixes Design (2026-04-28)

## Summary
Address the website audit findings with repo-only changes. Add a privacy policy page, tighten blog title output, fix BlogPosting JSON-LD fields, and add internal links from blog posts. Keep the work safe for a static GitHub Pages deployment and avoid new infrastructure.

## Goals
- Add a privacy policy page and footer link to clear legal warnings.
- Reduce title-length warnings on blog pages without rewriting post titles.
- Fix BlogPosting JSON-LD validity (missing image and publisher logo).
- Add internal links to blog posts to improve link structure.

## Non-Goals
- No About or Contact pages.
- No ads mention in privacy policy copy.
- No hosting or DNS changes to enforce response headers.

## Constraints and Assumptions
- SPA routing via React Router; SEO metadata via `src/lib/seo.ts` and `react-helmet-async`.
- GitHub Pages hosting; no support for response headers like HSTS/CSP/X-Frame.
- User requires privacy policy to state files stay on-device and omit contact info.

## Design

### 1) Privacy Policy Page
- Add a new route at `/privacy-policy` with a `PrivacyPolicyPage` component.
- Copy requirements:
  - State that files are processed on-device in the browser.
  - Avoid mentioning ads.
  - Keep language minimal; no contact email.
- Add a footer link to `/privacy-policy`.
- Add a new SEO helper: `buildPrivacyPolicySeo()` with a clear title and description.
- Include the new route in the route manifest and sitemap generation pipeline.

### 2) Blog Title Length Adjustment
- Keep post titles in `src/data/blogPosts.ts` as-is.
- Shorten the blog post title template in `buildBlogPostSeo`:
  - Use a suffix only if the total length stays within ~60 characters.
  - Otherwise, return the raw post title.
- Expand the blog index title from `Blog - ObsidianKit` to a fuller, descriptive title (30-60 chars).

### 3) Blog JSON-LD Validity
- Add `image` to BlogPosting JSON-LD using `DEFAULT_OG_IMAGE_URL`.
- Add `publisher.logo` using an `ImageObject` with `DEFAULT_OG_IMAGE_URL`.
- Keep author as a person (`post.author`).

### 4) Internal Links in Blog Posts
- Add `relatedToolIds?: string[]` to blog post data.
- Render a small "Related tools" block on blog posts linking to 2-3 high-intent tools.
- If a post has no related tools, render a single link to `/tools`.

### 5) Security Header Reality Check
- GitHub Pages cannot set HSTS/CSP/X-Frame headers.
- No infra change in this repo; warn in final report that these remain for host-level work.

## Data Flow
- Blog post data -> `buildBlogPostSeo` -> Helmet -> HTML meta/JSON-LD.
- Privacy policy route -> `buildPrivacyPolicySeo` -> Helmet -> HTML meta/JSON-LD.
- Route manifest -> sitemap/robots generation.

## Error Handling and Edge Cases
- `relatedToolIds` should skip invalid tool IDs.
- If `relatedToolIds` is empty, show a single fallback link to `/tools`.
- Title suffix logic must avoid empty titles and preserve non-empty base titles.

## Testing and Verification
- Run `npm run test` and `npm run build`.
- Regenerate SEO assets as part of the build pipeline.
- Re-audit using squirrel (surface + full) and compare scores.

## Risks
- Title changes may slightly shift SERP branding; mitigate by keeping the brand in shorter cases.
- Privacy policy copy must not over-claim; keep it minimal and factual.

## Evidence and Impacted Areas
- Routes and layout: `src/App.tsx`, `src/components/layout/Footer.tsx`
- SEO logic: `src/lib/seo.ts`, `src/components/seo/SEO.tsx`
- Blog data: `src/data/blogPosts.ts`, `src/pages/BlogPostPage.tsx`
- Build outputs: `scripts/route-manifest.ts`, `public/sitemap.xml`, `public/robots.txt`
