import { useState } from "react";

/**
 * Renders a small numbered marker (like [1]) that shows a leader-line
 * callout with the source filename + page on hover/click. This is the
 * signature visual element of the app — modeled on margin annotations on
 * architectural drawings.
 */
export default function CitationMarker({ number, source }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!source) {
    // Citation number the model mentioned but we have no matching source for
    // (shouldn't normally happen, but fail gracefully instead of crashing).
    return <span className="text-amber">[{number}]</span>;
  }

  return (
    <span className="relative inline-block">
      <button
        onClick={() => setIsOpen((v) => !v)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="mx-0.5 inline-flex h-4 w-4 -translate-y-0.5 items-center justify-center rounded-full border border-amber bg-amber/15 font-mono text-[10px] font-medium text-amber align-middle hover:bg-amber/25"
      >
        {number}
      </button>

      {isOpen && (
        <span
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className="absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2"
        >
          {/* leader line */}
          <span className="mx-auto block h-2 w-px bg-amber/60" />
          <span className="block rounded-sm border border-amber/40 bg-blueprint-panel px-3 py-2 shadow-lg">
            <span className="block font-mono text-[10px] uppercase tracking-wider text-amber">
              Source {number}
            </span>
            <span className="mt-1 block truncate font-mono text-xs text-blueprint-line">
              {source.filename}
            </span>
            <span className="mt-0.5 block font-mono text-[10px] text-blueprint-muted">
              page {source.page}
            </span>
          </span>
        </span>
      )}
    </span>
  );
}
