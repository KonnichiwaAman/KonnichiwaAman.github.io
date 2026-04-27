import { useState, useMemo, useDeferredValue } from "react";
import { Copy, Check } from "lucide-react";

export default function WordCounter() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const deferredText = useDeferredValue(text);

  const stats = useMemo(() => {
    const trimmed = deferredText.trim();
    if (!trimmed) {
      return { words: 0, characters: 0, charactersNoSpaces: 0, sentences: 0, paragraphs: 0, readingTime: "0 sec" };
    }

    const words = trimmed.split(/\s+/).length;
    const characters = deferredText.length;
    const charactersNoSpaces = deferredText.replace(/\s+/g, "").length;
    const sentences = trimmed.split(/[.!?]+/).filter(Boolean).length;
    const paragraphs = trimmed.split(/\n\s*\n/).length;

    const minutes = Math.floor(words / 200);
    const seconds = Math.round((words % 200) / (200 / 60));
    const readingTime =
      minutes > 0 ? `${minutes} min ${seconds} sec` : `${seconds} sec`;

    return { words, characters, charactersNoSpaces, sentences, paragraphs, readingTime };
  }, [deferredText]);

  const statCards = [
    { label: "Words", value: stats.words },
    { label: "Characters", value: stats.characters },
    { label: "No Spaces", value: stats.charactersNoSpaces },
    { label: "Sentences", value: stats.sentences },
    { label: "Paragraphs", value: stats.paragraphs },
  ];

  function handleCopy() {
    const summary = `Words: ${stats.words}\nCharacters: ${stats.characters}\nCharacters (no spaces): ${stats.charactersNoSpaces}\nSentences: ${stats.sentences}\nParagraphs: ${stats.paragraphs}\nReading Time: ${stats.readingTime}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-4 text-center"
          >
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              {s.value.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Reading time */}
      <div className="flex items-center justify-between rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-5 py-3">
        <span className="text-sm text-[var(--color-text-secondary)]">
          Estimated Reading Time
        </span>
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
          {stats.readingTime}
        </span>
      </div>

      {/* Textarea */}
      <textarea
        id="word-counter-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste or type your text here..."
        rows={12}
        className="w-full resize-y rounded-xl border border-[var(--color-border-primary)]
                   bg-[var(--color-bg-input)] px-5 py-4 text-sm leading-relaxed
                   text-[var(--color-text-primary)] outline-none
                   placeholder:text-[var(--color-text-muted)]
                   focus:border-[var(--color-border-hover)]
                   transition-colors duration-200"
      />

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleCopy}
          disabled={!text.trim()}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border-primary)]
                     bg-[var(--color-bg-card)] px-4 py-2.5 text-xs font-medium
                     text-[var(--color-text-secondary)] transition-all duration-200
                     hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)]
                     disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied!" : "Copy Stats"}
        </button>
        <button
          onClick={() => setText("")}
          disabled={!text}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border-primary)]
                     bg-[var(--color-bg-card)] px-4 py-2.5 text-xs font-medium
                     text-[var(--color-text-secondary)] transition-all duration-200
                     hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)]
                     disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
