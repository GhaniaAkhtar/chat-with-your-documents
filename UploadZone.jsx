import { useRef, useState } from "react";
import { UploadCloud, FileText, X, Loader2 } from "lucide-react";

const ACCEPTED_TYPES = [".pdf", ".docx", ".txt"];

export default function UploadZone({ onUpload, isUploading, error }) {
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const inputRef = useRef(null);

  function addFiles(fileList) {
    const files = Array.from(fileList);
    setPendingFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const newOnes = files.filter((f) => !existingNames.has(f.name));
      return [...prev, ...newOnes];
    });
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }

  function removeFile(name) {
    setPendingFiles((prev) => prev.filter((f) => f.name !== name));
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-blueprint-bg bg-blueprint-grid bg-grid px-6">
      <div className="w-full max-w-2xl">
        <div className="mb-10 text-center">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-amber">
            Sheet 01 / Document Intake
          </p>
          <h1 className="font-display text-4xl font-semibold text-blueprint-line">
            Chat with your documents
          </h1>
          <p className="mx-auto mt-3 max-w-md font-body text-sm text-blueprint-muted">
            Upload PDFs, Word docs, or text files. Every answer traces back to
            the exact page it came from.
          </p>
        </div>

        {/* Drafting-frame drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative cursor-pointer rounded-sm border-2 border-dashed p-12 text-center transition-colors ${
            isDragging
              ? "border-amber bg-amber/5"
              : "border-blueprint-border hover:border-blueprint-muted"
          }`}
        >
          {/* corner ticks, drafting-frame detail */}
          <span className="absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-amber" />
          <span className="absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-amber" />
          <span className="absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-amber" />
          <span className="absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-amber" />

          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES.join(",")}
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <UploadCloud className="mx-auto mb-3 h-8 w-8 text-blueprint-muted" />
          <p className="font-body text-sm text-blueprint-line">
            Drop files here, or{" "}
            <span className="text-amber underline underline-offset-2">
              browse
            </span>
          </p>
          <p className="mt-1 font-mono text-xs text-blueprint-muted">
            PDF · DOCX · TXT — up to 20MB each
          </p>
        </div>

        {/* Pending file list */}
        {pendingFiles.length > 0 && (
          <div className="mt-5 space-y-2">
            {pendingFiles.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between rounded-sm border border-blueprint-border bg-blueprint-panel px-4 py-2.5"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <FileText className="h-4 w-4 shrink-0 text-teal" />
                  <span className="truncate font-mono text-xs text-blueprint-line">
                    {file.name}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-blueprint-muted">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.name);
                  }}
                  className="shrink-0 text-blueprint-muted hover:text-blueprint-line"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-sm border border-red-400/30 bg-red-400/10 px-4 py-2 font-mono text-xs text-red-300">
            {error}
          </p>
        )}

        <button
          disabled={pendingFiles.length === 0 || isUploading}
          onClick={() => onUpload(pendingFiles)}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-sm bg-amber px-6 py-3 font-display text-sm font-semibold text-blueprint-panel transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing documents…
            </>
          ) : (
            `Process ${pendingFiles.length || ""} document${
              pendingFiles.length === 1 ? "" : "s"
            }`.replace("  ", " ")
          )}
        </button>
      </div>
    </div>
  );
}
