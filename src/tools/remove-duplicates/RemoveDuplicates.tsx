import { useMemo, useState, useDeferredValue } from "react";
import { Copy, Check, Download } from "lucide-react";

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function RemoveDuplicates() {
  const [input, setInput] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [keepEmpty, setKeepEmpty] = useState(false);
  const [sortResult, setSortResult] = useState(false);
  const [copied, setCopied] = useState(false);

  const deferredInput = useDeferredValue(input);

  const processed = useMemo(() => {
    const lines = deferredInput.split(/\r?\n/);
    const seen = new Set<string>();

    const uniqueLines: string[] = [];
    let duplicateCount = 0;
    let skippedEmptyCount = 0;

    for (const line of lines) {
      const normalizedLine = trimWhitespace ? line.trim() : line;
      const compareLine = caseSensitive ? normalizedLine : normalizedLine.toLowerCase();

      if (!keepEmpty && compareLine === "") {
        skippedEmptyCount += 1;
        continue;
      }

      if (seen.has(compareLine)) {
        duplicateCount += 1;
        continue;
      }

      seen.add(compareLine);
      uniqueLines.push(normalizedLine);
    }

    if (sortResult) {
      uniqueLines.sort((a, b) =>
        a.localeCompare(b, undefined, {
          sensitivity: caseSensitive ? "variant" : "accent",
        }),
      );
    }

    return {
      output: uniqueLines.join("\n"),
      inputLines: lines.length,
      outputLines: uniqueLines.length,
      duplicateCount,
      skippedEmptyCount,
    };
  }, [deferredInput, caseSensitive, trimWhitespace, keepEmpty, sortResult]);

  async function handleCopy() {
    if (!processed.output) return;
    await navigator.clipboard.writeText(processed.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">Input Lines</label>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste lines here..."
            rows={14}
            className="w-full resize-y rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-input)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-hover)]"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">Unique Output</label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!processed.output}
                className="inline-flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={() => downloadText(processed.output, "unique-lines.txt")}
                disabled={!processed.output}
                className="inline-flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
            </div>
          </div>
          <textarea
            value={processed.output}
            readOnly
            rows={14}
            className="w-full resize-y rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-5">
        <p className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">Processing Options</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="inline-flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <input type="checkbox" checked={caseSensitive} onChange={(event) => setCaseSensitive(event.target.checked)} />
            Case sensitive
          </label>
          <label className="inline-flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <input type="checkbox" checked={trimWhitespace} onChange={(event) => setTrimWhitespace(event.target.checked)} />
            Trim whitespace
          </label>
          <label className="inline-flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <input type="checkbox" checked={keepEmpty} onChange={(event) => setKeepEmpty(event.target.checked)} />
            Keep empty lines
          </label>
          <label className="inline-flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <input type="checkbox" checked={sortResult} onChange={(event) => setSortResult(event.target.checked)} />
            Sort output
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-3">
          <p className="text-xs text-[var(--color-text-muted)]">Input lines</p>
          <p className="mt-1 text-xl font-bold text-[var(--color-text-primary)]">{processed.inputLines}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-3">
          <p className="text-xs text-[var(--color-text-muted)]">Output lines</p>
          <p className="mt-1 text-xl font-bold text-[var(--color-text-primary)]">{processed.outputLines}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-3">
          <p className="text-xs text-[var(--color-text-muted)]">Removed duplicates</p>
          <p className="mt-1 text-xl font-bold text-[var(--color-text-primary)]">{processed.duplicateCount}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-3">
          <p className="text-xs text-[var(--color-text-muted)]">Skipped empty</p>
          <p className="mt-1 text-xl font-bold text-[var(--color-text-primary)]">{processed.skippedEmptyCount}</p>
        </div>
      </div>
    </div>
  );
}
