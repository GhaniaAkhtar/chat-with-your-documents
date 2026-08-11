import { FileText, Plus } from "lucide-react";

export default function DocumentSidebar({ files, chunkCount, onNewSession }) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-blueprint-border bg-blueprint-panel">
      <div className="border-b border-blueprint-border px-5 py-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber">
          Sheet Index
        </p>
        <h2 className="mt-1 font-display text-lg font-semibold text-blueprint-line">
          Documents
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {files.map((name, i) => (
          <div
            key={name}
            className="mb-1.5 flex items-start gap-2.5 rounded-sm px-2.5 py-2 hover:bg-white/5"
          >
            <span className="mt-0.5 font-mono text-[10px] text-blueprint-muted">
              {String(i + 1).padStart(2, "0")}
            </span>
            <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" />
            <span className="break-all font-mono text-xs leading-snug text-blueprint-line">
              {name}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-blueprint-border px-5 py-4">
        <p className="mb-3 font-mono text-[10px] text-blueprint-muted">
          {chunkCount} indexed passages
        </p>
        <button
          onClick={onNewSession}
          className="flex w-full items-center justify-center gap-1.5 rounded-sm border border-blueprint-border py-2 font-mono text-xs text-blueprint-muted transition-colors hover:border-amber hover:text-amber"
        >
          <Plus className="h-3.5 w-3.5" />
          New session
        </button>
      </div>
    </aside>
  );
}
