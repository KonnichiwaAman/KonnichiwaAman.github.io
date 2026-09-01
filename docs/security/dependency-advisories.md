# Dependency advisory triage

Last reviewed: 2026-08-02

This register documents unresolved dependency advisories, their applicability to ObsidianKit, and the conditions that require re-evaluation. It is not a substitute for updating dependencies.

## React Router RSC-mode advisory

- Packages: `react-router` and `react-router-dom` 7.18.2
- Advisory surfaced by `npm audit`: `GHSA-qwww-vcr4-c8h2`
- Reported impact: CSRF affecting React Router Server Components action handling
- Current applicability: not reachable in the deployed ObsidianKit architecture

ObsidianKit is a static Vite single-page application. It uses `BrowserRouter`, `Routes`, `Route`, `Link`, and client-side navigation hooks. It does not run React Router framework mode, React Server Components, server actions, route action handlers, or a Node application server. Static SEO pages are generated at build time and served as files.

Controls:

- Keep `react-router-dom` pinned to the latest reviewed release.
- Dependabot checks for a patched upstream release weekly.
- Do not introduce RSC, framework mode, server actions, or server route handlers while this advisory is unresolved.
- Re-run `npm audit` and review upstream advisories on every release.

Re-evaluate immediately if the routing architecture gains server execution or if an advisory identifies an affected client-only code path.

## Removed dependency

`xlsx` 0.18.5 was removed on 2026-08-02. It was unused by application source and had unresolved prototype-pollution and regular-expression denial-of-service advisories. Reintroducing spreadsheet parsing requires a maintained library and focused hostile-input tests.
