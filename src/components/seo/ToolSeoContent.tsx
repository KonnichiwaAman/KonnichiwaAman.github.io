import { Link } from "react-router-dom";

interface ToolSeoContentProps {
  toolName: string;
  categoryName: string;
  categoryPath: string;
  toolDescription: string;
}

type CategoryCopy = {
  focus: string;
  useCases: string[];
  tips: string[];
};

function getCategoryCopy(categoryName: string): CategoryCopy {
  const normalizedName = categoryName.toLowerCase();

  if (normalizedName.includes("pdf")) {
    return {
      focus: "contracts, invoices, reports, scanned pages, and share-ready documents",
      useCases: [
        "compress large PDFs before email or upload portals",
        "merge, split, reorder, or protect page-based files",
        "keep sensitive paperwork local instead of sending it to a server",
      ],
      tips: [
        "Start with the cleanest source file you have.",
        "Review the output before replacing the original.",
        "Use the category page when the task shifts to another PDF workflow.",
      ],
    };
  }

  if (normalizedName.includes("image")) {
    return {
      focus: "screenshots, photos, graphics, and export-ready assets",
      useCases: [
        "convert between JPG, PNG, WebP, and HEIC formats",
        "resize or crop assets before publishing them",
        "strip metadata when you need a cleaner shareable file",
      ],
      tips: [
        "Keep an original copy before you export derivatives.",
        "Choose the format that matches the target use case first.",
        "If the file is large, reduce dimensions before compressing further.",
      ],
    };
  }

  if (normalizedName.includes("video") || normalizedName.includes("audio")) {
    return {
      focus: "clips, recordings, and browser-based media exports",
      useCases: [
        "compress video or audio files for faster sharing",
        "trim clips without a full desktop editor",
        "extract audio or convert media into a more usable format",
      ],
      tips: [
        "Close other heavy tabs before processing large media files.",
        "Test one short clip first when you are changing settings.",
        "Use smaller source files for the fastest result on mobile devices.",
      ],
    };
  }

  if (normalizedName.includes("converter")) {
    return {
      focus: "quick measurement changes and everyday reference lookups",
      useCases: [
        "convert units without manual formulas",
        "standardize values before copy-pasting into documents",
        "check multiple unit systems in one place",
      ],
      tips: [
        "Double-check the input unit before comparing results.",
        "Use the converter most closely aligned with the final destination.",
        "Keep the page open if you need to compare several values in sequence.",
      ],
    };
  }

  if (normalizedName.includes("calculator")) {
    return {
      focus: "estimations, planning, and quick scenario checks",
      useCases: [
        "model totals before making a decision",
        "compare different inputs side by side",
        "run quick calculations without leaving the browser",
      ],
      tips: [
        "Enter the values in the same unit system throughout the calculation.",
        "Use the result as a planning signal, not a substitute for the source data.",
        "Check nearby calculator tools if your workflow changes mid-task.",
      ],
    };
  }

  return {
    focus: "text cleanup, encoding, and developer workflows",
    useCases: [
      "format text or JSON before sharing it",
      "clean duplicate content and compare variants",
      "encode, decode, or test regular expressions locally",
    ],
    tips: [
      "Start with a small sample if you are testing a new workflow.",
      "Check the output structure before moving to larger inputs.",
      "Use the category page to find adjacent utility tools.",
    ],
  };
}

export function ToolSeoContent({
  toolName,
  categoryName,
  categoryPath,
  toolDescription,
}: ToolSeoContentProps) {
  const slug = toolName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const categoryCopy = getCategoryCopy(categoryName);

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
          What {toolName} is for
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {toolDescription}. This {categoryName.toLowerCase()} workflow is especially useful for {categoryCopy.focus}. You can open files, adjust options, and export results directly inside your browser session, which keeps sensitive data on-device and removes the extra waiting that comes with upload-based tools.
        </p>
      </section>

      <section aria-labelledby={`${slug}-use-cases`} className="mt-4 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-4 py-4">
        <h3 id={`${slug}-use-cases`} className="text-sm font-semibold text-[var(--color-text-primary)]">
          Common use cases
        </h3>

        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {categoryCopy.useCases.map((useCase) => (
            <li key={useCase} className="flex gap-2">
              <span aria-hidden="true">•</span>
              <span>{useCase}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby={`${slug}-best-practices`} className="mt-4 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-4 py-4">
        <h3 id={`${slug}-best-practices`} className="text-sm font-semibold text-[var(--color-text-primary)]">
          How to get better results
        </h3>

        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {categoryCopy.tips.map((tip) => (
            <li key={tip} className="flex gap-2">
              <span className="font-medium text-[var(--color-text-primary)]">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
        <Link
          to={categoryPath}
          className="mobile-tap-feedback inline-flex items-center gap-2 rounded-full border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-3.5 py-2 text-[var(--color-text-secondary)] transition-colors active:scale-[0.99] md:hover:text-[var(--color-text-primary)]"
        >
          Browse more {categoryName}
        </Link>
        <Link
          to="/tools"
          className="mobile-tap-feedback inline-flex items-center gap-2 rounded-full border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-3.5 py-2 text-[var(--color-text-secondary)] transition-colors active:scale-[0.99] md:hover:text-[var(--color-text-primary)]"
        >
          View all tools
        </Link>
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
            No. File processing runs locally in your browser tab, and outputs are generated on your device.
          </p>
        </section>

        <section className="mt-3">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Is {toolName} free to use?
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Yes. ObsidianKit tools are free and optimized for private, browser-based workflows.
          </p>
        </section>

        <section className="mt-3">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Can I use it on mobile?
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Yes. Most workflows work on mobile browsers, though large files process faster on desktop hardware.
          </p>
        </section>
      </section>
    </section>
  );
}