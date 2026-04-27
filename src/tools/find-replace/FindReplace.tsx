import { useMemo, useState, useDeferredValue } from "react";
import { Copy, Check, WandSparkles } from "lucide-react";

function escapeRegExp(source: string) {
  return source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface ReplaceResult {
  output: string;
  matches: number;
  error: string | null;
}

function runReplace(
  input: string,
  findText: string,
  replaceText: string,
  useRegex: boolean,
  matchCase: boolean,
  wholeWord: boolean,
  replaceAll: boolean,
): ReplaceResult {
  if (!findText) {
    return {
      output: input,
      matches: 0,
      error: null,
    };
  }

  try {
    const pattern = useRegex ? findText : escapeRegExp(findText);
    const wrappedPattern = wholeWord ? `\\b(?:${pattern})\\b` : pattern;
    const flags = `${replaceAll ? "g" : ""}${matchCase ? "" : "i"}`;

    const regex = new RegExp(wrappedPattern, flags);
    const matchRegex = new RegExp(wrappedPattern, `${matchCase ? "" : "i"}g`);

    const allMatches = input.match(matchRegex) ?? [];
    const output = input.replace(regex, replaceText);

    return {
      output,
      matches: replaceAll ? allMatches.length : Math.min(allMatches.length, 1),
      error: null,
    };
  } catch (replaceError) {
    return {
      output: input,
      matches: 0,
      error: replaceError instanceof Error ? replaceError.message : "Invalid regex pattern",
    };
  }
}

export default function FindReplace() {
  const [input, setInput] = useState("");
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [useRegex, setUseRegex] = useState(false);
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [replaceAll, setReplaceAll] = useState(true);
  const [copied, setCopied] = useState(false);

  const deferredInput = useDeferredValue(input);
  const deferredFindText = useDeferredValue(findText);
  const deferredReplaceText = useDeferredValue(replaceText);

  const result = useMemo(
    () =>
      runReplace(
        deferredInput,
        deferredFindText,
        deferredReplaceText,
        useRegex,
        matchCase,
        wholeWord,
        replaceAll,
      ),
    [deferredInput, deferredFindText, deferredReplaceText, useRegex, matchCase, wholeWord, replaceAll],
  );

  async function handleCopy() {
    if (!result.output) return;
    await navigator.clipboard.writeText(result.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-5 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-medium text-[var(--color-text-secondary)]">Find</label>
            <input
              type="text"
              value={findText}
              onChange={(event) => setFindText(event.target.value)}
              placeholder={useRegex ? "Pattern (for example: \\d+)" : "Text to find"}
              className="w-full rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-input)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-border-hover)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-[var(--color-text-secondary)]">Replace with</label>
            <input
              type="text"
              value={replaceText}
              onChange={(event) => setReplaceText(event.target.value)}
              placeholder="Replacement text"
              className="w-full rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-input)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-border-hover)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <label className="inline-flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <input type="checkbox" checked={useRegex} onChange={(event) => setUseRegex(event.target.checked)} />
            Use regex pattern
          </label>
          <label className="inline-flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <input type="checkbox" checked={matchCase} onChange={(event) => setMatchCase(event.target.checked)} />
            Match case
          </label>
          <label className="inline-flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <input type="checkbox" checked={wholeWord} onChange={(event) => setWholeWord(event.target.checked)} />
            Whole words only
          </label>
          <label className="inline-flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <input type="checkbox" checked={replaceAll} onChange={(event) => setReplaceAll(event.target.checked)} />
            Replace all
          </label>
        </div>

        {result.error && <p className="text-xs text-red-500">{result.error}</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">Input</label>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={12}
            placeholder="Paste or type text here..."
            className="w-full resize-y rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-input)] px-4 py-3 text-sm leading-relaxed text-[var(--color-text-primary)] outline-none focus:border-[var(--color-border-hover)]"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">Preview Output</label>
            <button
              onClick={handleCopy}
              disabled={!result.output}
              className="inline-flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <textarea
            value={result.output}
            readOnly
            rows={12}
            className="w-full resize-y rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-4 py-3 text-sm leading-relaxed text-[var(--color-text-primary)] outline-none"
          />
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-4 py-3">
        <p className="inline-flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <WandSparkles className="h-3.5 w-3.5" />
          Matches found: <span className="font-semibold text-[var(--color-text-primary)]">{result.matches}</span>
        </p>
      </div>
    </div>
  );
}
