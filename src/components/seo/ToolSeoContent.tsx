interface ToolSeoContentProps {
  toolName: string;
  categoryName: string;
  toolDescription: string;
}

export function ToolSeoContent({
  toolName,
  categoryName,
  toolDescription,
}: ToolSeoContentProps) {
  const slug = toolName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <section
      aria-label={`${toolName} guide and SEO content`}
      className="mt-6 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-4 sm:p-5"
    >
      <section aria-labelledby={`${slug}-overview`}>
        <h2
          id={`${slug}-overview`}
          className="text-base font-semibold text-[var(--color-text-primary)] sm:text-lg"
        >
          About {toolName}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {toolDescription}. This {categoryName.toLowerCase()} workflow is engineered for
          privacy-focused users who need fast output without sending files to a server.
          You can open files, adjust options, and export results directly inside your
          browser session. Local processing reduces round-trip delays and gives you better
          control over sensitive data, especially for business documents, internal
          reports, and personal files that should never be uploaded to a third-party API.
        </p>
      </section>

      <section aria-labelledby={`${slug}-guide`} className="mt-4 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-4 py-4">
        <h3 id={`${slug}-guide`} className="text-sm font-semibold text-[var(--color-text-primary)]">
          Local-Processing Guide
        </h3>

        <div className="mt-3 space-y-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          <p>
            {toolName} is designed to run deterministically in modern browsers. The input
            file is decoded in memory, transformed using client-side libraries, and then
            re-exported as a new file you can download instantly. Because the entire job
            executes on your device, performance is often faster than cloud tools for
            small and medium files, and your raw data stays under your direct control.
          </p>
          <p>
            For best results, start with a clear input file name, verify output settings,
            and compare final size or quality before replacing your original asset. If you
            process confidential content, close other tabs and complete your workflow in a
            trusted browser profile. This approach gives you the speed of a web app with
            privacy characteristics closer to offline desktop utilities, while preserving a
            clean minimalist interface that keeps the core action front and center.
          </p>
        </div>
      </section>

      <section aria-labelledby={`${slug}-faq`} className="mt-5">
        <h2
          id={`${slug}-faq`}
          className="text-base font-semibold text-[var(--color-text-primary)] sm:text-lg"
        >
          Frequently Asked Questions
        </h2>

        <section className="mt-3">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Does this tool upload my file?
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            No. File processing runs locally in your browser tab, and outputs are generated
            on your device.
          </p>
        </section>

        <section className="mt-3">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Is {toolName} free to use?
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Yes. ObsidianKit tools are free and optimized for private, browser-based
            workflows.
          </p>
        </section>

        <section className="mt-3">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Can I use it on mobile?
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Yes. Most workflows work on mobile browsers, though large files process faster
            on desktop hardware.
          </p>
        </section>
      </section>
    </section>
  );
}
